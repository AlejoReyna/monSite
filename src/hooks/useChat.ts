'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  pending?: boolean;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  waitMs: number;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  isRateLimit: boolean;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  modelUsed?: string;
}

type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; message?: string; model?: string; usage?: UseChatReturn['usage'] }
  | { type: 'error'; error: string; isRateLimit?: boolean; status?: number };

async function readSseStream(
  response: Response,
  onEvent: (event: StreamEvent) => void,
) {
  if (!response.body) throw new Error('No stream body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';
    for (const chunk of chunks) {
      const line = chunk
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.startsWith('data:'));
      if (!line) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        onEvent(JSON.parse(payload) as StreamEvent);
      } catch {
        /* ignore malformed */
      }
    }
  }
}

export function useChat(userName?: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [waitMs, setWaitMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimit, setIsRateLimit] = useState(false);
  const [modelUsed, setModelUsed] = useState<string>();
  const [usage, setUsage] = useState<UseChatReturn['usage']>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const waitTimerRef = useRef<number | null>(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const clearWaitTimer = () => {
    if (waitTimerRef.current != null) {
      window.clearInterval(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    const assistantId = `assistant-${Date.now()}`;

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsStreaming(false);
    setWaitMs(0);
    setError(null);
    setIsRateLimit(false);
    clearWaitTimer();
    waitTimerRef.current = window.setInterval(() => {
      setWaitMs((ms) => ms + 250);
    }, 250);

    try {
      abortControllerRef.current = new AbortController();
      const history = [...messagesRef.current, userMessage].map(({ role, content: c }) => ({
        role,
        content: c,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          messages: history,
          userName,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        let data: { error?: string; isRateLimit?: boolean } = {};
        try {
          data = await response.json();
        } catch {
          /* ignore */
        }
        if (response.status === 429 || data.isRateLimit) {
          setIsRateLimit(true);
          setError(data.error || 'Rate limit alcanzado');
        } else if (response.status === 401) {
          setError('❌ API key inválida. Verifica tu configuración.');
        } else if (response.status === 404) {
          setError('❌ Modelo no disponible.');
        } else {
          setError(data.error || `Error ${response.status}`);
        }
        return;
      }

      // Streaming path
      if (contentType.includes('text/event-stream')) {
        let assembled = '';
        let started = false;
        await readSseStream(response, (event) => {
          if (event.type === 'delta' && event.text) {
            if (!started) {
              started = true;
              setIsStreaming(true);
              setMessages((prev) => [
                ...prev,
                {
                  id: assistantId,
                  role: 'assistant',
                  content: event.text,
                  timestamp: new Date(),
                  pending: true,
                },
              ]);
              assembled = event.text;
              return;
            }
            assembled += event.text;
            const snapshot = assembled;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: snapshot, pending: true } : m)),
            );
          } else if (event.type === 'done') {
            if (event.usage) setUsage(event.usage);
            if (event.model) setModelUsed(event.model);
            const finalText = (event.message || assembled || '').trim();
            setMessages((prev) => {
              const has = prev.some((m) => m.id === assistantId);
              if (!has && finalText) {
                return [
                  ...prev,
                  {
                    id: assistantId,
                    role: 'assistant',
                    content: finalText,
                    timestamp: new Date(),
                  },
                ];
              }
              return prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: finalText || m.content, pending: false }
                  : m,
              );
            });
          } else if (event.type === 'error') {
            if (event.isRateLimit) setIsRateLimit(true);
            setError(event.error || 'Error');
          }
        });
        return;
      }

      // JSON fallback
      const data = await response.json();
      if (data.usage) setUsage(data.usage);
      if (data.model) setModelUsed(data.model);
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('❌ Error de conexión. Verifica tu internet e intenta de nuevo.');
    } finally {
      clearWaitTimer();
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [userName, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsRateLimit(false);
    setUsage(undefined);
    setModelUsed(undefined);
    setWaitMs(0);
  }, []);

  return {
    messages,
    isLoading,
    isStreaming,
    waitMs,
    error,
    sendMessage,
    clearMessages,
    isRateLimit,
    usage,
    modelUsed,
  };
}

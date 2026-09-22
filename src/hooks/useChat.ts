'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { readSseStream } from '@/lib/dialogue/stream';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  pending?: boolean;
  outcome?: 'complete' | 'stopped' | 'failed';
  durationMs?: number;
}

type Usage = { prompt_tokens: number; completion_tokens: number; total_tokens: number };

export function useChat(userName?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [waitMs, setWaitMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimit, setIsRateLimit] = useState(false);
  const [modelUsed, setModelUsed] = useState<string>();
  const [usage, setUsage] = useState<Usage>();
  const activeRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  const updateMessages = useCallback((update: (previous: ChatMessage[]) => ChatMessage[]) => {
    messagesRef.current = update(messagesRef.current);
    setMessages(messagesRef.current);
  }, []);

  useEffect(() => () => {
    const active = activeRef.current;
    activeRef.current = null;
    active?.abort();
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || activeRef.current) return;
    const controller = new AbortController();
    activeRef.current = controller;
    const startedAt = Date.now();
    const turnId = crypto.randomUUID();
    const userMessage: ChatMessage = {
      id: `user-${turnId}`, role: 'user', content: content.trim(), timestamp: new Date(), pending: true,
    };
    const assistantId = `assistant-${turnId}`;
    // Incomplete / failed turns stay visible but never contaminate later context.
    const history = messagesRef.current.filter(message => message.outcome === 'complete');
    updateMessages(previous => [...previous, userMessage]);
    setIsLoading(true);
    setIsStreaming(false);
    setWaitMs(0);
    setError(null);
    setIsRateLimit(false);
    const timer = window.setInterval(() => {
      if (activeRef.current === controller) setWaitMs(Date.now() - startedAt);
    }, 250);
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 60_000);
    let outcome: ChatMessage['outcome'] = 'failed';
    let assembled = '';
    const writeAssistant = (text: string, pending: boolean) => {
      if (activeRef.current !== controller) return;
      updateMessages(previous => previous.some(message => message.id === assistantId)
        ? previous.map(message => message.id === assistantId ? { ...message, content: text, pending } : message)
        : [...previous, { id: assistantId, role: 'assistant', content: text, timestamp: new Date(), pending }]);
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({
          messages: [...history, userMessage].map(({ role, content: text }) => ({ role, content: text })),
          userName, stream: true,
        }),
        signal: controller.signal,
      });
      if (activeRef.current !== controller) return;
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (activeRef.current !== controller) return;
        setIsRateLimit(response.status === 429 || !!data.isRateLimit);
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      if (response.headers.get('content-type')?.includes('text/event-stream')) {
        let completed = false;
        await readSseStream(response, event => {
          if (activeRef.current !== controller || controller.signal.aborted) return;
          if (event.type === 'delta' && event.text) {
            assembled += event.text;
            setIsStreaming(true);
            writeAssistant(assembled, true);
          } else if (event.type === 'done') {
            assembled = (event.message || assembled).trim();
            if (!assembled) throw new Error('Empty response');
            completed = true;
            if (event.model) setModelUsed(event.model);
            if (event.usage) setUsage(event.usage);
            writeAssistant(assembled, false);
          } else if (event.type === 'error') {
            setIsRateLimit(!!event.isRateLimit);
            throw new Error(event.error || 'Stream interrupted');
          }
        });
        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
        if (!completed) throw new Error('Stream interrupted');
      } else {
        const data = await response.json();
        if (activeRef.current !== controller) return;
        if (typeof data.message !== 'string' || !data.message.trim()) throw new Error('Empty response');
        if (data.model) setModelUsed(data.model);
        if (data.usage) setUsage(data.usage);
        writeAssistant(data.message, false);
      }
      outcome = 'complete';
    } catch (err) {
      if (activeRef.current !== controller) return;
      if (controller.signal.aborted && !timedOut) {
        outcome = 'stopped';
      } else {
        setError(timedOut ? 'timeout' : err instanceof Error ? err.message : 'Connection error');
      }
    } finally {
      window.clearInterval(timer);
      window.clearTimeout(timeout);
      if (outcome !== 'complete') controller.abort();
      if (activeRef.current === controller) {
        const durationMs = Date.now() - startedAt;
        updateMessages(previous => previous.map(message =>
          message.id === userMessage.id || message.id === assistantId
            ? { ...message, pending: false, outcome, durationMs } : message));
        setWaitMs(durationMs);
        setIsLoading(false);
        setIsStreaming(false);
        activeRef.current = null;
      }
    }
  }, [userName, updateMessages]);

  const stop = useCallback(() => activeRef.current?.abort(), []);
  const clearMessages = useCallback(() => {
    const active = activeRef.current;
    activeRef.current = null;
    active?.abort();
    updateMessages(() => []);
    setIsLoading(false);
    setIsStreaming(false);
    setError(null);
    setIsRateLimit(false);
    setUsage(undefined);
    setModelUsed(undefined);
    setWaitMs(0);
  }, [updateMessages]);

  const retry = useCallback(() => {
    if (activeRef.current) return;
    const previous = messagesRef.current;
    const index = previous.findLastIndex(message => message.role === 'user');
    const message = previous[index];
    if (!message || (message.outcome !== 'failed' && message.outcome !== 'stopped')) return;
    updateMessages(() => previous.slice(0, index));
    void sendMessage(message.content);
  }, [sendMessage, updateMessages]);

  return { messages, isLoading, isStreaming, waitMs, error, sendMessage, clearMessages, stop, retry, isRateLimit, usage, modelUsed };
}

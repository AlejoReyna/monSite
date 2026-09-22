type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; message?: string; model?: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }
  | { type: 'error'; error: string; isRateLimit?: boolean };

export async function readSseStream(response: Response, onEvent: (event: StreamEvent) => void) {
  if (!response.body) throw new Error('No stream body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const consume = (chunk: string) => {
    const payload = chunk.split('\n').filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).trim()).join('\n');
    if (!payload || payload === '[DONE]') return;
    let event: StreamEvent;
    try { event = JSON.parse(payload) as StreamEvent; } catch { return; }
    onEvent(event);
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() ?? '';
      chunks.forEach(consume);
      if (done) { if (buffer.trim()) consume(buffer); break; }
    }
  } finally { reader.releaseLock(); }
}

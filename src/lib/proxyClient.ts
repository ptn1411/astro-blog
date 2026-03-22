/**
 * createProxyClient — fetch client tự động gắn đầy đủ headers:
 *   Authorization: Bearer <sessionToken>
 *   X-App-Token:  <hmac_token>   (Layer 1)
 *   X-App-Nonce:  <active_nonce> (Layer 2)
 *   X-App-Id:    <appId>
 *   X-Device-Id: <fingerprint>
 */

interface ProxyClientOptions {
  baseUrl: string;
  apiKey?: string | null;
  deviceId?: string | null;
  appToken?: string | null;
  nonce?: string | null;
  appId?: string;
}

interface ChatMessage {
  role: string;
  content: string | Array<Record<string, unknown>>;
}

interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

type OnChunk = (chunk: { choices: Array<{ delta: { content?: string } }> }) => void;
type OnDone  = () => void;
type OnError = (err: Error) => void;

export function createProxyClient({
  baseUrl,
  apiKey,
  deviceId,
  appToken,
  nonce,
  appId = 'web',
}: ProxyClientOptions) {
  function buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(apiKey    && { 'Authorization': `Bearer ${apiKey}` }),
      ...(appToken  && { 'X-App-Token':   appToken }),  // Layer 1: HMAC
      ...(nonce     && { 'X-App-Nonce':   nonce }),     // Layer 2: nonce chain
      ...(appId     && { 'X-App-Id':      appId }),
      ...(deviceId  && { 'X-Device-Id':   deviceId }),
    };
  }

  // ─── Non-streaming ────────────────────────────────────────────────────────
  async function chat({ model, messages, temperature, max_tokens }: ChatOptions) {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ model, messages, temperature, max_tokens, stream: false }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ─── Streaming ────────────────────────────────────────────────────────────
  async function chatStream(
    { model, messages, temperature, max_tokens }: ChatOptions,
    onChunk?: OnChunk,
    onDone?: OnDone,
    onError?: OnError,
    signal?: AbortSignal
  ) {
    let res: Response;
    try {
      res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ model, messages, temperature, max_tokens, stream: true }),
        signal,
      });
    } catch (err) {
      onError?.(err as Error);
      return;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      onError?.(new Error((err as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`));
      return;
    }

    const reader  = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer    = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') { onDone?.(); return; }
        try {
          const chunk = JSON.parse(data);
          if (chunk.error) { onError?.(new Error(chunk.error.message)); return; }
          onChunk?.(chunk);
        } catch { /* skip invalid JSON */ }
      }
    }
    onDone?.();
  }

  return { chat, chatStream };
}

/**
 * useSecureRuntime — hook kết hợp toàn bộ 4-layer auth với @assistant-ui/react
 *
 * Layer 0: Device fingerprint  → X-Device-Id
 * Layer 1: HMAC token 30s      → X-App-Token (WASM local)
 * Layer 2: Nonce chain 90s     → X-App-Nonce (server)
 * Layer 3: Guest session 30d   → Authorization: Bearer (server)
 *
 * Trả về { runtime, isReady, error } để dùng thay cho useLocalRuntime()
 */

import { useRef, useMemo, useEffect, useState } from 'react';
import {
  useLocalRuntime,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
  CompositeAttachmentAdapter,
  type ChatModelAdapter,
} from '@assistant-ui/react';
import { useDeviceId }     from './useDeviceId';
import { useAppToken }     from './useAppToken';
import { useGuestSession } from './useGuestSession';
import { createProxyClient } from '../lib/proxyClient';

const PROXY_URL = import.meta.env.PUBLIC_PROXY_URL || 'http://localhost:3000';
const AUTH_TIMEOUT_MS = 20_000; // Show error after 20s if still loading

export function useSecureRuntime() {
  // ── Timeout: show error nếu auth không xong sau 20s ─────────────────────────
  const [timedOut, setTimedOut] = useState(false);

  // ── Layer 0: Device fingerprint ─────────────────────────────────────────────
  const { deviceId, isReady: deviceReady } = useDeviceId();

  // ── Layer 1 + 2: HMAC token + Nonce chain ────────────────────────────────────
  const { token: appToken, nonce, appId, isReady: authReady } = useAppToken({
    deviceId: deviceReady ? deviceId : null,
  });

  // ── Layer 3: Guest session ────────────────────────────────────────────────────
  const { sessionToken, isReady: sessionReady, error } = useGuestSession({
    deviceId: deviceReady ? deviceId : null,
    appToken: authReady ? appToken : null,
    appId,
  });

  // isReady: nonce optional nếu NONCE_ENABLED=false ở server
  const isReady = deviceReady && authReady && sessionReady && !!sessionToken;

  // Debug log để dễ trace issue
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[useSecureRuntime]', {
        deviceReady, deviceId: deviceId?.slice(0, 8),
        authReady, appToken: appToken?.slice(0, 12),
        nonce: nonce?.slice(0, 8), sessionReady,
        sessionToken: sessionToken?.slice(0, 12), isReady,
      });
    }
  });

  // Timeout: sau AUTH_TIMEOUT_MS ms mà vẫn chưa ready → show error
  useEffect(() => {
    if (isReady) return;
    const t = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [isReady]);

  const timeoutError = timedOut && !isReady
    ? `Không thể kết nối đến AI Proxy (${PROXY_URL}). Hãy kiểm tra server đang chạy.`
    : null;

  // ── Refs: adapter luôn đọc giá trị mới nhất tại thời điểm gọi API ───────────
  // (token/nonce thay đổi liên tục, không thể đưa vào dependency của useMemo)
  const sessionRef = useRef(sessionToken);
  const tokenRef   = useRef(appToken);
  const nonceRef   = useRef(nonce);
  const deviceRef  = useRef(deviceId);
  const appIdRef   = useRef(appId);

  useEffect(() => { sessionRef.current = sessionToken; }, [sessionToken]);
  useEffect(() => { tokenRef.current   = appToken;     }, [appToken]);
  useEffect(() => { nonceRef.current   = nonce;        }, [nonce]);
  useEffect(() => { deviceRef.current  = deviceId;     }, [deviceId]);
  useEffect(() => { appIdRef.current   = appId;        }, [appId]);

  // ── ChatModelAdapter ─────────────────────────────────────────────────────────
  const adapter: ChatModelAdapter = useMemo(
    () => ({
      async *run({ messages, abortSignal }) {
        // Map @assistant-ui messages → OpenAI format
        const openaiMessages = messages.map((msg) => {
          const parts: Array<Record<string, unknown>> = [];

          for (const c of msg.content || []) {
            if (c.type === 'text') {
              parts.push({ type: 'text', text: c.text });
            } else if (c.type === 'image') {
              parts.push({
                type: 'image_url',
                image_url: { url: (c as { type: 'image'; image: string }).image },
              });
            }
          }

          if (parts.length === 1 && parts[0].type === 'text') {
            return { role: msg.role, content: parts[0].text as string };
          }
          return { role: msg.role, content: parts.length > 0 ? parts : '' };
        });

        // Tạo client với headers mới nhất từ refs
        const client = createProxyClient({
          baseUrl:  PROXY_URL,
          apiKey:   sessionRef.current,   // Authorization: Bearer
          appToken: tokenRef.current,     // X-App-Token
          nonce:    nonceRef.current,     // X-App-Nonce
          deviceId: deviceRef.current,    // X-Device-Id
          appId:    appIdRef.current,
        });

        // Stream manually qua fetch + ReadableStream
        const res = await fetch(`${PROXY_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(sessionRef.current && { 'Authorization': `Bearer ${sessionRef.current}` }),
            ...(tokenRef.current   && { 'X-App-Token':   tokenRef.current }),
            ...(nonceRef.current   && { 'X-App-Nonce':   nonceRef.current }),
            ...(appIdRef.current   && { 'X-App-Id':      appIdRef.current }),
            ...(deviceRef.current  && { 'X-Device-Id':   deviceRef.current }),
          },
          body: JSON.stringify({
            model: 'gpt-5.4',
            messages: openaiMessages,
            stream: true,
          }),
          signal: abortSignal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err as { error?: { message?: string } })?.error?.message ||
            `API error: ${res.status} ${res.statusText}`
          );
        }

        const reader  = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer    = '';
        let fullText  = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              const delta  = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;
                yield {
                  content: [{ type: 'text' as const, text: fullText }],
                };
              }
            } catch { /* skip invalid JSON */ }
          }
        }

        // Dòng này chỉ để tránh unused variable warning
        void client;
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // stable — đọc từ refs tại thời điểm call
  );

  const runtime = useLocalRuntime(adapter, {
    adapters: {
      attachments: new CompositeAttachmentAdapter([
        new SimpleImageAttachmentAdapter(),
        new SimpleTextAttachmentAdapter(),
      ]),
    },
  });

  return { runtime, isReady, error: error ?? timeoutError };
}

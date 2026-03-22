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
  type ThreadMessageLike,
} from '@assistant-ui/react';
import { useDeviceId }     from './useDeviceId';
import { useAppToken }     from './useAppToken';
import { useGuestSession } from './useGuestSession';
import { createProxyClient } from '../lib/proxyClient';

const PROXY_URL = import.meta.env.PUBLIC_PROXY_URL || 'http://localhost:3000';
const AUTH_TIMEOUT_MS = 20_000; // Show error after 20s if still loading

interface UseSecureRuntimeOptions {
  initialMessages?: readonly ThreadMessageLike[];
}

export function useSecureRuntime(options: UseSecureRuntimeOptions = {}) {
  const { initialMessages } = options;
  // ── Timeout: show error nếu auth không xong sau 20s ─────────────────────────
  const [timedOut, setTimedOut] = useState(false);

  // ── Layer 0: Device fingerprint ─────────────────────────────────────────────
  const { deviceId, isReady: deviceReady } = useDeviceId();

  // ── Layer 1 + 2: HMAC token + Nonce chain ────────────────────────────────────
  const { token: appToken, nonce, appId, isReady: authReady, nonceReady, refreshNonce } = useAppToken({
    deviceId: deviceReady ? deviceId : null,
  });

  // ── Layer 3: Guest session ────────────────────────────────────────────────────
  const { sessionToken, isReady: sessionReady, error } = useGuestSession({
    deviceId: deviceReady ? deviceId : null,
    appToken: authReady ? appToken : null,
    appId,
  });

  // isReady: chờ nonce ACTIVE (sau ping 2) trước khi cho phép chat
  const isReady = deviceReady && authReady && nonceReady && sessionReady && !!sessionToken;

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
  const sessionRef       = useRef(sessionToken);
  const tokenRef         = useRef(appToken);
  const nonceRef         = useRef(nonce);
  const deviceRef        = useRef(deviceId);
  const appIdRef         = useRef(appId);
  const refreshNonceRef  = useRef(refreshNonce);

  useEffect(() => { sessionRef.current      = sessionToken;  }, [sessionToken]);
  useEffect(() => { tokenRef.current        = appToken;      }, [appToken]);
  useEffect(() => { nonceRef.current        = nonce;         }, [nonce]);
  useEffect(() => { deviceRef.current       = deviceId;      }, [deviceId]);
  useEffect(() => { appIdRef.current        = appId;         }, [appId]);
  useEffect(() => { refreshNonceRef.current = refreshNonce;  }, [refreshNonce]);

  // ── ChatModelAdapter ─────────────────────────────────────────────────────────
  const adapter: ChatModelAdapter = useMemo(
    () => ({
      async *run({ messages, abortSignal }) {
        // DEBUG: log full message structure to diagnose attachment issues
        if (process.env.NODE_ENV === 'development') {
          console.debug('[adapter.run] messages:', messages.map((m) => ({
            role: m.role,
            contentTypes: (m.content || []).map((c) => c.type),
            contentFull: m.content,
            attachments: (m as Record<string, unknown>).attachments,
          })));
        }

        // Helper: convert any @assistant-ui content part → OpenAI part
        type AnyPart = { type: string; [k: string]: unknown };
        const toPart = (c: AnyPart): Record<string, unknown> | null => {
          if (c.type === 'text') {
            return { type: 'text', text: c.text as string };

          } else if (c.type === 'image') {
            // ImageMessagePart: { type: 'image', image: data URL / URL }
            return { type: 'image_url', image_url: { url: c.image as string } };

          } else if (c.type === 'file') {
            // FileMessagePart: { type: 'file', data: base64, mimeType, filename? }
            const mimeType  = c.mimeType as string;
            const data      = c.data as string;
            const filename  = c.filename as string | undefined;
            const isImage   = mimeType.startsWith('image/');
            const isPdf     = mimeType === 'application/pdf';
            const isText    = mimeType.startsWith('text/') || /\/(json|xml|javascript|typescript)/.test(mimeType);

            if (isImage || isPdf) {
              return { type: 'image_url', image_url: { url: `data:${mimeType};base64,${data}` } };
            } else if (isText) {
              const header  = filename ? `[File: ${filename}]\n` : '';
              const decoded = (() => { try { return atob(data); } catch { return data; } })();
              return { type: 'text', text: header + decoded };
            }
            return { type: 'text', text: `[${filename ?? 'file'} (${mimeType}) — định dạng chưa được hỗ trợ]` };
          }
          return null;
        };

        // Map @assistant-ui messages → OpenAI format
        // NOTE: @assistant-ui stores text in msg.content, but attachment data
        //       (images, files) is in msg.attachments[i].content  ← KEY FIX
        const openaiMessages = messages.map((msg) => {
          const parts: Array<Record<string, unknown>> = [];

          // 1. Regular content parts (text, inline image)
          for (const c of (msg.content as unknown as AnyPart[]) || []) {
            const p = toPart(c);
            if (p) parts.push(p);
          }

          // 2. Attachment content parts (image/file uploaded via picker or paste)
          const attachments = (msg as Record<string, unknown>).attachments as
            Array<{ content?: AnyPart[] }> | undefined;
          if (attachments?.length) {
            for (const att of attachments) {
              for (const c of att.content ?? []) {
                const p = toPart(c);
                if (p) parts.push(p);
              }
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

        // Debug: show header values before request
        console.debug('[chat request] headers:', {
          'Authorization': sessionRef.current ? `Bearer ${sessionRef.current.slice(0,12)}...` : '❌ MISSING',
          'X-App-Token':   tokenRef.current   ? `${tokenRef.current.slice(0,12)}...`          : '❌ MISSING',
          'X-App-Nonce':   nonceRef.current   ? `${nonceRef.current.slice(0,8)}...`            : '❌ MISSING',
          'X-Device-Id':   deviceRef.current  ? `${deviceRef.current.slice(0,8)}...`           : '❌ MISSING',
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

        // Nonce đã được consume bởi server — kích hoạt nonce mới ngay lập tức
        // để request tiếp theo không phải đợi 75s cho ping cycle tự nhiên
        refreshNonceRef.current();

        // Dòng này chỉ để tránh unused variable warning
        void client;
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // stable — đọc từ refs tại thời điểm call
  );

  const runtime = useLocalRuntime(adapter, {
    initialMessages,
    adapters: {
      attachments: new CompositeAttachmentAdapter([
        new SimpleImageAttachmentAdapter(),
        new SimpleTextAttachmentAdapter(),
      ]),
    },
  });

  return { runtime, isReady, error: error ?? timeoutError };
}

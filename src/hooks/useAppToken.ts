/**
 * useAppToken.ts — WASM version (embedded secret edition)
 *
 * Layer 1: HMAC token — tạo bằng WASM Rust (generate_app_token)
 *   → APP_SECRET đã nhúng sẵn trong .wasm binary lúc build
 *   → Không cần round-trip GET /auth/token
 *   → Không cần PUBLIC_APP_SECRET trong .env
 *
 * Layer 2: Nonce chain — vẫn fetch POST /auth/ping
 *   → Nonce phải do server issue (one-time, server validates)
 *
 * Fallback: nếu WASM chưa load (cold start) → fetch từ server như cũ
 */

import { useState, useEffect, useRef } from 'react';
import { loadWasm } from '~/wasm/wasmLoader';

const PROXY_URL = import.meta.env.PUBLIC_PROXY_URL || 'http://localhost:3000';
const APP_ID    = import.meta.env.PUBLIC_APP_ID    || 'web';

// ─── Layer 1: Tạo HMAC token (WASM hoặc fallback server) ─────────────────────

async function getHmacToken(): Promise<{ token: string; ttlMs: number }> {
  const wasm = await loadWasm();

  if (wasm) {
    try {
      // Dùng secret nhúng sẵn trong .wasm — không cần network call
      const raw    = wasm.generate_app_token(APP_ID);
      const result = JSON.parse(raw) as { token: string; ttl_ms: number };
      return { token: result.token, ttlMs: result.ttl_ms };
    } catch (err) {
      console.warn('[useAppToken] WASM generate failed, falling back to server:', err);
    }
  }

  // Fallback: fetch từ server (nếu WASM chưa ready hoặc secret không embed)
  const res = await fetch(`${PROXY_URL}/auth/token?appId=${APP_ID}`);
  if (!res.ok) throw new Error(`GET /auth/token failed: HTTP ${res.status}`);
  const data = await res.json() as { token: string; expiresAt: number; ttlMs: number };
  return { token: data.token, ttlMs: data.ttlMs };
}

// ─── Layer 2: Ping để activate nonce ──────────────────────────────────────────

async function doPing(
  deviceId: string,
  pendingNonce: string | null = null
): Promise<{ nonce: string; ttl: number }> {
  const body: Record<string, unknown> = {
    deviceId,
    timestamp: Date.now(),
    ...(pendingNonce && { nonce: pendingNonce }),
  };

  const res = await fetch(`${PROXY_URL}/auth/ping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`POST /auth/ping failed: HTTP ${res.status}`);
  return res.json() as Promise<{ nonce: string; ttl: number }>;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useAppToken({ deviceId }: { deviceId: string | null } = { deviceId: null }) {
  const [hmacToken,   setHmacToken]   = useState<string | null>(null);
  const [activeNonce, setActiveNonce] = useState<string | null>(null);
  const [isReady,     setIsReady]     = useState(false);
  // nonceReady: true only after ping 2 (nonce is ACTIVE on server)
  const [nonceReady,  setNonceReady]  = useState(false);

  const pendingNonceRef = useRef<string | null>(null);
  const hmacTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deviceIdRef     = useRef(deviceId);

  useEffect(() => { deviceIdRef.current = deviceId; }, [deviceId]);

  // ── Layer 1: HMAC token refresh loop ────────────────────────────────────────
  async function refreshHmacToken() {
    try {
      const { token, ttlMs } = await getHmacToken();
      setHmacToken(token);

      // Refresh 3s trước khi hết window
      const delay = Math.max(ttlMs - 3_000, 5_000);
      hmacTimerRef.current = setTimeout(refreshHmacToken, delay);
    } catch (err) {
      console.error('[useAppToken/hmac]', (err as Error).message);
      hmacTimerRef.current = setTimeout(refreshHmacToken, 5_000);
    }
  }

  // ── Layer 2: Ping/Nonce chain loop ──────────────────────────────────────────
  async function runPingCycle() {
    const did = deviceIdRef.current;
    if (!did) return;

    try {
      const { nonce: newNonce, ttl } = await doPing(did, pendingNonceRef.current);

      // Server nonce lifecycle: ISSUED → ACTIVE → CONSUMED
      //
      // Ping 1: pendingNonce = null  → server issues N1 (ISSUED)
      //         → send nothing to activate, store N1 as pending
      //         → schedule ping 2 FAST (2s) to activate N1 quickly
      // Ping 2: pendingNonce = N1    → server activates N1 (ISSUED→ACTIVE)
      //         → N1 is now consumable by API, store N2 as pending
      //         → resume normal TTL cycle
      const isFirstPing = !pendingNonceRef.current;

      if (!isFirstPing) {
        // Ping 2+: previous pending has just been activated by server → use it
        setActiveNonce(pendingNonceRef.current!);
        setNonceReady(true); // nonce is now ACTIVE and consumable
      }

      pendingNonceRef.current = newNonce;
      setIsReady(true);

      // Fast activation: ping 2 fires 2s after ping 1 (not 75s)
      const delay = isFirstPing ? 2_000 : Math.max(ttl - 15_000, 10_000);
      pingTimerRef.current = setTimeout(runPingCycle, delay);
    } catch (err) {
      console.error('[useAppToken/ping]', (err as Error).message);
      pingTimerRef.current = setTimeout(runPingCycle, 5_000);
    }
  }

  useEffect(() => {
    if (!deviceId) return;
    refreshHmacToken();
    runPingCycle();
    return () => {
      if (hmacTimerRef.current) clearTimeout(hmacTimerRef.current);
      if (pingTimerRef.current) clearTimeout(pingTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  /**
   * refreshNonce — kích hoạt fast ping ngay sau khi nonce bị consume.
   * Gọi từ useSecureRuntime sau mỗi chat request (success hoặc error).
   * Ping 200ms sau để tránh overlap với request đang xử lý.
   */
  function refreshNonce() {
    if (pingTimerRef.current) clearTimeout(pingTimerRef.current);
    pingTimerRef.current = setTimeout(runPingCycle, 200);
  }

  return {
    token:      hmacToken,    // X-App-Token (HMAC — generated by WASM Rust)
    nonce:      activeNonce,  // X-App-Nonce (nonce chain — ACTIVE state)
    appId:      APP_ID,
    isReady,                  // true after ping 1 (HMAC token available)
    nonceReady,               // true after ping 2 (nonce ACTIVE, usable for API)
    refreshNonce,             // call after each chat request to get fresh nonce
  };
}

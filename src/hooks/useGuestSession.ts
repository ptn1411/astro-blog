/**
 * useGuestSession — React hook
 *
 * Flow:
 *  1. Tạo guestId (UUID v4) lần đầu → lưu localStorage (persistent)
 *  2. Gọi POST /auth/guest để lấy sessionToken từ server
 *  3. Lưu sessionToken + expiresAt vào localStorage
 *  4. Tự động re-register khi token hết hạn
 *
 * Kết hợp với useAppToken (HMAC) và useDeviceId (fingerprint).
 */

import { useState, useEffect, useRef } from 'react';

const PROXY_URL        = import.meta.env.PUBLIC_PROXY_URL || 'http://localhost:3000';
const STORAGE_GUEST_ID = 'guest_id';
const STORAGE_TOKEN    = 'guest_session_token';
const STORAGE_EXPIRES  = 'guest_session_expires';

interface GuestSessionOptions {
  deviceId?: string | null;
  appToken?: string | null;
  appId?: string;
}

interface RegisterResult {
  token: string;
  expiresAt: number;
  guestId: string;
}

async function register(
  id: string,
  device: string | null | undefined,
  hmacToken: string | null | undefined,
  appId: string
): Promise<RegisterResult> {
  const res = await fetch(`${PROXY_URL}/auth/guest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(hmacToken && { 'X-App-Token': hmacToken }),
      ...(appId     && { 'X-App-Id':    appId }),
    },
    body: JSON.stringify({ guestId: id, deviceId: device || null }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } })?.error?.message || `Register failed: HTTP ${res.status}`);
  }

  return res.json();
}

export function useGuestSession({ deviceId, appToken, appId = 'web' }: GuestSessionOptions = {}) {
  const [guestId, setGuestId]           = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isReady, setIsReady]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function initSession() {
    try {
      setError(null);

      // 1. Lấy hoặc tạo guestId
      let id = localStorage.getItem(STORAGE_GUEST_ID);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(STORAGE_GUEST_ID, id);
      }
      setGuestId(id);

      // 2. Kiểm tra token còn hạn không (còn > 5 phút)
      const cachedToken   = localStorage.getItem(STORAGE_TOKEN);
      const cachedExpires = parseInt(localStorage.getItem(STORAGE_EXPIRES) || '0');
      const fiveMinutes   = 5 * 60 * 1000;

      if (cachedToken && cachedExpires - Date.now() > fiveMinutes) {
        setSessionToken(cachedToken);
        setIsReady(true);
        scheduleRefresh(cachedExpires);
        return;
      }

      // 3. Register / refresh token từ server
      const { token, expiresAt } = await register(id, deviceId, appToken, appId);

      localStorage.setItem(STORAGE_TOKEN,   token);
      localStorage.setItem(STORAGE_EXPIRES, String(expiresAt));

      setSessionToken(token);
      setIsReady(true);
      scheduleRefresh(expiresAt);
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      setIsReady(true); // vẫn set ready để UI không bị treo, nhưng token = null
      console.error('[useGuestSession]', msg);
    }
  }

  function scheduleRefresh(expiresAt: number) {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    const delay = expiresAt - Date.now() - 5 * 60 * 1000;
    if (delay > 0) {
      refreshTimer.current = setTimeout(initSession, delay);
    }
  }

  useEffect(() => {
    // Chờ appToken sẵn sàng mới init (appToken từ useAppToken)
    if (appToken !== null && appToken !== undefined) {
      initSession();
    }
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appToken]);

  function clearSession() {
    localStorage.removeItem(STORAGE_GUEST_ID);
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_EXPIRES);
    setGuestId(null);
    setSessionToken(null);
    setIsReady(false);
  }

  return { guestId, sessionToken, isReady, error, clearSession };
}

/**
 * useDeviceId.ts — WASM version
 *
 * Thu thập browser signals → hash bằng SHA-256 trong WASM Rust.
 * Logic hash ẩn trong binary, không đọc được qua DevTools.
 *
 * Fallback: crypto.randomUUID() nếu WASM chưa load được.
 */

import { useState, useEffect } from 'react';
import { loadWasm } from '~/wasm/wasmLoader';

const STORAGE_KEY = 'x-device-id';

// ─── Thu thập browser signals ──────────────────────────────────────────────────
function collectSignals(): string[] {
  const nav = navigator;
  const scr = screen;

  const signals: string[] = [
    `ua:${nav.userAgent}`,
    `lang:${nav.language}`,
    `langs:${nav.languages?.join(',') || ''}`,
    `tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
    `screen:${scr.width}x${scr.height}x${scr.colorDepth}`,
    `pixel:${window.devicePixelRatio}`,
    `cores:${nav.hardwareConcurrency}`,
    `platform:${(nav as Navigator & { platform?: string }).platform || ''}`,
    `touch:${nav.maxTouchPoints}`,
    `cookies:${nav.cookieEnabled}`,
  ];

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = "14px 'Arial'";
      ctx.fillText('wasm-security-fp 🔐', 2, 2);
      signals.push(`canvas:${canvas.toDataURL().slice(-64)}`);
    }
  } catch { /* skip */ }

  // Audio context fingerprint
  try {
    type AnyAudioContext = typeof AudioContext;
    const AC = (window.AudioContext || (window as Window & { webkitAudioContext?: AnyAudioContext }).webkitAudioContext) as typeof AudioContext | undefined;
    if (AC) {
      const ac = new AC({ sampleRate: 44100 });
      signals.push(`audio:${ac.sampleRate}:${ac.destination.channelCount}`);
      ac.close();
    }
  } catch { /* skip */ }

  return signals;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady]   = useState(false);

  useEffect(() => {
    async function init() {
      // Dùng cached nếu có
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        setDeviceId(cached);
        setIsReady(true);
        return;
      }

      let id: string | null = null;

      // ── WASM path ────────────────────────────────────────────────────────────
      const wasm = await loadWasm();
      if (wasm) {
        try {
          const signals = collectSignals();
          // hash_device_signals(signalsJson, salt) — salt = empty string để không cần secret
          const raw    = wasm.hash_device_signals(JSON.stringify(signals), '');
          const result = JSON.parse(raw) as { device_id: string };
          id = result.device_id;
        } catch {
          // Fallback: WASM CSPRNG nonce
          try {
            id = JSON.parse(wasm.generate_nonce()) as string;
          } catch { /* fall through */ }
        }
      }

      // ── Fallback: Web Crypto UUID ─────────────────────────────────────────────
      if (!id) {
        id = crypto.randomUUID().replace(/-/g, '');
        console.warn('[useDeviceId] WASM unavailable, using random ID');
      }

      localStorage.setItem(STORAGE_KEY, id);
      setDeviceId(id);
      setIsReady(true);
    }

    init();
  }, []);

  return { deviceId, isReady };
}

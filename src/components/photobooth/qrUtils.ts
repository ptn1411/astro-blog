import QRCode from 'qrcode';
import jsQR from 'jsqr';

/* ---------- gzip + base64url (URL-safe, compact) ---------- */

function u8ToB64url(u8: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToU8(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

export async function compressText(text: string): Promise<string> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  const buf = await new Response(stream).arrayBuffer();
  return u8ToB64url(new Uint8Array(buf));
}

export async function decompressText(b64: string): Promise<string> {
  const u8 = b64urlToU8(b64);
  const stream = new Blob([u8.buffer as ArrayBuffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

/* ---------- SDP minifier (reduce QR size) ----------
   Strip lines that aren't required for a basic audio-less single-track receive. */
export function minifySdp(sdp: string): string {
  return sdp
    .split(/\r?\n/)
    .filter((line) => {
      // Drop optional header extensions and redundant rtcp-fb to cut size
      if (line.startsWith('a=extmap:')) return false;
      if (line.startsWith('a=rtcp-fb:') && !/\bnack\b|\bccm fir\b/.test(line)) return false;
      if (line.startsWith('a=rtpmap:') && /(red|ulpfec|rtx|flexfec)/i.test(line)) return false;
      if (line.startsWith('a=fmtp:') && /(red|ulpfec|rtx|flexfec|apt=)/i.test(line)) return false;
      if (line.startsWith('a=rtcp-mux-only')) return false;
      if (line.startsWith('a=ice-options:')) return false;
      if (line.startsWith('a=msid-semantic:')) return false;
      return line.length > 0;
    })
    .join('\r\n') + '\r\n';
}

/* ---------- QR render + scan ---------- */

export async function renderQrToDataUrl(text: string, size = 360): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'L',
    margin: 1,
    scale: 1,
    width: size,
    color: { dark: '#111', light: '#fff' },
  });
}

export interface QrScanner {
  stop: () => void;
}

export function startQrScan(
  videoEl: HTMLVideoElement,
  onResult: (text: string) => void,
  onFrame?: (ctx: CanvasRenderingContext2D) => void
): QrScanner {
  let active = true;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  let rafId = 0;

  const tick = () => {
    if (!active) return;
    if (videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      onFrame?.(ctx);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const res = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
      if (res && res.data) {
        active = false;
        onResult(res.data);
        return;
      }
    }
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  return {
    stop: () => {
      active = false;
      cancelAnimationFrame(rafId);
    },
  };
}

/* ---------- Encode/decode small payload with a short magic prefix ---------- */

const MAGIC = 'PB1:'; // PhotoBooth v1

export async function packPayload(kind: 'O' | 'A', sdp: string): Promise<string> {
  const minified = minifySdp(sdp);
  const compressed = await compressText(minified);
  return `${MAGIC}${kind}:${compressed}`;
}

export async function unpackPayload(raw: string): Promise<{ kind: 'O' | 'A'; sdp: string } | null> {
  if (!raw.startsWith(MAGIC)) return null;
  const body = raw.slice(MAGIC.length);
  const kind = body.charAt(0);
  if (kind !== 'O' && kind !== 'A') return null;
  if (body.charAt(1) !== ':') return null;
  const b64 = body.slice(2);
  try {
    const sdp = await decompressText(b64);
    return { kind, sdp };
  } catch {
    return null;
  }
}

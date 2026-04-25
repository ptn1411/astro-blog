import { useEffect, useRef, useState } from 'react';
import { packPayload, unpackPayload, renderQrToDataUrl, startQrScan } from './qrUtils';

type Step = 'idle' | 'scanning' | 'preparing' | 'show-answer' | 'connected' | 'error';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export default function PhoneSender() {
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);
  const [answerQr, setAnswerQr] = useState<string | null>(null);
  const [camReady, setCamReady] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const scanVideoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<ReturnType<typeof startQrScan> | null>(null);
  const facingRef = useRef<'user' | 'environment'>('environment');

  const startCamera = async (facing: 'user' | 'environment' = 'environment') => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = s;
      facingRef.current = facing;
      if (previewRef.current) {
        previewRef.current.srcObject = s;
        await previewRef.current.play().catch(() => {});
      }
      setCamReady(true);
    } catch (e) {
      setError((e as Error).message || 'Không thể mở camera');
      setStep('error');
    }
  };

  const flipCamera = () => {
    startCamera(facingRef.current === 'environment' ? 'user' : 'environment');
  };

  const startScan = () => {
    setStep('scanning');
    setError(null);
    setTimeout(() => {
      const v = scanVideoRef.current;
      const s = streamRef.current;
      if (!v || !s) return;
      v.srcObject = s;
      v.play().catch(() => {});
      scannerRef.current = startQrScan(v, async (text) => {
        const parsed = await unpackPayload(text);
        if (!parsed || parsed.kind !== 'O') {
          setError('QR không đúng định dạng offer. Thử quét lại.');
          setStep('error');
          return;
        }
        await handleOffer(parsed.sdp);
      });
    }, 100);
  };

  const handleOffer = async (offerSdp: string) => {
    setStep('preparing');
    scannerRef.current?.stop();
    try {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      // Add camera tracks for sending
      const cam = streamRef.current;
      if (!cam) throw new Error('Chưa có camera');
      cam.getTracks().forEach((t) => pc.addTrack(t, cam));

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') setStep('connected');
        else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setError(`Kết nối ${pc.connectionState}`);
          setStep('error');
        }
      };

      await pc.setRemoteDescription({ type: 'offer', sdp: offerSdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitIceComplete(pc);

      const payload = await packPayload('A', pc.localDescription!.sdp);
      const dataUrl = await renderQrToDataUrl(payload, 520);
      setAnswerQr(dataUrl);
      setStep('show-answer');
    } catch (e) {
      setError((e as Error).message || 'Lỗi xử lý offer');
      setStep('error');
    }
  };

  useEffect(() => {
    startCamera('environment');
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      scannerRef.current?.stop();
      pcRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="photobooth-phone-root min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <header className="px-4 py-3 flex items-center justify-between border-b border-white/10 sticky top-0 bg-black/40 backdrop-blur z-10">
        <h1 className="font-bold text-base">📱 Photobooth Phone</h1>
        <button
          onClick={flipCamera}
          disabled={!camReady}
          className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40"
        >
          🔄 Đổi camera
        </button>
      </header>

      <main className="p-4 space-y-4 max-w-lg mx-auto">
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-200">⚠ {error}</div>
        )}

        {/* Camera preview (always visible when idle) */}
        {(step === 'idle' || step === 'scanning') && (
          <div className="relative bg-black rounded-xl overflow-hidden aspect-[3/4]">
            {step === 'idle' ? (
              <video ref={previewRef} playsInline muted className="w-full h-full object-cover" />
            ) : (
              <>
                <video ref={scanVideoRef} playsInline muted className="w-full h-full object-cover" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border-2 border-emerald-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 text-center text-xs bg-black/60 rounded-full py-1">
                  Đang tìm QR-Offer từ máy tính…
                </div>
              </>
            )}
          </div>
        )}

        {step === 'idle' && (
          <>
            <p className="text-sm text-white/70 text-center">
              Cho phép camera, hướng vào màn hình máy tính và nhấn <b>Quét QR-Offer</b>.
            </p>
            <button
              onClick={startScan}
              disabled={!camReady}
              className="w-full py-3 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold shadow-lg disabled:opacity-50"
            >
              📷 Quét QR-Offer
            </button>
          </>
        )}

        {step === 'preparing' && (
          <div className="text-center py-12">
            <div className="inline-block w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3" />
            <p className="text-white/70">Đang tạo QR-Answer…</p>
          </div>
        )}

        {step === 'show-answer' && answerQr && (
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-xl">
              <img src={answerQr} alt="Answer QR" className="w-full h-auto" />
            </div>
            <div className="text-center text-sm space-y-1">
              <p className="font-semibold">Đưa điện thoại cho máy tính quét QR này</p>
              <p className="text-white/60 text-xs">Kết nối sẽ tự động bật khi quét thành công.</p>
            </div>
          </div>
        )}

        {step === 'connected' && (
          <div className="text-center py-12 space-y-3">
            <div className="text-6xl">✅</div>
            <h2 className="font-bold text-xl">Đã kết nối!</h2>
            <p className="text-white/70 text-sm">Giữ nguyên trang này, camera đang gửi về máy tính.</p>
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 rounded-full text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Đang phát
              </div>
            </div>
          </div>
        )}

        {step === 'error' && (
          <button
            onClick={() => {
              setError(null);
              pcRef.current?.close();
              pcRef.current = null;
              setStep('idle');
            }}
            className="w-full py-3 rounded-full bg-white/10 hover:bg-white/20 font-semibold"
          >
            Thử lại
          </button>
        )}
      </main>
    </div>
  );
}

function waitIceComplete(pc: RTCPeerConnection): Promise<void> {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') return resolve();
    const check = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', check);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', check);
    setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', check);
      resolve();
    }, 4000);
  });
}

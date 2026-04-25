import { useEffect, useRef, useState } from 'react';
import { packPayload, unpackPayload, renderQrToDataUrl, startQrScan } from './qrUtils';

type Step = 'idle' | 'making-offer' | 'show-offer' | 'scanning-answer' | 'connecting' | 'connected' | 'error';

interface Props {
  /**
   * A MediaStream that the scanner uses to read the phone's answer QR.
   * Typically the desktop webcam stream that Photobooth already holds.
   */
  scannerStream: MediaStream | null;
  onConnected: (remoteStream: MediaStream, pc: RTCPeerConnection) => void;
  onClose: () => void;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export default function PeerConnect({ scannerStream, onConnected, onClose }: Props) {
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);
  const [offerQr, setOfferQr] = useState<string | null>(null);
  const [qrSize, setQrSize] = useState<number>(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const scannerVideoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<ReturnType<typeof startQrScan> | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      scannerRef.current?.stop();
      if (step !== 'connected') pcRef.current?.close();
    };
  }, [step]);

  const makeOffer = async () => {
    setError(null);
    setStep('making-offer');
    try {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      // We only want to RECEIVE video from phone
      pc.addTransceiver('video', { direction: 'recvonly' });

      pc.ontrack = (ev) => {
        const [stream] = ev.streams;
        if (stream) {
          setStep('connected');
          scannerRef.current?.stop();
          onConnected(stream, pc);
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setError(`Kết nối ${pc.connectionState}`);
          setStep('error');
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      // Wait for ICE gathering complete (non-trickle)
      await waitIceComplete(pc);
      const payload = await packPayload('O', pc.localDescription!.sdp);
      const dataUrl = await renderQrToDataUrl(payload, 520);
      setQrSize(payload.length);
      setOfferQr(dataUrl);
      setStep('show-offer');
    } catch (e) {
      setError((e as Error).message || 'Lỗi tạo offer');
      setStep('error');
    }
  };

  const startScanning = () => {
    setStep('scanning-answer');
    setTimeout(() => {
      const v = scannerVideoRef.current;
      if (!v || !scannerStream) {
        setError('Không có camera để quét. Hãy cho phép webcam.');
        setStep('error');
        return;
      }
      v.srcObject = scannerStream;
      v.play().catch(() => {});
      scannerRef.current = startQrScan(v, async (text) => {
        const parsed = await unpackPayload(text);
        if (!parsed || parsed.kind !== 'A') {
          setError('QR không đúng định dạng answer.');
          setStep('error');
          return;
        }
        try {
          setStep('connecting');
          await pcRef.current!.setRemoteDescription({ type: 'answer', sdp: parsed.sdp });
          // ontrack will fire → onConnected → step='connected'
        } catch (e) {
          setError((e as Error).message || 'Không thể áp answer');
          setStep('error');
        }
      });
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full text-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <h2 className="font-bold text-lg flex items-center gap-2">📱 Kết nối điện thoại</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10" title="Đóng">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-200">
              ⚠ {error}
            </div>
          )}

          {step === 'idle' && (
            <div className="text-center space-y-4 py-4">
              <div className="text-4xl">🤝</div>
              <p className="text-white/80 text-sm max-w-md mx-auto">
                Đồng bộ <b>thuần client</b> (zero-server) qua 2 bước trao đổi QR:
              </p>
              <ol className="text-left text-sm text-white/70 max-w-md mx-auto space-y-1.5 list-decimal pl-5">
                <li>Máy tính hiện QR-Offer → điện thoại quét.</li>
                <li>Điện thoại hiện QR-Answer → máy tính quét.</li>
                <li>Kết nối P2P WebRTC được thiết lập, camera phone stream về đây.</li>
              </ol>
              <p className="text-xs text-white/50">
                Mở trên điện thoại: <code className="bg-white/10 px-2 py-0.5 rounded">/photobooth/phone</code>
              </p>
              <button
                onClick={makeOffer}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold shadow-lg hover:brightness-110"
              >
                Bắt đầu →
              </button>
            </div>
          )}

          {step === 'making-offer' && (
            <div className="text-center py-8">
              <div className="inline-block w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3" />
              <p className="text-white/70">Đang chuẩn bị QR-Offer (gom ICE)…</p>
            </div>
          )}

          {step === 'show-offer' && offerQr && (
            <div className="grid md:grid-cols-2 gap-4 items-center">
              <div className="bg-white p-3 rounded-xl">
                <img src={offerQr} alt="Offer QR" className="w-full h-auto" />
              </div>
              <div className="space-y-3 text-sm">
                <p className="font-semibold">Bước 1 · Điện thoại quét QR này</p>
                <p className="text-white/70">
                  Mở trên điện thoại cùng URL <code className="bg-white/10 px-1.5 py-0.5 rounded">/photobooth/phone</code>,
                  cho phép camera, nhấn <b>Quét QR</b> rồi hướng vào đây.
                </p>
                <p className="text-xs text-white/40">Payload: {qrSize} ký tự</p>
                <button
                  onClick={startScanning}
                  className="w-full px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 font-bold shadow-lg hover:brightness-110"
                >
                  Xong bước 1 → Quét QR-Answer
                </button>
              </div>
            </div>
          )}

          {step === 'scanning-answer' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-center">Bước 2 · Hướng camera máy tính vào QR trên điện thoại</p>
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                <video ref={scannerVideoRef} playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border-2 border-emerald-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-center text-xs bg-black/60 rounded-full py-1">
                  Đang tìm QR…
                </div>
              </div>
            </div>
          )}

          {step === 'connecting' && (
            <div className="text-center py-8">
              <div className="inline-block w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3" />
              <p className="text-white/70">Đang thiết lập kết nối P2P…</p>
            </div>
          )}

          {step === 'connected' && (
            <div className="text-center py-6 space-y-2">
              <div className="text-5xl">✅</div>
              <p className="font-bold">Đã kết nối!</p>
              <p className="text-sm text-white/70">Đang stream camera điện thoại về máy tính.</p>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-4">
              <button
                onClick={() => {
                  setError(null);
                  setOfferQr(null);
                  pcRef.current?.close();
                  pcRef.current = null;
                  scannerRef.current?.stop();
                  setStep('idle');
                }}
                className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm"
              >
                Thử lại
              </button>
            </div>
          )}
        </div>
      </div>
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
    // Safety timeout 4s
    setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', check);
      resolve();
    }, 4000);
  });
}

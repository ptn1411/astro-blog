import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ARMask, Frame3D, Particles, VideoPlane, type FaceData } from './filters';
import { getFaceLandmarker } from './faceLandmarker';
import PeerConnect from './PeerConnect';

type ShaderMode = 'none' | 'vhs' | 'neon' | 'bw' | 'dream';

interface SceneProps {
  videoEl: HTMLVideoElement | null;
  aspect: number;
  enableMask: boolean;
  enableParticles: boolean;
  enableFrame: boolean;
  shader: ShaderMode;
  onFrameReady: (gl: THREE.WebGLRenderer, scene: THREE.Scene, cam: THREE.Camera) => void;
}

function Scene({
  videoEl,
  aspect,
  enableMask,
  enableParticles,
  enableFrame,
  shader,
  onFrameReady,
}: SceneProps) {
  const [videoTex, setVideoTex] = useState<THREE.VideoTexture | null>(null);
  const [face, setFace] = useState<FaceData>({ points: null });
  const { gl, scene, camera } = useThree();
  const lastDetect = useRef(0);

  useEffect(() => {
    if (!videoEl) return;
    const tex = new THREE.VideoTexture(videoEl);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    setVideoTex(tex);
    return () => tex.dispose();
  }, [videoEl]);

  // Face landmarker detection loop (runs ~20fps independently)
  useEffect(() => {
    if (!videoEl || !enableMask) {
      setFace({ points: null });
      return;
    }
    let active = true;
    let raf = 0;
    let landmarker: Awaited<ReturnType<typeof getFaceLandmarker>> | null = null;

    getFaceLandmarker()
      .then((lm) => {
        landmarker = lm;
      })
      .catch((e) => console.error('[Photobooth] Face landmarker load failed:', e));

    const loop = (t: number) => {
      if (!active) return;
      if (landmarker && videoEl.readyState >= 2 && t - lastDetect.current > 50) {
        lastDetect.current = t;
        try {
          const res = landmarker.detectForVideo(videoEl, performance.now());
          if (res.faceLandmarks && res.faceLandmarks.length > 0) {
            setFace({ points: res.faceLandmarks[0].map((p) => ({ x: p.x, y: p.y, z: p.z })) });
          } else {
            setFace({ points: null });
          }
        } catch (e) {
          /* noop */
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      active = false;
      cancelAnimationFrame(raf);
    };
  }, [videoEl, enableMask]);

  useFrame(() => {
    onFrameReady(gl, scene, camera);
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 2, 2]} intensity={1.2} />
      <VideoPlane videoTexture={videoTex} aspect={aspect} shader={shader} />
      {enableMask && <ARMask face={face} aspect={aspect} />}
      {enableParticles && <Particles aspect={aspect} />}
      {enableFrame && <Frame3D aspect={aspect} />}
    </>
  );
}

export default function Photobooth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aspect, setAspect] = useState(16 / 9);

  const [enableMask, setEnableMask] = useState(true);
  const [enableParticles, setEnableParticles] = useState(false);
  const [enableFrame, setEnableFrame] = useState(false);
  const [shader, setShader] = useState<ShaderMode>('none');

  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const camRef = useRef<THREE.Camera | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [strip, setStrip] = useState<string[] | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownSec, setCountdownSec] = useState<3 | 5 | 10>(3);
  const [burstMode, setBurstMode] = useState(false);
  const [burstProgress, setBurstProgress] = useState<{ current: number; total: number } | null>(null);
  const burstCancelRef = useRef(false);

  // Peer connect (phone-as-camera)
  const [peerOpen, setPeerOpen] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerPcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
          const w = videoRef.current.videoWidth || 1280;
          const h = videoRef.current.videoHeight || 720;
          setAspect(w / h);
          setReady(true);
        }
      } catch (e) {
        setError((e as Error).message || 'Không thể truy cập camera');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  // When remote stream becomes active, swap the video source
  useEffect(() => {
    if (!videoRef.current) return;
    const src = remoteStream ?? stream;
    if (!src) return;
    videoRef.current.srcObject = src;
    videoRef.current.play().catch(() => {});
    const onMeta = () => {
      const w = videoRef.current!.videoWidth || 1280;
      const h = videoRef.current!.videoHeight || 720;
      setAspect(w / h);
      setReady(true);
    };
    videoRef.current.addEventListener('loadedmetadata', onMeta, { once: true });
    return () => videoRef.current?.removeEventListener('loadedmetadata', onMeta);
  }, [remoteStream, stream]);

  const handlePeerConnected = useCallback((rs: MediaStream, pc: RTCPeerConnection) => {
    peerPcRef.current?.close();
    peerPcRef.current = pc;
    setRemoteStream(rs);
    setPeerOpen(false);
  }, []);

  const disconnectPeer = useCallback(() => {
    peerPcRef.current?.close();
    peerPcRef.current = null;
    setRemoteStream(null);
  }, []);

  const handleFrameReady = useCallback(
    (gl: THREE.WebGLRenderer, scene: THREE.Scene, cam: THREE.Camera) => {
      glRef.current = gl;
      sceneRef.current = scene;
      camRef.current = cam;
    },
    []
  );

  const snapFrame = useCallback((): string | null => {
    const gl = glRef.current;
    const scene = sceneRef.current;
    const cam = camRef.current;
    if (!gl || !scene || !cam) return null;
    gl.render(scene, cam);
    return gl.domElement.toDataURL('image/png');
  }, []);

  const runCountdown = useCallback(
    (sec: number) =>
      new Promise<void>((resolve) => {
        setCountdown(sec);
        let n = sec;
        const tick = () => {
          if (burstCancelRef.current) {
            setCountdown(null);
            resolve();
            return;
          }
          n--;
          if (n <= 0) {
            setCountdown(null);
            resolve();
          } else {
            setCountdown(n);
            setTimeout(tick, 1000);
          }
        };
        setTimeout(tick, 1000);
      }),
    []
  );

  const flash = useCallback(() => {
    // quick visual flash via body class? Use a state instead for cleanliness.
    document.body.classList.add('photobooth-flash');
    setTimeout(() => document.body.classList.remove('photobooth-flash'), 180);
  }, []);

  const startCapture = useCallback(async () => {
    if (countdown !== null || burstProgress !== null) return;
    burstCancelRef.current = false;

    if (!burstMode) {
      await runCountdown(countdownSec);
      if (burstCancelRef.current) return;
      flash();
      const url = snapFrame();
      if (url) setCaptured(url);
      return;
    }

    // Burst mode: 4 shots, each with its own countdown
    const total = 4;
    const shots: string[] = [];
    setBurstProgress({ current: 0, total });
    for (let i = 0; i < total; i++) {
      setBurstProgress({ current: i + 1, total });
      await runCountdown(i === 0 ? countdownSec : Math.min(countdownSec, 3));
      if (burstCancelRef.current) break;
      flash();
      const url = snapFrame();
      if (url) shots.push(url);
      await new Promise((r) => setTimeout(r, 400));
    }
    setBurstProgress(null);
    if (shots.length > 0) setStrip(shots);
  }, [burstMode, countdown, countdownSec, runCountdown, snapFrame, flash, burstProgress]);

  const cancelCapture = useCallback(() => {
    burstCancelRef.current = true;
    setBurstProgress(null);
    setCountdown(null);
  }, []);

  const download = useCallback((dataUrl: string, suffix = '') => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `photobooth-${Date.now()}${suffix}.png`;
    a.click();
  }, []);

  const downloadStripComposite = useCallback(async () => {
    if (!strip || strip.length === 0) return;
    // Compose into a vertical strip
    const imgs = await Promise.all(
      strip.map(
        (src) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          })
      )
    );
    const w = imgs[0].width;
    const h = imgs[0].height;
    const pad = 24;
    const stripH = imgs.length * h + (imgs.length + 1) * pad + 80;
    const canvas = document.createElement('canvas');
    canvas.width = w + pad * 2;
    canvas.height = stripH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    imgs.forEach((img, i) => {
      ctx.drawImage(img, pad, pad + i * (h + pad), w, h);
    });
    ctx.fillStyle = '#111';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📸 Photobooth 3D', canvas.width / 2, stripH - 32);
    download(canvas.toDataURL('image/png'), '-strip');
  }, [strip, download]);

  return (
    <div className="photobooth-root relative w-screen h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* hidden video source (also used as R3F texture source) */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute opacity-0 pointer-events-none"
        style={{ width: 1, height: 1 }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">📸 Photobooth 3D</h1>
          <p className="text-xs md:text-sm text-white/70">Chụp ảnh AR với hiệu ứng 3D</p>
        </div>
        <a
          href="/"
          className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm transition"
        >
          ← Trang chủ
        </a>
      </div>

      {/* Canvas area */}
      <div className="absolute inset-0 flex items-center justify-center">
        {error ? (
          <div className="text-center p-8 max-w-md">
            <div className="text-5xl mb-4">📷</div>
            <h2 className="text-xl font-bold mb-2">Không thể truy cập camera</h2>
            <p className="text-white/70 text-sm mb-4">{error}</p>
            <p className="text-white/50 text-xs">
              Hãy cấp quyền camera trong thanh địa chỉ trình duyệt rồi tải lại trang.
            </p>
          </div>
        ) : !ready ? (
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
            <p className="text-white/70">Đang khởi động camera…</p>
          </div>
        ) : (
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/10"
            style={{ aspectRatio: aspect, width: 'min(92vw, 1100px)', maxHeight: '78vh' }}
          >
            <Canvas
              orthographic
              camera={{ position: [0, 0, 2], zoom: 1, near: 0.1, far: 10 }}
              gl={{ preserveDrawingBuffer: true, antialias: true }}
              style={{ width: '100%', height: '100%' }}
            >
              <OrthoCameraSetup aspect={aspect} />
              <Scene
                videoEl={videoRef.current}
                aspect={aspect}
                enableMask={enableMask}
                enableParticles={enableParticles}
                enableFrame={enableFrame}
                shader={shader}
                onFrameReady={handleFrameReady}
              />
            </Canvas>

            {/* countdown overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-[12rem] font-black text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.7)] animate-pulse leading-none">
                  {countdown}
                </div>
              </div>
            )}

            {/* burst progress chip */}
            {burstProgress && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 pointer-events-none">
                <span>🎞️</span>
                <span>
                  Ảnh {burstProgress.current}/{burstProgress.total}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters dock */}
      {ready && !error && (
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 py-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <div className="max-w-5xl mx-auto flex flex-col gap-4">
            {/* Toggles row */}
            <div className="flex flex-wrap justify-center gap-2">
              <FilterToggle active={enableMask} onClick={() => setEnableMask((v) => !v)} icon="🎭" label="AR Mask" />
              <FilterToggle active={enableParticles} onClick={() => setEnableParticles((v) => !v)} icon="✨" label="Particles" />
              <FilterToggle active={enableFrame} onClick={() => setEnableFrame((v) => !v)} icon="🖼️" label="Frame 3D" />
              {remoteStream ? (
                <button
                  onClick={disconnectPeer}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                  title="Ngắt điện thoại, dùng lại webcam"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  📱 Đang dùng điện thoại · Ngắt
                </button>
              ) : (
                <button
                  onClick={() => setPeerOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white/10 hover:bg-white/20 text-white/90"
                  title="Kết nối điện thoại làm camera qua QR"
                >
                  <span>📱</span>
                  <span>Dùng điện thoại</span>
                </button>
              )}
            </div>

            {/* Shader row */}
            <div className="flex flex-wrap justify-center gap-2">
              {(['none', 'vhs', 'neon', 'bw', 'dream'] as ShaderMode[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setShader(s)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                    shader === s
                      ? 'bg-white text-slate-900'
                      : 'bg-white/10 hover:bg-white/20 text-white/90'
                  }`}
                >
                  {s === 'none' ? 'Gốc' : s.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Settings + capture */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {/* Countdown selector */}
              <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
                <span className="text-xs px-2 text-white/70">⏱</span>
                {([3, 5, 10] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setCountdownSec(s)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      countdownSec === s ? 'bg-white text-slate-900' : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>

              {/* Burst toggle */}
              <button
                onClick={() => setBurstMode((v) => !v)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition flex items-center gap-2 ${
                  burstMode
                    ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-white shadow-lg'
                    : 'bg-white/10 hover:bg-white/20 text-white/80'
                }`}
                title="Chụp liên tục 4 ảnh"
              >
                <span>🎞️</span>
                <span>Strip 4 ảnh</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-4">
              {countdown !== null || burstProgress !== null ? (
                <button
                  onClick={cancelCapture}
                  className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 ring-4 ring-red-300/40 transition-all flex items-center justify-center text-2xl shadow-2xl font-bold text-white"
                  title="Huỷ"
                >
                  ✕
                </button>
              ) : (
                <button
                  onClick={startCapture}
                  className="w-20 h-20 rounded-full bg-white ring-4 ring-white/40 hover:ring-8 hover:ring-white/60 transition-all flex items-center justify-center text-3xl shadow-2xl"
                  title={burstMode ? `Chụp liên tục 4 ảnh (đếm ${countdownSec}s)` : `Chụp ảnh (đếm ${countdownSec}s)`}
                >
                  {burstMode ? '🎞️' : '📸'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Single captured modal */}
      {captured && (
        <div
          className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setCaptured(null)}
        >
          <div
            className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-2xl max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={captured} alt="Captured" className="w-full h-auto" />
            <div className="p-4 flex items-center justify-between gap-3 border-t border-white/10">
              <button
                onClick={() => setCaptured(null)}
                className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold"
              >
                Chụp lại
              </button>
              <button
                onClick={() => download(captured)}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-sm font-bold shadow-lg"
              >
                ⬇ Tải PNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Peer connect modal */}
      {peerOpen && (
        <PeerConnect
          scannerStream={stream}
          onConnected={handlePeerConnected}
          onClose={() => setPeerOpen(false)}
        />
      )}

      {/* Strip modal (burst mode) */}
      {strip && strip.length > 0 && (
        <div
          className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-auto"
          onClick={() => setStrip(null)}
        >
          <div
            className="relative bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-center font-bold text-lg mb-3">🎞️ Strip {strip.length} ảnh</h3>
            <div className="bg-white rounded-lg p-3 space-y-2 max-h-[65vh] overflow-y-auto">
              {strip.map((src, i) => (
                <div key={i} className="relative group">
                  <img src={src} alt={`Shot ${i + 1}`} className="w-full rounded" />
                  <button
                    onClick={() => download(src, `-${i + 1}`)}
                    className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    ⬇
                  </button>
                </div>
              ))}
            </div>
            <div className="p-3 flex items-center justify-between gap-3 mt-2">
              <button
                onClick={() => setStrip(null)}
                className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold"
              >
                Chụp lại
              </button>
              <button
                onClick={downloadStripComposite}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-sm font-bold shadow-lg"
              >
                ⬇ Tải cả strip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Adjust ortho camera to match aspect so plane fills exactly */
function OrthoCameraSetup({ aspect }: { aspect: number }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    const viewAspect = size.width / size.height;
    // Fit to plane of width=aspect, height=1
    if (viewAspect > aspect) {
      cam.top = 0.5;
      cam.bottom = -0.5;
      cam.left = -0.5 * viewAspect;
      cam.right = 0.5 * viewAspect;
    } else {
      cam.left = -aspect / 2;
      cam.right = aspect / 2;
      cam.top = (aspect / viewAspect) / 2;
      cam.bottom = -(aspect / viewAspect) / 2;
    }
    cam.updateProjectionMatrix();
  }, [aspect, size, camera]);
  return null;
}

function FilterToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
        active
          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
          : 'bg-white/10 hover:bg-white/20 text-white/80'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

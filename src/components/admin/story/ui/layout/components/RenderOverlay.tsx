import React from 'react';
import { resolveMediaUrl } from '~/utils/mediaUrl';
import { CanvasElement } from '../../canvas';
import { RESOLUTION_MAP, type ExportSettings } from '../../modals';
import type { StorySlide } from '../../../types';

interface RenderOverlayProps {
  isRendering: boolean;
  renderProgress: number;
  loadingStatus: string;
  currentSlide: StorySlide | null;
  exportSettings: ExportSettings;
  renderTime: number;
}

export function RenderOverlay({
  isRendering,
  renderProgress,
  loadingStatus,
  currentSlide,
  exportSettings,
  renderTime,
}: RenderOverlayProps) {
  if (!isRendering) return null;

  return (
    <>
      {/* Loading Overlay */}
      <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-center text-white overflow-hidden">
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #0f172a 50%, #1e293b 75%, #0f172a 100%)',
            backgroundSize: '400% 400%',
            animation: 'gradientShift 8s ease infinite',
          }}
        />
        <style>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes spinnerPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
            50% { box-shadow: 0 0 24px 8px rgba(59, 130, 246, 0.15); }
          }
        `}</style>

        {/* Spinner with pulsing glow */}
        <div className="relative mb-6" style={{ animation: 'spinnerPulse 2s ease-in-out infinite' }}>
          <svg width={64} height={64} viewBox="0 0 24 24" fill="none" className="animate-spin">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-slate-700" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="url(#render-gradient)" strokeWidth="2.5" strokeLinecap="round" />
            <defs>
              <linearGradient id="render-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h2 className="text-xl font-bold mb-2 relative z-10">{loadingStatus || 'Rendering Frames'}</h2>
        <p className="text-slate-400 text-sm max-w-md text-center relative z-10 mb-1">
          Please do not switch tabs or minimize the window.
        </p>
        <p className="text-2xl font-mono font-bold text-blue-400 mb-4 relative z-10 tabular-nums">
          {renderProgress}%
        </p>

        {/* Progress bar with shimmer */}
        <div className="w-72 h-2.5 bg-slate-800 rounded-full overflow-hidden relative z-10 border border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 relative rounded-full"
            style={{ width: `${renderProgress}%` }}
          >
            {/* Shimmer overlay */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              style={{ animation: 'shimmer 2s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>

      {/* Hidden Render Container */}
      {currentSlide && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: `${RESOLUTION_MAP[exportSettings.resolution].width}px`,
            height: `${RESOLUTION_MAP[exportSettings.resolution].height}px`,
            overflow: 'hidden',
            backgroundColor: '#ffffff',
          }}
        >
          <div
            id="render-container"
            className="relative bg-white"
            style={{
              width: '360px',
              height: '640px',
              transform: `scale(${RESOLUTION_MAP[exportSettings.resolution].width / 360})`,
              transformOrigin: 'top left',
            }}
          >
            {/* Background */}
            {currentSlide.background.type === 'color' && (
              <div
                className="absolute inset-0 w-full h-full"
                style={{ backgroundColor: currentSlide.background.value }}
              />
            )}
            {currentSlide.background.type === 'gradient' && currentSlide.background.gradient && (
              <div
                className="absolute inset-0 w-full h-full"
                style={{
                  background:
                    currentSlide.background.gradient.type === 'radial'
                      ? `radial-gradient(circle, ${currentSlide.background.gradient.colors.map((c) => `${c.color} ${c.position}%`).join(', ')})`
                      : `linear-gradient(${currentSlide.background.gradient.angle || 0}deg, ${currentSlide.background.gradient.colors.map((c) => `${c.color} ${c.position}%`).join(', ')})`,
                }}
              />
            )}
            {currentSlide.background.type === 'image' && (
              <img
                src={resolveMediaUrl(currentSlide.background.value)}
                className="absolute inset-0 w-full h-full object-cover"
                alt="bg"
              />
            )}

            {/* Elements */}
            {currentSlide.elements.map((el) => (
              <CanvasElement
                key={`${el.id}-${renderTime}`}
                element={el}
                isSelected={false}
                onSelect={() => {}}
                onUpdate={() => {}}
                currentTime={renderTime}
                playAnimation={false}
                snapToGrid={false}
                gridSize={0}
                renderMode={true}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

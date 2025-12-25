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
      <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold mb-2">{loadingStatus || `Rendering Frames (${renderProgress}%)`}</h2>
        <p className="text-slate-400 text-sm max-w-md text-center">
          Please do not switch tabs or minimize the window.
        </p>
        <div className="w-64 h-2 bg-slate-700 rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${renderProgress}%` }} />
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

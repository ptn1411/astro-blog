import React from 'react';
import { resolveMediaUrl } from '~/utils/mediaUrl';
import { CanvasElement } from '../../canvas';
import type { CanvasState, ElementStyle, StoryElement, StorySlide } from '../../../types';

interface StoryCanvasProps {
  currentSlide: StorySlide;
  canvasState: CanvasState;
  selectedElementIds: string[];
  currentTime: number;
  animationTrigger: number;
  onSelectElement: (id: string, multiSelect?: boolean) => void;
  onUpdateElement: (id: string, updates: Partial<StoryElement> | Partial<ElementStyle>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDeselectAll: () => void;
}

export function StoryCanvas({
  currentSlide,
  canvasState,
  selectedElementIds,
  currentTime,
  animationTrigger,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onToggleLock,
  onDeselectAll,
}: StoryCanvasProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
      {/* Canvas container with zoom */}
      <div
        className="relative transition-transform duration-200"
        style={{
          transform: `scale(${canvasState.zoom})`,
          transformOrigin: 'center',
        }}
      >
        {/* Canvas */}
        <div
          className="relative shadow-2xl rounded-lg overflow-hidden"
          style={{ width: 360, height: 640 }}
          onPointerDown={onDeselectAll}
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
              alt="slide-bg"
            />
          )}
          {currentSlide.background.type === 'video' && (
            <video
              src={resolveMediaUrl(currentSlide.background.value)}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              loop
              autoPlay
            />
          )}

          {/* Grid overlay */}
          {canvasState.showGrid && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
                `,
                backgroundSize: `${canvasState.gridSize}px ${canvasState.gridSize}px`,
              }}
            />
          )}

          {/* Safe zone guides */}
          {canvasState.showSafeZone && (
            <>
              <div className="absolute top-10 inset-x-0 h-px bg-blue-500/30 pointer-events-none" />
              <div className="absolute bottom-20 inset-x-0 h-px bg-blue-500/30 pointer-events-none" />
              <div className="absolute inset-y-0 left-4 w-px bg-blue-500/30 pointer-events-none" />
              <div className="absolute inset-y-0 right-4 w-px bg-blue-500/30 pointer-events-none" />
            </>
          )}

          {/* Elements */}
          {currentSlide.elements.map((element) => (
            <CanvasElement
              key={element.id}
              element={element}
              isSelected={selectedElementIds.includes(element.id)}
              currentTime={currentTime}
              onSelect={(multiSelect) => onSelectElement(element.id, multiSelect)}
              onUpdate={(updates) => onUpdateElement(element.id, updates)}
              onDelete={() => onDeleteElement(element.id)}
              onDuplicate={() => onDuplicateElement(element.id)}
              onToggleLock={() => onToggleLock(element.id)}
              snapToGrid={canvasState.snapToGrid}
              gridSize={canvasState.gridSize}
              zoom={canvasState.zoom}
              playAnimation={selectedElementIds.includes(element.id) && animationTrigger > 0}
            />
          ))}
        </div>

        {/* Canvas info */}
        <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
          <span className="text-[10px] text-slate-500 font-mono">360 × 640 • 9:16 Story</span>
        </div>
      </div>
    </div>
  );
}

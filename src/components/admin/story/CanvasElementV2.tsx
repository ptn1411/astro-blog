import { Copy, Lock, Trash2, Unlock } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import type { ElementStyle, StoryElement } from './types';

interface CanvasElementProps {
  element: StoryElement;
  isSelected: boolean;
  onSelect: (multiSelect?: boolean) => void;
  onUpdate: (updates: Partial<ElementStyle>) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onToggleLock?: () => void;
  snapToGrid?: boolean;
  gridSize?: number;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
type DragAction = 'move' | 'resize' | 'rotate';

export const CanvasElement: React.FC<CanvasElementProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleLock,
  snapToGrid = false,
  gridSize = 10,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [activeAction, setActiveAction] = useState<DragAction | null>(null);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const startPos = useRef({ x: 0, y: 0 });
  const initialStyle = useRef(element.style);

  const snapValue = useCallback(
    (value: number) => {
      if (!snapToGrid) return value;
      return Math.round(value / gridSize) * gridSize;
    },
    [snapToGrid, gridSize]
  );

  // Handle drag for moving
  const handlePointerDown = (e: React.PointerEvent) => {
    if (element.locked) return;
    e.stopPropagation();
    onSelect(e.shiftKey);

    setActiveAction('move');
    startPos.current = { x: e.clientX, y: e.clientY };
    initialStyle.current = { ...element.style };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startPos.current.x;
      const deltaY = moveEvent.clientY - startPos.current.y;

      onUpdate({
        x: snapValue(initialStyle.current.x + deltaX),
        y: snapValue(initialStyle.current.y + deltaY),
      });
    };

    const handlePointerUp = () => {
      setActiveAction(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Handle resize
  const handleResizeStart = (e: React.PointerEvent, handle: ResizeHandle) => {
    if (element.locked) return;
    e.stopPropagation();

    setActiveAction('resize');
    setActiveHandle(handle);
    startPos.current = { x: e.clientX, y: e.clientY };
    initialStyle.current = { ...element.style };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startPos.current.x;
      const deltaY = moveEvent.clientY - startPos.current.y;

      const updates: Partial<ElementStyle> = {};
      const { x, y, width, height } = initialStyle.current;

      // Calculate new dimensions based on handle
      switch (handle) {
        case 'nw':
          updates.x = snapValue(x + deltaX);
          updates.y = snapValue(y + deltaY);
          updates.width = Math.max(20, width - deltaX);
          updates.height = Math.max(20, height - deltaY);
          break;
        case 'n':
          updates.y = snapValue(y + deltaY);
          updates.height = Math.max(20, height - deltaY);
          break;
        case 'ne':
          updates.y = snapValue(y + deltaY);
          updates.width = Math.max(20, width + deltaX);
          updates.height = Math.max(20, height - deltaY);
          break;
        case 'e':
          updates.width = Math.max(20, width + deltaX);
          break;
        case 'se':
          updates.width = Math.max(20, width + deltaX);
          updates.height = Math.max(20, height + deltaY);
          break;
        case 's':
          updates.height = Math.max(20, height + deltaY);
          break;
        case 'sw':
          updates.x = snapValue(x + deltaX);
          updates.width = Math.max(20, width - deltaX);
          updates.height = Math.max(20, height + deltaY);
          break;
        case 'w':
          updates.x = snapValue(x + deltaX);
          updates.width = Math.max(20, width - deltaX);
          break;
      }

      // Maintain aspect ratio if shift is held
      if (moveEvent.shiftKey && (handle === 'nw' || handle === 'ne' || handle === 'se' || handle === 'sw')) {
        const aspectRatio = initialStyle.current.width / initialStyle.current.height;
        if (updates.width && updates.height) {
          updates.height = updates.width / aspectRatio;
        }
      }

      onUpdate(updates);
    };

    const handlePointerUp = () => {
      setActiveAction(null);
      setActiveHandle(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Handle rotation
  const handleRotateStart = (e: React.PointerEvent) => {
    if (element.locked) return;
    e.stopPropagation();

    setActiveAction('rotate');
    const rect = elementRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    initialStyle.current = { ...element.style };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
      let rotation = initialStyle.current.rotation + ((currentAngle - startAngle) * 180) / Math.PI;

      // Snap to 15 degree increments if shift is held
      if (moveEvent.shiftKey) {
        rotation = Math.round(rotation / 15) * 15;
      }

      onUpdate({ rotation });
    };

    const handlePointerUp = () => {
      setActiveAction(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // Render element content
  const renderContent = () => {
    switch (element.type) {
      case 'text':
        return (
          <div
            className="w-full h-full flex items-center justify-center p-2"
            style={{
              color: element.style.color,
              fontSize: element.style.fontSize,
              fontFamily: element.style.fontFamily,
              fontWeight: element.style.fontWeight || 'normal',
              textAlign: element.style.textAlign || 'center',
              lineHeight: element.style.lineHeight || 1.2,
              letterSpacing: element.style.letterSpacing,
              textShadow: element.style.textShadow,
            }}
          >
            {element.content}
          </div>
        );
      case 'image':
        return (
          <img
            src={element.content}
            alt="element"
            className="w-full h-full object-cover pointer-events-none"
            style={{ borderRadius: element.style.borderRadius }}
            draggable={false}
          />
        );
      case 'video':
        return (
          <video
            src={element.content}
            className="w-full h-full object-cover pointer-events-none"
            style={{ borderRadius: element.style.borderRadius }}
            muted
            loop
          />
        );
      case 'shape':
        return renderShape();
      case 'sticker':
      case 'gif':
        return (
          <img
            src={element.content}
            alt={element.type}
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        );
      case 'button':
        return (
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer"
            style={{
              color: element.style.color || '#ffffff',
              fontSize: element.style.fontSize || 16,
              fontFamily: element.style.fontFamily,
              fontWeight: element.style.fontWeight || 'semibold',
              textAlign: (element.style.textAlign as React.CSSProperties['textAlign']) || 'center',
              borderRadius: element.style.borderRadius || 8,
              backgroundColor:
                element.button?.variant === 'outline' || element.button?.variant === 'ghost'
                  ? 'transparent'
                  : element.style.backgroundColor || '#3b82f6',
              border:
                element.button?.variant === 'outline'
                  ? `2px solid ${element.style.backgroundColor || '#3b82f6'}`
                  : undefined,
            }}
          >
            {element.content}
            {element.button?.href && element.button.href !== '#' && (
              <svg className="w-4 h-4 ml-1.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Render shape
  const renderShape = () => {
    const { backgroundColor, borderRadius, borderWidth, borderColor } = element.style;

    switch (element.shapeType) {
      case 'circle':
        return (
          <div
            className="w-full h-full rounded-full"
            style={{
              backgroundColor,
              borderWidth,
              borderColor,
              borderStyle: borderWidth ? 'solid' : 'none',
            }}
          />
        );
      case 'triangle':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              backgroundColor,
            }}
          />
        );
      case 'star':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath:
                'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              backgroundColor,
            }}
          />
        );
      case 'heart':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill={backgroundColor || '#ef4444'} className="w-full h-full">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        );
      case 'arrow':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(0% 40%, 60% 40%, 60% 0%, 100% 50%, 60% 100%, 60% 60%, 0% 60%)',
              backgroundColor,
            }}
          />
        );
      case 'line':
        return (
          <div
            className="absolute top-1/2 left-0 right-0 h-1"
            style={{
              backgroundColor,
              transform: 'translateY(-50%)',
            }}
          />
        );
      // Polygons
      case 'pentagon':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
              backgroundColor,
            }}
          />
        );
      case 'hexagon':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              backgroundColor,
            }}
          />
        );
      case 'octagon':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
              backgroundColor,
            }}
          />
        );
      case 'diamond':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              backgroundColor,
            }}
          />
        );
      // Advanced shapes
      case 'parallelogram':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)',
              backgroundColor,
            }}
          />
        );
      case 'trapezoid':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
              backgroundColor,
            }}
          />
        );
      case 'plus':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath:
                'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)',
              backgroundColor,
            }}
          />
        );
      case 'cross':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath:
                'polygon(20% 0%, 0% 20%, 30% 50%, 0% 80%, 20% 100%, 50% 70%, 80% 100%, 100% 80%, 70% 50%, 100% 20%, 80% 0%, 50% 30%)',
              backgroundColor,
            }}
          />
        );
      case 'chevron':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%)',
              backgroundColor,
            }}
          />
        );
      case 'badge':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)',
              backgroundColor,
            }}
          />
        );
      case 'speech-bubble':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 70%, 30% 70%, 15% 100%, 20% 70%, 0% 70%)',
              backgroundColor,
              borderRadius: borderRadius || 8,
            }}
          />
        );
      case 'thought-bubble':
        return (
          <div className="w-full h-full relative">
            <div className="w-full h-[85%] rounded-full" style={{ backgroundColor }} />
            <div className="absolute bottom-[5%] left-[15%] w-[15%] h-[15%] rounded-full" style={{ backgroundColor }} />
            <div className="absolute bottom-0 left-[5%] w-[8%] h-[8%] rounded-full" style={{ backgroundColor }} />
          </div>
        );
      case 'explosion':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath:
                'polygon(50% 0%, 63% 25%, 98% 20%, 75% 45%, 95% 70%, 63% 65%, 50% 100%, 37% 65%, 5% 70%, 25% 45%, 2% 20%, 37% 25%)',
              backgroundColor,
            }}
          />
        );
      case 'wave':
        return (
          <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0 15 Q 12.5 0, 25 15 T 50 15 T 75 15 T 100 15 L 100 30 L 0 30 Z"
              fill={backgroundColor || '#3b82f6'}
            />
          </svg>
        );
      case 'arc':
        return (
          <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
            <path d="M 0 50 Q 50 0, 100 50 L 100 50 L 0 50 Z" fill={backgroundColor || '#3b82f6'} />
          </svg>
        );
      case 'ribbon':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath:
                'polygon(0% 30%, 15% 50%, 0% 70%, 30% 70%, 50% 100%, 70% 70%, 100% 70%, 85% 50%, 100% 30%, 70% 30%, 50% 0%, 30% 30%)',
              backgroundColor,
            }}
          />
        );
      default:
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor,
              borderRadius,
              borderWidth,
              borderColor,
              borderStyle: borderWidth ? 'solid' : 'none',
            }}
          />
        );
    }
  };

  // Background style with gradient support
  const getBackgroundStyle = (): React.CSSProperties => {
    // Don't apply background to shapes - they handle their own background
    if (element.type === 'shape') {
      return {};
    }
    if (element.style.gradient) {
      const { gradient } = element.style;
      const colorStops = gradient.colors.map((c) => `${c.color} ${c.position}%`).join(', ');
      if (gradient.type === 'radial') {
        return { background: `radial-gradient(circle, ${colorStops})` };
      }
      return { background: `linear-gradient(${gradient.angle || 0}deg, ${colorStops})` };
    }
    return { backgroundColor: element.style.backgroundColor };
  };

  // Don't render if element is hidden
  if (element.visible === false) {
    return null;
  }

  return (
    <>
      <div
        ref={elementRef}
        onPointerDown={handlePointerDown}
        onContextMenu={handleContextMenu}
        className={`absolute group transition-shadow ${
          element.locked ? 'cursor-not-allowed' : 'cursor-move'
        } ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:ring-1 hover:ring-blue-400'} ${
          activeAction ? 'z-50' : ''
        }`}
        style={{
          left: element.style.x,
          top: element.style.y,
          width: element.style.width,
          height: element.style.height,
          transform: `rotate(${element.style.rotation || 0}deg)`,
          zIndex: element.style.zIndex,
          opacity: element.style.opacity ?? 1,
          filter: element.style.blur ? `blur(${element.style.blur}px)` : undefined,
          boxShadow: element.style.boxShadow,
          ...getBackgroundStyle(),
        }}
      >
        {/* Content */}
        <div className="w-full h-full overflow-hidden select-none">{renderContent()}</div>

        {/* Lock indicator */}
        {element.locked && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-2 py-0.5 rounded text-xs flex items-center gap-1">
            <Lock size={10} /> Locked
          </div>
        )}

        {/* Selection handles */}
        {isSelected && !element.locked && (
          <>
            {/* Corner resize handles */}
            <div
              onPointerDown={(e) => handleResizeStart(e, 'nw')}
              className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize hover:bg-blue-100 transition-colors"
            />
            <div
              onPointerDown={(e) => handleResizeStart(e, 'ne')}
              className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize hover:bg-blue-100 transition-colors"
            />
            <div
              onPointerDown={(e) => handleResizeStart(e, 'se')}
              className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-se-resize hover:bg-blue-100 transition-colors"
            />
            <div
              onPointerDown={(e) => handleResizeStart(e, 'sw')}
              className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize hover:bg-blue-100 transition-colors"
            />

            {/* Edge resize handles */}
            <div
              onPointerDown={(e) => handleResizeStart(e, 'n')}
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-white border border-blue-500 rounded cursor-n-resize hover:bg-blue-100 transition-colors"
            />
            <div
              onPointerDown={(e) => handleResizeStart(e, 'e')}
              className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-6 bg-white border border-blue-500 rounded cursor-e-resize hover:bg-blue-100 transition-colors"
            />
            <div
              onPointerDown={(e) => handleResizeStart(e, 's')}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-white border border-blue-500 rounded cursor-s-resize hover:bg-blue-100 transition-colors"
            />
            <div
              onPointerDown={(e) => handleResizeStart(e, 'w')}
              className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-6 bg-white border border-blue-500 rounded cursor-w-resize hover:bg-blue-100 transition-colors"
            />

            {/* Rotation handle */}
            <div
              onPointerDown={handleRotateStart}
              className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-4 bg-green-500 border-2 border-white rounded-full cursor-grab hover:bg-green-400 transition-colors shadow-md"
              title="Rotate"
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-px h-4 bg-green-500" />
            </div>
          </>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setShowContextMenu(false)} />
          <div
            className="fixed z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 min-w-[150px]"
            style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          >
            <button
              onClick={() => {
                onDuplicate?.();
                setShowContextMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"
            >
              <Copy size={14} /> Duplicate
            </button>
            <button
              onClick={() => {
                onToggleLock?.();
                setShowContextMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"
            >
              {element.locked ? <Unlock size={14} /> : <Lock size={14} />}
              {element.locked ? 'Unlock' : 'Lock'}
            </button>
            <hr className="my-1 border-slate-600" />
            <button
              onClick={() => {
                onDelete?.();
                setShowContextMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </>
  );
};

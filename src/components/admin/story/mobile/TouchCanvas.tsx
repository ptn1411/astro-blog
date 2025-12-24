import React, { useRef, useState, useCallback } from 'react';
import { useGestureRecognizer, type Point, type SwipeDirection } from '~/hooks/useGestureRecognizer';
import type { StorySlide, StoryElement, ElementStyle } from '../types';

/**
 * Minimum touch target size for accessibility (44x44 pixels)
 * Requirement: 3.6
 */
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * Touch handle size - ensures minimum touch target
 */
export const TOUCH_HANDLE_SIZE = Math.max(MIN_TOUCH_TARGET_SIZE, 44);

/**
 * Props for TouchCanvas component
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
export interface TouchCanvasProps {
  /** Current slide data */
  slide: StorySlide;
  /** IDs of currently selected elements */
  selectedElementIds: string[];
  /** Callback when an element is selected */
  onElementSelect: (elementId: string, multiSelect?: boolean) => void;
  /** Callback when an element is updated */
  onElementUpdate: (elementId: string, updates: Partial<ElementStyle>) => void;
  /** Callback for pinch zoom gesture */
  onPinchZoom?: (elementId: string, scale: number) => void;
  /** Callback for rotation gesture */
  onRotate?: (elementId: string, angle: number) => void;
  /** Callback for long press (context menu) */
  onLongPress?: (elementId: string, position: Point) => void;
  /** Callback for double tap (text editing) */
  onDoubleTap?: (elementId: string) => void;
  /** Callback for swipe navigation */
  onSwipe?: (direction: SwipeDirection) => void;
  /** Callback when canvas background is tapped */
  onCanvasTap?: (position: Point) => void;
  /** Canvas zoom level */
  zoom?: number;
  /** Whether to show grid */
  showGrid?: boolean;
  /** Grid size in pixels */
  gridSize?: number;
  /** Whether to snap to grid */
  snapToGrid?: boolean;
  /** Canvas width */
  canvasWidth?: number;
  /** Canvas height */
  canvasHeight?: number;
  /** Children to render (elements) */
  children?: React.ReactNode;
}

/**
 * Resize handle position type
 */
type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/**
 * Active gesture state
 */
interface ActiveGesture {
  type: 'move' | 'resize' | 'rotate' | 'pinch';
  elementId: string;
  handle?: HandlePosition;
  initialStyle?: ElementStyle;
  initialScale?: number;
  initialRotation?: number;
}

/**
 * TouchCanvas Component
 * 
 * A touch-optimized canvas wrapper that provides gesture recognition for
 * mobile story editing. Implements touch-friendly resize handles (44x44 minimum),
 * pinch-to-zoom, rotation, and swipe navigation.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 * 
 * @example
 * ```tsx
 * <TouchCanvas
 *   slide={currentSlide}
 *   selectedElementIds={selectedIds}
 *   onElementSelect={(id) => setSelectedIds([id])}
 *   onElementUpdate={(id, updates) => updateElement(id, updates)}
 *   onPinchZoom={(id, scale) => handlePinchZoom(id, scale)}
 *   onRotate={(id, angle) => handleRotate(id, angle)}
 *   onLongPress={(id, pos) => showContextMenu(id, pos)}
 *   onDoubleTap={(id) => enterTextEditMode(id)}
 * >
 *   {elements.map(el => <CanvasElement key={el.id} element={el} />)}
 * </TouchCanvas>
 * ```
 */
export const TouchCanvas: React.FC<TouchCanvasProps> = ({
  slide,
  selectedElementIds,
  onElementSelect,
  onElementUpdate,
  onPinchZoom,
  onRotate,
  onLongPress,
  onDoubleTap,
  onSwipe,
  onCanvasTap,
  zoom = 1,
  showGrid = false,
  gridSize = 10,
  snapToGrid = false,
  canvasWidth = 360,
  canvasHeight = 640,
  children,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeGesture, setActiveGesture] = useState<ActiveGesture | null>(null);
  const [touchFeedback, setTouchFeedback] = useState<Point | null>(null);

  // Get element at position
  const getElementAtPosition = useCallback((position: Point): StoryElement | null => {
    if (!canvasRef.current) return null;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (position.x - rect.left) / zoom;
    const y = (position.y - rect.top) / zoom;

    // Check elements in reverse order (top to bottom in z-index)
    const sortedElements = [...slide.elements].sort((a, b) => 
      (b.style.zIndex || 0) - (a.style.zIndex || 0)
    );

    for (const element of sortedElements) {
      if (element.locked || element.visible === false) continue;
      
      const { x: ex, y: ey, width, height } = element.style;
      // Note: rotation is intentionally ignored for hit testing simplicity
      // For more accurate hit testing with rotation, we'd need to transform the point
      
      // Simple bounding box check
      if (x >= ex && x <= ex + width && y >= ey && y <= ey + height) {
        return element;
      }
    }

    return null;
  }, [slide.elements, zoom]);

  // Snap value to grid
  const snapValue = useCallback((value: number): number => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  // Handle tap on canvas
  const handleTap = useCallback((position: Point) => {
    const element = getElementAtPosition(position);
    
    if (element) {
      onElementSelect(element.id);
      // Show touch feedback
      setTouchFeedback(position);
      setTimeout(() => setTouchFeedback(null), 200);
    } else {
      // Deselect all
      onCanvasTap?.(position);
    }
  }, [getElementAtPosition, onElementSelect, onCanvasTap]);

  // Handle double tap
  const handleDoubleTap = useCallback((position: Point) => {
    const element = getElementAtPosition(position);
    
    if (element && element.type === 'text') {
      onDoubleTap?.(element.id);
    }
  }, [getElementAtPosition, onDoubleTap]);

  // Handle long press
  const handleLongPress = useCallback((position: Point) => {
    const element = getElementAtPosition(position);
    
    if (element) {
      onElementSelect(element.id);
      onLongPress?.(element.id, position);
    }
  }, [getElementAtPosition, onElementSelect, onLongPress]);

  // Handle pinch gesture
  const handlePinch = useCallback((scale: number, _center: Point) => {
    if (selectedElementIds.length !== 1) return;
    
    const elementId = selectedElementIds[0];
    const element = slide.elements.find(el => el.id === elementId);
    if (!element || element.locked) return;

    if (!activeGesture || activeGesture.type !== 'pinch') {
      // Start pinch gesture
      setActiveGesture({
        type: 'pinch',
        elementId,
        initialStyle: { ...element.style },
        initialScale: 1,
      });
    }

    // Apply proportional scaling (Requirement 3.2)
    const initialStyle = activeGesture?.initialStyle || element.style;
    const newWidth = Math.max(20, initialStyle.width * scale);
    const newHeight = Math.max(20, initialStyle.height * scale);

    onElementUpdate(elementId, {
      width: snapValue(newWidth),
      height: snapValue(newHeight),
    });

    onPinchZoom?.(elementId, scale);
  }, [selectedElementIds, slide.elements, activeGesture, onElementUpdate, onPinchZoom, snapValue]);

  // Handle pinch end
  const handlePinchEnd = useCallback(() => {
    setActiveGesture(null);
  }, []);

  // Handle rotation gesture
  const handleRotation = useCallback((angle: number, _center: Point) => {
    if (selectedElementIds.length !== 1) return;
    
    const elementId = selectedElementIds[0];
    const element = slide.elements.find(el => el.id === elementId);
    if (!element || element.locked) return;

    if (!activeGesture || activeGesture.type !== 'rotate') {
      // Start rotation gesture
      setActiveGesture({
        type: 'rotate',
        elementId,
        initialStyle: { ...element.style },
        initialRotation: element.style.rotation || 0,
      });
    }

    // Apply rotation (Requirement 3.3)
    const initialRotation = activeGesture?.initialRotation ?? (element.style.rotation || 0);
    const newRotation = initialRotation + angle;

    onElementUpdate(elementId, {
      rotation: newRotation,
    });

    onRotate?.(elementId, angle);
  }, [selectedElementIds, slide.elements, activeGesture, onElementUpdate, onRotate]);

  // Handle rotation end
  const handleRotationEnd = useCallback(() => {
    setActiveGesture(null);
  }, []);

  // Handle pan (move element)
  const handlePan = useCallback((delta: Point, _position: Point) => {
    if (selectedElementIds.length !== 1) return;
    
    const elementId = selectedElementIds[0];
    const element = slide.elements.find(el => el.id === elementId);
    if (!element || element.locked) return;

    if (!activeGesture || activeGesture.type !== 'move') {
      // Start move gesture
      setActiveGesture({
        type: 'move',
        elementId,
        initialStyle: { ...element.style },
      });
    }

    const initialStyle = activeGesture?.initialStyle || element.style;
    const scaledDelta = {
      x: delta.x / zoom,
      y: delta.y / zoom,
    };

    onElementUpdate(elementId, {
      x: snapValue(initialStyle.x + scaledDelta.x),
      y: snapValue(initialStyle.y + scaledDelta.y),
    });
  }, [selectedElementIds, slide.elements, activeGesture, zoom, onElementUpdate, snapValue]);

  // Handle pan end
  const handlePanEnd = useCallback(() => {
    setActiveGesture(null);
  }, []);

  // Handle swipe (navigation)
  const handleSwipe = useCallback((direction: SwipeDirection, _velocity: number) => {
    // Only trigger swipe navigation if no element is selected
    if (selectedElementIds.length === 0) {
      onSwipe?.(direction);
    }
  }, [selectedElementIds, onSwipe]);

  // Attach gesture recognizer to canvas
  useGestureRecognizer(canvasRef, {
    onTap: handleTap,
    onDoubleTap: handleDoubleTap,
    onLongPress: handleLongPress,
    onPinch: handlePinch,
    onPinchEnd: handlePinchEnd,
    onRotate: handleRotation,
    onRotateEnd: handleRotationEnd,
    onPan: handlePan,
    onPanEnd: handlePanEnd,
    onSwipe: handleSwipe,
  });

  return (
    <div
      ref={canvasRef}
      className="relative touch-none select-none"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
      }}
    >
      {/* Grid overlay */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        />
      )}

      {/* Canvas content (elements) */}
      {children}

      {/* Touch feedback indicator */}
      {touchFeedback && (
        <div
          className="absolute pointer-events-none animate-ping"
          style={{
            left: touchFeedback.x - 20,
            top: touchFeedback.y - 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
          }}
        />
      )}

      {/* Touch-friendly resize handles for selected element */}
      {selectedElementIds.length === 1 && (
        <TouchResizeHandles
          element={slide.elements.find(el => el.id === selectedElementIds[0])}
          zoom={zoom}
          onResize={(elementId, updates) => onElementUpdate(elementId, updates)}
          snapValue={snapValue}
        />
      )}
    </div>
  );
};

/**
 * Props for TouchResizeHandles component
 */
interface TouchResizeHandlesProps {
  element?: StoryElement;
  zoom: number;
  onResize: (elementId: string, updates: Partial<ElementStyle>) => void;
  snapValue: (value: number) => number;
}

/**
 * Touch-friendly resize handles component
 * Ensures minimum 44x44 touch target size (Requirement 3.6)
 */
const TouchResizeHandles: React.FC<TouchResizeHandlesProps> = ({
  element,
  zoom,
  onResize,
  snapValue,
}) => {
  const [activeHandle, setActiveHandle] = useState<HandlePosition | null>(null);
  const initialStyleRef = useRef<ElementStyle | null>(null);
  const startPosRef = useRef<Point | null>(null);

  if (!element || element.locked) return null;

  const { x, y, width, height } = element.style;
  const rotation = element.style.rotation || 0;

  // Handle positions (centered on corners and edges)
  const handlePositions: Record<HandlePosition, { left: number; top: number }> = {
    nw: { left: x - TOUCH_HANDLE_SIZE / 2, top: y - TOUCH_HANDLE_SIZE / 2 },
    n: { left: x + width / 2 - TOUCH_HANDLE_SIZE / 2, top: y - TOUCH_HANDLE_SIZE / 2 },
    ne: { left: x + width - TOUCH_HANDLE_SIZE / 2, top: y - TOUCH_HANDLE_SIZE / 2 },
    e: { left: x + width - TOUCH_HANDLE_SIZE / 2, top: y + height / 2 - TOUCH_HANDLE_SIZE / 2 },
    se: { left: x + width - TOUCH_HANDLE_SIZE / 2, top: y + height - TOUCH_HANDLE_SIZE / 2 },
    s: { left: x + width / 2 - TOUCH_HANDLE_SIZE / 2, top: y + height - TOUCH_HANDLE_SIZE / 2 },
    sw: { left: x - TOUCH_HANDLE_SIZE / 2, top: y + height - TOUCH_HANDLE_SIZE / 2 },
    w: { left: x - TOUCH_HANDLE_SIZE / 2, top: y + height / 2 - TOUCH_HANDLE_SIZE / 2 },
  };

  const handleTouchStart = (e: React.TouchEvent, handle: HandlePosition) => {
    e.stopPropagation();
    const touch = e.touches[0];
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
    initialStyleRef.current = { ...element.style };
    setActiveHandle(handle);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!activeHandle || !startPosRef.current || !initialStyleRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = (touch.clientX - startPosRef.current.x) / zoom;
    const deltaY = (touch.clientY - startPosRef.current.y) / zoom;
    const initial = initialStyleRef.current;

    const updates: Partial<ElementStyle> = {};

    switch (activeHandle) {
      case 'nw':
        updates.x = snapValue(initial.x + deltaX);
        updates.y = snapValue(initial.y + deltaY);
        updates.width = Math.max(20, initial.width - deltaX);
        updates.height = Math.max(20, initial.height - deltaY);
        break;
      case 'n':
        updates.y = snapValue(initial.y + deltaY);
        updates.height = Math.max(20, initial.height - deltaY);
        break;
      case 'ne':
        updates.y = snapValue(initial.y + deltaY);
        updates.width = Math.max(20, initial.width + deltaX);
        updates.height = Math.max(20, initial.height - deltaY);
        break;
      case 'e':
        updates.width = Math.max(20, initial.width + deltaX);
        break;
      case 'se':
        updates.width = Math.max(20, initial.width + deltaX);
        updates.height = Math.max(20, initial.height + deltaY);
        break;
      case 's':
        updates.height = Math.max(20, initial.height + deltaY);
        break;
      case 'sw':
        updates.x = snapValue(initial.x + deltaX);
        updates.width = Math.max(20, initial.width - deltaX);
        updates.height = Math.max(20, initial.height + deltaY);
        break;
      case 'w':
        updates.x = snapValue(initial.x + deltaX);
        updates.width = Math.max(20, initial.width - deltaX);
        break;
    }

    onResize(element.id, updates);
  };

  const handleTouchEnd = () => {
    setActiveHandle(null);
    startPosRef.current = null;
    initialStyleRef.current = null;
  };

  return (
    <>
      {/* Selection border */}
      <div
        className="absolute pointer-events-none border-2 border-blue-500"
        style={{
          left: x,
          top: y,
          width,
          height,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center',
        }}
      />

      {/* Resize handles - 44x44 minimum touch targets */}
      {(Object.entries(handlePositions) as [HandlePosition, { left: number; top: number }][]).map(
        ([handle, pos]) => (
          <div
            key={handle}
            className={`absolute flex items-center justify-center touch-none ${
              activeHandle === handle ? 'z-50' : 'z-40'
            }`}
            style={{
              left: pos.left,
              top: pos.top,
              width: TOUCH_HANDLE_SIZE,
              height: TOUCH_HANDLE_SIZE,
            }}
            onTouchStart={(e) => handleTouchStart(e, handle)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            {/* Visual handle (smaller than touch target) */}
            <div
              className={`rounded-full bg-white border-2 border-blue-500 shadow-md transition-transform ${
                activeHandle === handle ? 'scale-125 bg-blue-100' : ''
              }`}
              style={{
                width: 16,
                height: 16,
              }}
            />
          </div>
        )
      )}

      {/* Rotation handle */}
      <div
        className="absolute flex items-center justify-center touch-none z-40"
        style={{
          left: x + width / 2 - TOUCH_HANDLE_SIZE / 2,
          top: y - TOUCH_HANDLE_SIZE - 20,
          width: TOUCH_HANDLE_SIZE,
          height: TOUCH_HANDLE_SIZE,
        }}
      >
        {/* Connection line */}
        <div
          className="absolute bg-green-500"
          style={{
            width: 2,
            height: 20,
            bottom: -20,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
        {/* Visual handle */}
        <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-white shadow-md" />
      </div>
    </>
  );
};

export default TouchCanvas;

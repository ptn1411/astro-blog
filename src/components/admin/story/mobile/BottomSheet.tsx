import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

/**
 * BottomSheet Component - Mobile-friendly draggable sheet
 * Requirements: 4.1, 4.2
 */

export interface BottomSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Callback when sheet should close */
  onClose: () => void;
  /** Optional title for the header */
  title?: string;
  /** Snap points as fractions of viewport height (e.g., [0.3, 0.6, 1] for 30%, 60%, 100%) */
  snapPoints?: number[];
  /** Initial snap point index */
  initialSnap?: number;
  /** Content to render inside the sheet */
  children: React.ReactNode;
}

/** Default snap points: 30%, 60%, and 100% of viewport height */
const DEFAULT_SNAP_POINTS = [0.3, 0.6, 1];

/** Minimum drag distance to trigger snap */
const DRAG_THRESHOLD = 20;

/** Velocity threshold for flick gestures */
const VELOCITY_THRESHOLD = 0.5;

/**
 * Find the nearest snap point to a given position
 */
export function findNearestSnapPoint(
  currentPosition: number,
  snapPoints: number[],
  velocity: number = 0
): number {
  if (snapPoints.length === 0) return 0;
  if (snapPoints.length === 1) return snapPoints[0];

  // Sort snap points
  const sorted = [...snapPoints].sort((a, b) => a - b);

  // If velocity is significant, bias toward the direction of movement
  if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
    if (velocity > 0) {
      // Dragging down (closing) - find next lower snap point
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (sorted[i] < currentPosition) {
          return sorted[i];
        }
      }
      return sorted[0];
    } else {
      // Dragging up (opening) - find next higher snap point
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i] > currentPosition) {
          return sorted[i];
        }
      }
      return sorted[sorted.length - 1];
    }
  }

  // Find nearest snap point by distance
  let nearest = sorted[0];
  let minDistance = Math.abs(currentPosition - sorted[0]);

  for (const point of sorted) {
    const distance = Math.abs(currentPosition - point);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = point;
    }
  }

  return nearest;
}

/**
 * Calculate sheet height from snap point
 */
export function calculateSheetHeight(snapPoint: number, viewportHeight: number): number {
  return Math.round(viewportHeight * snapPoint);
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  snapPoints = DEFAULT_SNAP_POINTS,
  initialSnap = 0,
  children,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ y: number; height: number; time: number } | null>(null);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  // Update viewport height on resize
  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset to initial snap when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentSnapIndex(initialSnap);
      setDragOffset(0);
    }
  }, [isOpen, initialSnap]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (clientY: number) => {
      const currentHeight = calculateSheetHeight(snapPoints[currentSnapIndex], viewportHeight);
      dragStartRef.current = {
        y: clientY,
        height: currentHeight,
        time: Date.now(),
      };
      setIsDragging(true);
    },
    [currentSnapIndex, snapPoints, viewportHeight]
  );

  // Handle drag move
  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!dragStartRef.current) return;

      const deltaY = clientY - dragStartRef.current.y;
      setDragOffset(deltaY);
    },
    []
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (clientY: number) => {
      if (!dragStartRef.current) return;

      const deltaY = clientY - dragStartRef.current.y;
      const deltaTime = (Date.now() - dragStartRef.current.time) / 1000;
      const velocity = deltaY / (deltaTime * viewportHeight);

      // Calculate current position as fraction
      const currentHeight = dragStartRef.current.height - deltaY;
      const currentPosition = currentHeight / viewportHeight;

      // Find nearest snap point
      const nearestSnap = findNearestSnapPoint(currentPosition, snapPoints, velocity);

      // If snapping to lowest point and dragged down significantly, close
      const lowestSnap = Math.min(...snapPoints);
      if (nearestSnap === lowestSnap && deltaY > DRAG_THRESHOLD && velocity > VELOCITY_THRESHOLD) {
        onClose();
      } else {
        const newIndex = snapPoints.indexOf(nearestSnap);
        setCurrentSnapIndex(newIndex >= 0 ? newIndex : 0);
      }

      dragStartRef.current = null;
      setIsDragging(false);
      setDragOffset(0);
    },
    [snapPoints, viewportHeight, onClose]
  );

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleDragStart(e.touches[0].clientY);
    },
    [handleDragStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleDragMove(e.touches[0].clientY);
    },
    [handleDragMove]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      handleDragEnd(e.changedTouches[0].clientY);
    },
    [handleDragEnd]
  );

  // Mouse event handlers (for desktop testing)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientY);
    },
    [handleDragStart]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      handleDragEnd(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Calculate current height
  const baseHeight = calculateSheetHeight(snapPoints[currentSnapIndex], viewportHeight);
  const currentHeight = Math.max(0, baseHeight - dragOffset);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'bottom-sheet-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'opacity-50' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-slate-800 rounded-t-2xl shadow-2xl flex flex-col ${
          isDragging ? '' : 'transition-[height] duration-300 ease-out'
        }`}
        style={{
          height: currentHeight,
          maxHeight: viewportHeight,
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex-shrink-0 pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex-shrink-0 flex items-center justify-between px-4 pb-3 border-b border-slate-700">
            <h2
              id="bottom-sheet-title"
              className="text-lg font-semibold text-white"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;

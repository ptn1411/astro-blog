import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useGestureRecognizer, type SwipeDirection } from '../../../../hooks/useGestureRecognizer';

/**
 * SwipeNavigator Component - Horizontal swipe navigation for slides
 * Requirements: 2.4
 * 
 * Implements horizontal swipe detection for slide navigation with:
 * - Slide transition animation
 * - Prevention of swipe beyond first/last slide
 * - Visual feedback during swipe
 */

export interface SwipeNavigatorProps {
  /** Current slide index (0-based) */
  currentIndex: number;
  /** Total number of slides */
  totalSlides: number;
  /** Callback when swiping left (next slide) */
  onSwipeLeft: () => void;
  /** Callback when swiping right (previous slide) */
  onSwipeRight: () => void;
  /** Content to render (typically the canvas) */
  children: React.ReactNode;
  /** Whether swipe navigation is enabled */
  enabled?: boolean;
  /** Custom transition duration in ms */
  transitionDuration?: number;
}

/** Minimum swipe distance to trigger navigation (in pixels) */
const MIN_SWIPE_DISTANCE = 50;

/** Maximum offset during drag (as fraction of container width) */
const MAX_DRAG_OFFSET_RATIO = 0.3;

/** Animation spring tension */
const SPRING_TENSION = 0.3;

/**
 * Clamp slide index to valid bounds
 * Property 5: Swipe Navigation Slide Bounds
 */
export function clampSlideIndex(index: number, totalSlides: number): number {
  if (totalSlides <= 0) return 0;
  return Math.max(0, Math.min(index, totalSlides - 1));
}

/**
 * Determine if swipe should navigate based on direction and current position
 */
export function shouldNavigate(
  direction: SwipeDirection,
  currentIndex: number,
  totalSlides: number
): boolean {
  if (direction === 'left') {
    // Swipe left = next slide
    return currentIndex < totalSlides - 1;
  } else if (direction === 'right') {
    // Swipe right = previous slide
    return currentIndex > 0;
  }
  return false;
}

export const SwipeNavigator: React.FC<SwipeNavigatorProps> = ({
  currentIndex,
  totalSlides,
  onSwipeLeft,
  onSwipeRight,
  children,
  enabled = true,
  transitionDuration = 300,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset drag offset when slide changes
  useEffect(() => {
    setDragOffset(0);
    setIsDragging(false);
  }, [currentIndex]);

  // Handle swipe gesture
  const handleSwipe = useCallback(
    (direction: SwipeDirection, _velocity: number) => {
      if (!enabled || isAnimating) return;

      // Only handle horizontal swipes
      if (direction !== 'left' && direction !== 'right') return;

      if (shouldNavigate(direction, currentIndex, totalSlides)) {
        setIsAnimating(true);
        
        if (direction === 'left') {
          onSwipeLeft();
        } else {
          onSwipeRight();
        }

        // Reset animation state after transition
        setTimeout(() => {
          setIsAnimating(false);
          setDragOffset(0);
        }, transitionDuration);
      } else {
        // Bounce back animation when at bounds
        setDragOffset(0);
      }
    },
    [enabled, isAnimating, currentIndex, totalSlides, onSwipeLeft, onSwipeRight, transitionDuration]
  );

  // Handle pan gesture for visual feedback during drag
  const handlePan = useCallback(
    (delta: { x: number; y: number }) => {
      if (!enabled || isAnimating) return;

      const containerWidth = containerRef.current?.offsetWidth || 300;
      const maxOffset = containerWidth * MAX_DRAG_OFFSET_RATIO;

      // Calculate resistance at bounds
      let newOffset = delta.x;

      // Apply resistance when at first/last slide
      const isAtStart = currentIndex === 0 && delta.x > 0;
      const isAtEnd = currentIndex === totalSlides - 1 && delta.x < 0;

      if (isAtStart || isAtEnd) {
        // Apply rubber band effect
        newOffset = delta.x * SPRING_TENSION;
      }

      // Clamp offset
      newOffset = Math.max(-maxOffset, Math.min(maxOffset, newOffset));

      setDragOffset(newOffset);
      setIsDragging(true);
    },
    [enabled, isAnimating, currentIndex, totalSlides]
  );

  // Handle pan end
  const handlePanEnd = useCallback(
    (delta: { x: number; y: number }) => {
      if (!enabled) return;

      setIsDragging(false);

      // Check if drag distance exceeds threshold
      if (Math.abs(delta.x) >= MIN_SWIPE_DISTANCE) {
        const direction: SwipeDirection = delta.x < 0 ? 'left' : 'right';
        handleSwipe(direction, Math.abs(delta.x) / 100);
      } else {
        // Snap back
        setDragOffset(0);
      }
    },
    [enabled, handleSwipe]
  );

  // Use gesture recognizer
  useGestureRecognizer(
    containerRef,
    {
      onSwipe: handleSwipe,
      onPan: handlePan,
      onPanEnd: handlePanEnd,
    },
    enabled
  );

  // Calculate transform style
  const transformStyle: React.CSSProperties = {
    transform: `translateX(${dragOffset}px)`,
    transition: isDragging ? 'none' : `transform ${transitionDuration}ms ease-out`,
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden touch-pan-y"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Content wrapper with transform */}
      <div
        className="w-full h-full"
        style={transformStyle}
      >
        {children}
      </div>

      {/* Slide indicators */}
      {totalSlides > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {Array.from({ length: totalSlides }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                i === currentIndex
                  ? 'bg-white scale-125'
                  : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Edge indicators during drag */}
      {isDragging && (
        <>
          {/* Left edge indicator (previous) */}
          {currentIndex > 0 && dragOffset > 20 && (
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-16 bg-white/20 rounded-r-full flex items-center justify-center transition-opacity"
              style={{ opacity: Math.min(1, dragOffset / 100) }}
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </div>
          )}

          {/* Right edge indicator (next) */}
          {currentIndex < totalSlides - 1 && dragOffset < -20 && (
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-16 bg-white/20 rounded-l-full flex items-center justify-center transition-opacity"
              style={{ opacity: Math.min(1, Math.abs(dragOffset) / 100) }}
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SwipeNavigator;

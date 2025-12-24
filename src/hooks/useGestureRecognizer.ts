import { useEffect, useRef, useCallback } from 'react';

/**
 * Touch configuration constants
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export const TOUCH_CONFIG = {
  minHandleSize: 44,        // Minimum touch target size (px)
  longPressDelay: 500,      // Long press threshold (ms)
  doubleTapDelay: 300,      // Double tap threshold (ms)
  swipeThreshold: 50,       // Minimum swipe distance (px)
  swipeVelocity: 0.3,       // Minimum swipe velocity
  pinchThreshold: 0.1,      // Minimum scale change to trigger
  rotateThreshold: 5,       // Minimum rotation angle (degrees)
} as const;

/**
 * Swipe direction type
 */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Point interface for touch coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Gesture handlers interface
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export interface GestureHandlers {
  /** Called on single tap */
  onTap?: (position: Point) => void;
  /** Called on double tap */
  onDoubleTap?: (position: Point) => void;
  /** Called on long press (500ms) */
  onLongPress?: (position: Point) => void;
  /** Called during pinch gesture with scale factor */
  onPinch?: (scale: number, center: Point) => void;
  /** Called when pinch gesture ends */
  onPinchEnd?: (scale: number, center: Point) => void;
  /** Called during two-finger rotation */
  onRotate?: (angle: number, center: Point) => void;
  /** Called when rotation gesture ends */
  onRotateEnd?: (angle: number, center: Point) => void;
  /** Called on swipe with direction and velocity */
  onSwipe?: (direction: SwipeDirection, velocity: number) => void;
  /** Called during pan/drag */
  onPan?: (delta: Point, position: Point) => void;
  /** Called when pan ends */
  onPanEnd?: (delta: Point, position: Point) => void;
}

/**
 * Internal state for tracking touch gestures
 */
interface GestureState {
  // Single touch tracking
  startPosition: Point | null;
  startTime: number;
  lastTapTime: number;
  lastTapPosition: Point | null;
  
  // Multi-touch tracking
  initialDistance: number | null;
  initialAngle: number | null;
  currentScale: number;
  currentRotation: number;
  
  // Gesture flags
  isLongPress: boolean;
  isPinching: boolean;
  isRotating: boolean;
  isPanning: boolean;
  
  // Long press timer
  longPressTimer: ReturnType<typeof setTimeout> | null;
}

/**
 * Calculate distance between two touch points
 */
export function getDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two touch points (in degrees)
 */
export function getAngle(touch1: Touch, touch2: Touch): number {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Calculate center point between two touches
 */
export function getCenter(touch1: Touch, touch2: Touch): Point {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  };
}

/**
 * Determine swipe direction from delta
 */
export function getSwipeDirection(deltaX: number, deltaY: number): SwipeDirection {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  
  if (absX > absY) {
    return deltaX > 0 ? 'right' : 'left';
  }
  return deltaY > 0 ? 'down' : 'up';
}

/**
 * Check if two positions are close enough to be considered the same tap location
 */
function isSamePosition(pos1: Point | null, pos2: Point, threshold: number = 30): boolean {
  if (!pos1) return false;
  const dx = Math.abs(pos1.x - pos2.x);
  const dy = Math.abs(pos1.y - pos2.y);
  return dx < threshold && dy < threshold;
}

/**
 * Custom hook for recognizing touch gestures
 * 
 * Implements tap, double-tap, long-press, pinch-to-zoom, rotation, and swipe gestures
 * with conflict resolution for simultaneous gestures.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 * 
 * @param elementRef - Reference to the element to attach gesture handlers to
 * @param handlers - Object containing gesture callback functions
 * @param enabled - Whether gesture recognition is enabled (default: true)
 * 
 * @example
 * ```tsx
 * const elementRef = useRef<HTMLDivElement>(null);
 * 
 * useGestureRecognizer(elementRef, {
 *   onTap: (pos) => console.log('Tapped at', pos),
 *   onDoubleTap: (pos) => console.log('Double tapped at', pos),
 *   onLongPress: (pos) => console.log('Long pressed at', pos),
 *   onPinch: (scale, center) => console.log('Pinching', scale),
 *   onRotate: (angle, center) => console.log('Rotating', angle),
 *   onSwipe: (dir, vel) => console.log('Swiped', dir, vel),
 *   onPan: (delta, pos) => console.log('Panning', delta),
 * });
 * ```
 */
export function useGestureRecognizer(
  elementRef: React.RefObject<HTMLElement | null>,
  handlers: GestureHandlers,
  enabled: boolean = true
): void {
  // Store handlers in ref to avoid re-attaching listeners
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  
  // Gesture state
  const stateRef = useRef<GestureState>({
    startPosition: null,
    startTime: 0,
    lastTapTime: 0,
    lastTapPosition: null,
    initialDistance: null,
    initialAngle: null,
    currentScale: 1,
    currentRotation: 0,
    isLongPress: false,
    isPinching: false,
    isRotating: false,
    isPanning: false,
    longPressTimer: null,
  });

  // Clear long press timer
  const clearLongPressTimer = useCallback(() => {
    const state = stateRef.current;
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }
  }, []);

  // Reset gesture state
  const resetState = useCallback(() => {
    clearLongPressTimer();
    const state = stateRef.current;
    state.startPosition = null;
    state.initialDistance = null;
    state.initialAngle = null;
    state.currentScale = 1;
    state.currentRotation = 0;
    state.isLongPress = false;
    state.isPinching = false;
    state.isRotating = false;
    state.isPanning = false;
  }, [clearLongPressTimer]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    const state = stateRef.current;

    // Handle touch start
    const handleTouchStart = (e: TouchEvent) => {
      const touches = e.touches;
      const now = Date.now();

      if (touches.length === 1) {
        // Single touch - potential tap, long press, or pan
        const touch = touches[0];
        const position: Point = { x: touch.clientX, y: touch.clientY };
        
        state.startPosition = position;
        state.startTime = now;
        state.isPanning = false;
        state.isLongPress = false;

        // Set up long press timer
        clearLongPressTimer();
        state.longPressTimer = setTimeout(() => {
          if (state.startPosition && !state.isPanning) {
            state.isLongPress = true;
            handlersRef.current.onLongPress?.(state.startPosition);
          }
        }, TOUCH_CONFIG.longPressDelay);

      } else if (touches.length === 2) {
        // Two finger touch - pinch or rotate
        clearLongPressTimer();
        state.isPanning = false;
        
        const touch1 = touches[0];
        const touch2 = touches[1];
        
        state.initialDistance = getDistance(touch1, touch2);
        state.initialAngle = getAngle(touch1, touch2);
        state.currentScale = 1;
        state.currentRotation = 0;
        state.isPinching = true;
        state.isRotating = true;
      }
    };

    // Handle touch move
    const handleTouchMove = (e: TouchEvent) => {
      const touches = e.touches;

      if (touches.length === 1 && state.startPosition) {
        // Single touch move - pan gesture
        clearLongPressTimer();
        
        const touch = touches[0];
        const currentPosition: Point = { x: touch.clientX, y: touch.clientY };
        const delta: Point = {
          x: currentPosition.x - state.startPosition.x,
          y: currentPosition.y - state.startPosition.y,
        };

        // Only start panning if moved beyond threshold
        const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
        if (distance > 10 || state.isPanning) {
          state.isPanning = true;
          state.isLongPress = false;
          handlersRef.current.onPan?.(delta, currentPosition);
        }

      } else if (touches.length === 2 && state.initialDistance !== null && state.initialAngle !== null) {
        // Two finger move - pinch and/or rotate
        const touch1 = touches[0];
        const touch2 = touches[1];
        const center = getCenter(touch1, touch2);

        // Calculate pinch scale
        const currentDistance = getDistance(touch1, touch2);
        const scale = currentDistance / state.initialDistance;
        
        // Only trigger pinch if scale change exceeds threshold
        if (Math.abs(scale - state.currentScale) > TOUCH_CONFIG.pinchThreshold || state.isPinching) {
          state.currentScale = scale;
          handlersRef.current.onPinch?.(scale, center);
        }

        // Calculate rotation angle
        const currentAngle = getAngle(touch1, touch2);
        const rotation = currentAngle - state.initialAngle;
        
        // Only trigger rotation if angle change exceeds threshold
        if (Math.abs(rotation - state.currentRotation) > TOUCH_CONFIG.rotateThreshold || state.isRotating) {
          state.currentRotation = rotation;
          handlersRef.current.onRotate?.(rotation, center);
        }
      }
    };

    // Handle touch end
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      const touches = e.touches;
      const changedTouches = e.changedTouches;

      clearLongPressTimer();

      // Handle end of two-finger gesture
      if (state.isPinching || state.isRotating) {
        if (touches.length < 2) {
          // Gesture ended
          if (state.isPinching && changedTouches.length > 0) {
            const touch1 = changedTouches[0];
            const touch2 = changedTouches.length > 1 ? changedTouches[1] : touches[0];
            if (touch2) {
              const center = getCenter(touch1, touch2);
              handlersRef.current.onPinchEnd?.(state.currentScale, center);
              handlersRef.current.onRotateEnd?.(state.currentRotation, center);
            }
          }
          resetState();
          return;
        }
      }

      // Handle single touch end
      if (changedTouches.length === 1 && touches.length === 0) {
        const touch = changedTouches[0];
        const endPosition: Point = { x: touch.clientX, y: touch.clientY };
        
        // Skip if it was a long press
        if (state.isLongPress) {
          resetState();
          return;
        }

        // Check for swipe
        if (state.startPosition && state.isPanning) {
          const deltaX = endPosition.x - state.startPosition.x;
          const deltaY = endPosition.y - state.startPosition.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const duration = now - state.startTime;
          const velocity = distance / duration;

          // Trigger pan end
          handlersRef.current.onPanEnd?.({ x: deltaX, y: deltaY }, endPosition);

          // Check if it qualifies as a swipe
          if (distance >= TOUCH_CONFIG.swipeThreshold && velocity >= TOUCH_CONFIG.swipeVelocity) {
            const direction = getSwipeDirection(deltaX, deltaY);
            handlersRef.current.onSwipe?.(direction, velocity);
          }
          
          resetState();
          return;
        }

        // Check for tap or double tap
        if (state.startPosition) {
          const deltaX = endPosition.x - state.startPosition.x;
          const deltaY = endPosition.y - state.startPosition.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const duration = now - state.startTime;

          // Only count as tap if didn't move much and was quick
          if (distance < 10 && duration < 300) {
            // Check for double tap
            if (
              now - state.lastTapTime < TOUCH_CONFIG.doubleTapDelay &&
              isSamePosition(state.lastTapPosition, endPosition)
            ) {
              handlersRef.current.onDoubleTap?.(endPosition);
              state.lastTapTime = 0;
              state.lastTapPosition = null;
            } else {
              // Single tap - delay to check for double tap
              state.lastTapTime = now;
              state.lastTapPosition = endPosition;
              
              // Fire tap after double tap delay if no second tap
              setTimeout(() => {
                if (state.lastTapTime === now) {
                  handlersRef.current.onTap?.(endPosition);
                  state.lastTapTime = 0;
                  state.lastTapPosition = null;
                }
              }, TOUCH_CONFIG.doubleTapDelay);
            }
          }
        }

        resetState();
      }
    };

    // Handle touch cancel
    const handleTouchCancel = () => {
      resetState();
    };

    // Attach event listeners with passive: false to allow preventDefault if needed
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      clearLongPressTimer();
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [elementRef, enabled, clearLongPressTimer, resetState]);
}

export default useGestureRecognizer;

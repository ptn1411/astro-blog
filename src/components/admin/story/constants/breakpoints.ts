/**
 * Responsive breakpoints configuration for Mobile Story Editor
 * Requirements: 8.1, 8.2, 8.3
 */

export const BREAKPOINTS = {
  /** Mobile breakpoint: viewport width less than 768px */
  mobile: 768,
  /** Tablet breakpoint: viewport width between 768px and 1024px */
  tablet: 1024,
} as const;

/** Device type based on viewport width */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Get device type based on viewport width
 * @param width - Current viewport width in pixels
 * @returns DeviceType - 'mobile', 'tablet', or 'desktop'
 */
export function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.mobile) {
    return 'mobile';
  }
  if (width <= BREAKPOINTS.tablet) {
    return 'tablet';
  }
  return 'desktop';
}

/** Touch configuration constants for mobile interactions */
export const TOUCH_CONFIG = {
  /** Minimum touch target size in pixels (accessibility requirement) */
  minHandleSize: 44,
  /** Long press threshold in milliseconds */
  longPressDelay: 500,
  /** Double tap threshold in milliseconds */
  doubleTapDelay: 300,
  /** Minimum swipe distance in pixels */
  swipeThreshold: 50,
  /** Minimum swipe velocity */
  swipeVelocity: 0.3,
  /** Minimum scale change to trigger pinch */
  pinchThreshold: 0.1,
  /** Minimum rotation angle in degrees */
  rotateThreshold: 5,
} as const;

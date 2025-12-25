/**
 * Responsive breakpoints configuration for Mobile Responsive Builder
 * Requirements: 1.1, 1.2, 1.3, 3.1
 * 
 * These values match the story editor breakpoints for consistency
 * across the admin interface.
 */

/**
 * Builder breakpoints for responsive layout switching
 * - Mobile: viewport width < 768px (single-column layout)
 * - Tablet: viewport width 768px - 1024px (two-column layout)
 * - Desktop: viewport width >= 1024px (three-column layout)
 */
export const BUILDER_BREAKPOINTS = {
  /** Mobile breakpoint: viewport width less than 768px */
  mobile: 768,
  /** Tablet breakpoint: viewport width between 768px and 1024px */
  tablet: 1024,
} as const;

/** Layout mode based on viewport width */
export type LayoutMode = 'mobile' | 'tablet' | 'desktop';

/**
 * Get layout mode based on viewport width
 * Requirements: 1.1, 1.2, 1.3
 * 
 * @param width - Current viewport width in pixels
 * @returns LayoutMode - 'mobile', 'tablet', or 'desktop'
 */
export function getLayoutMode(width: number): LayoutMode {
  if (width < BUILDER_BREAKPOINTS.mobile) {
    return 'mobile';
  }
  if (width < BUILDER_BREAKPOINTS.tablet) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * Touch configuration constants for mobile builder interactions
 * Requirements: 3.1 (44x44px minimum touch targets)
 */
export const BUILDER_TOUCH_CONFIG = {
  /** Minimum touch target size in pixels (accessibility requirement - 44x44px) */
  minTouchTarget: 44,
  /** Long press threshold in milliseconds for context menu */
  longPressDelay: 500,
  /** Double tap threshold in milliseconds */
  doubleTapDelay: 300,
  /** Minimum swipe distance in pixels for page navigation */
  swipeThreshold: 50,
  /** Minimum swipe velocity for gesture recognition */
  swipeVelocity: 0.3,
  /** Drag start threshold in pixels (prevents accidental drags) */
  dragStartThreshold: 10,
  /** BottomSheet snap points as percentages of viewport height */
  bottomSheetSnapPoints: [0.3, 0.6, 1.0] as const,
  /** BottomSheet swipe-to-dismiss threshold (percentage of sheet height) */
  bottomSheetDismissThreshold: 0.25,
} as const;

/** Type for bottom sheet snap points */
export type BottomSheetSnapPoint = typeof BUILDER_TOUCH_CONFIG.bottomSheetSnapPoints[number];

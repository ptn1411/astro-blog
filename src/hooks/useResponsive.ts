import { useState, useEffect, useCallback, useMemo } from 'react';
import { getDeviceType, type DeviceType } from '../components/admin/story/constants/breakpoints';

/**
 * Responsive state interface
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export interface ResponsiveState {
  /** True when viewport width is less than 768px */
  isMobile: boolean;
  /** True when viewport width is between 768px and 1024px */
  isTablet: boolean;
  /** True when viewport width is greater than 1024px */
  isDesktop: boolean;
  /** Current viewport width in pixels */
  viewportWidth: number;
  /** Current viewport height in pixels */
  viewportHeight: number;
  /** Current device type */
  deviceType: DeviceType;
}

/**
 * Debounce function for performance optimization
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 */
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  }) as T;
}

/**
 * Get initial viewport dimensions (SSR-safe)
 */
function getViewportDimensions(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    // SSR fallback - assume desktop
    return { width: 1200, height: 800 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Custom hook for responsive breakpoint detection
 * 
 * Provides reactive viewport state with debounced resize handling
 * for optimal performance. Updates layout within 100ms of resize.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 * 
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop } = useResponsive();
 * 
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 * return <DesktopLayout />;
 * ```
 */
export function useResponsive(): ResponsiveState {
  const [dimensions, setDimensions] = useState(getViewportDimensions);

  // Memoized resize handler with debounce for performance (Requirement 8.4: update within 100ms)
  const handleResize = useCallback(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    // Skip on server
    if (typeof window === 'undefined') {
      return;
    }

    // Debounce resize events for performance (50ms debounce to stay within 100ms requirement)
    const debouncedResize = debounce(handleResize, 50);

    // Set initial dimensions on mount
    handleResize();

    // Add resize listener
    window.addEventListener('resize', debouncedResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', debouncedResize);
    };
  }, [handleResize]);

  // Compute responsive state from dimensions
  const responsiveState = useMemo<ResponsiveState>(() => {
    const { width, height } = dimensions;
    const deviceType = getDeviceType(width);

    return {
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      viewportWidth: width,
      viewportHeight: height,
      deviceType,
    };
  }, [dimensions]);

  return responsiveState;
}

export default useResponsive;

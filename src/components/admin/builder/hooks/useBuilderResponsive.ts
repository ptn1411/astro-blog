import { useMemo } from 'react';
import { useResponsive, type ResponsiveState } from '../../../../hooks/useResponsive';
import { getLayoutMode, type LayoutMode } from '../config/breakpoints.constants';

/**
 * Builder-specific responsive state interface
 * Extends the base ResponsiveState with layout mode information
 * Requirements: 1.1, 1.2, 1.3
 */
export interface BuilderResponsiveState extends ResponsiveState {
  /**
   * Current layout mode for the builder
   * - 'mobile': single-column layout (< 768px)
   * - 'tablet': two-column layout (768px - 1024px)
   * - 'desktop': three-column layout (>= 1024px)
   */
  layoutMode: LayoutMode;
  
  /**
   * Whether the current layout should show mobile-optimized UI
   * True for both mobile and tablet layouts
   */
  showMobileUI: boolean;
  
  /**
   * Whether the current layout should use bottom navigation
   * Only true for mobile layout
   */
  useBottomNav: boolean;
  
  /**
   * Whether the current layout should use bottom sheets for panels
   * True for mobile layout only
   */
  useBottomSheets: boolean;
  
  /**
   * Number of columns to display in the builder layout
   * - mobile: 1 column
   * - tablet: 2 columns
   * - desktop: 3 columns
   */
  columnCount: 1 | 2 | 3;
}

/**
 * Get column count based on layout mode
 */
function getColumnCount(layoutMode: LayoutMode): 1 | 2 | 3 {
  switch (layoutMode) {
    case 'mobile':
      return 1;
    case 'tablet':
      return 2;
    case 'desktop':
      return 3;
  }
}

/**
 * Custom hook for builder-specific responsive behavior
 * 
 * Wraps the base useResponsive hook with builder-specific logic
 * for layout mode detection and UI adaptation.
 * 
 * Requirements: 1.1, 1.2, 1.3
 * 
 * @example
 * ```tsx
 * const { layoutMode, useBottomNav, columnCount } = useBuilderResponsive();
 * 
 * if (layoutMode === 'mobile') {
 *   return <MobileBuilderLayout />;
 * }
 * return <DesktopBuilderLayout />;
 * ```
 */
export function useBuilderResponsive(): BuilderResponsiveState {
  const baseState = useResponsive();
  
  const builderState = useMemo<BuilderResponsiveState>(() => {
    const layoutMode = getLayoutMode(baseState.viewportWidth);
    const isMobileLayout = layoutMode === 'mobile';
    const isTabletLayout = layoutMode === 'tablet';
    
    return {
      ...baseState,
      layoutMode,
      showMobileUI: isMobileLayout || isTabletLayout,
      useBottomNav: isMobileLayout,
      useBottomSheets: isMobileLayout,
      columnCount: getColumnCount(layoutMode),
    };
  }, [baseState]);
  
  return builderState;
}

/**
 * Re-export breakpoints for convenience
 */
export { BUILDER_BREAKPOINTS, type LayoutMode } from '../config/breakpoints.constants';

export default useBuilderResponsive;

/**
 * Mobile Story Editor Components
 * 
 * This module exports all mobile-specific UI components for the Story Editor.
 */

// Re-export from subfolders for organized imports
export * from './layout';
export * from './canvas';
export * from './panels';
export * from './timeline';
export * from './navigation';
export * from './common';

// Re-export shared mobile components for backward compatibility
export { 
  BottomSheet, 
  type BottomSheetProps, 
  findNearestSnapPoint, 
  calculateSheetHeight,
  ConfirmationDialog,
  type ConfirmationDialogProps,
} from '../../shared/mobile';

// Direct exports for backward compatibility
export { FloatingActionButton, type FABProps } from './FloatingActionButton';
export { BottomNavBar, type BottomNavBarProps, type NavTab } from './BottomNavBar';
export { 
  TouchCanvas, 
  type TouchCanvasProps, 
  MIN_TOUCH_TARGET_SIZE, 
  TOUCH_HANDLE_SIZE 
} from './TouchCanvas';
export {
  SwipeNavigator,
  type SwipeNavigatorProps,
  clampSlideIndex,
  shouldNavigate,
} from './SwipeNavigator';
export {
  MobileHeader,
  type MobileHeaderProps,
  type MenuItem,
} from './MobileHeader';
export {
  MobilePropertiesPanel,
  type MobilePropertiesPanelProps,
} from './MobilePropertiesPanel';
export {
  MobileResourcesPanel,
  type MobileResourcesPanelProps,
} from './MobileResourcesPanel';
export {
  CompactTimeline,
  type CompactTimelineProps,
  calculateTimeFromSwipe,
  formatTime,
} from './CompactTimeline';

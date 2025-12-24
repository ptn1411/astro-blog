/**
 * Mobile Story Editor Components
 * 
 * This module exports all mobile-specific UI components for the Story Editor.
 */

export { BottomSheet, type BottomSheetProps, findNearestSnapPoint, calculateSheetHeight } from './BottomSheet';
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
  ConfirmationDialog,
  type ConfirmationDialogProps,
} from './ConfirmationDialog';
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

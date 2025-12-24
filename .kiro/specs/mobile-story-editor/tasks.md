# Implementation Plan: Mobile Story Editor

## Overview

Kế hoạch triển khai tính năng Mobile Story Editor, cho phép người dùng tạo và chỉnh sửa story trên thiết bị di động. Implementation sẽ được thực hiện theo từng bước, bắt đầu từ các utility hooks cơ bản, sau đó đến các mobile components, và cuối cùng là tích hợp vào các component hiện có.

## Tasks

- [x] 1. Set up responsive utilities and hooks
  - [x] 1.1 Create useResponsive hook with breakpoint detection
    - Create `src/hooks/useResponsive.ts`
    - Implement viewport width detection with resize listener
    - Export `isMobile`, `isTablet`, `isDesktop` states
    - Add debounce for performance optimization
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 1.2 Write property test for responsive breakpoints
    - **Property 1: Responsive Grid Layout Consistency**
    - **Property 9: Layout Update Performance**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

  - [x] 1.3 Create responsive breakpoints constants
    - Create `src/components/admin/story/constants/breakpoints.ts`
    - Define BREAKPOINTS object with mobile (768) and tablet (1024) values
    - Export DeviceType type
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 2. Create mobile UI components
  - [x] 2.1 Create BottomSheet component
    - Create `src/components/admin/story/mobile/BottomSheet.tsx`
    - Implement draggable sheet with snap points
    - Add backdrop overlay with click-to-close
    - Support title header and close button
    - Add smooth spring animation for snapping
    - _Requirements: 4.1, 4.2_

  - [ ]* 2.2 Write property test for BottomSheet snap behavior
    - **Property 11: Bottom Sheet Drag States**
    - **Validates: Requirements 4.2**

  - [x] 2.3 Create FloatingActionButton component
    - Create `src/components/admin/story/mobile/FloatingActionButton.tsx`
    - Implement FAB with configurable position and size
    - Add ripple effect on tap
    - Support icon and onClick props
    - _Requirements: 1.3_

  - [x] 2.4 Create BottomNavBar component
    - Create `src/components/admin/story/mobile/BottomNavBar.tsx`
    - Implement tab bar with icons and labels
    - Add active tab indicator with animation
    - Support safe area insets for notched devices
    - _Requirements: 7.3_

- [x] 3. Implement touch gesture system
  - [x] 3.1 Create GestureRecognizer hook
    - Create `src/hooks/useGestureRecognizer.ts`
    - Implement tap, double-tap, and long-press detection
    - Implement pinch-to-zoom gesture recognition
    - Implement two-finger rotation gesture
    - Implement swipe gesture with direction and velocity
    - Add gesture conflict resolution
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.2 Write property tests for gesture recognition
    - **Property 3: Pinch Gesture Proportional Scaling**
    - **Property 4: Rotation Gesture Accuracy**
    - **Validates: Requirements 3.2, 3.3**

  - [x] 3.3 Create TouchCanvas component
    - Create `src/components/admin/story/mobile/TouchCanvas.tsx`
    - Wrap existing canvas with touch gesture handlers
    - Implement touch-friendly resize handles (44x44 minimum)
    - Add visual feedback for touch interactions
    - Handle element selection on touch
    - _Requirements: 3.1, 3.6_

  - [ ]* 3.4 Write property test for touch target sizes
    - **Property 2: Touch Target Minimum Size**
    - **Validates: Requirements 3.6**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create mobile navigation components
  - [x] 5.1 Create SwipeNavigator component
    - Create `src/components/admin/story/mobile/SwipeNavigator.tsx`
    - Implement horizontal swipe detection for slide navigation
    - Add slide transition animation
    - Prevent swipe beyond first/last slide
    - _Requirements: 2.4_

  - [ ]* 5.2 Write property test for swipe navigation bounds
    - **Property 5: Swipe Navigation Slide Bounds**
    - **Validates: Requirements 2.4**

  - [x] 5.3 Create MobileHeader component
    - Create `src/components/admin/story/mobile/MobileHeader.tsx`
    - Implement collapsed header with back, title, and save buttons
    - Add menu icon for additional options
    - Track unsaved changes state
    - _Requirements: 7.1, 7.2_

  - [x] 5.4 Implement unsaved changes confirmation
    - Add confirmation dialog when navigating with unsaved changes
    - Integrate with MobileHeader back button
    - _Requirements: 7.5_

  - [ ]* 5.5 Write property test for unsaved changes confirmation
    - **Property 8: Unsaved Changes Confirmation**
    - **Validates: Requirements 7.5**

- [x] 6. Create mobile panels
  - [x] 6.1 Create MobilePropertiesPanel component
    - Create `src/components/admin/story/mobile/MobilePropertiesPanel.tsx`
    - Wrap PropertiesPanelV2 content in BottomSheet
    - Organize properties into collapsible sections
    - Replace number inputs with sliders on mobile
    - Add Done button to dismiss
    - _Requirements: 4.1, 4.3, 4.4, 4.5_

  - [x] 6.2 Create MobileResourcesPanel component
    - Create `src/components/admin/story/mobile/MobileResourcesPanel.tsx`
    - Wrap ResourcePanelV2 content in full-screen modal
    - Implement horizontal scrollable category tabs
    - Add sticky search input
    - Auto-close on resource selection
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [ ]* 6.3 Write property test for resource selection auto-close
    - **Property 6: Resource Selection Auto-Close**
    - **Validates: Requirements 5.3**

- [x] 7. Create mobile timeline
  - [x] 7.1 Create CompactTimeline component
    - Create `src/components/admin/story/mobile/CompactTimeline.tsx`
    - Implement compact bar view at bottom
    - Add expand/collapse functionality
    - Implement horizontal swipe for time scrubbing
    - Add horizontal scrollable slide thumbnails
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 7.2 Write property test for timeline swipe scrubbing
    - **Property 7: Timeline Swipe Scrubbing**
    - **Validates: Requirements 6.3**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Update StoriesManager for mobile
  - [x] 9.1 Add responsive grid layout to StoriesManager
    - Update `src/components/admin/story/StoriesManager.tsx`
    - Implement responsive grid columns (1 col < 480px, 2 cols < 768px)
    - Add FloatingActionButton for create new on mobile
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 9.2 Add mobile story actions bottom sheet
    - Add BottomSheet for story actions on mobile tap
    - Include Edit, Duplicate, Delete, Export options
    - Replace desktop dropdown menu on mobile
    - _Requirements: 1.4_

  - [x] 9.3 Update StoriesManager header for mobile
    - Collapse header on mobile to show essential controls
    - Add search icon toggle instead of always-visible search
    - _Requirements: 1.5_

- [x] 10. Update StoryBuilderV2 for mobile
  - [x] 10.1 Add mobile layout detection to StoryBuilderV2
    - Update `src/components/admin/story/StoryBuilderV2.tsx`
    - Use useResponsive hook to detect mobile
    - Conditionally render mobile vs desktop layout
    - _Requirements: 2.1_

  - [x] 10.2 Integrate mobile components into StoryBuilderV2
    - Replace side panels with BottomSheet on mobile
    - Add BottomNavBar for tab navigation
    - Integrate SwipeNavigator for slide navigation
    - Add floating toolbar on canvas tap
    - _Requirements: 2.2, 2.3, 2.5, 7.3_

  - [x] 10.3 Integrate TouchCanvas for mobile editing
    - Replace standard canvas with TouchCanvas on mobile
    - Wire up gesture handlers to element updates
    - Add context menu on long-press
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 10.4 Integrate CompactTimeline on mobile
    - Replace full timeline with CompactTimeline on mobile
    - Wire up time scrubbing and slide selection
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 11. Implement preferences persistence
  - [x] 11.1 Create mobile preferences storage utility
    - Create `src/utils/mobilePreferences.ts`
    - Implement save/load functions for panel preferences
    - Store preferences per device type in localStorage
    - _Requirements: 8.5_

  - [ ]* 11.2 Write property test for preferences persistence
    - **Property 10: Panel Preferences Persistence**
    - **Validates: Requirements 8.5**

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Mobile components should be created in a new `mobile/` subdirectory for organization
- Use Tailwind CSS responsive utilities where possible for simpler responsive styling

# Implementation Plan: Mobile Responsive Builder

## Overview

This implementation plan transforms the Astro Page Builder and PagesManager into fully responsive, mobile-friendly components. The approach reuses existing mobile components from the Story Editor while creating builder-specific adaptations. Implementation follows a bottom-up approach: shared utilities first, then mobile components, then integration.

## Tasks

- [x] 1. Set up shared mobile utilities and hooks
  - [x] 1.1 Create builder-specific breakpoints and touch configuration
    - Create `src/components/admin/builder/constants/breakpoints.ts`
    - Export BUILDER_BREAKPOINTS matching story editor values
    - Export BUILDER_TOUCH_CONFIG for touch interactions
    - _Requirements: 1.1, 1.2, 1.3, 3.1_

  - [x] 1.2 Create useBuilderResponsive hook
    - Create `src/components/admin/builder/hooks/useBuilderResponsive.ts`
    - Wrap existing useResponsive hook with builder-specific logic
    - Add layout mode detection (mobile/tablet/desktop)
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 1.3 Write property test for layout mode selection
    - **Property 1: Layout Mode Selection**
    - Test that for any viewport width, exactly one layout mode is selected
    - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 2. Create mobile navigation components
  - [x] 2.1 Create BuilderBottomNavBar component
    - Create `src/components/admin/builder/mobile/BuilderBottomNavBar.tsx`
    - Implement tabs: Widgets, Canvas, Properties
    - Use existing BottomNavBar pattern from story editor
    - Add animated tab indicator
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Create BuilderMobileHeader component
    - Create `src/components/admin/builder/mobile/BuilderMobileHeader.tsx`
    - Implement compact header with Save, Menu buttons
    - Add view toggle (Pages/Builder) in header
    - Implement slide-out menu for additional actions
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 2.3 Write property test for navigation tab synchronization
    - **Property 5: Navigation Tab Synchronization**
    - Test that active tab indicator matches selected tab
    - **Validates: Requirements 2.1, 2.2**

- [x] 3. Create mobile widget picker
  - [x] 3.1 Create MobileWidgetPicker component
    - Create `src/components/admin/builder/mobile/MobileWidgetPicker.tsx`
    - Use BottomSheet for container
    - Implement horizontal scrollable category tabs
    - Add search input at top of sheet
    - _Requirements: 7.1, 7.2, 7.4_

  - [x] 3.2 Implement widget selection behavior
    - Add widget to canvas on tap
    - Auto-close sheet after selection
    - Provide haptic feedback if available
    - _Requirements: 7.3_

  - [ ]* 3.3 Write property test for widget selection
    - **Property 9: Widget Selection Behavior**
    - Test that selecting widget adds to blocks and closes sheet
    - **Validates: Requirements 7.3**

- [x] 4. Create mobile properties panel
  - [x] 4.1 Create MobilePropertiesPanel component
    - Create `src/components/admin/builder/mobile/MobilePropertiesPanel.tsx`
    - Use BottomSheet with snap points (30%, 60%, 100%)
    - Adapt PropsEditor for full-width inputs
    - Ensure 44px minimum touch targets
    - _Requirements: 8.1, 8.2, 3.1_

  - [x] 4.2 Create MobileArrayEditor component
    - Create `src/components/admin/builder/mobile/MobileArrayEditor.tsx`
    - Implement touch-friendly array item management
    - Add swipe-to-delete for array items
    - _Requirements: 8.3_

  - [ ]* 4.3 Write property test for touch target compliance
    - **Property 2: Touch Target Compliance**
    - Test that all interactive elements have 44x44px minimum
    - **Validates: Requirements 3.1, 8.2**

  - [ ]* 4.4 Write property test for BottomSheet dismissal
    - **Property 8: BottomSheet Dismissal**
    - Test swipe-down and tap-outside dismissal
    - **Validates: Requirements 8.4**

- [x] 5. Create mobile block list
  - [x] 5.1 Create MobileBlockList component
    - Create `src/components/admin/builder/mobile/MobileBlockList.tsx`
    - Implement touch-optimized block cards
    - Add long-press context menu (edit, duplicate, delete)
    - _Requirements: 3.2_

  - [x] 5.2 Implement mobile drag-and-drop
    - Use @dnd-kit with touch sensors
    - Add visual feedback during drag
    - Implement smooth reordering animation
    - _Requirements: 3.3_

  - [ ]* 5.3 Write property test for block operations equivalence
    - **Property 4: Block Operations Equivalence**
    - Test add/delete/duplicate/reorder produce same results on mobile and desktop
    - **Validates: Requirements 1.4, 3.2, 3.3**

- [ ] 6. Checkpoint - Core mobile components complete
  - Ensure all mobile components render correctly
  - Verify touch interactions work as expected
  - Ask the user if questions arise

- [x] 7. Create mobile preview modal
  - [x] 7.1 Create MobilePreviewModal component
    - Create `src/components/admin/builder/mobile/MobilePreviewModal.tsx`
    - Implement full-screen modal with iframe
    - Add close button and device toggle
    - _Requirements: 6.2, 6.3_

  - [x] 7.2 Implement preview preference persistence
    - Save preview mode (desktop/mobile) to localStorage
    - Restore preference on component mount
    - _Requirements: 6.4_

  - [ ]* 7.3 Write property test for preference persistence
    - **Property 10: Preference Persistence Round-Trip**
    - Test that preferences survive browser close/reopen
    - **Validates: Requirements 6.4**

- [x] 8. Create mobile pages manager
  - [x] 8.1 Create MobilePagesManager component
    - Create `src/components/admin/builder/mobile/MobilePagesManager.tsx`
    - Implement single-column card layout
    - Add full-width search input
    - _Requirements: 4.1, 4.3_

  - [x] 8.2 Implement page card interactions
    - Show action buttons on tap
    - Add swipe gestures for navigation
    - Implement mobile-friendly delete confirmation
    - _Requirements: 4.2, 4.4, 3.4_

  - [ ]* 8.3 Write property test for search filter consistency
    - **Property 6: Search Filter Consistency**
    - Test that search results match between mobile and desktop
    - **Validates: Requirements 4.3, 7.4**

- [x] 9. Create mobile save/export components
  - [x] 9.1 Create MobileSaveModal component
    - Create `src/components/admin/builder/mobile/MobileSaveModal.tsx`
    - Implement mobile-optimized save form
    - Add full-width inputs and large buttons
    - _Requirements: 9.1_

  - [x] 9.2 Update mobile menu with export options
    - Add export JSON/MDX to slide-out menu
    - Add import/paste JSON option
    - Make AI Prompt modal scrollable on mobile
    - _Requirements: 9.2, 9.3, 9.4_

  - [ ]* 9.3 Write property test for save operation equivalence
    - **Property 7: Save Operation Equivalence**
    - Test that MDX output is identical on mobile and desktop
    - **Validates: Requirements 9.1, 9.2**

- [x] 10. Create main mobile layout wrapper
  - [x] 10.1 Create MobileBuilderLayout component
    - Create `src/components/admin/builder/mobile/MobileBuilderLayout.tsx`
    - Orchestrate all mobile components
    - Manage view state (canvas/widgets/properties)
    - Handle panel transitions
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 10.2 Implement lazy loading for panels
    - Only render active panel content
    - Preserve state when switching panels
    - _Requirements: 10.1_

  - [ ]* 10.3 Write property test for panel state preservation
    - **Property 3: Panel State Preservation**
    - Test that panel state survives open/close cycles
    - **Validates: Requirements 2.2, 7.3, 8.1**

- [x] 11. Integrate mobile layout into Builder
  - [x] 11.1 Update Builder.tsx with responsive layout
    - Import useBuilderResponsive hook
    - Conditionally render MobileBuilderLayout or desktop layout
    - Pass all required props to mobile layout
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 11.2 Update PagesManager.tsx with responsive layout
    - Add responsive detection
    - Conditionally render MobilePagesManager or desktop layout
    - Ensure consistent styling
    - _Requirements: 4.1_

  - [x] 11.3 Add performance optimizations
    - Debounce resize events (already in useResponsive)
    - Minimize re-renders on panel switch
    - _Requirements: 10.2, 10.4_

- [x] 12. Create mobile component index and exports
  - [x] 12.1 Create mobile components index
    - Create `src/components/admin/builder/mobile/index.ts`
    - Export all mobile components
    - _Requirements: N/A (organization)_

- [ ] 13. Final checkpoint - Full integration complete
  - Ensure all tests pass
  - Verify mobile experience on real devices
  - Test tablet layout
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Existing mobile components from Story Editor (BottomSheet, BottomNavBar) are reused where possible
- The implementation uses TypeScript and React, matching the existing codebase
- Property tests use fast-check library for property-based testing
- Touch interactions follow iOS/Android accessibility guidelines (44px minimum touch targets)

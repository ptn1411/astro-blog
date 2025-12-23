# Implementation Plan: Video Export with Animations

## Overview

Implement timeline-based animation rendering for video export. The core approach is to compute animation state at each frame time instead of relying on real-time CSS animations.

## Tasks

- [x] 1. Create Animation Utilities Module
  - [x] 1.1 Create `src/components/admin/story/animationUtils.ts` with core types and interfaces
    - Define `AnimationState` interface with opacity, transform, visibility
    - Define `ComputeAnimationOptions` interface
    - Export type definitions
    - _Requirements: 2.5_

  - [x] 1.2 Implement `getAnimationProgress` function
    - Calculate progress (0-1) based on currentTime, delay, duration
    - Handle edge cases: before start (return 0), after end (return 1)
    - _Requirements: 1.1, 1.3, 1.5_

  - [x] 1.3 Write property test for animation progress bounds
    - **Property 1: Animation Progress Bounds**
    - **Validates: Requirements 1.1, 1.3, 1.5**

  - [x] 1.4 Implement easing functions
    - Implement linear, ease, ease-in, ease-out, ease-in-out, spring
    - Create `applyEasing(progress, easingType)` function
    - _Requirements: 2.4_

  - [x] 1.5 Write property test for easing function bounds
    - **Property 3: Easing Function Bounds**
    - **Validates: Requirements 2.4**

- [x] 2. Implement Animation Transform Computations
  - [x] 2.1 Implement fade animations (fadeIn, fadeOut, fadeInUp, fadeInDown)
    - Create transform functions that return AnimationState
    - Handle opacity and translateY transforms
    - _Requirements: 2.1_

  - [x] 2.2 Implement slide animations (slideInLeft, slideInRight, slideInUp, slideInDown)
    - Create transform functions with translateX/translateY
    - _Requirements: 2.2_

  - [x] 2.3 Implement scale animations (scaleIn, zoomIn, bounceIn)
    - Create transform functions with scale transforms
    - Implement bounce effect for bounceIn
    - _Requirements: 2.3_

  - [x] 2.4 Create main `computeAnimationState` function
    - Combine progress calculation, easing, and transform computation
    - Handle missing animation config gracefully
    - _Requirements: 1.2, 2.5_

  - [x] 2.5 Write property test for animation state consistency
    - **Property 2: Animation State Consistency**
    - **Validates: Requirements 1.2, 2.5**

  - [x] 2.6 Write property test for animation type coverage
    - **Property 4: Animation Type Coverage**
    - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 3. Checkpoint - Ensure animation utilities tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Enhance CanvasElement for Render Mode
  - [x] 4.1 Import and integrate `computeAnimationState` in CanvasElementV2
    - Import the new utility module
    - _Requirements: 3.1_

  - [x] 4.2 Modify `getAnimationStyle` to use computed styles in renderMode
    - When renderMode=true, call computeAnimationState instead of using CSS animation classes
    - Apply computed opacity and transform as inline styles
    - _Requirements: 3.1, 3.3_

  - [x] 4.3 Modify `getAnimationClass` to return empty string in renderMode
    - Prevent CSS animation classes from being applied during export
    - _Requirements: 3.2_

  - [x] 4.4 Write unit tests for CanvasElement render mode behavior
    - Test that renderMode uses computed styles
    - Test that CSS classes are not applied in renderMode
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Update Video Export Function
  - [x] 5.1 Create export settings modal component
    - Add resolution selector (720p, 1080p, 4K)
    - Add FPS selector (24, 30, 60)
    - Add bitrate selector
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 5.2 Update `handleRenderHighQuality` to use export settings
    - Pass selected resolution, fps, bitrate to encoder
    - _Requirements: 5.4_

  - [x] 5.3 Implement multi-slide export
    - Loop through all slides
    - Calculate total frames across all slides
    - Update progress display for total progress
    - _Requirements: 4.1, 4.3_

  - [x] 5.4 Ensure proper frame timing in render loop
    - Set renderTime correctly for each frame
    - Wait for DOM update with double requestAnimationFrame
    - _Requirements: 3.4_

- [ ] 6. Checkpoint - Test full export flow
  - Ensure all tests pass, ask the user if questions arise.
  - Manually test export with a story containing animations

- [ ] 7. Write integration test for export flow
  - Test that export produces correct number of frames
  - Test that animations are captured at correct states
  - _Requirements: 4.1_

## Notes

- All tasks are required for comprehensive implementation
- Property tests use fast-check library for TypeScript
- The key insight is that we compute animation state mathematically instead of relying on browser animation timing
- html2canvas will capture the computed inline styles correctly since they're static at capture time

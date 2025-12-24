# Design Document: Mobile Story Editor

## Overview

Tài liệu này mô tả thiết kế chi tiết cho tính năng Mobile Story Editor, cho phép người dùng tạo và chỉnh sửa story trên thiết bị di động. Thiết kế tập trung vào việc tạo trải nghiệm người dùng tối ưu trên màn hình nhỏ thông qua responsive layout, touch gestures, và mobile-native UI patterns như bottom sheets và floating action buttons.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    StoriesApp.tsx                           │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │   StoriesManager    │  │      StoryBuilderV2         │  │
│  │   (List View)       │  │      (Editor View)          │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  useResponsive Hook                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ isMobile │  │ isTablet │  │ isDesktop│                  │
│  │ < 768px  │  │768-1024px│  │ > 1024px │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Mobile-Specific Components                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ BottomSheet │  │BottomNavBar │  │ FloatingActionButton│ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ TouchCanvas │  │ SwipeHandler│  │ GestureRecognizer   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
StoriesApp
├── StoriesManager (mobile-responsive)
│   ├── MobileHeader
│   ├── StoryGrid (responsive columns)
│   ├── BottomSheet (story actions)
│   └── FloatingActionButton (create new)
│
└── StoryBuilderV2 (mobile-responsive)
    ├── MobileHeader (collapsed)
    ├── CanvasArea
    │   ├── TouchCanvas (gesture support)
    │   ├── FloatingToolbar
    │   └── SwipeNavigator
    ├── BottomNavBar (Canvas/Layers/Settings tabs)
    ├── BottomSheet (Properties/Resources)
    └── CompactTimeline
```

## Components and Interfaces

### 1. useResponsive Hook

```typescript
interface ResponsiveState {
  isMobile: boolean;      // viewport < 768px
  isTablet: boolean;      // 768px <= viewport <= 1024px
  isDesktop: boolean;     // viewport > 1024px
  viewportWidth: number;
  viewportHeight: number;
}

function useResponsive(): ResponsiveState;
```

### 2. BottomSheet Component

```typescript
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  snapPoints?: number[];  // e.g., [0.3, 0.6, 1] for 30%, 60%, 100% height
  initialSnap?: number;
  children: React.ReactNode;
}

function BottomSheet(props: BottomSheetProps): JSX.Element;
```

### 3. FloatingActionButton Component

```typescript
interface FABProps {
  icon: React.ReactNode;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

function FloatingActionButton(props: FABProps): JSX.Element;
```

### 4. BottomNavBar Component

```typescript
interface NavTab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface BottomNavBarProps {
  tabs: NavTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

function BottomNavBar(props: BottomNavBarProps): JSX.Element;
```

### 5. TouchCanvas Component

```typescript
interface TouchCanvasProps {
  slide: StorySlide;
  selectedElementIds: string[];
  onElementSelect: (elementId: string) => void;
  onElementUpdate: (elementId: string, updates: Partial<ElementStyle>) => void;
  onPinchZoom: (elementId: string, scale: number) => void;
  onRotate: (elementId: string, angle: number) => void;
  onLongPress: (elementId: string, position: { x: number; y: number }) => void;
  onDoubleTap: (elementId: string) => void;
}

function TouchCanvas(props: TouchCanvasProps): JSX.Element;
```

### 6. GestureRecognizer Utility

```typescript
interface GestureHandlers {
  onTap?: (event: TouchEvent) => void;
  onDoubleTap?: (event: TouchEvent) => void;
  onLongPress?: (event: TouchEvent) => void;
  onPinch?: (scale: number, center: { x: number; y: number }) => void;
  onRotate?: (angle: number, center: { x: number; y: number }) => void;
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', velocity: number) => void;
  onPan?: (delta: { x: number; y: number }) => void;
}

function useGestureRecognizer(
  elementRef: React.RefObject<HTMLElement>,
  handlers: GestureHandlers
): void;
```

### 7. SwipeNavigator Component

```typescript
interface SwipeNavigatorProps {
  currentIndex: number;
  totalSlides: number;
  onSwipeLeft: () => void;   // Next slide
  onSwipeRight: () => void;  // Previous slide
  children: React.ReactNode;
}

function SwipeNavigator(props: SwipeNavigatorProps): JSX.Element;
```

### 8. MobileHeader Component

```typescript
interface MobileHeaderProps {
  title: string;
  onBack: () => void;
  onSave: () => void;
  onMenuOpen: () => void;
  hasUnsavedChanges: boolean;
}

function MobileHeader(props: MobileHeaderProps): JSX.Element;
```

### 9. CompactTimeline Component

```typescript
interface CompactTimelineProps {
  currentTime: number;
  duration: number;
  isExpanded: boolean;
  onTimeChange: (time: number) => void;
  onToggleExpand: () => void;
  slides: StorySlide[];
  currentSlideIndex: number;
  onSlideSelect: (index: number) => void;
}

function CompactTimeline(props: CompactTimelineProps): JSX.Element;
```

## Data Models

### Responsive Breakpoints Configuration

```typescript
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

type DeviceType = 'mobile' | 'tablet' | 'desktop';
```

### User Preferences Storage

```typescript
interface MobilePreferences {
  defaultPanelSnapPoint: number;
  showGridOnMobile: boolean;
  hapticFeedback: boolean;
  lastActiveTab: string;
}

// Storage key pattern: `story-editor-prefs-${deviceType}`
```

### Touch Handle Configuration

```typescript
const TOUCH_CONFIG = {
  minHandleSize: 44,        // Minimum touch target size (px)
  longPressDelay: 500,      // Long press threshold (ms)
  doubleTapDelay: 300,      // Double tap threshold (ms)
  swipeThreshold: 50,       // Minimum swipe distance (px)
  swipeVelocity: 0.3,       // Minimum swipe velocity
  pinchThreshold: 0.1,      // Minimum scale change to trigger
  rotateThreshold: 5,       // Minimum rotation angle (degrees)
} as const;
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Responsive Grid Layout Consistency

*For any* viewport width, the Stories_Manager grid layout SHALL follow the breakpoint rules: single column for width < 480px, 2 columns for 480px <= width < 768px, and multi-column (3+) for width >= 768px.

**Validates: Requirements 1.1, 1.2**

### Property 2: Touch Target Minimum Size

*For any* interactive element on mobile (resize handles, buttons, touch targets), the element's touch area SHALL be at least 44x44 pixels.

**Validates: Requirements 3.6**

### Property 3: Pinch Gesture Proportional Scaling

*For any* element and any pinch gesture with scale factor S, the element's width and height SHALL both be multiplied by S, maintaining the original aspect ratio.

**Validates: Requirements 3.2**

### Property 4: Rotation Gesture Accuracy

*For any* element and any two-finger rotation gesture with angle A, the element's rotation SHALL change by exactly A degrees (within ±1 degree tolerance).

**Validates: Requirements 3.3**

### Property 5: Swipe Navigation Slide Bounds

*For any* swipe gesture on the canvas, the resulting slide index SHALL remain within bounds [0, totalSlides - 1]. Swiping left on the last slide or right on the first slide SHALL have no effect.

**Validates: Requirements 2.4**

### Property 6: Resource Selection Auto-Close

*For any* resource selection action on mobile, the Resources_Panel SHALL close within 300ms and the selected resource SHALL appear on the canvas.

**Validates: Requirements 5.3**

### Property 7: Timeline Swipe Scrubbing

*For any* horizontal swipe on the Timeline with distance D pixels, the current time SHALL change proportionally: newTime = oldTime + (D / timelineWidth) * slideDuration.

**Validates: Requirements 6.3**

### Property 8: Unsaved Changes Confirmation

*For any* navigation action (back button, tab switch) when hasUnsavedChanges is true, the system SHALL display a confirmation dialog before proceeding.

**Validates: Requirements 7.5**

### Property 9: Layout Update Performance

*For any* viewport resize event, the layout SHALL update and re-render within 100ms.

**Validates: Requirements 8.4**

### Property 10: Panel Preferences Persistence

*For any* device type, setting a panel preference and then reloading the page SHALL restore the same preference value.

**Validates: Requirements 8.5**

### Property 11: Bottom Sheet Drag States

*For any* bottom sheet with snap points [p1, p2, p3], dragging the sheet SHALL snap to the nearest snap point when released, and the sheet height SHALL equal viewport height * snapPoint.

**Validates: Requirements 4.2**

## Error Handling

### Touch Gesture Errors

1. **Gesture Conflict Resolution**: When multiple gestures are detected simultaneously (e.g., pinch and rotate), prioritize based on gesture confidence score
2. **Touch Cancel Handling**: If touch is cancelled (e.g., incoming call), restore element to pre-gesture state
3. **Out-of-Bounds Handling**: If element is dragged outside canvas bounds, constrain to canvas edges

### Network Errors

1. **Resource Loading Failure**: Show placeholder with retry button in Resources_Panel
2. **Save Failure**: Show toast notification with retry option, keep unsaved changes in memory
3. **Image Upload Failure**: Show error state with option to retry or select different image

### State Errors

1. **Invalid Slide Index**: Clamp to valid range [0, slides.length - 1]
2. **Missing Element**: Log warning and skip operation if element ID not found
3. **Corrupted Preferences**: Reset to defaults if preferences fail to parse

## Testing Strategy

### Unit Tests

Unit tests will verify individual component behavior and utility functions:

1. **useResponsive hook**: Test breakpoint detection at boundary values (767px, 768px, 1024px, 1025px)
2. **GestureRecognizer**: Test gesture detection logic with mock touch events
3. **BottomSheet snap calculations**: Test snap point calculations and drag physics
4. **Grid layout calculations**: Test column count at different viewport widths

### Property-Based Tests

Property-based tests will use **fast-check** library for TypeScript to verify correctness properties:

1. **Property 1**: Generate random viewport widths, verify grid columns match breakpoint rules
2. **Property 2**: Generate random touch targets, verify all have minimum 44x44 size
3. **Property 3**: Generate random elements and scale factors, verify proportional scaling
4. **Property 4**: Generate random rotation angles, verify rotation accuracy
5. **Property 5**: Generate random swipe sequences, verify slide index stays in bounds
6. **Property 7**: Generate random swipe distances, verify time change is proportional
7. **Property 9**: Generate random resize events, measure update time
8. **Property 10**: Generate random preferences, verify persistence round-trip
9. **Property 11**: Generate random drag positions, verify snap behavior

### Integration Tests

1. **Mobile Story Creation Flow**: Create story, add elements, save, verify persistence
2. **Touch Editing Flow**: Select element, resize, rotate, verify final state
3. **Navigation Flow**: Navigate between slides, verify state consistency
4. **Panel Interaction Flow**: Open/close panels, verify no state leaks

### Test Configuration

```typescript
// vitest.config.ts additions
export default defineConfig({
  test: {
    // Property-based test configuration
    testTimeout: 30000,  // Longer timeout for PBT
    // Run 100 iterations per property test
  },
});
```

Each property test should run minimum 100 iterations to ensure adequate coverage of the input space.

# Design Document: Video Export with Animations

## Overview

Tính năng này cải tiến hệ thống export video để capture đầy đủ CSS/JS animations. Thay vì để animations chạy real-time (mà html2canvas không capture được), chúng ta sẽ tính toán animation state tại mỗi frame time và apply inline styles.

### Core Concept

```
Timeline-based Animation:
┌─────────────────────────────────────────────────────────┐
│ Frame 0    Frame 15   Frame 30   Frame 45   Frame 60   │
│ t=0ms      t=500ms    t=1000ms   t=1500ms   t=2000ms   │
│                                                         │
│ Element A: [delay=0, duration=500ms]                   │
│ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ opacity: 0→1                                           │
│                                                         │
│ Element B: [delay=300ms, duration=700ms]               │
│ ░░░░░░████████████████████████░░░░░░░░░░░░░░░░░░░░░░░ │
│ translateY: 50px→0px                                   │
└─────────────────────────────────────────────────────────┘
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    StoryBuilderV2                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              handleRenderHighQuality                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │ ExportModal │  │FrameRenderer│  │VideoEncoder │  │   │
│  │  │ (settings)  │→ │ (capture)   │→ │ (encode)    │  │   │
│  │  └─────────────┘  └──────┬──────┘  └─────────────┘  │   │
│  └──────────────────────────┼──────────────────────────┘   │
│                             ↓                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              RenderContainer                         │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │           CanvasElement (renderMode=true)    │    │   │
│  │  │  ┌─────────────────────────────────────┐    │    │   │
│  │  │  │    computeAnimationStyle(time)      │    │    │   │
│  │  │  │    - getAnimationProgress()         │    │    │   │
│  │  │  │    - applyEasing()                  │    │    │   │
│  │  │  │    - computeTransform()             │    │    │   │
│  │  │  └─────────────────────────────────────┘    │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Animation State Computer (`animationUtils.ts`)

```typescript
// Types
interface AnimationState {
  opacity: number;
  transform: string;
  visibility: 'visible' | 'hidden';
}

interface ComputeAnimationOptions {
  currentTime: number;      // Current time in ms
  animation: Animation;     // Animation config from element
  timings?: {
    start: number;          // Element start time in ms
    duration: number;       // Element duration in ms
  };
}

// Main function
function computeAnimationState(options: ComputeAnimationOptions): AnimationState;

// Helper functions
function getAnimationProgress(
  currentTime: number,
  delay: number,
  duration: number
): number; // Returns 0-1

function applyEasing(
  progress: number,
  easing: Animation['easing']
): number; // Returns eased 0-1

function computeTransformForType(
  type: AnimationType,
  progress: number
): string; // Returns CSS transform string
```

### 2. Enhanced CanvasElement Props

```typescript
interface CanvasElementProps {
  // ... existing props
  renderMode?: boolean;     // If true, use computed styles instead of CSS animations
  currentTime?: number;     // Current frame time in ms
}
```

### 3. Export Settings Interface

```typescript
interface ExportSettings {
  resolution: '720p' | '1080p' | '4k';
  fps: 24 | 30 | 60;
  bitrate: number;          // in bps
  includeAudio: boolean;
  exportAllSlides: boolean;
}

const RESOLUTION_MAP = {
  '720p': { width: 720, height: 1280 },
  '1080p': { width: 1080, height: 1920 },
  '4k': { width: 2160, height: 3840 },
};
```

## Data Models

### Animation Progress Calculation

```typescript
// Progress calculation logic
function getAnimationProgress(
  currentTime: number,
  delay: number,
  duration: number
): number {
  // Before animation starts
  if (currentTime < delay) return 0;
  
  // After animation ends
  if (currentTime >= delay + duration) return 1;
  
  // During animation
  return (currentTime - delay) / duration;
}
```

### Easing Functions

```typescript
const EASING_FUNCTIONS = {
  linear: (t: number) => t,
  ease: (t: number) => t < 0.5 
    ? 2 * t * t 
    : 1 - Math.pow(-2 * t + 2, 2) / 2,
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => 1 - (1 - t) * (1 - t),
  'ease-in-out': (t: number) => t < 0.5 
    ? 2 * t * t 
    : 1 - Math.pow(-2 * t + 2, 2) / 2,
  spring: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};
```

### Animation Type Transforms

```typescript
const ANIMATION_TRANSFORMS: Record<AnimationType, (progress: number) => AnimationState> = {
  fadeIn: (p) => ({
    opacity: p,
    transform: 'none',
    visibility: 'visible',
  }),
  
  fadeInUp: (p) => ({
    opacity: p,
    transform: `translateY(${(1 - p) * 30}px)`,
    visibility: 'visible',
  }),
  
  fadeInDown: (p) => ({
    opacity: p,
    transform: `translateY(${(1 - p) * -30}px)`,
    visibility: 'visible',
  }),
  
  slideInLeft: (p) => ({
    opacity: 1,
    transform: `translateX(${(1 - p) * -100}%)`,
    visibility: 'visible',
  }),
  
  slideInRight: (p) => ({
    opacity: 1,
    transform: `translateX(${(1 - p) * 100}%)`,
    visibility: 'visible',
  }),
  
  scaleIn: (p) => ({
    opacity: p,
    transform: `scale(${0.5 + p * 0.5})`,
    visibility: 'visible',
  }),
  
  zoomIn: (p) => ({
    opacity: p,
    transform: `scale(${p})`,
    visibility: 'visible',
  }),
  
  bounceIn: (p) => {
    // Bounce effect using spring-like calculation
    const bounce = Math.sin(p * Math.PI * 2.5) * (1 - p) * 0.3;
    return {
      opacity: Math.min(1, p * 1.5),
      transform: `scale(${p + bounce})`,
      visibility: 'visible',
    };
  },
  
  // ... other animation types
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Animation Progress Bounds

*For any* currentTime, delay, and duration values where duration > 0, the computed animation progress SHALL always be between 0 and 1 (inclusive).

**Validates: Requirements 1.1, 1.3, 1.5**

### Property 2: Animation State Consistency

*For any* animation configuration and timestamp, computing the animation state twice with the same inputs SHALL produce identical results (deterministic).

**Validates: Requirements 1.2, 2.5**

### Property 3: Easing Function Bounds

*For any* progress value between 0 and 1, applying any supported easing function SHALL return a value that eventually reaches 1 when progress is 1.

**Validates: Requirements 2.4**

### Property 4: Animation Type Coverage

*For any* supported AnimationType (fadeIn, fadeInUp, slideInLeft, scaleIn, etc.), the computeTransformForType function SHALL return a valid CSS transform string.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 5: Render Mode Style Application

*For any* element with animation in renderMode, the computed inline styles SHALL contain opacity and transform properties that match the expected animation state at currentTime.

**Validates: Requirements 3.1, 3.3**

## Error Handling

1. **Invalid Animation Config**: If animation config is missing or invalid, return default visible state (opacity: 1, transform: 'none')

2. **Negative Time Values**: Treat negative currentTime as 0

3. **Zero Duration**: If duration is 0, immediately return final state

4. **Unknown Animation Type**: Fall back to fadeIn animation

5. **WebCodecs Not Supported**: Fall back to FFmpeg-based rendering

6. **Frame Capture Failure**: Log error and skip frame, continue with next frame

## Testing Strategy

### Unit Tests

1. Test `getAnimationProgress` with various time/delay/duration combinations
2. Test each easing function with progress values 0, 0.25, 0.5, 0.75, 1
3. Test each animation type transform computation
4. Test `computeAnimationState` integration

### Property-Based Tests

Using a property-based testing library (e.g., fast-check):

1. **Progress Bounds Property**: Generate random (currentTime, delay, duration) tuples and verify progress is always 0-1
2. **Easing Bounds Property**: Generate random progress values 0-1 and verify easing output is bounded
3. **Determinism Property**: Generate random animation configs and verify same input produces same output
4. **Transform Validity Property**: Generate random animation types and progress, verify output is valid CSS

### Integration Tests

1. Test CanvasElement renders correctly in renderMode with various currentTime values
2. Test full export flow with a simple story containing animations
3. Test multi-slide export produces correct total frame count

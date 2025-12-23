/**
 * Animation Utilities for Video Export
 *
 * This module provides functions to compute animation state at any given time,
 * enabling frame-by-frame rendering for video export where CSS animations
 * cannot be captured by html2canvas.
 */

import type { Animation, AnimationType } from './types';

// ==========================================
// Types and Interfaces
// ==========================================

/**
 * Represents the computed animation state at a specific point in time
 */
export interface AnimationState {
  opacity: number;
  transform: string;
  visibility: 'visible' | 'hidden';
}

/**
 * Options for computing animation state
 */
export interface ComputeAnimationOptions {
  /** Current time in milliseconds */
  currentTime: number;
  /** Animation configuration from element */
  animation: Animation;
  /** Optional element timing configuration */
  timings?: {
    /** Element start time in ms relative to slide start */
    start: number;
    /** Element duration in ms */
    duration: number;
  };
}

/**
 * Supported easing types
 */
export type EasingType = Animation['easing'];

// ==========================================
// Easing Functions
// ==========================================

/**
 * Collection of easing functions that map progress (0-1) to eased progress (0-1)
 */
export const EASING_FUNCTIONS: Record<EasingType, (t: number) => number> = {
  linear: (t: number) => t,

  ease: (t: number) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  'ease-in': (t: number) => t * t,

  'ease-out': (t: number) => 1 - (1 - t) * (1 - t),

  'ease-in-out': (t: number) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  spring: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

// ==========================================
// Animation Progress Calculation
// ==========================================

/**
 * Calculate animation progress (0-1) based on current time, delay, and duration.
 *
 * @param currentTime - Current time in milliseconds
 * @param delay - Animation delay in milliseconds
 * @param duration - Animation duration in milliseconds
 * @returns Progress value between 0 and 1 (inclusive)
 *
 * @example
 * // Before animation starts
 * getAnimationProgress(100, 200, 500) // returns 0
 *
 * // During animation
 * getAnimationProgress(450, 200, 500) // returns 0.5
 *
 * // After animation ends
 * getAnimationProgress(800, 200, 500) // returns 1
 */
export function getAnimationProgress(
  currentTime: number,
  delay: number,
  duration: number
): number {
  // Handle edge case: zero or negative duration
  if (duration <= 0) return 1;

  // Handle negative time values
  const normalizedTime = Math.max(0, currentTime);

  // Before animation starts
  if (normalizedTime < delay) return 0;

  // After animation ends
  if (normalizedTime >= delay + duration) return 1;

  // During animation - calculate linear progress
  return (normalizedTime - delay) / duration;
}

/**
 * Apply easing function to linear progress value.
 *
 * @param progress - Linear progress value (0-1)
 * @param easing - Easing type to apply
 * @returns Eased progress value
 */
export function applyEasing(progress: number, easing: EasingType): number {
  // Clamp progress to valid range
  const clampedProgress = Math.max(0, Math.min(1, progress));

  const easingFn = EASING_FUNCTIONS[easing] || EASING_FUNCTIONS.linear;
  return easingFn(clampedProgress);
}

// ==========================================
// Animation Transform Computations
// ==========================================

/**
 * Default animation state (fully visible, no transform)
 */
const DEFAULT_STATE: AnimationState = {
  opacity: 1,
  transform: 'none',
  visibility: 'visible',
};

/**
 * Initial state before animation starts (hidden)
 */
const INITIAL_HIDDEN_STATE: AnimationState = {
  opacity: 0,
  transform: 'none',
  visibility: 'hidden',
};

/**
 * Animation transform functions that compute state based on eased progress.
 * Each function takes progress (0-1) and returns the AnimationState.
 */
export const ANIMATION_TRANSFORMS: Record<
  AnimationType,
  (progress: number) => AnimationState
> = {
  none: () => DEFAULT_STATE,

  // Fade animations
  fadeIn: (p) => ({
    opacity: p,
    transform: 'none',
    visibility: 'visible',
  }),

  fadeOut: (p) => ({
    opacity: 1 - p,
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

  // Slide animations
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

  slideInUp: (p) => ({
    opacity: 1,
    transform: `translateY(${(1 - p) * 100}%)`,
    visibility: 'visible',
  }),

  slideInDown: (p) => ({
    opacity: 1,
    transform: `translateY(${(1 - p) * -100}%)`,
    visibility: 'visible',
  }),

  // Scale animations
  scaleIn: (p) => ({
    opacity: p,
    transform: `scale(${0.5 + p * 0.5})`,
    visibility: 'visible',
  }),

  scaleOut: (p) => ({
    opacity: 1 - p,
    transform: `scale(${1 + p * 0.5})`,
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
      transform: `scale(${Math.max(0, p + bounce)})`,
      visibility: 'visible',
    };
  },

  // Rotate animations
  rotateIn: (p) => ({
    opacity: p,
    transform: `rotate(${(1 - p) * -180}deg)`,
    visibility: 'visible',
  }),

  rotate: (p) => ({
    opacity: 1,
    transform: `rotate(${p * 360}deg)`,
    visibility: 'visible',
  }),

  // Special animations
  bounce: (p) => {
    // Bounce effect
    const bounceValue = Math.abs(Math.sin(p * Math.PI * 3)) * (1 - p) * 20;
    return {
      opacity: 1,
      transform: `translateY(${-bounceValue}px)`,
      visibility: 'visible',
    };
  },

  typewriter: (_p) => ({
    opacity: 1,
    transform: 'none',
    visibility: 'visible',
    // Note: Typewriter effect is handled differently (clip-path or width)
  }),

  pulse: (p) => {
    // Pulsing scale effect
    const scale = 1 + Math.sin(p * Math.PI * 2) * 0.1;
    return {
      opacity: 1,
      transform: `scale(${scale})`,
      visibility: 'visible',
    };
  },

  shake: (p) => {
    // Shaking effect
    const shakeX = Math.sin(p * Math.PI * 8) * 5 * (1 - p);
    return {
      opacity: 1,
      transform: `translateX(${shakeX}px)`,
      visibility: 'visible',
    };
  },

  float: (p) => {
    // Floating up and down
    const floatY = Math.sin(p * Math.PI * 2) * 10;
    return {
      opacity: 1,
      transform: `translateY(${floatY}px)`,
      visibility: 'visible',
    };
  },
};

// ==========================================
// Main Computation Function
// ==========================================

/**
 * Compute the animation state for an element at a specific point in time.
 *
 * @param options - Computation options including currentTime and animation config
 * @returns The computed AnimationState with opacity, transform, and visibility
 *
 * @example
 * const state = computeAnimationState({
 *   currentTime: 250,
 *   animation: { type: 'fadeIn', duration: 500, delay: 0, easing: 'ease-out' }
 * });
 * // Returns: { opacity: 0.5, transform: 'none', visibility: 'visible' }
 */
export function computeAnimationState(
  options: ComputeAnimationOptions
): AnimationState {
  const { currentTime, animation, timings } = options;

  // Handle missing or invalid animation config
  if (!animation || animation.type === 'none') {
    return DEFAULT_STATE;
  }

  // Calculate effective delay (animation delay + element start time)
  const effectiveDelay = animation.delay + (timings?.start || 0);

  // Get linear progress
  const linearProgress = getAnimationProgress(
    currentTime,
    effectiveDelay,
    animation.duration
  );

  // If animation hasn't started yet, return initial hidden state for enter animations
  if (linearProgress === 0 && isEnterAnimation(animation.type)) {
    return INITIAL_HIDDEN_STATE;
  }

  // Apply easing
  const easedProgress = applyEasing(linearProgress, animation.easing);

  // Get transform function for animation type
  const transformFn =
    ANIMATION_TRANSFORMS[animation.type] || ANIMATION_TRANSFORMS.fadeIn;

  return transformFn(easedProgress);
}

/**
 * Check if an animation type is an "enter" animation (starts hidden)
 */
function isEnterAnimation(type: AnimationType): boolean {
  const enterAnimations: AnimationType[] = [
    'fadeIn',
    'fadeInUp',
    'fadeInDown',
    'slideInLeft',
    'slideInRight',
    'slideInUp',
    'slideInDown',
    'scaleIn',
    'zoomIn',
    'bounceIn',
    'rotateIn',
  ];
  return enterAnimations.includes(type);
}

/**
 * Convert AnimationState to inline CSS style object
 */
export function animationStateToStyle(
  state: AnimationState
): React.CSSProperties {
  return {
    opacity: state.opacity,
    transform: state.transform,
    visibility: state.visibility,
  };
}


// ==========================================
// Render Mode Animation State (for html2canvas)
// ==========================================

/**
 * Extended animation state that includes position/size changes
 * for html2canvas compatibility (since html2canvas doesn't capture CSS transforms well)
 */
export interface RenderAnimationState {
  opacity: number;
  visibility: 'visible' | 'hidden';
  // Position offsets (in pixels or percentage)
  offsetX: number;
  offsetY: number;
  offsetXUnit: 'px' | '%';
  offsetYUnit: 'px' | '%';
  // Scale factor (1 = 100%)
  scale: number;
  // Rotation in degrees
  rotation: number;
}

/**
 * Compute animation state for render mode (html2canvas compatible)
 * Returns actual position/size changes instead of CSS transforms
 */
export function computeRenderAnimationState(
  options: ComputeAnimationOptions
): RenderAnimationState {
  const { currentTime, animation, timings } = options;

  // Default state (fully visible, no changes)
  const defaultState: RenderAnimationState = {
    opacity: 1,
    visibility: 'visible',
    offsetX: 0,
    offsetY: 0,
    offsetXUnit: 'px',
    offsetYUnit: 'px',
    scale: 1,
    rotation: 0,
  };

  // Handle missing or invalid animation config
  if (!animation || animation.type === 'none') {
    return defaultState;
  }

  // Calculate effective delay (animation delay + element start time)
  // Use 0 as fallback for delay if not defined
  const effectiveDelay = (animation.delay || 0) + (timings?.start || 0);

  // Get linear progress
  const linearProgress = getAnimationProgress(
    currentTime,
    effectiveDelay,
    animation.duration
  );

  // If animation hasn't started yet, return initial hidden state for enter animations
  if (linearProgress === 0 && isEnterAnimation(animation.type)) {
    return {
      ...defaultState,
      opacity: 0,
      visibility: 'hidden',
    };
  }

  // Apply easing
  const p = applyEasing(linearProgress, animation.easing);

  // Compute state based on animation type
  switch (animation.type) {
    case 'fadeIn':
      return { ...defaultState, opacity: p };

    case 'fadeOut':
      return { ...defaultState, opacity: 1 - p };

    case 'fadeInUp':
      return {
        ...defaultState,
        opacity: p,
        offsetY: (1 - p) * 30,
        offsetYUnit: 'px',
      };

    case 'fadeInDown':
      return {
        ...defaultState,
        opacity: p,
        offsetY: (1 - p) * -30,
        offsetYUnit: 'px',
      };

    case 'slideInLeft':
      return {
        ...defaultState,
        offsetX: (1 - p) * -100,
        offsetXUnit: '%',
      };

    case 'slideInRight':
      return {
        ...defaultState,
        offsetX: (1 - p) * 100,
        offsetXUnit: '%',
      };

    case 'slideInUp':
      return {
        ...defaultState,
        offsetY: (1 - p) * 100,
        offsetYUnit: '%',
      };

    case 'slideInDown':
      return {
        ...defaultState,
        offsetY: (1 - p) * -100,
        offsetYUnit: '%',
      };

    case 'scaleIn':
      return {
        ...defaultState,
        opacity: p,
        scale: 0.5 + p * 0.5,
      };

    case 'scaleOut':
      return {
        ...defaultState,
        opacity: 1 - p,
        scale: 1 + p * 0.5,
      };

    case 'zoomIn':
      return {
        ...defaultState,
        opacity: p,
        scale: Math.max(0.01, p), // Avoid scale 0
      };

    case 'bounceIn': {
      const bounce = Math.sin(p * Math.PI * 2.5) * (1 - p) * 0.3;
      return {
        ...defaultState,
        opacity: Math.min(1, p * 1.5),
        scale: Math.max(0.01, p + bounce),
      };
    }

    case 'rotateIn':
      return {
        ...defaultState,
        opacity: p,
        rotation: (1 - p) * -180,
      };

    case 'rotate':
      return {
        ...defaultState,
        rotation: p * 360,
      };

    case 'bounce': {
      const bounceValue = Math.abs(Math.sin(p * Math.PI * 3)) * (1 - p) * 20;
      return {
        ...defaultState,
        offsetY: -bounceValue,
        offsetYUnit: 'px',
      };
    }

    case 'pulse': {
      const pulseScale = 1 + Math.sin(p * Math.PI * 2) * 0.1;
      return {
        ...defaultState,
        scale: pulseScale,
      };
    }

    case 'shake': {
      const shakeX = Math.sin(p * Math.PI * 8) * 5 * (1 - p);
      return {
        ...defaultState,
        offsetX: shakeX,
        offsetXUnit: 'px',
      };
    }

    case 'float': {
      const floatY = Math.sin(p * Math.PI * 2) * 10;
      return {
        ...defaultState,
        offsetY: floatY,
        offsetYUnit: 'px',
      };
    }

    default:
      return defaultState;
  }
}


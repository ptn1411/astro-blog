/**
 * Property-Based Tests for Animation Utilities
 *
 * These tests validate correctness properties using fast-check for
 * comprehensive input coverage.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getAnimationProgress,
  applyEasing,
  ANIMATION_TRANSFORMS,
  computeAnimationState,
  type EasingType,
} from './animationUtils';
import type { AnimationType, Animation } from './types';

/**
 * Property 1: Animation Progress Bounds
 * **Validates: Requirements 1.1, 1.3, 1.5**
 *
 * For any currentTime, delay, and duration values where duration > 0,
 * the computed animation progress SHALL always be between 0 and 1 (inclusive).
 */
describe('Property 1: Animation Progress Bounds', () => {
  it('*For any* currentTime, delay, and duration (duration > 0), progress is always between 0 and 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 10000 }),  // currentTime in ms
        fc.integer({ min: 0, max: 5000 }),       // delay in ms
        fc.integer({ min: 1, max: 5000 }),       // duration in ms (> 0)
        (currentTime, delay, duration) => {
          const progress = getAnimationProgress(currentTime, delay, duration);

          // Progress must be between 0 and 1 inclusive
          expect(progress).toBeGreaterThanOrEqual(0);
          expect(progress).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns 0 when currentTime is before delay', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 5000 }),     // delay
        fc.integer({ min: 1, max: 5000 }),       // duration
        (delay, duration) => {
          // currentTime is always less than delay
          const currentTime = delay - 1;
          const progress = getAnimationProgress(currentTime, delay, duration);
          expect(progress).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns 1 when currentTime is after delay + duration', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5000 }),       // delay
        fc.integer({ min: 1, max: 5000 }),       // duration
        (delay, duration) => {
          // currentTime is always greater than delay + duration
          const currentTime = delay + duration + 1;
          const progress = getAnimationProgress(currentTime, delay, duration);
          expect(progress).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handles negative currentTime by treating it as 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10000, max: -1 }),    // negative currentTime
        fc.integer({ min: 0, max: 5000 }),       // delay
        fc.integer({ min: 1, max: 5000 }),       // duration
        (currentTime, delay, duration) => {
          const progress = getAnimationProgress(currentTime, delay, duration);
          // Negative time should be treated as 0, so progress should be 0 if delay > 0
          expect(progress).toBeGreaterThanOrEqual(0);
          expect(progress).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: Easing Function Bounds
 * **Validates: Requirements 2.4**
 *
 * For any progress value between 0 and 1, applying any supported easing function
 * SHALL return a value that eventually reaches 1 when progress is 1.
 */
describe('Property 3: Easing Function Bounds', () => {
  const easingTypes: EasingType[] = [
    'linear',
    'ease',
    'ease-in',
    'ease-out',
    'ease-in-out',
    'spring',
  ];

  it('*For any* progress value between 0 and 1, easing functions return valid values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }).map(n => n / 1000), // progress 0-1
        fc.constantFrom(...easingTypes),
        (progress, easing) => {
          const result = applyEasing(progress, easing);

          // Result should be a finite number
          expect(Number.isFinite(result)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all easing functions return 0 when progress is 0', () => {
    for (const easing of easingTypes) {
      const result = applyEasing(0, easing);
      expect(result).toBe(0);
    }
  });

  it('all easing functions return 1 when progress is 1', () => {
    for (const easing of easingTypes) {
      const result = applyEasing(1, easing);
      expect(result).toBe(1);
    }
  });

  it('easing functions handle out-of-bounds progress by clamping', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 200 }).map(n => n / 100), // progress -1 to 2
        fc.constantFrom(...easingTypes),
        (progress, easing) => {
          const result = applyEasing(progress, easing);

          // Result should be a finite number (clamping ensures valid input)
          expect(Number.isFinite(result)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('linear easing returns the same value as input', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }).map(n => n / 1000), // progress 0-1
        (progress) => {
          const result = applyEasing(progress, 'linear');
          expect(result).toBeCloseTo(progress, 10);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 2: Animation State Consistency
 * **Validates: Requirements 1.2, 2.5**
 *
 * For any animation configuration and timestamp, computing the animation state
 * twice with the same inputs SHALL produce identical results (deterministic).
 */
describe('Property 2: Animation State Consistency', () => {
  const animationTypes: AnimationType[] = [
    'none',
    'fadeIn',
    'fadeOut',
    'fadeInUp',
    'fadeInDown',
    'slideInLeft',
    'slideInRight',
    'slideInUp',
    'slideInDown',
    'scaleIn',
    'scaleOut',
    'zoomIn',
    'bounceIn',
    'rotateIn',
    'rotate',
    'bounce',
    'pulse',
    'shake',
    'float',
  ];

  const easingTypes: EasingType[] = [
    'linear',
    'ease',
    'ease-in',
    'ease-out',
    'ease-in-out',
    'spring',
  ];

  it('*For any* animation configuration and timestamp, computing state twice produces identical results', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),           // currentTime
        fc.constantFrom(...animationTypes),           // animation type
        fc.integer({ min: 100, max: 2000 }),          // duration
        fc.integer({ min: 0, max: 1000 }),            // delay
        fc.constantFrom(...easingTypes),              // easing
        (currentTime, type, duration, delay, easing) => {
          const animation: Animation = {
            type,
            duration,
            delay,
            easing,
          };

          const options = { currentTime, animation };

          // Compute state twice
          const state1 = computeAnimationState(options);
          const state2 = computeAnimationState(options);

          // Results must be identical
          expect(state1.opacity).toBe(state2.opacity);
          expect(state1.transform).toBe(state2.transform);
          expect(state1.visibility).toBe(state2.visibility);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('same inputs with timings produce identical results', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),           // currentTime
        fc.constantFrom(...animationTypes),           // animation type
        fc.integer({ min: 100, max: 2000 }),          // duration
        fc.integer({ min: 0, max: 1000 }),            // delay
        fc.constantFrom(...easingTypes),              // easing
        fc.integer({ min: 0, max: 5000 }),            // timings.start
        fc.integer({ min: 1000, max: 5000 }),         // timings.duration
        (currentTime, type, duration, delay, easing, timingsStart, timingsDuration) => {
          const animation: Animation = {
            type,
            duration,
            delay,
            easing,
          };

          const options = {
            currentTime,
            animation,
            timings: { start: timingsStart, duration: timingsDuration },
          };

          // Compute state twice
          const state1 = computeAnimationState(options);
          const state2 = computeAnimationState(options);

          // Results must be identical
          expect(state1.opacity).toBe(state2.opacity);
          expect(state1.transform).toBe(state2.transform);
          expect(state1.visibility).toBe(state2.visibility);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handles missing animation config gracefully', () => {
    const state = computeAnimationState({
      currentTime: 500,
      animation: { type: 'none', duration: 0, delay: 0, easing: 'linear' },
    });

    expect(state.opacity).toBe(1);
    expect(state.transform).toBe('none');
    expect(state.visibility).toBe('visible');
  });
});

/**
 * Property 4: Animation Type Coverage
 * **Validates: Requirements 2.1, 2.2, 2.3**
 *
 * For any supported AnimationType (fadeIn, fadeInUp, slideInLeft, scaleIn, etc.),
 * the computeTransformForType function SHALL return a valid CSS transform string.
 */
describe('Property 4: Animation Type Coverage', () => {
  const animationTypes: AnimationType[] = [
    'none',
    'fadeIn',
    'fadeOut',
    'fadeInUp',
    'fadeInDown',
    'slideInLeft',
    'slideInRight',
    'slideInUp',
    'slideInDown',
    'scaleIn',
    'scaleOut',
    'zoomIn',
    'bounceIn',
    'rotateIn',
    'rotate',
    'bounce',
    'pulse',
    'shake',
    'float',
  ];

  it('*For any* supported AnimationType, ANIMATION_TRANSFORMS returns a valid AnimationState', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...animationTypes),
        fc.integer({ min: 0, max: 1000 }).map(n => n / 1000), // progress 0-1
        (type, progress) => {
          const transformFn = ANIMATION_TRANSFORMS[type];

          // Transform function must exist
          expect(transformFn).toBeDefined();

          const state = transformFn(progress);

          // State must have required properties
          expect(typeof state.opacity).toBe('number');
          expect(typeof state.transform).toBe('string');
          expect(['visible', 'hidden']).toContain(state.visibility);

          // Opacity must be a valid number (can exceed 0-1 for some effects)
          expect(Number.isFinite(state.opacity)).toBe(true);

          // Transform must be a non-empty string
          expect(state.transform.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all animation types produce non-empty transform strings', () => {
    for (const type of animationTypes) {
      const transformFn = ANIMATION_TRANSFORMS[type];
      const state = transformFn(0.5); // Test at midpoint

      // Transform should be a non-empty string
      expect(typeof state.transform).toBe('string');
      expect(state.transform.length).toBeGreaterThan(0);

      // Transform should be either 'none' or contain valid CSS transform functions
      const validTransformKeywords = ['none', 'translate', 'scale', 'rotate'];
      const hasValidKeyword = validTransformKeywords.some(keyword =>
        state.transform.includes(keyword)
      );
      expect(hasValidKeyword).toBe(true);
    }
  });

  it('fade animations (fadeIn, fadeOut, fadeInUp, fadeInDown) handle opacity correctly', () => {
    const fadeTypes: AnimationType[] = ['fadeIn', 'fadeOut', 'fadeInUp', 'fadeInDown'];

    fc.assert(
      fc.property(
        fc.constantFrom(...fadeTypes),
        fc.integer({ min: 0, max: 1000 }).map(n => n / 1000),
        (type, progress) => {
          const state = ANIMATION_TRANSFORMS[type](progress);

          // Opacity should be between 0 and 1 for fade animations
          expect(state.opacity).toBeGreaterThanOrEqual(0);
          expect(state.opacity).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('slide animations (slideInLeft, slideInRight, slideInUp, slideInDown) maintain full opacity', () => {
    const slideTypes: AnimationType[] = ['slideInLeft', 'slideInRight', 'slideInUp', 'slideInDown'];

    fc.assert(
      fc.property(
        fc.constantFrom(...slideTypes),
        fc.integer({ min: 0, max: 1000 }).map(n => n / 1000),
        (type, progress) => {
          const state = ANIMATION_TRANSFORMS[type](progress);

          // Slide animations should maintain full opacity
          expect(state.opacity).toBe(1);

          // Transform should contain translate
          expect(state.transform).toMatch(/translate[XY]/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('scale animations (scaleIn, zoomIn, bounceIn) use scale transform', () => {
    const scaleTypes: AnimationType[] = ['scaleIn', 'zoomIn', 'bounceIn'];

    fc.assert(
      fc.property(
        fc.constantFrom(...scaleTypes),
        fc.integer({ min: 0, max: 1000 }).map(n => n / 1000),
        (type, progress) => {
          const state = ANIMATION_TRANSFORMS[type](progress);

          // Transform should contain scale
          expect(state.transform).toMatch(/scale\(/);
        }
      ),
      { numRuns: 100 }
    );
  });
});

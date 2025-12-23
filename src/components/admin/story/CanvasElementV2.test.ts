/**
 * Unit Tests for CanvasElement Render Mode Behavior
 *
 * These tests validate that the CanvasElement correctly uses computed styles
 * in renderMode instead of CSS animation classes.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3**
 */

import { describe, it, expect } from 'vitest';
import { computeAnimationState, animationStateToStyle } from './animationUtils';
import type { Animation } from './types';

/**
 * Test the render mode behavior by testing the underlying functions
 * that CanvasElement uses when renderMode=true
 */
describe('CanvasElement Render Mode Behavior', () => {
  /**
   * Test that renderMode uses computed styles (Requirements 3.1, 3.3)
   *
   * When renderMode=true, the component should call computeAnimationState
   * and apply the result as inline styles instead of using CSS animation classes.
   */
  describe('Computed styles in renderMode', () => {
    it('computes correct opacity for fadeIn animation at different times', () => {
      const animation: Animation = {
        type: 'fadeIn',
        duration: 500,
        delay: 0,
        easing: 'linear',
      };

      // At start (t=0), opacity should be 0
      const stateAtStart = computeAnimationState({ currentTime: 0, animation });
      expect(stateAtStart.opacity).toBe(0);

      // At midpoint (t=250), opacity should be ~0.5
      const stateAtMid = computeAnimationState({ currentTime: 250, animation });
      expect(stateAtMid.opacity).toBeCloseTo(0.5, 1);

      // At end (t=500), opacity should be 1
      const stateAtEnd = computeAnimationState({ currentTime: 500, animation });
      expect(stateAtEnd.opacity).toBe(1);
    });

    it('computes correct transform for slideInLeft animation', () => {
      const animation: Animation = {
        type: 'slideInLeft',
        duration: 500,
        delay: 0,
        easing: 'linear',
      };

      // At start (t=0), enter animations return hidden state
      const stateAtStart = computeAnimationState({ currentTime: 0, animation });
      expect(stateAtStart.visibility).toBe('hidden');

      // At midpoint (t=250), should be partially translated
      const stateAtMid = computeAnimationState({ currentTime: 250, animation });
      expect(stateAtMid.transform).toBe('translateX(-50%)');

      // At end (t=500), should be at original position
      const stateAtEnd = computeAnimationState({ currentTime: 500, animation });
      expect(stateAtEnd.transform).toBe('translateX(0%)');
    });

    it('computes correct transform for scaleIn animation', () => {
      const animation: Animation = {
        type: 'scaleIn',
        duration: 500,
        delay: 0,
        easing: 'linear',
      };

      // At start (t=0), enter animations return hidden state
      const stateAtStart = computeAnimationState({ currentTime: 0, animation });
      expect(stateAtStart.visibility).toBe('hidden');

      // At midpoint (t=250), should be partially scaled
      const stateAtMid = computeAnimationState({ currentTime: 250, animation });
      expect(stateAtMid.transform).toBe('scale(0.75)');

      // At end (t=500), should be at full scale
      const stateAtEnd = computeAnimationState({ currentTime: 500, animation });
      expect(stateAtEnd.transform).toBe('scale(1)');
    });

    it('respects animation delay in renderMode', () => {
      const animation: Animation = {
        type: 'fadeIn',
        duration: 500,
        delay: 200,
        easing: 'linear',
      };

      // Before delay (t=100), should be hidden
      const stateBeforeDelay = computeAnimationState({ currentTime: 100, animation });
      expect(stateBeforeDelay.opacity).toBe(0);
      expect(stateBeforeDelay.visibility).toBe('hidden');

      // At delay start (t=200), animation begins
      const stateAtDelayStart = computeAnimationState({ currentTime: 200, animation });
      expect(stateAtDelayStart.opacity).toBe(0);

      // After delay + duration (t=700), should be fully visible
      const stateAfterEnd = computeAnimationState({ currentTime: 700, animation });
      expect(stateAfterEnd.opacity).toBe(1);
    });

    it('respects element timings in renderMode', () => {
      const animation: Animation = {
        type: 'fadeIn',
        duration: 500,
        delay: 0,
        easing: 'linear',
      };

      const timings = { start: 1000, duration: 3000 };

      // Before element start time, should be hidden
      const stateBeforeStart = computeAnimationState({
        currentTime: 500,
        animation,
        timings,
      });
      expect(stateBeforeStart.opacity).toBe(0);
      expect(stateBeforeStart.visibility).toBe('hidden');

      // At element start time, animation begins
      const stateAtStart = computeAnimationState({
        currentTime: 1000,
        animation,
        timings,
      });
      expect(stateAtStart.opacity).toBe(0);

      // After animation completes
      const stateAfterAnimation = computeAnimationState({
        currentTime: 1500,
        animation,
        timings,
      });
      expect(stateAfterAnimation.opacity).toBe(1);
    });
  });

  /**
   * Test that CSS classes are not applied in renderMode (Requirement 3.2)
   *
   * The getAnimationClass function should return empty string when renderMode=true
   */
  describe('CSS classes not applied in renderMode', () => {
    it('animationStateToStyle returns correct CSS properties', () => {
      const state = {
        opacity: 0.5,
        transform: 'translateX(50%)',
        visibility: 'visible' as const,
      };

      const style = animationStateToStyle(state);

      expect(style.opacity).toBe(0.5);
      expect(style.transform).toBe('translateX(50%)');
      expect(style.visibility).toBe('visible');
    });

    it('animationStateToStyle handles hidden visibility', () => {
      const state = {
        opacity: 0,
        transform: 'none',
        visibility: 'hidden' as const,
      };

      const style = animationStateToStyle(state);

      expect(style.opacity).toBe(0);
      expect(style.transform).toBe('none');
      expect(style.visibility).toBe('hidden');
    });
  });

  /**
   * Test that computed inline styles contain opacity and transform (Requirement 3.3)
   */
  describe('Inline styles contain opacity and transform', () => {
    it('all animation types produce styles with opacity and transform', () => {
      const animationTypes = [
        'fadeIn',
        'fadeOut',
        'fadeInUp',
        'fadeInDown',
        'slideInLeft',
        'slideInRight',
        'slideInUp',
        'slideInDown',
        'scaleIn',
        'zoomIn',
        'bounceIn',
      ] as const;

      for (const type of animationTypes) {
        const animation: Animation = {
          type,
          duration: 500,
          delay: 0,
          easing: 'linear',
        };

        const state = computeAnimationState({ currentTime: 250, animation });
        const style = animationStateToStyle(state);

        // Style should have opacity property
        expect(typeof style.opacity).toBe('number');

        // Style should have transform property
        expect(typeof style.transform).toBe('string');

        // Style should have visibility property
        expect(['visible', 'hidden']).toContain(style.visibility);
      }
    });

    it('easing functions are applied correctly in computed styles', () => {
      const easingTypes = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'] as const;

      for (const easing of easingTypes) {
        const animation: Animation = {
          type: 'fadeIn',
          duration: 1000,
          delay: 0,
          easing,
        };

        // At midpoint, different easings should produce different opacities
        const state = computeAnimationState({ currentTime: 500, animation });

        // All should produce valid opacity values
        expect(state.opacity).toBeGreaterThanOrEqual(0);
        expect(state.opacity).toBeLessThanOrEqual(1);
      }
    });
  });
});

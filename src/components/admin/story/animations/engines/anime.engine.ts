/**
 * Anime.js Animation Engine
 * Provides Anime.js-based animations for story elements (v4 API)
 */

import type { Scope } from 'animejs';
import { animate, createDraggable, createScope, spring } from 'animejs';

// Anime.js Easing options
export const ANIME_EASINGS = [
  { label: 'Linear', value: 'linear' },
  { label: 'Ease In', value: 'easeInQuad' },
  { label: 'Ease Out', value: 'easeOutQuad' },
  { label: 'Ease InOut', value: 'easeInOutQuad' },
  { label: 'Ease In Cubic', value: 'easeInCubic' },
  { label: 'Ease Out Cubic', value: 'easeOutCubic' },
  { label: 'Ease InOut Cubic', value: 'easeInOutCubic' },
  { label: 'Ease In Quart', value: 'easeInQuart' },
  { label: 'Ease Out Quart', value: 'easeOutQuart' },
  { label: 'Ease InOut Quart', value: 'easeInOutQuart' },
  { label: 'Ease In Expo', value: 'easeInExpo' },
  { label: 'Ease Out Expo', value: 'easeOutExpo' },
  { label: 'Ease InOut Expo', value: 'easeInOutExpo' },
  { label: 'Ease In Back', value: 'easeInBack' },
  { label: 'Ease Out Back', value: 'easeOutBack' },
  { label: 'Ease InOut Back', value: 'easeInOutBack' },
  { label: 'Ease In Elastic', value: 'easeInElastic' },
  { label: 'Ease Out Elastic', value: 'easeOutElastic' },
  { label: 'Ease InOut Elastic', value: 'easeInOutElastic' },
  { label: 'Ease In Bounce', value: 'easeInBounce' },
  { label: 'Ease Out Bounce', value: 'easeOutBounce' },
  { label: 'Ease InOut Bounce', value: 'easeInOutBounce' },
];

/**
 * Play Anime.js animation on an element (v4 API)
 */
export function playAnimeAnimation(
  element: HTMLElement,
  animationType: string,
  options: {
    duration?: number;
    delay?: number;
    easing?: string;
    onComplete?: () => void;
  } = {}
): ReturnType<typeof animate> | null {
  const { duration = 600, delay = 0, easing = 'outQuad' } = options;

  const baseParams = {
    duration,
    delay,
    ease: easing,
  };

  switch (animationType) {
    // Entrance animations
    case 'scaleIn':
      return animate(element, {
        ...baseParams,
        scale: [0, 1],
        opacity: [0, 1],
      });

    case 'fadeIn':
      return animate(element, {
        ...baseParams,
        opacity: [0, 1],
      });

    case 'fadeInUp':
      return animate(element, {
        ...baseParams,
        opacity: [0, 1],
        translateY: [50, 0],
      });

    case 'fadeInDown':
      return animate(element, {
        ...baseParams,
        opacity: [0, 1],
        translateY: [-50, 0],
      });

    case 'slideInLeft':
      return animate(element, {
        ...baseParams,
        translateX: [-200, 0],
        opacity: [0, 1],
      });

    case 'slideInRight':
      return animate(element, {
        ...baseParams,
        translateX: [200, 0],
        opacity: [0, 1],
      });

    case 'slideInUp':
      return animate(element, {
        ...baseParams,
        translateY: [200, 0],
        opacity: [0, 1],
      });

    case 'slideInDown':
      return animate(element, {
        ...baseParams,
        translateY: [-200, 0],
        opacity: [0, 1],
      });

    case 'bounceIn':
      return animate(element, {
        ...baseParams,
        scale: [0.3, 1.05, 0.9, 1],
        opacity: [0, 1],
        ease: 'outBounce',
      });

    case 'rotateIn':
      return animate(element, {
        ...baseParams,
        rotate: [-180, 0],
        opacity: [0, 1],
      });

    case 'zoomIn':
      return animate(element, {
        ...baseParams,
        scale: [0.5, 1],
        opacity: [0, 1],
      });

    // Emphasis animations
    case 'pulse':
      return animate(element, {
        ...baseParams,
        scale: [1, 1.1, 1],
        loop: true,
        alternate: true,
      });

    case 'shake':
      return animate(element, {
        ...baseParams,
        translateX: [-10, 10, -10, 10, 0],
      });

    case 'bounce':
      return animate(element, {
        ...baseParams,
        translateY: [-30, 0],
        ease: 'outBounce',
      });

    case 'rotate':
      return animate(element, {
        ...baseParams,
        rotate: [-15, 15, -10, 10, -5, 5, 0],
      });

    case 'float':
      return animate(element, {
        ...baseParams,
        translateY: [-15, 0],
        loop: true,
        alternate: true,
        ease: 'inOutSine',
      });

    default:
      return null;
  }
}

/**
 * Play Anime.js loop animation (v4 API)
 */
export function playAnimeLoopAnimation(
  element: HTMLElement,
  animationType: string,
  options: {
    duration?: number;
  } = {}
): ReturnType<typeof animate> | null {
  const { duration = 1000 } = options;

  switch (animationType) {
    case 'pulse':
      return animate(element, {
        scale: [1, 1.08, 1],
        ease: 'inOutSine',
        duration,
        loop: true,
      });

    case 'breathe':
      return animate(element, {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
        ease: 'inOutSine',
        duration: 3000,
        loop: true,
      });

    case 'wobble':
      return animate(element, {
        rotate: [-5, 5, -5],
        ease: 'inOutSine',
        duration,
        loop: true,
      });

    case 'float':
      return animate(element, {
        translateY: [-15, 0, -15],
        ease: 'inOutSine',
        duration: 2000,
        loop: true,
      });

    case 'bounce':
      return animate(element, {
        translateY: [-20, 0],
        alternate: true,
        ease: 'outBounce',
        duration,
        loop: true,
      });

    case 'shake':
      return animate(element, {
        translateX: [-5, 5, -5, 5, 0],
        ease: 'inOutSine',
        duration: 500,
        loop: true,
      });

    case 'spin':
      return animate(element, {
        rotate: 360,
        ease: 'linear',
        duration: 2000,
        loop: true,
      });

    default:
      return null;
  }
}

/**
 * Stop Anime.js animation (v4 API)
 * Note: In v4, animations can be paused/cancelled via the animation instance
 */
export function stopAnimeAnimation(_element: HTMLElement): void {
  // In anime.js v4, use the animation instance to control playback
  // This function is a placeholder - actual stopping should use animation.pause() or animation.cancel()
}

/**
 * Play spring-based bounce animation (v4 API)
 */
export function playSpringBounce(
  element: HTMLElement,
  options: {
    bounce?: number;
    loopDelay?: number;
  } = {}
): ReturnType<typeof animate> {
  const { bounce = 0.7, loopDelay = 250 } = options;

  return animate(element, {
    scale: [
      { to: 1.25, ease: 'inOut(3)', duration: 200 },
      { to: 1, ease: spring({ bounce }) },
    ],
    loop: true,
    loopDelay,
  });
}

/**
 * Play spring pop animation (v4 API)
 */
export function playSpringPop(
  element: HTMLElement,
  options: {
    bounce?: number;
    duration?: number;
  } = {}
): ReturnType<typeof animate> {
  const { bounce = 0.6, duration = 400 } = options;

  return animate(element, {
    scale: [0.8, 1],
    opacity: [0, 1],
    ease: spring({ bounce }),
    duration,
  });
}

/**
 * Play spring elastic animation (v4 API)
 */
export function playSpringElastic(
  element: HTMLElement,
  options: {
    bounce?: number;
    mass?: number;
    stiffness?: number;
    damping?: number;
  } = {}
): ReturnType<typeof animate> {
  const { bounce = 0.5, mass = 1, stiffness = 100, damping = 10 } = options;

  return animate(element, {
    scale: [0, 1],
    rotate: [-10, 0],
    ease: spring({ mass, stiffness, damping, velocity: bounce }),
  });
}

/**
 * Create a scoped animation context for React components
 * This provides proper cleanup and method registration
 */
export function createAnimationScope(
  rootRef: React.RefObject<HTMLElement | null>,
  setupFn?: (scope: Scope) => void
): {
  scope: Scope | null;
  init: () => void;
  cleanup: () => void;
} {
  let scope: Scope | null = null;

  const init = () => {
    if (!rootRef.current) return;

    scope = createScope({ root: rootRef.current });

    if (setupFn) {
      scope.add(setupFn);
    }
  };

  const cleanup = () => {
    if (scope) {
      scope.revert();
      scope = null;
    }
  };

  return { scope, init, cleanup };
}

/**
 * Make an element draggable with spring physics
 */
export function makeDraggable(
  element: HTMLElement | string,
  options: {
    container?: [number, number, number, number];
    bounce?: number;
  } = {}
): ReturnType<typeof createDraggable> {
  const { container = [0, 0, 0, 0], bounce = 0.7 } = options;

  return createDraggable(element, {
    container,
    releaseEase: spring({ bounce }),
  });
}

/**
 * Play spring rotate animation (v4 API)
 */
export function playSpringRotate(
  element: HTMLElement,
  rotations: number,
  options: {
    duration?: number;
  } = {}
): ReturnType<typeof animate> {
  const { duration = 1500 } = options;

  return animate(element, {
    rotate: rotations * 360,
    ease: 'out(4)',
    duration,
  });
}

/**
 * Advanced spring loop animation with keyframes
 */
export function playSpringLoopAnimation(
  element: HTMLElement,
  animationType: string,
  options: {
    bounce?: number;
    loopDelay?: number;
    duration?: number;
  } = {}
): ReturnType<typeof animate> | null {
  const { bounce = 0.7, loopDelay = 250, duration = 500 } = options;

  switch (animationType) {
    case 'springBounce':
      return animate(element, {
        scale: [
          { to: 1.25, ease: 'inOut(3)', duration: 200 },
          { to: 1, ease: spring({ bounce }) },
        ],
        loop: true,
        loopDelay,
      });

    case 'springPulse':
      return animate(element, {
        scale: [
          { to: 1.1, ease: spring({ bounce: 0.5 }) },
          { to: 1, ease: spring({ bounce: 0.5 }) },
        ],
        loop: true,
        loopDelay: loopDelay * 2,
      });

    case 'springWobble':
      return animate(element, {
        rotate: [
          { to: 10, ease: spring({ bounce }) },
          { to: -10, ease: spring({ bounce }) },
          { to: 0, ease: spring({ bounce }) },
        ],
        loop: true,
        loopDelay,
      });

    case 'springFloat':
      return animate(element, {
        translateY: [
          { to: -15, ease: spring({ bounce: 0.3 }) },
          { to: 0, ease: spring({ bounce: 0.3 }) },
        ],
        loop: true,
        loopDelay: loopDelay * 2,
      });

    case 'springSquash':
      return animate(element, {
        scaleX: [
          { to: 1.2, ease: 'inOut(2)', duration: duration / 2 },
          { to: 1, ease: spring({ bounce }) },
        ],
        scaleY: [
          { to: 0.8, ease: 'inOut(2)', duration: duration / 2 },
          { to: 1, ease: spring({ bounce }) },
        ],
        loop: true,
        loopDelay,
      });

    case 'springJelly':
      return animate(element, {
        scale: [
          { to: 1.15, ease: 'out(2)', duration: 150 },
          { to: 0.95, ease: spring({ bounce: 0.8 }) },
          { to: 1, ease: spring({ bounce: 0.6 }) },
        ],
        loop: true,
        loopDelay: loopDelay * 3,
      });

    default:
      return null;
  }
}

// Export spring animation names
export const SPRING_ANIMATION_NAMES = [
  'springBounce',
  'springPulse',
  'springWobble',
  'springFloat',
  'springSquash',
  'springJelly',
];

export { animate, createDraggable, createScope, spring };

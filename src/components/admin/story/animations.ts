import type { Scope } from 'animejs';
import { animate, createDraggable, createScope, spring } from 'animejs';
import { gsap } from 'gsap';

// Animation Engine Types
export type AnimationEngine = 'css' | 'gsap' | 'anime';

// GSAP Easing options
export const GSAP_EASINGS = [
  { label: 'Linear', value: 'none' },
  { label: 'Power1 In', value: 'power1.in' },
  { label: 'Power1 Out', value: 'power1.out' },
  { label: 'Power1 InOut', value: 'power1.inOut' },
  { label: 'Power2 In', value: 'power2.in' },
  { label: 'Power2 Out', value: 'power2.out' },
  { label: 'Power2 InOut', value: 'power2.inOut' },
  { label: 'Power3 In', value: 'power3.in' },
  { label: 'Power3 Out', value: 'power3.out' },
  { label: 'Power3 InOut', value: 'power3.inOut' },
  { label: 'Power4 In', value: 'power4.in' },
  { label: 'Power4 Out', value: 'power4.out' },
  { label: 'Power4 InOut', value: 'power4.inOut' },
  { label: 'Back In', value: 'back.in' },
  { label: 'Back Out', value: 'back.out' },
  { label: 'Back InOut', value: 'back.inOut' },
  { label: 'Elastic In', value: 'elastic.in' },
  { label: 'Elastic Out', value: 'elastic.out' },
  { label: 'Elastic InOut', value: 'elastic.inOut' },
  { label: 'Bounce In', value: 'bounce.in' },
  { label: 'Bounce Out', value: 'bounce.out' },
  { label: 'Bounce InOut', value: 'bounce.inOut' },
  { label: 'Circ In', value: 'circ.in' },
  { label: 'Circ Out', value: 'circ.out' },
  { label: 'Circ InOut', value: 'circ.inOut' },
  { label: 'Expo In', value: 'expo.in' },
  { label: 'Expo Out', value: 'expo.out' },
  { label: 'Expo InOut', value: 'expo.inOut' },
  { label: 'Sine In', value: 'sine.in' },
  { label: 'Sine Out', value: 'sine.out' },
  { label: 'Sine InOut', value: 'sine.inOut' },
];

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

// GSAP Animation preset names
export const GSAP_ANIMATION_NAMES = [
  'fadeIn',
  'fadeInUp',
  'fadeInDown',
  'fadeInLeft',
  'fadeInRight',
  'zoomIn',
  'zoomOut',
  'zoomInRotate',
  'popIn',
  'slideInLeft',
  'slideInRight',
  'slideInUp',
  'slideInDown',
  'rotateIn',
  'rotateInLeft',
  'rotateInRight',
  'flipInX',
  'flipInY',
  'bounceIn',
  'bounceInUp',
  'bounceInDown',
  'elastic',
  'jello',
  'rubberBand',
  'tada',
  'heartbeat',
  'flip3D',
  'swing3D',
];

// Loop animation names
export const LOOP_ANIMATION_NAMES = [
  'pulse',
  'shake',
  'float',
  'spin',
  'swing',
  'wobble',
  'bounce',
  'breathe',
  'glow',
  'morph',
];

/**
 * Play GSAP animation on an element
 */
export function playGSAPAnimation(
  element: HTMLElement,
  animationType: string,
  options: {
    duration?: number;
    delay?: number;
    ease?: string;
    onComplete?: () => void;
  } = {}
): gsap.core.Tween | gsap.core.Timeline | null {
  const { duration = 0.6, delay = 0, ease = 'power2.out', onComplete } = options;

  switch (animationType) {
    // Fade animations
    case 'fadeIn':
      return gsap.from(element, { opacity: 0, duration, delay, ease, onComplete });
    case 'fadeInUp':
      return gsap.from(element, { opacity: 0, y: 50, duration, delay, ease, onComplete });
    case 'fadeInDown':
      return gsap.from(element, { opacity: 0, y: -50, duration, delay, ease, onComplete });
    case 'fadeInLeft':
      return gsap.from(element, { opacity: 0, x: -50, duration, delay, ease, onComplete });
    case 'fadeInRight':
      return gsap.from(element, { opacity: 0, x: 50, duration, delay, ease, onComplete });

    // Scale animations
    case 'zoomIn':
      return gsap.from(element, { scale: 0, opacity: 0, duration, delay, ease, onComplete });
    case 'zoomOut':
      return gsap.from(element, { scale: 1.5, opacity: 0, duration, delay, ease, onComplete });
    case 'zoomInRotate':
      return gsap.from(element, { scale: 0, rotation: -180, opacity: 0, duration, delay, ease, onComplete });
    case 'popIn':
      return gsap.from(element, { scale: 0, duration, delay, ease: 'back.out(1.7)', onComplete });

    // Slide animations
    case 'slideInLeft':
      return gsap.from(element, { x: -200, opacity: 0, duration, delay, ease, onComplete });
    case 'slideInRight':
      return gsap.from(element, { x: 200, opacity: 0, duration, delay, ease, onComplete });
    case 'slideInUp':
      return gsap.from(element, { y: 200, opacity: 0, duration, delay, ease, onComplete });
    case 'slideInDown':
      return gsap.from(element, { y: -200, opacity: 0, duration, delay, ease, onComplete });

    // Rotate animations
    case 'rotateIn':
      return gsap.from(element, { rotation: -180, opacity: 0, duration, delay, ease, onComplete });
    case 'rotateInLeft':
      return gsap.from(element, {
        rotation: -90,
        transformOrigin: 'left center',
        opacity: 0,
        duration,
        delay,
        ease,
        onComplete,
      });
    case 'rotateInRight':
      return gsap.from(element, {
        rotation: 90,
        transformOrigin: 'right center',
        opacity: 0,
        duration,
        delay,
        ease,
        onComplete,
      });
    case 'flipInX':
      return gsap.from(element, { rotationX: -90, opacity: 0, duration, delay, ease, onComplete });
    case 'flipInY':
      return gsap.from(element, { rotationY: -90, opacity: 0, duration, delay, ease, onComplete });

    // Bounce animations
    case 'bounceIn':
      return gsap.from(element, {
        scale: 0,
        opacity: 0,
        duration,
        delay,
        ease: 'bounce.out',
        onComplete,
      });
    case 'bounceInUp':
      return gsap.from(element, { y: 100, opacity: 0, duration, delay, ease: 'bounce.out', onComplete });
    case 'bounceInDown':
      return gsap.from(element, { y: -100, opacity: 0, duration, delay, ease: 'bounce.out', onComplete });

    // Special effects
    case 'elastic':
      return gsap.from(element, { scale: 0, duration, delay, ease: 'elastic.out(1, 0.3)', onComplete });

    case 'jello': {
      const tl = gsap.timeline({ delay, onComplete });
      tl.to(element, { skewX: -12.5, skewY: -12.5, duration: duration / 6, ease: 'power1.inOut' })
        .to(element, { skewX: 6.25, skewY: 6.25, duration: duration / 6, ease: 'power1.inOut' })
        .to(element, { skewX: -3.125, skewY: -3.125, duration: duration / 6, ease: 'power1.inOut' })
        .to(element, { skewX: 1.5625, skewY: 1.5625, duration: duration / 6, ease: 'power1.inOut' })
        .to(element, { skewX: 0, skewY: 0, duration: duration / 6, ease: 'power1.inOut' });
      return tl;
    }

    case 'rubberBand': {
      const tl = gsap.timeline({ delay, onComplete });
      tl.to(element, { scaleX: 1.25, scaleY: 0.75, duration: duration / 7 })
        .to(element, { scaleX: 0.75, scaleY: 1.25, duration: duration / 7 })
        .to(element, { scaleX: 1.15, scaleY: 0.85, duration: duration / 7 })
        .to(element, { scaleX: 0.95, scaleY: 1.05, duration: duration / 7 })
        .to(element, { scaleX: 1.05, scaleY: 0.95, duration: duration / 7 })
        .to(element, { scaleX: 1, scaleY: 1, duration: duration / 7 });
      return tl;
    }

    case 'tada': {
      const tl = gsap.timeline({ delay, onComplete });
      tl.to(element, { scale: 0.9, rotation: -3, duration: duration / 7 })
        .to(element, { scale: 1.1, rotation: 3, duration: duration / 7 })
        .to(element, { rotation: -3, duration: duration / 7 })
        .to(element, { rotation: 3, duration: duration / 7 })
        .to(element, { rotation: -3, duration: duration / 7 })
        .to(element, { scale: 1, rotation: 0, duration: duration / 7 });
      return tl;
    }

    case 'heartbeat': {
      const tl = gsap.timeline({ delay, onComplete });
      tl.to(element, { scale: 1.3, duration: duration / 5 })
        .to(element, { scale: 1, duration: duration / 5 })
        .to(element, { scale: 1.3, duration: duration / 5 })
        .to(element, { scale: 1, duration: duration / 5 });
      return tl;
    }

    case 'flip3D':
      return gsap.from(element, { rotationY: -180, opacity: 0, duration, delay, ease, onComplete });

    case 'swing3D': {
      const tl = gsap.timeline({ delay, onComplete });
      tl.to(element, { rotationY: 15, duration: duration / 6 })
        .to(element, { rotationY: -10, duration: duration / 6 })
        .to(element, { rotationY: 5, duration: duration / 6 })
        .to(element, { rotationY: -5, duration: duration / 6 })
        .to(element, { rotationY: 0, duration: duration / 6 });
      return tl;
    }

    default:
      return null;
  }
}

/**
 * Play loop animation
 */
export function playLoopAnimation(
  element: HTMLElement,
  animationType: string,
  engine: 'gsap' | 'anime' | 'css' = 'gsap'
): gsap.core.Tween | gsap.core.Timeline | null {
  if (engine === 'css') return null;

  switch (animationType) {
    case 'pulse':
      return gsap.to(element, {
        scale: 1.05,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });

    case 'shake':
      return gsap.to(element, {
        x: 5,
        duration: 0.1,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });

    case 'float':
      return gsap.to(element, {
        y: -15,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

    case 'spin':
      return gsap.to(element, {
        rotation: 360,
        duration: 2,
        repeat: -1,
        ease: 'none',
      });

    case 'swing':
      return gsap.to(element, {
        rotation: 10,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        transformOrigin: 'top center',
      });

    case 'wobble': {
      const tl = gsap.timeline({ repeat: -1 });
      tl.to(element, { x: -25, rotation: -5, duration: 0.15 })
        .to(element, { x: 20, rotation: 3, duration: 0.15 })
        .to(element, { x: -15, rotation: -3, duration: 0.15 })
        .to(element, { x: 10, rotation: 2, duration: 0.15 })
        .to(element, { x: -5, rotation: -1, duration: 0.15 })
        .to(element, { x: 0, rotation: 0, duration: 0.15 });
      return tl;
    }

    case 'bounce': {
      const tl = gsap.timeline({ repeat: -1 });
      tl.to(element, { y: -30, duration: 0.3, ease: 'power2.out' }).to(element, {
        y: 0,
        duration: 0.3,
        ease: 'bounce.out',
      });
      return tl;
    }

    case 'breathe':
      return gsap.to(element, {
        scale: 1.1,
        opacity: 0.8,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

    case 'glow':
      return gsap.to(element, {
        boxShadow: '0 0 20px currentColor',
        duration: 0.75,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

    case 'morph':
      return gsap.to(element, {
        borderRadius: '50%',
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut',
      });

    default:
      return null;
  }
}

/**
 * Stop all GSAP animations on an element
 */
export function stopAnimations(element: HTMLElement): void {
  gsap.killTweensOf(element);
}

/**
 * Animate text letter by letter using GSAP
 */
export function animateTextByLetters(
  element: HTMLElement,
  animationType: 'reveal' | 'wave' | 'glitch' | 'cascade' = 'reveal',
  options: { duration?: number; stagger?: number } = {}
): gsap.core.Timeline {
  const text = element.textContent || '';
  element.innerHTML = text
    .split('')
    .map((char) => `<span class="letter" style="display: inline-block">${char === ' ' ? '&nbsp;' : char}</span>`)
    .join('');

  const letters = element.querySelectorAll('.letter');
  const { duration = 0.6, stagger = 0.03 } = options;

  const tl = gsap.timeline();

  switch (animationType) {
    case 'reveal':
      tl.from(letters, {
        opacity: 0,
        y: 20,
        duration: duration / letters.length,
        stagger,
        ease: 'power2.out',
      });
      break;

    case 'wave':
      tl.from(letters, {
        y: -15,
        duration: duration / letters.length,
        stagger: {
          each: stagger,
          from: 'end',
        },
        ease: 'elastic.out(1, 0.6)',
      });
      break;

    case 'glitch':
      tl.from(letters, {
        x: () => gsap.utils.random(-5, 5),
        y: () => gsap.utils.random(-3, 3),
        opacity: 0,
        duration: duration / 2 / letters.length,
        stagger: stagger / 2,
        ease: 'power2.out',
      });
      break;

    case 'cascade':
      tl.from(letters, {
        opacity: 0,
        rotationY: -90,
        duration: duration / letters.length,
        stagger,
        ease: 'expo.out',
      });
      break;
  }

  return tl;
}

/**
 * Animate slide transition with GSAP
 */
export function animateSlideTransition(
  currentSlide: HTMLElement,
  nextSlide: HTMLElement,
  transitionType: string,
  duration: number = 500
): gsap.core.Timeline {
  const tl = gsap.timeline();
  const dur = duration / 1000;

  switch (transitionType) {
    case 'fade':
      tl.to(currentSlide, { opacity: 0, duration: dur }).fromTo(
        nextSlide,
        { opacity: 0 },
        { opacity: 1, duration: dur },
        '-=0.2'
      );
      break;

    case 'slide':
      tl.to(currentSlide, { x: '-100%', duration: dur, ease: 'power2.inOut' }).fromTo(
        nextSlide,
        { x: '100%' },
        { x: '0%', duration: dur, ease: 'power2.inOut' },
        '-=0.4'
      );
      break;

    case 'zoom':
      tl.to(currentSlide, { scale: 1.5, opacity: 0, duration: dur, ease: 'power2.in' }).fromTo(
        nextSlide,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: dur, ease: 'power2.out' },
        '-=0.2'
      );
      break;

    case 'flip':
      tl.to(currentSlide, { rotationY: -90, duration: dur / 2, ease: 'power2.in' }).fromTo(
        nextSlide,
        { rotationY: 90 },
        { rotationY: 0, duration: dur / 2, ease: 'power2.out' },
        '-=0.1'
      );
      break;

    case 'cube':
      tl.to(currentSlide, { rotationY: -90, z: -180, duration: dur, ease: 'power2.inOut' }).fromTo(
        nextSlide,
        { rotationY: 90, z: -180 },
        { rotationY: 0, z: 0, duration: dur, ease: 'power2.inOut' },
        '-=0.5'
      );
      break;

    case 'stack':
      tl.to(currentSlide, { y: '-100%', scale: 0.9, duration: dur, ease: 'power3.out' }).fromTo(
        nextSlide,
        { y: '100%', scale: 0.9 },
        { y: '0%', scale: 1, duration: dur, ease: 'power3.out' },
        '-=0.4'
      );
      break;

    case 'reveal':
      tl.to(currentSlide, { clipPath: 'inset(0 0 100% 0)', duration: dur, ease: 'power2.inOut' }).fromTo(
        nextSlide,
        { clipPath: 'inset(100% 0 0 0)' },
        { clipPath: 'inset(0 0 0 0)', duration: dur, ease: 'power2.inOut' },
        '-=0.3'
      );
      break;

    case 'swirl':
      tl.to(currentSlide, { rotation: 90, scale: 0, opacity: 0, duration: dur, ease: 'power2.in' }).fromTo(
        nextSlide,
        { rotation: -90, scale: 0, opacity: 0 },
        { rotation: 0, scale: 1, opacity: 1, duration: dur, ease: 'power2.out' },
        '-=0.2'
      );
      break;

    default:
      gsap.set(currentSlide, { display: 'none' });
      gsap.set(nextSlide, { display: 'block', opacity: 1 });
  }

  return tl;
}

export { gsap };

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

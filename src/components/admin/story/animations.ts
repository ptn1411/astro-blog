/**
 * Animation Engines - Re-exports for backward compatibility
 * This file re-exports all animation functions from the new locations.
 */

// Re-export from GSAP engine
export {
  GSAP_EASINGS,
  GSAP_ANIMATION_NAMES,
  LOOP_ANIMATION_NAMES,
  playGSAPAnimation,
  playLoopAnimation,
  stopAnimations,
  animateTextByLetters,
  animateSlideTransition,
  gsap,
} from './animations/engines/gsap.engine';

// Re-export from Anime.js engine
export {
  ANIME_EASINGS,
  playAnimeAnimation,
  playAnimeLoopAnimation,
  stopAnimeAnimation,
  playSpringBounce,
  playSpringPop,
  playSpringElastic,
  createAnimationScope,
  makeDraggable,
  playSpringRotate,
  playSpringLoopAnimation,
  SPRING_ANIMATION_NAMES,
  animate,
  createDraggable,
  createScope,
  spring,
} from './animations/engines/anime.engine';

// Re-export AnimationEngine type from core types
export type { AnimationEngine } from './core/types/animation.types';

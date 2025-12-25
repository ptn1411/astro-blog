// ==========================================
// Animation Presets
// ==========================================

import type { Animation, AnimationType, TransitionType } from '../types/animation.types';

// Animation Presets
export const ANIMATION_PRESETS: Record<AnimationType, Partial<Animation>> = {
  none: { duration: 0, delay: 0 },
  fadeIn: { duration: 500, easing: 'ease-out' },
  fadeOut: { duration: 500, easing: 'ease-in' },
  bounce: { duration: 800, easing: 'spring' },
  fadeInUp: { duration: 600, easing: 'ease-out' },
  fadeInDown: { duration: 700, delay: 700, easing: 'ease-out' },
  rotate: { duration: 1000, delay: 0, easing: 'ease-out' },
  zoomIn: { duration: 800, delay: 300, easing: 'spring' },
  slideInLeft: { duration: 600, easing: 'ease-out' },
  slideInRight: { duration: 600, easing: 'ease-out' },
  slideInUp: { duration: 600, easing: 'ease-out' },
  slideInDown: { duration: 600, easing: 'ease-out' },
  scaleIn: { duration: 500, easing: 'spring' },
  scaleOut: { duration: 500, easing: 'ease-in' },
  bounceIn: { duration: 800, easing: 'spring' },
  rotateIn: { duration: 600, easing: 'ease-out' },
  typewriter: { duration: 1500, easing: 'linear' },
  pulse: { duration: 1000, easing: 'ease-in-out' },
  shake: { duration: 500, easing: 'linear' },
  float: { duration: 2000, easing: 'ease-in-out' },
};

// Transition Presets
export const TRANSITION_PRESETS: Record<TransitionType, { duration: number }> = {
  none: { duration: 0 },
  fade: { duration: 500 },
  slide: { duration: 600 },
  zoom: { duration: 500 },
  flip: { duration: 800 },
  cube: { duration: 700 },
  dissolve: { duration: 600 },
  wipe: { duration: 500 },
};

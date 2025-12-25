// ==========================================
// Animation Types
// ==========================================

export type AnimationType =
  | 'none'
  | 'fadeIn'
  | 'fadeOut'
  | 'bounce'
  | 'fadeInUp'
  | 'slideInLeft'
  | 'slideInRight'
  | 'slideInUp'
  | 'slideInDown'
  | 'scaleIn'
  | 'scaleOut'
  | 'bounceIn'
  | 'rotateIn'
  | 'typewriter'
  | 'zoomIn'
  | 'pulse'
  | 'fadeInDown'
  | 'shake'
  | 'rotate'
  | 'float';

export type TransitionType = 'none' | 'fade' | 'slide' | 'zoom' | 'flip' | 'cube' | 'dissolve' | 'wipe';

// Animation Engine
export type AnimationEngine = 'css' | 'gsap' | 'anime';

// Animation Configuration
export interface Animation {
  type: AnimationType;
  duration: number; // in ms
  delay: number; // in ms
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
  // Advanced animation options
  engine?: AnimationEngine;
  gsapType?: string; // GSAP animation preset name
  animeType?: string; // Anime.js animation preset name
  gsapEase?: string; // GSAP easing
  animeEase?: string; // Anime.js easing
  stagger?: number; // Stagger delay for text animations
  // Spring animation options (Anime.js v4)
  bounce?: number; // Spring bounce factor (0-1)
  loopDelay?: number; // Delay between loop iterations in ms
}

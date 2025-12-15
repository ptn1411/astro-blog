/**
 * Animation Templates - Pre-configured animations using GSAP and Anime.js
 * These templates can be applied to elements with one click
 */

import type { Animation } from './types';

export interface AnimationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'entrance' | 'emphasis' | 'exit' | 'complex' | 'text' | '3d';
  engine: 'gsap' | 'anime' | 'css';
  preview: string; // CSS class for preview animation
  animation: Partial<Animation>;
  // For complex animations that need multiple properties
  gsapConfig?: Record<string, unknown>;
  animeConfig?: Record<string, unknown>;
}

// ==========================================
// GSAP Animation Templates
// ==========================================

export const GSAP_TEMPLATES: AnimationTemplate[] = [
  // Entrance Animations
  {
    id: 'gsap-fade-up-bounce',
    name: 'Bounce Up',
    description: 'Fade in from bottom with bounce effect',
    category: 'entrance',
    engine: 'gsap',
    preview: 'animate-bounce',
    animation: {
      type: 'fadeInUp',
      duration: 800,
      delay: 0,
      easing: 'ease-out',
      engine: 'gsap',
      gsapType: 'fadeInUp',
      gsapEase: 'bounce.out',
    },
    gsapConfig: {
      y: 100,
      opacity: 0,
      ease: 'bounce.out',
    },
  },
  {
    id: 'gsap-elastic-scale',
    name: 'Elastic Pop',
    description: 'Scale in with elastic bounce',
    category: 'entrance',
    engine: 'gsap',
    preview: 'animate-pulse',
    animation: {
      type: 'scaleIn',
      duration: 1000,
      delay: 0,
      easing: 'ease-out',
      engine: 'gsap',
      gsapType: 'scaleIn',
      gsapEase: 'elastic.out(1, 0.5)',
    },
    gsapConfig: {
      scale: 0,
      opacity: 0,
      ease: 'elastic.out(1, 0.5)',
    },
  },
  {
    id: 'gsap-slide-rotate',
    name: 'Spin Slide',
    description: 'Slide in while rotating',
    category: 'entrance',
    engine: 'gsap',
    preview: 'animate-spin',
    animation: {
      type: 'rotateIn',
      duration: 800,
      delay: 0,
      easing: 'ease-out',
      engine: 'gsap',
      gsapType: 'rotateIn',
      gsapEase: 'back.out(1.7)',
    },
    gsapConfig: {
      x: -200,
      rotation: -180,
      opacity: 0,
      ease: 'back.out(1.7)',
    },
  },
  {
    id: 'gsap-flip-3d',
    name: '3D Flip In',
    description: 'Flip in from X axis',
    category: '3d',
    engine: 'gsap',
    preview: 'animate-pulse',
    animation: {
      type: 'rotateIn',
      duration: 800,
      delay: 0,
      easing: 'ease-out',
      engine: 'gsap',
      gsapType: 'rotateIn',
      gsapEase: 'power3.out',
    },
    gsapConfig: {
      rotationX: -90,
      opacity: 0,
      transformPerspective: 600,
      ease: 'power3.out',
    },
  },
  {
    id: 'gsap-zoom-blur',
    name: 'Zoom Blur',
    description: 'Zoom in with blur effect',
    category: 'entrance',
    engine: 'gsap',
    preview: 'animate-pulse',
    animation: {
      type: 'zoomIn',
      duration: 600,
      delay: 0,
      easing: 'ease-out',
      engine: 'gsap',
      gsapType: 'zoomIn',
      gsapEase: 'power2.out',
    },
    gsapConfig: {
      scale: 2,
      opacity: 0,
      filter: 'blur(10px)',
      ease: 'power2.out',
    },
  },
  {
    id: 'gsap-drop-bounce',
    name: 'Drop & Bounce',
    description: 'Drop from top with bounce',
    category: 'entrance',
    engine: 'gsap',
    preview: 'animate-bounce',
    animation: {
      type: 'slideInDown',
      duration: 1000,
      delay: 0,
      easing: 'ease-out',
      engine: 'gsap',
      gsapType: 'slideInDown',
      gsapEase: 'bounce.out',
    },
    gsapConfig: {
      y: -300,
      opacity: 0,
      ease: 'bounce.out',
    },
  },
  // Emphasis Animations
  {
    id: 'gsap-heartbeat',
    name: 'Heartbeat',
    description: 'Pulsing heartbeat effect',
    category: 'emphasis',
    engine: 'gsap',
    preview: 'animate-pulse',
    animation: {
      type: 'pulse',
      duration: 800,
      delay: 0,
      easing: 'ease-in-out',
      engine: 'gsap',
      gsapType: 'pulse',
      gsapEase: 'power1.inOut',
    },
    gsapConfig: {
      scale: 1.15,
      ease: 'power1.inOut',
      yoyo: true,
      repeat: 1,
    },
  },
  {
    id: 'gsap-jello',
    name: 'Jello Wobble',
    description: 'Wobble like jelly',
    category: 'emphasis',
    engine: 'gsap',
    preview: 'animate-pulse',
    animation: {
      type: 'shake',
      duration: 900,
      delay: 0,
      easing: 'ease-out',
      engine: 'gsap',
      gsapType: 'shake',
      gsapEase: 'elastic.out(1, 0.3)',
    },
    gsapConfig: {
      skewX: 15,
      skewY: 0,
      ease: 'elastic.out(1, 0.3)',
    },
  },
  {
    id: 'gsap-rubber-band',
    name: 'Rubber Band',
    description: 'Stretch and snap like rubber',
    category: 'emphasis',
    engine: 'gsap',
    preview: 'animate-pulse',
    animation: {
      type: 'bounce',
      duration: 800,
      delay: 0,
      easing: 'ease-out',
      engine: 'gsap',
      gsapType: 'bounce',
      gsapEase: 'elastic.out(1, 0.4)',
    },
    gsapConfig: {
      scaleX: 1.25,
      scaleY: 0.75,
      ease: 'elastic.out(1, 0.4)',
    },
  },
  {
    id: 'gsap-tada',
    name: 'Tada!',
    description: 'Attention-grabbing tada effect',
    category: 'emphasis',
    engine: 'gsap',
    preview: 'animate-spin',
    animation: {
      type: 'shake',
      duration: 1000,
      delay: 0,
      easing: 'ease-out',
      engine: 'gsap',
      gsapType: 'shake',
      gsapEase: 'power2.out',
    },
    gsapConfig: {
      rotation: 3,
      scale: 1.1,
      ease: 'power2.out',
    },
  },
  // Complex Animations
  {
    id: 'gsap-stagger-letters',
    name: 'Letter Cascade',
    description: 'Animate each letter sequentially',
    category: 'text',
    engine: 'gsap',
    preview: 'animate-pulse',
    animation: {
      type: 'typewriter',
      duration: 1500,
      delay: 0,
      easing: 'ease-out',
      engine: 'gsap',
      gsapType: 'typewriter',
      gsapEase: 'power2.out',
      stagger: 0.05,
    },
    gsapConfig: {
      stagger: 0.05,
      y: 20,
      opacity: 0,
    },
  },
  {
    id: 'gsap-wave-text',
    name: 'Wave Text',
    description: 'Text animates in a wave pattern',
    category: 'text',
    engine: 'gsap',
    preview: 'animate-pulse',
    animation: {
      type: 'typewriter',
      duration: 1200,
      delay: 0,
      easing: 'ease-in-out',
      engine: 'gsap',
      gsapType: 'typewriter',
      gsapEase: 'sine.inOut',
      stagger: 0.03,
    },
    gsapConfig: {
      stagger: 0.03,
      y: -30,
      ease: 'sine.inOut',
    },
  },
  // 3D Animations
  {
    id: 'gsap-card-flip',
    name: 'Card Flip',
    description: '3D card flip on Y axis',
    category: '3d',
    engine: 'gsap',
    preview: 'animate-pulse',
    animation: {
      type: 'rotateIn',
      duration: 800,
      delay: 0,
      easing: 'ease-in-out',
      engine: 'gsap',
      gsapType: 'rotateIn',
      gsapEase: 'power2.inOut',
    },
    gsapConfig: {
      rotationY: 180,
      transformPerspective: 800,
      ease: 'power2.inOut',
    },
  },
  {
    id: 'gsap-cube-rotate',
    name: 'Cube Rotate',
    description: '3D cube rotation effect',
    category: '3d',
    engine: 'gsap',
    preview: 'animate-spin',
    animation: {
      type: 'rotateIn',
      duration: 1000,
      delay: 0,
      easing: 'ease-out',
      engine: 'gsap',
      gsapType: 'rotateIn',
      gsapEase: 'power3.out',
    },
    gsapConfig: {
      rotationX: 90,
      rotationY: 90,
      transformPerspective: 600,
      opacity: 0,
      ease: 'power3.out',
    },
  },
  {
    id: 'gsap-swing-3d',
    name: '3D Swing',
    description: 'Swing in from the top',
    category: '3d',
    engine: 'gsap',
    preview: 'animate-pulse',
    animation: {
      type: 'rotateIn',
      duration: 900,
      delay: 0,
      easing: 'ease-out',
      engine: 'gsap',
      gsapType: 'rotateIn',
      gsapEase: 'elastic.out(1, 0.6)',
    },
    gsapConfig: {
      rotationX: -90,
      transformOrigin: 'top center',
      transformPerspective: 600,
      opacity: 0,
      ease: 'elastic.out(1, 0.6)',
    },
  },
];

// ==========================================
// Anime.js Animation Templates
// ==========================================

export const ANIME_TEMPLATES: AnimationTemplate[] = [
  // Entrance Animations
  {
    id: 'anime-spring-scale',
    name: 'Spring Scale',
    description: 'Scale with spring physics',
    category: 'entrance',
    engine: 'anime',
    preview: 'animate-pulse',
    animation: {
      type: 'scaleIn',
      duration: 1200,
      delay: 0,
      easing: 'spring',
      engine: 'anime',
      animeType: 'scaleIn',
      animeEase: 'spring(1, 80, 10, 0)',
    },
    animeConfig: {
      scale: [0, 1],
      opacity: [0, 1],
      easing: 'spring(1, 80, 10, 0)',
    },
  },
  {
    id: 'anime-slide-spring',
    name: 'Spring Slide',
    description: 'Slide with spring physics',
    category: 'entrance',
    engine: 'anime',
    preview: 'animate-bounce',
    animation: {
      type: 'slideInLeft',
      duration: 1000,
      delay: 0,
      easing: 'spring',
      engine: 'anime',
      animeType: 'slideInLeft',
      animeEase: 'spring(1, 80, 12, 0)',
    },
    animeConfig: {
      translateX: [-250, 0],
      opacity: [0, 1],
      easing: 'spring(1, 80, 12, 0)',
    },
  },
  {
    id: 'anime-morph-in',
    name: 'Morph In',
    description: 'Morph shape while appearing',
    category: 'entrance',
    engine: 'anime',
    preview: 'animate-pulse',
    animation: {
      type: 'scaleIn',
      duration: 800,
      delay: 0,
      easing: 'ease-out',
      engine: 'anime',
      animeType: 'scaleIn',
      animeEase: 'easeOutElastic(1, .6)',
    },
    animeConfig: {
      scale: [0.5, 1],
      borderRadius: ['50%', '0%'],
      opacity: [0, 1],
      easing: 'easeOutElastic(1, .6)',
    },
  },
  {
    id: 'anime-scatter-in',
    name: 'Scatter Assemble',
    description: 'Elements scatter and assemble',
    category: 'complex',
    engine: 'anime',
    preview: 'animate-pulse',
    animation: {
      type: 'fadeIn',
      duration: 1000,
      delay: 0,
      easing: 'ease-out',
      engine: 'anime',
      animeType: 'fadeIn',
      animeEase: 'easeOutExpo',
    },
    animeConfig: {
      scale: [0, 1],
      opacity: [0, 1],
      easing: 'easeOutExpo',
    },
  },
  // Emphasis Animations
  {
    id: 'anime-bounce-attention',
    name: 'Attention Bounce',
    description: 'Bouncy attention grabber',
    category: 'emphasis',
    engine: 'anime',
    preview: 'animate-bounce',
    animation: {
      type: 'bounce',
      duration: 800,
      delay: 0,
      easing: 'ease-out',
      engine: 'anime',
      animeType: 'bounce',
      animeEase: 'easeOutBounce',
    },
    animeConfig: {
      translateY: [-30, 0],
      easing: 'easeOutBounce',
    },
  },
  {
    id: 'anime-swing',
    name: 'Swing Motion',
    description: 'Pendulum swing effect',
    category: 'emphasis',
    engine: 'anime',
    preview: 'animate-pulse',
    animation: {
      type: 'rotate',
      duration: 1000,
      delay: 0,
      easing: 'ease-in-out',
      engine: 'anime',
      animeType: 'rotate',
      animeEase: 'easeInOutSine',
    },
    animeConfig: {
      rotate: [-15, 15, -10, 10, -5, 5, 0],
      transformOrigin: ['50% 0%'],
      easing: 'easeInOutSine',
    },
  },
  {
    id: 'anime-flash',
    name: 'Flash Effect',
    description: 'Quick flash visibility',
    category: 'emphasis',
    engine: 'anime',
    preview: 'animate-pulse',
    animation: {
      type: 'fadeIn',
      duration: 500,
      delay: 0,
      easing: 'linear',
      engine: 'anime',
      animeType: 'fadeIn',
      animeEase: 'steps(2)',
    },
    animeConfig: {
      opacity: [1, 0, 1, 0, 1],
      easing: 'steps(2)',
    },
  },
  // Text Animations
  {
    id: 'anime-letter-spring',
    name: 'Spring Letters',
    description: 'Letters spring in one by one',
    category: 'text',
    engine: 'anime',
    preview: 'animate-pulse',
    animation: {
      type: 'typewriter',
      duration: 1500,
      delay: 0,
      easing: 'spring',
      engine: 'anime',
      animeType: 'typewriter',
      animeEase: 'spring(1, 80, 10, 0)',
      stagger: 0.05,
    },
    animeConfig: {
      translateY: [40, 0],
      opacity: [0, 1],
      easing: 'spring(1, 80, 10, 0)',
    },
  },
  {
    id: 'anime-glitch-text',
    name: 'Glitch Text',
    description: 'Digital glitch effect',
    category: 'text',
    engine: 'anime',
    preview: 'animate-pulse',
    animation: {
      type: 'shake',
      duration: 600,
      delay: 0,
      easing: 'linear',
      engine: 'anime',
      animeType: 'shake',
      animeEase: 'steps(4)',
    },
    animeConfig: {
      translateX: [-5, 5, -3, 3, 0],
      color: ['#ff0000', '#00ff00', '#0000ff', '#ffffff'],
      easing: 'steps(4)',
    },
  },
  {
    id: 'anime-reveal-slide',
    name: 'Reveal Slide',
    description: 'Reveal text with sliding mask',
    category: 'text',
    engine: 'anime',
    preview: 'animate-pulse',
    animation: {
      type: 'slideInLeft',
      duration: 800,
      delay: 0,
      easing: 'ease-out',
      engine: 'anime',
      animeType: 'slideInLeft',
      animeEase: 'easeOutExpo',
    },
    animeConfig: {
      translateX: ['100%', '0%'],
      opacity: [0, 1],
      easing: 'easeOutExpo',
    },
  },
  {
    id: 'anime-stagger-grid',
    name: 'Grid Stagger',
    description: 'Staggered grid appearance',
    category: 'complex',
    engine: 'anime',
    preview: 'animate-pulse',
    animation: {
      type: 'fadeIn',
      duration: 1200,
      delay: 0,
      easing: 'ease-out',
      engine: 'anime',
      animeType: 'fadeIn',
      animeEase: 'easeOutQuad',
    },
    animeConfig: {
      scale: [0, 1],
      opacity: [0, 1],
      easing: 'easeOutQuad',
    },
  },
];

// ==========================================
// Loop Animation Templates
// ==========================================

export const LOOP_TEMPLATES: AnimationTemplate[] = [
  {
    id: 'loop-float',
    name: 'Floating',
    description: 'Gentle floating motion',
    category: 'emphasis',
    engine: 'gsap',
    preview: 'animate-bounce',
    animation: {
      type: 'float',
      duration: 2000,
      delay: 0,
      easing: 'ease-in-out',
      engine: 'gsap',
      gsapType: 'float',
      gsapEase: 'sine.inOut',
    },
    gsapConfig: {
      y: -15,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    },
  },
  {
    id: 'loop-pulse-glow',
    name: 'Pulse Glow',
    description: 'Pulsing glow effect',
    category: 'emphasis',
    engine: 'gsap',
    preview: 'animate-pulse',
    animation: {
      type: 'pulse',
      duration: 1500,
      delay: 0,
      easing: 'ease-in-out',
      engine: 'gsap',
      gsapType: 'pulse',
      gsapEase: 'power1.inOut',
    },
    gsapConfig: {
      scale: 1.05,
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)',
      ease: 'power1.inOut',
      yoyo: true,
      repeat: -1,
    },
  },
  {
    id: 'loop-rotate-slow',
    name: 'Slow Spin',
    description: 'Continuous slow rotation',
    category: 'emphasis',
    engine: 'gsap',
    preview: 'animate-spin',
    animation: {
      type: 'rotate',
      duration: 4000,
      delay: 0,
      easing: 'linear',
      engine: 'gsap',
      gsapType: 'rotate',
      gsapEase: 'none',
    },
    gsapConfig: {
      rotation: 360,
      ease: 'none',
      repeat: -1,
    },
  },
  {
    id: 'loop-breathe',
    name: 'Breathing',
    description: 'Gentle breathing scale',
    category: 'emphasis',
    engine: 'anime',
    preview: 'animate-pulse',
    animation: {
      type: 'pulse',
      duration: 3000,
      delay: 0,
      easing: 'ease-in-out',
      engine: 'anime',
      animeType: 'pulse',
      animeEase: 'easeInOutSine',
    },
    animeConfig: {
      scale: [1, 1.08, 1],
      easing: 'easeInOutSine',
      loop: true,
    },
  },
  {
    id: 'loop-shimmer',
    name: 'Shimmer',
    description: 'Shimmering light effect',
    category: 'emphasis',
    engine: 'gsap',
    preview: 'animate-pulse',
    animation: {
      type: 'fadeIn',
      duration: 2000,
      delay: 0,
      easing: 'ease-in-out',
      engine: 'gsap',
      gsapType: 'fadeIn',
      gsapEase: 'power1.inOut',
    },
    gsapConfig: {
      backgroundPosition: '200% center',
      ease: 'none',
      repeat: -1,
    },
  },
  {
    id: 'loop-wobble',
    name: 'Wobble',
    description: 'Playful wobble motion',
    category: 'emphasis',
    engine: 'anime',
    preview: 'animate-pulse',
    animation: {
      type: 'shake',
      duration: 1000,
      delay: 0,
      easing: 'ease-in-out',
      engine: 'anime',
      animeType: 'shake',
      animeEase: 'easeInOutSine',
    },
    animeConfig: {
      rotate: [-5, 5, -5],
      easing: 'easeInOutSine',
      loop: true,
    },
  },
];

// ==========================================
// All Templates Combined
// ==========================================

export const ALL_ANIMATION_TEMPLATES: AnimationTemplate[] = [...GSAP_TEMPLATES, ...ANIME_TEMPLATES, ...LOOP_TEMPLATES];

// Get templates by category
export function getTemplatesByCategory(category: AnimationTemplate['category']): AnimationTemplate[] {
  return ALL_ANIMATION_TEMPLATES.filter((t) => t.category === category);
}

// Get templates by engine
export function getTemplatesByEngine(engine: 'gsap' | 'anime' | 'css'): AnimationTemplate[] {
  return ALL_ANIMATION_TEMPLATES.filter((t) => t.engine === engine);
}

// Get template by ID
export function getTemplateById(id: string): AnimationTemplate | undefined {
  return ALL_ANIMATION_TEMPLATES.find((t) => t.id === id);
}

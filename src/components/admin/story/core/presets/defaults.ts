// ==========================================
// Default Values
// ==========================================

import type { Animation } from '../types/animation.types';
import type { ElementStyle } from '../types/element.types';
import type { Story, StorySlide } from '../types/story.types';

export const DEFAULT_ELEMENT_STYLE: ElementStyle = {
  x: 100,
  y: 100,
  width: 200,
  height: 100,
  rotation: 0,
  zIndex: 1,
  opacity: 1,
  color: '#ffffff',
  fontSize: 24,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontWeight: 'normal',
  textAlign: 'center',
};

export const DEFAULT_ANIMATION: Animation = {
  type: 'fadeIn',
  duration: 500,
  delay: 0,
  easing: 'ease-out',
};

export const DEFAULT_SLIDE: Omit<StorySlide, 'id'> = {
  duration: 5,
  background: { type: 'color', value: '#111827' },
  elements: [],
  transition: { type: 'fade', duration: 500 },
};

export const DEFAULT_STORY: Omit<Story, 'id'> = {
  title: 'Untitled Story',
  slides: [],
  settings: {
    autoAdvance: true,
    loop: false,
    showProgressBar: true,
  },
};

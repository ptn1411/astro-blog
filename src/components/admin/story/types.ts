// ==========================================
// Story Builder Types - Enhanced Version
// ==========================================

// Animation Types
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

// Element Types
export type ElementType =
  | 'text'
  | 'image'
  | 'video'
  | 'shape'
  | 'sticker'
  | 'gif'
  | 'poll'
  | 'link'
  | 'countdown'
  | 'button';

export type ShapeType =
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'heart'
  | 'arrow'
  | 'line'
  | 'hexagon'
  | 'pentagon'
  | 'octagon'
  | 'diamond'
  | 'parallelogram'
  | 'trapezoid'
  | 'cross'
  | 'plus'
  | 'chevron'
  | 'badge'
  | 'ribbon'
  | 'speech-bubble'
  | 'thought-bubble'
  | 'explosion'
  | 'wave'
  | 'arc';

export type TextAlign = 'left' | 'center' | 'right';
export type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';

// Animation Configuration
export interface Animation {
  type: AnimationType;
  duration: number; // in ms
  delay: number; // in ms
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
}

// Element Style
export interface ElementStyle {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  // Text specific
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic' | 'oblique'; // Add this line
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
  textShadow?: string;
  // Shape specific
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  // Effects
  boxShadow?: string;
  blur?: number;
  // Gradient
  gradient?: {
    type: 'linear' | 'radial';
    angle?: number;
    colors: { color: string; position: number }[];
  };
}

// Story Element
export interface StoryElement {
  id: string;
  type: ElementType;
  content: string;
  style: ElementStyle;
  animation?: {
    enter?: Animation;
    exit?: Animation;
    loop?: Animation;
  };
  // Type-specific data
  shapeType?: ShapeType;
  link?: {
    url: string;
    label?: string;
  };
  poll?: {
    question: string;
    options: string[];
  };
  countdown?: {
    targetDate: string;
    label?: string;
  };
  button?: {
    href: string;
    target?: '_blank' | '_self';
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  };
  locked?: boolean;
  visible?: boolean;
}

// Background Configuration
export interface SlideBackground {
  type: 'color' | 'image' | 'video' | 'gradient';
  value: string;
  gradient?: {
    type: 'linear' | 'radial';
    angle?: number;
    colors: { color: string; position: number }[];
  };
  filter?: {
    blur?: number;
    brightness?: number;
    contrast?: number;
    saturate?: number;
  };
}

// Story Slide
export interface StorySlide {
  id: string;
  duration: number; // in seconds
  background: SlideBackground;
  elements: StoryElement[];
  transition?: {
    type: TransitionType;
    duration: number;
  };
  audio?: {
    src: string;
    volume: number;
    startTime?: number;
  };
}

// Story Audio
export interface StoryAudio {
  src: string;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
}

// Complete Story
export interface Story {
  id: string;
  title: string;
  description?: string;

  thumbnail?: string;
  slides: StorySlide[];
  audio?: StoryAudio;
  createdAt?: string;
  updatedAt?: string;
  settings?: {
    autoAdvance: boolean;
    loop: boolean;
    showProgressBar: boolean;
  };
}

// Template
export interface StoryTemplate {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  story: Omit<Story, 'id' | 'title' | 'createdAt' | 'updatedAt'>;
}

// Canvas State
export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showSafeZone: boolean;
  showRulers: boolean;
}

// Editor State
export interface EditorState {
  selectedElementIds: string[];
  copiedElements: StoryElement[];
  isMultiSelect: boolean;
  tool: 'select' | 'text' | 'shape' | 'draw';
}

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

// Font Options
export const FONT_OPTIONS = [
  { label: 'System', value: 'system-ui, -apple-system, sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Playfair Display', value: 'Playfair Display, serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Oswald', value: 'Oswald, sans-serif' },
  { label: 'Poppins', value: 'Poppins, sans-serif' },
  { label: 'Dancing Script', value: 'Dancing Script, cursive' },
  { label: 'Pacifico', value: 'Pacifico, cursive' },
  { label: 'Bebas Neue', value: 'Bebas Neue, sans-serif' },
];

// Color Presets
export const COLOR_PRESETS = {
  backgrounds: [
    '#000000',
    '#111827',
    '#1f2937',
    '#374151',
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#84cc16',
    '#10b981',
    '#14b8a6',
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#a855f7',
    '#ec4899',
    '#f43f5e',
  ],
  text: [
    '#ffffff',
    '#f3f4f6',
    '#e5e7eb',
    '#d1d5db',
    '#9ca3af',
    '#6b7280',
    '#4b5563',
    '#374151',
    '#1f2937',
    '#111827',
    '#000000',
  ],
  gradients: [
    { name: 'Sunset', colors: ['#f97316', '#ec4899'] },
    { name: 'Ocean', colors: ['#3b82f6', '#10b981'] },
    { name: 'Purple Dream', colors: ['#8b5cf6', '#ec4899'] },
    { name: 'Forest', colors: ['#10b981', '#84cc16'] },
    { name: 'Neon', colors: ['#f97316', '#f43f5e', '#8b5cf6'] },
    { name: 'Midnight', colors: ['#1f2937', '#4f46e5'] },
  ],
};

// Default Values
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

// ==========================================
// Story Types
// ==========================================

import type { Animation, TransitionType } from './animation.types';
import type { ElementType, ElementStyle, ShapeType } from './element.types';

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
    submitUrl?: string;
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
  // Quote element
  quote?: {
    author?: string;
    source?: string;
    style?: 'simple' | 'decorative' | 'modern' | 'minimal';
  };
  // List element
  list?: {
    items: string[];
    type: 'bullet' | 'numbered' | 'checklist' | 'icon';
    icon?: string;
  };
  // Avatar element
  avatar?: {
    name?: string;
    subtitle?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    shape?: 'circle' | 'square' | 'rounded';
  };
  // Rating element
  rating?: {
    value: number;
    max: number;
    icon?: 'star' | 'heart' | 'circle';
    showValue?: boolean;
  };
  // Progress element
  progress?: {
    value: number;
    max: number;
    label?: string;
    showPercent?: boolean;
    variant?: 'bar' | 'circle' | 'ring';
  };
  // Timer element
  timer?: {
    duration: number; // seconds
    autoStart?: boolean;
    showLabels?: boolean;
    format?: 'hms' | 'ms' | 's';
  };
  // Location element
  location?: {
    name: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  // Embed element
  embed?: {
    type: 'youtube' | 'spotify' | 'twitter' | 'instagram' | 'tiktok' | 'custom';
    url: string;
  };
  // Codeblock element
  codeblock?: {
    language: string;
    theme?: 'dark' | 'light';
    showLineNumbers?: boolean;
  };
  // Mention element
  mention?: {
    username: string;
    platform?: 'instagram' | 'twitter' | 'tiktok' | 'youtube';
    verified?: boolean;
  };
  // Hashtag element
  hashtag?: {
    tags: string[];
    clickable?: boolean;
  };
  // QR Code element
  qrcode?: {
    data: string;
    size?: number;
    color?: string;
    bgColor?: string;
  };
  // Divider element
  divider?: {
    style: 'solid' | 'dashed' | 'dotted' | 'gradient' | 'fancy';
    thickness?: number;
  };
  // Carousel element
  carousel?: {
    images: string[];
    autoPlay?: boolean;
    interval?: number;
  };
  // Slider element
  slider?: {
    images: { src: string; caption?: string }[];
    currentIndex?: number;
  };
  timings?: {
    start: number; // Start time in ms relative to slide start
    duration: number; // Duration in ms
  };
  locked?: boolean;
  visible?: boolean;
}

// Background Configuration
export interface SlideBackground {
  type: 'color' | 'image' | 'video' | 'gradient';
  value: string;
  // Image specific
  size?: string; // 'cover' | 'contain' | 'auto' | '100% 100%'
  position?: string; // 'center' | 'top' | 'bottom' etc.
  overlay?: string; // rgba overlay color
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
    endTime?: number;
    duration?: number; // Total duration of audio file
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

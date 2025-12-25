// ==========================================
// Element Types
// ==========================================

import type { Animation } from './animation.types';

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
  | 'button'
  | 'divider'
  | 'quote'
  | 'list'
  | 'avatar'
  | 'rating'
  | 'progress'
  | 'timer'
  | 'location'
  | 'embed'
  | 'codeblock'
  | 'mention'
  | 'hashtag'
  | 'qrcode'
  | 'carousel'
  | 'slider';

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
  | 'arc'
  | 'blob'
  | 'squircle'
  | 'pill'
  | 'ring'
  | 'donut'
  | 'corner'
  | 'frame'
  | 'bracket'
  | 'zigzag'
  | 'spiral'
  | 'cloud'
  | 'lightning'
  | 'moon'
  | 'sun'
  | 'cursor'
  | 'check'
  | 'x-mark';

export type TextAlign = 'left' | 'center' | 'right';
export type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';

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
  fontStyle?: 'normal' | 'italic' | 'oblique';
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

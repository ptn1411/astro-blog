/**
 * useStoryAI - Hook for registering story context and actions with CopilotKit
 * 
 * This hook:
 * - Registers current story data as readable context for AI
 * - Updates context automatically when story state changes
 * - Provides selected element details to AI
 * - Exposes story builder actions (addElement, updateElement, addSlide, etc.) to AI
 * - Supports complex operations: batch creation, templates, layouts, bulk styling
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4
 */

import { useCopilotReadable, useCopilotAction } from '@copilotkit/react-core';
import { useMemo } from 'react';
import type { 
  Story, 
  StorySlide, 
  StoryElement,
  ElementType,
  ElementStyle,
  ShapeType,
  SlideBackground,
  Animation,
  AnimationType,
  TransitionType,
} from '../types';
import { ALL_ANIMATION_TEMPLATES, getTemplateById } from '../animations/templates/animationTemplates';

// ==========================================
// Types & Interfaces
// ==========================================

/**
 * Context data structure sent to AI
 */
export interface StoryContext {
  story: {
    id: string;
    title: string;
    slideCount: number;
    currentSlideIndex: number;
    totalElements: number;
  };
  currentSlide: {
    id: string;
    duration: number;
    background: {
      type: string;
      value: string;
    };
    elementCount: number;
    elements: Array<{
      id: string;
      type: ElementType;
      content: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      zIndex: number;
    }>;
  };
  allSlides: Array<{
    id: string;
    index: number;
    elementCount: number;
    duration: number;
  }>;
  selectedElement: {
    id: string;
    type: ElementType;
    content: string;
    style: ElementStyle;
  } | null;
}

/**
 * Element creation data for batch operations
 */
export interface ElementCreationData {
  type: ElementType;
  content: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  style?: Partial<ElementStyle>;
  extra?: Record<string, unknown>;
}

/**
 * Layout configuration for auto-positioning
 */
export interface LayoutConfig {
  type: 'grid' | 'stack' | 'row' | 'column' | 'scatter' | 'circle';
  columns?: number;
  rows?: number;
  gap?: number;
  startX?: number;
  startY?: number;
  containerWidth?: number;
  containerHeight?: number;
}

/**
 * Slide template definition
 */
export interface SlideTemplate {
  name: string;
  background: Partial<SlideBackground>;
  elements: ElementCreationData[];
  duration?: number;
}

/**
 * Story builder actions interface (extended)
 */
export interface StoryBuilderActions {
  /** Add a new element to the current slide */
  addElement: (type: ElementType, content: string, extra?: Record<string, unknown>) => string | void;
  /** Update an existing element */
  updateElement: (elementId: string, updates: Partial<StoryElement> | Partial<ElementStyle>) => void;
  /** Delete an element */
  deleteElement: (elementId: string) => void;
  /** Add a new slide */
  addSlide: () => string | void;
  /** Update a slide */
  updateSlide: (slideId: string, updates: Partial<StorySlide>) => void;
  /** Delete a slide */
  deleteSlide?: (slideId: string) => void;
  /** Duplicate an element */
  duplicateElement?: (elementId: string) => string | void;
  /** Navigate to slide */
  goToSlide?: (index: number) => void;
  /** Reorder elements */
  reorderElements?: (elementIds: string[]) => void;
  /** Set element animation */
  setElementAnimation?: (elementId: string, animationType: 'enter' | 'exit' | 'loop', animation: Animation | null) => void;
  /** Set slide transition */
  setSlideTransition?: (slideId: string, transition: { type: TransitionType; duration: number } | null) => void;
}

/**
 * Options for useStoryAI hook
 */
export interface UseStoryAIOptions {
  /** Current story data */
  story: Story;
  /** Currently active slide */
  currentSlide: StorySlide;
  /** Index of current slide */
  currentSlideIndex: number;
  /** Currently selected element (if any) */
  selectedElement: StoryElement | null;
  /** Story builder actions to expose to AI */
  actions?: StoryBuilderActions;
}

// ==========================================
// Predefined Templates
// ==========================================

const SLIDE_TEMPLATES: Record<string, SlideTemplate> = {
  'title-slide': {
    name: 'Title Slide',
    background: { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    elements: [
      { type: 'text', content: 'Tiêu đề chính', x: 540, y: 800, width: 900, height: 120, style: { fontSize: 72, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' } },
      { type: 'text', content: 'Phụ đề hoặc mô tả ngắn', x: 540, y: 950, width: 800, height: 60, style: { fontSize: 32, color: '#ffffffcc', textAlign: 'center' } },
    ],
    duration: 5,
  },
  'news-headline': {
    name: 'News Headline',
    background: { type: 'color', value: '#1a1a2e' },
    elements: [
      { type: 'shape', content: '', x: 0, y: 0, width: 1080, height: 200, extra: { shapeType: 'rectangle' }, style: { backgroundColor: '#e94560' } },
      { type: 'text', content: 'TIN NÓNG', x: 540, y: 100, width: 400, height: 80, style: { fontSize: 48, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' } },
      { type: 'text', content: 'Nội dung tin tức chính ở đây', x: 540, y: 960, width: 980, height: 200, style: { fontSize: 42, fontWeight: 'semibold', color: '#ffffff', textAlign: 'center' } },
    ],
    duration: 7,
  },
  'quote-card': {
    name: 'Quote Card',
    background: { type: 'gradient', value: 'linear-gradient(180deg, #2c3e50 0%, #1a1a2e 100%)' },
    elements: [
      { type: 'text', content: '"', x: 100, y: 700, width: 100, height: 200, style: { fontSize: 200, color: '#e94560', fontWeight: 'bold' } },
      { type: 'text', content: 'Câu trích dẫn đáng nhớ của bạn ở đây', x: 540, y: 900, width: 880, height: 300, style: { fontSize: 36, color: '#ffffff', textAlign: 'center', fontStyle: 'italic' } },
      { type: 'text', content: '— Tác giả', x: 540, y: 1250, width: 400, height: 50, style: { fontSize: 24, color: '#888888', textAlign: 'center' } },
    ],
    duration: 6,
  },
  'image-with-caption': {
    name: 'Image with Caption',
    background: { type: 'color', value: '#000000' },
    elements: [
      { type: 'image', content: '', x: 540, y: 700, width: 1000, height: 800, style: { borderRadius: 20 } },
      { type: 'text', content: 'Chú thích hình ảnh', x: 540, y: 1200, width: 900, height: 80, style: { fontSize: 28, color: '#ffffff', textAlign: 'center' } },
    ],
    duration: 5,
  },
  'stats-card': {
    name: 'Statistics Card',
    background: { type: 'gradient', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
    elements: [
      { type: 'text', content: '1,234', x: 540, y: 800, width: 600, height: 200, style: { fontSize: 120, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' } },
      { type: 'text', content: 'Số liệu thống kê', x: 540, y: 1000, width: 600, height: 60, style: { fontSize: 32, color: '#ffffffcc', textAlign: 'center' } },
      { type: 'shape', content: '', x: 540, y: 1100, width: 100, height: 4, extra: { shapeType: 'rectangle' }, style: { backgroundColor: '#ffffff' } },
      { type: 'text', content: 'Mô tả chi tiết về số liệu', x: 540, y: 1180, width: 800, height: 100, style: { fontSize: 24, color: '#ffffffaa', textAlign: 'center' } },
    ],
    duration: 5,
  },
  'comparison': {
    name: 'Comparison Slide',
    background: { type: 'color', value: '#1a1a2e' },
    elements: [
      { type: 'text', content: 'VS', x: 540, y: 960, width: 150, height: 100, style: { fontSize: 48, fontWeight: 'bold', color: '#e94560', textAlign: 'center' } },
      { type: 'shape', content: '', x: 270, y: 960, width: 400, height: 600, extra: { shapeType: 'rectangle' }, style: { backgroundColor: '#16213e', borderRadius: 20 } },
      { type: 'shape', content: '', x: 810, y: 960, width: 400, height: 600, extra: { shapeType: 'rectangle' }, style: { backgroundColor: '#16213e', borderRadius: 20 } },
      { type: 'text', content: 'Lựa chọn A', x: 270, y: 750, width: 350, height: 60, style: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' } },
      { type: 'text', content: 'Lựa chọn B', x: 810, y: 750, width: 350, height: 60, style: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' } },
    ],
    duration: 7,
  },
  'list-slide': {
    name: 'List Slide',
    background: { type: 'gradient', value: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
    elements: [
      { type: 'text', content: 'Danh sách', x: 540, y: 300, width: 800, height: 80, style: { fontSize: 48, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' } },
      { type: 'text', content: '1. Mục đầu tiên', x: 150, y: 500, width: 800, height: 60, style: { fontSize: 32, color: '#ffffff', textAlign: 'left' } },
      { type: 'text', content: '2. Mục thứ hai', x: 150, y: 600, width: 800, height: 60, style: { fontSize: 32, color: '#ffffff', textAlign: 'left' } },
      { type: 'text', content: '3. Mục thứ ba', x: 150, y: 700, width: 800, height: 60, style: { fontSize: 32, color: '#ffffff', textAlign: 'left' } },
    ],
    duration: 6,
  },
  'cta-slide': {
    name: 'Call to Action',
    background: { type: 'gradient', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    elements: [
      { type: 'text', content: 'Hành động ngay!', x: 540, y: 800, width: 800, height: 100, style: { fontSize: 56, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' } },
      { type: 'text', content: 'Mô tả ngắn về lời kêu gọi hành động', x: 540, y: 920, width: 700, height: 60, style: { fontSize: 28, color: '#ffffffcc', textAlign: 'center' } },
      { type: 'button', content: 'Bắt đầu', x: 540, y: 1100, width: 300, height: 70, extra: { button: { href: '#', target: '_blank', variant: 'primary' } }, style: { fontSize: 24, backgroundColor: '#ffffff', color: '#f5576c', borderRadius: 35 } },
    ],
    duration: 5,
  },
};

// ==========================================
// Helper Functions
// ==========================================

/**
 * Build context object from story state
 */
export function buildStoryContext(options: UseStoryAIOptions): StoryContext {
  const { story, currentSlide, currentSlideIndex, selectedElement } = options;

  const totalElements = story.slides.reduce((sum, slide) => sum + slide.elements.length, 0);

  return {
    story: {
      id: story.id,
      title: story.title,
      slideCount: story.slides.length,
      currentSlideIndex,
      totalElements,
    },
    currentSlide: {
      id: currentSlide.id,
      duration: currentSlide.duration,
      background: {
        type: currentSlide.background.type,
        value: currentSlide.background.value,
      },
      elementCount: currentSlide.elements.length,
      elements: currentSlide.elements.map((el) => ({
        id: el.id,
        type: el.type,
        content: el.content,
        position: { x: el.style.x, y: el.style.y },
        size: { width: el.style.width, height: el.style.height },
        zIndex: el.style.zIndex,
      })),
    },
    allSlides: story.slides.map((slide, index) => ({
      id: slide.id,
      index,
      elementCount: slide.elements.length,
      duration: slide.duration,
    })),
    selectedElement: selectedElement
      ? {
          id: selectedElement.id,
          type: selectedElement.type,
          content: selectedElement.content,
          style: selectedElement.style,
        }
      : null,
  };
}

/**
 * Format context as readable string for AI
 */
export function formatContextForAI(context: StoryContext): string {
  const lines: string[] = [];

  // Story info
  lines.push(`## Story: "${context.story.title}"`);
  lines.push(`- ID: ${context.story.id}`);
  lines.push(`- Total slides: ${context.story.slideCount}`);
  lines.push(`- Total elements: ${context.story.totalElements}`);
  lines.push(`- Current slide: ${context.story.currentSlideIndex + 1} of ${context.story.slideCount}`);
  lines.push('');

  // All slides overview
  lines.push(`## All Slides Overview:`);
  context.allSlides.forEach((slide) => {
    const isCurrent = slide.index === context.story.currentSlideIndex;
    lines.push(`- Slide ${slide.index + 1}${isCurrent ? ' (current)' : ''}: ${slide.elementCount} elements, ${slide.duration}s`);
  });
  lines.push('');

  // Current slide info
  lines.push(`## Current Slide Details`);
  lines.push(`- ID: ${context.currentSlide.id}`);
  lines.push(`- Duration: ${context.currentSlide.duration}s`);
  lines.push(`- Background: ${context.currentSlide.background.type} (${context.currentSlide.background.value})`);
  lines.push(`- Elements: ${context.currentSlide.elementCount}`);
  lines.push('');

  // Elements list
  if (context.currentSlide.elements.length > 0) {
    lines.push(`### Elements on this slide:`);
    context.currentSlide.elements.forEach((el, index) => {
      const contentPreview = el.content.substring(0, 50) + (el.content.length > 50 ? '...' : '');
      lines.push(`${index + 1}. [${el.type}] ID: ${el.id}`);
      lines.push(`   Content: "${contentPreview}"`);
      lines.push(`   Position: (${el.position.x}, ${el.position.y}) | Size: ${el.size.width}x${el.size.height} | Z: ${el.zIndex}`);
    });
    lines.push('');
  }

  // Selected element
  if (context.selectedElement) {
    lines.push(`## Selected Element`);
    lines.push(`- ID: ${context.selectedElement.id}`);
    lines.push(`- Type: ${context.selectedElement.type}`);
    lines.push(`- Content: "${context.selectedElement.content}"`);
    lines.push(`- Style:`);
    lines.push(`  - Position: (${context.selectedElement.style.x}, ${context.selectedElement.style.y})`);
    lines.push(`  - Size: ${context.selectedElement.style.width}x${context.selectedElement.style.height}`);
    lines.push(`  - Rotation: ${context.selectedElement.style.rotation}°`);
    lines.push(`  - Opacity: ${context.selectedElement.style.opacity}`);
    lines.push(`  - Z-Index: ${context.selectedElement.style.zIndex}`);
    if (context.selectedElement.style.color) {
      lines.push(`  - Color: ${context.selectedElement.style.color}`);
    }
    if (context.selectedElement.style.fontSize) {
      lines.push(`  - Font size: ${context.selectedElement.style.fontSize}px`);
    }
    if (context.selectedElement.style.backgroundColor) {
      lines.push(`  - Background: ${context.selectedElement.style.backgroundColor}`);
    }
  } else {
    lines.push(`## No element selected`);
  }

  // Available templates
  lines.push('');
  lines.push(`## Available Slide Templates:`);
  Object.keys(SLIDE_TEMPLATES).forEach((key) => {
    lines.push(`- ${key}: ${SLIDE_TEMPLATES[key].name}`);
  });

  // Available animation templates
  lines.push('');
  lines.push(`## Available Animation Templates:`);
  lines.push(`### Entrance: gsap-fade-up-bounce, gsap-elastic-scale, gsap-slide-rotate, gsap-zoom-blur, gsap-drop-bounce, anime-spring-scale, anime-slide-spring, anime-morph-in`);
  lines.push(`### Emphasis: gsap-heartbeat, gsap-jello, gsap-rubber-band, gsap-tada, anime-bounce-attention, anime-swing, anime-flash`);
  lines.push(`### Text: gsap-stagger-letters, gsap-wave-text, anime-letter-spring, anime-glitch-text, anime-reveal-slide`);
  lines.push(`### 3D: gsap-flip-3d, gsap-card-flip, gsap-cube-rotate, gsap-swing-3d`);
  lines.push(`### Loop: loop-float, loop-pulse-glow, loop-rotate-slow, loop-breathe, loop-shimmer, loop-wobble`);
  lines.push('');
  lines.push(`## Animation Types: fadeIn, fadeOut, bounce, fadeInUp, slideInLeft, slideInRight, slideInUp, slideInDown, scaleIn, scaleOut, bounceIn, rotateIn, typewriter, zoomIn, pulse, fadeInDown, shake, rotate, float`);
  lines.push(`## Transition Types: none, fade, slide, zoom, flip, cube, dissolve, wipe`);
  lines.push('');
  lines.push(`## Available Element Types:`);
  lines.push(`- Basic: text, image, video, shape, button, divider`);
  lines.push(`- Interactive: poll, countdown, rating, progress, timer, qrcode`);
  lines.push(`- Social: mention, hashtag, link, location, embed`);
  lines.push(`- Content: quote, list, avatar, codeblock, carousel, slider`);
  lines.push(`- Fun: sticker, gif`);
  lines.push('');
  lines.push(`## Available Shapes: rectangle, circle, triangle, diamond, pentagon, hexagon, octagon, star, heart, arrow, plus, cross, line, speech-bubble, cloud, moon, sun`);
  lines.push('');
  lines.push(`## Available Stickers (Emoji): 🔥⭐❤️👍🎉✨💯🚀😊😂🥰😎🤔👀💪🙌🎵🎨📸💡🏆🎯💥🌟🍕🍔☕🍩🎂🍦🥤🧁🎬📱💻🎮🎸🎤📷🖼️🎁💎👑🦋🌈☀️🌙⚡`);

  return lines.join('\n');
}

/**
 * Calculate positions for layout
 */
export function calculateLayoutPositions(
  count: number,
  layout: LayoutConfig
): Array<{ x: number; y: number; width: number; height: number }> {
  const {
    type,
    columns = 2,
    rows = Math.ceil(count / columns),
    gap = 20,
    startX = 100,
    startY = 300,
    containerWidth = 880,
    containerHeight = 1200,
  } = layout;

  const positions: Array<{ x: number; y: number; width: number; height: number }> = [];

  switch (type) {
    case 'grid': {
      const cellWidth = (containerWidth - gap * (columns - 1)) / columns;
      const cellHeight = (containerHeight - gap * (rows - 1)) / rows;
      for (let i = 0; i < count; i++) {
        const col = i % columns;
        const row = Math.floor(i / columns);
        positions.push({
          x: startX + col * (cellWidth + gap) + cellWidth / 2,
          y: startY + row * (cellHeight + gap) + cellHeight / 2,
          width: cellWidth,
          height: cellHeight,
        });
      }
      break;
    }
    case 'stack':
    case 'column': {
      const itemHeight = (containerHeight - gap * (count - 1)) / count;
      for (let i = 0; i < count; i++) {
        positions.push({
          x: startX + containerWidth / 2,
          y: startY + i * (itemHeight + gap) + itemHeight / 2,
          width: containerWidth,
          height: itemHeight,
        });
      }
      break;
    }
    case 'row': {
      const itemWidth = (containerWidth - gap * (count - 1)) / count;
      for (let i = 0; i < count; i++) {
        positions.push({
          x: startX + i * (itemWidth + gap) + itemWidth / 2,
          y: startY + containerHeight / 2,
          width: itemWidth,
          height: containerHeight,
        });
      }
      break;
    }
    case 'circle': {
      const centerX = startX + containerWidth / 2;
      const centerY = startY + containerHeight / 2;
      const radius = Math.min(containerWidth, containerHeight) / 3;
      const itemSize = radius / 2;
      for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI * i) / count - Math.PI / 2;
        positions.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          width: itemSize,
          height: itemSize,
        });
      }
      break;
    }
    case 'scatter': {
      for (let i = 0; i < count; i++) {
        positions.push({
          x: startX + Math.random() * containerWidth,
          y: startY + Math.random() * containerHeight,
          width: 200,
          height: 200,
        });
      }
      break;
    }
    default: {
      // Default to stack
      const defaultHeight = (containerHeight - gap * (count - 1)) / count;
      for (let i = 0; i < count; i++) {
        positions.push({
          x: startX + containerWidth / 2,
          y: startY + i * (defaultHeight + gap) + defaultHeight / 2,
          width: containerWidth,
          height: defaultHeight,
        });
      }
    }
  }

  return positions;
}

// ==========================================
// Main Hook
// ==========================================

/**
 * useStoryAI hook - Registers story context and actions with CopilotKit
 * 
 * This hook automatically updates the AI's understanding of the current
 * story state whenever the story, slide, or selection changes.
 * It also exposes story builder actions for AI to execute.
 */
export function useStoryAI(options: UseStoryAIOptions): void {
  const { story, currentSlide, currentSlideIndex, selectedElement, actions } = options;

  // Build context object (memoized to prevent unnecessary updates)
  const context = useMemo(
    () => buildStoryContext({ story, currentSlide, currentSlideIndex, selectedElement }),
    [story, currentSlide, currentSlideIndex, selectedElement]
  );

  // Format context as string for AI
  const contextString = useMemo(
    () => formatContextForAI(context),
    [context]
  );

  // Register story context with CopilotKit
  useCopilotReadable({
    description: 'Current story state including slides, elements, selected element, and available templates',
    value: contextString,
  });

  // ==========================================
  // Basic Actions
  // ==========================================

  /**
   * Action: addElement
   * Allows AI to add new elements to the current slide
   */
  useCopilotAction({
    name: 'addElement',
    description: 'Add a new element to the current slide. Use this to create text, images, shapes, buttons, and other visual elements.',
    parameters: [
      { name: 'type', type: 'string', description: 'Element type: text, image, video, shape, sticker, gif, poll, link, countdown, button, divider, quote, list, avatar, rating, progress, timer, location, embed, codeblock, mention, hashtag, qrcode, carousel, slider', required: true },
      { name: 'content', type: 'string', description: 'Main content. For text: the text. For images/videos: URL. For shapes: can be empty.', required: true },
      { name: 'x', type: 'number', description: 'X position (0-1080). Default: 540 (center)', required: false },
      { name: 'y', type: 'number', description: 'Y position (0-1920). Default: 960 (center)', required: false },
      { name: 'width', type: 'number', description: 'Width in pixels', required: false },
      { name: 'height', type: 'number', description: 'Height in pixels', required: false },
      { name: 'fontSize', type: 'number', description: 'Font size for text elements', required: false },
      { name: 'color', type: 'string', description: 'Text/fill color (hex: #ffffff)', required: false },
      { name: 'backgroundColor', type: 'string', description: 'Background color (hex)', required: false },
      { name: 'shapeType', type: 'string', description: 'For shapes: rectangle, circle, triangle, star, heart, arrow, etc.', required: false },
      { name: 'buttonHref', type: 'string', description: 'For buttons: URL to navigate to', required: false },
      { name: 'fontWeight', type: 'string', description: 'Font weight: normal, medium, semibold, bold, extrabold', required: false },
      { name: 'textAlign', type: 'string', description: 'Text alignment: left, center, right', required: false },
      { name: 'borderRadius', type: 'number', description: 'Border radius in pixels', required: false },
      { name: 'opacity', type: 'number', description: 'Opacity (0-1)', required: false },
    ],
    handler: async (params) => {
      if (!actions?.addElement) return 'Error: addElement action not available';

      const { type, content, x, y, width, height, fontSize, color, backgroundColor, shapeType, buttonHref, fontWeight, textAlign, borderRadius, opacity } = params;
      const elementType = type as ElementType;
      const style: Partial<ElementStyle> = {};
      
      if (x !== undefined) style.x = x;
      if (y !== undefined) style.y = y;
      if (width !== undefined) style.width = width;
      if (height !== undefined) style.height = height;
      if (fontSize !== undefined) style.fontSize = fontSize;
      if (color !== undefined) style.color = color;
      if (backgroundColor !== undefined) style.backgroundColor = backgroundColor;
      if (fontWeight !== undefined) style.fontWeight = fontWeight;
      if (textAlign !== undefined) style.textAlign = textAlign as ElementStyle['textAlign'];
      if (borderRadius !== undefined) style.borderRadius = borderRadius;
      if (opacity !== undefined) style.opacity = opacity;

      const extra: Record<string, unknown> = { style };
      if (shapeType) extra.shapeType = shapeType as ShapeType;
      if (buttonHref) extra.button = { href: buttonHref, target: '_blank' as const };

      actions.addElement(elementType, content, extra);
      return `Added ${type} element: "${content.substring(0, 30)}..."`;
    },
  });

  /**
   * Action: updateElement
   */
  useCopilotAction({
    name: 'updateElement',
    description: 'Update an existing element. Modify text, styles, position, or size.',
    parameters: [
      { name: 'elementId', type: 'string', description: 'Element ID to update', required: true },
      { name: 'content', type: 'string', description: 'New content', required: false },
      { name: 'x', type: 'number', description: 'New X position', required: false },
      { name: 'y', type: 'number', description: 'New Y position', required: false },
      { name: 'width', type: 'number', description: 'New width', required: false },
      { name: 'height', type: 'number', description: 'New height', required: false },
      { name: 'rotation', type: 'number', description: 'Rotation (0-360)', required: false },
      { name: 'opacity', type: 'number', description: 'Opacity (0-1)', required: false },
      { name: 'fontSize', type: 'number', description: 'Font size', required: false },
      { name: 'color', type: 'string', description: 'Color (hex)', required: false },
      { name: 'backgroundColor', type: 'string', description: 'Background color (hex)', required: false },
      { name: 'fontWeight', type: 'string', description: 'Font weight', required: false },
      { name: 'textAlign', type: 'string', description: 'Text alignment', required: false },
      { name: 'borderRadius', type: 'number', description: 'Border radius', required: false },
      { name: 'zIndex', type: 'number', description: 'Z-index for layering', required: false },
    ],
    handler: async (params) => {
      if (!actions?.updateElement) return 'Error: updateElement action not available';

      const { elementId, content, x, y, width, height, rotation, opacity, fontSize, color, backgroundColor, fontWeight, textAlign, borderRadius, zIndex } = params;
      const updates: Partial<StoryElement> & Partial<ElementStyle> = {};
      
      if (content !== undefined) updates.content = content;
      if (x !== undefined) updates.x = x;
      if (y !== undefined) updates.y = y;
      if (width !== undefined) updates.width = width;
      if (height !== undefined) updates.height = height;
      if (rotation !== undefined) updates.rotation = rotation;
      if (opacity !== undefined) updates.opacity = opacity;
      if (fontSize !== undefined) updates.fontSize = fontSize;
      if (color !== undefined) updates.color = color;
      if (backgroundColor !== undefined) updates.backgroundColor = backgroundColor;
      if (fontWeight !== undefined) updates.fontWeight = fontWeight;
      if (textAlign !== undefined) updates.textAlign = textAlign as ElementStyle['textAlign'];
      if (borderRadius !== undefined) updates.borderRadius = borderRadius;
      if (zIndex !== undefined) updates.zIndex = zIndex;

      actions.updateElement(elementId, updates);
      return `Updated element ${elementId}`;
    },
  });

  /**
   * Action: deleteElement
   */
  useCopilotAction({
    name: 'deleteElement',
    description: 'Delete an element from the current slide.',
    parameters: [
      { name: 'elementId', type: 'string', description: 'Element ID to delete', required: true },
    ],
    handler: async ({ elementId }) => {
      if (!actions?.deleteElement) return 'Error: deleteElement action not available';
      actions.deleteElement(elementId);
      return `Deleted element ${elementId}`;
    },
  });

  /**
   * Action: addSlide
   */
  useCopilotAction({
    name: 'addSlide',
    description: 'Add a new empty slide to the story.',
    parameters: [],
    handler: async () => {
      if (!actions?.addSlide) return 'Error: addSlide action not available';
      actions.addSlide();
      return 'Added new slide';
    },
  });

  /**
   * Action: updateSlide
   */
  useCopilotAction({
    name: 'updateSlide',
    description: 'Update slide properties like duration or background.',
    parameters: [
      { name: 'slideId', type: 'string', description: 'Slide ID to update', required: true },
      { name: 'duration', type: 'number', description: 'Duration in seconds', required: false },
      { name: 'backgroundType', type: 'string', description: 'Background type: color, image, video, gradient', required: false },
      { name: 'backgroundValue', type: 'string', description: 'Background value (hex color, URL, or gradient)', required: false },
    ],
    handler: async ({ slideId, duration, backgroundType, backgroundValue }) => {
      if (!actions?.updateSlide) return 'Error: updateSlide action not available';

      const updates: Partial<StorySlide> = {};
      if (duration !== undefined) updates.duration = duration;
      if (backgroundType || backgroundValue) {
        updates.background = {
          type: (backgroundType as StorySlide['background']['type']) || 'color',
          value: backgroundValue || '#000000',
        };
      }

      actions.updateSlide(slideId, updates);
      return `Updated slide ${slideId}`;
    },
  });

  // ==========================================
  // Advanced Actions - Complex Operations
  // ==========================================

  /**
   * Action: createSlideFromTemplate
   * Create a complete slide from predefined templates
   */
  useCopilotAction({
    name: 'createSlideFromTemplate',
    description: 'Create a new slide from a predefined template. Available templates: title-slide, news-headline, quote-card, image-with-caption, stats-card, comparison, list-slide, cta-slide',
    parameters: [
      { name: 'templateName', type: 'string', description: 'Template name: title-slide, news-headline, quote-card, image-with-caption, stats-card, comparison, list-slide, cta-slide', required: true },
      { name: 'customizations', type: 'string', description: 'JSON string of customizations: {"title": "Custom Title", "subtitle": "Custom Subtitle", "backgroundColor": "#ff0000"}', required: false },
    ],
    handler: async ({ templateName, customizations }) => {
      if (!actions?.addSlide || !actions?.addElement || !actions?.updateSlide) {
        return 'Error: Required actions not available';
      }

      const template = SLIDE_TEMPLATES[templateName];
      if (!template) {
        return `Error: Template "${templateName}" not found. Available: ${Object.keys(SLIDE_TEMPLATES).join(', ')}`;
      }

      // Parse customizations
      let customs: Record<string, string> = {};
      if (customizations) {
        try {
          customs = JSON.parse(customizations);
        } catch {
          // Ignore parse errors
        }
      }

      // Add new slide
      actions.addSlide();

      // Update slide background
      if (template.background) {
        const bgValue = customs.backgroundColor || template.background.value || '#000000';
        actions.updateSlide(currentSlide.id, {
          duration: template.duration || 5,
          background: {
            type: template.background.type || 'color',
            value: bgValue,
          },
        });
      }

      // Add elements from template
      const contentMap: Record<string, string> = {
        'Tiêu đề chính': customs.title || 'Tiêu đề chính',
        'Phụ đề hoặc mô tả ngắn': customs.subtitle || 'Phụ đề hoặc mô tả ngắn',
        'TIN NÓNG': customs.label || 'TIN NÓNG',
        'Nội dung tin tức chính ở đây': customs.content || customs.title || 'Nội dung tin tức chính',
      };

      for (const el of template.elements) {
        const content = contentMap[el.content] || el.content;
        const extra: Record<string, unknown> = { style: el.style || {} };
        if (el.extra) Object.assign(extra, el.extra);
        
        actions.addElement(el.type, content, extra);
      }

      return `Created slide from template "${templateName}" with ${template.elements.length} elements`;
    },
  });

  /**
   * Action: addMultipleElements
   * Add multiple elements at once with automatic layout
   */
  useCopilotAction({
    name: 'addMultipleElements',
    description: 'Add multiple elements at once with automatic layout positioning. Great for creating lists, grids, or organized content.',
    parameters: [
      { name: 'elements', type: 'string', description: 'JSON array of elements: [{"type": "text", "content": "Item 1"}, {"type": "text", "content": "Item 2"}]', required: true },
      { name: 'layout', type: 'string', description: 'Layout type: grid, stack, row, column, circle, scatter. Default: stack', required: false },
      { name: 'columns', type: 'number', description: 'Number of columns for grid layout. Default: 2', required: false },
      { name: 'gap', type: 'number', description: 'Gap between elements in pixels. Default: 20', required: false },
      { name: 'startX', type: 'number', description: 'Starting X position. Default: 100', required: false },
      { name: 'startY', type: 'number', description: 'Starting Y position. Default: 300', required: false },
      { name: 'containerWidth', type: 'number', description: 'Container width. Default: 880', required: false },
      { name: 'containerHeight', type: 'number', description: 'Container height. Default: 1200', required: false },
    ],
    handler: async ({ elements, layout, columns, gap, startX, startY, containerWidth, containerHeight }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';

      let elementList: ElementCreationData[];
      try {
        elementList = JSON.parse(elements);
      } catch {
        return 'Error: Invalid JSON format for elements';
      }

      if (!Array.isArray(elementList) || elementList.length === 0) {
        return 'Error: Elements must be a non-empty array';
      }

      const layoutConfig: LayoutConfig = {
        type: (layout as LayoutConfig['type']) || 'stack',
        columns: columns || 2,
        gap: gap || 20,
        startX: startX || 100,
        startY: startY || 300,
        containerWidth: containerWidth || 880,
        containerHeight: containerHeight || 1200,
      };

      const positions = calculateLayoutPositions(elementList.length, layoutConfig);

      for (let i = 0; i < elementList.length; i++) {
        const el = elementList[i];
        const pos = positions[i];
        
        const style: Partial<ElementStyle> = {
          ...el.style,
          x: el.x ?? pos.x,
          y: el.y ?? pos.y,
          width: el.width ?? pos.width,
          height: el.height ?? pos.height,
        };

        const extra: Record<string, unknown> = { style, ...el.extra };
        actions.addElement(el.type, el.content, extra);
      }

      return `Added ${elementList.length} elements with ${layoutConfig.type} layout`;
    },
  });

  /**
   * Action: createNewsStory
   * Create a complete news story with multiple slides
   */
  useCopilotAction({
    name: 'createNewsStory',
    description: 'Create a complete news story with multiple slides. Automatically generates title slide, content slides, and conclusion.',
    parameters: [
      { name: 'headline', type: 'string', description: 'Main headline of the news', required: true },
      { name: 'summary', type: 'string', description: 'Brief summary or subtitle', required: true },
      { name: 'contentPoints', type: 'string', description: 'JSON array of content points: ["Point 1", "Point 2", "Point 3"]', required: true },
      { name: 'conclusion', type: 'string', description: 'Conclusion or call to action', required: false },
      { name: 'theme', type: 'string', description: 'Color theme: dark, light, red, blue, green, purple. Default: dark', required: false },
    ],
    handler: async ({ headline, summary, contentPoints, conclusion, theme }) => {
      if (!actions?.addSlide || !actions?.addElement || !actions?.updateSlide) {
        return 'Error: Required actions not available';
      }

      let points: string[];
      try {
        points = JSON.parse(contentPoints);
      } catch {
        return 'Error: Invalid JSON format for contentPoints';
      }

      // Theme colors
      const themes: Record<string, { bg: string; accent: string; text: string }> = {
        dark: { bg: '#1a1a2e', accent: '#e94560', text: '#ffffff' },
        light: { bg: '#f5f5f5', accent: '#2196f3', text: '#333333' },
        red: { bg: '#1a1a2e', accent: '#ff4757', text: '#ffffff' },
        blue: { bg: '#0a1628', accent: '#00d4ff', text: '#ffffff' },
        green: { bg: '#0d1f0d', accent: '#00ff88', text: '#ffffff' },
        purple: { bg: '#1a0a2e', accent: '#a855f7', text: '#ffffff' },
      };
      const colors = themes[theme || 'dark'] || themes.dark;

      let slideCount = 0;

      // Slide 1: Title
      actions.addSlide();
      slideCount++;
      // Note: We'd need to track the new slide ID, for now we work with current
      
      actions.addElement('shape', '', { 
        style: { x: 540, y: 100, width: 1080, height: 200, backgroundColor: colors.accent },
        shapeType: 'rectangle' 
      });
      actions.addElement('text', 'TIN TỨC', { 
        style: { x: 540, y: 100, width: 400, height: 80, fontSize: 36, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' } 
      });
      actions.addElement('text', headline, { 
        style: { x: 540, y: 800, width: 950, height: 200, fontSize: 48, fontWeight: 'bold', color: colors.text, textAlign: 'center' } 
      });
      actions.addElement('text', summary, { 
        style: { x: 540, y: 1050, width: 850, height: 100, fontSize: 28, color: colors.text + 'cc', textAlign: 'center' } 
      });

      // Content slides
      for (let i = 0; i < points.length; i++) {
        actions.addSlide();
        slideCount++;
        
        actions.addElement('text', `${i + 1}/${points.length}`, { 
          style: { x: 540, y: 200, width: 200, height: 60, fontSize: 24, color: colors.accent, textAlign: 'center' } 
        });
        actions.addElement('text', points[i], { 
          style: { x: 540, y: 900, width: 900, height: 400, fontSize: 36, color: colors.text, textAlign: 'center' } 
        });
      }

      // Conclusion slide
      if (conclusion) {
        actions.addSlide();
        slideCount++;
        
        actions.addElement('text', 'KẾT LUẬN', { 
          style: { x: 540, y: 400, width: 400, height: 80, fontSize: 32, fontWeight: 'bold', color: colors.accent, textAlign: 'center' } 
        });
        actions.addElement('text', conclusion, { 
          style: { x: 540, y: 900, width: 900, height: 300, fontSize: 32, color: colors.text, textAlign: 'center' } 
        });
      }

      return `Created news story with ${slideCount} slides: 1 title + ${points.length} content + ${conclusion ? '1 conclusion' : 'no conclusion'}`;
    },
  });

  /**
   * Action: applyStyleToMultipleElements
   * Apply the same style to multiple elements at once
   */
  useCopilotAction({
    name: 'applyStyleToMultipleElements',
    description: 'Apply the same style changes to multiple elements at once. Useful for consistent styling.',
    parameters: [
      { name: 'elementIds', type: 'string', description: 'JSON array of element IDs: ["id1", "id2", "id3"]', required: true },
      { name: 'color', type: 'string', description: 'Text/fill color (hex)', required: false },
      { name: 'backgroundColor', type: 'string', description: 'Background color (hex)', required: false },
      { name: 'fontSize', type: 'number', description: 'Font size', required: false },
      { name: 'fontWeight', type: 'string', description: 'Font weight', required: false },
      { name: 'opacity', type: 'number', description: 'Opacity (0-1)', required: false },
      { name: 'borderRadius', type: 'number', description: 'Border radius', required: false },
    ],
    handler: async ({ elementIds, color, backgroundColor, fontSize, fontWeight, opacity, borderRadius }) => {
      if (!actions?.updateElement) return 'Error: updateElement action not available';

      let ids: string[];
      try {
        ids = JSON.parse(elementIds);
      } catch {
        return 'Error: Invalid JSON format for elementIds';
      }

      const updates: Partial<ElementStyle> = {};
      if (color !== undefined) updates.color = color;
      if (backgroundColor !== undefined) updates.backgroundColor = backgroundColor;
      if (fontSize !== undefined) updates.fontSize = fontSize;
      if (fontWeight !== undefined) updates.fontWeight = fontWeight;
      if (opacity !== undefined) updates.opacity = opacity;
      if (borderRadius !== undefined) updates.borderRadius = borderRadius;

      for (const id of ids) {
        actions.updateElement(id, updates);
      }

      return `Applied style to ${ids.length} elements`;
    },
  });

  /**
   * Action: alignElements
   * Align multiple elements
   */
  useCopilotAction({
    name: 'alignElements',
    description: 'Align multiple elements horizontally or vertically.',
    parameters: [
      { name: 'elementIds', type: 'string', description: 'JSON array of element IDs to align', required: true },
      { name: 'alignment', type: 'string', description: 'Alignment: left, center, right, top, middle, bottom, distributeH, distributeV', required: true },
    ],
    handler: async ({ elementIds, alignment }) => {
      if (!actions?.updateElement) return 'Error: updateElement action not available';

      let ids: string[];
      try {
        ids = JSON.parse(elementIds);
      } catch {
        return 'Error: Invalid JSON format for elementIds';
      }

      // Get current positions from context
      const elements = context.currentSlide.elements.filter(el => ids.includes(el.id));
      if (elements.length < 2) return 'Need at least 2 elements to align';

      const positions = elements.map(el => ({ id: el.id, x: el.position.x, y: el.position.y, w: el.size.width, h: el.size.height }));

      switch (alignment) {
        case 'left': {
          const minX = Math.min(...positions.map(p => p.x - p.w / 2));
          for (const p of positions) {
            actions.updateElement(p.id, { x: minX + p.w / 2 });
          }
          break;
        }
        case 'center': {
          const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
          for (const p of positions) {
            actions.updateElement(p.id, { x: avgX });
          }
          break;
        }
        case 'right': {
          const maxX = Math.max(...positions.map(p => p.x + p.w / 2));
          for (const p of positions) {
            actions.updateElement(p.id, { x: maxX - p.w / 2 });
          }
          break;
        }
        case 'top': {
          const minY = Math.min(...positions.map(p => p.y - p.h / 2));
          for (const p of positions) {
            actions.updateElement(p.id, { y: minY + p.h / 2 });
          }
          break;
        }
        case 'middle': {
          const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
          for (const p of positions) {
            actions.updateElement(p.id, { y: avgY });
          }
          break;
        }
        case 'bottom': {
          const maxY = Math.max(...positions.map(p => p.y + p.h / 2));
          for (const p of positions) {
            actions.updateElement(p.id, { y: maxY - p.h / 2 });
          }
          break;
        }
        case 'distributeH': {
          const sorted = [...positions].sort((a, b) => a.x - b.x);
          const totalWidth = sorted[sorted.length - 1].x - sorted[0].x;
          const spacing = totalWidth / (sorted.length - 1);
          for (let i = 0; i < sorted.length; i++) {
            actions.updateElement(sorted[i].id, { x: sorted[0].x + i * spacing });
          }
          break;
        }
        case 'distributeV': {
          const sorted = [...positions].sort((a, b) => a.y - b.y);
          const totalHeight = sorted[sorted.length - 1].y - sorted[0].y;
          const spacing = totalHeight / (sorted.length - 1);
          for (let i = 0; i < sorted.length; i++) {
            actions.updateElement(sorted[i].id, { y: sorted[0].y + i * spacing });
          }
          break;
        }
      }

      return `Aligned ${ids.length} elements: ${alignment}`;
    },
  });

  /**
   * Action: createTextList
   * Create a formatted list of text items
   */
  useCopilotAction({
    name: 'createTextList',
    description: 'Create a formatted list of text items with consistent styling.',
    parameters: [
      { name: 'items', type: 'string', description: 'JSON array of list items: ["Item 1", "Item 2", "Item 3"]', required: true },
      { name: 'listStyle', type: 'string', description: 'List style: numbered, bullet, arrow, check, none. Default: numbered', required: false },
      { name: 'startX', type: 'number', description: 'Starting X position. Default: 100', required: false },
      { name: 'startY', type: 'number', description: 'Starting Y position. Default: 400', required: false },
      { name: 'fontSize', type: 'number', description: 'Font size. Default: 32', required: false },
      { name: 'color', type: 'string', description: 'Text color. Default: #ffffff', required: false },
      { name: 'lineSpacing', type: 'number', description: 'Spacing between items. Default: 80', required: false },
    ],
    handler: async ({ items, listStyle, startX, startY, fontSize, color, lineSpacing }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';

      let itemList: string[];
      try {
        itemList = JSON.parse(items);
      } catch {
        return 'Error: Invalid JSON format for items';
      }

      const style = listStyle || 'numbered';
      const x = startX || 100;
      const y = startY || 400;
      const size = fontSize || 32;
      const textColor = color || '#ffffff';
      const spacing = lineSpacing || 80;

      const prefixes: Record<string, (i: number) => string> = {
        numbered: (i) => `${i + 1}. `,
        bullet: () => '• ',
        arrow: () => '→ ',
        check: () => '✓ ',
        none: () => '',
      };

      const getPrefix = prefixes[style] || prefixes.numbered;

      for (let i = 0; i < itemList.length; i++) {
        const content = getPrefix(i) + itemList[i];
        actions.addElement('text', content, {
          style: {
            x: x + 400,
            y: y + i * spacing,
            width: 800,
            height: spacing - 10,
            fontSize: size,
            color: textColor,
            textAlign: 'left',
          },
        });
      }

      return `Created list with ${itemList.length} items using ${style} style`;
    },
  });

  /**
   * Action: deleteMultipleElements
   * Delete multiple elements at once
   */
  useCopilotAction({
    name: 'deleteMultipleElements',
    description: 'Delete multiple elements at once.',
    parameters: [
      { name: 'elementIds', type: 'string', description: 'JSON array of element IDs to delete: ["id1", "id2"]', required: true },
    ],
    handler: async ({ elementIds }) => {
      if (!actions?.deleteElement) return 'Error: deleteElement action not available';

      let ids: string[];
      try {
        ids = JSON.parse(elementIds);
      } catch {
        return 'Error: Invalid JSON format for elementIds';
      }

      for (const id of ids) {
        actions.deleteElement(id);
      }

      return `Deleted ${ids.length} elements`;
    },
  });

  /**
   * Action: clearSlide
   * Remove all elements from current slide
   */
  useCopilotAction({
    name: 'clearSlide',
    description: 'Remove all elements from the current slide.',
    parameters: [],
    handler: async () => {
      if (!actions?.deleteElement) return 'Error: deleteElement action not available';

      const elementIds = context.currentSlide.elements.map(el => el.id);
      for (const id of elementIds) {
        actions.deleteElement(id);
      }

      return `Cleared ${elementIds.length} elements from slide`;
    },
  });

  /**
   * Action: createSocialMediaPost
   * Create a social media style post layout
   */
  useCopilotAction({
    name: 'createSocialMediaPost',
    description: 'Create a social media style post with avatar, username, content, and engagement elements.',
    parameters: [
      { name: 'username', type: 'string', description: 'Username to display', required: true },
      { name: 'content', type: 'string', description: 'Post content/caption', required: true },
      { name: 'avatarUrl', type: 'string', description: 'Avatar image URL (optional)', required: false },
      { name: 'imageUrl', type: 'string', description: 'Post image URL (optional)', required: false },
      { name: 'likes', type: 'string', description: 'Number of likes to display', required: false },
      { name: 'platform', type: 'string', description: 'Platform style: instagram, twitter, tiktok. Default: instagram', required: false },
    ],
    handler: async ({ username, content, avatarUrl, imageUrl, likes, platform }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';

      const platformColors: Record<string, { bg: string; accent: string }> = {
        instagram: { bg: '#000000', accent: '#e1306c' },
        twitter: { bg: '#15202b', accent: '#1da1f2' },
        tiktok: { bg: '#000000', accent: '#ff0050' },
      };
      const colors = platformColors[platform || 'instagram'] || platformColors.instagram;

      // Background card
      actions.addElement('shape', '', {
        style: { x: 540, y: 960, width: 1000, height: 1600, backgroundColor: '#1a1a1a', borderRadius: 30 },
        shapeType: 'rectangle',
      });

      // Avatar placeholder
      if (avatarUrl) {
        actions.addElement('image', avatarUrl, {
          style: { x: 150, y: 300, width: 80, height: 80, borderRadius: 40 },
        });
      } else {
        actions.addElement('shape', '', {
          style: { x: 150, y: 300, width: 80, height: 80, backgroundColor: colors.accent, borderRadius: 40 },
          shapeType: 'circle',
        });
      }

      // Username
      actions.addElement('text', `@${username}`, {
        style: { x: 350, y: 300, width: 400, height: 40, fontSize: 24, fontWeight: 'bold', color: '#ffffff', textAlign: 'left' },
      });

      // Post image
      if (imageUrl) {
        actions.addElement('image', imageUrl, {
          style: { x: 540, y: 750, width: 920, height: 700, borderRadius: 10 },
        });
      }

      // Content
      actions.addElement('text', content, {
        style: { x: 540, y: imageUrl ? 1200 : 800, width: 900, height: 200, fontSize: 28, color: '#ffffff', textAlign: 'left' },
      });

      // Likes
      if (likes) {
        actions.addElement('text', `❤️ ${likes} likes`, {
          style: { x: 200, y: 1450, width: 300, height: 40, fontSize: 22, color: '#888888', textAlign: 'left' },
        });
      }

      return `Created ${platform || 'instagram'} style post for @${username}`;
    },
  });

  /**
   * Action: createCountdownSlide
   * Create a countdown or timer slide
   */
  useCopilotAction({
    name: 'createCountdownSlide',
    description: 'Create a countdown slide for events, launches, or announcements.',
    parameters: [
      { name: 'title', type: 'string', description: 'Countdown title (e.g., "Coming Soon")', required: true },
      { name: 'targetDate', type: 'string', description: 'Target date in ISO format (e.g., "2024-12-31T00:00:00")', required: true },
      { name: 'subtitle', type: 'string', description: 'Additional text below countdown', required: false },
      { name: 'backgroundColor', type: 'string', description: 'Background color (hex)', required: false },
      { name: 'accentColor', type: 'string', description: 'Accent color for numbers (hex)', required: false },
    ],
    handler: async ({ title, targetDate, subtitle, backgroundColor, accentColor }) => {
      if (!actions?.addElement || !actions?.updateSlide) return 'Error: Required actions not available';

      const bgColor = backgroundColor || '#0a0a0a';
      const accent = accentColor || '#00ff88';

      // Update slide background
      actions.updateSlide(currentSlide.id, {
        background: { type: 'color', value: bgColor },
      });

      // Title
      actions.addElement('text', title, {
        style: { x: 540, y: 400, width: 900, height: 100, fontSize: 48, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
      });

      // Countdown element
      actions.addElement('countdown', targetDate, {
        style: { x: 540, y: 900, width: 800, height: 200, fontSize: 72, fontWeight: 'bold', color: accent, textAlign: 'center' },
        countdown: { targetDate, label: title },
      });

      // Subtitle
      if (subtitle) {
        actions.addElement('text', subtitle, {
          style: { x: 540, y: 1200, width: 800, height: 80, fontSize: 28, color: '#888888', textAlign: 'center' },
        });
      }

      return `Created countdown slide: "${title}" targeting ${targetDate}`;
    },
  });

  // ==========================================
  // Quick Add Elements Actions
  // ==========================================

  /**
   * Action: addImage
   * Add an image element with URL
   */
  useCopilotAction({
    name: 'addImage',
    description: 'Add an image to the slide. Provide an image URL.',
    parameters: [
      { name: 'url', type: 'string', description: 'Image URL (https://... or local path)', required: true },
      { name: 'x', type: 'number', description: 'X position. Default: 540', required: false },
      { name: 'y', type: 'number', description: 'Y position. Default: 960', required: false },
      { name: 'width', type: 'number', description: 'Width. Default: 400', required: false },
      { name: 'height', type: 'number', description: 'Height. Default: 400', required: false },
      { name: 'borderRadius', type: 'number', description: 'Border radius. Default: 0', required: false },
      { name: 'opacity', type: 'number', description: 'Opacity (0-1). Default: 1', required: false },
    ],
    handler: async ({ url, x, y, width, height, borderRadius, opacity }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';
      
      actions.addElement('image', url, {
        style: {
          x: x || 540,
          y: y || 960,
          width: width || 400,
          height: height || 400,
          borderRadius: borderRadius || 0,
          opacity: opacity || 1,
        },
      });
      return `Added image: ${url}`;
    },
  });

  /**
   * Action: addVideo
   * Add a video element
   */
  useCopilotAction({
    name: 'addVideo',
    description: 'Add a video to the slide.',
    parameters: [
      { name: 'url', type: 'string', description: 'Video URL', required: true },
      { name: 'x', type: 'number', description: 'X position. Default: 540', required: false },
      { name: 'y', type: 'number', description: 'Y position. Default: 960', required: false },
      { name: 'width', type: 'number', description: 'Width. Default: 600', required: false },
      { name: 'height', type: 'number', description: 'Height. Default: 400', required: false },
    ],
    handler: async ({ url, x, y, width, height }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';
      
      actions.addElement('video', url, {
        style: {
          x: x || 540,
          y: y || 960,
          width: width || 600,
          height: height || 400,
        },
      });
      return `Added video: ${url}`;
    },
  });

  /**
   * Action: addSticker
   * Add an emoji sticker
   */
  useCopilotAction({
    name: 'addSticker',
    description: 'Add an emoji sticker to the slide. Available: 🔥⭐❤️👍🎉✨💯🚀😊😂🥰😎🤔👀💪🙌🎵🎨📸💡🏆🎯💥🌟🍕🍔☕🍩🎂🍦🥤🧁🎬📱💻🎮🎸🎤📷🖼️🎁💎👑🦋🌈☀️🌙⚡',
    parameters: [
      { name: 'emoji', type: 'string', description: 'Emoji character (e.g., 🔥, ⭐, ❤️)', required: true },
      { name: 'x', type: 'number', description: 'X position. Default: 540', required: false },
      { name: 'y', type: 'number', description: 'Y position. Default: 960', required: false },
      { name: 'size', type: 'number', description: 'Size (fontSize). Default: 64', required: false },
    ],
    handler: async ({ emoji, x, y, size }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';
      
      const fontSize = size || 64;
      actions.addElement('sticker', emoji, {
        style: {
          x: x || 540,
          y: y || 960,
          width: fontSize + 20,
          height: fontSize + 20,
          fontSize,
        },
      });
      return `Added sticker: ${emoji}`;
    },
  });

  /**
   * Action: addShape
   * Add a shape element
   */
  useCopilotAction({
    name: 'addShape',
    description: 'Add a shape to the slide. Available shapes: rectangle, circle, triangle, diamond, pentagon, hexagon, octagon, star, heart, arrow, plus, cross, line, speech-bubble, cloud, moon, sun',
    parameters: [
      { name: 'shapeType', type: 'string', description: 'Shape type: rectangle, circle, triangle, star, heart, arrow, etc.', required: true },
      { name: 'x', type: 'number', description: 'X position. Default: 540', required: false },
      { name: 'y', type: 'number', description: 'Y position. Default: 960', required: false },
      { name: 'width', type: 'number', description: 'Width. Default: 200', required: false },
      { name: 'height', type: 'number', description: 'Height. Default: 200', required: false },
      { name: 'backgroundColor', type: 'string', description: 'Fill color (hex). Default: #3b82f6', required: false },
      { name: 'borderRadius', type: 'number', description: 'Border radius', required: false },
      { name: 'borderWidth', type: 'number', description: 'Border width', required: false },
      { name: 'borderColor', type: 'string', description: 'Border color (hex)', required: false },
      { name: 'opacity', type: 'number', description: 'Opacity (0-1)', required: false },
    ],
    handler: async ({ shapeType, x, y, width, height, backgroundColor, borderRadius, borderWidth, borderColor, opacity }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';
      
      actions.addElement('shape', '', {
        shapeType: shapeType as ShapeType,
        style: {
          x: x || 540,
          y: y || 960,
          width: width || 200,
          height: height || 200,
          backgroundColor: backgroundColor || '#3b82f6',
          borderRadius,
          borderWidth,
          borderColor,
          opacity: opacity || 1,
        },
      });
      return `Added ${shapeType} shape`;
    },
  });

  /**
   * Action: addButton
   * Add a clickable button
   */
  useCopilotAction({
    name: 'addButton',
    description: 'Add a clickable button to the slide.',
    parameters: [
      { name: 'text', type: 'string', description: 'Button text', required: true },
      { name: 'href', type: 'string', description: 'URL to navigate to when clicked', required: true },
      { name: 'x', type: 'number', description: 'X position. Default: 540', required: false },
      { name: 'y', type: 'number', description: 'Y position. Default: 1200', required: false },
      { name: 'width', type: 'number', description: 'Width. Default: 200', required: false },
      { name: 'height', type: 'number', description: 'Height. Default: 50', required: false },
      { name: 'backgroundColor', type: 'string', description: 'Background color. Default: #3b82f6', required: false },
      { name: 'color', type: 'string', description: 'Text color. Default: #ffffff', required: false },
      { name: 'variant', type: 'string', description: 'Button variant: primary, secondary, outline, ghost. Default: primary', required: false },
    ],
    handler: async ({ text, href, x, y, width, height, backgroundColor, color, variant }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';
      
      actions.addElement('button', text, {
        button: { href, target: '_blank', variant: (variant as 'primary' | 'secondary' | 'outline' | 'ghost') || 'primary' },
        style: {
          x: x || 540,
          y: y || 1200,
          width: width || 200,
          height: height || 50,
          backgroundColor: backgroundColor || '#3b82f6',
          color: color || '#ffffff',
          fontSize: 18,
          fontWeight: 'semibold',
          borderRadius: 8,
          textAlign: 'center',
        },
      });
      return `Added button: "${text}" → ${href}`;
    },
  });

  /**
   * Action: addPoll
   * Add an interactive poll
   */
  useCopilotAction({
    name: 'addPoll',
    description: 'Add an interactive poll/voting element.',
    parameters: [
      { name: 'question', type: 'string', description: 'Poll question', required: true },
      { name: 'options', type: 'string', description: 'JSON array of options: ["Option 1", "Option 2", "Option 3"]', required: true },
      { name: 'x', type: 'number', description: 'X position. Default: 540', required: false },
      { name: 'y', type: 'number', description: 'Y position. Default: 960', required: false },
    ],
    handler: async ({ question, options, x, y }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';
      
      let optionList: string[];
      try {
        optionList = JSON.parse(options);
      } catch {
        return 'Error: Invalid JSON format for options';
      }
      
      actions.addElement('poll', '', {
        poll: { question, options: optionList },
        style: {
          x: x || 540,
          y: y || 960,
          width: 350,
          height: 250,
        },
      });
      return `Added poll: "${question}" with ${optionList.length} options`;
    },
  });

  /**
   * Action: addQuote
   * Add a quote element
   */
  useCopilotAction({
    name: 'addQuote',
    description: 'Add a styled quote element.',
    parameters: [
      { name: 'text', type: 'string', description: 'Quote text', required: true },
      { name: 'author', type: 'string', description: 'Author name', required: false },
      { name: 'style', type: 'string', description: 'Quote style: simple, decorative, modern, minimal. Default: decorative', required: false },
      { name: 'x', type: 'number', description: 'X position. Default: 540', required: false },
      { name: 'y', type: 'number', description: 'Y position. Default: 960', required: false },
      { name: 'color', type: 'string', description: 'Text color. Default: #ffffff', required: false },
    ],
    handler: async ({ text, author, style, x, y, color }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';
      
      actions.addElement('quote', `"${text}"`, {
        quote: { author: author || '', style: (style as 'simple' | 'decorative' | 'modern' | 'minimal') || 'decorative' },
        style: {
          x: x || 540,
          y: y || 960,
          width: 800,
          height: 200,
          color: color || '#ffffff',
          fontSize: 28,
          fontStyle: 'italic',
          textAlign: 'center',
        },
      });
      return `Added quote: "${text}" ${author ? `— ${author}` : ''}`;
    },
  });

  /**
   * Action: addRating
   * Add a rating/stars element
   */
  useCopilotAction({
    name: 'addRating',
    description: 'Add a rating element (stars, hearts, etc.).',
    parameters: [
      { name: 'value', type: 'number', description: 'Rating value (e.g., 4)', required: true },
      { name: 'max', type: 'number', description: 'Maximum rating (e.g., 5). Default: 5', required: false },
      { name: 'icon', type: 'string', description: 'Icon type: star, heart, circle. Default: star', required: false },
      { name: 'x', type: 'number', description: 'X position. Default: 540', required: false },
      { name: 'y', type: 'number', description: 'Y position. Default: 960', required: false },
    ],
    handler: async ({ value, max, icon, x, y }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';
      
      actions.addElement('rating', '', {
        rating: { value, max: max || 5, icon: (icon as 'star' | 'heart' | 'circle') || 'star', showValue: true },
        style: {
          x: x || 540,
          y: y || 960,
          width: 200,
          height: 50,
        },
      });
      return `Added rating: ${value}/${max || 5} ${icon || 'star'}s`;
    },
  });

  /**
   * Action: addProgress
   * Add a progress bar
   */
  useCopilotAction({
    name: 'addProgress',
    description: 'Add a progress bar element.',
    parameters: [
      { name: 'value', type: 'number', description: 'Current value (e.g., 75)', required: true },
      { name: 'max', type: 'number', description: 'Maximum value. Default: 100', required: false },
      { name: 'label', type: 'string', description: 'Label text', required: false },
      { name: 'variant', type: 'string', description: 'Variant: bar, circle, ring. Default: bar', required: false },
      { name: 'x', type: 'number', description: 'X position. Default: 540', required: false },
      { name: 'y', type: 'number', description: 'Y position. Default: 960', required: false },
      { name: 'width', type: 'number', description: 'Width. Default: 300', required: false },
    ],
    handler: async ({ value, max, label, variant, x, y, width }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';
      
      actions.addElement('progress', '', {
        progress: { value, max: max || 100, label: label || '', showPercent: true, variant: (variant as 'bar' | 'circle' | 'ring') || 'bar' },
        style: {
          x: x || 540,
          y: y || 960,
          width: width || 300,
          height: 60,
        },
      });
      return `Added progress: ${value}/${max || 100}${label ? ` (${label})` : ''}`;
    },
  });

  /**
   * Action: addQRCode
   * Add a QR code
   */
  useCopilotAction({
    name: 'addQRCode',
    description: 'Add a QR code element.',
    parameters: [
      { name: 'data', type: 'string', description: 'Data to encode (URL, text, etc.)', required: true },
      { name: 'x', type: 'number', description: 'X position. Default: 540', required: false },
      { name: 'y', type: 'number', description: 'Y position. Default: 960', required: false },
      { name: 'size', type: 'number', description: 'Size in pixels. Default: 150', required: false },
      { name: 'color', type: 'string', description: 'QR code color. Default: #000000', required: false },
      { name: 'bgColor', type: 'string', description: 'Background color. Default: #ffffff', required: false },
    ],
    handler: async ({ data, x, y, size, color, bgColor }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';
      
      const qrSize = size || 150;
      actions.addElement('qrcode', '', {
        qrcode: { data, size: qrSize, color: color || '#000000', bgColor: bgColor || '#ffffff' },
        style: {
          x: x || 540,
          y: y || 960,
          width: qrSize,
          height: qrSize,
        },
      });
      return `Added QR code for: ${data}`;
    },
  });

  /**
   * Action: addMention
   * Add a social media mention
   */
  useCopilotAction({
    name: 'addMention',
    description: 'Add a social media mention (@username).',
    parameters: [
      { name: 'username', type: 'string', description: 'Username (without @)', required: true },
      { name: 'platform', type: 'string', description: 'Platform: instagram, twitter, tiktok, youtube. Default: instagram', required: false },
      { name: 'verified', type: 'boolean', description: 'Show verified badge. Default: false', required: false },
      { name: 'x', type: 'number', description: 'X position. Default: 540', required: false },
      { name: 'y', type: 'number', description: 'Y position. Default: 960', required: false },
    ],
    handler: async ({ username, platform, verified, x, y }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';
      
      actions.addElement('mention', '', {
        mention: { 
          username, 
          platform: (platform as 'instagram' | 'twitter' | 'tiktok' | 'youtube') || 'instagram', 
          verified: verified || false 
        },
        style: {
          x: x || 540,
          y: y || 960,
          width: 200,
          height: 40,
          fontSize: 18,
        },
      });
      return `Added mention: @${username} (${platform || 'instagram'})`;
    },
  });

  /**
   * Action: addHashtags
   * Add hashtag element
   */
  useCopilotAction({
    name: 'addHashtags',
    description: 'Add hashtags element.',
    parameters: [
      { name: 'tags', type: 'string', description: 'JSON array of hashtags (without #): ["tag1", "tag2"]', required: true },
      { name: 'x', type: 'number', description: 'X position. Default: 540', required: false },
      { name: 'y', type: 'number', description: 'Y position. Default: 960', required: false },
      { name: 'color', type: 'string', description: 'Text color. Default: #3b82f6', required: false },
    ],
    handler: async ({ tags, x, y, color }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';
      
      let tagList: string[];
      try {
        tagList = JSON.parse(tags);
      } catch {
        return 'Error: Invalid JSON format for tags';
      }
      
      actions.addElement('hashtag', '', {
        hashtag: { tags: tagList, clickable: true },
        style: {
          x: x || 540,
          y: y || 960,
          width: 300,
          height: 40,
          fontSize: 16,
          color: color || '#3b82f6',
        },
      });
      return `Added hashtags: ${tagList.map(t => '#' + t).join(' ')}`;
    },
  });

  /**
   * Action: addCodeBlock
   * Add a code block element
   */
  useCopilotAction({
    name: 'addCodeBlock',
    description: 'Add a code block with syntax highlighting.',
    parameters: [
      { name: 'code', type: 'string', description: 'Code content', required: true },
      { name: 'language', type: 'string', description: 'Programming language: javascript, typescript, python, html, css, etc. Default: javascript', required: false },
      { name: 'theme', type: 'string', description: 'Theme: dark, light. Default: dark', required: false },
      { name: 'x', type: 'number', description: 'X position. Default: 540', required: false },
      { name: 'y', type: 'number', description: 'Y position. Default: 960', required: false },
      { name: 'width', type: 'number', description: 'Width. Default: 400', required: false },
    ],
    handler: async ({ code, language, theme, x, y, width }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';
      
      actions.addElement('codeblock', code, {
        codeblock: { 
          language: language || 'javascript', 
          theme: (theme as 'dark' | 'light') || 'dark', 
          showLineNumbers: true 
        },
        style: {
          x: x || 540,
          y: y || 960,
          width: width || 400,
          height: 150,
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          fontSize: 14,
          fontFamily: 'monospace',
          borderRadius: 8,
        },
      });
      return `Added code block (${language || 'javascript'})`;
    },
  });

  /**
   * Action: addDivider
   * Add a divider line
   */
  useCopilotAction({
    name: 'addDivider',
    description: 'Add a divider/separator line.',
    parameters: [
      { name: 'style', type: 'string', description: 'Divider style: solid, dashed, dotted, gradient, fancy. Default: solid', required: false },
      { name: 'x', type: 'number', description: 'X position. Default: 540', required: false },
      { name: 'y', type: 'number', description: 'Y position. Default: 960', required: false },
      { name: 'width', type: 'number', description: 'Width. Default: 300', required: false },
      { name: 'thickness', type: 'number', description: 'Thickness. Default: 2', required: false },
      { name: 'color', type: 'string', description: 'Color. Default: #ffffff', required: false },
    ],
    handler: async ({ style, x, y, width, thickness, color }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';
      
      actions.addElement('divider', '', {
        divider: { style: (style as 'solid' | 'dashed' | 'dotted' | 'gradient' | 'fancy') || 'solid', thickness: thickness || 2 },
        style: {
          x: x || 540,
          y: y || 960,
          width: width || 300,
          height: thickness || 2,
          backgroundColor: color || '#ffffff',
          opacity: 0.5,
        },
      });
      return `Added ${style || 'solid'} divider`;
    },
  });

  /**
   * Action: addEmbed
   * Add an embedded content (YouTube, Spotify, etc.)
   */
  useCopilotAction({
    name: 'addEmbed',
    description: 'Add embedded content from YouTube, Spotify, Twitter, Instagram, TikTok.',
    parameters: [
      { name: 'url', type: 'string', description: 'Content URL', required: true },
      { name: 'type', type: 'string', description: 'Embed type: youtube, spotify, twitter, instagram, tiktok, custom. Default: auto-detect', required: false },
      { name: 'x', type: 'number', description: 'X position. Default: 540', required: false },
      { name: 'y', type: 'number', description: 'Y position. Default: 960', required: false },
      { name: 'width', type: 'number', description: 'Width. Default: 400', required: false },
      { name: 'height', type: 'number', description: 'Height. Default: 300', required: false },
    ],
    handler: async ({ url, type, x, y, width, height }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';
      
      // Auto-detect type from URL
      let embedType = type;
      if (!embedType) {
        if (url.includes('youtube.com') || url.includes('youtu.be')) embedType = 'youtube';
        else if (url.includes('spotify.com')) embedType = 'spotify';
        else if (url.includes('twitter.com') || url.includes('x.com')) embedType = 'twitter';
        else if (url.includes('instagram.com')) embedType = 'instagram';
        else if (url.includes('tiktok.com')) embedType = 'tiktok';
        else embedType = 'custom';
      }
      
      actions.addElement('embed', '', {
        embed: { type: embedType as 'youtube' | 'spotify' | 'twitter' | 'instagram' | 'tiktok' | 'custom', url },
        style: {
          x: x || 540,
          y: y || 960,
          width: width || 400,
          height: height || 300,
        },
      });
      return `Added ${embedType} embed: ${url}`;
    },
  });

  // ==========================================
  // Animation Actions
  // ==========================================

  /**
   * Action: setElementAnimation
   * Apply animation to an element
   */
  useCopilotAction({
    name: 'setElementAnimation',
    description: 'Apply an animation to an element. Can set enter, exit, or loop animations.',
    parameters: [
      { name: 'elementId', type: 'string', description: 'Element ID to animate', required: true },
      { name: 'animationType', type: 'string', description: 'Animation phase: enter (when element appears), exit (when element disappears), loop (continuous)', required: true },
      { name: 'animation', type: 'string', description: 'Animation type: fadeIn, fadeOut, bounce, fadeInUp, slideInLeft, slideInRight, slideInUp, slideInDown, scaleIn, bounceIn, rotateIn, typewriter, zoomIn, pulse, shake, rotate, float. Use "none" to remove.', required: true },
      { name: 'duration', type: 'number', description: 'Animation duration in milliseconds. Default: 500', required: false },
      { name: 'delay', type: 'number', description: 'Delay before animation starts in milliseconds. Default: 0', required: false },
      { name: 'easing', type: 'string', description: 'Easing function: linear, ease, ease-in, ease-out, ease-in-out, spring. Default: ease-out', required: false },
    ],
    handler: async ({ elementId, animationType, animation, duration, delay, easing }) => {
      if (!actions?.setElementAnimation) {
        // Fallback: update element directly if setElementAnimation not available
        if (!actions?.updateElement) return 'Error: Animation actions not available';
        
        if (animation === 'none') {
          actions.updateElement(elementId, { 
            animation: { 
              [animationType]: undefined 
            } 
          } as Partial<StoryElement>);
          return `Removed ${animationType} animation from element ${elementId}`;
        }

        const animConfig: Animation = {
          type: animation as AnimationType,
          duration: duration || 500,
          delay: delay || 0,
          easing: (easing as Animation['easing']) || 'ease-out',
        };

        actions.updateElement(elementId, { 
          animation: { 
            [animationType]: animConfig 
          } 
        } as Partial<StoryElement>);
        return `Applied ${animation} ${animationType} animation to element ${elementId}`;
      }

      if (animation === 'none') {
        actions.setElementAnimation(elementId, animationType as 'enter' | 'exit' | 'loop', null);
        return `Removed ${animationType} animation from element ${elementId}`;
      }

      const animConfig: Animation = {
        type: animation as AnimationType,
        duration: duration || 500,
        delay: delay || 0,
        easing: (easing as Animation['easing']) || 'ease-out',
      };

      actions.setElementAnimation(elementId, animationType as 'enter' | 'exit' | 'loop', animConfig);
      return `Applied ${animation} ${animationType} animation to element ${elementId}`;
    },
  });

  /**
   * Action: applyAnimationTemplate
   * Apply a predefined animation template to an element
   */
  useCopilotAction({
    name: 'applyAnimationTemplate',
    description: 'Apply a predefined animation template to an element. Templates include professional GSAP and Anime.js animations.',
    parameters: [
      { name: 'elementId', type: 'string', description: 'Element ID to animate', required: true },
      { name: 'templateId', type: 'string', description: 'Template ID: gsap-fade-up-bounce, gsap-elastic-scale, gsap-slide-rotate, gsap-flip-3d, gsap-zoom-blur, gsap-drop-bounce, gsap-heartbeat, gsap-jello, gsap-rubber-band, gsap-tada, gsap-stagger-letters, gsap-wave-text, gsap-card-flip, gsap-cube-rotate, gsap-swing-3d, anime-spring-scale, anime-slide-spring, anime-morph-in, anime-scatter-in, anime-bounce-attention, anime-swing, anime-flash, anime-letter-spring, anime-glitch-text, anime-reveal-slide, anime-stagger-grid, loop-float, loop-pulse-glow, loop-rotate-slow, loop-breathe, loop-shimmer, loop-wobble', required: true },
      { name: 'animationType', type: 'string', description: 'Animation phase: enter, exit, loop. Default: enter', required: false },
    ],
    handler: async ({ elementId, templateId, animationType }) => {
      const template = getTemplateById(templateId);
      if (!template) {
        return `Error: Template "${templateId}" not found. Use listAnimationTemplates to see available templates.`;
      }

      const phase = animationType || 'enter';
      const animConfig: Animation = {
        type: template.animation.type || 'fadeIn',
        duration: template.animation.duration || 500,
        delay: template.animation.delay || 0,
        easing: template.animation.easing || 'ease-out',
        engine: template.engine,
        gsapType: template.animation.gsapType,
        gsapEase: template.animation.gsapEase,
        animeType: template.animation.animeType,
        animeEase: template.animation.animeEase,
        stagger: template.animation.stagger,
      };

      if (actions?.setElementAnimation) {
        actions.setElementAnimation(elementId, phase as 'enter' | 'exit' | 'loop', animConfig);
      } else if (actions?.updateElement) {
        actions.updateElement(elementId, { 
          animation: { [phase]: animConfig } 
        } as Partial<StoryElement>);
      } else {
        return 'Error: Animation actions not available';
      }

      return `Applied "${template.name}" (${template.engine}) as ${phase} animation to element ${elementId}`;
    },
  });

  /**
   * Action: setSlideTransition
   * Set transition effect between slides
   */
  useCopilotAction({
    name: 'setSlideTransition',
    description: 'Set the transition effect when moving to this slide from the previous one.',
    parameters: [
      { name: 'slideId', type: 'string', description: 'Slide ID to set transition for', required: true },
      { name: 'transitionType', type: 'string', description: 'Transition type: none, fade, slide, zoom, flip, cube, dissolve, wipe', required: true },
      { name: 'duration', type: 'number', description: 'Transition duration in milliseconds. Default: 500', required: false },
    ],
    handler: async ({ slideId, transitionType, duration }) => {
      if (!actions?.updateSlide) return 'Error: updateSlide action not available';

      if (transitionType === 'none') {
        actions.updateSlide(slideId, { transition: undefined });
        return `Removed transition from slide ${slideId}`;
      }

      actions.updateSlide(slideId, {
        transition: {
          type: transitionType as TransitionType,
          duration: duration || 500,
        },
      });

      return `Set ${transitionType} transition (${duration || 500}ms) for slide ${slideId}`;
    },
  });

  /**
   * Action: animateMultipleElements
   * Apply animations to multiple elements with stagger effect
   */
  useCopilotAction({
    name: 'animateMultipleElements',
    description: 'Apply the same animation to multiple elements with optional stagger delay for sequential effect.',
    parameters: [
      { name: 'elementIds', type: 'string', description: 'JSON array of element IDs: ["id1", "id2", "id3"]', required: true },
      { name: 'animation', type: 'string', description: 'Animation type: fadeIn, fadeInUp, slideInLeft, slideInRight, scaleIn, bounceIn, etc.', required: true },
      { name: 'animationType', type: 'string', description: 'Animation phase: enter, exit, loop. Default: enter', required: false },
      { name: 'duration', type: 'number', description: 'Animation duration in ms. Default: 500', required: false },
      { name: 'staggerDelay', type: 'number', description: 'Delay between each element animation in ms. Default: 100', required: false },
      { name: 'easing', type: 'string', description: 'Easing function. Default: ease-out', required: false },
    ],
    handler: async ({ elementIds, animation, animationType, duration, staggerDelay, easing }) => {
      if (!actions?.updateElement && !actions?.setElementAnimation) {
        return 'Error: Animation actions not available';
      }

      let ids: string[];
      try {
        ids = JSON.parse(elementIds);
      } catch {
        return 'Error: Invalid JSON format for elementIds';
      }

      const phase = animationType || 'enter';
      const stagger = staggerDelay || 100;

      for (let i = 0; i < ids.length; i++) {
        const animConfig: Animation = {
          type: animation as AnimationType,
          duration: duration || 500,
          delay: i * stagger,
          easing: (easing as Animation['easing']) || 'ease-out',
        };

        if (actions?.setElementAnimation) {
          actions.setElementAnimation(ids[i], phase as 'enter' | 'exit' | 'loop', animConfig);
        } else if (actions?.updateElement) {
          actions.updateElement(ids[i], { 
            animation: { [phase]: animConfig } 
          } as Partial<StoryElement>);
        }
      }

      return `Applied ${animation} animation to ${ids.length} elements with ${stagger}ms stagger`;
    },
  });

  /**
   * Action: removeAllAnimations
   * Remove all animations from an element
   */
  useCopilotAction({
    name: 'removeAllAnimations',
    description: 'Remove all animations (enter, exit, loop) from an element.',
    parameters: [
      { name: 'elementId', type: 'string', description: 'Element ID to remove animations from', required: true },
    ],
    handler: async ({ elementId }) => {
      if (!actions?.updateElement) return 'Error: updateElement action not available';

      actions.updateElement(elementId, { 
        animation: undefined 
      } as Partial<StoryElement>);

      return `Removed all animations from element ${elementId}`;
    },
  });

  /**
   * Action: createAnimatedTitle
   * Create a title with pre-configured animation
   */
  useCopilotAction({
    name: 'createAnimatedTitle',
    description: 'Create a title text element with a professional animation preset.',
    parameters: [
      { name: 'text', type: 'string', description: 'Title text content', required: true },
      { name: 'animationStyle', type: 'string', description: 'Animation style: bounce, elastic, typewriter, wave, slide, fade, 3d-flip. Default: bounce', required: false },
      { name: 'x', type: 'number', description: 'X position. Default: 540 (center)', required: false },
      { name: 'y', type: 'number', description: 'Y position. Default: 400', required: false },
      { name: 'fontSize', type: 'number', description: 'Font size. Default: 56', required: false },
      { name: 'color', type: 'string', description: 'Text color. Default: #ffffff', required: false },
    ],
    handler: async ({ text, animationStyle, x, y, fontSize, color }) => {
      if (!actions?.addElement) return 'Error: addElement action not available';

      const style = animationStyle || 'bounce';
      
      // Map style to animation config
      const animationMap: Record<string, { templateId: string; animation: Partial<Animation> }> = {
        bounce: { templateId: 'gsap-fade-up-bounce', animation: { type: 'fadeInUp', duration: 800, easing: 'ease-out', engine: 'gsap', gsapEase: 'bounce.out' } },
        elastic: { templateId: 'gsap-elastic-scale', animation: { type: 'scaleIn', duration: 1000, easing: 'ease-out', engine: 'gsap', gsapEase: 'elastic.out(1, 0.5)' } },
        typewriter: { templateId: 'gsap-stagger-letters', animation: { type: 'typewriter', duration: 1500, easing: 'ease-out', engine: 'gsap', stagger: 0.05 } },
        wave: { templateId: 'gsap-wave-text', animation: { type: 'typewriter', duration: 1200, easing: 'ease-in-out', engine: 'gsap', stagger: 0.03 } },
        slide: { templateId: 'anime-slide-spring', animation: { type: 'slideInLeft', duration: 1000, easing: 'spring', engine: 'anime' } },
        fade: { templateId: 'anime-morph-in', animation: { type: 'fadeIn', duration: 800, easing: 'ease-out' } },
        '3d-flip': { templateId: 'gsap-flip-3d', animation: { type: 'rotateIn', duration: 800, easing: 'ease-out', engine: 'gsap' } },
      };

      const animConfig = animationMap[style] || animationMap.bounce;

      actions.addElement('text', text, {
        style: {
          x: x || 540,
          y: y || 400,
          width: 900,
          height: 100,
          fontSize: fontSize || 56,
          fontWeight: 'bold',
          color: color || '#ffffff',
          textAlign: 'center',
        },
        animation: {
          enter: {
            type: animConfig.animation.type || 'fadeInUp',
            duration: animConfig.animation.duration || 800,
            delay: 0,
            easing: animConfig.animation.easing || 'ease-out',
            engine: animConfig.animation.engine,
            gsapEase: animConfig.animation.gsapEase,
            stagger: animConfig.animation.stagger,
          } as Animation,
        },
      });

      return `Created animated title "${text}" with ${style} animation`;
    },
  });

  /**
   * Action: listAnimationTemplates
   * List all available animation templates
   */
  useCopilotAction({
    name: 'listAnimationTemplates',
    description: 'Get a list of all available animation templates with their descriptions.',
    parameters: [
      { name: 'category', type: 'string', description: 'Filter by category: entrance, emphasis, exit, complex, text, 3d. Leave empty for all.', required: false },
    ],
    handler: async ({ category }) => {
      let templates = ALL_ANIMATION_TEMPLATES;
      
      if (category) {
        templates = templates.filter(t => t.category === category);
      }

      const result = templates.map(t => `- ${t.id}: ${t.name} (${t.category}, ${t.engine}) - ${t.description}`).join('\n');
      
      return `Available animation templates${category ? ` in ${category}` : ''}:\n${result}`;
    },
  });
}

export default useStoryAI;

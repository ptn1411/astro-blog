import type { SlideTemplate, StoryBuilderActions } from './useStoryAI';

export const SLIDE_TEMPLATES: Record<string, SlideTemplate> = {
  'title-slide': {
    name: 'Title Slide',
    background: { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    elements: [
      { type: 'text', content: 'Tiêu đề chính', x: 40, y: 260, width: 280, height: 40, style: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' } },
      { type: 'text', content: 'Phụ đề hoặc mô tả ngắn', x: 60, y: 310, width: 240, height: 40, style: { fontSize: 16, color: '#ffffffcc', textAlign: 'center' } },
    ],
    duration: 5,
  },
  'news-headline': {
    name: 'News Headline',
    background: { type: 'color', value: '#1a1a2e' },
    elements: [
      { type: 'shape', content: '', x: 0, y: 35, width: 360, height: 70, extra: { shapeType: 'rectangle' }, style: { backgroundColor: '#e94560' } },
      { type: 'text', content: 'TIN NÓNG', x: 80, y: 35, width: 200, height: 40, style: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' } },
      { type: 'text', content: 'Nội dung tin tức chính ở đây', x: 20, y: 300, width: 320, height: 80, style: { fontSize: 20, fontWeight: 'semibold', color: '#ffffff', textAlign: 'center' } },
    ],
    duration: 7,
  },
  'quote-card': {
    name: 'Quote Card',
    background: { type: 'gradient', value: 'linear-gradient(180deg, #2c3e50 0%, #1a1a2e 100%)' },
    elements: [
      { type: 'text', content: '"', x: 160, y: 220, width: 40, height: 80, style: { fontSize: 80, color: '#e94560', fontWeight: 'bold' } },
      { type: 'text', content: 'Câu trích dẫn đáng nhớ của bạn ở đây', x: 30, y: 300, width: 300, height: 120, style: { fontSize: 18, color: '#ffffff', textAlign: 'center', fontStyle: 'italic' } },
      { type: 'text', content: '— Tác giả', x: 80, y: 430, width: 200, height: 30, style: { fontSize: 14, color: '#888888', textAlign: 'center' } },
    ],
    duration: 6,
  },
  'image-with-caption': {
    name: 'Image with Caption',
    background: { type: 'color', value: '#000000' },
    elements: [
      { type: 'image', content: '', x: 20, y: 200, width: 320, height: 280, style: { borderRadius: 12 } },
      { type: 'text', content: 'Chú thích hình ảnh', x: 30, y: 500, width: 300, height: 40, style: { fontSize: 16, color: '#ffffff', textAlign: 'center' } },
    ],
    duration: 5,
  },
  'stats-card': {
    name: 'Statistics Card',
    background: { type: 'gradient', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
    elements: [
      { type: 'text', content: '1,234', x: 60, y: 240, width: 240, height: 80, style: { fontSize: 56, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' } },
      { type: 'text', content: 'Số liệu thống kê', x: 60, y: 330, width: 240, height: 30, style: { fontSize: 18, color: '#ffffffcc', textAlign: 'center' } },
      { type: 'shape', content: '', x: 130, y: 370, width: 100, height: 3, extra: { shapeType: 'rectangle' }, style: { backgroundColor: '#ffffff' } },
      { type: 'text', content: 'Mô tả chi tiết về số liệu', x: 30, y: 385, width: 300, height: 50, style: { fontSize: 14, color: '#ffffffaa', textAlign: 'center' } },
    ],
    duration: 5,
  },
  'comparison': {
    name: 'Comparison Slide',
    background: { type: 'color', value: '#1a1a2e' },
    elements: [
      { type: 'text', content: 'VS', x: 155, y: 300, width: 50, height: 40, style: { fontSize: 24, fontWeight: 'bold', color: '#e94560', textAlign: 'center' } },
      { type: 'shape', content: '', x: 10, y: 280, width: 140, height: 200, extra: { shapeType: 'rectangle' }, style: { backgroundColor: '#16213e', borderRadius: 12 } },
      { type: 'shape', content: '', x: 210, y: 280, width: 140, height: 200, extra: { shapeType: 'rectangle' }, style: { backgroundColor: '#16213e', borderRadius: 12 } },
      { type: 'text', content: 'Lựa chọn A', x: 10, y: 240, width: 140, height: 35, style: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' } },
      { type: 'text', content: 'Lựa chọn B', x: 210, y: 240, width: 140, height: 35, style: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' } },
    ],
    duration: 7,
  },
  'list-slide': {
    name: 'List Slide',
    background: { type: 'gradient', value: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
    elements: [
      { type: 'text', content: 'Danh sách', x: 30, y: 80, width: 300, height: 40, style: { fontSize: 26, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' } },
      { type: 'text', content: '1. Mục đầu tiên', x: 30, y: 160, width: 300, height: 30, style: { fontSize: 18, color: '#ffffff', textAlign: 'left' } },
      { type: 'text', content: '2. Mục thứ hai', x: 30, y: 200, width: 300, height: 30, style: { fontSize: 18, color: '#ffffff', textAlign: 'left' } },
      { type: 'text', content: '3. Mục thứ ba', x: 30, y: 240, width: 300, height: 30, style: { fontSize: 18, color: '#ffffff', textAlign: 'left' } },
    ],
    duration: 6,
  },
  'cta-slide': {
    name: 'Call to Action',
    background: { type: 'gradient', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    elements: [
      { type: 'text', content: 'Hành động ngay!', x: 30, y: 240, width: 300, height: 50, style: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' } },
      { type: 'text', content: 'Mô tả ngắn về lời kêu gọi hành động', x: 40, y: 300, width: 280, height: 40, style: { fontSize: 16, color: '#ffffffcc', textAlign: 'center' } },
      { type: 'button', content: 'Bắt đầu', x: 100, y: 380, width: 160, height: 48, extra: { button: { href: '#', target: '_blank', variant: 'primary' } }, style: { fontSize: 16, backgroundColor: '#ffffff', color: '#f5576c', borderRadius: 24 } },
    ],
    duration: 5,
  },
  'massive-typographic-hero': {
    name: 'Massive Typographic Hero',
    background: { type: 'color', value: '#0f0f0f' },
    elements: [
      { type: 'text', content: 'GIANT', x: 10, y: 150, width: 340, height: 120, style: { fontSize: 96, fontWeight: 'extrabold', color: '#1a1a1a', textAlign: 'center' }, extra: { zIndex: 0 } },
      { type: 'text', content: 'Modern Design', x: 20, y: 300, width: 320, height: 60, style: { fontSize: 36, fontWeight: 'bold', color: '#ccff00', textAlign: 'center' }, extra: { zIndex: 2 } },
      { type: 'image', content: '', x: 40, y: 450, width: 280, height: 200, style: { borderRadius: 0 }, extra: { zIndex: 1 } }
    ],
    duration: 6
  },
  'neo-brutalist-card': {
    name: 'Neo Brutalist Card',
    background: { type: 'color', value: '#e0e0e0' },
    elements: [
      { type: 'shape', content: '', x: 35, y: 325, width: 300, height: 400, style: { backgroundColor: '#000000', borderRadius: 0 }, extra: { shapeType: 'rectangle', zIndex: 0 } },
      { type: 'shape', content: '', x: 30, y: 320, width: 300, height: 400, style: { backgroundColor: '#ffffff', borderRadius: 0 }, extra: { shapeType: 'rectangle', zIndex: 1 } },
      { type: 'text', content: 'BRUTAL', x: 50, y: 200, width: 260, height: 60, style: { fontSize: 48, fontWeight: 'extrabold', color: '#000000', textAlign: 'left' }, extra: { zIndex: 2 } },
      { type: 'text', content: 'Mô tả nội dung thẳng thắn, không màu mè', x: 50, y: 350, width: 260, height: 100, style: { fontSize: 18, color: '#000000', textAlign: 'left' }, extra: { zIndex: 2 } }
    ],
    duration: 5
  }
};

export interface StoryBlueprint {
  id: string;
  name: string;
  description: string;
  generate: (actions: StoryBuilderActions, contentData: Record<string, unknown>) => void;
}

export const STORY_BLUEPRINTS: Record<string, StoryBlueprint> = {
  'modern-fashion': {
    id: 'modern-fashion',
    name: 'Modern Fashion Lookbook',
    description: 'A sharp, high-contrast fashion story with massive typography and asymmetric layouts.',
    generate: (actions, contentData) => {
      const title = contentData.title as string | undefined;
      const items = contentData.items as Array<{ image?: string; name?: string; desc?: string }> | undefined;
      
      const s1 = actions.addSlide();
      if (s1) {
        actions.updateSlide(s1, { duration: 4, background: { type: 'color', value: '#050505' } });
        actions.addElement('text', title?.toUpperCase() || 'FASHION 2026', { targetSlideId: s1, style: { x: 20, y: 280, width: 320, height: 100, fontSize: 48, color: '#ffffff', fontWeight: 'normal', fontFamily: 'serif', letterSpacing: '4px', textAlign: 'left' } });
        actions.addElement('shape', '', { targetSlideId: s1, shapeType: 'rectangle', style: { x: 20, y: 390, width: 80, height: 2, backgroundColor: '#ff3366' } });
        actions.addElement('text', 'COLLECTION', { targetSlideId: s1, style: { x: 20, y: 410, width: 200, height: 30, fontSize: 14, color: '#ff3366', fontWeight: 'bold', letterSpacing: '2px', textAlign: 'left' } });
      }
      
      if (Array.isArray(items)) {
        items.forEach((item, i) => {
          const s = actions.addSlide();
          if (s) {
            actions.updateSlide(s, { duration: 5, background: { type: 'color', value: i % 2 === 0 ? '#e8e8e8' : '#f4f4f4' } });
            // Shape frame behind image
            actions.addElement('shape', '', { targetSlideId: s, shapeType: 'rectangle', style: { x: 20, y: 140, width: 320, height: 420, backgroundColor: '#ffffff', borderRadius: 0 } });
            actions.addElement('image', item.image || '', { targetSlideId: s, style: { x: 30, y: 150, width: 300, height: 350, borderRadius: 0 } });
            actions.addElement('text', item.name || `Look ${i + 1}`, { targetSlideId: s, style: { x: 30, y: 520, width: 300, height: 40, fontSize: 28, fontWeight: 'bold', fontFamily: 'serif', color: '#000000', textAlign: 'center' } });
            actions.addElement('text', item.desc || 'Mô tả bộ trang phục...', { targetSlideId: s, style: { x: 40, y: 560, width: 280, height: 50, fontSize: 12, color: '#555555', fontStyle: 'italic', textAlign: 'center' } });
          }
        });
      }
    }
  },
  'brutalist-news': {
    id: 'brutalist-news',
    name: 'Brutalist News Update',
    description: 'Sharp, text-heavy news format with high contrast and geometric shapes.',
    generate: (actions, contentData) => {
      const headline = contentData.headline as string | undefined;
      const points = contentData.points as Array<{ title?: string; detail?: string }> | undefined;
      
      const s1 = actions.addSlide();
      if (s1) {
        actions.updateSlide(s1, { duration: 5, background: { type: 'color', value: '#ccff00' } });
        // Solid black box behind text for brutalist contrast
        actions.addElement('shape', '', { targetSlideId: s1, shapeType: 'rectangle', style: { x: 10, y: 280, width: 340, height: 160, backgroundColor: '#000000' } });
        actions.addElement('text', headline?.toUpperCase() || 'BREAKING\nNEWS', { targetSlideId: s1, style: { x: 20, y: 290, width: 320, height: 140, fontSize: 52, fontWeight: '900', fontFamily: 'Impact, sans-serif', lineHeight: 1.1, color: '#ccff00', textAlign: 'left' } });
      }
      
      if (Array.isArray(points)) {
        points.forEach((pt, i) => {
          const s = actions.addSlide();
          if (s) {
            actions.updateSlide(s, { duration: 6, background: { type: 'color', value: '#000000' } });
            // Asymmetric layout logic based on index
            const isLeft = i % 2 === 0;
            const xShape = isLeft ? 20 : 320; 
            actions.addElement('shape', '', { targetSlideId: s, shapeType: 'rectangle', style: { x: xShape, y: 100, width: 20, height: 20, backgroundColor: '#ccff00' } });
            actions.addElement('text', pt.title?.toUpperCase() || 'FACT', { targetSlideId: s, style: { x: 20, y: 140, width: 320, height: 60, fontSize: 40, fontWeight: '900', fontFamily: 'Impact, sans-serif', color: '#ccff00', textAlign: isLeft ? 'left' : 'right' } });
            actions.addElement('text', pt.detail || '...', { targetSlideId: s, style: { x: 20, y: 240, width: 320, height: 200, fontSize: 20, fontWeight: 'bold', color: '#ffffff', textAlign: isLeft ? 'left' : 'right' } });
          }
        });
      }
    }
  }
};

export const FEW_SHOT_EXAMPLES = `
## FEW-SHOT EXAMPLES (CRITICAL)
When you manually construct a slide without a specified Blueprint, you MUST use sophisticated coordinates and styling like the examples below. 
DO NOT just place 16px text in the center! Use sharp geometries, extreme typography sizes, or high contrasts (no purple!).

Example 1: The "Acid Brutal" Look
\`\`\`javascript
// Step 1: Add slide
const sId = actions.addSlide();
actions.updateSlide(sId, { background: { type: 'color', value: '#ccff00' }, duration: 5 });

// Step 2: Add elements (Notice the bold alignments and large fonts)
actions.addElement('text', 'URBAN', { targetSlideId: sId, style: { x: 10, y: 150, width: 340, height: 100, fontSize: 80, fontWeight: 'extrabold', color: '#000000', textAlign: 'left' }});
actions.addElement('text', 'FASHION', { targetSlideId: sId, style: { x: 10, y: 220, width: 340, height: 100, fontSize: 80, fontWeight: 'extrabold', color: '#000000', textAlign: 'right' }});
actions.addElement('shape', '', { targetSlideId: sId, shapeType: 'rectangle', style: { x: 10, y: 400, width: 340, height: 200, backgroundColor: '#000000', borderRadius: 0 }});
actions.addElement('text', 'Lookbook 2026', { targetSlideId: sId, style: { x: 30, y: 400, width: 300, height: 40, fontSize: 24, fontWeight: 'bold', color: '#ccff00', textAlign: 'center' }});
\`\`\`

Example 2: The "Sharp Luxury" Look
\`\`\`javascript
const sId = actions.addSlide();
actions.updateSlide(sId, { background: { type: 'color', value: '#111111' }, duration: 6 });
actions.addElement('image', 'url_to_image', { targetSlideId: sId, style: { x: 30, y: 320, width: 300, height: 500, borderRadius: 0, opacity: 0.7 }});
actions.addElement('text', 'ELEGANCE', { targetSlideId: sId, style: { x: 20, y: 320, width: 320, height: 60, fontSize: 42, color: '#ffffff', fontWeight: 'medium', textAlign: 'center' }});
actions.addElement('shape', '', { targetSlideId: sId, shapeType: 'rectangle', style: { x: 130, y: 360, width: 100, height: 1, backgroundColor: '#ffffff' }});
\`\`\`
`;

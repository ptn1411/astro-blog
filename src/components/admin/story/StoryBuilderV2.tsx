import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import html2canvas from 'html2canvas';
import {
  Copy,
  Download,
  Film,
  Grid3X3,
  Layers,
  Music2,
  PanelLeft,
  Play,
  Redo2,
  Save,
  Settings,
  Sparkles,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from '~/hooks/useHistory';
import { getPendingMedia, uploadAllPendingMedia } from '~/utils/media';
import { GSAP_ANIMATION_NAMES, LOOP_ANIMATION_NAMES, SPRING_ANIMATION_NAMES } from './animations';
import { AudioPanel } from './AudioPanel';
import { CanvasElement } from './CanvasElementV2';
import { LayersPanel } from './LayersPanel';
import { PropertiesPanelV2 } from './PropertiesPanelV2';
import { ResourcePanelV2 } from './ResourcePanelV2';
import { StoryPreviewV2 } from './StoryPreviewV2';
import { TimelineV2 } from './TimelineV2';
import {
  DEFAULT_ELEMENT_STYLE,
  DEFAULT_SLIDE,
  type CanvasState,
  type ElementStyle,
  type ElementType,
  type Story,
  type StoryElement,
  type StorySlide,
  type StoryTemplate,
} from './types';

// Initial story
const createInitialStory = (): Story => ({
  id: `story-${Date.now()}`,
  title: 'Untitled Story',
  slides: [
    {
      id: `slide-${Date.now()}`,
      ...DEFAULT_SLIDE,
    },
  ],
  settings: {
    autoAdvance: true,
    loop: false,
    showProgressBar: true,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Auto-save hook
const useAutoSave = (story: Story, interval = 30000) => {
  const lastSaveRef = useRef<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const storyString = JSON.stringify(story);
      if (storyString !== lastSaveRef.current) {
        localStorage.setItem('story-builder-autosave', storyString);
        lastSaveRef.current = storyString;
        console.log('Auto-saved at', new Date().toLocaleTimeString());
      }
    }, interval);

    return () => clearInterval(timer);
  }, [story, interval]);

  // Load from auto-save on mount
  useEffect(() => {
    const saved = localStorage.getItem('story-builder-autosave');
    if (saved) {
      lastSaveRef.current = saved;
    }
  }, []);
};

interface StoryBuilderProps {
  initialStory?: Story | null;
  onBack?: () => void;
}

export default function StoryBuilderV2({ initialStory, onBack }: StoryBuilderProps) {
  // Story state with history
  const {
    state: story,
    setState: setStory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<Story>(initialStory || createInitialStory());

  // UI state - initialize with empty string, will be set properly in useEffect
  const [currentSlideId, setCurrentSlideId] = useState<string>('');
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewStartIndex, setPreviewStartIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [leftPanelTab, setLeftPanelTab] = useState<'resources' | 'layers' | 'audio'>('resources');
  const [animationTrigger, setAnimationTrigger] = useState(0); // For triggering animation preview

  // AI prompt / paste JSON
  const [aiTopic, setAiTopic] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiJsonText, setAiJsonText] = useState('');

  // FFmpeg state
  const [isRendering, setIsRendering] = useState(false); // For frame-by-frame rendering
  const [renderProgress, setRenderProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [renderTime, setRenderTime] = useState(0);
  const ffmpegRef = useRef(new FFmpeg());

  // Canvas state
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    panX: 0,
    panY: 0,
    showGrid: false,
    snapToGrid: true,
    gridSize: 10,
    showSafeZone: true,
    showRulers: false,
  });

  // Current slide helper
  const currentSlide = story.slides.find((s) => s.id === currentSlideId) || story.slides[0];
  const currentSlideIndex = story.slides.findIndex((s) => s.id === currentSlideId);
  const selectedElement =
    selectedElementIds.length === 1 ? currentSlide?.elements.find((e) => e.id === selectedElementIds[0]) : null;

  // Timeline state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackRef = useRef<number | null>(null);

  // Handle playback
  useEffect(() => {
    if (isPlaying) {
      const startTime = Date.now() - currentTime;
      const slideDuration = (currentSlide?.duration || 5) * 1000;

      const animate = () => {
        const now = Date.now();
        const newTime = now - startTime;

        if (newTime >= slideDuration) {
          if (story.settings?.loop) {
            setCurrentTime(0);
            playbackRef.current = requestAnimationFrame(animate);
          } else {
            setIsPlaying(false);
            setCurrentTime(slideDuration);
          }
        } else {
          setCurrentTime(newTime);
          playbackRef.current = requestAnimationFrame(animate);
        }
      };

      playbackRef.current = requestAnimationFrame(animate);
    } else {
      if (playbackRef.current) {
        cancelAnimationFrame(playbackRef.current);
      }
    }

    return () => {
      if (playbackRef.current) {
        cancelAnimationFrame(playbackRef.current);
      }
    };
  }, [isPlaying, currentSlide?.duration, story.settings?.loop]);

  // Reset time when changing slides
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [currentSlideId]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set initial slide ID when story is ready
  useEffect(() => {
    if (story?.slides?.[0]?.id && !currentSlideId) {
      setCurrentSlideId(story.slides[0].id);
    }
  }, [story?.slides, currentSlideId]);

  // Auto-save
  useAutoSave(story);

  // Early return if story is not ready
  if (!story || !story.slides || story.slides.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p>Loading Story Builder...</p>
        </div>
      </div>
    );
  }

  // Update slide
  const updateSlide = useCallback(
    (slideId: string, updates: Partial<StorySlide>) => {
      setStory((prev) => {
        if (!prev?.slides) return prev;
        return {
          ...prev,
          slides: prev.slides.map((s) => (s.id === slideId ? { ...s, ...updates } : s)),
          updatedAt: new Date().toISOString(),
        };
      });
    },
    [setStory]
  );

  // Update element
  const updateElement = useCallback(
    (elementId: string, updates: Partial<StoryElement> | Partial<ElementStyle>) => {
      setStory((prev) => {
        if (!prev?.slides) return prev;
        return {
          ...prev,
          slides: prev.slides.map((slide) => {
            if (slide.id !== currentSlideId) return slide;
            return {
              ...slide,
              elements: slide.elements.map((el) => {
                if (el.id !== elementId) return el;

                // Check if updates are style properties
                const styleKeys = [
                  'x',
                  'y',
                  'width',
                  'height',
                  'rotation',
                  'opacity',
                  'color',
                  'fontSize',
                  'fontFamily',
                  'fontWeight',
                  'textAlign',
                  'backgroundColor',
                  'borderRadius',
                  'blur',
                  'zIndex',
                  'gradient',
                  'boxShadow',
                ];

                const isStyleUpdate = Object.keys(updates).some((key) => styleKeys.includes(key));

                if (isStyleUpdate) {
                  return { ...el, style: { ...el.style, ...updates } };
                }

                return { ...el, ...updates } as StoryElement;
              }),
            };
          }),
          updatedAt: new Date().toISOString(),
        };
      });
    },
    [currentSlideId, setStory]
  );

  // Add element
  const addElement = useCallback(
    (type: ElementType, content: string, extra?: Record<string, unknown>) => {
      const newElement: StoryElement = {
        id: `el-${Date.now()}`,
        type,
        content,
        style: {
          ...DEFAULT_ELEMENT_STYLE,
          ...((extra?.style as Partial<ElementStyle>) || {}),
        },
        ...(extra?.shapeType ? { shapeType: extra.shapeType as StoryElement['shapeType'] } : {}),
        ...(extra?.animation ? { animation: extra.animation as StoryElement['animation'] } : {}),
        ...(extra?.button ? { button: extra.button as StoryElement['button'] } : {}),
        ...(extra?.link ? { link: extra.link as StoryElement['link'] } : {}),
        ...(extra?.poll ? { poll: extra.poll as StoryElement['poll'] } : {}),
        ...(extra?.countdown ? { countdown: extra.countdown as StoryElement['countdown'] } : {}),
        ...(extra?.timer ? { timer: extra.timer as StoryElement['timer'] } : {}),
        ...(extra?.quote ? { quote: extra.quote as StoryElement['quote'] } : {}),
        ...(extra?.list ? { list: extra.list as StoryElement['list'] } : {}),
        ...(extra?.avatar ? { avatar: extra.avatar as StoryElement['avatar'] } : {}),
        ...(extra?.rating ? { rating: extra.rating as StoryElement['rating'] } : {}),
        ...(extra?.progress ? { progress: extra.progress as StoryElement['progress'] } : {}),
        ...(extra?.location ? { location: extra.location as StoryElement['location'] } : {}),
        ...(extra?.embed ? { embed: extra.embed as StoryElement['embed'] } : {}),
        ...(extra?.codeblock ? { codeblock: extra.codeblock as StoryElement['codeblock'] } : {}),
        ...(extra?.mention ? { mention: extra.mention as StoryElement['mention'] } : {}),
        ...(extra?.hashtag ? { hashtag: extra.hashtag as StoryElement['hashtag'] } : {}),
        ...(extra?.qrcode ? { qrcode: extra.qrcode as StoryElement['qrcode'] } : {}),
        ...(extra?.divider ? { divider: extra.divider as StoryElement['divider'] } : {}),
        ...(extra?.carousel ? { carousel: extra.carousel as StoryElement['carousel'] } : {}),
        ...(extra?.slider ? { slider: extra.slider as StoryElement['slider'] } : {}),
      };

      updateSlide(currentSlideId, {
        elements: [...currentSlide.elements, newElement],
      });

      setSelectedElementIds([newElement.id]);
    },
    [currentSlide.elements, currentSlideId, updateSlide]
  );

  // Delete element
  const deleteElement = useCallback(
    (elementId: string) => {
      updateSlide(currentSlideId, {
        elements: currentSlide.elements.filter((el) => el.id !== elementId),
      });
      setSelectedElementIds((prev) => prev.filter((id) => id !== elementId));
    },
    [currentSlide.elements, currentSlideId, updateSlide]
  );

  // Duplicate element
  const duplicateElement = useCallback(
    (elementId: string) => {
      const element = currentSlide.elements.find((el) => el.id === elementId);
      if (!element) return;

      const newElement: StoryElement = {
        ...element,
        id: `el-${Date.now()}`,
        style: {
          ...element.style,
          x: element.style.x + 20,
          y: element.style.y + 20,
        },
      };

      updateSlide(currentSlideId, {
        elements: [...currentSlide.elements, newElement],
      });

      setSelectedElementIds([newElement.id]);
    },
    [currentSlide.elements, currentSlideId, updateSlide]
  );

  // Toggle element lock
  const toggleElementLock = useCallback(
    (elementId: string) => {
      const element = currentSlide.elements.find((el) => el.id === elementId);
      if (!element) return;

      updateSlide(currentSlideId, {
        elements: currentSlide.elements.map((el) => (el.id === elementId ? { ...el, locked: !el.locked } : el)),
      });
    },
    [currentSlide.elements, currentSlideId, updateSlide]
  );

  // Toggle element visibility
  const toggleElementVisibility = useCallback(
    (elementId: string) => {
      const element = currentSlide.elements.find((el) => el.id === elementId);
      if (!element) return;

      updateSlide(currentSlideId, {
        elements: currentSlide.elements.map((el) =>
          el.id === elementId ? { ...el, visible: el.visible === false ? true : false } : el
        ),
      });
    },
    [currentSlide.elements, currentSlideId, updateSlide]
  );

  // Reorder elements (for layers)
  const reorderElements = useCallback(
    (reorderedElements: StoryElement[]) => {
      updateSlide(currentSlideId, {
        elements: reorderedElements,
      });
    },
    [currentSlideId, updateSlide]
  );

  // Add slide
  const addSlide = useCallback(() => {
    const newSlide: StorySlide = {
      id: `slide-${Date.now()}`,
      ...DEFAULT_SLIDE,
    };
    setStory((prev) => {
      if (!prev?.slides) return prev;
      return {
        ...prev,
        slides: [...prev.slides, newSlide],
        updatedAt: new Date().toISOString(),
      };
    });
    setCurrentSlideId(newSlide.id);
    setSelectedElementIds([]);
  }, [setStory]);

  // Delete slide
  const deleteSlide = useCallback(
    (slideId: string) => {
      if (!story?.slides || story.slides.length <= 1) return;

      const slideIndex = story.slides.findIndex((s) => s.id === slideId);
      setStory((prev) => {
        if (!prev?.slides) return prev;
        return {
          ...prev,
          slides: prev.slides.filter((s) => s.id !== slideId),
          updatedAt: new Date().toISOString(),
        };
      });

      // Select adjacent slide
      const newIndex = Math.min(slideIndex, story.slides.length - 2);
      setCurrentSlideId(story.slides[newIndex === slideIndex ? newIndex + 1 : newIndex]?.id || '');
      setSelectedElementIds([]);
    },
    [setStory, story?.slides]
  );

  // Duplicate slide
  const duplicateSlide = useCallback(
    (slideId: string) => {
      if (!story?.slides) return;
      const slide = story.slides.find((s) => s.id === slideId);
      if (!slide) return;

      const newSlide: StorySlide = {
        ...slide,
        id: `slide-${Date.now()}`,
        elements: slide.elements.map((el) => ({
          ...el,
          id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        })),
      };

      const slideIndex = story.slides.findIndex((s) => s.id === slideId);
      setStory((prev) => {
        if (!prev?.slides) return prev;
        return {
          ...prev,
          slides: [...prev.slides.slice(0, slideIndex + 1), newSlide, ...prev.slides.slice(slideIndex + 1)],
          updatedAt: new Date().toISOString(),
        };
      });

      setCurrentSlideId(newSlide.id);
    },
    [setStory, story?.slides]
  );

  // Apply template
  const applyTemplate = useCallback(
    (template: StoryTemplate) => {
      const newSlides = template.story.slides.map((slide) => ({
        ...slide,
        id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        elements: slide.elements.map((el) => ({
          ...el,
          id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        })),
      }));

      setStory((prev) => {
        if (!prev?.slides) return prev;
        return {
          ...prev,
          slides: [...prev.slides, ...newSlides],
          updatedAt: new Date().toISOString(),
        };
      });

      if (newSlides[0]) {
        setCurrentSlideId(newSlides[0].id);
      }
    },
    [setStory]
  );

  // Export story
  const exportStory = useCallback(() => {
    const dataStr = JSON.stringify(story, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [story]);

  const generateAIPrompt = useCallback((topic: string) => {
    const exampleStyle: ElementStyle = {
      ...DEFAULT_ELEMENT_STYLE,
      x: 80,
      y: 120,
      width: 560,
      height: 180,
      fontSize: 48,
      fontWeight: 'bold',
      textAlign: 'center',
    };

    return `Bạn là AI chuyên gia tạo JSON cho Story Builder.

Nhiệm vụ: tạo 1 object JSON theo đúng schema bên dưới để hiển thị bản tin dạng story (9:16).

Chủ đề: ${topic || '[NHẬP CHỦ ĐỀ Ở ĐÂY]'}

=== YÊU CẦU OUTPUT (BẮT BUỘC) ===
1) Chỉ trả về DUY NHẤT JSON (không giải thích, không markdown, không \`\`\`)
2) JSON phải parse được, không trailing comma
3) Tạo nội dung tiếng Việt phù hợp với chủ đề
4) Tạo tối thiểu 3 slides, tối đa 6 slides
5) Mỗi slide duration: 5-8 (giây)
6) background có thể dùng:
   - color: { "type": "color", "value": "#111827" }
   - gradient: { "type": "gradient", "value": "", "gradient": { "type": "linear", "angle": 135, "colors": [{"color":"#ec4899","position":0},{"color":"#8b5cf6","position":100}] } }
7) Elements: ưu tiên type "text". Nếu dùng image/video thì content là URL.

=== HÌNH ẢNH (IMAGE) ===
1) Element ảnh:
  - "type": "image"
  - "content": "https://images.unsplash.com/photo-...?..." (URL ảnh)
  - style width/height theo canvas 360x640
2) Nếu cần dùng ảnh nền:
  - background: { "type": "image", "value": "https://images.unsplash.com/photo-...?..." }
3) Gợi ý URL ảnh (dễ dùng, public): Unsplash
  - Ví dụ: https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1080
4) Tránh URL private / token / expired.

=== CHUYỂN CẢNH (SLIDE TRANSITION) ===
Trong mỗi slide có thể thêm:
"transition": { "type": "fade" | "slide" | "zoom" | "flip" | "cube" | "dissolve" | "wipe" | "none", "duration": 400-900 }
Gợi ý: slide 1 fade, slide 2 slide, slide 3 zoom.

=== HIỆU ỨNG (ANIMATION) ===
Bạn có thể thêm hiệu ứng cho mỗi element theo dạng:
"animation": {
  "enter": { "type": "fadeIn", "duration": 500, "delay": 0, "easing": "ease-out", "engine": "gsap", "gsapType": "fadeIn", "gsapEase": "power2.out" },
  "exit": { ... } ,
  "loop": { "type": "pulse", "duration": 1000, "delay": 0, "easing": "ease-in-out", "engine": "gsap", "gsapType": "pulse" }
}

1) type (AnimationType) hợp lệ (theo types.ts):
none, fadeIn, fadeOut, bounce, fadeInUp, slideInLeft, slideInRight, slideInUp, slideInDown, scaleIn, scaleOut, bounceIn, rotateIn, typewriter, zoomIn, pulse, fadeInDown, shake, rotate, float

2) Nếu engine = "gsap":
  - dùng "gsapType" trong danh sách:
${JSON.stringify(GSAP_ANIMATION_NAMES)}

3) Nếu dùng animation loop (lặp):
  - ưu tiên type thuộc danh sách loop có sẵn:
${JSON.stringify(LOOP_ANIMATION_NAMES)}
  - hoặc spring loop:
${JSON.stringify(SPRING_ANIMATION_NAMES)}

4) Nếu engine = "anime": chỉ dùng các type chắc chắn được hỗ trợ:
scaleIn, fadeIn, fadeInUp, fadeInDown, slideInLeft, slideInRight, slideInUp, slideInDown, bounceIn, rotateIn, zoomIn, pulse, shake, bounce, rotate, float

5) Quy tắc:
  - enter thường dùng 300-900ms
  - loop thường dùng 1000-3000ms
  - delay (ms) có thể dùng để tạo nhịp (0-600)
  - không tạo animation quá nhiều gây rối: mỗi slide tối đa 2-4 elements có animation.

=== JSON MẪU THAM KHẢO (BẮT CHƯỚC CẤU TRÚC) ===
Ví dụ 1 (3 slides, có ảnh + text + animation):
{
  "id": "story-sample-1",
  "title": "Bản tin: Công nghệ hôm nay",
  "description": "Tóm tắt nhanh 3 điểm nổi bật",
  "settings": { "autoAdvance": true, "loop": false, "showProgressBar": true },
  "slides": [
    {
      "id": "slide-1",
      "duration": 6,
      "background": {
        "type": "image",
        "value": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080"
      },
      "transition": { "type": "fade", "duration": 600 },
      "elements": [
        {
          "id": "el-1",
          "type": "text",
          "content": "CÔNG NGHỆ HÔM NAY",
          "style": { "x": 20, "y": 60, "width": 320, "height": 80, "rotation": 0, "zIndex": 2, "opacity": 1, "color": "#ffffff", "fontSize": 28, "fontFamily": "system-ui, -apple-system, sans-serif", "fontWeight": "bold", "textAlign": "center", "backgroundColor": "rgba(0,0,0,0.35)", "borderRadius": 12 },
          "animation": { "enter": { "type": "fadeInDown", "duration": 700, "delay": 0, "easing": "ease-out", "engine": "gsap", "gsapType": "fadeInDown", "gsapEase": "power2.out" } }
        },
        {
          "id": "el-2",
          "type": "text",
          "content": "3 điểm nóng trong 60 giây",
          "style": { "x": 40, "y": 150, "width": 280, "height": 60, "rotation": 0, "zIndex": 2, "opacity": 1, "color": "#e5e7eb", "fontSize": 18, "fontFamily": "system-ui, -apple-system, sans-serif", "fontWeight": "medium", "textAlign": "center", "backgroundColor": "rgba(17,24,39,0.55)", "borderRadius": 12 },
          "animation": { "enter": { "type": "fadeInUp", "duration": 650, "delay": 150, "easing": "ease-out", "engine": "gsap", "gsapType": "fadeInUp", "gsapEase": "power2.out" } }
        },
        {
          "id": "el-3",
          "type": "shape",
          "content": "",
          "shapeType": "rectangle",
          "style": { "x": 0, "y": 0, "width": 360, "height": 640, "rotation": 0, "zIndex": 1, "opacity": 0.35, "backgroundColor": "#000000" },
          "animation": { "enter": { "type": "fadeIn", "duration": 400, "delay": 0, "easing": "ease-out" } }
        }
      ]
    },
    {
      "id": "slide-2",
      "duration": 6,
      "background": { "type": "gradient", "value": "", "gradient": { "type": "linear", "angle": 135, "colors": [{ "color": "#0ea5e9", "position": 0 }, { "color": "#8b5cf6", "position": 100 }] } },
      "transition": { "type": "slide", "duration": 650 },
      "elements": [
        {
          "id": "el-4",
          "type": "text",
          "content": "1) AI hỗ trợ viết code nhanh hơn",
          "style": { "x": 24, "y": 120, "width": 312, "height": 60, "rotation": 0, "zIndex": 2, "opacity": 1, "color": "#ffffff", "fontSize": 20, "fontFamily": "system-ui, -apple-system, sans-serif", "fontWeight": "semibold", "textAlign": "left" },
          "animation": { "enter": { "type": "slideInLeft", "duration": 650, "delay": 0, "easing": "ease-out", "engine": "gsap", "gsapType": "slideInLeft", "gsapEase": "power2.out" } }
        },
        {
          "id": "el-5",
          "type": "text",
          "content": "2) Smartphone: pin tốt hơn, camera tốt hơn",
          "style": { "x": 24, "y": 190, "width": 312, "height": 60, "rotation": 0, "zIndex": 2, "opacity": 1, "color": "#ffffff", "fontSize": 20, "fontFamily": "system-ui, -apple-system, sans-serif", "fontWeight": "semibold", "textAlign": "left" },
          "animation": { "enter": { "type": "slideInLeft", "duration": 650, "delay": 150, "easing": "ease-out", "engine": "gsap", "gsapType": "slideInLeft", "gsapEase": "power2.out" } }
        },
        {
          "id": "el-6",
          "type": "text",
          "content": "3) Bảo mật: bật 2FA ngay",
          "style": { "x": 24, "y": 260, "width": 312, "height": 60, "rotation": 0, "zIndex": 2, "opacity": 1, "color": "#ffffff", "fontSize": 20, "fontFamily": "system-ui, -apple-system, sans-serif", "fontWeight": "semibold", "textAlign": "left" },
          "animation": { "enter": { "type": "slideInLeft", "duration": 650, "delay": 300, "easing": "ease-out", "engine": "gsap", "gsapType": "slideInLeft", "gsapEase": "power2.out" } }
        },
        {
          "id": "el-7",
          "type": "text",
          "content": "Theo dõi để nhận bản tin mỗi ngày",
          "style": { "x": 24, "y": 520, "width": 312, "height": 60, "rotation": 0, "zIndex": 2, "opacity": 1, "color": "#111827", "fontSize": 16, "fontFamily": "system-ui, -apple-system, sans-serif", "fontWeight": "bold", "textAlign": "center", "backgroundColor": "rgba(255,255,255,0.9)", "borderRadius": 14 },
          "animation": { "enter": { "type": "zoomIn", "duration": 700, "delay": 200, "easing": "ease-out", "engine": "gsap", "gsapType": "zoomIn", "gsapEase": "back.out(1.7)" }, "loop": { "type": "pulse", "duration": 1400, "delay": 0, "easing": "ease-in-out", "engine": "gsap", "gsapType": "pulse" } }
        }
      ]
    },
    {
      "id": "slide-3",
      "duration": 6,
      "background": { "type": "color", "value": "#111827" },
      "transition": { "type": "zoom", "duration": 650 },
      "elements": [
        {
          "id": "el-8",
          "type": "image",
          "content": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1080",
          "style": { "x": 20, "y": 110, "width": 320, "height": 220, "rotation": 0, "zIndex": 1, "opacity": 1, "borderRadius": 16 },
          "animation": { "enter": { "type": "zoomIn", "duration": 700, "delay": 0, "easing": "ease-out", "engine": "gsap", "gsapType": "zoomIn", "gsapEase": "power2.out" } }
        },
        {
          "id": "el-9",
          "type": "text",
          "content": "Kết luận: Ưu tiên an toàn + tận dụng AI đúng cách",
          "style": { "x": 24, "y": 360, "width": 312, "height": 120, "rotation": 0, "zIndex": 2, "opacity": 1, "color": "#ffffff", "fontSize": 18, "fontFamily": "system-ui, -apple-system, sans-serif", "fontWeight": "semibold", "textAlign": "center" },
          "animation": { "enter": { "type": "fadeInUp", "duration": 650, "delay": 150, "easing": "ease-out", "engine": "gsap", "gsapType": "fadeInUp", "gsapEase": "power2.out" } }
        }
      ]
    }
  ]
}

Ví dụ 2 (ít element, dùng loop nhẹ):
{
  "id": "story-sample-2",
  "title": "Bản tin: Thời tiết",
  "settings": { "autoAdvance": true, "loop": false, "showProgressBar": true },
  "slides": [
    {
      "id": "slide-a",
      "duration": 5,
      "background": { "type": "image", "value": "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1080" },
      "transition": { "type": "fade", "duration": 600 },
      "elements": [
        {
          "id": "el-a1",
          "type": "text",
          "content": "THỜI TIẾT HÔM NAY",
          "style": { "x": 20, "y": 70, "width": 320, "height": 64, "rotation": 0, "zIndex": 2, "opacity": 1, "color": "#ffffff", "fontSize": 26, "fontFamily": "system-ui, -apple-system, sans-serif", "fontWeight": "bold", "textAlign": "center", "backgroundColor": "rgba(0,0,0,0.35)", "borderRadius": 12 },
          "animation": { "enter": { "type": "fadeInDown", "duration": 700, "delay": 0, "easing": "ease-out", "engine": "gsap", "gsapType": "fadeInDown", "gsapEase": "power2.out" } }
        },
        {
          "id": "el-a2",
          "type": "text",
          "content": "28°C • Có mưa rào • Gió nhẹ",
          "style": { "x": 20, "y": 150, "width": 320, "height": 56, "rotation": 0, "zIndex": 2, "opacity": 1, "color": "#e5e7eb", "fontSize": 18, "fontFamily": "system-ui, -apple-system, sans-serif", "fontWeight": "medium", "textAlign": "center" },
          "animation": { "enter": { "type": "fadeInUp", "duration": 650, "delay": 120, "easing": "ease-out", "engine": "gsap", "gsapType": "fadeInUp", "gsapEase": "power2.out" }, "loop": { "type": "float", "duration": 1800, "delay": 0, "easing": "ease-in-out", "engine": "gsap", "gsapType": "float" } }
        }
      ]
    }
  ]
}

=== SCHEMA TÓM TẮT ===
Story:
{
  "id": "story-<any>",
  "title": "...",
  "description": "..." (optional),
  "thumbnail": "..." (optional),
  "slides": StorySlide[],
  "settings": { "autoAdvance": true, "loop": false, "showProgressBar": true }
}

StorySlide:
{
  "id": "slide-<any>",
  "duration": 5,
  "background": SlideBackground,
  "elements": StoryElement[],
  "transition": { "type": "fade" | "slide" | "zoom" | "flip" | "cube" | "dissolve" | "wipe" | "none", "duration": 500 }
}

StoryElement:
{
  "id": "el-<any>",
  "type": "text" | "image" | "video" | "shape" | ...,
  "content": "...",
  "style": {
    "x": 0-360,
    "y": 0-640,
    "width": 0-360,
    "height": 0-640,
    "rotation": 0,
    "zIndex": 1,
    "opacity": 0-1,
    "color": "#ffffff" (optional),
    "backgroundColor": "rgba(...)" (optional),
    "fontSize": number (optional),
    "fontFamily": string (optional),
    "fontWeight": string (optional),
    "textAlign": "left"|"center"|"right"|"justify" (optional)
  },
  "animation": { "enter": {"type":"fadeIn","duration":500,"delay":0,"easing":"ease-out"} } (optional)
}

=== VÍ DỤ STYLE CHO TEXT CHÍNH (tham khảo) ===
${JSON.stringify(exampleStyle, null, 2)}
`;
  }, []);

  const parseImportedStoryFromText = useCallback(
    (text: string): { success: true; story: Story } | { success: false; error: string } => {
      try {
        const raw = JSON.parse(text) as unknown;
        if (!raw || typeof raw !== 'object') return { success: false, error: 'JSON must be an object' };

        const obj = raw as Partial<Story>;
        if (!obj.title || typeof obj.title !== 'string')
          return { success: false, error: 'Missing/invalid story.title' };
        if (!Array.isArray(obj.slides) || obj.slides.length === 0)
          return { success: false, error: 'Missing/invalid story.slides' };

        const invalidSlide = obj.slides.find((s) => {
          if (!s || typeof s !== 'object') return true;
          if (!('id' in s) || typeof (s as StorySlide).id !== 'string') return true;
          if (!('duration' in s) || typeof (s as StorySlide).duration !== 'number') return true;
          if (!('background' in s) || !(s as StorySlide).background) return true;
          if (!('elements' in s) || !Array.isArray((s as StorySlide).elements)) return true;
          return false;
        });
        if (invalidSlide)
          return { success: false, error: 'Invalid slide schema (id/duration/background/elements required)' };

        const normalized: Story = {
          ...obj,
          id: `story-${Date.now()}`,
          updatedAt: new Date().toISOString(),
          createdAt: obj.createdAt || new Date().toISOString(),
          settings: obj.settings || {
            autoAdvance: true,
            loop: false,
            showProgressBar: true,
          },
        } as Story;

        return { success: true, story: normalized };
      } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Invalid JSON' };
      }
    },
    []
  );

  // Render High Quality Video with WebCodecs API (FASTEST)
  const handleRenderHighQuality = async () => {
    try {
      if (!currentSlide) return;

      // Check browser support
      if (!('VideoEncoder' in window)) {
        alert(
          'WebCodecs API not supported in this browser.\n\n' +
            'Please use Chrome 94+, Edge 94+, or Opera 80+.\n\n' +
            'Falling back to compatibility mode...'
        );
        return handleRenderHighQualityFallback();
      }

      const confirmed = window.confirm(
        '🚀 Ultra-Fast Rendering Mode\n\n' +
          'Using WebCodecs API & mp4-muxer for instant export.\n' +
          'Please do not switch tabs during rendering.'
      );
      if (!confirmed) return;

      setIsRendering(true);
      setRenderProgress(0);
      setLoadingStatus('Initializing encoder...');

      await new Promise((r) => setTimeout(r, 300));

      const fps = 30;
      const duration = currentSlide.duration || 5;
      const totalFrames = Math.ceil(duration * fps);
      const width = 1080;
      const height = 1920;

      console.log(`WebCodecs Render: ${totalFrames} frames @ ${fps}fps`);

      // Get render container
      const element = document.getElementById('render-container');
      if (!element) {
        throw new Error('Render container missing. Please try again.');
      }

      // Create offscreen canvas for faster rendering
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = width;
      offscreenCanvas.height = height;
      const ctx = offscreenCanvas.getContext('2d', {
        alpha: false,
        desynchronized: true, // Performance hint
      });
      if (!ctx) throw new Error('Failed to create canvas context');

      // Initialize mp4-muxer

      const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: {
          codec: 'avc',
          width,
          height,
        },
        firstTimestampBehavior: 'offset',
        fastStart: 'in-memory',
      });

      let frameCount = 0;

      // Configure VideoEncoder
      const encoder = new VideoEncoder({
        output: (chunk, meta) => {
          muxer.addVideoChunk(chunk, meta);
        },
        error: (e) => {
          console.error('VideoEncoder error:', e);
          throw e;
        },
      });

      // Configure with H.264 baseline profile for compatibility
      encoder.configure({
        codec: 'avc1.640028', // H.264 Baseline Level 4
        width,
        height,
        bitrate: 4_000_000, // 4 Mbps - high quality
        framerate: fps,
        hardwareAcceleration: 'prefer-hardware',
        latencyMode: 'quality',
      });

      setLoadingStatus('Capturing frames...');

      // Render all frames
      for (let i = 0; i < totalFrames; i++) {
        // Update time
        const time = (i / fps) * 1000;
        setRenderTime(time);

        // Wait for DOM update (much faster than html2canvas)
        await new Promise((r) => {
          requestAnimationFrame(() => requestAnimationFrame(r));
        });

        // Capture frame using native canvas API (10-20x faster than html2canvas)
        try {
          // Draw DOM element to canvas using html2canvas (still needed for complex layouts)
          const tempCanvas = await html2canvas(element, {
            canvas: offscreenCanvas,
            scale: 1,
            width,
            height,
            backgroundColor: currentSlide.background.type === 'color' ? currentSlide.background.value : '#ffffff',
            useCORS: true,
            logging: false,
            allowTaint: true,
          });

          // Create VideoFrame from canvas
          const videoFrame = new VideoFrame(tempCanvas, {
            timestamp: (i * 1_000_000) / fps, // microseconds
            duration: 1_000_000 / fps,
          });

          // Encode frame
          encoder.encode(videoFrame, { keyFrame: i % 30 === 0 }); // Keyframe every 1 second
          videoFrame.close();

          frameCount++;
          setRenderProgress(Math.round(((i + 1) / totalFrames) * 100));
          setLoadingStatus(`Encoding frame ${i + 1}/${totalFrames}`);
        } catch (err) {
          console.error(`Frame ${i} failed:`, err);
          throw err;
        }
      }

      // Flush encoder
      setLoadingStatus('Finalizing video...');
      await encoder.flush();
      encoder.close();

      // Finalize muxing
      muxer.finalize();
      const { buffer } = muxer.target;

      setLoadingStatus('Downloading...');

      // Download
      const mp4Blob = new Blob([buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(mp4Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${story.title.replace(/\s+/g, '-').toLowerCase()}_webcodecs.mp4`;
      a.click();
      URL.revokeObjectURL(url);

      console.log(`✅ Rendered ${frameCount} frames successfully`);
    } catch (err) {
      console.error('WebCodecs render failed:', err);
      alert('Rendering failed. See console for details.\n\nTry the fallback mode or use Chrome 94+.');
    } finally {
      setIsRendering(false);
      setLoadingStatus('');
    }
  };

  // Fallback rendering method (original optimized version)
  const handleRenderHighQualityFallback = async () => {
    try {
      if (!currentSlide) return;

      setIsRendering(true);
      setRenderProgress(0);
      setLoadingStatus('Initializing video engine (FFmpeg)...');

      await new Promise((r) => setTimeout(r, 500));

      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg.loaded) {
        await ffmpeg.load({
          coreURL: await toBlobURL(`/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`/ffmpeg-core.wasm`, 'application/wasm'),
        });
      }

      const fps = 30;
      const duration = currentSlide.duration || 5;
      const totalFrames = Math.ceil(duration * fps);
      const width = 1080;
      const height = 1920;

      const element = document.getElementById('render-container');
      if (!element) throw new Error('Render container missing');

      const canvasConfig = {
        scale: 1,
        width,
        height,
        backgroundColor: currentSlide.background.type === 'color' ? currentSlide.background.value : '#ffffff',
        useCORS: true,
        logging: false,
        allowTaint: true,
      };

      for (let i = 0; i < totalFrames; i++) {
        setLoadingStatus(`Rendering frame ${i + 1}/${totalFrames}`);
        const time = (i / fps) * 1000;
        setRenderTime(time);

        await new Promise((r) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setTimeout(r, 50));
          });
        });

        const canvas = await html2canvas(element, canvasConfig);
        const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.95));

        if (!blob) continue;

        const fileName = `frame-${String(i).padStart(4, '0')}.jpg`;
        await ffmpeg.writeFile(fileName, await fetchFile(blob));
        setRenderProgress(Math.round(((i + 1) / totalFrames) * 100));
      }

      setLoadingStatus('Encoding video...');
      await ffmpeg.exec([
        '-framerate',
        '30',
        '-i',
        'frame-%04d.jpg',
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '23',
        '-pix_fmt',
        'yuv420p',
        '-vf',
        'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        'output.mp4',
      ]);

      const data = await ffmpeg.readFile('output.mp4');
      const mp4Blob = new Blob([data as unknown as BlobPart], { type: 'video/mp4' });
      const url = URL.createObjectURL(mp4Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${story.title.replace(/\s+/g, '-').toLowerCase()}_fallback.mp4`;
      a.click();
      URL.revokeObjectURL(url);

      // Cleanup
      for (let i = 0; i < totalFrames; i++) {
        try {
          await ffmpeg.deleteFile(`frame-${String(i).padStart(4, '0')}.jpg`);
        } catch {
          console.error('Failed to delete frame file');
        }
      }
      await ffmpeg.deleteFile('output.mp4');
    } catch (err) {
      console.error('Fallback render failed:', err);
      alert('Rendering failed completely. Please try again.');
    } finally {
      setIsRendering(false);
      setLoadingStatus('');
    }
  };
  // Import story
  const importStory = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string) as Story;
          setStory({
            ...imported,
            id: `story-${Date.now()}`,
            updatedAt: new Date().toISOString(),
          });
          if (imported.slides[0]) {
            setCurrentSlideId(imported.slides[0].id);
          }
          setSelectedElementIds([]);
        } catch {
          alert('Invalid story file');
        }
      };
      reader.readAsText(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [setStory]
  );

  // Save to server
  const handleSave = async () => {
    try {
      // Check for pending media (images/videos/audio)
      const pendingMedia = getPendingMedia();

      if (pendingMedia.length > 0) {
        const isProduction =
          typeof window !== 'undefined' &&
          window.location.hostname !== 'localhost' &&
          window.location.hostname !== '127.0.0.1';

        if (isProduction) {
          const confirmUpload = confirm(
            `Có ${pendingMedia.length} file media đang chờ upload lên GitHub.\n` +
              `Bao gồm: ${pendingMedia.map((m) => `${m.type} (${m.fileName})`).join(', ')}\n\n` +
              'Bạn có muốn upload trước khi lưu không?'
          );

          if (confirmUpload) {
            // Upload all pending media to GitHub
            await uploadAllPendingMedia((current, total, fileName, type) => {
              console.log(`Uploading ${type} ${current}/${total}: ${fileName}`);
            });
            alert(`Đã upload ${pendingMedia.length} file media lên GitHub!`);
          }
        }
      }

      // Save story to server
      const res = await fetch('/admin/save-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(story),
      });

      if (!res.ok) throw new Error('Failed to save');

      const data = await res.json();
      alert(`Story saved to ${data.path}`);
    } catch (error) {
      console.error(error);
      alert('Failed to save story');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement;

      if (isInput) return;

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }

      // Delete selected elements
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        selectedElementIds.forEach(deleteElement);
      }

      // Duplicate
      else if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedElementIds.length > 0) {
        e.preventDefault();
        selectedElementIds.forEach(duplicateElement);
      }

      // Deselect
      else if (e.key === 'Escape') {
        setSelectedElementIds([]);
        setIsPreviewMode(false);
      }

      // Preview
      else if (e.key === 'p' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setPreviewStartIndex(currentSlideIndex);
        setIsPreviewMode(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedElementIds, deleteElement, duplicateElement, currentSlideIndex]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Hidden file input for import */}
      <input ref={fileInputRef} type="file" accept=".json" onChange={importStory} className="hidden" />

      {/* Loading Overlay */}
      {isRendering && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-bold mb-2">{loadingStatus || `Rendering Frames (${renderProgress}%)`}</h2>
          <p className="text-slate-400 text-sm max-w-md text-center">
            Please do not switch tabs or minimize the window.
          </p>
          {isRendering && (
            <div className="w-64 h-2 bg-slate-700 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${renderProgress}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Hidden Render Container */}
      {isRendering && currentSlide && (
        <div
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
            width: '1080px',
            height: '1920px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
          }}
        >
          <div id="render-container" className="relative w-full h-full bg-white">
            {/* Background */}
            {currentSlide.background.type === 'color' && (
              <div
                className="absolute inset-0 w-full h-full"
                style={{ backgroundColor: currentSlide.background.value }}
              />
            )}
            {currentSlide.background.type === 'gradient' && currentSlide.background.gradient && (
              <div
                className="absolute inset-0 w-full h-full"
                style={{
                  background:
                    currentSlide.background.gradient.type === 'radial'
                      ? `radial-gradient(circle, ${currentSlide.background.gradient.colors.map((c) => `${c.color} ${c.position}%`).join(', ')})`
                      : `linear-gradient(${currentSlide.background.gradient.angle || 0}deg, ${currentSlide.background.gradient.colors.map((c) => `${c.color} ${c.position}%`).join(', ')})`,
                }}
              />
            )}
            {currentSlide.background.type === 'image' && (
              <img
                src={currentSlide.background.value}
                className="absolute inset-0 w-full h-full object-cover"
                alt="bg"
              />
            )}

            {/* Elements */}
            {currentSlide.elements.map((el) => (
              <CanvasElement
                key={el.id}
                element={el}
                isSelected={false}
                onSelect={() => {}}
                onUpdate={() => {}}
                currentTime={renderTime}
                playAnimation={false}
                snapToGrid={false}
                gridSize={0}
                renderMode={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preview Mode */}
      {isPreviewMode && (
        <StoryPreviewV2 story={story} onClose={() => setIsPreviewMode(false)} startSlideIndex={previewStartIndex} />
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Quay lại danh sách"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
            Story Builder
          </h1>
          <input
            type="text"
            value={story.title}
            onChange={(e) => setStory((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
            className="bg-slate-700/50 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 w-48"
            placeholder="Story title..."
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center bg-slate-700/50 rounded-lg p-0.5 border border-slate-600">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`p-1.5 rounded transition-colors ${
                !canUndo ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-600 hover:text-white'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-1.5 rounded transition-colors ${
                !canRedo ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-600 hover:text-white'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={16} />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-700/50 rounded-lg p-0.5 border border-slate-600">
            <button
              onClick={() =>
                setCanvasState((prev) => ({
                  ...prev,
                  zoom: Math.max(0.5, prev.zoom - 0.1),
                }))
              }
              className="p-1.5 text-slate-300 hover:bg-slate-600 hover:text-white rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="px-2 text-xs text-slate-400 min-w-[3rem] text-center">
              {Math.round(canvasState.zoom * 100)}%
            </span>
            <button
              onClick={() =>
                setCanvasState((prev) => ({
                  ...prev,
                  zoom: Math.min(2, prev.zoom + 0.1),
                }))
              }
              className="p-1.5 text-slate-300 hover:bg-slate-600 hover:text-white rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Canvas options */}
          <div className="flex items-center bg-slate-700/50 rounded-lg p-0.5 border border-slate-600">
            <button
              onClick={() => setCanvasState((prev) => ({ ...prev, showGrid: !prev.showGrid }))}
              className={`p-1.5 rounded transition-colors ${
                canvasState.showGrid ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-600'
              }`}
              title="Toggle Grid"
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() =>
                setCanvasState((prev) => ({
                  ...prev,
                  showSafeZone: !prev.showSafeZone,
                }))
              }
              className={`p-1.5 rounded transition-colors ${
                canvasState.showSafeZone ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-600'
              }`}
              title="Toggle Safe Zone"
            >
              <Layers size={16} />
            </button>
          </div>

          {/* Actions */}
          <button
            onClick={() => {
              setPreviewStartIndex(currentSlideIndex);
              setIsPreviewMode(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
            title="Preview (P)"
          >
            <Play size={16} /> Preview
          </button>

          <div className="flex items-center bg-slate-700/50 rounded-lg p-0.5 border border-slate-600">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-slate-300 hover:bg-slate-600 hover:text-white rounded transition-colors"
              title="Import Story"
            >
              <Upload size={16} />
            </button>
            <button
              onClick={() => setShowAiModal(true)}
              className="p-1.5 text-slate-300 hover:bg-slate-600 hover:text-white rounded transition-colors"
              title="AI JSON"
            >
              <Sparkles size={16} />
            </button>
            <button
              onClick={exportStory}
              className="p-1.5 text-slate-300 hover:bg-slate-600 hover:text-white rounded transition-colors"
              title="Export Story JSON"
            >
              <Download size={16} />
            </button>
            <button
              onClick={handleRenderHighQuality}
              className="p-1.5 text-slate-300 hover:bg-slate-600 hover:text-white rounded transition-colors"
              title="Export Story as Video"
            >
              <Film size={16} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 text-slate-300 hover:bg-slate-600 hover:text-white rounded transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 rounded-lg text-sm font-medium transition-all shadow-lg shadow-pink-500/20"
          >
            <Save size={16} /> Save
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Resources / Layers */}
        <div className="w-72 border-r border-slate-700 flex flex-col">
          {/* Tab switcher */}
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setLeftPanelTab('resources')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                leftPanelTab === 'resources'
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <PanelLeft size={14} /> Resources
            </button>
            <button
              onClick={() => setLeftPanelTab('layers')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                leftPanelTab === 'layers'
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Layers size={14} /> Layers
            </button>
            <button
              onClick={() => setLeftPanelTab('audio')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                leftPanelTab === 'audio'
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Music2 size={14} /> Audio
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {leftPanelTab === 'resources' ? (
              <ResourcePanelV2 onAddElement={addElement} onApplyTemplate={applyTemplate} />
            ) : leftPanelTab === 'layers' ? (
              <LayersPanel
                elements={currentSlide.elements}
                selectedElementIds={selectedElementIds}
                onSelectElement={(id, multiSelect) => {
                  if (multiSelect) {
                    setSelectedElementIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
                  } else {
                    setSelectedElementIds([id]);
                  }
                }}
                onReorderElements={reorderElements}
                onToggleVisibility={toggleElementVisibility}
                onToggleLock={toggleElementLock}
                onDeleteElement={deleteElement}
                onDuplicateElement={duplicateElement}
              />
            ) : (
              <AudioPanel
                story={story}
                currentSlide={currentSlide}
                onUpdateStory={(updates) => setStory((prev) => (prev ? { ...prev, ...updates } : prev))}
                onUpdateSlide={updateSlide}
              />
            )}
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-900/50">
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            {/* Canvas container with zoom */}
            <div
              className="relative transition-transform duration-200"
              style={{
                transform: `scale(${canvasState.zoom})`,
                transformOrigin: 'center',
              }}
            >
              {/* Canvas */}
              <div
                className="relative shadow-2xl rounded-lg overflow-hidden"
                style={{ width: 360, height: 640 }}
                onPointerDown={() => setSelectedElementIds([])}
              >
                {/* Background */}
                {currentSlide.background.type === 'color' && (
                  <div
                    className="absolute inset-0 w-full h-full"
                    style={{ backgroundColor: currentSlide.background.value }}
                  />
                )}
                {currentSlide.background.type === 'gradient' && currentSlide.background.gradient && (
                  <div
                    className="absolute inset-0 w-full h-full"
                    style={{
                      background:
                        currentSlide.background.gradient.type === 'radial'
                          ? `radial-gradient(circle, ${currentSlide.background.gradient.colors.map((c) => `${c.color} ${c.position}%`).join(', ')})`
                          : `linear-gradient(${currentSlide.background.gradient.angle || 0}deg, ${currentSlide.background.gradient.colors.map((c) => `${c.color} ${c.position}%`).join(', ')})`,
                    }}
                  />
                )}
                {currentSlide.background.type === 'image' && (
                  <img
                    src={currentSlide.background.value}
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="slide-bg"
                  />
                )}
                {currentSlide.background.type === 'video' && (
                  <video
                    src={currentSlide.background.value}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    loop
                    autoPlay
                  />
                )}

                {/* Grid overlay */}
                {canvasState.showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
                      `,
                      backgroundSize: `${canvasState.gridSize}px ${canvasState.gridSize}px`,
                    }}
                  />
                )}

                {/* Safe zone guides */}
                {canvasState.showSafeZone && (
                  <>
                    <div className="absolute top-10 inset-x-0 h-px bg-blue-500/30 pointer-events-none" />
                    <div className="absolute bottom-20 inset-x-0 h-px bg-blue-500/30 pointer-events-none" />
                    <div className="absolute inset-y-0 left-4 w-px bg-blue-500/30 pointer-events-none" />
                    <div className="absolute inset-y-0 right-4 w-px bg-blue-500/30 pointer-events-none" />
                  </>
                )}

                {/* Elements */}
                {currentSlide.elements.map((element) => (
                  <CanvasElement
                    key={element.id}
                    element={element}
                    isSelected={selectedElementIds.includes(element.id)}
                    currentTime={currentTime}
                    onSelect={(multiSelect) => {
                      if (multiSelect) {
                        setSelectedElementIds((prev) =>
                          prev.includes(element.id) ? prev.filter((id) => id !== element.id) : [...prev, element.id]
                        );
                      } else {
                        setSelectedElementIds([element.id]);
                      }
                    }}
                    onUpdate={(updates) => updateElement(element.id, updates)}
                    onDelete={() => deleteElement(element.id)}
                    onDuplicate={() => duplicateElement(element.id)}
                    onToggleLock={() => toggleElementLock(element.id)}
                    snapToGrid={canvasState.snapToGrid}
                    gridSize={canvasState.gridSize}
                    zoom={canvasState.zoom}
                    playAnimation={selectedElementIds.includes(element.id) && animationTrigger > 0}
                  />
                ))}
              </div>

              {/* Canvas info */}
              <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
                <span className="text-[10px] text-slate-500 font-mono">360 × 640 • 9:16 Story</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="h-36 border-t border-slate-700">
            <TimelineV2
              slides={story.slides}
              currentSlideId={currentSlideId}
              onSelectSlide={(id) => {
                setCurrentSlideId(id);
                setSelectedElementIds([]);
              }}
              onAddSlide={addSlide}
              onReorderSlides={(newSlides) => setStory((prev) => (prev ? { ...prev, slides: newSlides } : prev))}
              onDeleteSlide={deleteSlide}
              onDuplicateSlide={duplicateSlide}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              currentTime={currentTime}
              onSeek={setCurrentTime}
              elements={currentSlide.elements}
              onUpdateElement={updateElement}
              selectedElementIds={selectedElementIds}
              onSelectElement={(id) => setSelectedElementIds([id])}
            />
          </div>
        </div>

        {/* Right: Properties */}
        <div className="w-80 border-l border-slate-700">
          <PropertiesPanelV2
            element={selectedElement || null}
            slide={currentSlide}
            onUpdateElement={(updates) => {
              if (selectedElementIds.length === 1) {
                updateElement(selectedElementIds[0], updates);
              }
            }}
            onUpdateSlide={(updates) => updateSlide(currentSlideId, updates)}
            onDeleteElement={() => {
              if (selectedElement) {
                deleteElement(selectedElement.id);
              }
            }}
            onDuplicateElement={() => {
              if (selectedElement) {
                duplicateElement(selectedElement.id);
              }
            }}
            onToggleLock={() => {
              if (selectedElement) {
                toggleElementLock(selectedElement.id);
              }
            }}
            onPreviewAnimation={() => {
              setAnimationTrigger((prev) => prev + 1);
            }}
          />
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-800 rounded-xl shadow-2xl w-[400px] border border-slate-700">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <h3 className="font-semibold text-white">Story Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Thumbnail */}
              <div className="space-y-2">
                <label className="block text-sm text-slate-300">Thumbnail / Cover Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={story.thumbnail || ''}
                    onChange={(e) => setStory((prev) => (prev ? { ...prev, thumbnail: e.target.value } : prev))}
                    placeholder="Enter image URL or upload..."
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <label className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded cursor-pointer text-sm text-slate-300 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Convert to base64 for saving
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            setStory((prev) => (prev ? { ...prev, thumbnail: base64 } : prev));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    Upload
                  </label>
                </div>
                {story.thumbnail && (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-600">
                    <img src={story.thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setStory((prev) => (prev ? { ...prev, thumbnail: undefined } : prev))}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500 rounded text-white text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm text-slate-300">Description</label>
                <textarea
                  value={story.description || ''}
                  onChange={(e) => setStory((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                  placeholder="Enter story description..."
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="border-t border-slate-700 pt-4 space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Auto-advance slides</span>
                  <input
                    type="checkbox"
                    checked={story.settings?.autoAdvance ?? true}
                    onChange={(e) =>
                      setStory((prev) =>
                        prev ? { ...prev, settings: { ...prev.settings!, autoAdvance: e.target.checked } } : prev
                      )
                    }
                    className="w-4 h-4 accent-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Loop story</span>
                  <input
                    type="checkbox"
                    checked={story.settings?.loop ?? false}
                    onChange={(e) =>
                      setStory((prev) =>
                        prev ? { ...prev, settings: { ...prev.settings!, loop: e.target.checked } } : prev
                      )
                    }
                    className="w-4 h-4 accent-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Show progress bar</span>
                  <input
                    type="checkbox"
                    checked={story.settings?.showProgressBar ?? true}
                    onChange={(e) =>
                      setStory((prev) =>
                        prev ? { ...prev, settings: { ...prev.settings!, showProgressBar: e.target.checked } } : prev
                      )
                    }
                    className="w-4 h-4 accent-blue-500"
                  />
                </label>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI JSON Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-800 rounded-xl shadow-2xl w-[680px] border border-slate-700">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <h3 className="font-semibold text-white">AI JSON</h3>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-slate-200">
                    Tạo prompt để AI sinh JSON bản tin từ chủ đề, sau đó paste JSON vào đây.
                  </div>
                  <div className="text-xs text-slate-400">Lưu ý: AI phải trả về JSON-only.</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const prompt = generateAIPrompt(aiTopic);
                    setAiPrompt(prompt);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-200 transition-colors"
                  title="Generate AI prompt"
                >
                  <Sparkles size={16} /> Generate
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="block text-xs text-slate-400">Chủ đề</label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="Ví dụ: Bản tin công nghệ hôm nay"
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs text-slate-400">Prompt</label>
                      <button
                        type="button"
                        onClick={async () => {
                          const prompt = aiPrompt || generateAIPrompt(aiTopic);
                          setAiPrompt(prompt);
                          try {
                            await navigator.clipboard.writeText(prompt);
                          } catch {
                            alert('Copy failed. Please copy manually.');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[11px] text-slate-200 transition-colors"
                        title="Copy prompt"
                      >
                        <Copy size={12} /> Copy
                      </button>
                    </div>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Nhấn Generate để tạo prompt..."
                      rows={14}
                      className="w-full bg-slate-900/40 border border-slate-600 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs text-slate-400">Paste JSON (AI trả về)</label>
                      <button
                        type="button"
                        onClick={() => {
                          if (!aiJsonText.trim()) {
                            alert('Vui lòng paste JSON trước');
                            return;
                          }
                          const result = parseImportedStoryFromText(aiJsonText);
                          if (!result.success) {
                            alert(result.error);
                            return;
                          }
                          setStory(result.story);
                          if (result.story.slides[0]) setCurrentSlideId(result.story.slides[0].id);
                          setSelectedElementIds([]);
                          setAiJsonText('');
                          setShowAiModal(false);
                          alert('Imported successfully!');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white transition-colors"
                        title="Apply JSON"
                      >
                        Apply
                      </button>
                    </div>
                    <textarea
                      value={aiJsonText}
                      onChange={(e) => setAiJsonText(e.target.value)}
                      placeholder="Dán JSON (bắt đầu bằng { ... })"
                      rows={18}
                      className="w-full bg-slate-900/40 border border-slate-600 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

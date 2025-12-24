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
  Plus,
  Redo2,
  Save,
  Settings,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useHistory } from '~/hooks/useHistory';
import { useResponsive } from '~/hooks/useResponsive';
import { getPendingMedia, uploadAllPendingMedia } from '~/utils/media';
import { resolveMediaUrl } from '~/utils/mediaUrl';
import { AudioPanel } from './AudioPanel';
import { CanvasElement } from './CanvasElementV2';
import {
  DEFAULT_EXPORT_SETTINGS,
  ExportSettingsModal,
  RESOLUTION_MAP,
  type ExportSettings,
} from './ExportSettingsModal';
import { LayersPanel } from './LayersPanel';
import {
  BottomNavBar,
  BottomSheet,
  CompactTimeline,
  FloatingActionButton,
  MobileHeader,
  MobilePropertiesPanel,
  MobileResourcesPanel,
  SwipeNavigator,
  TouchCanvas,
  type MenuItem,
  type NavTab,
} from './mobile';
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
import { getGitHubToken, saveToGitHub } from '../builder/actions/saveActions';
import { GITHUB_CONFIG } from '../config';

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
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportSettings>(DEFAULT_EXPORT_SETTINGS);
  const [leftPanelTab, setLeftPanelTab] = useState<'resources' | 'layers' | 'audio'>('resources');
  const [animationTrigger, setAnimationTrigger] = useState(0); // For triggering animation preview

  // Mobile-specific state
  const { isMobile, isTablet: _isTablet } = useResponsive();
  const [mobileActiveTab, setMobileActiveTab] = useState<string>('canvas');
  const [showMobileResources, setShowMobileResources] = useState(false);
  const [showMobileProperties, setShowMobileProperties] = useState(false);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const [_contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  // Mobile navigation tabs configuration
  const mobileNavTabs: NavTab[] = [
    { id: 'canvas', label: 'Canvas', icon: <Grid3X3 size={20} /> },
    { id: 'layers', label: 'Layers', icon: <Layers size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

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

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [story]);

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

  // Mobile menu items (defined after exportStory)
  const mobileMenuItems: MenuItem[] = [
    { id: 'preview', label: 'Preview', icon: <Play size={18} />, onClick: () => { setPreviewStartIndex(currentSlideIndex); setIsPreviewMode(true); } },
    { id: 'export-json', label: 'Export JSON', icon: <Download size={18} />, onClick: exportStory },
    { id: 'export-video', label: 'Export Video', icon: <Film size={18} />, onClick: () => setShowExportModal(true) },
    { id: 'import', label: 'Import', icon: <Upload size={18} />, onClick: () => fileInputRef.current?.click() },
    { id: 'ai-json', label: 'AI JSON', icon: <Sparkles size={18} />, onClick: () => setShowAiModal(true) },
  ];

  const generateAIPrompt = useCallback((topic: string) => {
    return `Bạn là AI chuyên gia tạo JSON cho Story Builder chuyên nghiệp.

Nhiệm vụ: tạo 1 object JSON theo đúng schema để hiển thị bản tin dạng story (9:16) cực kỳ sinh động và giàu nội dung.

Chủ đề: ${topic || '[NHẬP CHỦ ĐỀ Ở ĐÂY]'}

=== YÊU CẦU OUTPUT (BẮT BUỘC) ===
1) Chỉ trả về DUY NHẤT JSON (không giải thích, không markdown, không \`\`\`)
2) JSON phải parse được, không trailing comma
3) Nội dung tiếng Việt chuyên nghiệp, hấp dẫn
4) Quy mô: 3-6 slides.
5) MẬT ĐỘ NỘI DUNG: Mỗi slide PHẢI có từ 4 đến 8 elements (Text, Image, Video, Poll, Button, Sticker, etc.).
6) TƯƠNG TÁC: Ít nhất 50% số slide phải có các phần tử tương tác như Poll (bình chọn), Button (nút bấm), hoặc Slider.

=== CÁCH GẮN LINK (QUAN TRỌNG) ===
- Đối với BUTTON: Dùng object "button" bên trong element.
  Ví dụ: "button": { "href": "https://...", "target": "_blank", "variant": "solid" }
- Đối với IMAGE/STICKER/GIF/VIDEO: Nếu muốn gắn link, dùng object "link".
  Ví dụ: "link": { "url": "https://...", "target": "_blank" }

=== CÁC LOẠI ELEMENT HỖ TRỢ ===
- "text": nội dung văn bản.
- "image"/"video": "content" là URL.
- "poll": { "question": "...", "options": ["A", "B", "C"] }
- "button": { "href": "...", "target": "_blank", "variant": "solid" | "outline" | "ghost" }
- "slider"/"carousel": { "images": ["URL1", "URL2", "URL3"] }
- "list": { "type": "bullet" | "numbered" | "checklist", "items": ["...", "..."] }
- "sticker"/"gif": "content" là URL.
- "rating": { "value": 4, "max": 5, "icon": "star" | "heart" }

=== VÍ DỤ JSON MẪU CHUẨN (BẮT CHƯỚC CẤU TRÚC NÀY) ===
{
  "id": "story-standard-sample",
  "title": "Bản tin Vitamin B",
  "description": "Sức khỏe và Năng lượng",
  "settings": { "autoAdvance": true, "loop": false, "showProgressBar": true },
  "slides": [
    {
      "id": "slide-1",
      "duration": 7,
      "background": { "type": "image", "value": "https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=1080" },
      "elements": [
        {
          "id": "el-overlay",
          "type": "shape",
          "shapeType": "rectangle",
          "style": { "x": 0, "y": 0, "width": 360, "height": 640, "zIndex": 1, "opacity": 0.45, "backgroundColor": "#000000" }
        },
        {
          "id": "el-title",
          "type": "text",
          "content": "VITAMIN B LÀ GÌ?",
          "style": { "x": 20, "y": 60, "width": 320, "height": 70, "zIndex": 5, "color": "#ffffff", "fontSize": 30, "fontWeight": "bold", "textAlign": "center" },
          "animation": { "enter": { "type": "fadeInDown", "duration": 700, "engine": "gsap", "gsapType": "fadeInDown" } }
        },
        {
          "id": "el-poll",
          "type": "poll",
          "poll": { "question": "Bạn đã biết về Vitamin B?", "options": ["Rồi", "Chưa", "Một chút"] },
          "style": { "x": 30, "y": 300, "width": 300, "height": 160, "zIndex": 8, "backgroundColor": "rgba(255,255,255,0.18)", "borderRadius": 16 },
          "animation": { "enter": { "type": "zoomIn", "duration": 600, "delay": 600, "engine": "gsap", "gsapType": "zoomIn" } }
        }
      ]
    },
    {
      "id": "slide-2",
      "duration": 7,
      "background": { "type": "image", "value": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1080" },
      "elements": [
        {
          "id": "el-img-link",
          "type": "image",
          "content": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1080",
          "link": { "url": "https://example.com/health", "target": "_blank" },
          "style": { "x": 30, "y": 100, "width": 300, "height": 180, "zIndex": 5, "borderRadius": 12 }
        },
        {
          "id": "el-button",
          "type": "button",
          "content": "TÌM HIỂU CHI TIẾT",
          "button": { "href": "https://vi.wikipedia.org/wiki/Vitamin_B", "target": "_blank", "variant": "solid" },
          "style": { "x": 60, "y": 320, "width": 240, "height": 50, "zIndex": 8, "backgroundColor": "#22c55e", "color": "#ffffff", "borderRadius": 25, "fontWeight": "bold" },
          "animation": { "enter": { "type": "bounceIn", "duration": 700, "delay": 600, "engine": "gsap", "gsapType": "bounceIn" } }
        }
      ]
    }
  ]
}

=== QUY TẮC TỌA ĐỘ ===
- Canvas chuẩn: 360x640 (9:16).
- Căn lề tối thiểu 20px.
- Sắp xếp zIndex hợp lý (Text/Poll/Button nên ở lớp trên cùng).
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
  const handleRenderHighQuality = async (settings: ExportSettings = exportSettings) => {
    try {
      // Check browser support
      if (!('VideoEncoder' in window)) {
        alert(
          'WebCodecs API not supported in this browser.\n\n' +
            'Please use Chrome 94+, Edge 94+, or Opera 80+.\n\n' +
            'Falling back to compatibility mode...'
        );
        return handleRenderHighQualityFallback(settings);
      }

      setIsRendering(true);
      setRenderProgress(0);
      setLoadingStatus('Initializing encoder...');

      await new Promise((r) => setTimeout(r, 300));

      // Use settings from export modal
      const { fps, bitrate, resolution, exportAllSlides } = settings;
      const { width, height } = RESOLUTION_MAP[resolution];

      // Determine which slides to export
      const slidesToExport = exportAllSlides ? story.slides : [currentSlide].filter(Boolean);
      if (slidesToExport.length === 0) {
        throw new Error('No slides to export');
      }

      // Calculate total frames across all slides
      const totalDuration = slidesToExport.reduce((sum, slide) => sum + (slide.duration || 5), 0);
      const totalFrames = Math.ceil(totalDuration * fps);

      console.log(`WebCodecs Render: ${totalFrames} frames @ ${fps}fps, ${width}x${height}, ${bitrate / 1_000_000}Mbps`);
      console.log(`Exporting ${slidesToExport.length} slide(s)`);

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
      let globalFrameIndex = 0;

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
        bitrate,
        framerate: fps,
        hardwareAcceleration: 'prefer-hardware',
        latencyMode: 'quality',
      });

      setLoadingStatus('Capturing frames...');

      // Render all slides
      for (let slideIndex = 0; slideIndex < slidesToExport.length; slideIndex++) {
        const slide = slidesToExport[slideIndex];
        const slideDuration = slide.duration || 5;
        const slideFrames = Math.ceil(slideDuration * fps);

        // Update current slide for rendering
        if (exportAllSlides) {
          setCurrentSlideId(slide.id);
          // Wait for slide change to take effect
          await new Promise((r) => setTimeout(r, 100));
        }

        // Render frames for this slide
        for (let i = 0; i < slideFrames; i++) {
          // Update time relative to slide start
          const time = (i / fps) * 1000;
          
          // Use flushSync to ensure React updates the DOM immediately
          flushSync(() => {
            setRenderTime(time);
          });

          // Wait for browser to paint the updated DOM
          await new Promise((r) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setTimeout(r, 16); // ~1 frame at 60fps
              });
            });
          });

          // Capture frame
          try {
            const tempCanvas = await html2canvas(element, {
              canvas: offscreenCanvas,
              scale: 1,
              width,
              height,
              backgroundColor: slide.background.type === 'color' ? slide.background.value : '#ffffff',
              useCORS: true,
              logging: false,
              allowTaint: true,
            });

            // Create VideoFrame from canvas
            const videoFrame = new VideoFrame(tempCanvas, {
              timestamp: (globalFrameIndex * 1_000_000) / fps, // microseconds
              duration: 1_000_000 / fps,
            });

            // Encode frame (keyframe every 1 second)
            encoder.encode(videoFrame, { keyFrame: globalFrameIndex % fps === 0 });
            videoFrame.close();

            frameCount++;
            globalFrameIndex++;
            setRenderProgress(Math.round((globalFrameIndex / totalFrames) * 100));
            setLoadingStatus(
              exportAllSlides
                ? `Slide ${slideIndex + 1}/${slidesToExport.length} - Frame ${i + 1}/${slideFrames}`
                : `Encoding frame ${i + 1}/${slideFrames}`
            );
          } catch (err) {
            console.error(`Frame ${globalFrameIndex} failed:`, err);
            throw err;
          }
        }
      }

      // Flush encoder
      setLoadingStatus('Finalizing video...');
      await encoder.flush();
      encoder.close();

      // Finalize muxing
      muxer.finalize();
      const { buffer } = muxer.target;

      // Check if we need to add audio (only if includeAudio setting is true)
      const hasAudio = story.audio?.src || slidesToExport.some((slide) => slide.audio?.src);
      const audioSrc = story.audio?.src || slidesToExport.find((s) => s.audio?.src)?.audio?.src;

      console.log('[Audio Debug]', {
        includeAudio: settings.includeAudio,
        hasAudio,
        audioSrc,
        storyAudio: story.audio,
      });

      if (settings.includeAudio && hasAudio && audioSrc) {
        setLoadingStatus('Adding audio track...');
        console.log('[Audio] Starting audio processing...');

        try {
          // Use FFmpeg to mux audio with video
          const ffmpeg = ffmpegRef.current;

          // Load FFmpeg with timeout
          if (!ffmpeg.loaded) {
            setLoadingStatus('Loading audio encoder...');
            console.log('[Audio] Loading FFmpeg from CDN...');
            
            try {
              // Use CDN URLs for better compatibility
              const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
              
              const loadPromise = ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
              });

              // Timeout after 120 seconds for CDN
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('FFmpeg load timeout')), 120000)
              );

              await Promise.race([loadPromise, timeoutPromise]);
              console.log('[Audio] FFmpeg loaded successfully');
            } catch (loadErr) {
              console.error('[Audio] FFmpeg load failed:', loadErr);
              throw loadErr;
            }
          }

          setLoadingStatus('Processing audio...');

          // Write video to FFmpeg
          await ffmpeg.writeFile('video.mp4', new Uint8Array(buffer));

          // Fetch audio file with timeout - resolve URL for production
          const resolvedAudioSrc = resolveMediaUrl(audioSrc);
          const controller = new AbortController();
          const fetchTimeout = setTimeout(() => controller.abort(), 15000);

          const audioResponse = await fetch(resolvedAudioSrc, { signal: controller.signal });
          clearTimeout(fetchTimeout);

          const audioBlob = await audioResponse.blob();
          const audioBuffer = await audioBlob.arrayBuffer();
          const audioExt = audioSrc.split('.').pop()?.split('?')[0] || 'mp3';
          await ffmpeg.writeFile(`audio.${audioExt}`, new Uint8Array(audioBuffer));

          setLoadingStatus('Muxing audio and video...');

          // Mux video and audio with timeout
          const execPromise = ffmpeg.exec([
            '-i',
            'video.mp4',
            '-i',
            `audio.${audioExt}`,
            '-c:v',
            'copy',
            '-c:a',
            'aac',
            '-b:a',
            '128k',
            '-shortest',
            '-y',
            'output.mp4',
          ]);

          const execTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('FFmpeg exec timeout')), 60000)
          );

          await Promise.race([execPromise, execTimeout]);

          // Read the output
          const outputData = await ffmpeg.readFile('output.mp4');
          const outputBlob = new Blob([outputData as unknown as BlobPart], { type: 'video/mp4' });

          // Download
          setLoadingStatus('Downloading...');
          const url = URL.createObjectURL(outputBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${story.title.replace(/\s+/g, '-').toLowerCase()}_${resolution}.mp4`;
          a.click();
          URL.revokeObjectURL(url);

          // Cleanup
          try {
            await ffmpeg.deleteFile('video.mp4');
            await ffmpeg.deleteFile(`audio.${audioExt}`);
            await ffmpeg.deleteFile('output.mp4');
          } catch {
            // Ignore cleanup errors
          }

          console.log(`✅ Rendered ${frameCount} frames with audio successfully`);
          return;
        } catch (audioErr) {
          console.error('Failed to add audio, downloading video without audio:', audioErr);
          // Fall through to download video without audio
        }
      }

      setLoadingStatus('Downloading...');

      // Download video without audio
      const mp4Blob = new Blob([buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(mp4Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${story.title.replace(/\s+/g, '-').toLowerCase()}_${resolution}.mp4`;
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
  const handleRenderHighQualityFallback = async (settings: ExportSettings = exportSettings) => {
    try {
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

      // Use settings from export modal
      const { fps, resolution, exportAllSlides } = settings;
      const { width, height } = RESOLUTION_MAP[resolution];

      // Determine which slides to export
      const slidesToExport = exportAllSlides ? story.slides : [currentSlide].filter(Boolean);
      if (slidesToExport.length === 0) {
        throw new Error('No slides to export');
      }

      // Calculate total frames across all slides
      const totalDuration = slidesToExport.reduce((sum, slide) => sum + (slide.duration || 5), 0);
      const totalFrames = Math.ceil(totalDuration * fps);

      const element = document.getElementById('render-container');
      if (!element) throw new Error('Render container missing');

      let globalFrameIndex = 0;

      // Render all slides
      for (let slideIndex = 0; slideIndex < slidesToExport.length; slideIndex++) {
        const slide = slidesToExport[slideIndex];
        const slideDuration = slide.duration || 5;
        const slideFrames = Math.ceil(slideDuration * fps);

        // Update current slide for rendering
        if (exportAllSlides) {
          setCurrentSlideId(slide.id);
          await new Promise((r) => setTimeout(r, 100));
        }

        const canvasConfig = {
          scale: 1,
          width,
          height,
          backgroundColor: slide.background.type === 'color' ? slide.background.value : '#ffffff',
          useCORS: true,
          logging: false,
          allowTaint: true,
        };

        for (let i = 0; i < slideFrames; i++) {
          setLoadingStatus(
            exportAllSlides
              ? `Slide ${slideIndex + 1}/${slidesToExport.length} - Frame ${i + 1}/${slideFrames}`
              : `Rendering frame ${i + 1}/${slideFrames}`
          );
          const time = (i / fps) * 1000;
          
          // Use flushSync to ensure React updates the DOM immediately
          flushSync(() => {
            setRenderTime(time);
          });

          // Wait for browser to paint the updated DOM
          await new Promise((r) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(r);
            });
          });

          const canvas = await html2canvas(element, canvasConfig);
          const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.95));

          if (!blob) continue;

          const fileName = `frame-${String(globalFrameIndex).padStart(4, '0')}.jpg`;
          await ffmpeg.writeFile(fileName, await fetchFile(blob));
          globalFrameIndex++;
          setRenderProgress(Math.round((globalFrameIndex / totalFrames) * 100));
        }
      }

      setLoadingStatus('Encoding video...');

      // Check if we need to add audio (only if includeAudio setting is true)
      const hasAudio = story.audio?.src || slidesToExport.some((slide) => slide.audio?.src);
      const audioSrc = story.audio?.src || slidesToExport.find((s) => s.audio?.src)?.audio?.src;

      if (settings.includeAudio && hasAudio && audioSrc) {
        try {
          // Fetch audio file with timeout - resolve URL for production
          const resolvedAudioSrc = resolveMediaUrl(audioSrc);
          const controller = new AbortController();
          const fetchTimeout = setTimeout(() => controller.abort(), 15000);
          const audioResponse = await fetch(resolvedAudioSrc, { signal: controller.signal });
          clearTimeout(fetchTimeout);

          const audioBlob = await audioResponse.blob();
          const audioBuffer = await audioBlob.arrayBuffer();
          const audioExt = audioSrc.split('.').pop()?.split('?')[0] || 'mp3';
          await ffmpeg.writeFile(`audio.${audioExt}`, new Uint8Array(audioBuffer));

          // Encode video with audio
          await ffmpeg.exec([
            '-framerate',
            String(fps),
            '-i',
            'frame-%04d.jpg',
            '-i',
            `audio.${audioExt}`,
            '-c:v',
            'libx264',
            '-preset',
            'veryfast',
            '-crf',
            '23',
            '-pix_fmt',
            'yuv420p',
            '-c:a',
            'aac',
            '-shortest',
            '-vf',
            'scale=trunc(iw/2)*2:trunc(ih/2)*2',
            'output.mp4',
          ]);

          // Cleanup audio file
          await ffmpeg.deleteFile(`audio.${audioExt}`);
        } catch (audioErr) {
          console.error('Failed to add audio, encoding video only:', audioErr);
          // Fall back to video-only encoding
          await ffmpeg.exec([
            '-framerate',
            String(fps),
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
        }
      } else {
        // Encode video without audio
        await ffmpeg.exec([
          '-framerate',
          String(fps),
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
      }

      const data = await ffmpeg.readFile('output.mp4');
      const mp4Blob = new Blob([data as unknown as BlobPart], { type: 'video/mp4' });
      const url = URL.createObjectURL(mp4Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${story.title.replace(/\s+/g, '-').toLowerCase()}_${resolution}.mp4`;
      a.click();
      URL.revokeObjectURL(url);

      // Cleanup
      for (let i = 0; i < globalFrameIndex; i++) {
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
    setIsSaving(true);
    try {
      const isLocal =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.endsWith('.local'));

      if (isLocal) {
        // LOCAL: Save via API endpoint
        const res = await fetch('/admin/save-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(story),
        });

        if (!res.ok) throw new Error('Failed to save');

        const data = await res.json();
        setHasUnsavedChanges(false);
        alert(`Story saved to ${data.path}`);
      } else {
        // PRODUCTION: Save to GitHub
        const token = getGitHubToken();
        if (!token) {
          alert('Không tìm thấy GitHub token. Vui lòng đăng nhập lại.');
          return;
        }

        // Check for pending media and upload first
        const pendingMedia = getPendingMedia();
        if (pendingMedia.length > 0) {
          const confirmUpload = confirm(
            `Có ${pendingMedia.length} file media đang chờ upload lên GitHub.\n` +
              `Bao gồm: ${pendingMedia.map((m) => `${m.type} (${m.fileName})`).join(', ')}\n\n` +
              'Bạn có muốn upload trước khi lưu không?'
          );

          if (confirmUpload) {
            await uploadAllPendingMedia((current, total, fileName, type) => {
              console.log(`Uploading ${type} ${current}/${total}: ${fileName}`);
            });
            alert(`Đã upload ${pendingMedia.length} file media lên GitHub!`);
          }
        }

        // Generate MDX content and save to GitHub
        const sanitizedId = story.id.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
        const mdxContent = generateStoryMdx(story);
        const mdxPath = `${GITHUB_CONFIG.contentPaths.stories}/${sanitizedId}.mdx`;

        await saveToGitHub({
          path: mdxPath,
          content: mdxContent,
          message: `Update story: ${story.title}`,
          token,
        });

        console.log('Story saved to GitHub:', mdxPath);
        setHasUnsavedChanges(false);
        alert(`Story saved to GitHub: ${mdxPath}`);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save story: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Generate MDX content for story with proper frontmatter structure (matching save-story.ts)
  const generateStoryMdx = (storyData: Story): string => {
    // Build frontmatter object matching save-story.ts structure
    const frontmatter: Record<string, unknown> = {
      id: storyData.id,
      title: storyData.title,
      slides: storyData.slides,
    };

    if (storyData.description) {
      frontmatter.description = storyData.description;
    }

    if (storyData.thumbnail) {
      // Keep thumbnail path as-is (could be ~/assets/... or /src/assets/... or URL)
      frontmatter.thumbnail = storyData.thumbnail;
    }

    if (storyData.audio) {
      frontmatter.audio = storyData.audio;
    }

    if (storyData.settings) {
      frontmatter.settings = storyData.settings;
    }

    // Serialize to YAML frontmatter (same format as save-story.ts)
    const yamlString = Object.entries(frontmatter)
      .map(([key, value]) => {
        if (value === undefined) return '';
        return `${key}: ${JSON.stringify(value)}`;
      })
      .filter(Boolean)
      .join('\n');

    return `---
${yamlString}
---
`;
  };

  // Mobile-specific handlers
  const handleMobileBack = useCallback(() => {
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  const handleMobileMenuOpen = useCallback(() => {
    // Menu is handled by MobileHeader component
  }, []);

  const handleCanvasTap = useCallback((_position: { x: number; y: number }) => {
    // Show floating toolbar when canvas is tapped
    setShowFloatingToolbar(true);
    setSelectedElementIds([]);
    // Hide toolbar after 3 seconds
    setTimeout(() => setShowFloatingToolbar(false), 3000);
  }, []);

  const handleElementLongPress = useCallback((elementId: string, position: { x: number; y: number }) => {
    setContextMenuPosition(position);
    setSelectedElementIds([elementId]);
  }, []);

  const handleMobileElementSelect = useCallback((elementId: string) => {
    setSelectedElementIds([elementId]);
    // Show properties panel when element is selected on mobile
    if (isMobile) {
      setShowMobileProperties(true);
    }
  }, [isMobile]);

  const handleMobilePinchZoom = useCallback((elementId: string, scale: number) => {
    const element = currentSlide.elements.find(el => el.id === elementId);
    if (!element || element.locked) return;
    
    updateElement(elementId, {
      width: Math.max(20, element.style.width * scale),
      height: Math.max(20, element.style.height * scale),
    });
  }, [currentSlide.elements, updateElement]);

  const handleMobileRotate = useCallback((elementId: string, angle: number) => {
    const element = currentSlide.elements.find(el => el.id === elementId);
    if (!element || element.locked) return;
    
    updateElement(elementId, {
      rotation: (element.style.rotation || 0) + angle,
    });
  }, [currentSlide.elements, updateElement]);

  const handleSwipeLeft = useCallback(() => {
    // Navigate to next slide
    if (currentSlideIndex < story.slides.length - 1) {
      setCurrentSlideId(story.slides[currentSlideIndex + 1].id);
      setSelectedElementIds([]);
    }
  }, [currentSlideIndex, story.slides]);

  const handleSwipeRight = useCallback(() => {
    // Navigate to previous slide
    if (currentSlideIndex > 0) {
      setCurrentSlideId(story.slides[currentSlideIndex - 1].id);
      setSelectedElementIds([]);
    }
  }, [currentSlideIndex, story.slides]);

  const handleMobileTabChange = useCallback((tabId: string) => {
    setMobileActiveTab(tabId);
    if (tabId === 'settings') {
      setShowSettings(true);
    }
  }, []);

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
            position: 'fixed',
            left: 0,
            top: 0,
            width: `${RESOLUTION_MAP[exportSettings.resolution].width}px`,
            height: `${RESOLUTION_MAP[exportSettings.resolution].height}px`,
            overflow: 'hidden',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Scale container to match resolution */}
          <div
            id="render-container"
            className="relative bg-white"
            style={{
              width: '360px',
              height: '640px',
              transform: `scale(${RESOLUTION_MAP[exportSettings.resolution].width / 360})`,
              transformOrigin: 'top left',
            }}
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
                src={resolveMediaUrl(currentSlide.background.value)}
                className="absolute inset-0 w-full h-full object-cover"
                alt="bg"
              />
            )}

            {/* Elements - render with animation state based on renderTime */}
            {currentSlide.elements.map((el) => (
              <CanvasElement
                key={`${el.id}-${renderTime}`}
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

      {/* Mobile Layout */}
      {isMobile ? (
        <>
          {/* Mobile Header */}
          <MobileHeader
            title={story.title}
            onBack={handleMobileBack}
            onSave={handleSave}
            onMenuOpen={handleMobileMenuOpen}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            menuItems={mobileMenuItems}
          />

          {/* Mobile Canvas Area with SwipeNavigator */}
          <div className="flex-1 flex flex-col overflow-hidden relative" style={{ paddingBottom: isTimelineExpanded ? '200px' : '112px' }}>
            <SwipeNavigator
              currentIndex={currentSlideIndex}
              totalSlides={story.slides.length}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              enabled={selectedElementIds.length === 0}
            >
              <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                <TouchCanvas
                  slide={currentSlide}
                  selectedElementIds={selectedElementIds}
                  onElementSelect={handleMobileElementSelect}
                  onElementUpdate={(elementId, updates) => updateElement(elementId, updates)}
                  onPinchZoom={handleMobilePinchZoom}
                  onRotate={handleMobileRotate}
                  onLongPress={handleElementLongPress}
                  onDoubleTap={(elementId) => {
                    const element = currentSlide.elements.find(el => el.id === elementId);
                    if (element?.type === 'text') {
                      setShowMobileProperties(true);
                    }
                  }}
                  onCanvasTap={handleCanvasTap}
                  zoom={canvasState.zoom}
                  showGrid={canvasState.showGrid}
                  gridSize={canvasState.gridSize}
                  snapToGrid={canvasState.snapToGrid}
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
                      src={resolveMediaUrl(currentSlide.background.value)}
                      className="absolute inset-0 w-full h-full object-cover"
                      alt="slide-bg"
                    />
                  )}
                  {currentSlide.background.type === 'video' && (
                    <video
                      src={resolveMediaUrl(currentSlide.background.value)}
                      className="absolute inset-0 w-full h-full object-cover"
                      muted
                      loop
                      autoPlay
                    />
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
                          handleMobileElementSelect(element.id);
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
                </TouchCanvas>
              </div>
            </SwipeNavigator>

            {/* Floating Toolbar - shown on canvas tap */}
            {showFloatingToolbar && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-800 rounded-full px-4 py-2 shadow-lg border border-slate-700 z-20">
                <button
                  onClick={() => setShowMobileResources(true)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                  title="Add Element"
                >
                  <Plus size={20} />
                </button>
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={`p-2 rounded-full transition-colors ${!canUndo ? 'text-slate-600' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                  title="Undo"
                >
                  <Undo2 size={20} />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className={`p-2 rounded-full transition-colors ${!canRedo ? 'text-slate-600' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                  title="Redo"
                >
                  <Redo2 size={20} />
                </button>
              </div>
            )}

            {/* Context Menu on Long Press */}
            {_contextMenuPosition && selectedElementIds.length === 1 && (
              <>
                {/* Backdrop to close menu */}
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setContextMenuPosition(null)}
                />
                {/* Context Menu */}
                <div 
                  className="absolute z-40 bg-slate-800 rounded-xl shadow-xl border border-slate-700 py-2 min-w-[160px]"
                  style={{ 
                    left: Math.min(_contextMenuPosition.x, window.innerWidth - 180),
                    top: Math.min(_contextMenuPosition.y, window.innerHeight - 250),
                  }}
                >
                  <button
                    onClick={() => {
                      duplicateElement(selectedElementIds[0]);
                      setContextMenuPosition(null);
                    }}
                    className="w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-700 flex items-center gap-3"
                  >
                    <Copy size={18} /> Duplicate
                  </button>
                  <button
                    onClick={() => {
                      toggleElementLock(selectedElementIds[0]);
                      setContextMenuPosition(null);
                    }}
                    className="w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-700 flex items-center gap-3"
                  >
                    {currentSlide.elements.find(el => el.id === selectedElementIds[0])?.locked 
                      ? <><Layers size={18} /> Unlock</>
                      : <><Layers size={18} /> Lock</>
                    }
                  </button>
                  <button
                    onClick={() => {
                      // Bring to front
                      const maxZ = Math.max(...currentSlide.elements.map(el => el.style.zIndex || 0));
                      updateElement(selectedElementIds[0], { zIndex: maxZ + 1 });
                      setContextMenuPosition(null);
                    }}
                    className="w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-700 flex items-center gap-3"
                  >
                    <Layers size={18} /> Bring to Front
                  </button>
                  <div className="border-t border-slate-700 my-1" />
                  <button
                    onClick={() => {
                      deleteElement(selectedElementIds[0]);
                      setContextMenuPosition(null);
                    }}
                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-3"
                  >
                    <Trash2 size={18} /> Delete
                  </button>
                </div>
              </>
            )}

            {/* Floating Action Button for adding elements */}
            <FloatingActionButton
              icon={<Plus size={24} />}
              onClick={() => setShowMobileResources(true)}
              position="bottom-right"
              size="large"
            />
          </div>

          {/* Mobile Compact Timeline */}
          <CompactTimeline
            currentTime={currentTime}
            duration={currentSlide.duration || 5}
            isExpanded={isTimelineExpanded}
            onTimeChange={setCurrentTime}
            onToggleExpand={() => setIsTimelineExpanded(!isTimelineExpanded)}
            slides={story.slides}
            currentSlideIndex={currentSlideIndex}
            onSlideSelect={(index) => {
              setCurrentSlideId(story.slides[index].id);
              setSelectedElementIds([]);
            }}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
          />

          {/* Mobile Bottom Navigation */}
          <BottomNavBar
            tabs={mobileNavTabs}
            activeTab={mobileActiveTab}
            onTabChange={handleMobileTabChange}
          />

          {/* Mobile Resources Panel */}
          <MobileResourcesPanel
            isOpen={showMobileResources}
            onClose={() => setShowMobileResources(false)}
            onAddElement={addElement}
            onApplyTemplate={applyTemplate}
          />

          {/* Mobile Properties Panel */}
          <MobilePropertiesPanel
            isOpen={showMobileProperties}
            onClose={() => setShowMobileProperties(false)}
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
                setShowMobileProperties(false);
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
          />

          {/* Mobile Layers Panel (shown via BottomSheet when layers tab is active) */}
          <BottomSheet
            isOpen={mobileActiveTab === 'layers'}
            onClose={() => setMobileActiveTab('canvas')}
            title="Layers"
            snapPoints={[0.5, 0.8]}
            initialSnap={0}
          >
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
          </BottomSheet>
        </>
      ) : (
        <>
          {/* Desktop Header */}
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
              onClick={() => setShowExportModal(true)}
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
                    src={resolveMediaUrl(currentSlide.background.value)}
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="slide-bg"
                  />
                )}
                {currentSlide.background.type === 'video' && (
                  <video
                    src={resolveMediaUrl(currentSlide.background.value)}
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
                    <img src={resolveMediaUrl(story.thumbnail)} alt="Thumbnail preview" className="w-full h-full object-cover" />
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

      {/* Export Settings Modal */}
      <ExportSettingsModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={(settings) => {
          setExportSettings(settings);
          handleRenderHighQuality(settings);
        }}
        slideCount={story.slides.length}
        currentSlideIndex={currentSlideIndex}
      />

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
        </>
      )}
    </div>
  );
}

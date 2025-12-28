import { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from '~/hooks/useHistory';
import type {
  CanvasState,
  ElementStyle,
  ElementType,
  Story,
  StoryElement,
  StorySlide,
  StoryTemplate,
} from '../types';
import { DEFAULT_ELEMENT_STYLE, DEFAULT_SLIDE } from '../types';

// Initial story creator
export const createInitialStory = (): Story => ({
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
export const useAutoSave = (story: Story, interval = 30000) => {
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

  useEffect(() => {
    const saved = localStorage.getItem('story-builder-autosave');
    if (saved) {
      lastSaveRef.current = saved;
    }
  }, []);
};

export interface UseStoryBuilderProps {
  initialStory?: Story | null;
}

export function useStoryBuilder({ initialStory }: UseStoryBuilderProps) {
  // Story state with history
  const {
    state: story,
    setState: setStory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<Story>(initialStory || createInitialStory());

  // UI state
  const [currentSlideId, setCurrentSlideId] = useState<string>('');
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  // Current slide helpers
  const currentSlide = story.slides.find((s) => s.id === currentSlideId) || story.slides[0];
  const currentSlideIndex = story.slides.findIndex((s) => s.id === currentSlideId);
  const selectedElement =
    selectedElementIds.length === 1 ? currentSlide?.elements.find((e) => e.id === selectedElementIds[0]) : null;

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

                const styleKeys = [
                  'x', 'y', 'width', 'height', 'rotation', 'opacity', 'color', 'fontSize',
                  'fontFamily', 'fontWeight', 'textAlign', 'backgroundColor', 'borderRadius',
                  'blur', 'zIndex', 'gradient', 'boxShadow',
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

      // Support adding to a specific slide via extra.targetSlideId
      const targetSlideId = (extra?.targetSlideId as string) || currentSlideId;
      const targetSlide = story.slides.find(s => s.id === targetSlideId) || currentSlide;

      updateSlide(targetSlideId, {
        elements: [...targetSlide.elements, newElement],
      });

      setSelectedElementIds([newElement.id]);
      return newElement.id; // Return element ID for AI actions
    },
    [currentSlide, currentSlideId, story.slides, updateSlide]
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
      updateSlide(currentSlideId, {
        elements: currentSlide.elements.map((el) =>
          el.id === elementId ? { ...el, locked: !el.locked } : el
        ),
      });
    },
    [currentSlide.elements, currentSlideId, updateSlide]
  );

  // Toggle element visibility
  const toggleElementVisibility = useCallback(
    (elementId: string) => {
      updateSlide(currentSlideId, {
        elements: currentSlide.elements.map((el) =>
          el.id === elementId ? { ...el, visible: el.visible === false ? true : false } : el
        ),
      });
    },
    [currentSlide.elements, currentSlideId, updateSlide]
  );

  // Reorder elements
  const reorderElements = useCallback(
    (reorderedElements: StoryElement[]) => {
      updateSlide(currentSlideId, { elements: reorderedElements });
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
    return newSlide.id; // Return the new slide ID for AI actions
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

  return {
    // State
    story,
    setStory,
    currentSlide,
    currentSlideId,
    setCurrentSlideId,
    currentSlideIndex,
    selectedElementIds,
    setSelectedElementIds,
    selectedElement,
    canvasState,
    setCanvasState,
    hasUnsavedChanges,
    setHasUnsavedChanges,

    // History
    undo,
    redo,
    canUndo,
    canRedo,

    // Slide actions
    updateSlide,
    addSlide,
    deleteSlide,
    duplicateSlide,

    // Element actions
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    toggleElementLock,
    toggleElementVisibility,
    reorderElements,

    // Template
    applyTemplate,
  };
}

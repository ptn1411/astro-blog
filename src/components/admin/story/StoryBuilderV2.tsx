import {
  Download,
  Grid3X3,
  Layers,
  Music2,
  PanelLeft,
  Play,
  Redo2,
  Save,
  Settings,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from '~/hooks/useHistory';
import { getPendingMedia, uploadAllPendingMedia } from '~/utils/media';
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
  const [leftPanelTab, setLeftPanelTab] = useState<'resources' | 'layers' | 'audio'>('resources');
  const [animationTrigger, setAnimationTrigger] = useState(0); // For triggering animation preview

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

  // Current slide helper
  const currentSlide = story.slides.find((s) => s.id === currentSlideId) || story.slides[0];
  const currentSlideIndex = story.slides.findIndex((s) => s.id === currentSlideId);
  const selectedElement =
    selectedElementIds.length === 1 ? currentSlide?.elements.find((e) => e.id === selectedElementIds[0]) : null;

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
        } catch (error) {
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
              onClick={exportStory}
              className="p-1.5 text-slate-300 hover:bg-slate-600 hover:text-white rounded transition-colors"
              title="Export Story"
            >
              <Download size={16} />
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
    </div>
  );
}

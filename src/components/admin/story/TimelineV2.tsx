import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, Layers, LayoutGrid, MoreHorizontal, Pause, Play, Plus, Trash2 } from 'lucide-react';
import React, { useRef, useState } from 'react';
import type { StoryElement, StorySlide, TransitionType } from './types';
import { resolveMediaUrl } from '~/utils/mediaUrl';
interface TimelineProps {
  slides: StorySlide[];
  currentSlideId: string;
  onSelectSlide: (id: string) => void;
  onAddSlide: () => void;
  onReorderSlides: (slides: StorySlide[]) => void;
  onDeleteSlide?: (id: string) => void;
  onDuplicateSlide?: (id: string) => void;
  // Playback props
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  currentTime?: number;
  onSeek?: (time: number) => void;
  // Element Timeline props
  elements?: StoryElement[];
  onUpdateElement?: (id: string, updates: Partial<StoryElement>) => void;
  selectedElementIds?: string[];
  onSelectElement?: (id: string) => void;
}

interface SortableSlideProps {
  slide: StorySlide;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  totalSlides: number;
}

// Transition icon based on type
const TransitionIcon = ({ type }: { type?: TransitionType }) => {
  const icons: Record<TransitionType, string> = {
    none: '→',
    fade: '◐',
    slide: '▶',
    zoom: '⊕',
    flip: '↻',
    cube: '◇',
    dissolve: '◎',
    wipe: '▤',
  };
  return <span className="text-[10px]">{icons[type || 'none']}</span>;
};

const SortableSlide = ({
  slide,
  index,
  isActive,
  onSelect,
  onDelete,
  onDuplicate,
  totalSlides,
}: SortableSlideProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Get background style for thumbnail
  const getThumbnailBg = () => {
    if (slide.background.type === 'color') {
      return { backgroundColor: slide.background.value };
    }
    if (slide.background.type === 'gradient' && slide.background.gradient) {
      const { gradient } = slide.background;
      const colorStops = gradient.colors.map((c) => `${c.color} ${c.position}%`).join(', ');
      return {
        background:
          gradient.type === 'radial'
            ? `radial-gradient(circle, ${colorStops})`
            : `linear-gradient(${gradient.angle || 0}deg, ${colorStops})`,
      };
    }
    return {};
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative flex-shrink-0 group ${isDragging ? 'z-50' : ''}`}>
      {/* Slide thumbnail */}
      <div
        {...attributes}
        {...listeners}
        onClick={onSelect}
        className={`relative w-20 h-36 rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
          isActive
            ? 'border-blue-500 shadow-lg shadow-blue-500/20 scale-105'
            : 'border-slate-600 hover:border-slate-500'
        } ${isDragging ? 'opacity-50' : ''}`}
      >
        {/* Thumbnail Preview */}
        <div className="w-full h-full" style={getThumbnailBg()}>
          {slide.background.type === 'image' && (
            <img src={resolveMediaUrl(slide.background.value)} className="w-full h-full object-cover" alt="slide" draggable={false} />
          )}
          {slide.background.type === 'video' && (
            <video src={resolveMediaUrl(slide.background.value)} className="w-full h-full object-cover" muted />
          )}

          {/* Mini element previews */}
          {slide.elements.slice(0, 3).map((el) => (
            <div
              key={el.id}
              className="absolute bg-white/20 rounded"
              style={{
                left: `${(el.style.x / 360) * 100}%`,
                top: `${(el.style.y / 640) * 100}%`,
                width: `${(el.style.width / 360) * 100}%`,
                height: `${(el.style.height / 640) * 100}%`,
                transform: `rotate(${el.style.rotation || 0}deg) scale(0.95)`,
              }}
            />
          ))}
        </div>

        {/* Slide number */}
        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white font-medium">
          {index + 1}
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white font-mono">
          {slide.duration}s
        </div>

        {/* Transition indicator */}
        {slide.transition?.type && slide.transition.type !== 'none' && (
          <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-purple-500/80 rounded text-white">
            <TransitionIcon type={slide.transition.type} />
          </div>
        )}

        {/* Elements count */}
        {slide.elements.length > 0 && (
          <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-blue-500/80 rounded text-[10px] text-white">
            {slide.elements.length}
          </div>
        )}
      </div>

      {/* Hover actions */}
      <div
        className={`absolute -top-2 -right-2 transition-opacity ${
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 bg-slate-700 hover:bg-slate-600 rounded-full shadow-lg border border-slate-600"
        >
          <MoreHorizontal size={12} className="text-white" />
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-6 z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 min-w-[120px]">
              <button
                onClick={() => {
                  onDuplicate?.();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2"
              >
                <Copy size={12} /> Duplicate
              </button>
              {totalSlides > 1 && (
                <button
                  onClick={() => {
                    onDelete?.();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-slate-700 flex items-center gap-2"
                >
                  <Trash2 size={12} /> Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- ELEMENT TIMELINE COMPONENTS ---

const ElementTrack = ({
  element,
  duration,
  isSelected,
  onUpdate,
  onSelect,
}: {
  element: StoryElement;
  duration: number;
  isSelected: boolean;
  onUpdate: (updates: Partial<StoryElement>) => void;
  onSelect: () => void;
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const startDragRef = useRef<{ start: number; duration: number; x: number } | null>(null);
  const [isDragging, setIsDragging] = useState<'move' | 'left' | 'right' | null>(null);

  // Default to full duration if no timings set
  const elStart = element.timings?.start ?? 0;
  const elDuration = element.timings?.duration ?? duration * 1000;

  const leftPercent = (elStart / (duration * 1000)) * 100;
  const widthPercent = (elDuration / (duration * 1000)) * 100;

  const handlePointerDown = (e: React.PointerEvent, type: 'move' | 'left' | 'right') => {
    e.stopPropagation();
    onSelect();
    setIsDragging(type);
    startDragRef.current = { start: elStart, duration: elDuration, x: e.clientX };

    const handlePointerMove = (ev: PointerEvent) => {
      if (!startDragRef.current || !trackRef.current) return;

      const trackWidth = trackRef.current.parentElement?.clientWidth || 1;
      const msPerPx = (duration * 1000) / trackWidth;
      const deltaPx = ev.clientX - startDragRef.current.x;
      const deltaMs = deltaPx * msPerPx;

      let newStart = startDragRef.current.start;
      let newDuration = startDragRef.current.duration;

      if (type === 'move') {
        newStart = Math.max(0, Math.min(duration * 1000 - newDuration, startDragRef.current.start + deltaMs));
      } else if (type === 'left') {
        const potentialStart = Math.max(0, startDragRef.current.start + deltaMs);
        const potentialEnd = startDragRef.current.start + startDragRef.current.duration; // Anchor end
        // Limit start not to exceed end (min duration 100ms)
        if (potentialEnd - potentialStart >= 100) {
          newStart = potentialStart;
          newDuration = potentialEnd - potentialStart;
        }
      } else if (type === 'right') {
        const potentialDuration = Math.max(100, startDragRef.current.duration + deltaMs);
        // Limit end not to exceed slide duration
        if (newStart + potentialDuration <= duration * 1000) {
          newDuration = potentialDuration;
        } else {
          newDuration = duration * 1000 - newStart;
        }
      }

      onUpdate({
        timings: {
          start: Math.round(newStart),
          duration: Math.round(newDuration),
        },
      });
    };

    const handlePointerUp = () => {
      setIsDragging(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div className="h-8 flex items-center mb-1 group" onClick={onSelect}>
      {/* Element Name / Icon */}
      <div
        className={`w-32 flex-shrink-0 flex items-center gap-2 px-2 text-xs truncate ${isSelected ? 'text-blue-400 font-medium' : 'text-slate-400'}`}
      >
        <div className="w-4 flex justify-center text-[10px] opacity-70">
          {element.type === 'text' ? 'T' : element.type === 'image' ? 'IMG' : element.type === 'shape' ? 'SHP' : 'EL'}
        </div>
        <span className="truncate">
          {element.type} - {element.id.slice(-4)}
        </span>
      </div>

      {/* Track */}
      <div className="flex-1 relative h-6 bg-slate-800/50 rounded overflow-hidden" ref={trackRef}>
        {/* Grid lines (optional visual aid) */}

        {/* The Bar */}
        <div
          className={`absolute top-0.5 bottom-0.5 rounded cursor-pointer group/bar ${isSelected ? 'bg-blue-600' : 'bg-slate-600 hover:bg-slate-500'}`}
          style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
          onPointerDown={(e) => handlePointerDown(e, 'move')}
        >
          {/* ID Label inside bar if wide enough */}
          {widthPercent > 10 && (
            <div className="absolute inset-0 flex items-center pl-2 text-[9px] text-white/90 overflow-hidden whitespace-nowrap select-none pointer-events-none">
              {element.content?.slice(0, 10)}
            </div>
          )}

          {/* Handles */}
          <div
            className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize hover:bg-white/20 active:bg-white/40"
            onPointerDown={(e) => handlePointerDown(e, 'left')}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize hover:bg-white/20 active:bg-white/40"
            onPointerDown={(e) => handlePointerDown(e, 'right')}
          />
        </div>
      </div>
    </div>
  );
};

export const TimelineV2: React.FC<TimelineProps> = ({
  slides,
  currentSlideId,
  onSelectSlide,
  onAddSlide,
  onReorderSlides,
  onDeleteSlide,
  onDuplicateSlide,
  isPlaying = false,
  onTogglePlay,
  currentTime = 0,
  onSeek,
  elements = [],
  onUpdateElement,
  selectedElementIds = [],
  onSelectElement,
}) => {
  const [viewMode, setViewMode] = useState<'slides' | 'elements'>('slides');
  const scrollRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);
      onReorderSlides(arrayMove(slides, oldIndex, newIndex));
    }
  };

  // Calculate total duration for slide view
  const totalDuration = slides.reduce((acc, s) => acc + s.duration, 0);

  // Current Slide for elements view
  const currentSlide = slides.find((s) => s.id === currentSlideId);
  const slideDurationMs = (currentSlide?.duration || 5) * 1000;

  // Handle timeline scrubbing
  const handleTimelineScrub = (e: React.MouseEvent) => {
    if (!onSeek || !scrollRef.current) return;
    const rect = scrollRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 128; // 128px offset for name col
    const width = rect.width - 128;
    if (width <= 0) return;

    const percentage = Math.max(0, Math.min(1, x / width));
    onSeek(percentage * slideDurationMs);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-t border-slate-700">
      {/* Timeline header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 h-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <div className="flex bg-slate-800 rounded p-0.5 mr-2">
            <button
              onClick={() => setViewMode('slides')}
              className={`p-1 rounded ${viewMode === 'slides' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Slides View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('elements')}
              className={`p-1 rounded ${viewMode === 'elements' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Timeline View"
            >
              <Layers size={14} />
            </button>
          </div>

          <span className="text-xs font-medium text-slate-400 border-r border-slate-700 pr-3 mr-1">
            {viewMode === 'slides' ? `${slides.length} Slides` : 'Timeline'}
          </span>

          {currentSlide && viewMode === 'elements' && (
            <div className="flex items-center gap-2">
              <button
                onClick={onTogglePlay}
                className="p-1 rounded-full bg-slate-700 hover:bg-blue-600 hover:text-white transition-colors"
              >
                {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
              </button>
              <span className="text-xs font-mono text-blue-400 w-24">
                {(currentTime / 1000).toFixed(1)}s / {currentSlide.duration}s
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* VIEW: SLIDES */}
        {viewMode === 'slides' && (
          <div className="h-full flex items-center px-4 pt-9 gap-3 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={slides.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
                {slides.map((slide, index) => (
                  <React.Fragment key={slide.id}>
                    <SortableSlide
                      slide={slide}
                      index={index}
                      isActive={slide.id === currentSlideId}
                      onSelect={() => onSelectSlide(slide.id)}
                      onDelete={() => onDeleteSlide?.(slide.id)}
                      onDuplicate={() => onDuplicateSlide?.(slide.id)}
                      totalSlides={slides.length}
                    />
                    {/* Transition connector */}
                    {index < slides.length - 1 && (
                      <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1">
                        <div className="w-6 h-px bg-slate-600" />
                        <div className="text-[10px] text-slate-500">
                          <TransitionIcon type={slides[index + 1].transition?.type} />
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </SortableContext>
            </DndContext>

            {/* Add slide button */}
            <button
              onClick={onAddSlide}
              className="flex-shrink-0 w-20 h-36 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:text-blue-400 hover:border-blue-400/50 hover:bg-slate-700/30 transition-all"
            >
              <Plus size={20} />
              <span className="text-[10px] font-medium mt-1">Add Slide</span>
            </button>
          </div>
        )}

        {/* VIEW: ELEMENTS TIMELINE */}
        {viewMode === 'elements' && currentSlide && (
          <div className="h-full flex flex-col">
            {/* Time Ruler */}
            <div
              className="h-6 flex items-end border-b border-slate-700 select-none cursor-pointer hover:bg-slate-800/50"
              onClick={handleTimelineScrub}
              ref={scrollRef}
            >
              <div className="w-32 flex-shrink-0 border-r border-slate-700 bg-slate-900 z-10"></div>
              <div className="flex-1 relative h-full">
                {/* Ruler marks - Simplified for now */}
                {Array.from({ length: currentSlide.duration + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute bottom-0 text-[9px] text-slate-500 pl-1 border-l border-slate-600 h-3"
                    style={{ left: `${(i / currentSlide.duration) * 100}%` }}
                  >
                    {i}s
                  </div>
                ))}

                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
                  style={{ left: `${(currentTime / slideDurationMs) * 100}%` }}
                >
                  <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Tracks Container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
              {elements.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  No elements in this slide. Add elements to see timeline tracks.
                </div>
              ) : (
                elements
                  .slice()
                  .reverse()
                  .map((el) => (
                    <ElementTrack
                      key={el.id}
                      element={el}
                      duration={currentSlide.duration}
                      isSelected={selectedElementIds.includes(el.id)}
                      onUpdate={(updates) => onUpdateElement?.(el.id, updates)}
                      onSelect={() => onSelectElement?.(el.id)}
                    />
                  ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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
import { Copy, MoreHorizontal, Play, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import type { StorySlide, TransitionType } from './types';

interface TimelineProps {
  slides: StorySlide[];
  currentSlideId: string;
  onSelectSlide: (id: string) => void;
  onAddSlide: () => void;
  onReorderSlides: (slides: StorySlide[]) => void;
  onDeleteSlide?: (id: string) => void;
  onDuplicateSlide?: (id: string) => void;
  onUpdateSlide?: (id: string, updates: Partial<StorySlide>) => void;
  isPlaying?: boolean;
  currentTime?: number;
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
            <img src={slide.background.value} className="w-full h-full object-cover" alt="slide" draggable={false} />
          )}
          {slide.background.type === 'video' && (
            <video src={slide.background.value} className="w-full h-full object-cover" muted />
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

export const TimelineV2: React.FC<TimelineProps> = ({
  slides,
  currentSlideId,
  onSelectSlide,
  onAddSlide,
  onReorderSlides,
  onDeleteSlide,
  onDuplicateSlide,
  isPlaying = false,
  currentTime = 0,
}) => {
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

  // Calculate total duration
  const totalDuration = slides.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="h-full flex flex-col bg-slate-800">
      {/* Timeline header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-slate-400">
            {slides.length} Slide{slides.length !== 1 ? 's' : ''} • {totalDuration}s total
          </span>
        </div>
        {isPlaying && (
          <div className="flex items-center gap-2 text-green-400">
            <Play size={12} fill="currentColor" />
            <span className="text-xs font-mono">
              {currentTime.toFixed(1)}s / {totalDuration}s
            </span>
          </div>
        )}
      </div>

      {/* Timeline content */}
      <div className="flex-1 flex items-center px-4 gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
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

      {/* Progress bar (when playing) */}
      {isPlaying && (
        <div className="h-1 bg-slate-700">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
            style={{ width: `${(currentTime / totalDuration) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};

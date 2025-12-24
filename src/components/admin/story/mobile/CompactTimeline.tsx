import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ChevronUp, ChevronDown, Play, Pause } from 'lucide-react';
import { useGestureRecognizer } from '../../../../hooks/useGestureRecognizer';
import type { StorySlide } from '../types';

/**
 * CompactTimeline Component - Mobile-friendly timeline for story editing
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 * 
 * Features:
 * - Compact bar view at bottom (6.1)
 * - Expand/collapse functionality (6.2)
 * - Horizontal swipe for time scrubbing (6.3)
 * - Simplified interface with preset durations (6.4)
 * - Horizontal scrollable slide thumbnails (6.5)
 */

export interface CompactTimelineProps {
  /** Current playback time in milliseconds */
  currentTime: number;
  /** Total duration of current slide in seconds */
  duration: number;
  /** Whether the timeline is expanded */
  isExpanded: boolean;
  /** Callback when time changes (time in ms) */
  onTimeChange: (time: number) => void;
  /** Callback to toggle expand/collapse */
  onToggleExpand: () => void;
  /** Array of all slides */
  slides: StorySlide[];
  /** Current slide index (0-based) */
  currentSlideIndex: number;
  /** Callback when a slide is selected */
  onSlideSelect: (index: number) => void;
  /** Whether playback is active */
  isPlaying?: boolean;
  /** Callback to toggle play/pause */
  onTogglePlay?: () => void;
}

/** Preset duration options for mobile (in seconds) */
const PRESET_DURATIONS = [3, 5, 7, 10, 15];

/** Compact bar height in pixels */
const COMPACT_HEIGHT = 56;

/** Expanded height in pixels */
const EXPANDED_HEIGHT = 200;

/** Thumbnail size in pixels */
const THUMBNAIL_SIZE = 48;

/**
 * Calculate time from swipe distance
 * Property 7: Timeline Swipe Scrubbing
 * For any horizontal swipe with distance D pixels, the current time SHALL change proportionally:
 * newTime = oldTime + (D / timelineWidth) * slideDuration
 */
export function calculateTimeFromSwipe(
  currentTime: number,
  swipeDistance: number,
  timelineWidth: number,
  slideDurationMs: number
): number {
  if (timelineWidth <= 0) return currentTime;
  
  const timeChange = (swipeDistance / timelineWidth) * slideDurationMs;
  const newTime = currentTime + timeChange;
  
  // Clamp to valid range [0, slideDuration]
  return Math.max(0, Math.min(slideDurationMs, newTime));
}

/**
 * Format time in seconds to display string (e.g., "2.5s")
 */
export function formatTime(timeMs: number): string {
  const seconds = timeMs / 1000;
  return `${seconds.toFixed(1)}s`;
}

/**
 * Get background style for slide thumbnail
 */
function getThumbnailStyle(slide: StorySlide): React.CSSProperties {
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
  if (slide.background.type === 'image') {
    return {
      backgroundImage: `url(${slide.background.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { backgroundColor: '#1f2937' };
}

export const CompactTimeline: React.FC<CompactTimelineProps> = ({
  currentTime,
  duration,
  isExpanded,
  onTimeChange,
  onToggleExpand,
  slides,
  currentSlideIndex,
  onSlideSelect,
  isPlaying = false,
  onTogglePlay,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);

  const slideDurationMs = duration * 1000;
  const progressPercent = slideDurationMs > 0 ? (currentTime / slideDurationMs) * 100 : 0;

  // Scroll to current slide thumbnail when slide changes
  useEffect(() => {
    if (thumbnailsRef.current && isExpanded) {
      const thumbnailWidth = THUMBNAIL_SIZE + 8; // thumbnail + gap
      const scrollPosition = currentSlideIndex * thumbnailWidth - thumbnailsRef.current.offsetWidth / 2 + thumbnailWidth / 2;
      thumbnailsRef.current.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth',
      });
    }
  }, [currentSlideIndex, isExpanded]);

  // Handle scrubber drag start
  const handleScrubStart = useCallback(
    (clientX: number) => {
      setIsDragging(true);
      setDragStartTime(currentTime);
      setDragStartX(clientX);
    },
    [currentTime]
  );

  // Handle scrubber drag move
  const handleScrubMove = useCallback(
    (clientX: number) => {
      if (!isDragging || !scrubberRef.current) return;

      const scrubberWidth = scrubberRef.current.offsetWidth;
      const deltaX = clientX - dragStartX;
      
      const newTime = calculateTimeFromSwipe(
        dragStartTime,
        deltaX,
        scrubberWidth,
        slideDurationMs
      );
      
      onTimeChange(newTime);
    },
    [isDragging, dragStartX, dragStartTime, slideDurationMs, onTimeChange]
  );

  // Handle scrubber drag end
  const handleScrubEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for scrubber
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleScrubStart(e.touches[0].clientX);
    },
    [handleScrubStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleScrubMove(e.touches[0].clientX);
    },
    [handleScrubMove]
  );

  const handleTouchEnd = useCallback(() => {
    handleScrubEnd();
  }, [handleScrubEnd]);

  // Mouse handlers for desktop testing
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleScrubStart(e.clientX);
    },
    [handleScrubStart]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleScrubMove(e.clientX);
    };

    const handleMouseUp = () => {
      handleScrubEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleScrubMove, handleScrubEnd]);

  // Handle direct tap on progress bar to seek
  const handleProgressBarClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!scrubberRef.current) return;

      const rect = scrubberRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * slideDurationMs;
      
      onTimeChange(newTime);
    },
    [slideDurationMs, onTimeChange]
  );

  // Use gesture recognizer for swipe on expanded timeline
  useGestureRecognizer(
    timelineRef,
    {
      onSwipe: (direction, _velocity) => {
        if (direction === 'left' && currentSlideIndex < slides.length - 1) {
          onSlideSelect(currentSlideIndex + 1);
        } else if (direction === 'right' && currentSlideIndex > 0) {
          onSlideSelect(currentSlideIndex - 1);
        }
      },
    },
    isExpanded
  );

  return (
    <div
      ref={timelineRef}
      className={`fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 transition-all duration-300 ease-out z-40 ${
        isDragging ? '' : 'transition-height'
      }`}
      style={{
        height: isExpanded ? EXPANDED_HEIGHT : COMPACT_HEIGHT,
      }}
    >
      {/* Compact View - Always visible */}
      <div className="h-14 flex items-center px-3 gap-3">
        {/* Play/Pause Button */}
        {onTogglePlay && (
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={18} className="text-white" fill="currentColor" />
            ) : (
              <Play size={18} className="text-white ml-0.5" fill="currentColor" />
            )}
          </button>
        )}

        {/* Progress Bar / Scrubber */}
        <div
          ref={scrubberRef}
          className="flex-1 h-8 flex items-center cursor-pointer touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onClick={handleProgressBarClick}
        >
          <div className="w-full h-2 bg-slate-700 rounded-full relative overflow-hidden">
            {/* Progress fill */}
            <div
              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-none"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Scrubber handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-blue-500 transition-none"
              style={{ left: `calc(${progressPercent}% - 8px)` }}
            />
          </div>
        </div>

        {/* Time Display */}
        <div className="text-xs font-mono text-slate-400 w-16 text-right">
          {formatTime(currentTime)} / {duration}s
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={onToggleExpand}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-800 active:bg-slate-700 transition-colors"
          aria-label={isExpanded ? 'Collapse timeline' : 'Expand timeline'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronDown size={20} className="text-slate-400" />
          ) : (
            <ChevronUp size={20} className="text-slate-400" />
          )}
        </button>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Slide Thumbnails - Horizontal Scrollable */}
          <div className="relative">
            <div
              ref={thumbnailsRef}
              className="flex gap-2 overflow-x-auto scrollbar-none pb-2 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => onSlideSelect(index)}
                  className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all snap-center ${
                    index === currentSlideIndex
                      ? 'border-blue-500 ring-2 ring-blue-500/30 scale-105'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  style={{
                    width: THUMBNAIL_SIZE,
                    height: THUMBNAIL_SIZE * 1.5,
                  }}
                  aria-label={`Slide ${index + 1}`}
                  aria-current={index === currentSlideIndex ? 'true' : undefined}
                >
                  <div
                    className="w-full h-full relative"
                    style={getThumbnailStyle(slide)}
                  >
                    {/* Slide number badge */}
                    <div className="absolute top-1 left-1 px-1 py-0.5 bg-black/60 rounded text-[9px] text-white font-medium">
                      {index + 1}
                    </div>
                    {/* Duration badge */}
                    <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/60 rounded text-[9px] text-white font-mono">
                      {slide.duration}s
                    </div>
                    {/* Elements count */}
                    {slide.elements.length > 0 && (
                      <div className="absolute top-1 right-1 px-1 py-0.5 bg-blue-500/80 rounded text-[9px] text-white">
                        {slide.elements.length}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration Presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 mr-1">Duration:</span>
            <div className="flex gap-1.5 flex-wrap">
              {PRESET_DURATIONS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    // This would typically update the slide duration
                    // For now, we just show the UI
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    duration === preset
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {preset}s
                </button>
              ))}
            </div>
          </div>

          {/* Slide Info */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Slide {currentSlideIndex + 1} of {slides.length}
            </span>
            <span>
              {slides[currentSlideIndex]?.elements.length || 0} elements
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactTimeline;

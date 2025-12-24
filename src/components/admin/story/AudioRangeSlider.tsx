import { Pause, Play } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { resolveMediaUrl } from '~/utils/mediaUrl';

interface AudioRangeSliderProps {
  src: string;
  startTime: number;
  endTime?: number;
  onStartTimeChange: (time: number) => void;
  onEndTimeChange: (time: number) => void;
  onDurationLoad?: (duration: number) => void;
}

export const AudioRangeSlider: React.FC<AudioRangeSliderProps> = ({
  src,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  onDurationLoad,
}) => {
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const resolvedSrc = resolveMediaUrl(src);

  // Load audio duration
  useEffect(() => {
    const audio = new Audio(resolvedSrc);
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      onDurationLoad?.(audio.duration);
      if (!endTime || endTime > audio.duration) {
        onEndTimeChange(audio.duration);
      }
    });
    audio.addEventListener('error', () => {
      console.error('Failed to load audio:', resolvedSrc);
    });
    audioRef.current = audio;

    return () => {
      audio.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [resolvedSrc]);

  // Update playback position
  const updatePlaybackPosition = useCallback(() => {
    if (audioRef.current && isPlaying) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);

      // Stop at end time
      const actualEndTime = endTime || duration;
      if (time >= actualEndTime) {
        audioRef.current.pause();
        audioRef.current.currentTime = startTime;
        setCurrentTime(startTime);
        setIsPlaying(false);
      } else {
        animationRef.current = requestAnimationFrame(updatePlaybackPosition);
      }
    }
  }, [isPlaying, startTime, endTime, duration]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updatePlaybackPosition);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, updatePlaybackPosition]);

  // Toggle play/pause
  const togglePlay = async () => {
    if (!audioRef.current || duration === 0) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = startTime;
      setCurrentTime(startTime);
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        // Browser blocked autoplay - user needs to interact first
        console.log('Playback requires user interaction');
        setIsPlaying(false);
      }
    }
  };

  // Format time
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate position from time
  const getPositionFromTime = (time: number): number => {
    if (duration === 0) return 0;
    return (time / duration) * 100;
  };

  // Calculate time from mouse position
  const getTimeFromPosition = (clientX: number): number => {
    if (!sliderRef.current || duration === 0) return 0;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return percentage * duration;
  };

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent, type: 'start' | 'end') => {
    e.preventDefault();
    if (type === 'start') {
      setIsDraggingStart(true);
    } else {
      setIsDraggingEnd(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingStart && !isDraggingEnd) return;

      const time = getTimeFromPosition(e.clientX);
      const actualEndTime = endTime || duration;

      if (isDraggingStart) {
        // Don't let start go past end - 0.5s
        const maxStart = Math.max(0, actualEndTime - 0.5);
        const newStart = Math.max(0, Math.min(time, maxStart));
        onStartTimeChange(Math.round(newStart * 10) / 10);
      } else if (isDraggingEnd) {
        // Don't let end go before start + 0.5s
        const minEnd = Math.min(duration, startTime + 0.5);
        const newEnd = Math.max(minEnd, Math.min(time, duration));
        onEndTimeChange(Math.round(newEnd * 10) / 10);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
    };

    if (isDraggingStart || isDraggingEnd) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingStart, isDraggingEnd, startTime, endTime, duration, onStartTimeChange, onEndTimeChange]);

  const actualEndTime = endTime || duration;
  const startPos = getPositionFromTime(startTime);
  const endPos = getPositionFromTime(actualEndTime);
  const currentPos = getPositionFromTime(currentTime);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={togglePlay}
          disabled={duration === 0}
          className="p-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <span className="text-xs text-slate-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Range slider */}
      <div ref={sliderRef} className="relative h-10 bg-slate-900 rounded-lg overflow-hidden cursor-pointer select-none">
        {/* Waveform background (simplified) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-6 bg-slate-800 rounded flex items-center px-1">
            {/* Simplified waveform bars */}
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 mx-px bg-slate-600 rounded-sm"
                style={{
                  height: `${20 + Math.random() * 60}%`,
                  opacity: i >= (startPos / 100) * 50 && i <= (endPos / 100) * 50 ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        </div>

        {/* Selected range highlight */}
        <div
          className="absolute top-0 bottom-0 bg-blue-500/20 border-l-2 border-r-2 border-blue-500"
          style={{
            left: `${startPos}%`,
            width: `${endPos - startPos}%`,
          }}
        />

        {/* Current playback position */}
        {isPlaying && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-white z-20" style={{ left: `${currentPos}%` }} />
        )}

        {/* Start handle */}
        <div
          className={`absolute top-0 bottom-0 w-3 cursor-ew-resize z-10 flex items-center justify-center
            ${isDraggingStart ? 'bg-green-500' : 'bg-green-600 hover:bg-green-500'}`}
          style={{ left: `calc(${startPos}% - 6px)` }}
          onMouseDown={(e) => handleMouseDown(e, 'start')}
        >
          <div className="w-0.5 h-4 bg-white/50 rounded" />
        </div>

        {/* End handle */}
        <div
          className={`absolute top-0 bottom-0 w-3 cursor-ew-resize z-10 flex items-center justify-center
            ${isDraggingEnd ? 'bg-red-500' : 'bg-red-600 hover:bg-red-500'}`}
          style={{ left: `calc(${endPos}% - 6px)` }}
          onMouseDown={(e) => handleMouseDown(e, 'end')}
        >
          <div className="w-0.5 h-4 bg-white/50 rounded" />
        </div>
      </div>

      {/* Time inputs */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-xs text-green-400 block mb-1">Start Time</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={Math.max(0, actualEndTime - 0.5)}
              step={0.1}
              value={startTime}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onStartTimeChange(Math.max(0, Math.min(val, actualEndTime - 0.5)));
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
            />
            <span className="text-xs text-slate-500">s</span>
          </div>
        </div>
        <div className="flex-1">
          <label className="text-xs text-red-400 block mb-1">End Time</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={startTime + 0.5}
              max={duration}
              step={0.1}
              value={actualEndTime}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || duration;
                onEndTimeChange(Math.max(startTime + 0.5, Math.min(val, duration)));
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
            />
            <span className="text-xs text-slate-500">s</span>
          </div>
        </div>
      </div>

      {/* Duration info */}
      <div className="text-xs text-slate-500 text-center">
        Selected: {formatTime(actualEndTime - startTime)} of {formatTime(duration)}
      </div>
    </div>
  );
};

import { useEffect, useRef, useState } from 'react';
import type { StorySlide, Story } from '../types';

interface UseStoryPlaybackProps {
  currentSlide: StorySlide | undefined;
  story: Story;
  currentSlideId: string;
}

export function useStoryPlayback({ currentSlide, story, currentSlideId }: UseStoryPlaybackProps) {
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
  }, [isPlaying, currentSlide?.duration, story.settings?.loop, currentTime]);

  // Reset time when changing slides
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [currentSlideId]);

  return {
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    togglePlay: () => setIsPlaying(!isPlaying),
  };
}

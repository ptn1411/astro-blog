import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { Story } from '../../types';
import { StoryFeedItem } from './StoryFeedItem';

interface StoryFeedProps {
  stories: Story[];
}

type TransitionDirection = 'up' | 'down' | null;

const TRANSITION_DURATION = 450; // ms
const WHEEL_COOLDOWN = 600; // ms
const SWIPE_THRESHOLD = 50; // px

/**
 * Instagram/TikTok-style story feed with discrete transitions.
 * Renders only one story at a time — the current story animates out
 * while the next story animates in.
 */
export const StoryFeed = memo(function StoryFeed({ stories }: StoryFeedProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<TransitionDirection>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const wheelCooldownRef = useRef(false);
  const touchStartY = useRef(0);

  const goTo = useCallback(
    (nextIndex: number, dir: TransitionDirection) => {
      if (isTransitioning) return;
      if (nextIndex < 0 || nextIndex >= stories.length) return;
      if (nextIndex === activeIndex) return;

      setDirection(dir);
      setIsTransitioning(true);
      setShowEndScreen(false);

      setTimeout(() => {
        setActiveIndex(nextIndex);
        setDirection(null);
        setIsTransitioning(false);
      }, TRANSITION_DURATION);
    },
    [activeIndex, isTransitioning, stories.length]
  );

  const goNext = useCallback(() => {
    if (activeIndex >= stories.length - 1) {
      // Show end screen
      if (!showEndScreen && !isTransitioning) {
        setDirection('up');
        setIsTransitioning(true);
        setShowEndScreen(true);
        setTimeout(() => {
          setDirection(null);
          setIsTransitioning(false);
        }, TRANSITION_DURATION);
      }
      return;
    }
    goTo(activeIndex + 1, 'up');
  }, [activeIndex, stories.length, goTo, showEndScreen, isTransitioning]);

  const goPrev = useCallback(() => {
    if (showEndScreen) {
      setDirection('down');
      setIsTransitioning(true);
      setShowEndScreen(false);
      setTimeout(() => {
        setDirection(null);
        setIsTransitioning(false);
      }, TRANSITION_DURATION);
      return;
    }
    goTo(activeIndex - 1, 'down');
  }, [activeIndex, goTo, showEndScreen]);

  const goToFirst = useCallback(() => {
    setShowEndScreen(false);
    setDirection('down');
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(0);
      setDirection(null);
      setIsTransitioning(false);
    }, TRANSITION_DURATION);
  }, []);

  // Wheel navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelCooldownRef.current) return;
      wheelCooldownRef.current = true;

      if (e.deltaY > 0) goNext();
      else if (e.deltaY < 0) goPrev();

      setTimeout(() => {
        wheelCooldownRef.current = false;
      }, WHEEL_COOLDOWN);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [goNext, goPrev]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  // Touch swipe navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) < SWIPE_THRESHOLD) return;

      if (deltaY > 0)
        goNext(); // swipe up → next
      else goPrev(); // swipe down → prev
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goNext, goPrev]);

  // Animation classes
  const getAnimClass = (isLeaving: boolean): string => {
    if (!direction) return '';

    if (direction === 'up') {
      return isLeaving ? 'story-exit-up' : 'story-enter-up';
    }
    return isLeaving ? 'story-exit-down' : 'story-enter-down';
  };

  if (stories.length === 0) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-500"
          >
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="2" y1="7" x2="7" y2="7" />
            <line x1="2" y1="17" x2="7" y2="17" />
            <line x1="17" y1="7" x2="22" y2="7" />
            <line x1="17" y1="17" x2="22" y2="17" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">No Stories Yet</h2>
        <p className="text-slate-400 mb-6">Create stories with Story Builder to see them here.</p>
        <a
          href="/stories"
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-sm font-medium hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/25"
        >
          Browse Stories
        </a>
      </div>
    );
  }

  const currentStory = stories[activeIndex];

  return (
    <div ref={containerRef} className="h-screen w-full bg-black relative overflow-hidden select-none">
      {/* Current story (or end screen) */}
      {showEndScreen ? (
        <div key="end-screen" className={`absolute inset-0 z-20 ${direction ? getAnimClass(false) : ''}`}>
          <div className="h-full flex flex-col items-center justify-center bg-slate-950 text-white">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-400"
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Bạn đã xem hết!</h3>
              <p className="text-slate-400 mb-6 text-sm">Scroll lên để xem lại hoặc quay về danh sách</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={goToFirst}
                  className="px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-xl text-sm font-medium hover:bg-white/20 transition-all border border-white/10 cursor-pointer"
                >
                  Xem lại từ đầu
                </button>
                <a
                  href="/stories"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-sm font-medium hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/25"
                >
                  Danh sách Stories
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div key={`story-${activeIndex}`} className={`absolute inset-0 z-20 ${direction ? getAnimClass(false) : ''}`}>
          <StoryFeedItem
            story={currentStory}
            isActive={!isTransitioning}
            index={activeIndex}
            totalStories={stories.length}
            onClose={() => {
              if (window.history.length > 1) window.history.back();
              else window.location.href = '/stories';
            }}
          />
        </div>
      )}

      {/* Leaving story (animates out) */}
      {direction && (
        <div className={`absolute inset-0 z-10 ${getAnimClass(true)}`}>
          {/* Just a black backdrop behind the entering story */}
          <div className="h-full w-full bg-black" />
        </div>
      )}

      {/* Scroll hint – only on first story */}
      {activeIndex === 0 && !isTransitioning && !showEndScreen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 animate-bounce">
          <div className="flex flex-col items-center gap-1 text-white/50">
            <span className="text-xs font-medium">Scroll để xem tiếp</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      )}

      {/* Transition animations */}
      <style>{`
        @keyframes slideInUp {
          from { transform: translateY(100%); opacity: 0.3; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes slideOutUp {
          from { transform: translateY(0);    opacity: 1; }
          to   { transform: translateY(-100%); opacity: 0.3; }
        }
        @keyframes slideInDown {
          from { transform: translateY(-100%); opacity: 0.3; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes slideOutDown {
          from { transform: translateY(0);    opacity: 1; }
          to   { transform: translateY(100%); opacity: 0.3; }
        }

        .story-enter-up {
          animation: slideInUp ${TRANSITION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .story-exit-up {
          animation: slideOutUp ${TRANSITION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .story-enter-down {
          animation: slideInDown ${TRANSITION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .story-exit-down {
          animation: slideOutDown ${TRANSITION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </div>
  );
});

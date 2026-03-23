import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { Story } from '../../types';
import { StoryFeedItem } from './StoryFeedItem';

interface StoryFeedProps {
  stories: Story[];
}

/**
 * TikTok-style infinite scroll stories feed.
 * Uses CSS snap scroll for smooth navigation between stories.
 * IntersectionObserver auto-plays the visible story and pauses others.
 */
export const StoryFeed = memo(function StoryFeed({ stories }: StoryFeedProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const isScrollingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  // Create the observer only after the scroll container is mounted,
  // so `root` is never null.
  const setContainerRef = useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el;
    if (!el) {
      observerRef.current?.disconnect();
      observerRef.current = null;
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number(entry.target.getAttribute('data-story-index'));
            if (!isNaN(idx)) {
              setActiveIndex(idx);
            }
          }
        }
      },
      {
        root: el,
        threshold: [0.6, 0.8],
      }
    );

    // Re-observe any items already registered before the container mounted
    for (const item of itemRefs.current.values()) {
      observerRef.current.observe(item);
    }
  }, []);

  // Observe items when they mount
  const setItemRef = useCallback((index: number, el: HTMLElement | null) => {
    if (el) {
      itemRefs.current.set(index, el);
      observerRef.current?.observe(el);
    } else {
      const existing = itemRefs.current.get(index);
      if (existing) {
        observerRef.current?.unobserve(existing);
        itemRefs.current.delete(index);
      }
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        const next = Math.min(activeIndex + 1, stories.length - 1);
        scrollToIndex(next);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        const prev = Math.max(activeIndex - 1, 0);
        scrollToIndex(prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, stories.length]);

  const scrollToIndex = (index: number) => {
    const el = itemRefs.current.get(index);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Mouse wheel: snap to next/prev story with a cooldown to avoid multi-snap
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;

      if (e.deltaY > 0) {
        const next = Math.min(activeIndex + 1, stories.length - 1);
        scrollToIndex(next);
      } else if (e.deltaY < 0) {
        const prev = Math.max(activeIndex - 1, 0);
        scrollToIndex(prev);
      }

      setTimeout(() => {
        isScrollingRef.current = false;
      }, 700);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [activeIndex, stories.length]);

  if (stories.length === 0) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
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

  return (
    <div className="h-screen w-full bg-black relative">
      {/* Feed scroll container */}
      <div
        ref={setContainerRef}

        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehavior: 'none',
        }}
      >
        {stories.map((story, index) => (
          <div
            key={story.id || index}
            ref={(el) => setItemRef(index, el)}
            data-story-index={index}
          >
            <StoryFeedItem
              story={story}
              isActive={activeIndex === index}
              index={index}
              totalStories={stories.length}
            />
          </div>
        ))}

        {/* End of feed */}
        <div className="h-screen snap-start snap-always flex flex-col items-center justify-center bg-slate-950 text-white">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Bạn đã xem hết!</h3>
            <p className="text-slate-400 mb-6 text-sm">Scroll lên để xem lại hoặc quay về danh sách</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => scrollToIndex(0)}
                className="px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-xl text-sm font-medium hover:bg-white/20 transition-all border border-white/10"
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



      {/* Scroll hint – only on first story */}
      {activeIndex === 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-bounce">
          <div className="flex flex-col items-center gap-1 text-white/50">
            <span className="text-xs font-medium">Scroll để xem tiếp</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      )}

      {/* Hide scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
});

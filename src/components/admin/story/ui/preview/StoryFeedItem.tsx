import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { StoryPreviewV2 } from './StoryPreviewV2';
import type { Story } from '../../types';

interface StoryFeedItemProps {
  story: Story;
  isActive: boolean;
  index: number;
  totalStories: number;
  onInfoClick?: (story: Story) => void;
}

/**
 * Individual story item in the TikTok-style feed.
 * Renders using StoryPreviewV2 when active.
 * Shows a static thumbnail/background when inactive for performance.
 */
export const StoryFeedItem = memo(function StoryFeedItem({
  story,
  isActive,
  index,
  totalStories,
  onInfoClick,
}: StoryFeedItemProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [liked, setLiked] = useState(false);

  // Delay mount of the heavy preview component slightly after becoming active
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => setShowPreview(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowPreview(false);
    }
  }, [isActive]);

  const handleClose = useCallback(() => {
    // In feed mode, closing just pauses (no navigation)
  }, []);

  // Get first slide background for the static thumbnail
  const firstSlide = story.slides?.[0];
  const getStaticBg = (): React.CSSProperties => {
    if (!firstSlide) return { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' };

    const bg = firstSlide.background;
    if (bg.type === 'color') return { backgroundColor: bg.value };
    if (bg.type === 'gradient' && bg.gradient) {
      const colors = bg.gradient.colors.map((c) => `${c.color} ${c.position}%`).join(', ');
      const angle = bg.gradient.angle || 135;
      return { background: `linear-gradient(${angle}deg, ${colors})` };
    }
    if (bg.type === 'image' && bg.value) {
      return {
        backgroundImage: `url(${bg.value})`,
        backgroundSize: bg.size || 'cover',
        backgroundPosition: bg.position || 'center',
      };
    }
    return { background: 'linear-gradient(135deg, #0f172a, #1e293b)' };
  };

  return (
    <div
      className="relative h-screen w-full snap-start snap-always flex items-center justify-center bg-black"
      data-story-index={index}
    >
      {/* Story Content */}
      <div className="relative w-full h-full max-w-[480px] mx-auto overflow-hidden">
        {showPreview && isActive ? (
          /* Full interactive preview when active */
          <StoryPreviewV2 story={story} onClose={handleClose} />
        ) : (
          /* Static thumbnail when inactive */
          <div className="w-full h-full flex items-center justify-center" style={getStaticBg()}>
            {/* Overlay for text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

            {/* Play indicator */}
            <div className="relative z-10 p-5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Bottom overlay – always visible */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-30 pointer-events-none">
          <div className="pointer-events-auto">
            <h3 className="text-white text-lg font-bold mb-1 drop-shadow-lg line-clamp-2">
              {story.title || 'Untitled Story'}
            </h3>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <span>{story.slides?.length || 0} slides</span>
              {story.description && (
                <>
                  <span>•</span>
                  <span className="line-clamp-1">{story.description}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side action bar */}
        <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-30">
          {/* Like */}
          <button
            onClick={() => setLiked(!liked)}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className={`p-3 rounded-full backdrop-blur-md border transition-all duration-300 ${
              liked
                ? 'bg-red-500/30 border-red-400/50 shadow-lg shadow-red-500/20'
                : 'bg-white/10 border-white/20 hover:bg-white/20'
            }`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill={liked ? '#ef4444' : 'none'} stroke={liked ? '#ef4444' : 'white'} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <span className="text-white text-xs font-medium drop-shadow">{liked ? 'Liked' : 'Like'}</span>
          </button>

          {/* Share */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: story.title,
                  url: `/stories/${story.id}`,
                });
              } else {
                navigator.clipboard.writeText(window.location.origin + `/stories/${story.id}`);
              }
            }}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <span className="text-white text-xs font-medium drop-shadow">Share</span>
          </button>

          {/* Open */}
          <a
            href={`/stories/${story.id}`}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </div>
            <span className="text-white text-xs font-medium drop-shadow">Open</span>
          </a>
        </div>

        {/* Story counter */}
        <div className="absolute top-4 right-4 z-30 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white text-xs font-medium">
          {index + 1} / {totalStories}
        </div>
      </div>
    </div>
  );
});

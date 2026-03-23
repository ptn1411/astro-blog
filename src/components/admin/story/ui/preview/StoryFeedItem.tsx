import { memo, useCallback, useEffect, useState } from 'react';
import { StoryPreviewV2 } from './StoryPreviewV2';
import type { Story } from '../../types';

interface StoryFeedItemProps {
  story: Story;
  isActive: boolean;
  index: number;
  totalStories: number;
  onClose?: () => void;
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
  onClose,
}: StoryFeedItemProps) {
  const [showPreview, setShowPreview] = useState(false);

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
    onClose?.();
  }, [onClose]);

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
      className="relative h-screen w-full flex items-center justify-center bg-black"
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
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



        {/* Story counter */}
        <div className="absolute top-4 right-4 z-30 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white text-xs font-medium">
          {index + 1} / {totalStories}
        </div>
      </div>
    </div>
  );
});

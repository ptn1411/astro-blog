import { memo, useCallback, useEffect, useRef } from 'react';
import { StoryPreviewV2 } from './StoryPreviewV2';
import type { Story } from '../../types';

type Props = {
  story: Story;
};

export  const ClientPreviewStories = memo(function ClientPreviewStories({ story }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // element is in the viewport - preload assets if needed
        }
      });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []); // Fixed: refs are stable, no need in dependency

  const handleClose = useCallback(() => {
    window.history.back();
  }, []);

  return (
    <div
      ref={containerRef}
      id="story-preview"
      style={{
        width: '100vw',
        height: '100vh',
      }}
    >
      <StoryPreviewV2 story={story} onClose={handleClose} />
    </div>
  );
});



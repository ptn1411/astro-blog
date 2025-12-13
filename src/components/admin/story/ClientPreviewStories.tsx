import { useEffect, useRef } from 'react';
import { StoryPreviewV2 } from './StoryPreviewV2';
import type { Story } from './types';

type Props = {
  story: Story;
};

export default function ClientPreviewStories({ story }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // optional: side effects nếu cần
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
      <StoryPreviewV2 story={story} onClose={() => window.history.back()} />
    </div>
  );
}

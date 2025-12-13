import { useEffect, useState } from 'react';
import { PreviewRenderer } from './PreviewRenderer';
import type { BuilderBlock } from './types';

export default function ClientPreview() {
  const [blocks, setBlocks] = useState<BuilderBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBlocks = () => {
      try {
        const stored = localStorage.getItem('astro-builder-blocks');
        if (stored) {
          const data = JSON.parse(stored);
          const loadedBlocks = data.blocks || [];
          setBlocks(loadedBlocks);

          // Update page title if metadata exists
          if (data.metadata?.title) {
            document.title = data.metadata.title;
          }
        }
      } catch (e) {
        console.error('Failed to load blocks:', e);
      } finally {
        setLoading(false);
      }
    };

    // Load initial blocks
    loadBlocks();

    // Listen for postMessage from parent (Builder iframe)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PREVIEW_UPDATE') {
        const { blocks: newBlocks, metadata } = event.data.payload || {};
        if (Array.isArray(newBlocks)) {
          setBlocks(newBlocks);
          if (metadata?.title) {
            document.title = metadata.title;
          }
        }
      }
    };

    // Listen for storage events (cross-tab sync)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'astro-builder-blocks') {
        loadBlocks();
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  if (loading) {
    return <div className="p-10 text-center">Loading preview...</div>;
  }

  if (blocks.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-xl font-semibold mb-2">Preview Area</p>
        <p className="text-sm">Add widgets in the builder to see them here.</p>
      </div>
    );
  }

  return (
    <div className="preview-container">
      {blocks.map((block) => (
        <PreviewRenderer key={block.id} type={block.type} props={block.props} />
      ))}
    </div>
  );
}

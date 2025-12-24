import { useEffect, useState } from 'react';
import { PreviewRenderer } from './PreviewRenderer';
import { WIDGET_REGISTRY, type WidgetSchema } from './registry';
import type { BuilderBlock } from './types';

// Load custom widgets from localStorage
function loadCustomWidgets(): WidgetSchema[] {
  try {
    const stored = localStorage.getItem('astro-builder-custom-widgets');
    if (stored) {
      const data = JSON.parse(stored);
      return data.widgets || [];
    }
  } catch (e) {
    console.error('Failed to load custom widgets:', e);
  }
  return [];
}

export default function ClientPreview() {
  const [blocks, setBlocks] = useState<BuilderBlock[]>([]);
  const [customWidgets, setCustomWidgets] = useState<WidgetSchema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load custom widgets
    setCustomWidgets(loadCustomWidgets());
    
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
      if (e.key === 'astro-builder-custom-widgets') {
        setCustomWidgets(loadCustomWidgets());
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Get widget definition (built-in or custom)
  const getWidgetDef = (type: string): WidgetSchema | undefined => {
    // Check custom widgets first (they can override built-in)
    const customWidget = customWidgets.find(w => w.type === type);
    if (customWidget) return customWidget;
    
    // Fall back to built-in registry
    return WIDGET_REGISTRY.find(w => w.type === type);
  };

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
        <PreviewRenderer 
          key={block.id} 
          type={block.type} 
          props={block.props}
          widgetDef={getWidgetDef(block.type)}
        />
      ))}
    </div>
  );
}

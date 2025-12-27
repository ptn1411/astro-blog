import { useCallback, useEffect, useRef } from 'react';
import type { BuilderBlock, PageMetadata } from '../core/types';

const DEBOUNCE_MS = 300;

export function usePreviewSync(
  blocks: BuilderBlock[],
  metadata: PageMetadata,
  iframeRef: React.RefObject<HTMLIFrameElement | null>
): void {
  const iframeLoaded = useRef(false);
  const pendingUpdate = useRef<{ blocks: BuilderBlock[]; metadata: PageMetadata } | null>(null);
  const currentIframe = useRef<HTMLIFrameElement | null>(null);

  // Function to send update to iframe
  const sendUpdate = useCallback(
    (blocksToSend: BuilderBlock[], metadataToSend: PageMetadata) => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;

      try {
        // Also save to localStorage for persistence
        localStorage.setItem(
          'astro-builder-blocks',
          JSON.stringify({ blocks: blocksToSend, metadata: metadataToSend })
        );

        iframe.contentWindow.postMessage(
          {
            type: 'PREVIEW_UPDATE',
            payload: { blocks: blocksToSend, metadata: metadataToSend },
          },
          '*'
        );
      } catch (e) {
        console.warn('Failed to send preview update:', e);
      }
    },
    [iframeRef]
  );

  // Initialize iframe src and handle load events
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Reset state if iframe element changed
    if (currentIframe.current !== iframe) {
      currentIframe.current = iframe;
      iframeLoaded.current = false;
      pendingUpdate.current = null;
    }

    // Set src if not already set or empty
    if (!iframe.src || !iframe.src.includes('/admin/preview')) {
      iframe.src = '/admin/preview';
    }

    const handleLoad = () => {
      iframeLoaded.current = true;

      // Small delay to ensure iframe is fully ready
      setTimeout(() => {
        // Send pending update if exists
        if (pendingUpdate.current) {
          sendUpdate(pendingUpdate.current.blocks, pendingUpdate.current.metadata);
          pendingUpdate.current = null;
        } else {
          // Send current state
          sendUpdate(blocks, metadata);
        }
      }, 100);
    };

    // Check if iframe is already loaded (for hot reload scenarios)
    if (iframe.contentDocument?.readyState === 'complete' && iframe.src.includes('/admin/preview')) {
      handleLoad();
    }

    iframe.addEventListener('load', handleLoad);

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [iframeRef.current, sendUpdate, blocks, metadata]);

  // Sync blocks/metadata changes with debounce
  useEffect(() => {
    // Skip if no blocks (likely pages view)
    if (blocks.length === 0) {
      return;
    }

    // Save to localStorage immediately so iframe can load it
    localStorage.setItem('astro-builder-blocks', JSON.stringify({ blocks, metadata }));

    const timeout = setTimeout(() => {
      if (iframeLoaded.current && iframeRef.current) {
        sendUpdate(blocks, metadata);
      } else {
        // Store for later when iframe loads
        pendingUpdate.current = { blocks, metadata };
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [blocks, metadata, sendUpdate, iframeRef]);

  // Force refresh if iframe seems stuck (no load after 3s)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const checkTimeout = setTimeout(() => {
      if (!iframeLoaded.current && iframe.src.includes('/admin/preview')) {
        console.log('Preview iframe seems stuck, reloading...');
        iframe.src = '/admin/preview?' + Date.now(); // Force reload with cache bust
      }
    }, 3000);

    return () => clearTimeout(checkTimeout);
  }, [iframeRef.current]);
}

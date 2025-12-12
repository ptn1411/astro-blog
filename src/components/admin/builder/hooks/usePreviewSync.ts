import { useEffect, useRef } from 'react';
import type { BuilderBlock, PageMetadata } from '../types';

const DEBOUNCE_MS = 500;

export function usePreviewSync(
  blocks: BuilderBlock[],
  metadata: PageMetadata,
  iframeRef: React.RefObject<HTMLIFrameElement | null>
): void {
  const isFirstRender = useRef(true);

  // Initial load
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.src = '/admin/preview';
    }
  }, []);

  useEffect(() => {
    // Skip first render if needed, but for postMessage we might want to send initial state if iframe is ready.
    // However, ClientPreview loads from localStorage on mount, so initial sync might be redundant if we save to LS.

    // We'll update localStorage here too for persistence across reloads
    localStorage.setItem('astro-builder-blocks', JSON.stringify({ blocks, metadata }));

    const syncPreview = () => {
      if (!iframeRef.current || !iframeRef.current.contentWindow) return;

      iframeRef.current.contentWindow.postMessage(
        {
          type: 'PREVIEW_UPDATE',
          payload: { blocks, metadata },
        },
        '*' // In production, restrictive origin is better, but for local dev '*' is fine
      );
    };

    const timeout = setTimeout(syncPreview, DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [blocks, metadata, iframeRef]);
}

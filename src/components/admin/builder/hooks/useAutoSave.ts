import { useEffect, useState } from 'react';
import type { BuilderBlock, PageMetadata } from '../core/types';

interface AutoSaveData {
  blocks: BuilderBlock[];
  metadata: PageMetadata;
}

const STORAGE_KEY = 'builder-autosave';
const DEBOUNCE_MS = 2000;

interface UseAutoSaveReturn {
  lastSaved: Date | null;
  loadFromStorage: () => AutoSaveData | null;
  clearStorage: () => void;
}

export function useAutoSave(
  blocks: BuilderBlock[],
  metadata: PageMetadata,
  enabled: boolean = true
): UseAutoSaveReturn {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save effect (debounced)
  useEffect(() => {
    if (!enabled || blocks.length === 0) return;

    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ blocks, metadata }));
      setLastSaved(new Date());
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [blocks, metadata, enabled]);

  const loadFromStorage = (): AutoSaveData | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as AutoSaveData;
        if (data.blocks && Array.isArray(data.blocks)) {
          return data;
        }
      }
    } catch (e) {
      console.error('Failed to load autosave', e);
    }
    return null;
  };

  const clearStorage = (): void => {
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    lastSaved,
    loadFromStorage,
    clearStorage,
  };
}

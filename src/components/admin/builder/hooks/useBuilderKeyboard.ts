import { useEffect } from 'react';
import type { BuilderBlock } from '../core/types';

interface UseBuilderKeyboardProps {
  undo: () => BuilderBlock[] | null;
  redo: () => BuilderBlock[] | null;
  setBlocks: React.Dispatch<React.SetStateAction<BuilderBlock[]>>;
}

export function useBuilderKeyboard({ undo, redo, setBlocks }: UseBuilderKeyboardProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const result = undo();
        if (result) setBlocks(result);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        const result = redo();
        if (result) setBlocks(result);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setBlocks]);
}

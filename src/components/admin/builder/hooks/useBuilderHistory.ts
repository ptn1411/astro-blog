import { useCallback, useRef, useState } from 'react';
import type { BuilderBlock } from '../core/types';
import { deepClone } from '../utils';

interface UseBuilderHistoryReturn {
  history: BuilderBlock[][];
  historyIndex: number;
  pushToHistory: (blocks: BuilderBlock[]) => void;
  undo: () => BuilderBlock[] | null;
  redo: () => BuilderBlock[] | null;
  canUndo: boolean;
  canRedo: boolean;
}

export function useBuilderHistory(initialBlocks: BuilderBlock[] = []): UseBuilderHistoryReturn {
  const [history, setHistory] = useState<BuilderBlock[][]>([initialBlocks]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoAction = useRef(false);

  const pushToHistory = useCallback(
    (newBlocks: BuilderBlock[]) => {
      if (isUndoRedoAction.current) {
        isUndoRedoAction.current = false;
        return;
      }
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(deepClone(newBlocks));
        return newHistory;
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const undo = useCallback((): BuilderBlock[] | null => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      return deepClone(history[newIndex]);
    }
    return null;
  }, [historyIndex, history]);

  const redo = useCallback((): BuilderBlock[] | null => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      return deepClone(history[newIndex]);
    }
    return null;
  }, [historyIndex, history]);

  return {
    history,
    historyIndex,
    pushToHistory,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
}

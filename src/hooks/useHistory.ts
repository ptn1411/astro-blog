import { useCallback, useRef, useState } from 'react';

interface UseHistoryReturn<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  history: T[];
}

export function useHistory<T>(initialState: T): UseHistoryReturn<T> {
  // Use a ref to store history and index to avoid stale closure issues
  const historyRef = useRef<T[]>([initialState]);
  const indexRef = useRef(0);

  // Use state only to trigger re-renders
  const [, forceUpdate] = useState(0);

  const state = historyRef.current[indexRef.current] ?? initialState;

  const setState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      const currentHistory = historyRef.current;
      const currentIndex = indexRef.current;
      const current = currentHistory[currentIndex] ?? initialState;

      if (!current) return;

      const resolvedState = typeof newState === 'function' ? (newState as (prev: T) => T)(current) : newState;

      if (!resolvedState) return;

      // Truncate history after current index and add new state
      const newHistory = currentHistory.slice(0, currentIndex + 1);
      newHistory.push(resolvedState);

      historyRef.current = newHistory;
      indexRef.current = currentIndex + 1;

      // Trigger re-render
      forceUpdate((n) => n + 1);
    },
    [initialState]
  );

  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      indexRef.current -= 1;
      forceUpdate((n) => n + 1);
    }
  }, []);

  const redo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current += 1;
      forceUpdate((n) => n + 1);
    }
  }, []);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: indexRef.current > 0,
    canRedo: indexRef.current < historyRef.current.length - 1,
    history: historyRef.current,
  };
}

import { useEffect } from 'react';

interface UseStoryKeyboardProps {
  undo: () => void;
  redo: () => void;
  selectedElementIds: string[];
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  setSelectedElementIds: (ids: string[]) => void;
  setIsPreviewMode: (value: boolean) => void;
  setPreviewStartIndex: (index: number) => void;
  currentSlideIndex: number;
}

export function useStoryKeyboard({
  undo,
  redo,
  selectedElementIds,
  deleteElement,
  duplicateElement,
  setSelectedElementIds,
  setIsPreviewMode,
  setPreviewStartIndex,
  currentSlideIndex,
}: UseStoryKeyboardProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement;

      if (isInput) return;

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }

      // Delete selected elements
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        selectedElementIds.forEach(deleteElement);
      }

      // Duplicate
      else if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedElementIds.length > 0) {
        e.preventDefault();
        selectedElementIds.forEach(duplicateElement);
      }

      // Deselect
      else if (e.key === 'Escape') {
        setSelectedElementIds([]);
        setIsPreviewMode(false);
      }

      // Preview
      else if (e.key === 'p' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setPreviewStartIndex(currentSlideIndex);
        setIsPreviewMode(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedElementIds, deleteElement, duplicateElement, setSelectedElementIds, setIsPreviewMode, setPreviewStartIndex, currentSlideIndex]);
}

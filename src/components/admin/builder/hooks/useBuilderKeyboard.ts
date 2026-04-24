import { useEffect } from 'react';
import type { BuilderBlock } from '../core/types';

interface UseBuilderKeyboardProps {
  undo: () => BuilderBlock[] | null;
  redo: () => BuilderBlock[] | null;
  setBlocks: React.Dispatch<React.SetStateAction<BuilderBlock[]>>;
  // New capabilities (all optional so existing callers keep working)
  blocks?: BuilderBlock[];
  selectedId?: string | null;
  setSelectedId?: (id: string | null) => void;
  onDeleteSelected?: () => void;
  onMoveSelected?: (direction: 'up' | 'down') => void;
  onOpenCommandPalette?: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}

export function useBuilderKeyboard({
  undo,
  redo,
  setBlocks,
  blocks,
  selectedId,
  setSelectedId,
  onDeleteSelected,
  onMoveSelected,
  onOpenCommandPalette,
}: UseBuilderKeyboardProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const cmd = e.ctrlKey || e.metaKey;
      const typing = isTypingTarget(e.target);

      // Undo / Redo — works everywhere
      if (cmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const result = undo();
        if (result) setBlocks(result);
        return;
      }
      if (cmd && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        const result = redo();
        if (result) setBlocks(result);
        return;
      }

      // Command Palette — works everywhere (Cmd/Ctrl + K)
      if (cmd && e.key.toLowerCase() === 'k' && onOpenCommandPalette) {
        e.preventDefault();
        onOpenCommandPalette();
        return;
      }

      // The rest only fire when user is NOT editing text
      if (typing) return;

      // Delete selected block
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && onDeleteSelected) {
        e.preventDefault();
        onDeleteSelected();
        return;
      }

      // Alt + Arrow Up/Down — move selected block
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && selectedId && onMoveSelected) {
        e.preventDefault();
        onMoveSelected(e.key === 'ArrowUp' ? 'up' : 'down');
        return;
      }

      // Arrow Up/Down — navigate selection in block list
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && blocks && blocks.length > 0 && setSelectedId) {
        e.preventDefault();
        const currentIndex = selectedId ? blocks.findIndex((b) => b.id === selectedId) : -1;
        let nextIndex: number;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, blocks.length - 1);
        } else {
          nextIndex = currentIndex <= 0 ? 0 : currentIndex - 1;
        }
        setSelectedId(blocks[nextIndex].id);
        return;
      }

      // Escape — deselect
      if (e.key === 'Escape' && selectedId && setSelectedId) {
        setSelectedId(null);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setBlocks, blocks, selectedId, setSelectedId, onDeleteSelected, onMoveSelected, onOpenCommandPalette]);
}

import { useCallback, useEffect } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toMDX } from '~/utils/serializer';
import { getPendingImages, uploadAllPendingImages } from '../ui/pickers/ImagePicker';
import { deepClone, generateId } from '../utils/helpers';
import { exportJSON, exportMDX, parseImportedJSON } from '../services/export/exportActions';
import { saveLocally, saveToGitHub, getGitHubToken, isLocalEnvironment } from '../services/save/saveActions';
import { PAGE_TEMPLATES } from '../config/templates';
import type { BuilderBlock, PageMetadata } from '../core/types';
import type { WidgetType } from '../config/registry';
import type { BuilderState, BuilderStateSetters } from './useBuilderState';

interface UseBuilderActionsProps {
  state: BuilderState;
  setters: BuilderStateSetters;
  widgetRegistry: {
    getWidget: (type: string) => { defaultProps: Record<string, unknown> } | undefined;
    widgets: Array<{
      type: string;
      label: string;
      category: string;
      fields: Array<{
        name: string;
        type: string;
        label: string;
        arraySchema?: unknown;
      }>;
      defaultProps: Record<string, unknown>;
    }>;
  };
  clearStorage: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function useBuilderActions({
  state,
  setters,
  widgetRegistry,
  clearStorage,
  fileInputRef,
}: UseBuilderActionsProps) {
  const { blocks, selectedId, metadata, pasteJsonText } = state;
  const {
    setBlocks,
    setSelectedId,
    setMetadata,
    setEditingPath,
    setCurrentView,
    setBuilderMode,
    setIsSaveModalOpen,
    setIsSaving,
    setIsTemplateModalOpen,
    setIsPasteModalOpen,
    setPasteJsonText,
    setCollapsedCategories,
  } = setters;

  // --- Save Action ---
  const handleSave = useCallback(async (path: string, message: string) => {
    setIsSaving(true);
    try {
      const content = toMDX(blocks, metadata);
      if (isLocalEnvironment()) {
        await saveLocally(path, content);
        alert('Saved locally!');
      } else {
        const token = getGitHubToken();
        if (!token) {
          alert('Not authenticated. Please log in via CMS first.');
          return;
        }

        const pendingImages = getPendingImages();
        if (pendingImages.length > 0) {
          const confirmUpload = confirm(
            `Có ${pendingImages.length} hình ảnh đang chờ upload.\nBạn có muốn upload lên GitHub không?`
          );
          if (confirmUpload) {
            await uploadAllPendingImages((current, total, fileName) => {
              console.log(`Uploading image ${current}/${total}: ${fileName}`);
            });
          }
        }

        await saveToGitHub({ path, content, message, token });
        alert('Saved successfully to GitHub!');
      }
      setIsSaveModalOpen(false);
    } catch (e: unknown) {
      const error = e as Error;
      console.error('Save failed', error);
      alert(`Save failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [blocks, metadata, setIsSaving, setIsSaveModalOpen]);

  // --- Block Actions ---
  const addBlock = useCallback((type: WidgetType | string) => {
    const def = widgetRegistry.getWidget(type);
    if (!def) {
      console.warn(`Widget definition not found for type: ${type}`);
      return;
    }
    const newBlock: BuilderBlock = {
      id: generateId(),
      type: type as WidgetType,
      props: deepClone(def.defaultProps),
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedId(newBlock.id);
  }, [widgetRegistry, setBlocks, setSelectedId]);

  const updateBlockProps = useCallback((id: string, newProps: Record<string, unknown>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, props: newProps } : b)));
  }, [setBlocks]);

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      if (selectedId === id) setSelectedId(null);
      return next;
    });
  }, [selectedId, setBlocks, setSelectedId]);

  const duplicateBlock = useCallback((id: string) => {
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    const newBlock: BuilderBlock = {
      id: generateId(),
      type: block.type,
      props: deepClone(block.props),
    };
    const index = blocks.findIndex((b) => b.id === id);
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, newBlock);
      return next;
    });
    setSelectedId(newBlock.id);
  }, [blocks, setBlocks, setSelectedId]);

  // --- Category Toggle ---
  const toggleCategory = useCallback((categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, [setCollapsedCategories]);

  // --- Template Actions ---
  const applyTemplate = useCallback((templateId: string) => {
    const template = PAGE_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      const newBlocks = template.blocks.map((b) => ({
        id: generateId(),
        type: b.type,
        props: deepClone(b.props),
      }));
      setBlocks(newBlocks);
      setIsTemplateModalOpen(false);
    }
  }, [setBlocks, setIsTemplateModalOpen]);

  const clearPage = useCallback(() => {
    if (confirm('Clear all blocks? This cannot be undone.')) {
      setBlocks([]);
      clearStorage();
    }
  }, [setBlocks, clearStorage]);

  // --- Drag & Drop ---
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, [setBlocks]);

  // --- Preview ---
  const openPreviewInNewTab = useCallback(() => {
    localStorage.setItem('astro-builder-blocks', JSON.stringify({ blocks, metadata }));
    window.open('/admin/preview', '_blank');
  }, [blocks, metadata]);

  // --- Export/Import ---
  const handleExportJSON = useCallback(() => exportJSON(blocks, metadata), [blocks, metadata]);
  const handleExportMDX = useCallback(() => exportMDX(blocks, metadata), [blocks, metadata]);

  const handleImportJSON = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseImportedJSON(text);
      if (result.success && result.blocks) {
        setBlocks(result.blocks);
        if (result.metadata) setMetadata(result.metadata);
        alert('Imported successfully!');
      } else {
        alert(result.error || 'Import failed');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  }, [setBlocks, setMetadata, fileInputRef]);

  const handlePasteImport = useCallback(() => {
    if (!pasteJsonText.trim()) {
      alert('Please paste JSON content first');
      return;
    }
    const result = parseImportedJSON(pasteJsonText);
    if (result.success && result.blocks) {
      setBlocks(result.blocks);
      if (result.metadata) setMetadata(result.metadata);
      setPasteJsonText('');
      setIsPasteModalOpen(false);
      alert('Imported successfully!');
    } else {
      alert(result.error || 'Import failed');
    }
  }, [pasteJsonText, setBlocks, setMetadata, setPasteJsonText, setIsPasteModalOpen]);

  // --- Page Management ---
  const handleEditPage = useCallback((pageData: { blocks: BuilderBlock[]; metadata: PageMetadata; path: string }) => {
    setBlocks(pageData.blocks);
    setMetadata(pageData.metadata);
    setEditingPath(pageData.path);
    setCurrentView('builder');
    setSelectedId(null);
    setBuilderMode('edit');
  }, [setBlocks, setMetadata, setEditingPath, setCurrentView, setSelectedId, setBuilderMode]);

  const handleCreateNew = useCallback(() => {
    setBlocks([]);
    setMetadata({ title: 'Untitled Page', description: '' });
    setEditingPath(null);
    setCurrentView('builder');
    setSelectedId(null);
    setBuilderMode('create');
    clearStorage();
  }, [setBlocks, setMetadata, setEditingPath, setCurrentView, setSelectedId, setBuilderMode, clearStorage]);

  // --- Listen for sidebar widget clicks ---
  useEffect(() => {
    const handler = (e: CustomEvent) => addBlock(e.detail);
    window.addEventListener('add-widget' as keyof WindowEventMap, handler as EventListener);
    return () => window.removeEventListener('add-widget' as keyof WindowEventMap, handler as EventListener);
  }, [addBlock]);

  return {
    handleSave,
    addBlock,
    updateBlockProps,
    deleteBlock,
    duplicateBlock,
    toggleCategory,
    applyTemplate,
    clearPage,
    handleDragEnd,
    openPreviewInNewTab,
    handleExportJSON,
    handleExportMDX,
    handleImportJSON,
    handlePasteImport,
    handleEditPage,
    handleCreateNew,
  };
}

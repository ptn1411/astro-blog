import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ChevronDown,
  ChevronRight,
  CloudUpload,
  Code,
  Download,
  ExternalLink,
  FileText,
  Layers,
  Monitor,
  Moon,
  Redo2,
  Save,
  Search,
  Smartphone,
  Sun,
  Undo2,
  Upload,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toMDX } from '~/utils/serializer';

import { PropsEditor } from './builder/components/PropsEditor';
import { WIDGET_CATEGORIES, WIDGET_REGISTRY, type WidgetType } from './registry';

// Import from builder modules
import {
  CanvasItem,
  deepClone,
  exportJSON,
  exportMDX,
  generateId,
  getGitHubToken,
  isLocalEnvironment,
  PAGE_TEMPLATES,
  parseImportedJSON,
  saveLocally,
  SaveModal,
  saveToGitHub,
  SidebarItem,
  TemplateModal,
  useAutoSave,
  useBuilderHistory,
  usePreviewSync,
  type BuilderBlock,
  type PageMetadata,
} from './builder/index';

// --- Main Builder Component ---
export default function BuilderApp() {
  // --- Core State ---
  const [blocks, setBlocks] = useState<BuilderBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<PageMetadata>({ title: 'Untitled Page', description: '' });
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- UI State ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('builder-dark-mode') === 'true';
    }
    return false;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // --- Custom Hooks ---
  const { historyIndex, pushToHistory, undo, redo, canUndo, canRedo, history } = useBuilderHistory([]);
  const { lastSaved, loadFromStorage, clearStorage } = useAutoSave(blocks, metadata, true);
  usePreviewSync(blocks, metadata, iframeRef);

  // --- Persist Dark Mode ---
  useEffect(() => {
    localStorage.setItem('builder-dark-mode', String(isDarkMode));
  }, [isDarkMode]);

  // --- Track blocks changes to history ---
  useEffect(() => {
    if (blocks.length > 0 || history.length > 1) {
      pushToHistory(blocks);
    }
  }, [blocks]);

  // --- Load from localStorage on mount ---
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved && saved.blocks.length > 0) {
      setBlocks(saved.blocks);
      if (saved.metadata) setMetadata(saved.metadata);
    }
  }, []);

  // --- Keyboard shortcuts ---
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
  }, [undo, redo]);

  // --- DND Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- Actions ---
  const handleSave = async (path: string, message: string) => {
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
  };

  const addBlock = (type: WidgetType) => {
    const def = WIDGET_REGISTRY.find((w) => w.type === type);
    if (!def) return;
    const newBlock: BuilderBlock = {
      id: generateId(),
      type,
      props: deepClone(def.defaultProps),
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedId(newBlock.id);
  };

  const updateBlockProps = (id: string, newProps: Record<string, unknown>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, props: newProps } : b)));
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      if (selectedId === id) setSelectedId(null);
      return next;
    });
  };

  const duplicateBlock = (id: string) => {
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
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const applyTemplate = (templateId: string) => {
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
  };

  const clearPage = () => {
    if (confirm('Clear all blocks? This cannot be undone.')) {
      setBlocks([]);
      clearStorage();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const openPreviewInNewTab = () => {
    localStorage.setItem('astro-builder-blocks', JSON.stringify({ blocks, metadata }));
    window.open('/admin/preview', '_blank');
  };

  const handleExportJSON = () => exportJSON(blocks, metadata);
  const handleExportMDX = () => exportMDX(blocks, metadata);

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // --- Listen for sidebar widget clicks ---
  useEffect(() => {
    const handler = (e: CustomEvent) => addBlock(e.detail);
    window.addEventListener('add-widget' as keyof WindowEventMap, handler as EventListener);
    return () => window.removeEventListener('add-widget' as keyof WindowEventMap, handler as EventListener);
  }, []);

  // --- Derived State ---
  const filteredWidgets = WIDGET_REGISTRY.filter((widget) =>
    widget.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedBlock = blocks.find((b) => b.id === selectedId);
  const selectedDef = selectedBlock ? WIDGET_REGISTRY.find((w) => w.type === selectedBlock.type) : null;

  return (
    <div
      className={`flex flex-col h-screen overflow-hidden transition-colors ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-slate-800'}`}
    >
      {/* Modals */}
      <SaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSave}
        isSaving={isSaving}
      />
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onApply={applyTemplate}
        onClear={clearPage}
        isDarkMode={isDarkMode}
      />

      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />

      {/* Header */}
      <header
        className={`px-4 py-3 flex items-center justify-between shadow-sm z-10 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
      >
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Phạm Thành Nam - Astro Builder
        </h1>
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className={`flex rounded-md p-1 mr-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <button
              onClick={() => {
                const r = undo();
                if (r) setBlocks(r);
              }}
              disabled={!canUndo}
              className={`p-1.5 rounded transition-colors ${!canUndo ? 'opacity-40 cursor-not-allowed' : isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={18} />
            </button>
            <button
              onClick={() => {
                const r = redo();
                if (r) setBlocks(r);
              }}
              disabled={!canRedo}
              className={`p-1.5 rounded transition-colors ${!canRedo ? 'opacity-40 cursor-not-allowed' : isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={18} />
            </button>
          </div>

          {/* Auto-save indicator */}
          {lastSaved && (
            <span className={`text-xs mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <Save size={12} className="inline mr-1" />
              {lastSaved.toLocaleTimeString()}
            </span>
          )}

          {/* Templates Button */}
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className={`p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            title="Page Templates"
          >
            <Layers size={20} />
          </button>

          {/* Preview Mode Toggle */}
          <div className={`flex rounded-md p-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-1.5 rounded ${previewMode === 'desktop' ? (isDarkMode ? 'bg-gray-600' : 'bg-white shadow') : ''}`}
              title="Desktop"
            >
              <Monitor size={18} />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-1.5 rounded ${previewMode === 'mobile' ? (isDarkMode ? 'bg-gray-600' : 'bg-white shadow') : ''}`}
              title="Mobile"
            >
              <Smartphone size={18} />
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-600'}`}
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Download Menu */}
          <div className="relative">
            <button
              onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
              className={`flex items-center gap-1 px-3 py-2 text-sm rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <Download size={18} /> Export
            </button>
            {isDownloadMenuOpen && (
              <div
                className={`absolute right-0 mt-1 w-40 rounded-md shadow-lg z-20 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
              >
                <button
                  onClick={handleExportJSON}
                  className={`block w-full px-4 py-2 text-sm text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                >
                  <Code size={14} className="inline mr-2" /> Export JSON
                </button>
                <button
                  onClick={handleExportMDX}
                  className={`block w-full px-4 py-2 text-sm text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                >
                  <FileText size={14} className="inline mr-2" /> Export MDX
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`block w-full px-4 py-2 text-sm text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                >
                  <Upload size={14} className="inline mr-2" /> Import JSON
                </button>
              </div>
            )}
          </div>

          {/* Save & Preview */}
          <button
            onClick={openPreviewInNewTab}
            className={`flex items-center gap-1 px-3 py-2 text-sm rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <ExternalLink size={18} /> Preview
          </button>
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
          >
            <CloudUpload size={18} /> Save
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`w-64 flex-shrink-0 overflow-y-auto p-4 border-r ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className="mb-4">
            <div className="relative">
              <Search
                size={16}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
              />
              <input
                type="text"
                placeholder="Search widgets..."
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {WIDGET_CATEGORIES.map((category) => {
            const categoryWidgets = filteredWidgets.filter((w) => w.category === category.id);
            if (categoryWidgets.length === 0) return null;
            const isCollapsed = collapsedCategories.has(category.id);

            return (
              <div key={category.id} className="mb-4">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-sm font-semibold rounded transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <span>{category.label}</span>
                  {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </button>
                {!isCollapsed && (
                  <div className="mt-2 space-y-2">
                    {categoryWidgets.map((widget) => (
                      <SidebarItem key={widget.type} widget={widget} isDarkMode={isDarkMode} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Canvas */}
        <div className={`flex-1 flex flex-col overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <div className="flex-1 flex gap-4 p-4 overflow-hidden">
            {/* Blocks List */}
            <div
              className={`w-72 flex-shrink-0 overflow-y-auto rounded-lg border p-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Page Structure ({blocks.length})
              </h3>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  {blocks.map((block) => (
                    <CanvasItem
                      key={block.id}
                      block={block}
                      isSelected={selectedId === block.id}
                      onSelect={() => setSelectedId(block.id)}
                      onDelete={(e) => {
                        e.stopPropagation();
                        deleteBlock(block.id);
                      }}
                      onDuplicate={(e) => {
                        e.stopPropagation();
                        duplicateBlock(block.id);
                      }}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {blocks.length === 0 && (
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <p className="text-sm">No blocks yet</p>
                  <p className="text-xs mt-1">Click a widget to add</p>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div
                className={`flex-1 rounded-lg border overflow-hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
              >
                <iframe
                  ref={iframeRef}
                  className={`w-full h-full ${previewMode === 'mobile' ? 'max-w-[375px] mx-auto' : ''}`}
                  title="Preview"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div
          className={`w-80 flex-shrink-0 overflow-y-auto p-4 border-l ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {selectedBlock ? `Edit: ${selectedDef?.label || selectedBlock.type}` : 'Page Settings'}
          </h3>
          <PropsEditor
            selectedBlock={selectedBlock || null}
            selectedDef={selectedDef || null}
            updateBlockProps={updateBlockProps}
            metadata={metadata}
            setMetadata={setMetadata}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </div>
  );
}

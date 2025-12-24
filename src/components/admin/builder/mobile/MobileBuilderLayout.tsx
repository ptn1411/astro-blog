import React, { useState, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import type { BuilderBlock, PageMetadata } from '../types';
import type { WidgetType, WidgetSchema } from '../registry';
import { WIDGET_REGISTRY } from '../registry';
import { BuilderBottomNavBar, type BuilderMobileView } from './BuilderBottomNavBar';
import { BuilderMobileHeader } from './BuilderMobileHeader';
import { MobileBlockList } from './MobileBlockList';

/**
 * MobileBuilderLayout Component - Main orchestrator for mobile page builder
 * Requirements: 2.1, 2.2, 2.3, 10.1
 * 
 * Implements:
 * - Orchestrates all mobile components
 * - Manages view state (canvas/widgets/properties)
 * - Handles panel transitions with lazy loading
 * - Preserves state when switching panels
 */

// Lazy load heavy components for performance (Requirement 10.1)
const MobileWidgetPicker = lazy(() => import('./MobileWidgetPicker').then(m => ({ default: m.MobileWidgetPicker })));
const MobilePropertiesPanel = lazy(() => import('./MobilePropertiesPanel').then(m => ({ default: m.MobilePropertiesPanel })));
const MobilePreviewModal = lazy(() => import('./MobilePreviewModal').then(m => ({ default: m.MobilePreviewModal })));
const MobileSaveModal = lazy(() => import('./MobileSaveModal').then(m => ({ default: m.MobileSaveModal })));
const MobileAIPromptModal = lazy(() => import('./MobileAIPromptModal').then(m => ({ default: m.MobileAIPromptModal })));
const MobilePasteJSONModal = lazy(() => import('./MobilePasteJSONModal').then(m => ({ default: m.MobilePasteJSONModal })));

export interface MobileBuilderLayoutProps {
  /** Current blocks in the builder */
  blocks: BuilderBlock[];
  /** Currently selected block ID */
  selectedId: string | null;
  /** Page metadata */
  metadata: PageMetadata;
  /** Callback when blocks change */
  onBlocksChange: (blocks: BuilderBlock[]) => void;
  /** Callback when a block is selected */
  onSelectBlock: (id: string | null) => void;
  /** Callback when metadata changes */
  onMetadataChange: (metadata: PageMetadata) => void;
  /** Callback when save is triggered */
  onSave: () => void;
  /** Callback when back button is pressed */
  onBack: () => void;
  /** Whether dark mode is enabled */
  isDarkMode: boolean;
  /** Current view mode (pages/builder) */
  currentView: 'pages' | 'builder';
  /** Callback when view changes */
  onViewChange: (view: 'pages' | 'builder') => void;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Path being edited (if any) */
  editingPath?: string | null;
  /** Undo/Redo callbacks */
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  /** Export/Import callbacks */
  onExportJSON?: () => void;
  onExportMDX?: () => void;
  onImportJSON?: () => void;
  onClearPage?: () => void;
  onOpenTemplates?: () => void;
  /** Preview URL for the page */
  previewUrl?: string;
  /** Save modal props */
  saveMode?: 'create' | 'edit';
  onSaveWithPath?: (path: string, message: string) => void;
  /** AI Prompt props */
  aiPromptDescription?: string;
  onAIPromptDescriptionChange?: (description: string) => void;
  generateAIPrompt?: () => string;
  /** Paste JSON callback */
  onPasteJSON?: (json: string) => void;
}

/** Loading fallback for lazy-loaded components */
const LoadingFallback: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
  <div className={`flex items-center justify-center p-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
  </div>
);

/**
 * Panel state preservation - stores state for each panel
 * This allows preserving scroll position and other state when switching panels
 */
interface PanelState {
  widgetsScrollTop: number;
  canvasScrollTop: number;
  propertiesScrollTop: number;
}

export const MobileBuilderLayout: React.FC<MobileBuilderLayoutProps> = React.memo(({
  blocks,
  selectedId,
  metadata,
  onBlocksChange,
  onSelectBlock,
  onMetadataChange,
  onSave,
  onBack,
  isDarkMode,
  currentView,
  onViewChange,
  hasUnsavedChanges,
  isSaving = false,
  editingPath,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onExportJSON,
  onExportMDX,
  onImportJSON,
  onClearPage,
  onOpenTemplates,
  previewUrl = '',
  saveMode = 'create',
  onSaveWithPath,
  aiPromptDescription = '',
  onAIPromptDescriptionChange,
  generateAIPrompt,
  onPasteJSON,
}) => {
  // View state management (Requirement 2.1, 2.2)
  const [activeTab, setActiveTab] = useState<BuilderMobileView>('canvas');
  
  // Panel open states
  const [isWidgetPickerOpen, setIsWidgetPickerOpen] = useState(false);
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isAIPromptModalOpen, setIsAIPromptModalOpen] = useState(false);
  const [isPasteJSONModalOpen, setIsPasteJSONModalOpen] = useState(false);

  // Panel state preservation (Requirement 10.1 - preserve state when switching)
  const panelStateRef = useRef<PanelState>({
    widgetsScrollTop: 0,
    canvasScrollTop: 0,
    propertiesScrollTop: 0,
  });

  // Refs for scroll containers
  const canvasScrollRef = useRef<HTMLDivElement>(null);

  // Get selected block and its definition
  const selectedBlock = useMemo(() => {
    if (!selectedId) return null;
    return blocks.find((b) => b.id === selectedId) || null;
  }, [blocks, selectedId]);

  const selectedDef = useMemo<WidgetSchema | null>(() => {
    if (!selectedBlock) return null;
    return WIDGET_REGISTRY.find((w) => w.type === selectedBlock.type) || null;
  }, [selectedBlock]);

  // Handle tab change with state preservation
  const handleTabChange = useCallback((tabId: BuilderMobileView) => {
    // Save current scroll position before switching
    if (canvasScrollRef.current && activeTab === 'canvas') {
      panelStateRef.current.canvasScrollTop = canvasScrollRef.current.scrollTop;
    }

    setActiveTab(tabId);

    // Open appropriate panel based on tab
    if (tabId === 'widgets') {
      setIsWidgetPickerOpen(true);
    } else if (tabId === 'properties') {
      setIsPropertiesPanelOpen(true);
    }
  }, [activeTab]);

  // Handle widget selection
  const handleSelectWidget = useCallback((type: WidgetType) => {
    const widgetDef = WIDGET_REGISTRY.find((w) => w.type === type);
    if (!widgetDef) return;

    const newBlock: BuilderBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      props: { ...widgetDef.defaultProps },
    };

    onBlocksChange([...blocks, newBlock]);
    onSelectBlock(newBlock.id);
    
    // Close widget picker and switch to canvas
    setIsWidgetPickerOpen(false);
    setActiveTab('canvas');
  }, [blocks, onBlocksChange, onSelectBlock]);

  // Handle block operations
  const handleDeleteBlock = useCallback((id: string) => {
    onBlocksChange(blocks.filter((b) => b.id !== id));
    if (selectedId === id) {
      onSelectBlock(null);
    }
  }, [blocks, selectedId, onBlocksChange, onSelectBlock]);

  const handleDuplicateBlock = useCallback((id: string) => {
    const blockIndex = blocks.findIndex((b) => b.id === id);
    if (blockIndex === -1) return;

    const originalBlock = blocks[blockIndex];
    const duplicatedBlock: BuilderBlock = {
      ...originalBlock,
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      props: JSON.parse(JSON.stringify(originalBlock.props)),
    };

    const newBlocks = [...blocks];
    newBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
    onBlocksChange(newBlocks);
    onSelectBlock(duplicatedBlock.id);
  }, [blocks, onBlocksChange, onSelectBlock]);

  const handleReorderBlocks = useCallback((newBlocks: BuilderBlock[]) => {
    onBlocksChange(newBlocks);
  }, [onBlocksChange]);

  // Handle block selection and open properties
  const handleBlockSelect = useCallback((id: string) => {
    onSelectBlock(id);
  }, [onSelectBlock]);

  const handleEditProperties = useCallback((id: string) => {
    onSelectBlock(id);
    setIsPropertiesPanelOpen(true);
    setActiveTab('properties');
  }, [onSelectBlock]);

  // Handle property updates
  const handleUpdateProps = useCallback((id: string, props: Record<string, unknown>) => {
    onBlocksChange(
      blocks.map((b) => (b.id === id ? { ...b, props } : b))
    );
  }, [blocks, onBlocksChange]);

  // Handle save modal
  const handleOpenSave = useCallback(() => {
    setIsSaveModalOpen(true);
  }, []);

  const handleSaveWithPath = useCallback((path: string, message: string) => {
    onSaveWithPath?.(path, message);
    setIsSaveModalOpen(false);
  }, [onSaveWithPath]);

  // Handle preview
  const handleOpenPreview = useCallback(() => {
    setIsPreviewModalOpen(true);
  }, []);

  // Handle AI Prompt
  const handleOpenAIPrompt = useCallback(() => {
    setIsAIPromptModalOpen(true);
  }, []);

  // Handle Paste JSON
  const handleOpenPasteJSON = useCallback(() => {
    setIsPasteJSONModalOpen(true);
  }, []);

  const handlePasteJSONSubmit = useCallback((json: string) => {
    onPasteJSON?.(json);
    setIsPasteJSONModalOpen(false);
  }, [onPasteJSON]);

  // Close panels and return to canvas
  const handleCloseWidgetPicker = useCallback(() => {
    setIsWidgetPickerOpen(false);
    setActiveTab('canvas');
  }, []);

  const handleClosePropertiesPanel = useCallback(() => {
    setIsPropertiesPanelOpen(false);
    setActiveTab('canvas');
  }, []);

  // Determine if properties badge should show
  const showPropertiesBadge = selectedId !== null;

  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile Header */}
      <BuilderMobileHeader
        title={metadata.title || 'Untitled Page'}
        currentView={currentView}
        onViewChange={onViewChange}
        onBack={onBack}
        onSave={onSaveWithPath ? handleOpenSave : onSave}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        isDarkMode={isDarkMode}
        editingPath={editingPath}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onExportJSON={onExportJSON}
        onExportMDX={onExportMDX}
        onImportJSON={onImportJSON}
        onPasteJSON={handleOpenPasteJSON}
        onAIPrompt={generateAIPrompt ? handleOpenAIPrompt : undefined}
        onClearPage={onClearPage}
        onOpenTemplates={onOpenTemplates}
      />

      {/* Main Content Area - Canvas View */}
      <main 
        ref={canvasScrollRef}
        className="flex-1 overflow-y-auto overscroll-contain pb-20"
      >
        <MobileBlockList
          blocks={blocks}
          selectedId={selectedId}
          onSelect={handleBlockSelect}
          onReorder={handleReorderBlocks}
          onDelete={handleDeleteBlock}
          onDuplicate={handleDuplicateBlock}
          onEditProperties={handleEditProperties}
          isDarkMode={isDarkMode}
        />

        {/* Empty state with add widget button */}
        {blocks.length === 0 && (
          <div className="p-4">
            <button
              onClick={() => {
                setIsWidgetPickerOpen(true);
                setActiveTab('widgets');
              }}
              className={`w-full py-6 rounded-xl border-2 border-dashed transition-colors ${
                isDarkMode
                  ? 'border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300'
                  : 'border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-600'
              }`}
            >
              <span className="text-2xl mb-2 block">+</span>
              <span className="text-sm font-medium">Add your first widget</span>
            </button>
          </div>
        )}

        {/* Preview button when blocks exist */}
        {blocks.length > 0 && previewUrl && (
          <div className="p-4">
            <button
              onClick={handleOpenPreview}
              className={`w-full py-3 rounded-xl font-medium transition-colors ${
                isDarkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              👁️ Preview Page
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BuilderBottomNavBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isDarkMode={isDarkMode}
        showPropertiesBadge={showPropertiesBadge}
      />

      {/* Lazy-loaded Panels and Modals */}
      <Suspense fallback={<LoadingFallback isDarkMode={isDarkMode} />}>
        {/* Widget Picker Bottom Sheet */}
        <MobileWidgetPicker
          isOpen={isWidgetPickerOpen}
          onClose={handleCloseWidgetPicker}
          onSelectWidget={handleSelectWidget}
          isDarkMode={isDarkMode}
        />

        {/* Properties Panel Bottom Sheet */}
        <MobilePropertiesPanel
          isOpen={isPropertiesPanelOpen}
          onClose={handleClosePropertiesPanel}
          selectedBlock={selectedBlock}
          selectedDef={selectedDef}
          onUpdateProps={handleUpdateProps}
          metadata={metadata}
          onMetadataChange={onMetadataChange}
          isDarkMode={isDarkMode}
        />

        {/* Preview Modal */}
        {previewUrl && (
          <MobilePreviewModal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            previewUrl={previewUrl}
            isDarkMode={isDarkMode}
            title={metadata.title || 'Preview'}
          />
        )}

        {/* Save Modal */}
        {onSaveWithPath && (
          <MobileSaveModal
            isOpen={isSaveModalOpen}
            onClose={() => setIsSaveModalOpen(false)}
            onSave={handleSaveWithPath}
            isSaving={isSaving}
            editingPath={editingPath || null}
            mode={saveMode}
            isDarkMode={isDarkMode}
          />
        )}

        {/* AI Prompt Modal */}
        {generateAIPrompt && onAIPromptDescriptionChange && (
          <MobileAIPromptModal
            isOpen={isAIPromptModalOpen}
            onClose={() => setIsAIPromptModalOpen(false)}
            websiteDescription={aiPromptDescription}
            onDescriptionChange={onAIPromptDescriptionChange}
            generatePrompt={generateAIPrompt}
            onPasteJSON={handleOpenPasteJSON}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Paste JSON Modal */}
        {onPasteJSON && (
          <MobilePasteJSONModal
            isOpen={isPasteJSONModalOpen}
            onClose={() => setIsPasteJSONModalOpen(false)}
            onSubmit={handlePasteJSONSubmit}
            isDarkMode={isDarkMode}
          />
        )}
      </Suspense>
    </div>
  );
});

// Display name for debugging
MobileBuilderLayout.displayName = 'MobileBuilderLayout';

export default MobileBuilderLayout;

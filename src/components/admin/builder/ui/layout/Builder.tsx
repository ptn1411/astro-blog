import React, { useMemo, useCallback } from 'react';

// Hooks
import { useBuilderState } from '../../hooks/useBuilderState';
import { useBuilderActions } from '../../hooks/useBuilderActions';
import { useBuilderKeyboard } from '../../hooks/useBuilderKeyboard';

// Layout Components
import { BuilderHeader, BuilderSidebar, BuilderCanvas } from './components';
import PagesManager from './PagesManager';
import { WidgetManager } from './WidgetManager';

// Modals
import { SaveModal } from '../modals/SaveModal';
import { TemplateModal } from '../modals/TemplateModal';
import { PasteJSONModal } from '../modals/PasteJSONModal';
import { AIPromptModal } from '../modals/AIPromptModal';

// Mobile Layout
import { MobileBuilderLayout } from '../../mobile/layout';
import { MobilePagesManager, type PageInfo } from '../../mobile/editors';

// Utils
import { generateAIPrompt } from '../../utils/aiPromptGenerator';
import { parseImportedJSON } from '../../services/export/exportActions';

export type { BuilderMode } from '../../hooks/useBuilderState';

// --- Main Builder Component ---
export default function BuilderApp() {
  // --- State Management ---
  const {
    state,
    setters,
    refs,
    history,
    autoSave,
    widgetRegistry,
    showMobileLayout,
  } = useBuilderState();

  const { iframeRef, fileInputRef } = refs;
  const { undo, redo, canUndo, canRedo } = history;
  const { lastSaved, clearStorage } = autoSave;

  // --- Actions ---
  const actions = useBuilderActions({
    state,
    setters,
    widgetRegistry,
    clearStorage,
    fileInputRef,
  });

  // --- Keyboard Shortcuts ---
  useBuilderKeyboard({
    undo,
    redo,
    setBlocks: setters.setBlocks,
  });

  // --- AI Prompt Generator ---
  const generatePrompt = useCallback(() => {
    return generateAIPrompt(widgetRegistry.widgets, state.websiteDescription);
  }, [widgetRegistry.widgets, state.websiteDescription]);

  // --- Mobile-specific callbacks ---
  const handleMobileUndo = useCallback(() => {
    const result = undo();
    if (result) setters.setBlocks(result);
  }, [undo, setters]);

  const handleMobileRedo = useCallback(() => {
    const result = redo();
    if (result) setters.setBlocks(result);
  }, [redo, setters]);

  const handleMobilePasteJSON = useCallback((json: string) => {
    const result = parseImportedJSON(json);
    if (result.success && result.blocks) {
      setters.setBlocks(result.blocks);
      if (result.metadata) setters.setMetadata(result.metadata);
      alert('Imported successfully!');
    } else {
      alert(result.error || 'Import failed');
    }
  }, [setters]);

  const handleMobileImportJSON = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return state.blocks.length > 0 || state.metadata.title !== 'Untitled Page';
  }, [state.blocks, state.metadata.title]);

  // --- Undo/Redo handlers for header ---
  const handleUndo = useCallback(() => {
    const result = undo();
    if (result) setters.setBlocks(result);
  }, [undo, setters]);

  const handleRedo = useCallback(() => {
    const result = redo();
    if (result) setters.setBlocks(result);
  }, [redo, setters]);

  // --- Render Mobile Layout ---
  if (showMobileLayout) {
    return (
      <div className={`h-screen ${state.isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <input type="file" ref={fileInputRef} onChange={actions.handleImportJSON} accept=".json" className="hidden" />
        
        {state.currentView === 'pages' ? (
          <MobilePagesManager
            pages={[]}
            isLoading={false}
            searchQuery={state.searchQuery}
            onSearchChange={setters.setSearchQuery}
            onEditPage={(page: PageInfo) => {
              actions.handleEditPage({
                blocks: [],
                metadata: { title: page.title, description: page.description },
                path: page.path,
              });
            }}
            onDeletePage={() => {}}
            onPreviewPage={(page: PageInfo) => {
              const previewPath = page.path
                .replace(/^src\/content\/page\//, '/')
                .replace(/^src\/content\//, '/')
                .replace(/\.mdx?$/, '');
              window.open(previewPath, '_blank');
            }}
            onCreateNew={actions.handleCreateNew}
            onRefresh={() => {}}
            isDarkMode={state.isDarkMode}
          />
        ) : (
          <MobileBuilderLayout
            blocks={state.blocks}
            selectedId={state.selectedId}
            metadata={state.metadata}
            onBlocksChange={setters.setBlocks}
            onSelectBlock={setters.setSelectedId}
            onMetadataChange={setters.setMetadata}
            onSave={() => setters.setIsSaveModalOpen(true)}
            onBack={() => setters.setCurrentView('pages')}
            isDarkMode={state.isDarkMode}
            currentView={state.currentView}
            onViewChange={setters.setCurrentView}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={state.isSaving}
            editingPath={state.editingPath}
            onUndo={handleMobileUndo}
            onRedo={handleMobileRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            onExportJSON={actions.handleExportJSON}
            onExportMDX={actions.handleExportMDX}
            onImportJSON={handleMobileImportJSON}
            onPasteJSON={handleMobilePasteJSON}
            onClearPage={actions.clearPage}
            onOpenTemplates={() => setters.setIsTemplateModalOpen(true)}
            previewUrl="/admin/preview"
            saveMode={state.builderMode}
            onSaveWithPath={actions.handleSave}
            aiPromptDescription={state.websiteDescription}
            onAIPromptDescriptionChange={setters.setWebsiteDescription}
            generateAIPrompt={generatePrompt}
          />
        )}
        
        <SaveModal
          editingPath={state.editingPath}
          isOpen={state.isSaveModalOpen}
          onClose={() => setters.setIsSaveModalOpen(false)}
          onSave={actions.handleSave}
          isSaving={state.isSaving}
          mode={state.builderMode}
        />
        <TemplateModal
          isOpen={state.isTemplateModalOpen}
          onClose={() => setters.setIsTemplateModalOpen(false)}
          onApply={actions.applyTemplate}
          onClear={actions.clearPage}
          isDarkMode={state.isDarkMode}
        />
      </div>
    );
  }

  // --- Desktop Layout ---
  return (
    <div
      className={`flex flex-col h-screen overflow-hidden transition-colors ${state.isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-slate-800'}`}
    >
      {/* Modals */}
      <SaveModal
        editingPath={state.editingPath}
        isOpen={state.isSaveModalOpen}
        onClose={() => setters.setIsSaveModalOpen(false)}
        onSave={actions.handleSave}
        isSaving={state.isSaving}
        mode={state.builderMode}
      />
      <TemplateModal
        isOpen={state.isTemplateModalOpen}
        onClose={() => setters.setIsTemplateModalOpen(false)}
        onApply={actions.applyTemplate}
        onClear={actions.clearPage}
        isDarkMode={state.isDarkMode}
      />
      {state.isWidgetManagerOpen && (
        <WidgetManager
          registry={widgetRegistry}
          isDarkMode={state.isDarkMode}
          onClose={() => setters.setIsWidgetManagerOpen(false)}
        />
      )}
      <PasteJSONModal
        isOpen={state.isPasteModalOpen}
        onClose={() => setters.setIsPasteModalOpen(false)}
        pasteJsonText={state.pasteJsonText}
        setPasteJsonText={setters.setPasteJsonText}
        onImport={actions.handlePasteImport}
        isDarkMode={state.isDarkMode}
      />
      <AIPromptModal
        isOpen={state.isAIPromptModalOpen}
        onClose={() => setters.setIsAIPromptModalOpen(false)}
        websiteDescription={state.websiteDescription}
        setWebsiteDescription={setters.setWebsiteDescription}
        generateAIPrompt={generatePrompt}
        onOpenPasteModal={() => setters.setIsPasteModalOpen(true)}
        isDarkMode={state.isDarkMode}
      />

      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} onChange={actions.handleImportJSON} accept=".json" className="hidden" />

      {/* Header */}
      <BuilderHeader
        currentView={state.currentView}
        setCurrentView={setters.setCurrentView}
        editingPath={state.editingPath}
        isDarkMode={state.isDarkMode}
        setIsDarkMode={setters.setIsDarkMode}
        previewMode={state.previewMode}
        setPreviewMode={setters.setPreviewMode}
        showBlocksPanel={state.showBlocksPanel}
        setShowBlocksPanel={setters.setShowBlocksPanel}
        showPropsPanel={state.showPropsPanel}
        setShowPropsPanel={setters.setShowPropsPanel}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        lastSaved={lastSaved}
        onOpenTemplates={() => setters.setIsTemplateModalOpen(true)}
        onOpenWidgetManager={() => setters.setIsWidgetManagerOpen(true)}
        onOpenPreview={actions.openPreviewInNewTab}
        onOpenSaveModal={() => setters.setIsSaveModalOpen(true)}
        onCreateNew={actions.handleCreateNew}
        isDownloadMenuOpen={state.isDownloadMenuOpen}
        setIsDownloadMenuOpen={setters.setIsDownloadMenuOpen}
        onExportJSON={actions.handleExportJSON}
        onExportMDX={actions.handleExportMDX}
        onImportFile={() => fileInputRef.current?.click()}
        onOpenPasteModal={() => setters.setIsPasteModalOpen(true)}
        onOpenAIPrompt={() => setters.setIsAIPromptModalOpen(true)}
      />

      {/* Main Content - Pages View */}
      {state.currentView === 'pages' && (
        <PagesManager
          onEditPage={actions.handleEditPage}
          onCreateNew={actions.handleCreateNew}
          isDarkMode={state.isDarkMode}
        />
      )}

      {/* Main Content - Builder View */}
      {state.currentView === 'builder' && (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <BuilderSidebar
            isDarkMode={state.isDarkMode}
            searchQuery={state.searchQuery}
            setSearchQuery={setters.setSearchQuery}
            widgets={widgetRegistry.widgets}
            collapsedCategories={state.collapsedCategories}
            toggleCategory={actions.toggleCategory}
          />

          {/* Canvas */}
          <BuilderCanvas
            isDarkMode={state.isDarkMode}
            blocks={state.blocks}
            selectedId={state.selectedId}
            setSelectedId={setters.setSelectedId}
            showBlocksPanel={state.showBlocksPanel}
            showPropsPanel={state.showPropsPanel}
            setShowPropsPanel={setters.setShowPropsPanel}
            previewMode={state.previewMode}
            iframeRef={iframeRef}
            onDragEnd={actions.handleDragEnd}
            onDelete={actions.deleteBlock}
            onDuplicate={actions.duplicateBlock}
            updateBlockProps={actions.updateBlockProps}
            metadata={state.metadata}
            setMetadata={setters.setMetadata}
            getWidget={widgetRegistry.getWidget}
          />
        </div>
      )}
    </div>
  );
}

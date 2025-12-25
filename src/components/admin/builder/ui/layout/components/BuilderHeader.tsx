import {
  CloudUpload,
  Download,
  ExternalLink,
  Files,
  Layers,
  Monitor,
  Moon,
  PanelLeft,
  PanelRight,
  PenSquare,
  Plus,
  Redo2,
  Save,
  Settings,
  Smartphone,
  Sun,
  Undo2,
} from 'lucide-react';
import React from 'react';
import type { BuilderMode, PreviewMode, ViewType } from '../../../hooks/useBuilderState';
import { DownloadMenu } from './DownloadMenu';

interface BuilderHeaderProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  editingPath: string | null;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
  showBlocksPanel: boolean;
  setShowBlocksPanel: (value: boolean) => void;
  showPropsPanel: boolean;
  setShowPropsPanel: (value: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  lastSaved: Date | null;
  onOpenTemplates: () => void;
  onOpenWidgetManager: () => void;
  onOpenPreview: () => void;
  onOpenSaveModal: () => void;
  onCreateNew: () => void;
  // Download menu props
  isDownloadMenuOpen: boolean;
  setIsDownloadMenuOpen: (value: boolean) => void;
  onExportJSON: () => void;
  onExportMDX: () => void;
  onImportFile: () => void;
  onOpenPasteModal: () => void;
  onOpenAIPrompt: () => void;
}

export function BuilderHeader({
  currentView,
  setCurrentView,
  editingPath,
  isDarkMode,
  setIsDarkMode,
  previewMode,
  setPreviewMode,
  showBlocksPanel,
  setShowBlocksPanel,
  showPropsPanel,
  setShowPropsPanel,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  lastSaved,
  onOpenTemplates,
  onOpenWidgetManager,
  onOpenPreview,
  onOpenSaveModal,
  onCreateNew,
  isDownloadMenuOpen,
  setIsDownloadMenuOpen,
  onExportJSON,
  onExportMDX,
  onImportFile,
  onOpenPasteModal,
  onOpenAIPrompt,
}: BuilderHeaderProps) {
  return (
    <header
      className={`px-4 py-3 flex items-center justify-between shadow-sm z-10 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Phạm Thành Nam - Astro Builder
        </h1>
        {/* View Toggle Tabs */}
        <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <button
            onClick={() => setCurrentView('pages')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
              currentView === 'pages'
                ? isDarkMode
                  ? 'bg-gray-600 text-white'
                  : 'bg-white shadow text-gray-800'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Files size={16} /> Pages
          </button>
          <button
            onClick={() => setCurrentView('builder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
              currentView === 'builder'
                ? isDarkMode
                  ? 'bg-gray-600 text-white'
                  : 'bg-white shadow text-gray-800'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <PenSquare size={16} /> Builder
          </button>
        </div>
        {/* Editing indicator */}
        {editingPath && currentView === 'builder' && (
          <span
            className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}
          >
            ✏️ Editing: {editingPath.split('/').pop()}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {currentView === 'builder' && (
          <>
            {/* Undo/Redo */}
            <div className={`flex rounded-md p-1 mr-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`p-1.5 rounded transition-colors ${!canUndo ? 'opacity-40 cursor-not-allowed' : isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={18} />
              </button>
              <button
                onClick={onRedo}
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
              onClick={onOpenTemplates}
              className={`p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Page Templates"
            >
              <Layers size={20} />
            </button>

            {/* Widget Manager Button */}
            <button
              onClick={onOpenWidgetManager}
              className={`p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Manage Custom Widgets"
            >
              <Settings size={20} />
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
          </>
        )}
        {currentView === 'builder' && (
          <>
            <div className={`w-px h-4 mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
            <button
              onClick={() => setShowBlocksPanel(!showBlocksPanel)}
              className={`p-1.5 rounded-md transition-colors ${
                showBlocksPanel
                  ? isDarkMode
                    ? 'bg-gray-600 text-white'
                    : 'bg-white shadow text-gray-800'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-800'
              }`}
              title="Toggle Blocks Panel"
            >
              <PanelLeft size={16} />
            </button>
            <button
              onClick={() => setShowPropsPanel(!showPropsPanel)}
              className={`p-1.5 rounded-md transition-colors ${
                showPropsPanel
                  ? isDarkMode
                    ? 'bg-gray-600 text-white'
                    : 'bg-white shadow text-gray-800'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-800'
              }`}
              title="Toggle Properties Panel"
            >
              <PanelRight size={16} />
            </button>
            <div className={`w-px h-4 mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
          </>
        )}
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-600'}`}
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {currentView === 'builder' && (
          <>
            {/* Download Menu */}
            <DownloadMenu
              isDarkMode={isDarkMode}
              isOpen={isDownloadMenuOpen}
              setIsOpen={setIsDownloadMenuOpen}
              onExportJSON={onExportJSON}
              onExportMDX={onExportMDX}
              onImportFile={onImportFile}
              onOpenPasteModal={onOpenPasteModal}
              onOpenAIPrompt={onOpenAIPrompt}
            />

            {/* Save & Preview */}
            <button
              onClick={onOpenPreview}
              className={`flex items-center gap-1 px-3 py-2 text-sm rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <ExternalLink size={18} /> Preview
            </button>
            <button
              onClick={onOpenSaveModal}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
            >
              <CloudUpload size={18} /> Save
            </button>
          </>
        )}

        {currentView === 'pages' && (
          <button
            onClick={onCreateNew}
            className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
          >
            <Plus size={18} /> New Page
          </button>
        )}
      </div>
    </header>
  );
}

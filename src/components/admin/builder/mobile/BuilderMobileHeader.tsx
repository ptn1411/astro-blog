import React, { useState, useCallback } from 'react';
import {
  ArrowLeft,
  Save,
  MoreVertical,
  X,
  Files,
  PenSquare,
  Download,
  Upload,
  Clipboard,
  Sparkles,
  FileText,
  Code,
  Trash2,
  Undo2,
  Redo2,
} from 'lucide-react';

/**
 * BuilderMobileHeader Component - Compact header for mobile page builder
 * Requirements: 5.1, 5.2, 5.3, 5.4
 * 
 * Implements:
 * - Collapsed header with back, title, and save buttons
 * - View toggle (Pages/Builder) in header
 * - Menu icon for additional options (slide-out menu)
 * - Unsaved changes state tracking
 */

export interface BuilderMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export interface BuilderMobileHeaderProps {
  /** Title to display in the header */
  title: string;
  /** Current view mode */
  currentView: 'pages' | 'builder';
  /** Callback when view changes */
  onViewChange: (view: 'pages' | 'builder') => void;
  /** Callback when back button is pressed */
  onBack: () => void;
  /** Callback when save button is pressed */
  onSave: () => void;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Whether dark mode is enabled */
  isDarkMode?: boolean;
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
  onPasteJSON?: () => void;
  onAIPrompt?: () => void;
  onClearPage?: () => void;
  onOpenTemplates?: () => void;
}

export const BuilderMobileHeader: React.FC<BuilderMobileHeaderProps> = ({
  title,
  currentView,
  onViewChange,
  onBack,
  onSave,
  hasUnsavedChanges,
  isSaving = false,
  isDarkMode = true,
  editingPath,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onExportJSON,
  onExportMDX,
  onImportJSON,
  onPasteJSON,
  onAIPrompt,
  onClearPage,
  onOpenTemplates,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Handle back button click
  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  // Handle save button click
  const handleSave = useCallback(() => {
    if (!isSaving) {
      onSave();
    }
  }, [onSave, isSaving]);

  // Handle menu toggle
  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  // Close menu
  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // Handle menu item click
  const handleMenuItemClick = useCallback((callback?: () => void) => {
    setIsMenuOpen(false);
    callback?.();
  }, []);

  // Build menu items based on current view
  const menuItems: BuilderMenuItem[] = currentView === 'builder' ? [
    ...(onUndo ? [{
      id: 'undo',
      label: 'Undo',
      icon: <Undo2 size={18} />,
      onClick: () => handleMenuItemClick(onUndo),
      disabled: !canUndo,
    }] : []),
    ...(onRedo ? [{
      id: 'redo',
      label: 'Redo',
      icon: <Redo2 size={18} />,
      onClick: () => handleMenuItemClick(onRedo),
      disabled: !canRedo,
    }] : []),
    ...(onOpenTemplates ? [{
      id: 'templates',
      label: 'Templates',
      icon: <FileText size={18} />,
      onClick: () => handleMenuItemClick(onOpenTemplates),
    }] : []),
    ...(onAIPrompt ? [{
      id: 'ai-prompt',
      label: 'AI Prompt Generator',
      icon: <Sparkles size={18} />,
      onClick: () => handleMenuItemClick(onAIPrompt),
    }] : []),
    ...(onExportJSON ? [{
      id: 'export-json',
      label: 'Export JSON',
      icon: <Download size={18} />,
      onClick: () => handleMenuItemClick(onExportJSON),
    }] : []),
    ...(onExportMDX ? [{
      id: 'export-mdx',
      label: 'Export MDX',
      icon: <Code size={18} />,
      onClick: () => handleMenuItemClick(onExportMDX),
    }] : []),
    ...(onImportJSON ? [{
      id: 'import-json',
      label: 'Import JSON File',
      icon: <Upload size={18} />,
      onClick: () => handleMenuItemClick(onImportJSON),
    }] : []),
    ...(onPasteJSON ? [{
      id: 'paste-json',
      label: 'Paste JSON',
      icon: <Clipboard size={18} />,
      onClick: () => handleMenuItemClick(onPasteJSON),
    }] : []),
    ...(onClearPage ? [{
      id: 'clear-page',
      label: 'Clear Page',
      icon: <Trash2 size={18} />,
      onClick: () => handleMenuItemClick(onClearPage),
      destructive: true,
    }] : []),
  ] : [];

  return (
    <>
      {/* Header */}
      <header
        className={`flex-shrink-0 h-14 flex items-center px-2 gap-1 z-20 border-b ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}
      >
        {/* Back button */}
        <button
          onClick={handleBack}
          className={`p-3 rounded-lg transition-colors touch-manipulation ${
            isDarkMode 
              ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          aria-label="Go back"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <ArrowLeft size={20} />
        </button>

        {/* View Toggle - Compact tabs */}
        <div 
          className={`flex rounded-lg p-0.5 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}
        >
          <button
            onClick={() => onViewChange('pages')}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded-md transition-colors touch-manipulation ${
              currentView === 'pages'
                ? isDarkMode
                  ? 'bg-gray-600 text-white'
                  : 'bg-white shadow text-gray-800'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{ minHeight: '32px' }}
          >
            <Files size={14} />
            <span className="hidden xs:inline">Pages</span>
          </button>
          <button
            onClick={() => onViewChange('builder')}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded-md transition-colors touch-manipulation ${
              currentView === 'builder'
                ? isDarkMode
                  ? 'bg-gray-600 text-white'
                  : 'bg-white shadow text-gray-800'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{ minHeight: '32px' }}
          >
            <PenSquare size={14} />
            <span className="hidden xs:inline">Builder</span>
          </button>
        </div>

        {/* Title and editing indicator */}
        <div className="flex-1 min-w-0 px-2">
          <h1 
            className={`font-medium truncate text-sm ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
          >
            {title}
          </h1>
          {editingPath && currentView === 'builder' && (
            <span 
              className={`text-xs truncate block ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`}
            >
              ✏️ {editingPath.split('/').pop()}
            </span>
          )}
          {hasUnsavedChanges && currentView === 'builder' && (
            <span className="text-xs text-amber-400">Unsaved</span>
          )}
        </div>

        {/* Save button (only in builder view) */}
        {currentView === 'builder' && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`p-3 rounded-lg transition-colors touch-manipulation flex items-center gap-1 ${
              !isSaving
                ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700'
                : isDarkMode
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-gray-400 cursor-not-allowed'
            }`}
            aria-label={isSaving ? 'Saving...' : 'Save'}
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={20} />
            )}
          </button>
        )}

        {/* Menu button (only in builder view) */}
        {currentView === 'builder' && menuItems.length > 0 && (
          <button
            onClick={handleMenuToggle}
            className={`p-3 rounded-lg transition-colors touch-manipulation ${
              isDarkMode 
                ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <MoreVertical size={20} />
          </button>
        )}
      </header>

      {/* Slide-over menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={handleCloseMenu}
            aria-hidden="true"
          />

          {/* Menu panel */}
          <div
            className={`fixed top-0 right-0 bottom-0 w-64 shadow-xl z-40 animate-slide-in-right ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            {/* Menu header */}
            <div 
              className={`h-14 flex items-center justify-between px-4 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Menu
              </span>
              <button
                onClick={handleCloseMenu}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
                aria-label="Close menu"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu items */}
            <nav className="py-2 overflow-y-auto max-h-[calc(100vh-56px)]">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors touch-manipulation ${
                    item.disabled
                      ? isDarkMode
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-300 cursor-not-allowed'
                      : item.destructive
                        ? 'text-red-400 hover:bg-red-500/10'
                        : isDarkMode
                          ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </>
      )}

      {/* CSS for slide-in animation */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default BuilderMobileHeader;

import React, { useState, useCallback } from 'react';
import { ArrowLeft, Save, MoreVertical, X } from 'lucide-react';
import { ConfirmationDialog } from './ConfirmationDialog';

/**
 * MobileHeader Component - Collapsed header for mobile story editor
 * Requirements: 7.1, 7.2, 7.5
 * 
 * Implements:
 * - Collapsed header with back, title, and save buttons
 * - Menu icon for additional options
 * - Unsaved changes state tracking
 * - Confirmation dialog when navigating with unsaved changes
 */

export interface MobileHeaderProps {
  /** Title to display in the header */
  title: string;
  /** Callback when back button is pressed */
  onBack: () => void;
  /** Callback when save button is pressed */
  onSave: () => void;
  /** Callback when menu is opened */
  onMenuOpen: () => void;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Additional menu items */
  menuItems?: MenuItem[];
  /** Whether to show confirmation dialog on back with unsaved changes */
  confirmOnBack?: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

/** Default menu items for the story editor */
const DEFAULT_MENU_ITEMS: MenuItem[] = [];

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  onBack,
  onSave,
  onMenuOpen,
  hasUnsavedChanges,
  isSaving = false,
  menuItems = DEFAULT_MENU_ITEMS,
  confirmOnBack = true,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Handle back button click
  const handleBack = useCallback(() => {
    // Property 8: Unsaved Changes Confirmation
    // For any navigation action when hasUnsavedChanges is true,
    // the system SHALL display a confirmation dialog before proceeding
    if (hasUnsavedChanges && confirmOnBack) {
      setShowConfirmDialog(true);
    } else {
      onBack();
    }
  }, [hasUnsavedChanges, confirmOnBack, onBack]);

  // Handle confirmation dialog confirm
  const handleConfirmBack = useCallback(() => {
    setShowConfirmDialog(false);
    onBack();
  }, [onBack]);

  // Handle confirmation dialog cancel
  const handleCancelBack = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  // Handle save button click
  const handleSave = useCallback(() => {
    if (!isSaving) {
      onSave();
    }
  }, [onSave, isSaving]);

  // Handle menu toggle
  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
    if (!isMenuOpen) {
      onMenuOpen();
    }
  }, [isMenuOpen, onMenuOpen]);

  // Handle menu item click
  const handleMenuItemClick = useCallback((item: MenuItem) => {
    setIsMenuOpen(false);
    item.onClick();
  }, []);

  // Close menu
  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <>
      {/* Header */}
      <header className="flex-shrink-0 h-14 bg-slate-800 border-b border-slate-700 flex items-center px-2 gap-1 z-20">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="p-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors touch-manipulation"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0 px-2">
          <h1 className="text-white font-medium truncate text-sm">
            {title}
          </h1>
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-400">Unsaved changes</span>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
          className={`p-3 rounded-lg transition-colors touch-manipulation flex items-center gap-1 ${
            hasUnsavedChanges && !isSaving
              ? 'text-blue-400 hover:text-blue-300 hover:bg-slate-700'
              : 'text-slate-500 cursor-not-allowed'
          }`}
          aria-label={isSaving ? 'Saving...' : 'Save'}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={20} />
          )}
        </button>

        {/* Menu button */}
        <button
          onClick={handleMenuToggle}
          className="p-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors touch-manipulation"
          aria-label="Open menu"
          aria-expanded={isMenuOpen}
        >
          <MoreVertical size={20} />
        </button>
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
            className="fixed top-0 right-0 bottom-0 w-64 bg-slate-800 shadow-xl z-40 animate-slide-in-right"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            {/* Menu header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-700">
              <span className="text-white font-medium">Menu</span>
              <button
                onClick={handleCloseMenu}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu items */}
            <nav className="py-2">
              {menuItems.length > 0 ? (
                menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item)}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                      item.destructive
                        ? 'text-red-400 hover:bg-red-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                    <span>{item.label}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-slate-500 text-sm">
                  No menu items
                </div>
              )}
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

      {/* Unsaved changes confirmation dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelBack}
        onConfirm={handleConfirmBack}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
        confirmLabel="Leave"
        cancelLabel="Stay"
        destructive
      />
    </>
  );
};

export default MobileHeader;

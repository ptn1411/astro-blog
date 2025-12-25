import React, { useState, useCallback, useRef } from 'react';
import { 
  Edit, 
  Eye, 
  FolderOpen, 
  Plus, 
  RefreshCw, 
  Search, 
  Trash2, 
  X,
  ChevronRight,
} from 'lucide-react';
import { BUILDER_TOUCH_CONFIG } from '../config/breakpoints.constants';
import { ConfirmationDialog } from '../../shared/mobile';

/**
 * MobilePagesManager Component - Mobile-optimized pages list and management
 * Requirements: 4.1, 4.2, 4.3, 4.4, 3.4
 * 
 * Implements:
 * - Single-column card layout for mobile viewports
 * - Full-width search input for easy access
 * - Tap to show action buttons (Edit, Preview, Delete)
 * - Swipe gestures for navigation
 * - Mobile-friendly delete confirmation dialog
 */

export interface PageInfo {
  path: string;
  title: string;
  description: string;
  lastModified?: string;
  hasBuilderData: boolean;
  sha?: string;
}

export interface MobilePagesManagerProps {
  /** List of pages to display */
  pages: PageInfo[];
  /** Whether pages are currently loading */
  isLoading: boolean;
  /** Current search query */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Callback when user wants to edit a page */
  onEditPage: (page: PageInfo) => void;
  /** Callback when user wants to delete a page */
  onDeletePage: (page: PageInfo) => void;
  /** Callback when user wants to preview a page */
  onPreviewPage: (page: PageInfo) => void;
  /** Callback when user wants to create a new page */
  onCreateNew: () => void;
  /** Callback to refresh the pages list */
  onRefresh: () => void;
  /** Whether dark mode is enabled */
  isDarkMode?: boolean;
  /** Page currently being loaded (for loading state) */
  loadingPage?: string | null;
}

/**
 * MobilePageCard - Individual page card with touch interactions
 */
interface MobilePageCardProps {
  page: PageInfo;
  isExpanded: boolean;
  isLoading: boolean;
  onTap: () => void;
  onEdit: () => void;
  onPreview: () => void;
  onDelete: () => void;
  onSwipeLeft: () => void;
  isDarkMode: boolean;
}

const MobilePageCard: React.FC<MobilePageCardProps> = ({
  page,
  isExpanded,
  isLoading,
  onTap,
  onEdit,
  onPreview,
  onDelete,
  onSwipeLeft,
  isDarkMode,
}) => {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    setIsSwipeActive(false);
  }, []);

  // Handle touch move for swipe detection
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Only track horizontal swipes (ignore vertical scrolling)
    if (deltaY < Math.abs(deltaX) && Math.abs(deltaX) > 10) {
      setIsSwipeActive(true);
      // Only allow left swipe (negative deltaX)
      if (deltaX < 0) {
        setSwipeOffset(Math.max(deltaX, -100));
      }
    }
  }, []);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current) return;

    const deltaTime = Date.now() - touchStartRef.current.time;
    
    // Check if it was a swipe gesture
    if (isSwipeActive && swipeOffset < -BUILDER_TOUCH_CONFIG.swipeThreshold) {
      // Swipe left detected - trigger delete action
      onSwipeLeft();
      // Provide haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    } else if (!isSwipeActive && deltaTime < 300) {
      // Quick tap - toggle expanded state
      onTap();
    }

    // Reset state
    touchStartRef.current = null;
    setSwipeOffset(0);
    setIsSwipeActive(false);
  }, [isSwipeActive, swipeOffset, onTap, onSwipeLeft]);

  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    touchStartRef.current = null;
    setSwipeOffset(0);
    setIsSwipeActive(false);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete action revealed on swipe */}
      <div 
        className="absolute inset-y-0 right-0 w-24 bg-red-500 flex items-center justify-center"
        style={{ opacity: Math.min(1, Math.abs(swipeOffset) / 80) }}
      >
        <Trash2 size={24} className="text-white" />
      </div>

      {/* Card content */}
      <div
        className={`
          relative p-4 border-2 rounded-xl transition-all duration-200 touch-manipulation
          ${isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
          }
          ${isExpanded 
            ? isDarkMode 
              ? 'border-blue-500 ring-2 ring-blue-500/20' 
              : 'border-blue-500 ring-2 ring-blue-100'
            : ''
          }
        `}
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwipeActive ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onClick={() => !isSwipeActive && onTap()}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold text-base truncate ${
                isDarkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                {page.title}
              </h3>
              {page.hasBuilderData && (
                <span className={`flex-shrink-0 px-2 py-0.5 text-xs rounded-full ${
                  isDarkMode 
                    ? 'bg-green-900/50 text-green-300' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  ✓ Builder
                </span>
              )}
            </div>
            <p className={`text-sm truncate mt-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {page.path}
            </p>
          </div>
          
          <ChevronRight 
            size={20} 
            className={`flex-shrink-0 transition-transform duration-200 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            } ${isExpanded ? 'rotate-90' : ''}`}
          />
        </div>

        {/* Description */}
        {page.description && (
          <p className={`text-sm mt-2 line-clamp-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {page.description}
          </p>
        )}

        {/* Last modified */}
        {page.lastModified && (
          <p className={`text-xs mt-2 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Last modified: {new Date(page.lastModified).toLocaleString()}
          </p>
        )}

        {/* Expanded action buttons */}
        {isExpanded && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dashed ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              disabled={isLoading}
              className={`
                flex-1 flex items-center justify-center gap-2 py-3 rounded-lg 
                font-medium transition-colors touch-manipulation
                ${isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white'
                }
                disabled:opacity-50
              `}
              style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
            >
              {isLoading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Edit size={18} />
              )}
              {isLoading ? 'Loading...' : 'Edit'}
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
              className={`
                p-3 rounded-lg transition-colors touch-manipulation
                ${isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-gray-200' 
                  : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700'
                }
              `}
              style={{ 
                minWidth: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px`,
                minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px`,
              }}
              aria-label="Preview page"
            >
              <Eye size={20} />
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className={`
                p-3 rounded-lg transition-colors touch-manipulation
                ${isDarkMode 
                  ? 'bg-red-900/50 hover:bg-red-800 active:bg-red-700 text-red-300' 
                  : 'bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600'
                }
              `}
              style={{ 
                minWidth: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px`,
                minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px`,
              }}
              aria-label="Delete page"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main MobilePagesManager Component
 * Wrapped with React.memo to prevent unnecessary re-renders (Requirement 10.4)
 */
export const MobilePagesManager: React.FC<MobilePagesManagerProps> = React.memo(({
  pages,
  isLoading,
  searchQuery,
  onSearchChange,
  onEditPage,
  onDeletePage,
  onPreviewPage,
  onCreateNew,
  onRefresh,
  isDarkMode = true,
  loadingPage = null,
}) => {
  const [expandedPagePath, setExpandedPagePath] = useState<string | null>(null);
  const [deleteConfirmPage, setDeleteConfirmPage] = useState<PageInfo | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter pages based on search query
  const filteredPages = pages.filter(
    (page) =>
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle page card tap - toggle expanded state
  const handlePageTap = useCallback((pagePath: string) => {
    setExpandedPagePath((prev) => (prev === pagePath ? null : pagePath));
  }, []);

  // Handle edit action
  const handleEdit = useCallback((page: PageInfo) => {
    onEditPage(page);
  }, [onEditPage]);

  // Handle preview action
  const handlePreview = useCallback((page: PageInfo) => {
    onPreviewPage(page);
  }, [onPreviewPage]);

  // Handle delete action - show confirmation
  const handleDeleteRequest = useCallback((page: PageInfo) => {
    setDeleteConfirmPage(page);
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirmPage) {
      onDeletePage(deleteConfirmPage);
      setDeleteConfirmPage(null);
      setExpandedPagePath(null);
    }
  }, [deleteConfirmPage, onDeletePage]);

  // Handle swipe left on card - show delete confirmation
  const handleSwipeLeft = useCallback((page: PageInfo) => {
    setDeleteConfirmPage(page);
  }, []);

  // Clear search
  const handleClearSearch = useCallback(() => {
    onSearchChange('');
    searchInputRef.current?.focus();
  }, [onSearchChange]);

  return (
    <div className={`min-h-screen flex flex-col ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className={`flex-shrink-0 px-4 py-3 border-b ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            📄 Pages
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`p-2 rounded-lg transition-colors touch-manipulation ${
                isDarkMode 
                  ? 'hover:bg-gray-700 active:bg-gray-600 text-gray-300' 
                  : 'hover:bg-gray-100 active:bg-gray-200 text-gray-600'
              }`}
              style={{ 
                minWidth: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px`,
                minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px`,
              }}
              aria-label="Refresh pages"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg font-medium transition-colors touch-manipulation"
              style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
            >
              <Plus size={18} />
              New
            </button>
          </div>
        </div>

        {/* Full-width search input */}
        <div className="relative">
          <Search
            size={18}
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-10 py-3 rounded-xl border text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-blue-500'
            }`}
            style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-600' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto overscroll-contain p-4">
        {isLoading ? (
          // Loading state
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw size={32} className="animate-spin text-blue-500 mb-4" />
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Loading pages...
            </p>
          </div>
        ) : filteredPages.length === 0 ? (
          // Empty state
          <div className={`
            flex flex-col items-center justify-center py-12 px-6 text-center
            rounded-xl border-2 border-dashed
            ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
          `}>
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center mb-4
              ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}
            `}>
              <FolderOpen size={32} className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} />
            </div>
            <p className={`text-lg font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {searchQuery ? 'No pages found' : 'No pages yet'}
            </p>
            <p className={`text-sm mb-4 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>
              {searchQuery 
                ? 'Try a different search term' 
                : 'Create your first page to get started'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={onCreateNew}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-medium transition-colors touch-manipulation"
                style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
              >
                Create your first page
              </button>
            )}
          </div>
        ) : (
          // Pages list
          <div className="space-y-3">
            {filteredPages.map((page) => (
              <MobilePageCard
                key={page.path}
                page={page}
                isExpanded={expandedPagePath === page.path}
                isLoading={loadingPage === page.path}
                onTap={() => handlePageTap(page.path)}
                onEdit={() => handleEdit(page)}
                onPreview={() => handlePreview(page)}
                onDelete={() => handleDeleteRequest(page)}
                onSwipeLeft={() => handleSwipeLeft(page)}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteConfirmPage}
        onClose={() => setDeleteConfirmPage(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Page"
        message={`Are you sure you want to delete "${deleteConfirmPage?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
      />
    </div>
  );
});

// Display name for debugging
MobilePagesManager.displayName = 'MobilePagesManager';

export default MobilePagesManager;

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { BottomSheet } from '../../shared/mobile';
import { WIDGET_CATEGORIES, WIDGET_REGISTRY, type WidgetType, type WidgetCategory } from '../config/registry';
import { BUILDER_TOUCH_CONFIG } from '../config/breakpoints.constants';

/**
 * MobileWidgetPicker Component - Mobile-friendly widget selection using BottomSheet
 * Requirements: 7.1, 7.2, 7.3, 7.4
 * 
 * Implements:
 * - BottomSheet container for widget selection
 * - Horizontal scrollable category tabs
 * - Search input at top of sheet
 * - Widget selection with auto-close and haptic feedback
 */

export interface MobileWidgetPickerProps {
  /** Whether the picker is open */
  isOpen: boolean;
  /** Callback when picker should close */
  onClose: () => void;
  /** Callback when a widget is selected */
  onSelectWidget: (type: WidgetType | string) => void;
  /** Whether dark mode is enabled */
  isDarkMode?: boolean;
}

/**
 * Trigger haptic feedback if available
 * Uses the Vibration API for tactile feedback on widget selection
 */
function triggerHapticFeedback(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    // Short vibration for selection feedback
    navigator.vibrate(10);
  }
}

export const MobileWidgetPicker: React.FC<MobileWidgetPickerProps> = ({
  isOpen,
  onClose,
  onSelectWidget,
  isDarkMode = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<WidgetCategory | 'all'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setActiveCategory('all');
    }
  }, [isOpen]);

  // Filter widgets based on search query and category
  const filteredWidgets = useMemo(() => {
    let widgets = WIDGET_REGISTRY;

    // Filter by category
    if (activeCategory !== 'all') {
      widgets = widgets.filter((w) => w.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      widgets = widgets.filter(
        (w) =>
          w.label.toLowerCase().includes(query) ||
          w.type.toLowerCase().includes(query)
      );
    }

    return widgets;
  }, [searchQuery, activeCategory]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  }, []);

  // Handle category tab click
  const handleCategoryClick = useCallback((categoryId: WidgetCategory | 'all') => {
    setActiveCategory(categoryId);
  }, []);

  // Handle widget selection
  const handleWidgetSelect = useCallback((type: WidgetType) => {
    // Trigger haptic feedback
    triggerHapticFeedback();
    
    // Add widget to canvas
    onSelectWidget(type);
    
    // Auto-close sheet after selection
    onClose();
  }, [onSelectWidget, onClose]);

  // Group widgets by category for display
  const widgetsByCategory = useMemo(() => {
    const grouped: Record<string, typeof WIDGET_REGISTRY> = {};
    
    for (const widget of filteredWidgets) {
      if (!grouped[widget.category]) {
        grouped[widget.category] = [];
      }
      grouped[widget.category].push(widget);
    }
    
    return grouped;
  }, [filteredWidgets]);

  // All categories including "All" option
  const allCategories = useMemo(() => [
    { id: 'all' as const, label: '📋 All' },
    ...WIDGET_CATEGORIES,
  ], []);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Add Widget"
      snapPoints={BUILDER_TOUCH_CONFIG.bottomSheetSnapPoints as unknown as number[]}
      initialSnap={1} // Start at 60% height
    >
      <div className="flex flex-col h-full">
        {/* Search Input */}
        <div className="flex-shrink-0 px-4 pb-3">
          <div className="relative">
            <Search 
              size={18} 
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search widgets..."
              className={`w-full pl-10 pr-10 py-3 rounded-lg border text-sm transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500'
                  : 'bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs - Horizontal Scrollable */}
        <div 
          ref={categoryScrollRef}
          className={`flex-shrink-0 overflow-x-auto scrollbar-hide border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div className="flex px-4 pb-2 gap-2 min-w-max">
            {allCategories.map((category) => {
              const isActive = category.id === activeCategory;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors touch-manipulation ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Widget Grid */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">
          {filteredWidgets.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p className="text-sm">No widgets found</p>
              {searchQuery && (
                <p className="text-xs mt-1">Try a different search term</p>
              )}
            </div>
          ) : activeCategory === 'all' && !searchQuery ? (
            // Show grouped by category when "All" is selected and no search
            <div className="space-y-6">
              {WIDGET_CATEGORIES.map((category) => {
                const categoryWidgets = widgetsByCategory[category.id];
                if (!categoryWidgets || categoryWidgets.length === 0) return null;

                return (
                  <div key={category.id}>
                    <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {category.label}
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {categoryWidgets.map((widget) => (
                        <WidgetCard
                          key={widget.type}
                          widget={widget}
                          isDarkMode={isDarkMode}
                          onSelect={handleWidgetSelect}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Show flat grid when category is selected or searching
            <div className="grid grid-cols-3 gap-2">
              {filteredWidgets.map((widget) => (
                <WidgetCard
                  key={widget.type}
                  widget={widget}
                  isDarkMode={isDarkMode}
                  onSelect={handleWidgetSelect}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hide scrollbar styles */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </BottomSheet>
  );
};

/**
 * WidgetCard Component - Individual widget item in the picker grid
 */
interface WidgetCardProps {
  widget: typeof WIDGET_REGISTRY[number];
  isDarkMode: boolean;
  onSelect: (type: WidgetType | string) => void;
}

const WidgetCard: React.FC<WidgetCardProps> = ({ widget, isDarkMode, onSelect }) => {
  const IconComponent = widget.icon;

  return (
    <button
      onClick={() => onSelect(widget.type)}
      className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all touch-manipulation active:scale-95 ${
        isDarkMode
          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500 active:bg-gray-500'
          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100'
      }`}
      style={{ 
        minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget * 2}px`,
        minWidth: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px`,
      }}
      aria-label={`Add ${widget.label} widget`}
    >
      <span className={`mb-1.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
        <IconComponent size={24} />
      </span>
      <span className={`text-xs text-center leading-tight line-clamp-2 ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        {widget.label}
      </span>
    </button>
  );
};

export default MobileWidgetPicker;

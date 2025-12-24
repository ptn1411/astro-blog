import React, { useState, useCallback, useRef } from 'react';
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2, X } from 'lucide-react';
import { BUILDER_TOUCH_CONFIG } from '../constants/breakpoints';
import { ImagePicker } from '../ImagePicker';
import { IconPicker } from '../IconPicker';

/**
 * MobileArrayEditor Component - Touch-friendly array item management
 * Requirements: 8.3
 * 
 * Implements:
 * - Touch-optimized array item management
 * - Swipe-to-delete for array items
 * - Large touch targets (44px minimum)
 * - Expandable item editing
 */

export interface ArrayItemField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'icon' | 'boolean' | 'number' | 'select';
  placeholder?: string;
  options?: { label: string; value: string }[];
}

export interface MobileArrayEditorProps {
  /** Array value */
  value: unknown[];
  /** Callback when array changes */
  onChange: (value: unknown[]) => void;
  /** Whether dark mode is enabled */
  isDarkMode?: boolean;
  /** Schema for array items */
  itemSchema?: ArrayItemField[];
}

/** Default schema if none provided */
const DEFAULT_SCHEMA: ArrayItemField[] = [
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'description', label: 'Description', type: 'textarea' },
];

/** Swipe threshold for delete action */
const SWIPE_DELETE_THRESHOLD = 100;

export const MobileArrayEditor: React.FC<MobileArrayEditorProps> = ({
  value = [],
  onChange,
  isDarkMode = true,
  itemSchema = DEFAULT_SCHEMA,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [swipeState, setSwipeState] = useState<{
    index: number;
    startX: number;
    currentX: number;
  } | null>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Add new item
  const addItem = useCallback(() => {
    const newItem: Record<string, unknown> = {};
    itemSchema.forEach((field) => {
      if (field.type === 'boolean') newItem[field.key] = false;
      else if (field.type === 'number') newItem[field.key] = 0;
      else newItem[field.key] = '';
    });
    onChange([...value, newItem]);
    setExpandedIndex(value.length);
  }, [value, onChange, itemSchema]);

  // Remove item
  const removeItem = useCallback((index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  }, [value, onChange, expandedIndex]);

  // Update item field
  const updateItem = useCallback((index: number, key: string, newVal: unknown) => {
    const newValue = value.map((item, i) => {
      if (i === index) {
        const itemObj = item as Record<string, unknown>;
        // Support nested keys like "image.src"
        if (key.includes('.')) {
          const keys = key.split('.');
          const newItem = { ...itemObj };
          let current: Record<string, unknown> = newItem;
          for (let j = 0; j < keys.length - 1; j++) {
            if (!current[keys[j]]) {
              current[keys[j]] = {};
            } else {
              current[keys[j]] = { ...(current[keys[j]] as Record<string, unknown>) };
            }
            current = current[keys[j]] as Record<string, unknown>;
          }
          current[keys[keys.length - 1]] = newVal;
          return newItem;
        }
        return { ...itemObj, [key]: newVal };
      }
      return item;
    });
    onChange(newValue);
  }, [value, onChange]);

  // Get nested value from item
  const getNestedValue = useCallback((item: unknown, key: string): unknown => {
    if (!key.includes('.')) return (item as Record<string, unknown>)[key];
    const keys = key.split('.');
    let current = item;
    for (const k of keys) {
      current = (current as Record<string, unknown>)?.[k];
    }
    return current;
  }, []);

  // Move item up/down
  const moveItem = useCallback((index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === value.length - 1) return;

    const newValue = [...value];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newValue[index], newValue[newIndex]] = [newValue[newIndex], newValue[index]];
    onChange(newValue);

    if (expandedIndex === index) {
      setExpandedIndex(newIndex);
    } else if (expandedIndex === newIndex) {
      setExpandedIndex(index);
    }
  }, [value, onChange, expandedIndex]);

  // Handle touch start for swipe-to-delete
  const handleTouchStart = useCallback((index: number, e: React.TouchEvent) => {
    setSwipeState({
      index,
      startX: e.touches[0].clientX,
      currentX: e.touches[0].clientX,
    });
  }, []);

  // Handle touch move for swipe-to-delete
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeState) return;
    setSwipeState({
      ...swipeState,
      currentX: e.touches[0].clientX,
    });
  }, [swipeState]);

  // Handle touch end for swipe-to-delete
  const handleTouchEnd = useCallback(() => {
    if (!swipeState) return;
    
    const deltaX = swipeState.startX - swipeState.currentX;
    
    // If swiped left past threshold, delete the item
    if (deltaX > SWIPE_DELETE_THRESHOLD) {
      removeItem(swipeState.index);
    }
    
    setSwipeState(null);
  }, [swipeState, removeItem]);

  // Get swipe offset for item
  const getSwipeOffset = useCallback((index: number): number => {
    if (!swipeState || swipeState.index !== index) return 0;
    const deltaX = swipeState.startX - swipeState.currentX;
    // Only allow left swipe (positive delta)
    return Math.max(0, Math.min(deltaX, SWIPE_DELETE_THRESHOLD + 50));
  }, [swipeState]);

  // Get item preview text
  const getItemPreview = useCallback((item: unknown): string => {
    const obj = item as Record<string, unknown>;
    return (
      (obj?.title as string) ||
      (obj?.text as string) ||
      (obj?.name as string) ||
      ((obj?.description as string)?.slice(0, 30)) ||
      ((obj?.src as string)?.split('/').pop()) ||
      'Untitled'
    );
  }, []);

  // Input class for consistent styling
  const inputClass = `w-full px-4 py-3 rounded-lg border text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-800 placeholder:text-gray-500 focus:border-blue-500'
  }`;

  // Render field based on type
  const renderField = (field: ArrayItemField, item: unknown, index: number) => {
    const val = getNestedValue(item, field.key);

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            className={inputClass}
            rows={3}
            value={(val as string) || ''}
            onChange={(e) => updateItem(index, field.key, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            style={{ minHeight: '80px' }}
          />
        );

      case 'image':
        return (
          <ImagePicker
            value={(val as string) || ''}
            onChange={(v) => updateItem(index, field.key, v)}
            isDarkMode={isDarkMode}
          />
        );

      case 'icon':
        return (
          <IconPicker
            value={(val as string) || ''}
            onChange={(v) => updateItem(index, field.key, v)}
            isDarkMode={isDarkMode}
          />
        );

      case 'boolean':
        return (
          <button
            onClick={() => updateItem(index, field.key, !val)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors touch-manipulation ${
              val
                ? 'bg-blue-500 border-blue-500 text-white'
                : isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-300'
                  : 'bg-white border-gray-300 text-gray-700'
            }`}
            style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              val ? 'border-white bg-white' : isDarkMode ? 'border-gray-500' : 'border-gray-400'
            }`}>
              {val ? <span className="text-blue-500 text-xs">✓</span> : null}
            </div>
            <span>{val ? 'Yes' : 'No'}</span>
          </button>
        );

      case 'number':
        return (
          <input
            type="number"
            className={inputClass}
            value={(val as number) || ''}
            onChange={(e) => updateItem(index, field.key, parseInt(e.target.value) || 0)}
            placeholder={field.placeholder}
            style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
          />
        );

      case 'select':
        return (
          <select
            className={inputClass}
            value={(val as string) || ''}
            onChange={(e) => updateItem(index, field.key, e.target.value)}
            style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            className={inputClass}
            value={(val as string) || ''}
            onChange={(e) => updateItem(index, field.key, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
          />
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* Items List */}
      {value.length > 0 ? (
        <div className="space-y-2">
          {value.map((item, index) => {
            const isExpanded = expandedIndex === index;
            const swipeOffset = getSwipeOffset(index);
            const isDeleting = swipeOffset > SWIPE_DELETE_THRESHOLD;

            return (
              <div
                key={index}
                ref={(el) => {
                  if (el) itemRefs.current.set(index, el);
                  else itemRefs.current.delete(index);
                }}
                className="relative overflow-hidden rounded-lg"
              >
                {/* Delete background (revealed on swipe) */}
                <div 
                  className={`absolute inset-y-0 right-0 flex items-center justify-end px-4 transition-colors ${
                    isDeleting ? 'bg-red-500' : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.max(swipeOffset, 60)}px` }}
                >
                  <Trash2 size={20} className="text-white" />
                </div>

                {/* Item content */}
                <div
                  className={`relative border rounded-lg transition-transform ${
                    isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
                  }`}
                  style={{
                    transform: `translateX(-${swipeOffset}px)`,
                    transition: swipeState ? 'none' : 'transform 0.2s ease-out',
                  }}
                  onTouchStart={(e) => handleTouchStart(index, e)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Item Header */}
                  <div
                    className={`flex items-center gap-2 p-3 cursor-pointer touch-manipulation ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
                  >
                    <GripVertical 
                      size={16} 
                      className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} 
                    />
                    <span className={`flex-1 text-sm truncate ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {getItemPreview(item)}
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      #{index + 1}
                    </span>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveItem(index, 'up');
                        }}
                        disabled={index === 0}
                        className={`p-2 rounded-lg transition-colors touch-manipulation ${
                          index === 0
                            ? 'opacity-30 cursor-not-allowed'
                            : isDarkMode
                              ? 'hover:bg-gray-600 text-gray-400 active:bg-gray-500'
                              : 'hover:bg-gray-200 text-gray-500 active:bg-gray-300'
                        }`}
                        style={{ minWidth: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px`, minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveItem(index, 'down');
                        }}
                        disabled={index === value.length - 1}
                        className={`p-2 rounded-lg transition-colors touch-manipulation ${
                          index === value.length - 1
                            ? 'opacity-30 cursor-not-allowed'
                            : isDarkMode
                              ? 'hover:bg-gray-600 text-gray-400 active:bg-gray-500'
                              : 'hover:bg-gray-200 text-gray-500 active:bg-gray-300'
                        }`}
                        style={{ minWidth: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px`, minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(index);
                        }}
                        className={`p-2 rounded-lg transition-colors touch-manipulation ${
                          isDarkMode
                            ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400 active:bg-red-500/30'
                            : 'hover:bg-red-100 text-gray-500 hover:text-red-600 active:bg-red-200'
                        }`}
                        style={{ minWidth: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px`, minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Item Fields (Expanded) */}
                  {isExpanded && (
                    <div className={`p-4 border-t space-y-4 ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      {itemSchema.map((field) => (
                        <div key={field.key}>
                          <label className={`block text-sm mb-2 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {field.label}
                          </label>
                          {renderField(field, item, index)}
                        </div>
                      ))}
                      
                      {/* Close button for expanded item */}
                      <button
                        onClick={() => setExpandedIndex(null)}
                        className={`w-full py-3 rounded-lg border transition-colors touch-manipulation flex items-center justify-center gap-2 ${
                          isDarkMode
                            ? 'border-gray-600 text-gray-400 hover:bg-gray-700 active:bg-gray-600'
                            : 'border-gray-300 text-gray-500 hover:bg-gray-100 active:bg-gray-200'
                        }`}
                        style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
                      >
                        <X size={16} />
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className={`text-center py-6 text-sm border rounded-lg border-dashed ${
            isDarkMode ? 'text-gray-500 border-gray-600' : 'text-gray-400 border-gray-300'
          }`}
        >
          No items yet. Tap the button below to add one.
        </div>
      )}

      {/* Add Button */}
      <button
        type="button"
        onClick={addItem}
        className={`w-full py-4 text-base rounded-lg border border-dashed flex items-center justify-center gap-2 transition-colors touch-manipulation ${
          isDarkMode
            ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-gray-300 hover:border-gray-500 active:bg-gray-600'
            : 'border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-700 hover:border-gray-400 active:bg-gray-200'
        }`}
        style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
      >
        <Plus size={20} />
        Add Item
      </button>

      {/* Swipe hint */}
      {value.length > 0 && (
        <p className={`text-xs text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Swipe left on an item to delete
        </p>
      )}
    </div>
  );
};

export default MobileArrayEditor;

import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { IconPicker } from '../pickers/IconPicker';
import { ImagePicker } from '../pickers/ImagePicker';

export interface ArrayItemField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'icon' | 'boolean' | 'number' | 'select';
  placeholder?: string;
  options?: { label: string; value: string }[];
}

interface ArrayEditorProps {
  value: any[];
  onChange: (value: any[]) => void;
  isDarkMode: boolean;
  itemSchema?: ArrayItemField[];
}

const DEFAULT_SCHEMA: ArrayItemField[] = [
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'description', label: 'Description', type: 'textarea' },
];

export function ArrayEditor({ value = [], onChange, isDarkMode, itemSchema = DEFAULT_SCHEMA }: ArrayEditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const addItem = () => {
    const newItem: Record<string, any> = {};
    itemSchema.forEach((field) => {
      if (field.type === 'boolean') newItem[field.key] = false;
      else if (field.type === 'number') newItem[field.key] = 0;
      else newItem[field.key] = '';
    });
    onChange([...value, newItem]);
    setExpandedIndex(value.length);
  };

  const removeItem = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const updateItem = (index: number, key: string, newVal: any) => {
    const newValue = value.map((item, i) => {
      if (i === index) {
        // Support nested keys like "image.src"
        if (key.includes('.')) {
          const keys = key.split('.');
          const newItem = { ...item };
          let current: any = newItem;
          for (let j = 0; j < keys.length - 1; j++) {
            if (!current[keys[j]]) {
              current[keys[j]] = {};
            } else {
              current[keys[j]] = { ...current[keys[j]] };
            }
            current = current[keys[j]];
          }
          current[keys[keys.length - 1]] = newVal;
          return newItem;
        }
        return { ...item, [key]: newVal };
      }
      return item;
    });
    onChange(newValue);
  };

  // Helper to get nested value
  const getNestedValue = (item: any, key: string) => {
    if (!key.includes('.')) return item[key];
    const keys = key.split('.');
    let current = item;
    for (const k of keys) {
      current = current?.[k];
    }
    return current;
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
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
  };

  const inputClass = `w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
  }`;

  const getItemPreview = (item: any) => {
    return (
      item?.title ||
      item?.text ||
      item?.name ||
      item?.description?.slice(0, 30) ||
      item?.src?.split('/').pop() ||
      'Untitled'
    );
  };

  const renderField = (field: ArrayItemField, item: any, index: number) => {
    const val = getNestedValue(item, field.key);

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            className={inputClass}
            rows={3}
            value={val || ''}
            onChange={(e) => updateItem(index, field.key, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
        );
      case 'image':
        return (
          <ImagePicker value={val || ''} onChange={(v) => updateItem(index, field.key, v)} isDarkMode={isDarkMode} />
        );
      case 'icon':
        return (
          <IconPicker value={val || ''} onChange={(v) => updateItem(index, field.key, v)} isDarkMode={isDarkMode} />
        );

      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={!!val}
            onChange={(e) => updateItem(index, field.key, e.target.checked)}
            className="w-4 h-4"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            className={inputClass}
            value={val || ''}
            onChange={(e) => updateItem(index, field.key, parseInt(e.target.value) || 0)}
          />
        );
      case 'select':
        return (
          <select
            className={inputClass}
            value={val || ''}
            onChange={(e) => updateItem(index, field.key, e.target.value)}
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
            value={val || ''}
            onChange={(e) => updateItem(index, field.key, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {/* Items List */}
      {value.length > 0 ? (
        <div className="space-y-2">
          {value.map((item, index) => {
            const isExpanded = expandedIndex === index;

            return (
              <div
                key={index}
                className={`border rounded transition-colors ${
                  isDarkMode ? 'border-gray-600 bg-gray-750' : 'border-gray-300 bg-gray-50'
                }`}
              >
                {/* Item Header */}
                <div
                  className={`flex items-center gap-2 p-2 cursor-pointer ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                >
                  <GripVertical size={14} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                  <span className={`flex-1 text-sm truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {getItemPreview(item)}
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>#{index + 1}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveItem(index, 'up');
                      }}
                      disabled={index === 0}
                      className={`p-1 rounded transition-colors ${
                        index === 0
                          ? 'opacity-30 cursor-not-allowed'
                          : isDarkMode
                            ? 'hover:bg-gray-600 text-gray-400'
                            : 'hover:bg-gray-200 text-gray-500'
                      }`}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveItem(index, 'down');
                      }}
                      disabled={index === value.length - 1}
                      className={`p-1 rounded transition-colors ${
                        index === value.length - 1
                          ? 'opacity-30 cursor-not-allowed'
                          : isDarkMode
                            ? 'hover:bg-gray-600 text-gray-400'
                            : 'hover:bg-gray-200 text-gray-500'
                      }`}
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(index);
                      }}
                      className={`p-1 rounded transition-colors ${
                        isDarkMode
                          ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400'
                          : 'hover:bg-red-100 text-gray-500 hover:text-red-600'
                      }`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Item Fields (Expanded) */}
                {isExpanded && (
                  <div className={`p-3 border-t space-y-3 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    {itemSchema.map((field) => (
                      <div key={field.key}>
                        <label
                          className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          {field.label}
                        </label>
                        {renderField(field, item, index)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className={`text-center py-4 text-sm border rounded border-dashed ${
            isDarkMode ? 'text-gray-500 border-gray-600' : 'text-gray-400 border-gray-300'
          }`}
        >
          No items yet
        </div>
      )}

      {/* Add Button */}
      <button
        type="button"
        onClick={addItem}
        className={`w-full p-2 text-sm rounded border border-dashed flex items-center justify-center gap-2 transition-colors ${
          isDarkMode
            ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-gray-300 hover:border-gray-500'
            : 'border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-700 hover:border-gray-400'
        }`}
      >
        <Plus size={16} /> Add Item
      </button>
    </div>
  );
}

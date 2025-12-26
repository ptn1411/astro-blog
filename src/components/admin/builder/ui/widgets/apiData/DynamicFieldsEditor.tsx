/**
 * DynamicFieldsEditor - Component for editing dynamic field mappings
 */

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { DynamicField, FieldType } from '../../../core/types/apiDataWidget.types';
import { FIELD_TYPE_OPTIONS } from '../../../core/types/apiDataWidget.types';

export interface DynamicFieldsEditorProps {
  fields: DynamicField[];
  onChange: (fields: DynamicField[]) => void;
  isDarkMode: boolean;
}

/**
 * Generate a unique ID for a new field
 */
function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const DynamicFieldsEditor: React.FC<DynamicFieldsEditorProps> = ({
  fields,
  onChange,
  isDarkMode,
}) => {
  const inputClass = `w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
  }`;

  const selectClass = `w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none ${
    isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'
  }`;

  const addField = () => {
    const newField: DynamicField = {
      id: generateFieldId(),
      label: '',
      path: '',
      type: 'text',
    };
    onChange([...fields, newField]);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<DynamicField>) => {
    onChange(
      fields.map((field, i) => (i === index ? { ...field, ...updates } : field))
    );
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= fields.length) return;
    const newFields = [...fields];
    const [removed] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, removed);
    onChange(newFields);
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 text-xs font-medium mb-1">
        <div className={`col-span-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}></div>
        <div className={`col-span-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Label</div>
        <div className={`col-span-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Path</div>
        <div className={`col-span-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Type</div>
        <div className={`col-span-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}></div>
      </div>

      {/* Field rows */}
      {fields.map((field, index) => (
        <div
          key={field.id}
          className={`grid grid-cols-12 gap-2 items-center p-2 rounded ${
            isDarkMode ? 'bg-gray-750 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
          }`}
        >
          {/* Drag handle */}
          <div className="col-span-1 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => moveField(index, index - 1)}
              disabled={index === 0}
              className={`p-1 rounded transition-colors ${
                index === 0
                  ? 'opacity-30 cursor-not-allowed'
                  : isDarkMode
                  ? 'hover:bg-gray-600 text-gray-400'
                  : 'hover:bg-gray-200 text-gray-500'
              }`}
              title="Move up"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => moveField(index, index + 1)}
              disabled={index === fields.length - 1}
              className={`p-1 rounded transition-colors ${
                index === fields.length - 1
                  ? 'opacity-30 cursor-not-allowed'
                  : isDarkMode
                  ? 'hover:bg-gray-600 text-gray-400'
                  : 'hover:bg-gray-200 text-gray-500'
              }`}
              title="Move down"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Label */}
          <div className="col-span-3">
            <input
              type="text"
              className={inputClass}
              value={field.label}
              onChange={(e) => updateField(index, { label: e.target.value })}
              placeholder="Display label"
            />
          </div>

          {/* Path */}
          <div className="col-span-4">
            <input
              type="text"
              className={inputClass}
              value={field.path}
              onChange={(e) => updateField(index, { path: e.target.value })}
              placeholder="data.field.path"
            />
          </div>

          {/* Type */}
          <div className="col-span-3">
            <select
              className={selectClass}
              value={field.type}
              onChange={(e) => updateField(index, { type: e.target.value as FieldType })}
            >
              {FIELD_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Delete button */}
          <div className="col-span-1 flex justify-center">
            <button
              type="button"
              onClick={() => removeField(index)}
              className={`p-1.5 rounded transition-colors ${
                isDarkMode
                  ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400'
                  : 'hover:bg-red-100 text-gray-500 hover:text-red-600'
              }`}
              title="Remove field"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      {/* Empty state */}
      {fields.length === 0 && (
        <div
          className={`text-center py-6 rounded border border-dashed ${
            isDarkMode ? 'border-gray-600 text-gray-500' : 'border-gray-300 text-gray-400'
          }`}
        >
          <p className="text-sm">No fields configured</p>
          <p className="text-xs mt-1">Click "Add Field" to start mapping data</p>
        </div>
      )}

      {/* Add button */}
      <button
        type="button"
        onClick={addField}
        className={`w-full p-2 text-sm rounded border border-dashed flex items-center justify-center gap-2 transition-colors ${
          isDarkMode
            ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500'
            : 'border-gray-300 text-gray-500 hover:bg-gray-100 hover:border-gray-400'
        }`}
      >
        <Plus size={16} /> Add Field
      </button>

      {/* Help text */}
      <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        <p className="font-medium mb-1">Field Types:</p>
        <ul className="space-y-0.5 ml-2">
          <li><span className="font-medium">Text</span> - Plain text display</li>
          <li><span className="font-medium">Image</span> - Display as image</li>
          <li><span className="font-medium">Price</span> - Format as currency</li>
          <li><span className="font-medium">Link</span> - Clickable link</li>
          <li><span className="font-medium">Badge</span> - Colored badge/tag</li>
          <li><span className="font-medium">HTML</span> - Render as HTML</li>
        </ul>
      </div>
    </div>
  );
};

export default DynamicFieldsEditor;

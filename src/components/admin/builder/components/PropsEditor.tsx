import React from 'react';
import { ArrayEditor } from '../ArrayEditor';
import { IconPicker } from '../IconPicker';
import { ImagePicker } from '../ImagePicker';
import type { WidgetSchema } from '../registry';
import type { BuilderBlock } from '../types';
import { JsonEditor } from './JsonEditor';

// Deep clone helper (or import from utils)
const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

interface PropsEditorProps {
  selectedBlock: BuilderBlock | null;
  selectedDef: WidgetSchema | null;
  updateBlockProps: (id: string, newProps: Record<string, unknown>) => void;
  metadata: { title: string; description: string };
  setMetadata: React.Dispatch<React.SetStateAction<{ title: string; description: string }>>;
  isDarkMode: boolean;
}

export function PropsEditor({
  selectedBlock,
  selectedDef,
  updateBlockProps,
  metadata,
  setMetadata,
  isDarkMode,
}: PropsEditorProps) {
  if (!selectedBlock || !selectedDef) {
    return (
      <div className="space-y-4">
        <div
          className={`p-3 rounded text-sm ${isDarkMode ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300' : 'bg-blue-50 border border-blue-100 text-blue-800'}`}
        >
          <strong>Page Settings</strong>
          <p className="text-xs mt-1 opacity-80">Edit page metadata when no widget is selected.</p>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Page Title
          </label>
          <input
            type="text"
            className={`w-full p-2 border rounded text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
            value={metadata.title}
            onChange={(e) => setMetadata((prev) => ({ ...prev, title: e.target.value }))}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Description
          </label>
          <textarea
            className={`w-full p-2 border rounded text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
            rows={4}
            value={metadata.description}
            onChange={(e) => setMetadata((prev) => ({ ...prev, description: e.target.value }))}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedDef.fields.map((field) => {
        const keys = field.name.split('.');
        let currentValue: unknown = selectedBlock.props;
        for (const key of keys) {
          currentValue = (currentValue as Record<string, unknown>)?.[key];
        }

        const handleUpdate = (val: unknown) => {
          const newProps = deepClone(selectedBlock.props);
          const propKeys = field.name.split('.');
          const lastKey = propKeys.pop()!;
          const target = propKeys.reduce((acc: Record<string, unknown>, key: string) => {
            acc[key] = acc[key] || {};
            return acc[key] as Record<string, unknown>;
          }, newProps);
          target[lastKey] = val;
          updateBlockProps(selectedBlock.id, newProps);
        };

        return (
          <div key={field.name}>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                className={`w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500' : 'bg-white border-gray-300 placeholder:text-gray-400'}`}
                rows={4}
                value={(currentValue as string) || ''}
                onChange={(e) => handleUpdate(e.target.value)}
                placeholder={field.placeholder}
              />
            ) : field.type === 'boolean' ? (
              <input
                type="checkbox"
                checked={!!currentValue}
                onChange={(e) => handleUpdate(e.target.checked)}
                className="w-4 h-4"
              />
            ) : field.type === 'number' ? (
              <input
                type="number"
                className={`w-full p-2 border rounded text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500' : 'bg-white border-gray-300 placeholder:text-gray-400'}`}
                value={(currentValue as number) || ''}
                onChange={(e) => handleUpdate(parseInt(e.target.value) || 0)}
                placeholder={field.placeholder}
              />
            ) : field.type === 'json' ? (
              <JsonEditor value={currentValue} onChange={handleUpdate} isDarkMode={isDarkMode} />
            ) : field.type === 'image' ? (
              <ImagePicker value={(currentValue as string) || ''} onChange={handleUpdate} isDarkMode={isDarkMode} />
            ) : field.type === 'icon' ? (
              <IconPicker value={(currentValue as string) || ''} onChange={handleUpdate} isDarkMode={isDarkMode} />
            ) : field.type === 'array' ? (
              <ArrayEditor
                value={Array.isArray(currentValue) ? currentValue : []}
                onChange={handleUpdate}
                isDarkMode={isDarkMode}
                itemSchema={field.arraySchema}
              />
            ) : (
              <input
                type="text"
                className={`w-full p-2 border rounded text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500' : 'bg-white border-gray-300 placeholder:text-gray-400'}`}
                value={(currentValue as string) || ''}
                onChange={(e) => handleUpdate(e.target.value)}
                placeholder={field.placeholder}
              />
            )}

            {field.type === 'select' && (
              <select
                className={`w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'
                }`}
                value={(currentValue as string) || ''}
                onChange={(e) => handleUpdate(e.target.value)}
              >
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}

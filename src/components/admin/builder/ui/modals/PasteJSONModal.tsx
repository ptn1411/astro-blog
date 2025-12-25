import { X } from 'lucide-react';
import React from 'react';

interface PasteJSONModalProps {
  isOpen: boolean;
  onClose: () => void;
  pasteJsonText: string;
  setPasteJsonText: (text: string) => void;
  onImport: () => void;
  isDarkMode: boolean;
}

export function PasteJSONModal({
  isOpen,
  onClose,
  pasteJsonText,
  setPasteJsonText,
  onImport,
  isDarkMode,
}: PasteJSONModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-full max-w-2xl mx-4 rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Import JSON</h2>
          <button
            onClick={() => {
              onClose();
              setPasteJsonText('');
            }}
            className={`p-1 rounded hover:bg-gray-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'}`}
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Paste your JSON content below:
          </p>
          <textarea
            value={pasteJsonText}
            onChange={(e) => setPasteJsonText(e.target.value)}
            placeholder='{"blocks": [...], "metadata": {...}}'
            className={`w-full h-64 p-3 text-sm font-mono rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400'}`}
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                onClose();
                setPasteJsonText('');
              }}
              className={`px-4 py-2 text-sm rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              Cancel
            </button>
            <button
              onClick={onImport}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
            >
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

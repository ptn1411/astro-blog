import { Clipboard, Code, Download, FileText, Sparkles, Upload } from 'lucide-react';
import React from 'react';

interface DownloadMenuProps {
  isDarkMode: boolean;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  onExportJSON: () => void;
  onExportMDX: () => void;
  onImportFile: () => void;
  onOpenPasteModal: () => void;
  onOpenAIPrompt: () => void;
}

export function DownloadMenu({
  isDarkMode,
  isOpen,
  setIsOpen,
  onExportJSON,
  onExportMDX,
  onImportFile,
  onOpenPasteModal,
  onOpenAIPrompt,
}: DownloadMenuProps) {
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-3 py-2 text-sm rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
      >
        <Download size={18} /> More
      </button>
      {isOpen && (
        <>
          {/* Overlay to close menu when clicking outside */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div
            className={`absolute right-0 top-full mt-1 w-48 rounded-lg shadow-xl z-20 py-1 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
          >
            <button
              onClick={onExportJSON}
              className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
            >
              <Code size={16} /> Export JSON
            </button>
            <button
              onClick={onExportMDX}
              className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
            >
              <FileText size={16} /> Export MDX
            </button>
            <hr className={`my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
            <button
              onClick={onImportFile}
              className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
            >
              <Upload size={16} /> Import File
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenPasteModal();
              }}
              className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
            >
              <Clipboard size={16} /> Paste JSON
            </button>
            <hr className={`my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAIPrompt();
              }}
              className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-purple-400' : 'hover:bg-gray-50 text-purple-600'}`}
            >
              <Sparkles size={16} /> AI Prompt
            </button>
          </div>
        </>
      )}
    </div>
  );
}

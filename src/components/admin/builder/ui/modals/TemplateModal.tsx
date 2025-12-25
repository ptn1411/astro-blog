import { Layers, Trash2, X } from 'lucide-react';
import { PAGE_TEMPLATES } from '../../config/templates';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (templateId: string) => void;
  onClear: () => void;
  isDarkMode: boolean;
}

export function TemplateModal({ isOpen, onClose, onApply, onClear, isDarkMode }: TemplateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-full max-w-2xl rounded-lg shadow-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            <Layers size={20} className="inline mr-2" /> Page Templates
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X size={20} />
          </button>
        </div>
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Choose a template to start with. This will replace your current page content.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
          {PAGE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => onApply(template.id)}
              className={`p-4 rounded-lg border text-left transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                  : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              <div className={`font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {template.name}
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{template.description}</div>
              <div className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {template.blocks.length} blocks
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={onClear}
            className={`px-4 py-2 text-sm rounded transition-colors ${
              isDarkMode ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-100'
            }`}
          >
            <Trash2 size={14} className="inline mr-1" /> Clear Page
          </button>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm rounded transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

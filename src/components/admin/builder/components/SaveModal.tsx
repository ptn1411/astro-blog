import { X } from 'lucide-react';
import { useState } from 'react';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (path: string, message: string) => void;
  isSaving: boolean;
}

const BASE_PATH = 'src/content/page/';

export function SaveModal({ isOpen, onClose, onSave, isSaving }: SaveModalProps) {
  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // For local: only filename, for GitHub: full path
  const [fileName, setFileName] = useState('new-page.mdx');
  const [fullPath, setFullPath] = useState('src/content/page/new-page.mdx');
  const [message, setMessage] = useState('Create new page from builder');

  if (!isOpen) return null;

  const handleSave = () => {
    const finalPath = isLocal ? `${BASE_PATH}${fileName}` : fullPath;
    onSave(finalPath, message);
  };

  // Auto-add .mdx extension if missing
  const handleFileNameChange = (value: string) => {
    let name = value.trim();
    // Remove any path separators
    name = name.replace(/[/\\]/g, '');
    setFileName(name);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{isLocal ? 'Save Locally' : 'Save to GitHub'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          {isLocal ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-2 rounded-l border border-r-0 border-gray-300">
                  {BASE_PATH}
                </span>
                <input
                  type="text"
                  className="flex-1 p-2 border rounded-r text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={fileName}
                  onChange={(e) => handleFileNameChange(e.target.value)}
                  placeholder="new-page.mdx"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Full path:{' '}
                <code className="bg-gray-100 px-1 rounded">
                  {BASE_PATH}
                  {fileName}
                </code>
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Path</label>
              <input
                type="text"
                className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={fullPath}
                onChange={(e) => setFullPath(e.target.value)}
                placeholder="src/content/page/new-page.mdx"
              />
              <p className="text-xs text-gray-500 mt-1">Relative to repository root</p>
            </div>
          )}
          <div>
            {isLocal ? (
              <div className="p-2 bg-yellow-50 text-yellow-800 text-xs rounded mb-2">
                Saving directly to local file system.
              </div>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commit Message</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : isLocal ? 'Save File' : 'Commit to GitHub'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

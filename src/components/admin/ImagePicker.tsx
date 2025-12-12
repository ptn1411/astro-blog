import { Image, X } from 'lucide-react';
import { useState } from 'react';

interface ImagePickerProps {
  value: string;
  onChange: (value: string) => void;
  isDarkMode: boolean;
  label?: string;
}

export function ImagePicker({ value, onChange, isDarkMode, label }: ImagePickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(value || '');
  const [imageError, setImageError] = useState(false);

  const handleSave = () => {
    onChange(tempUrl);
    setIsModalOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setTempUrl('');
  };

  const inputClass = `w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
  }`;

  return (
    <div className="space-y-2">
      {/* Preview + Input */}
      <div className="flex gap-2">
        <div
          className={`w-16 h-16 rounded border flex items-center justify-center overflow-hidden flex-shrink-0 ${
            isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'
          }`}
        >
          {value && !imageError ? (
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
            />
          ) : (
            <Image size={24} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
          )}
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <input
            type="text"
            className={inputClass}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setImageError(false);
            }}
            placeholder="Image URL..."
          />
          <div className="flex gap-1">
            <button
              onClick={() => {
                setTempUrl(value);
                setIsModalOpen(true);
              }}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                isDarkMode
                  ? 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Browse
            </button>
            {value && (
              <button
                onClick={handleClear}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  isDarkMode
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                    : 'bg-red-100 hover:bg-red-200 text-red-600'
                }`}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-full max-w-lg rounded-lg shadow-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {label || 'Select Image'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-1 rounded transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                className={inputClass}
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="Paste image URL here..."
                autoFocus
              />

              {/* Large Preview */}
              <div
                className={`w-full h-48 rounded border flex items-center justify-center overflow-hidden ${
                  isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'
                }`}
              >
                {tempUrl ? (
                  <img
                    src={tempUrl}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />
                ) : (
                  <div className={`text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Image size={48} className="mx-auto mb-2" />
                    <p className="text-sm">No image selected</p>
                  </div>
                )}
              </div>

              {/* Sample Images */}
              <div>
                <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quick samples:</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400',
                    'https://images.unsplash.com/photo-1616198814651-e71f960c3180?w=400',
                    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400',
                  ].map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setTempUrl(url)}
                      className={`w-12 h-12 rounded border overflow-hidden transition-colors ${
                        tempUrl === url
                          ? 'ring-2 ring-blue-500'
                          : isDarkMode
                            ? 'border-gray-600 hover:border-gray-500'
                            : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-4 py-2 text-sm rounded transition-colors ${
                  isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded"
              >
                Select Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, FileText, AlertCircle } from 'lucide-react';
import { BottomSheet } from '../../story/mobile/BottomSheet';
import { GITHUB_CONFIG } from '../../config';
import { BUILDER_TOUCH_CONFIG } from '../constants/breakpoints';

/**
 * MobileSaveModal Component - Mobile-optimized save form using BottomSheet
 * Requirements: 9.1
 * 
 * Implements:
 * - Mobile-optimized save form
 * - Full-width inputs for easy touch interaction
 * - Large buttons with 44px minimum touch targets
 * - Local vs GitHub save mode detection
 */

export interface MobileSaveModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when save is triggered */
  onSave: (path: string, message: string) => void;
  /** Whether save is in progress */
  isSaving: boolean;
  /** Path being edited (if any) */
  editingPath: string | null;
  /** Mode: create new page or edit existing */
  mode: 'create' | 'edit';
  /** Whether dark mode is enabled */
  isDarkMode?: boolean;
}

const BASE_PATH = GITHUB_CONFIG.contentPaths.pages + '/';

/** Snap points for the bottom sheet: 60%, 90% */
const SNAP_POINTS = [0.6, 0.9];

export const MobileSaveModal: React.FC<MobileSaveModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving,
  editingPath,
  mode,
  isDarkMode = true,
}) => {
  // Detect if running locally
  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Form state
  const [fileName, setFileName] = useState('new-page.mdx');
  const [fullPath, setFullPath] = useState('src/content/page/new-page.mdx');
  const [message, setMessage] = useState('Create new page from builder');
  const [error, setError] = useState<string | null>(null);

  // Reset form when mode or editingPath changes
  useEffect(() => {
    if (mode === 'edit' && editingPath) {
      setFileName(editingPath.replace(BASE_PATH, ''));
      setFullPath(editingPath);
      setMessage('Update page from builder');
    }

    if (mode === 'create') {
      setFileName('new-page.mdx');
      setFullPath(`${BASE_PATH}new-page.mdx`);
      setMessage('Create new page from builder');
    }
    
    setError(null);
  }, [mode, editingPath, isOpen]);

  // Handle file name change (local mode)
  const handleFileNameChange = useCallback((value: string) => {
    let name = value.trim();
    // Remove any path separators
    name = name.replace(/[/\\]/g, '');
    setFileName(name);
    setError(null);
  }, []);

  // Handle full path change (GitHub mode)
  const handleFullPathChange = useCallback((value: string) => {
    setFullPath(value);
    setError(null);
  }, []);

  // Handle commit message change
  const handleMessageChange = useCallback((value: string) => {
    setMessage(value);
  }, []);

  // Validate and save
  const handleSave = useCallback(() => {
    // Validate file name
    const finalPath = isLocal ? `${BASE_PATH}${fileName}` : fullPath;
    
    if (!fileName.trim() && isLocal) {
      setError('Please enter a file name');
      return;
    }
    
    if (!fullPath.trim() && !isLocal) {
      setError('Please enter a file path');
      return;
    }

    // Ensure .mdx extension
    let savePath = finalPath;
    if (!savePath.endsWith('.mdx')) {
      savePath += '.mdx';
    }

    onSave(savePath, message);
  }, [isLocal, fileName, fullPath, message, onSave]);

  // Input class for consistent styling
  const inputClass = `w-full px-4 py-4 rounded-xl border text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-800 placeholder:text-gray-500 focus:border-blue-500'
  }`;

  // Get title based on mode and environment
  const getTitle = () => {
    if (mode === 'edit') {
      return isLocal ? 'Save Changes' : 'Commit Changes';
    }
    return isLocal ? 'Create New Page' : 'Create Page on GitHub';
  };

  // Get save button text
  const getSaveButtonText = () => {
    if (isSaving) return 'Saving...';
    if (mode === 'edit') {
      return isLocal ? 'Save Changes' : 'Commit Update';
    }
    return isLocal ? 'Create File' : 'Commit New Page';
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      snapPoints={SNAP_POINTS}
      initialSnap={0}
    >
      <div className="flex flex-col h-full">
        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-6">
          {/* Environment indicator */}
          {isLocal ? (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${
              isDarkMode 
                ? 'bg-amber-500/20 border border-amber-500/30' 
                : 'bg-amber-50 border border-amber-200'
            }`}>
              <AlertCircle size={20} className={isDarkMode ? 'text-amber-400' : 'text-amber-600'} />
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                  Local Development
                </p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-amber-300/80' : 'text-amber-700'}`}>
                  Saving directly to local file system.
                </p>
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${
              isDarkMode 
                ? 'bg-blue-500/20 border border-blue-500/30' 
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <FileText size={20} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                  GitHub Repository
                </p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-blue-300/80' : 'text-blue-700'}`}>
                  Changes will be committed to your repository.
                </p>
              </div>
            </div>
          )}

          {/* File name/path input */}
          <div>
            <label className={`text-sm font-medium block mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {isLocal ? 'File Name' : 'File Path'}
            </label>
            
            {isLocal ? (
              <>
                <div className="flex flex-col gap-2">
                  <div className={`px-4 py-2 rounded-t-xl text-sm ${
                    isDarkMode 
                      ? 'bg-gray-700/50 text-gray-400 border border-b-0 border-gray-600' 
                      : 'bg-gray-100 text-gray-500 border border-b-0 border-gray-300'
                  }`}>
                    {BASE_PATH}
                  </div>
                  <input
                    type="text"
                    className={`${inputClass} rounded-t-none -mt-2`}
                    value={fileName}
                    onChange={(e) => handleFileNameChange(e.target.value)}
                    placeholder="new-page.mdx"
                    style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
                  />
                </div>
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Full path: <code className={`px-1 rounded ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>{BASE_PATH}{fileName}</code>
                </p>
              </>
            ) : (
              <>
                <input
                  type="text"
                  className={inputClass}
                  value={fullPath}
                  onChange={(e) => handleFullPathChange(e.target.value)}
                  placeholder="src/content/page/new-page.mdx"
                  style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
                />
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Relative to repository root
                </p>
              </>
            )}
          </div>

          {/* Commit message (GitHub only) */}
          {!isLocal && (
            <div>
              <label className={`text-sm font-medium block mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Commit Message
              </label>
              <input
                type="text"
                className={inputClass}
                value={message}
                onChange={(e) => handleMessageChange(e.target.value)}
                placeholder="Describe your changes..."
                style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              isDarkMode 
                ? 'bg-red-500/20 border border-red-500/30' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <AlertCircle size={20} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
              <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className={`flex-shrink-0 p-4 border-t space-y-3 ${
          isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 touch-manipulation ${
              isSaving
                ? isDarkMode
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white'
            }`}
            style={{ minHeight: '56px' }}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={20} />
            )}
            {getSaveButtonText()}
          </button>

          {/* Cancel button */}
          <button
            onClick={onClose}
            disabled={isSaving}
            className={`w-full py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 active:bg-gray-700 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ minHeight: '56px' }}
          >
            <X size={20} />
            Cancel
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default MobileSaveModal;

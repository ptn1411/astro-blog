import React, { useState, useCallback } from 'react';
import { Clipboard, AlertCircle, Check, X } from 'lucide-react';
import { BottomSheet } from '../../shared/mobile';
import { BUILDER_TOUCH_CONFIG } from '../config/breakpoints.constants';

/**
 * MobilePasteJSONModal Component - Mobile-optimized JSON paste interface using BottomSheet
 * Requirements: 9.3
 * 
 * Implements:
 * - Mobile-friendly paste interface for JSON import
 * - Full-width textarea for easy touch interaction
 * - Large buttons with 44px minimum touch targets
 * - Validation feedback
 */

export interface MobilePasteJSONModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when JSON is submitted */
  onSubmit: (jsonText: string) => void;
  /** Whether dark mode is enabled */
  isDarkMode?: boolean;
}

/** Snap points for the bottom sheet: 60%, 90% */
const SNAP_POINTS = [0.6, 0.9];

export const MobilePasteJSONModal: React.FC<MobilePasteJSONModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isDarkMode = true,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  // Validate JSON as user types
  const handleTextChange = useCallback((text: string) => {
    setJsonText(text);
    setError(null);
    setIsValid(false);

    if (!text.trim()) {
      return;
    }

    try {
      const parsed = JSON.parse(text);
      // Check if it has the expected structure
      if (parsed.blocks && Array.isArray(parsed.blocks)) {
        setIsValid(true);
      } else if (Array.isArray(parsed)) {
        setIsValid(true);
      } else {
        setError('JSON phải chứa mảng "blocks" hoặc là một mảng các block');
      }
    } catch {
      setError('JSON không hợp lệ');
    }
  }, []);

  // Handle paste from clipboard
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleTextChange(text);
    } catch {
      setError('Không thể đọc từ clipboard. Vui lòng paste thủ công.');
    }
  }, [handleTextChange]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!jsonText.trim()) {
      setError('Vui lòng nhập JSON');
      return;
    }

    try {
      JSON.parse(jsonText);
      onSubmit(jsonText);
      setJsonText('');
      setError(null);
      setIsValid(false);
    } catch {
      setError('JSON không hợp lệ');
    }
  }, [jsonText, onSubmit]);

  // Handle close
  const handleClose = useCallback(() => {
    setJsonText('');
    setError(null);
    setIsValid(false);
    onClose();
  }, [onClose]);

  // Input class for consistent styling
  const textareaClass = `w-full px-4 py-4 rounded-xl border text-sm font-mono transition-colors focus:outline-none focus:ring-2 resize-none ${
    error
      ? isDarkMode
        ? 'bg-gray-700 border-red-500 text-white focus:ring-red-500/30'
        : 'bg-white border-red-500 text-gray-800 focus:ring-red-500/30'
      : isValid
        ? isDarkMode
          ? 'bg-gray-700 border-green-500 text-white focus:ring-green-500/30'
          : 'bg-white border-green-500 text-gray-800 focus:ring-green-500/30'
        : isDarkMode
          ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/30'
          : 'bg-white border-gray-300 text-gray-800 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/30'
  }`;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Paste JSON"
      snapPoints={SNAP_POINTS}
      initialSnap={0}
    >
      <div className="flex flex-col h-full">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
          {/* Instructions */}
          <div className={`p-4 rounded-xl flex items-start gap-3 ${
            isDarkMode 
              ? 'bg-blue-500/20 border border-blue-500/30' 
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <Clipboard size={20} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
            <div>
              <p className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                Import từ AI
              </p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-blue-300/80' : 'text-blue-700'}`}>
                Paste JSON được tạo từ ChatGPT, Claude hoặc AI khác vào đây.
              </p>
            </div>
          </div>

          {/* Paste from clipboard button */}
          <button
            onClick={handlePasteFromClipboard}
            className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 active:bg-gray-700 text-gray-300 border border-gray-600'
                : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 border border-gray-300'
            }`}
            style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
          >
            <Clipboard size={18} />
            Paste từ Clipboard
          </button>

          {/* JSON Textarea */}
          <div>
            <label className={`text-sm font-medium block mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              JSON Content
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder='{"blocks": [...], "metadata": {...}}'
              className={textareaClass}
              rows={10}
              style={{ minHeight: '200px' }}
            />
          </div>

          {/* Validation Status */}
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

          {isValid && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              isDarkMode 
                ? 'bg-green-500/20 border border-green-500/30' 
                : 'bg-green-50 border border-green-200'
            }`}>
              <Check size={20} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
              <p className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                JSON hợp lệ! Nhấn "Import" để áp dụng.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={`flex-shrink-0 p-4 border-t space-y-3 ${
          isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
          {/* Import Button */}
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`w-full py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 touch-manipulation ${
              isValid
                ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white'
                : isDarkMode
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            style={{ minHeight: '56px' }}
          >
            <Check size={20} />
            Import JSON
          </button>

          {/* Cancel Button */}
          <button
            onClick={handleClose}
            className={`w-full py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 active:bg-gray-700 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700'
            }`}
            style={{ minHeight: '56px' }}
          >
            <X size={20} />
            Hủy
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default MobilePasteJSONModal;

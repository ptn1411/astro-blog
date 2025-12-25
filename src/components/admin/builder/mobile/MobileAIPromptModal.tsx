import React, { useState, useCallback } from 'react';
import { Copy, Clipboard, Sparkles, Check } from 'lucide-react';
import { BottomSheet } from '../../shared/mobile';

/**
 * MobileAIPromptModal Component - Mobile-optimized AI Prompt Generator using BottomSheet
 * Requirements: 9.4
 * 
 * Implements:
 * - Scrollable AI Prompt modal for mobile screens
 * - Full-width inputs for easy touch interaction
 * - Large buttons with 44px minimum touch targets
 * - Copy to clipboard functionality
 */

export interface MobileAIPromptModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Website description for prompt generation */
  websiteDescription: string;
  /** Callback when website description changes */
  onDescriptionChange: (description: string) => void;
  /** Function to generate the AI prompt */
  generatePrompt: () => string;
  /** Callback when user wants to paste JSON */
  onPasteJSON: () => void;
  /** Whether dark mode is enabled */
  isDarkMode?: boolean;
}

/** Snap points for the bottom sheet: 70%, 95% */
const SNAP_POINTS = [0.7, 0.95];

export const MobileAIPromptModal: React.FC<MobileAIPromptModalProps> = ({
  isOpen,
  onClose,
  websiteDescription,
  onDescriptionChange,
  generatePrompt,
  onPasteJSON,
  isDarkMode = true,
}) => {
  const [copied, setCopied] = useState(false);

  // Copy prompt to clipboard
  const handleCopyPrompt = useCallback(async () => {
    const prompt = generatePrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  }, [generatePrompt]);

  // Handle paste JSON button
  const handlePasteJSON = useCallback(() => {
    onClose();
    onPasteJSON();
  }, [onClose, onPasteJSON]);

  // Input class for consistent styling
  const inputClass = `w-full px-4 py-4 rounded-xl border text-base transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500'
      : 'bg-white border-gray-300 text-gray-800 placeholder:text-gray-500 focus:border-purple-500'
  }`;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="AI Prompt Generator"
      snapPoints={SNAP_POINTS}
      initialSnap={0}
    >
      <div className="flex flex-col h-full">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
          {/* Description Input */}
          <div>
            <label className={`text-sm font-medium mb-2 flex items-center gap-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <span>📝</span>
              Mô tả trang web cần tạo
            </label>
            <textarea
              value={websiteDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Ví dụ: Trang landing page cho công ty công nghệ, có hero section với hình ảnh, phần giới thiệu tính năng (3 cột), testimonials từ khách hàng..."
              className={inputClass}
              rows={4}
              style={{ minHeight: '120px' }}
            />
          </div>

          {/* Generated Prompt Preview */}
          <div>
            <label className={`text-sm font-medium mb-2 flex items-center gap-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <span>🤖</span>
              Prompt sẽ được tạo (Preview)
            </label>
            <div
              className={`p-4 rounded-xl border text-xs font-mono overflow-y-auto whitespace-pre-wrap ${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-700 text-gray-300' 
                  : 'bg-gray-100 border-gray-300 text-gray-700'
              }`}
              style={{ maxHeight: '200px', minHeight: '150px' }}
            >
              {generatePrompt()}
            </div>
          </div>

          {/* Instructions */}
          <div className={`p-4 rounded-xl ${
            isDarkMode ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'
          }`}>
            <p className={`text-sm font-medium flex items-center gap-2 ${
              isDarkMode ? 'text-purple-300' : 'text-purple-800'
            }`}>
              <Sparkles size={16} />
              Hướng dẫn sử dụng
            </p>
            <ol className={`text-sm mt-2 list-decimal list-inside space-y-1.5 ${
              isDarkMode ? 'text-purple-300/80' : 'text-purple-700'
            }`}>
              <li>Nhập mô tả trang web bạn muốn tạo</li>
              <li>Nhấn "Copy Prompt" để copy toàn bộ</li>
              <li>Paste vào ChatGPT, Claude, hoặc AI khác</li>
              <li>Copy JSON kết quả từ AI</li>
              <li>Quay lại đây, nhấn "Paste JSON" để import</li>
            </ol>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex-shrink-0 p-4 border-t space-y-3 ${
          isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
          {/* Copy Prompt Button */}
          <button
            onClick={handleCopyPrompt}
            className={`w-full py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 touch-manipulation ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white'
            }`}
            style={{ minHeight: '56px' }}
          >
            {copied ? (
              <>
                <Check size={20} />
                Đã copy!
              </>
            ) : (
              <>
                <Copy size={20} />
                Copy Prompt
              </>
            )}
          </button>

          {/* Paste JSON Button */}
          <button
            onClick={handlePasteJSON}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 touch-manipulation"
            style={{ minHeight: '56px' }}
          >
            <Clipboard size={20} />
            Paste JSON
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className={`w-full py-4 rounded-xl font-medium transition-colors flex items-center justify-center touch-manipulation ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 active:bg-gray-700 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700'
            }`}
            style={{ minHeight: '56px' }}
          >
            Đóng
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default MobileAIPromptModal;

import { Clipboard, Copy, Sparkles, X } from 'lucide-react';
import React from 'react';

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  websiteDescription: string;
  setWebsiteDescription: (description: string) => void;
  generateAIPrompt: () => string;
  onOpenPasteModal: () => void;
  isDarkMode: boolean;
}

export function AIPromptModal({
  isOpen,
  onClose,
  websiteDescription,
  setWebsiteDescription,
  generateAIPrompt,
  onOpenPasteModal,
  isDarkMode,
}: AIPromptModalProps) {
  if (!isOpen) return null;

  const copyPromptToClipboard = async () => {
    const prompt = generateAIPrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      alert('Đã copy prompt! Paste vào ChatGPT/Claude để tạo JSON.');
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = prompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Đã copy prompt!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`w-full max-w-4xl mx-4 rounded-lg shadow-xl max-h-[90vh] flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
      >
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <h2
            className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
          >
            <Sparkles size={20} className="text-purple-500" />
            AI Prompt Generator
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-gray-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'}`}
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              📝 Mô tả trang web cần tạo:
            </label>
            <textarea
              value={websiteDescription}
              onChange={(e) => setWebsiteDescription(e.target.value)}
              placeholder="Ví dụ: Trang landing page cho công ty công nghệ, có hero section với hình ảnh, phần giới thiệu tính năng (3 cột), testimonials từ khách hàng, bảng giá 3 gói (Basic, Pro, Enterprise), phần FAQ và form liên hệ..."
              className={`w-full h-32 p-3 text-sm rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400'}`}
            />
          </div>

          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              🤖 Prompt sẽ được tạo (Preview):
            </label>
            <div
              className={`h-64 p-3 text-xs font-mono rounded-lg border overflow-y-auto whitespace-pre-wrap ${isDarkMode ? 'bg-gray-900 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'}`}
            >
              {generateAIPrompt()}
            </div>
          </div>

          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-blue-800'}`}>
              <strong>Hướng dẫn:</strong>
            </p>
            <ol
              className={`text-sm mt-1 list-decimal list-inside space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-blue-700'}`}
            >
              <li>Nhập mô tả trang web bạn muốn tạo ở trên</li>
              <li>Click "Copy Prompt" để copy toàn bộ prompt</li>
              <li>Paste vào ChatGPT, Claude, hoặc AI khác</li>
              <li>Copy JSON kết quả từ AI</li>
              <li>Quay lại đây, click "Paste JSON" để import</li>
            </ol>
          </div>
        </div>
        <div className={`flex justify-end gap-2 p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            Đóng
          </button>
          <button
            onClick={copyPromptToClipboard}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded font-medium"
          >
            <Copy size={16} /> Copy Prompt
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenPasteModal();
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
          >
            <Clipboard size={16} /> Paste JSON
          </button>
        </div>
      </div>
    </div>
  );
}

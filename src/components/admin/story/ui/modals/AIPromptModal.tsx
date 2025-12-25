import { Copy, Sparkles } from 'lucide-react';
import React from 'react';

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiTopic: string;
  setAiTopic: (topic: string) => void;
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  aiJsonText: string;
  setAiJsonText: (json: string) => void;
  generateAIPrompt: (topic: string) => string;
  onApplyJSON: (json: string) => void;
}

export function AIPromptModal({
  isOpen,
  onClose,
  aiTopic,
  setAiTopic,
  aiPrompt,
  setAiPrompt,
  aiJsonText,
  setAiJsonText,
  generateAIPrompt,
  onApplyJSON,
}: AIPromptModalProps) {
  if (!isOpen) return null;

  const handleCopyPrompt = async () => {
    const prompt = aiPrompt || generateAIPrompt(aiTopic);
    setAiPrompt(prompt);
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      alert('Copy failed. Please copy manually.');
    }
  };

  const handleApply = () => {
    if (!aiJsonText.trim()) {
      alert('Vui lòng paste JSON trước');
      return;
    }
    onApplyJSON(aiJsonText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-[680px] border border-slate-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="font-semibold text-white">AI JSON</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded transition-colors text-white">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm text-slate-200">
                Tạo prompt để AI sinh JSON bản tin từ chủ đề, sau đó paste JSON vào đây.
              </div>
              <div className="text-xs text-slate-400">Lưu ý: AI phải trả về JSON-only.</div>
            </div>
            <button
              type="button"
              onClick={() => {
                const prompt = generateAIPrompt(aiTopic);
                setAiPrompt(prompt);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-200 transition-colors"
              title="Generate AI prompt"
            >
              <Sparkles size={16} /> Generate
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="block text-xs text-slate-400">Chủ đề</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Ví dụ: Bản tin công nghệ hôm nay"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs text-slate-400">Prompt</label>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[11px] text-slate-200 transition-colors"
                    title="Copy prompt"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Nhấn Generate để tạo prompt..."
                  rows={14}
                  className="w-full bg-slate-900/40 border border-slate-600 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs text-slate-400">Paste JSON (AI trả về)</label>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white transition-colors"
                    title="Apply JSON"
                  >
                    Apply
                  </button>
                </div>
                <textarea
                  value={aiJsonText}
                  onChange={(e) => setAiJsonText(e.target.value)}
                  placeholder="Dán JSON (bắt đầu bằng { ... })"
                  rows={18}
                  className="w-full bg-slate-900/40 border border-slate-600 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-slate-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

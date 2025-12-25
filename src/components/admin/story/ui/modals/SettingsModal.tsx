import React from 'react';
import { resolveMediaUrl } from '~/utils/mediaUrl';
import type { Story } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: Story;
  onUpdateStory: (updates: Partial<Story>) => void;
}

export function SettingsModal({ isOpen, onClose, story, onUpdateStory }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-[400px] border border-slate-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="font-semibold text-white">Story Settings</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded transition-colors text-white">
            ✕
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* Thumbnail */}
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Thumbnail / Cover Image</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={story.thumbnail || ''}
                onChange={(e) => onUpdateStory({ thumbnail: e.target.value })}
                placeholder="Enter image URL or upload..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <label className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded cursor-pointer text-sm text-slate-300 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const base64 = event.target?.result as string;
                        onUpdateStory({ thumbnail: base64 });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                Upload
              </label>
            </div>
            {story.thumbnail && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-600">
                <img src={resolveMediaUrl(story.thumbnail)} alt="Thumbnail preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => onUpdateStory({ thumbnail: undefined })}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500 rounded text-white text-xs transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Description</label>
            <textarea
              value={story.description || ''}
              onChange={(e) => onUpdateStory({ description: e.target.value })}
              placeholder="Enter story description..."
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="border-t border-slate-700 pt-4 space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Auto-advance slides</span>
              <input
                type="checkbox"
                checked={story.settings?.autoAdvance ?? true}
                onChange={(e) =>
                  onUpdateStory({ settings: { ...story.settings!, autoAdvance: e.target.checked } })
                }
                className="w-4 h-4 accent-blue-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Loop story</span>
              <input
                type="checkbox"
                checked={story.settings?.loop ?? false}
                onChange={(e) =>
                  onUpdateStory({ settings: { ...story.settings!, loop: e.target.checked } })
                }
                className="w-4 h-4 accent-blue-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Show progress bar</span>
              <input
                type="checkbox"
                checked={story.settings?.showProgressBar ?? true}
                onChange={(e) =>
                  onUpdateStory({ settings: { ...story.settings!, showProgressBar: e.target.checked } })
                }
                className="w-4 h-4 accent-blue-500"
              />
            </label>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

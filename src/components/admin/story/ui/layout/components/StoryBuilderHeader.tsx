import {
  Download,
  Film,
  Grid3X3,
  Layers,
  Play,
  Redo2,
  Save,
  Settings,
  Sparkles,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import React from 'react';
import type { CanvasState, Story } from '../../../types';

interface StoryBuilderHeaderProps {
  story: Story;
  onTitleChange: (title: string) => void;
  onBack?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canvasState: CanvasState;
  onCanvasStateChange: (updates: Partial<CanvasState>) => void;
  onPreview: () => void;
  onImport: () => void;
  onExportJSON: () => void;
  onExportVideo: () => void;
  onOpenSettings: () => void;
  onOpenAIModal: () => void;
  onSave: () => void;
}

export function StoryBuilderHeader({
  story,
  onTitleChange,
  onBack,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  canvasState,
  onCanvasStateChange,
  onPreview,
  onImport,
  onExportJSON,
  onExportVideo,
  onOpenSettings,
  onOpenAIModal,
  onSave,
}: StoryBuilderHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700">
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
            title="Quay lại danh sách"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
          Story Builder
        </h1>
        <input
          type="text"
          value={story.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="bg-slate-700/50 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 w-48"
          placeholder="Story title..."
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <div className="flex items-center bg-slate-700/50 rounded-lg p-0.5 border border-slate-600">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded transition-colors ${
              !canUndo ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-600 hover:text-white'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded transition-colors ${
              !canRedo ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-600 hover:text-white'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={16} />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center bg-slate-700/50 rounded-lg p-0.5 border border-slate-600">
          <button
            onClick={() => onCanvasStateChange({ zoom: Math.max(0.5, canvasState.zoom - 0.1) })}
            className="p-1.5 text-slate-300 hover:bg-slate-600 hover:text-white rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="px-2 text-xs text-slate-400 min-w-[3rem] text-center">
            {Math.round(canvasState.zoom * 100)}%
          </span>
          <button
            onClick={() => onCanvasStateChange({ zoom: Math.min(2, canvasState.zoom + 0.1) })}
            className="p-1.5 text-slate-300 hover:bg-slate-600 hover:text-white rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        {/* Canvas options */}
        <div className="flex items-center bg-slate-700/50 rounded-lg p-0.5 border border-slate-600">
          <button
            onClick={() => onCanvasStateChange({ showGrid: !canvasState.showGrid })}
            className={`p-1.5 rounded transition-colors ${
              canvasState.showGrid ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-600'
            }`}
            title="Toggle Grid"
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => onCanvasStateChange({ showSafeZone: !canvasState.showSafeZone })}
            className={`p-1.5 rounded transition-colors ${
              canvasState.showSafeZone ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-600'
            }`}
            title="Toggle Safe Zone"
          >
            <Layers size={16} />
          </button>
        </div>

        {/* Actions */}
        <button
          onClick={onPreview}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
          title="Preview (P)"
        >
          <Play size={16} /> Preview
        </button>

        <div className="flex items-center bg-slate-700/50 rounded-lg p-0.5 border border-slate-600">
          <button
            onClick={onImport}
            className="p-1.5 text-slate-300 hover:bg-slate-600 hover:text-white rounded transition-colors"
            title="Import Story"
          >
            <Upload size={16} />
          </button>
          <button
            onClick={onOpenAIModal}
            className="p-1.5 text-slate-300 hover:bg-slate-600 hover:text-white rounded transition-colors"
            title="AI JSON"
          >
            <Sparkles size={16} />
          </button>
          <button
            onClick={onExportJSON}
            className="p-1.5 text-slate-300 hover:bg-slate-600 hover:text-white rounded transition-colors"
            title="Export Story JSON"
          >
            <Download size={16} />
          </button>
          <button
            onClick={onExportVideo}
            className="p-1.5 text-slate-300 hover:bg-slate-600 hover:text-white rounded transition-colors"
            title="Export Story as Video"
          >
            <Film size={16} />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 text-slate-300 hover:bg-slate-600 hover:text-white rounded transition-colors"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>

        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 rounded-lg text-sm font-medium transition-all shadow-lg shadow-pink-500/20"
        >
          <Save size={16} /> Save
        </button>
      </div>
    </header>
  );
}

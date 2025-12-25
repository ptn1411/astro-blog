/**
 * Export Settings Modal Component
 *
 * Provides UI for configuring video export settings including:
 * - Resolution (720p, 1080p, 4K)
 * - Frame rate (24, 30, 60 fps)
 * - Bitrate (2, 4, 8 Mbps)
 * - Export scope (current slide or all slides)
 *
 * Requirements: 5.1, 5.2, 5.3
 */

import { Film, X } from 'lucide-react';
import React, { useState } from 'react';

// ==========================================
// Types and Interfaces
// ==========================================

export type Resolution = '720p' | '1080p' | '4k';
export type FrameRate = 24 | 30 | 60;
export type Bitrate = 2_000_000 | 4_000_000 | 8_000_000;

export interface ExportSettings {
  resolution: Resolution;
  fps: FrameRate;
  bitrate: Bitrate;
  exportAllSlides: boolean;
  includeAudio: boolean;
}

export const RESOLUTION_MAP: Record<Resolution, { width: number; height: number; label: string }> = {
  '720p': { width: 720, height: 1280, label: '720p (720×1280)' },
  '1080p': { width: 1080, height: 1920, label: '1080p (1080×1920)' },
  '4k': { width: 2160, height: 3840, label: '4K (2160×3840)' },
};

export const FPS_OPTIONS: { value: FrameRate; label: string }[] = [
  { value: 24, label: '24 fps (Cinematic)' },
  { value: 30, label: '30 fps (Standard)' },
  { value: 60, label: '60 fps (Smooth)' },
];

export const BITRATE_OPTIONS: { value: Bitrate; label: string }[] = [
  { value: 2_000_000, label: '2 Mbps (Small file)' },
  { value: 4_000_000, label: '4 Mbps (Balanced)' },
  { value: 8_000_000, label: '8 Mbps (High quality)' },
];

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  resolution: '1080p',
  fps: 30,
  bitrate: 4_000_000,
  exportAllSlides: false,
  includeAudio: true,
};

// ==========================================
// Component Props
// ==========================================

interface ExportSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: ExportSettings) => void;
  slideCount: number;
  currentSlideIndex: number;
}

// ==========================================
// Component
// ==========================================

export function ExportSettingsModal({
  isOpen,
  onClose,
  onExport,
  slideCount,
  currentSlideIndex,
}: ExportSettingsModalProps) {
  const [settings, setSettings] = useState<ExportSettings>(DEFAULT_EXPORT_SETTINGS);

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(settings);
    onClose();
  };

  const estimatedSize = calculateEstimatedSize(settings, slideCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-[480px] border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Film size={20} className="text-blue-400" />
            <h3 className="font-semibold text-white">Export Video</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">
          {/* Resolution */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Resolution</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(RESOLUTION_MAP) as Resolution[]).map((res) => (
                <button
                  key={res}
                  onClick={() => setSettings((s) => ({ ...s, resolution: res }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.resolution === res
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {res.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">{RESOLUTION_MAP[settings.resolution].label}</p>
          </div>

          {/* Frame Rate */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Frame Rate</label>
            <div className="grid grid-cols-3 gap-2">
              {FPS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSettings((s) => ({ ...s, fps: option.value }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.fps === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {option.value} fps
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {FPS_OPTIONS.find((o) => o.value === settings.fps)?.label}
            </p>
          </div>

          {/* Bitrate */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Quality (Bitrate)</label>
            <div className="grid grid-cols-3 gap-2">
              {BITRATE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSettings((s) => ({ ...s, bitrate: option.value }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.bitrate === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {option.value / 1_000_000} Mbps
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {BITRATE_OPTIONS.find((o) => o.value === settings.bitrate)?.label}
            </p>
          </div>

          {/* Export Scope */}
          {slideCount > 1 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Export Scope</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSettings((s) => ({ ...s, exportAllSlides: false }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !settings.exportAllSlides
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Current Slide
                </button>
                <button
                  onClick={() => setSettings((s) => ({ ...s, exportAllSlides: true }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.exportAllSlides
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  All Slides ({slideCount})
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {settings.exportAllSlides
                  ? `Export all ${slideCount} slides as a single video`
                  : `Export slide ${currentSlideIndex + 1} only`}
              </p>
            </div>
          )}

          {/* Include Audio */}
          <div className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Include Audio</span>
              <button
                onClick={() => setSettings((s) => ({ ...s, includeAudio: !s.includeAudio }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.includeAudio ? 'bg-blue-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.includeAudio ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
            <p className="text-xs text-slate-500">
              {settings.includeAudio
                ? 'Audio will be included (may take longer to process)'
                : 'Export video without audio (faster)'}
            </p>
          </div>

          {/* Estimated Output */}
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Estimated file size:</span>
              <span className="text-white font-medium">{estimatedSize}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 rounded-lg text-sm font-medium transition-all text-white shadow-lg shadow-blue-500/20"
          >
            Export Video
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Calculate estimated file size based on export settings
 * Formula: bitrate * duration / 8 (convert bits to bytes)
 */
function calculateEstimatedSize(settings: ExportSettings, slideCount: number): string {
  // Assume average slide duration of 5 seconds
  const avgSlideDuration = 5;
  const totalDuration = settings.exportAllSlides ? slideCount * avgSlideDuration : avgSlideDuration;

  // Calculate size in bytes: bitrate (bits/sec) * duration (sec) / 8 (bits to bytes)
  const sizeBytes = (settings.bitrate * totalDuration) / 8;

  // Format size
  if (sizeBytes < 1024 * 1024) {
    return `~${Math.round(sizeBytes / 1024)} KB`;
  } else {
    return `~${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

export default ExportSettingsModal;

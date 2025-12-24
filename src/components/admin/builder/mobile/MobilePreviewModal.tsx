import React, { useCallback, useEffect, useState } from 'react';
import { X, Monitor, Smartphone, RefreshCw } from 'lucide-react';

/**
 * MobilePreviewModal Component - Full-screen preview modal for mobile page builder
 * Requirements: 6.2, 6.3, 6.4
 * 
 * Implements:
 * - Full-screen modal with iframe for page preview
 * - Close button to return to editing
 * - Device toggle (desktop/mobile preview mode)
 * - Preview preference persistence to localStorage
 */

export type PreviewDeviceMode = 'desktop' | 'mobile';

export interface MobilePreviewModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** URL to preview in the iframe */
  previewUrl: string;
  /** Whether dark mode is enabled */
  isDarkMode?: boolean;
  /** Optional title for the preview */
  title?: string;
}

/** Storage key for preview preferences */
const PREVIEW_PREFS_KEY = 'builder-preview-prefs';

/** Default preview device mode */
const DEFAULT_DEVICE_MODE: PreviewDeviceMode = 'desktop';

/** Mobile viewport width for preview */
const MOBILE_VIEWPORT_WIDTH = 375;

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__preview_storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load preview device mode preference from localStorage
 */
export function loadPreviewPreference(): PreviewDeviceMode {
  if (!isLocalStorageAvailable()) {
    return DEFAULT_DEVICE_MODE;
  }

  try {
    const stored = window.localStorage.getItem(PREVIEW_PREFS_KEY);
    if (!stored) {
      return DEFAULT_DEVICE_MODE;
    }

    const parsed = JSON.parse(stored);
    if (parsed.deviceMode === 'desktop' || parsed.deviceMode === 'mobile') {
      return parsed.deviceMode;
    }
    return DEFAULT_DEVICE_MODE;
  } catch {
    return DEFAULT_DEVICE_MODE;
  }
}

/**
 * Save preview device mode preference to localStorage
 */
export function savePreviewPreference(deviceMode: PreviewDeviceMode): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.setItem(PREVIEW_PREFS_KEY, JSON.stringify({ deviceMode }));
    return true;
  } catch {
    return false;
  }
}

export const MobilePreviewModal: React.FC<MobilePreviewModalProps> = ({
  isOpen,
  onClose,
  previewUrl,
  isDarkMode = true,
  title = 'Preview',
}) => {
  const [deviceMode, setDeviceMode] = useState<PreviewDeviceMode>(DEFAULT_DEVICE_MODE);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  // Load preference on mount
  useEffect(() => {
    if (isOpen) {
      const savedMode = loadPreviewPreference();
      setDeviceMode(savedMode);
      setIsLoading(true);
    }
  }, [isOpen]);

  // Handle device mode change
  const handleDeviceModeChange = useCallback((mode: PreviewDeviceMode) => {
    setDeviceMode(mode);
    savePreviewPreference(mode);
    setIsLoading(true);
  }, []);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}
        aria-hidden="true"
      />

      {/* Header */}
      <header
        className={`relative flex-shrink-0 h-14 flex items-center justify-between px-3 border-b z-10 ${
          isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`p-3 rounded-lg transition-colors touch-manipulation ${
            isDarkMode
              ? 'text-gray-300 hover:text-white hover:bg-gray-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          aria-label="Close preview"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2
          id="preview-modal-title"
          className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
        >
          {title}
        </h2>

        {/* Device toggle and refresh */}
        <div className="flex items-center gap-1">
          {/* Device toggle */}
          <div
            className={`flex rounded-lg p-0.5 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}
          >
            <button
              onClick={() => handleDeviceModeChange('desktop')}
              className={`p-2 rounded-md transition-colors touch-manipulation ${
                deviceMode === 'desktop'
                  ? isDarkMode
                    ? 'bg-gray-600 text-white'
                    : 'bg-white shadow text-gray-800'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-800'
              }`}
              aria-label="Desktop preview"
              aria-pressed={deviceMode === 'desktop'}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <Monitor size={18} />
            </button>
            <button
              onClick={() => handleDeviceModeChange('mobile')}
              className={`p-2 rounded-md transition-colors touch-manipulation ${
                deviceMode === 'mobile'
                  ? isDarkMode
                    ? 'bg-gray-600 text-white'
                    : 'bg-white shadow text-gray-800'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-800'
              }`}
              aria-label="Mobile preview"
              aria-pressed={deviceMode === 'mobile'}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <Smartphone size={18} />
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className={`p-3 rounded-lg transition-colors touch-manipulation ${
              isDarkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label="Refresh preview"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Preview content */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div
              className={`w-8 h-8 border-3 rounded-full animate-spin ${
                isDarkMode
                  ? 'border-gray-600 border-t-blue-400'
                  : 'border-gray-300 border-t-blue-500'
              }`}
              style={{ borderWidth: '3px' }}
            />
          </div>
        )}

        {/* Iframe container */}
        <div
          className={`relative h-full transition-all duration-300 ${
            deviceMode === 'mobile'
              ? 'w-full max-w-[375px]'
              : 'w-full'
          }`}
          style={{
            maxWidth: deviceMode === 'mobile' ? `${MOBILE_VIEWPORT_WIDTH}px` : '100%',
          }}
        >
          {/* Mobile device frame (only in mobile mode) */}
          {deviceMode === 'mobile' && (
            <div
              className={`absolute inset-0 pointer-events-none border-4 rounded-3xl ${
                isDarkMode ? 'border-gray-700' : 'border-gray-300'
              }`}
              aria-hidden="true"
            />
          )}

          {/* Iframe */}
          <iframe
            key={iframeKey}
            src={previewUrl}
            title="Page preview"
            className={`w-full h-full ${
              deviceMode === 'mobile' ? 'rounded-2xl' : ''
            } ${isDarkMode ? 'bg-white' : 'bg-white'}`}
            onLoad={handleIframeLoad}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </div>

      {/* Device mode indicator */}
      <div
        className={`relative flex-shrink-0 py-2 text-center text-xs border-t ${
          isDarkMode
            ? 'bg-gray-800 border-gray-700 text-gray-400'
            : 'bg-white border-gray-200 text-gray-500'
        }`}
      >
        {deviceMode === 'mobile'
          ? `Mobile Preview (${MOBILE_VIEWPORT_WIDTH}px)`
          : 'Desktop Preview (Full Width)'}
      </div>
    </div>
  );
};

export default MobilePreviewModal;

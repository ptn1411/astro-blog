/**
 * useAISettings - Hook quản lý cài đặt AI
 * Lưu vào localStorage để persist across sessions
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'story-builder-ai-settings';

export interface AISettings {
  /** Bật/tắt AI Chat */
  enabled: boolean;
  /** Tự động mở chat khi load */
  autoOpen: boolean;
}

const DEFAULT_SETTINGS: AISettings = {
  enabled: true,
  autoOpen: false,
};

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AISettings>;
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // Ignore parse errors
    }
    setLoaded(true);
  }, []);

  // Save to localStorage when settings change
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {
        // Ignore storage errors
      }
    }
  }, [settings, loaded]);

  const updateSettings = useCallback((updates: Partial<AISettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleEnabled = useCallback(() => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  return {
    settings,
    loaded,
    updateSettings,
    toggleEnabled,
    isEnabled: settings.enabled,
  };
}

export default useAISettings;

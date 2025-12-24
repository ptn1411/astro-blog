/**
 * Mobile Preferences Storage Utility
 * Implements save/load functions for panel preferences per device type
 * Requirements: 8.5
 */

import { type DeviceType } from '~/components/admin/story/constants/breakpoints';

/**
 * Mobile preferences interface for story editor
 * Stores user preferences that persist across sessions
 */
export interface MobilePreferences {
  /** Default snap point for bottom sheet panels (0-1 range) */
  defaultPanelSnapPoint: number;
  /** Whether to show grid overlay on mobile canvas */
  showGridOnMobile: boolean;
  /** Whether haptic feedback is enabled for touch interactions */
  hapticFeedback: boolean;
  /** Last active tab in bottom navigation */
  lastActiveTab: string;
}

/** Default preferences for new users */
const DEFAULT_PREFERENCES: MobilePreferences = {
  defaultPanelSnapPoint: 0.5,
  showGridOnMobile: false,
  hapticFeedback: true,
  lastActiveTab: 'canvas',
};

/** Storage key prefix for localStorage */
const STORAGE_KEY_PREFIX = 'story-editor-prefs';

/**
 * Generate storage key for a specific device type
 * @param deviceType - The device type (mobile, tablet, desktop)
 * @returns Storage key string
 */
function getStorageKey(deviceType: DeviceType): string {
  return `${STORAGE_KEY_PREFIX}-${deviceType}`;
}

/**
 * Check if localStorage is available
 * @returns true if localStorage is accessible
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load mobile preferences for a specific device type
 * @param deviceType - The device type to load preferences for
 * @returns MobilePreferences object (defaults if not found or error)
 */
export function loadPreferences(deviceType: DeviceType): MobilePreferences {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage not available, using default preferences');
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    const key = getStorageKey(deviceType);
    const stored = window.localStorage.getItem(key);
    
    if (!stored) {
      return { ...DEFAULT_PREFERENCES };
    }

    const parsed = JSON.parse(stored);
    
    // Validate and merge with defaults to handle missing fields
    return {
      defaultPanelSnapPoint: typeof parsed.defaultPanelSnapPoint === 'number' 
        ? Math.max(0, Math.min(1, parsed.defaultPanelSnapPoint))
        : DEFAULT_PREFERENCES.defaultPanelSnapPoint,
      showGridOnMobile: typeof parsed.showGridOnMobile === 'boolean'
        ? parsed.showGridOnMobile
        : DEFAULT_PREFERENCES.showGridOnMobile,
      hapticFeedback: typeof parsed.hapticFeedback === 'boolean'
        ? parsed.hapticFeedback
        : DEFAULT_PREFERENCES.hapticFeedback,
      lastActiveTab: typeof parsed.lastActiveTab === 'string'
        ? parsed.lastActiveTab
        : DEFAULT_PREFERENCES.lastActiveTab,
    };
  } catch (error) {
    console.error('Failed to load preferences:', error);
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Save mobile preferences for a specific device type
 * @param deviceType - The device type to save preferences for
 * @param preferences - The preferences to save (partial updates supported)
 * @returns true if save was successful, false otherwise
 */
export function savePreferences(
  deviceType: DeviceType,
  preferences: Partial<MobilePreferences>
): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage not available, cannot save preferences');
    return false;
  }

  try {
    const key = getStorageKey(deviceType);
    const current = loadPreferences(deviceType);
    const updated: MobilePreferences = {
      ...current,
      ...preferences,
    };

    // Validate snap point range
    if (typeof updated.defaultPanelSnapPoint === 'number') {
      updated.defaultPanelSnapPoint = Math.max(0, Math.min(1, updated.defaultPanelSnapPoint));
    }

    window.localStorage.setItem(key, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Failed to save preferences:', error);
    return false;
  }
}

/**
 * Clear preferences for a specific device type
 * @param deviceType - The device type to clear preferences for
 * @returns true if clear was successful, false otherwise
 */
export function clearPreferences(deviceType: DeviceType): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    const key = getStorageKey(deviceType);
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to clear preferences:', error);
    return false;
  }
}

/**
 * Get default preferences (useful for reset functionality)
 * @returns A copy of the default preferences
 */
export function getDefaultPreferences(): MobilePreferences {
  return { ...DEFAULT_PREFERENCES };
}

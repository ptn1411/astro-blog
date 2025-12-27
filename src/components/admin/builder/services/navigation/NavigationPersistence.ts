/**
 * NavigationPersistence - Handles auto-save to localStorage and server persistence
 * Implements debounced saves for performance optimization
 * 
 * Requirements:
 * - 6.1: Auto-save changes to local storage
 * - 3.7: Persist footer data modifications
 * - 6.2: Persist data to server
 * - 6.5: Handle save errors and show feedback
 */

import type {
  NavigationState,
  HeaderData,
  FooterData,
  LayoutConfig,
} from '../../core/types/navigation.types';
import { getGitHubToken, isLocalEnvironment, saveToGitHub, saveLocally } from '../save/saveActions';
import { REPO_NAME, REPO_OWNER } from '../../../config';
import { Octokit } from '@octokit/rest';

// --- Constants ---

const NAVIGATION_STORAGE_KEY = 'astro-builder-navigation-data';
const DEBOUNCE_DELAY_MS = 500;

// --- Storage Data Interface ---

export interface NavigationStorageData {
  headerData: HeaderData;
  footerData: FooterData;
  layout: LayoutConfig;
  lastUpdated: string;
  version: string;
}

// --- Save Result Interface ---

export interface SaveResult {
  success: boolean;
  local: boolean;
  remote: boolean;
  error?: string;
}

// --- Debounce Utility ---

type DebouncedFunction<T extends (...args: unknown[]) => unknown> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
};

/**
 * Creates a debounced version of a function
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 */
function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debouncedFn = (...args: Parameters<T>): void => {
    lastArgs = args;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
      lastArgs = null;
    }, delay);
  };

  debouncedFn.cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
    }
  };

  debouncedFn.flush = (): void => {
    if (timeoutId !== null && lastArgs !== null) {
      clearTimeout(timeoutId);
      fn(...lastArgs);
      timeoutId = null;
      lastArgs = null;
    }
  };

  return debouncedFn;
}

// --- LocalStorage Operations ---

/**
 * Saves navigation data to localStorage
 * @param data Navigation data to save
 */
export function saveToLocalStorage(data: NavigationStorageData): void {
  try {
    localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save navigation data to localStorage:', error);
    throw new Error('LocalStorage save failed - storage may be full');
  }
}

/**
 * Loads navigation data from localStorage
 * @returns Navigation data or null if not found
 */
export function loadFromLocalStorage(): NavigationStorageData | null {
  try {
    const stored = localStorage.getItem(NAVIGATION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as NavigationStorageData;
    }
  } catch (error) {
    console.error('Failed to load navigation data from localStorage:', error);
  }
  return null;
}

/**
 * Clears navigation data from localStorage
 */
export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(NAVIGATION_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear navigation data from localStorage:', error);
  }
}

// --- Server Operations ---

const NAVIGATION_SERVER_PATH = 'src/content/data/navigation-config.json';

/**
 * Saves navigation data to server (GitHub or local API)
 * @param data Navigation data to save
 */
export async function saveToServer(data: NavigationStorageData): Promise<void> {
  const content = JSON.stringify(data, null, 2);

  if (isLocalEnvironment()) {
    await saveLocally(NAVIGATION_SERVER_PATH, content);
  } else {
    const token = getGitHubToken();
    if (!token) {
      throw new Error('Not authenticated. Please log in via CMS first.');
    }
    await saveToGitHub({
      path: NAVIGATION_SERVER_PATH,
      content,
      message: `Update navigation config - ${new Date().toLocaleString()}`,
      token,
    });
  }
}

/**
 * Loads navigation data from server (GitHub or local API)
 * @returns Navigation data or null if not found
 */
export async function loadFromServer(): Promise<NavigationStorageData | null> {
  if (isLocalEnvironment()) {
    try {
      const res = await fetch(`/admin/pages?path=${encodeURIComponent(NAVIGATION_SERVER_PATH)}`);
      if (res.ok) {
        const data = await res.json();
        return data as NavigationStorageData;
      }
    } catch (error) {
      console.error('Failed to load navigation data from local server:', error);
    }
    return null;
  }

  // Load from GitHub
  const token = getGitHubToken();
  if (!token) {
    console.warn('No GitHub token found, skipping server load');
    return null;
  }

  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: NAVIGATION_SERVER_PATH,
    });

    if (!Array.isArray(data) && 'content' in data) {
      const content = atob(data.content);
      return JSON.parse(content) as NavigationStorageData;
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      console.log('No navigation config file found on server');
      return null;
    }
    console.error('Failed to load navigation data from GitHub:', error);
  }
  return null;
}

// --- NavigationPersistence Class ---

/**
 * Manages persistence for navigation data with auto-save and debouncing
 */
export class NavigationPersistence {
  private debouncedSave: DebouncedFunction<(data: NavigationStorageData) => void>;
  private onSaveCallback?: (result: SaveResult) => void;
  private onErrorCallback?: (error: string) => void;

  constructor(options?: {
    debounceDelay?: number;
    onSave?: (result: SaveResult) => void;
    onError?: (error: string) => void;
  }) {
    const delay = options?.debounceDelay ?? DEBOUNCE_DELAY_MS;
    this.onSaveCallback = options?.onSave;
    this.onErrorCallback = options?.onError;

    this.debouncedSave = debounce((data: NavigationStorageData) => {
      this.performSave(data);
    }, delay);
  }

  /**
   * Performs the actual save operation to localStorage
   */
  private performSave(data: NavigationStorageData): void {
    try {
      saveToLocalStorage(data);
      this.onSaveCallback?.({
        success: true,
        local: true,
        remote: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.onErrorCallback?.(errorMessage);
      this.onSaveCallback?.({
        success: false,
        local: false,
        remote: false,
        error: errorMessage,
      });
    }
  }

  /**
   * Auto-saves navigation state to localStorage with debouncing
   * Called on every modification to navigation data
   * @param state Current navigation state
   */
  autoSave(state: NavigationState): void {
    const data: NavigationStorageData = {
      headerData: state.headerData,
      footerData: state.footerData,
      layout: state.layout,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
    };
    this.debouncedSave(data);
  }

  /**
   * Immediately saves to localStorage (bypasses debounce)
   * @param state Current navigation state
   */
  saveImmediately(state: NavigationState): SaveResult {
    this.debouncedSave.cancel();
    
    const data: NavigationStorageData = {
      headerData: state.headerData,
      footerData: state.footerData,
      layout: state.layout,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
    };

    try {
      saveToLocalStorage(data);
      return { success: true, local: true, remote: false };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, local: false, remote: false, error: errorMessage };
    }
  }

  /**
   * Saves navigation data to server
   * @param state Current navigation state
   * @returns Save result with success status
   */
  async saveToServer(state: NavigationState): Promise<SaveResult> {
    // First, ensure local save is complete
    this.debouncedSave.flush();

    const data: NavigationStorageData = {
      headerData: state.headerData,
      footerData: state.footerData,
      layout: state.layout,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
    };

    const result: SaveResult = {
      success: false,
      local: false,
      remote: false,
    };

    // Save to localStorage first
    try {
      saveToLocalStorage(data);
      result.local = true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }

    // Then save to server
    try {
      await saveToServer(data);
      result.remote = true;
      result.success = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save to server';
      result.error = errorMessage;
      this.onErrorCallback?.(errorMessage);
      // Still consider partial success if local save worked
      result.success = result.local;
    }

    this.onSaveCallback?.(result);
    return result;
  }

  /**
   * Loads navigation data from storage (localStorage first, then server)
   * @returns Navigation storage data or null
   */
  async load(): Promise<NavigationStorageData | null> {
    // Try localStorage first (faster)
    const localData = loadFromLocalStorage();
    
    // Try server for potentially newer data
    try {
      const serverData = await loadFromServer();
      if (serverData) {
        // Compare timestamps and use newer data
        if (localData) {
          const localTime = new Date(localData.lastUpdated).getTime();
          const serverTime = new Date(serverData.lastUpdated).getTime();
          if (serverTime > localTime) {
            // Sync server data to localStorage
            saveToLocalStorage(serverData);
            return serverData;
          }
        } else {
          // No local data, use server data
          saveToLocalStorage(serverData);
          return serverData;
        }
      }
    } catch (error) {
      console.error('Failed to load from server, using local cache:', error);
    }

    return localData;
  }

  /**
   * Cancels any pending debounced saves
   */
  cancel(): void {
    this.debouncedSave.cancel();
  }

  /**
   * Flushes any pending debounced saves immediately
   */
  flush(): void {
    this.debouncedSave.flush();
  }
}

// --- Factory Function ---

/**
 * Creates a new NavigationPersistence instance
 */
export function createNavigationPersistence(options?: {
  debounceDelay?: number;
  onSave?: (result: SaveResult) => void;
  onError?: (error: string) => void;
}): NavigationPersistence {
  return new NavigationPersistence(options);
}

// --- Export Constants ---

export { NAVIGATION_STORAGE_KEY, DEBOUNCE_DELAY_MS, NAVIGATION_SERVER_PATH };

/**
 * Tests for NavigationPersistence service
 * Tests auto-save to localStorage with debouncing and server save functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  NavigationPersistence,
  createNavigationPersistence,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  NAVIGATION_STORAGE_KEY,
  type NavigationStorageData,
} from './NavigationPersistence';
import type { NavigationState } from '../../core/types/navigation.types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock fetch for server operations
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock saveActions module
vi.mock('../save/saveActions', () => ({
  getGitHubToken: vi.fn(() => null),
  isLocalEnvironment: vi.fn(() => true),
  saveToGitHub: vi.fn(),
  saveLocally: vi.fn(),
}));

import { isLocalEnvironment, saveLocally, getGitHubToken, saveToGitHub } from '../save/saveActions';

// Helper to create test navigation state
function createTestState(overrides?: Partial<NavigationState>): NavigationState {
  return {
    headerData: {
      links: [{ text: 'Home', href: '/' }],
      actions: [],
    },
    footerData: {
      links: [],
      secondaryLinks: [],
      socialLinks: [],
      footNote: '',
    },
    layout: {
      type: 'full-width',
      headerVisible: true,
      footerVisible: true,
      sidebarPosition: 'none',
    },
    isDirty: false,
    lastSaved: null,
    dragState: {
      isDragging: false,
      draggedNodeId: null,
      dropTargetId: null,
      dropPosition: null,
    },
    ...overrides,
  };
}

describe('NavigationPersistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('saveToLocalStorage', () => {
    it('should save navigation data to localStorage', () => {
      const data: NavigationStorageData = {
        headerData: { links: [], actions: [] },
        footerData: { links: [], secondaryLinks: [], socialLinks: [], footNote: '' },
        layout: { type: 'full-width', headerVisible: true, footerVisible: true, sidebarPosition: 'none' },
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
      };

      saveToLocalStorage(data);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        NAVIGATION_STORAGE_KEY,
        JSON.stringify(data)
      );
    });
  });

  describe('loadFromLocalStorage', () => {
    it('should load navigation data from localStorage', () => {
      const data: NavigationStorageData = {
        headerData: { links: [{ text: 'Test', href: '/test' }], actions: [] },
        footerData: { links: [], secondaryLinks: [], socialLinks: [], footNote: '' },
        layout: { type: 'full-width', headerVisible: true, footerVisible: true, sidebarPosition: 'none' },
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
      };

      localStorageMock.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(data));

      const loaded = loadFromLocalStorage();

      expect(loaded).toEqual(data);
    });

    it('should return null if no data exists', () => {
      const loaded = loadFromLocalStorage();
      expect(loaded).toBeNull();
    });
  });

  describe('clearLocalStorage', () => {
    it('should remove navigation data from localStorage', () => {
      localStorageMock.setItem(NAVIGATION_STORAGE_KEY, '{}');
      
      clearLocalStorage();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(NAVIGATION_STORAGE_KEY);
    });
  });

  describe('NavigationPersistence class', () => {
    it('should create instance with factory function', () => {
      const persistence = createNavigationPersistence();
      expect(persistence).toBeInstanceOf(NavigationPersistence);
    });

    it('should debounce auto-save calls', () => {
      const onSave = vi.fn();
      const persistence = createNavigationPersistence({ 
        debounceDelay: 100,
        onSave,
      });
      const state = createTestState();

      persistence.autoSave(state);
      persistence.autoSave(state);
      persistence.autoSave(state);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();

      vi.advanceTimersByTime(150);

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith({
        success: true,
        local: true,
        remote: false,
      });
    });

    it('should save immediately when saveImmediately is called', () => {
      const persistence = createNavigationPersistence({ debounceDelay: 1000 });
      const state = createTestState();

      const result = persistence.saveImmediately(state);

      expect(result.success).toBe(true);
      expect(result.local).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    });

    it('should cancel pending saves when cancel is called', () => {
      const persistence = createNavigationPersistence({ debounceDelay: 100 });
      const state = createTestState();

      persistence.autoSave(state);
      persistence.cancel();

      vi.advanceTimersByTime(150);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should flush pending saves when flush is called', () => {
      const persistence = createNavigationPersistence({ debounceDelay: 1000 });
      const state = createTestState();

      persistence.autoSave(state);
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();

      persistence.flush();

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    });

    it('should call onError callback when save fails', () => {
      const onError = vi.fn();
      const persistence = createNavigationPersistence({ 
        debounceDelay: 100,
        onError,
      });
      const state = createTestState();

      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage full');
      });

      persistence.autoSave(state);
      vi.advanceTimersByTime(150);

      expect(onError).toHaveBeenCalledWith('LocalStorage save failed - storage may be full');
    });

    it('should preserve header and footer data in saved format', () => {
      const persistence = createNavigationPersistence({ debounceDelay: 0 });
      const state = createTestState({
        headerData: {
          links: [
            { text: 'Home', href: '/' },
            { text: 'About', href: '/about' },
          ],
          actions: [{ text: 'Login', href: '/login' }],
        },
        footerData: {
          links: [{ title: 'Company', links: [{ text: 'About', href: '/about' }] }],
          secondaryLinks: [{ text: 'Privacy', href: '/privacy' }],
          socialLinks: [{ ariaLabel: 'Twitter', icon: 'twitter', href: 'https://twitter.com' }],
          footNote: 'Copyright 2024',
        },
      });

      persistence.saveImmediately(state);

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]) as NavigationStorageData;
      
      expect(savedData.headerData).toEqual(state.headerData);
      expect(savedData.footerData).toEqual(state.footerData);
      expect(savedData.layout).toEqual(state.layout);
      expect(savedData.version).toBe('1.0.0');
      expect(savedData.lastUpdated).toBeDefined();
    });
  });

  describe('Server save functionality', () => {
    beforeEach(() => {
      vi.mocked(isLocalEnvironment).mockReturnValue(true);
      vi.mocked(saveLocally).mockResolvedValue(undefined);
      vi.mocked(getGitHubToken).mockReturnValue(null);
      mockFetch.mockReset();
    });

    it('should save to server via local API in local environment', async () => {
      const persistence = createNavigationPersistence();
      const state = createTestState();

      const result = await persistence.saveToServer(state);

      expect(result.success).toBe(true);
      expect(result.local).toBe(true);
      expect(result.remote).toBe(true);
      expect(saveLocally).toHaveBeenCalled();
    });

    it('should handle server save errors and retain local changes', async () => {
      const onError = vi.fn();
      const persistence = createNavigationPersistence({ onError });
      const state = createTestState();

      vi.mocked(saveLocally).mockRejectedValueOnce(new Error('Network error'));

      const result = await persistence.saveToServer(state);

      expect(result.local).toBe(true);
      expect(result.remote).toBe(false);
      expect(result.error).toBe('Network error');
      expect(onError).toHaveBeenCalledWith('Network error');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should require authentication for GitHub save', async () => {
      vi.mocked(isLocalEnvironment).mockReturnValue(false);
      vi.mocked(getGitHubToken).mockReturnValue(null);

      const onError = vi.fn();
      const persistence = createNavigationPersistence({ onError });
      const state = createTestState();

      const result = await persistence.saveToServer(state);

      expect(result.remote).toBe(false);
      expect(result.error).toContain('Not authenticated');
    });

    it('should save to GitHub when authenticated and not local', async () => {
      vi.mocked(isLocalEnvironment).mockReturnValue(false);
      vi.mocked(getGitHubToken).mockReturnValue('test-token');
      vi.mocked(saveToGitHub).mockResolvedValue(undefined);

      const persistence = createNavigationPersistence();
      const state = createTestState();

      const result = await persistence.saveToServer(state);

      expect(result.success).toBe(true);
      expect(result.remote).toBe(true);
      expect(saveToGitHub).toHaveBeenCalled();
    });

    it('should flush pending debounced saves before server save', async () => {
      const persistence = createNavigationPersistence({ debounceDelay: 1000 });
      const state = createTestState();

      persistence.autoSave(state);
      
      await persistence.saveToServer(state);

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('Load functionality', () => {
    beforeEach(() => {
      vi.mocked(isLocalEnvironment).mockReturnValue(true);
      mockFetch.mockReset();
    });

    it('should load from localStorage first', async () => {
      const data: NavigationStorageData = {
        headerData: { links: [{ text: 'Test', href: '/test' }], actions: [] },
        footerData: { links: [], secondaryLinks: [], socialLinks: [], footNote: '' },
        layout: { type: 'full-width', headerVisible: true, footerVisible: true, sidebarPosition: 'none' },
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
      };

      localStorageMock.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(data));
      mockFetch.mockResolvedValueOnce({ ok: false });

      const persistence = createNavigationPersistence();
      const loaded = await persistence.load();

      expect(loaded).toEqual(data);
    });

    it('should prefer newer server data over local data', async () => {
      const oldDate = new Date('2024-01-01').toISOString();
      const newDate = new Date('2024-12-01').toISOString();

      const localData: NavigationStorageData = {
        headerData: { links: [{ text: 'Old', href: '/old' }], actions: [] },
        footerData: { links: [], secondaryLinks: [], socialLinks: [], footNote: '' },
        layout: { type: 'full-width', headerVisible: true, footerVisible: true, sidebarPosition: 'none' },
        lastUpdated: oldDate,
        version: '1.0.0',
      };

      const serverData: NavigationStorageData = {
        headerData: { links: [{ text: 'New', href: '/new' }], actions: [] },
        footerData: { links: [], secondaryLinks: [], socialLinks: [], footNote: '' },
        layout: { type: 'full-width', headerVisible: true, footerVisible: true, sidebarPosition: 'none' },
        lastUpdated: newDate,
        version: '1.0.0',
      };

      localStorageMock.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(localData));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(serverData),
      });

      const persistence = createNavigationPersistence();
      const loaded = await persistence.load();

      expect(loaded).toEqual(serverData);
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
        NAVIGATION_STORAGE_KEY,
        JSON.stringify(serverData)
      );
    });

    it('should use local data if server fails', async () => {
      const localData: NavigationStorageData = {
        headerData: { links: [{ text: 'Local', href: '/local' }], actions: [] },
        footerData: { links: [], secondaryLinks: [], socialLinks: [], footNote: '' },
        layout: { type: 'full-width', headerVisible: true, footerVisible: true, sidebarPosition: 'none' },
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
      };

      localStorageMock.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(localData));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const persistence = createNavigationPersistence();
      const loaded = await persistence.load();

      expect(loaded).toEqual(localData);
    });
  });
});

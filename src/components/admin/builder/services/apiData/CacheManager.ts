/**
 * CacheManager - Utility for caching API responses
 * 
 * Provides TTL-based caching with automatic expiration checking.
 * Uses IndexedDB as primary storage (larger capacity), falls back to localStorage.
 * Cache keys are generated from widget configuration to ensure uniqueness.
 */

import type { MappedProduct, MappedItem, DataMapperConfig, CacheEntry } from '../../core/types/apiDataWidget.types';

const CACHE_PREFIX = 'api_widget_cache_';
const DB_NAME = 'ApiWidgetCache';
const DB_VERSION = 1;
const STORE_NAME = 'cache';

// In-memory cache for fastest access
const memoryCache = new Map<string, { data: MappedProduct[] | MappedItem[]; expires: number }>();

/**
 * Opens IndexedDB connection
 */
function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => resolve(null);
      
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Gets data from IndexedDB
 */
async function getFromIndexedDB(key: string): Promise<CacheEntry | null> {
  const db = await openDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.entry : null);
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Saves data to IndexedDB
 */
async function saveToIndexedDB(key: string, entry: CacheEntry): Promise<boolean> {
  const db = await openDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ key, entry });
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Deletes data from IndexedDB
 */
async function deleteFromIndexedDB(key: string): Promise<boolean> {
  const db = await openDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Clears all data from IndexedDB
 */
async function clearIndexedDB(): Promise<number> {
  const db = await openDB();
  if (!db) return 0;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const countRequest = store.count();
      
      countRequest.onsuccess = () => {
        const count = countRequest.result;
        store.clear();
        resolve(count);
      };
      countRequest.onerror = () => resolve(0);
    } catch {
      resolve(0);
    }
  });
}

/**
 * Generates a unique cache key based on widget configuration.
 * 
 * @param widgetId - Unique identifier for the widget
 * @param endpoint - API endpoint URL
 * @param method - HTTP method (GET/POST)
 * @param body - Request body (for POST requests)
 * @param mapperConfig - Data mapper configuration
 * @returns A unique cache key string
 * 
 * @example
 * generateCacheKey('widget-1', 'https://api.example.com/products', 'GET', undefined, { rootPath: 'data', itemMapping: {...} })
 * // Returns: 'api_widget_cache_widget-1_abc123...'
 */
export function generateCacheKey(
  widgetId: string,
  endpoint: string,
  method: string,
  body?: Record<string, unknown>,
  mapperConfig?: DataMapperConfig
): string {
  // Create a deterministic string from all parameters
  const parts = [
    widgetId,
    endpoint,
    method,
    body ? JSON.stringify(body) : '',
    mapperConfig ? JSON.stringify(mapperConfig) : '',
  ];
  
  const combined = parts.join('|');
  
  // Simple hash function for creating a shorter key
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `${CACHE_PREFIX}${widgetId}_${Math.abs(hash).toString(36)}`;
}


/**
 * Retrieves cached data if it exists and hasn't expired.
 * Checks memory cache first, then IndexedDB, then localStorage.
 * 
 * @param key - The cache key to look up
 * @returns The cached MappedProduct array, or null if not found or expired
 */
export async function getCachedData(key: string): Promise<(MappedProduct[] | MappedItem[]) | null> {
  const now = Date.now();

  // 1. Check memory cache first (fastest)
  const memCached = memoryCache.get(key);
  if (memCached && now < memCached.expires) {
    return memCached.data;
  }
  if (memCached) {
    memoryCache.delete(key);
  }

  // 2. Check IndexedDB (larger storage)
  const idbEntry = await getFromIndexedDB(key);
  if (idbEntry && now < idbEntry.timestamp) {
    // Populate memory cache
    memoryCache.set(key, { data: idbEntry.data, expires: idbEntry.timestamp });
    return idbEntry.data;
  }
  if (idbEntry) {
    await deleteFromIndexedDB(key);
  }

  // 3. Fallback to localStorage (legacy/small data)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const entry: CacheEntry = JSON.parse(cached);
        if (entry && typeof entry.timestamp === 'number' && Array.isArray(entry.data)) {
          if (now < entry.timestamp) {
            // Migrate to IndexedDB and memory
            memoryCache.set(key, { data: entry.data, expires: entry.timestamp });
            await saveToIndexedDB(key, entry);
            localStorage.removeItem(key); // Clean up localStorage
            return entry.data;
          }
        }
        localStorage.removeItem(key);
      }
    } catch {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    }
  }

  return null;
}

/**
 * Synchronous version for backward compatibility - checks memory only
 */
export function getCachedDataSync(key: string): (MappedProduct[] | MappedItem[]) | null {
  const now = Date.now();
  const memCached = memoryCache.get(key);
  if (memCached && now < memCached.expires) {
    return memCached.data;
  }
  return null;
}

/**
 * Stores data in the cache with a specified duration.
 * Saves to memory cache and IndexedDB (async).
 * 
 * @param key - The cache key to store under
 * @param data - The MappedProduct array to cache
 * @param duration - Cache duration in seconds
 * @param widgetId - Widget identifier for the cache entry
 * @returns true if caching succeeded, false otherwise
 */
export async function setCachedData(
  key: string,
  data: MappedProduct[] | MappedItem[],
  duration: number,
  widgetId: string = ''
): Promise<boolean> {
  // Don't cache if duration is 0 or negative
  if (duration <= 0) {
    return false;
  }

  const expires = Date.now() + (duration * 1000);
  
  // 1. Always save to memory cache (instant access)
  memoryCache.set(key, { data, expires });

  // 2. Save to IndexedDB (persistent, larger storage)
  const entry: CacheEntry = {
    data,
    timestamp: expires,
    widgetId,
  };
  
  const saved = await saveToIndexedDB(key, entry);
  return saved;
}

/**
 * Synchronous version - saves to memory only
 */
export function setCachedDataSync(
  key: string,
  data: MappedProduct[] | MappedItem[],
  duration: number
): boolean {
  if (duration <= 0) return false;
  const expires = Date.now() + (duration * 1000);
  memoryCache.set(key, { data, expires });
  return true;
}

/**
 * Removes a specific cache entry from all storage layers.
 * 
 * @param key - The cache key to remove
 * @returns true if removal succeeded
 */
export async function clearCache(key: string): Promise<boolean> {
  // Clear from memory
  memoryCache.delete(key);
  
  // Clear from IndexedDB
  await deleteFromIndexedDB(key);
  
  // Clear from localStorage (legacy)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(key);
    } catch { /* ignore */ }
  }
  
  return true;
}

/**
 * Clears all API widget cache entries from all storage layers.
 * 
 * @returns The number of entries cleared
 */
export async function clearAllCache(): Promise<number> {
  // Clear memory cache
  const memCount = memoryCache.size;
  memoryCache.clear();
  
  // Clear IndexedDB
  const idbCount = await clearIndexedDB();
  
  // Clear localStorage (legacy)
  let lsCount = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      lsCount = keysToRemove.length;
    } catch { /* ignore */ }
  }

  return Math.max(memCount, idbCount, lsCount);
}


/**
 * CacheManager class providing a stateful interface for cache operations.
 * Uses IndexedDB for persistent storage with memory cache for fast access.
 */
export class CacheManager {
  private widgetId: string;
  private duration: number;
  private cacheKey: string;

  /**
   * Creates a new CacheManager instance.
   * 
   * @param widgetId - Unique identifier for the widget
   * @param endpoint - API endpoint URL
   * @param method - HTTP method (GET/POST)
   * @param duration - Cache duration in seconds (default: 300)
   * @param body - Optional request body for POST requests
   * @param mapperConfig - Optional data mapper configuration
   */
  constructor(
    widgetId: string,
    endpoint: string,
    method: string,
    duration: number = 300,
    body?: Record<string, unknown>,
    mapperConfig?: DataMapperConfig
  ) {
    this.widgetId = widgetId;
    this.duration = duration;
    this.cacheKey = generateCacheKey(widgetId, endpoint, method, body, mapperConfig);
  }

  /**
   * Gets the generated cache key.
   */
  getKey(): string {
    return this.cacheKey;
  }

  /**
   * Retrieves cached data if available and not expired.
   */
  async get(): Promise<(MappedProduct[] | MappedItem[]) | null> {
    return getCachedData(this.cacheKey);
  }

  /**
   * Synchronous get - memory cache only
   */
  getSync(): (MappedProduct[] | MappedItem[]) | null {
    return getCachedDataSync(this.cacheKey);
  }

  /**
   * Stores data in the cache.
   * 
   * @param data - The MappedProduct array to cache
   * @returns true if caching succeeded
   */
  async set(data: MappedProduct[] | MappedItem[]): Promise<boolean> {
    return setCachedData(this.cacheKey, data, this.duration, this.widgetId);
  }

  /**
   * Synchronous set - memory cache only
   */
  setSync(data: MappedProduct[] | MappedItem[]): boolean {
    return setCachedDataSync(this.cacheKey, data, this.duration);
  }

  /**
   * Clears this widget's cache entry.
   */
  async clear(): Promise<boolean> {
    return clearCache(this.cacheKey);
  }

  /**
   * Updates the cache duration.
   */
  setDuration(duration: number): void {
    this.duration = duration;
  }

  /**
   * Gets the current cache duration.
   */
  getDuration(): number {
    return this.duration;
  }

  /**
   * Checks if cached data exists and is valid (memory only for sync check).
   */
  has(): boolean {
    return this.getSync() !== null;
  }

  /**
   * Async check if cached data exists.
   */
  async hasAsync(): Promise<boolean> {
    return (await this.get()) !== null;
  }

  /**
   * Gets data from cache or fetches using the provided function.
   * 
   * @param fetchFn - Async function to fetch data if cache miss
   * @returns The cached or freshly fetched data
   */
  async getOrFetch(fetchFn: () => Promise<MappedProduct[] | MappedItem[]>): Promise<MappedProduct[] | MappedItem[]> {
    const cached = await this.get();
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    await this.set(data);
    return data;
  }
}

/**
 * CacheManager - Utility for caching API responses in localStorage
 * 
 * Provides TTL-based caching with automatic expiration checking.
 * Cache keys are generated from widget configuration to ensure uniqueness.
 */

import type { MappedProduct, DataMapperConfig, CacheEntry } from '../../core/types/apiDataWidget.types';

const CACHE_PREFIX = 'api_widget_cache_';

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
 * 
 * @param key - The cache key to look up
 * @returns The cached MappedProduct array, or null if not found or expired
 * 
 * @example
 * const data = getCachedData('api_widget_cache_widget-1_abc123');
 * if (data) {
 *   // Use cached data
 * } else {
 *   // Fetch fresh data
 * }
 */
export function getCachedData(key: string): MappedProduct[] | null {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const cached = localStorage.getItem(key);
    
    if (!cached) {
      return null;
    }

    const entry: CacheEntry = JSON.parse(cached);
    
    // Validate cache entry structure
    if (!entry || typeof entry.timestamp !== 'number' || !Array.isArray(entry.data)) {
      // Invalid cache entry, remove it
      localStorage.removeItem(key);
      return null;
    }

    // Check if cache has expired (timestamp is expiration time)
    const now = Date.now();
    if (now > entry.timestamp) {
      // Cache expired, remove it
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch {
    // JSON parse error or other issues, remove corrupted entry
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore removal errors
    }
    return null;
  }
}

/**
 * Stores data in the cache with a specified duration.
 * 
 * @param key - The cache key to store under
 * @param data - The MappedProduct array to cache
 * @param duration - Cache duration in seconds
 * @param widgetId - Widget identifier for the cache entry
 * @returns true if caching succeeded, false otherwise
 * 
 * @example
 * setCachedData('api_widget_cache_widget-1_abc123', products, 300, 'widget-1');
 * // Caches products for 5 minutes
 */
export function setCachedData(
  key: string,
  data: MappedProduct[],
  duration: number,
  widgetId: string = ''
): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  // Don't cache if duration is 0 or negative
  if (duration <= 0) {
    return false;
  }

  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now() + (duration * 1000), // Store expiration time
      widgetId,
    };

    localStorage.setItem(key, JSON.stringify(entry));
    return true;
  } catch {
    // localStorage might be full or disabled
    return false;
  }
}

/**
 * Removes a specific cache entry.
 * 
 * @param key - The cache key to remove
 * @returns true if removal succeeded, false otherwise
 * 
 * @example
 * clearCache('api_widget_cache_widget-1_abc123');
 */
export function clearCache(key: string): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears all API widget cache entries from localStorage.
 * 
 * @returns The number of entries cleared
 */
export function clearAllCache(): number {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !window.localStorage) {
    return 0;
  }

  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    return keysToRemove.length;
  } catch {
    return 0;
  }
}


/**
 * CacheManager class providing a stateful interface for cache operations.
 * 
 * Wraps the functional utilities with widget-specific configuration.
 */
export class CacheManager {
  private widgetId: string;
  private endpoint: string;
  private method: string;
  private body?: Record<string, unknown>;
  private mapperConfig?: DataMapperConfig;
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
    this.endpoint = endpoint;
    this.method = method;
    this.duration = duration;
    this.body = body;
    this.mapperConfig = mapperConfig;
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
  get(): MappedProduct[] | null {
    return getCachedData(this.cacheKey);
  }

  /**
   * Stores data in the cache.
   * 
   * @param data - The MappedProduct array to cache
   * @returns true if caching succeeded
   */
  set(data: MappedProduct[]): boolean {
    return setCachedData(this.cacheKey, data, this.duration, this.widgetId);
  }

  /**
   * Clears this widget's cache entry.
   */
  clear(): boolean {
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
   * Checks if cached data exists and is valid.
   */
  has(): boolean {
    return this.get() !== null;
  }

  /**
   * Gets data from cache or fetches using the provided function.
   * 
   * @param fetchFn - Async function to fetch data if cache miss
   * @returns The cached or freshly fetched data
   */
  async getOrFetch(fetchFn: () => Promise<MappedProduct[]>): Promise<MappedProduct[]> {
    const cached = this.get();
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    this.set(data);
    return data;
  }
}

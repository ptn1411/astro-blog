/**
 * API Data Widget Type Definitions
 */

// Auth Configuration
export interface AuthConfig {
  type: 'none' | 'bearer' | 'apiKey';
  token?: string;
  apiKeyHeader?: string;
  apiKeyValue?: string;
}

// API Action Configuration
export interface ApiAction {
  endpoint: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  auth?: AuthConfig;
}

// Item Mapping for product fields
export interface ItemMapping {
  name: string;
  price: string;
  image: string;
  description: string;
  url?: string;
}

// Data Mapper Configuration
export interface DataMapperConfig {
  rootPath: string;
  itemMapping: ItemMapping;
}

// Display Configuration
export interface DisplayConfig {
  layout: 'grid' | 'list';
  columns: 2 | 3 | 4;
  showImage: boolean;
  showPrice: boolean;
  showDescription: boolean;
  currency: string;
  placeholderImage: string;
}

// Cache Configuration
export interface CacheConfig {
  enabled: boolean;
  duration: number; // seconds
}

// Message Configuration
export interface MessageConfig {
  loading: string;
  error: string;
  empty: string;
}

// Main Widget Configuration
export interface ApiDataWidgetConfig {
  id: string;
  type: 'ApiDataWidget';
  action: ApiAction;
  dataMapper: DataMapperConfig;
  display: DisplayConfig;
  cache: CacheConfig;
  messages: MessageConfig;
}

// Mapped Product (output of DataMapper)
export interface MappedProduct {
  name: string;
  price: number | null;
  image: string | null;
  description: string | null;
  url: string | null;
}

// Cache Entry
export interface CacheEntry {
  data: MappedProduct[];
  timestamp: number;
  widgetId: string;
}

// API Error Types
export type ApiError =
  | { type: 'network'; message: string }
  | { type: 'timeout'; message: string }
  | { type: 'http'; status: number; message: string }
  | { type: 'parse'; message: string }
  | { type: 'validation'; message: string };

// Widget State
export interface ApiDataWidgetState {
  loading: boolean;
  error: ApiError | null;
  data: MappedProduct[];
}

// Default configurations
export const DEFAULT_DISPLAY_CONFIG: DisplayConfig = {
  layout: 'grid',
  columns: 3,
  showImage: true,
  showPrice: true,
  showDescription: true,
  currency: 'USD',
  placeholderImage: 'https://via.placeholder.com/300x200?text=No+Image',
};

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  duration: 300, // 5 minutes
};

export const DEFAULT_MESSAGE_CONFIG: MessageConfig = {
  loading: 'Loading...',
  error: 'Failed to load data. Please try again.',
  empty: 'No items found.',
};

export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  type: 'none',
};

export const DEFAULT_ITEM_MAPPING: ItemMapping = {
  name: 'title',
  price: 'price',
  image: 'image',
  description: 'description',
  url: 'url',
};

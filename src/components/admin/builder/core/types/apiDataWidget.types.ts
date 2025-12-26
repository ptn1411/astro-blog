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

// Dynamic Field Definition
export type FieldType = 'text' | 'image' | 'price' | 'link' | 'badge' | 'html';

export interface DynamicField {
  id: string;
  label: string;
  path: string;
  type: FieldType;
  // Optional styling
  className?: string;
}

// Item Mapping for product fields (legacy - kept for backward compatibility)
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
  itemMapping?: ItemMapping; // Legacy - optional for backward compatibility
  fields?: DynamicField[]; // New dynamic fields
}

// Display Configuration
export interface DisplayConfig {
  layout: 'grid' | 'list' | 'card';
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

// Mapped Item (output of DataMapper) - now supports dynamic fields
export interface MappedItem {
  [key: string]: unknown;
  _fields?: DynamicField[]; // Reference to field definitions for rendering
}

// Mapped Product (legacy - kept for backward compatibility)
export interface MappedProduct {
  name: string;
  price: number | null;
  image: string | null;
  description: string | null;
  url: string | null;
}

// Cache Entry
export interface CacheEntry {
  data: MappedProduct[] | MappedItem[];
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
  data: MappedProduct[] | MappedItem[];
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

// Default dynamic fields (equivalent to legacy mapping)
export const DEFAULT_DYNAMIC_FIELDS: DynamicField[] = [
  { id: 'name', label: 'Name', path: 'title', type: 'text' },
  { id: 'price', label: 'Price', path: 'price', type: 'price' },
  { id: 'image', label: 'Image', path: 'image', type: 'image' },
  { id: 'description', label: 'Description', path: 'description', type: 'text' },
];

// Field type options for UI
export const FIELD_TYPE_OPTIONS: { label: string; value: FieldType }[] = [
  { label: 'Text', value: 'text' },
  { label: 'Image', value: 'image' },
  { label: 'Price', value: 'price' },
  { label: 'Link', value: 'link' },
  { label: 'Badge', value: 'badge' },
  { label: 'HTML', value: 'html' },
];

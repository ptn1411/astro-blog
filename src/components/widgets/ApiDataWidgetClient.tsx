/**
 * ApiDataWidgetClient - React client component for API Data Widget
 * This component handles client-side data fetching and rendering
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Types
interface AuthConfig {
  type: 'none' | 'bearer' | 'apiKey';
  token?: string;
  apiKeyHeader?: string;
  apiKeyValue?: string;
}

interface ApiAction {
  endpoint: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  auth?: AuthConfig;
}

interface ItemMapping {
  name: string;
  price: string;
  image: string;
  description: string;
  url?: string;
}

interface DisplayConfig {
  layout: 'grid' | 'list';
  columns: 2 | 3 | 4;
  showImage: boolean;
  showPrice: boolean;
  showDescription: boolean;
  currency: string;
  placeholderImage: string;
}

interface ApiDataWidgetConfig {
  id: string;
  type: 'ApiDataWidget';
  action: ApiAction;
  dataMapper: {
    rootPath: string;
    itemMapping: ItemMapping;
  };
  display: DisplayConfig;
  cache: {
    enabled: boolean;
    duration: number;
  };
  messages: {
    loading: string;
    error: string;
    empty: string;
  };
}

interface MappedProduct {
  name: string;
  price: number | null;
  image: string | null;
  description: string | null;
  url: string | null;
}

interface ApiError {
  type: 'network' | 'http' | 'parse' | 'validation';
  message: string;
  status?: number;
}

export interface ApiDataWidgetClientProps {
  config: ApiDataWidgetConfig;
}

// Utility functions
function getValueByPath(obj: unknown, path: string): unknown {
  if (!path || path.trim() === '') return obj;
  if (obj === null || obj === undefined) return null;

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return null;
    if (typeof current !== 'object') return null;

    const arrayIndex = parseInt(part, 10);
    if (!isNaN(arrayIndex) && Array.isArray(current)) {
      current = current[arrayIndex];
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }

  return current ?? null;
}

function mapArrayData(data: unknown, rootPath: string, itemMapping: ItemMapping): MappedProduct[] {
  const extractedData = getValueByPath(data, rootPath);
  
  // If it's an array, map each item
  if (Array.isArray(extractedData)) {
    return extractedData.map((item) => {
      const name = getValueByPath(item, itemMapping.name);
      const price = getValueByPath(item, itemMapping.price);
      const image = getValueByPath(item, itemMapping.image);
      const description = getValueByPath(item, itemMapping.description);
      const url = itemMapping.url ? getValueByPath(item, itemMapping.url) : null;

      return {
        name: typeof name === 'string' ? name : (name !== null ? String(name) : ''),
        price: typeof price === 'number' ? price : (typeof price === 'string' ? parseFloat(price) || null : null),
        image: typeof image === 'string' ? image : null,
        description: typeof description === 'string' ? description : null,
        url: typeof url === 'string' ? url : null,
      };
    });
  }

  // If it's a single object (not null/undefined), wrap it in an array
  if (extractedData !== null && extractedData !== undefined && typeof extractedData === 'object') {
    const item = extractedData;
    const name = getValueByPath(item, itemMapping.name);
    const price = getValueByPath(item, itemMapping.price);
    const image = getValueByPath(item, itemMapping.image);
    const description = getValueByPath(item, itemMapping.description);
    const url = itemMapping.url ? getValueByPath(item, itemMapping.url) : null;

    return [{
      name: typeof name === 'string' ? name : (name !== null ? String(name) : ''),
      price: typeof price === 'number' ? price : (typeof price === 'string' ? parseFloat(price) || null : null),
      image: typeof image === 'string' ? image : null,
      description: typeof description === 'string' ? description : null,
      url: typeof url === 'string' ? url : null,
    }];
  }

  return [];
}

function sanitizeText(text: string | null): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
}

// Cache functions
const CACHE_PREFIX = 'api_widget_cache_';

function generateCacheKey(widgetId: string, endpoint: string, method: string): string {
  const combined = `${widgetId}|${endpoint}|${method}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${CACHE_PREFIX}${widgetId}_${Math.abs(hash).toString(36)}`;
}

function getCachedData(key: string): MappedProduct[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const entry = JSON.parse(cached);
    if (Date.now() > entry.timestamp) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setCachedData(key: string, data: MappedProduct[], duration: number): void {
  if (typeof window === 'undefined' || duration <= 0) return;
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now() + (duration * 1000),
    }));
  } catch {
    // Ignore storage errors
  }
}

// Components
const LoadingIndicator: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4" />
    <p className="text-gray-600 dark:text-gray-400 text-sm">{message}</p>
  </div>
);

const ErrorDisplay: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
    <p className="text-red-700 dark:text-red-400 font-medium">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-200 rounded-md text-sm font-medium transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
    <p className="text-gray-600 dark:text-gray-400">{message}</p>
  </div>
);

const ProductCard: React.FC<{ product: MappedProduct; display: DisplayConfig }> = ({ product, display }) => {
  const { showImage, showPrice, showDescription, currency, placeholderImage } = display;
  const imageUrl = product.image || placeholderImage;
  const formattedPrice = product.price !== null ? formatPrice(product.price, currency) : '';

  const cardContent = (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {showImage && (
        <div className="aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={imageUrl}
            alt={sanitizeText(product.name) || 'Product image'}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== placeholderImage) {
                target.src = placeholderImage;
              }
            }}
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
          {sanitizeText(product.name)}
        </h3>
        {showPrice && formattedPrice && (
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {formattedPrice}
          </p>
        )}
        {showDescription && product.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
            {sanitizeText(product.description)}
          </p>
        )}
      </div>
    </div>
  );

  if (product.url) {
    return (
      <a href={product.url} target="_blank" rel="noopener noreferrer" className="block">
        {cardContent}
      </a>
    );
  }

  return cardContent;
};

const ProductGrid: React.FC<{ products: MappedProduct[]; display: DisplayConfig }> = ({ products, display }) => {
  const { layout, columns } = display;

  if (products.length === 0) return null;

  if (layout === 'list') {
    return (
      <div className="flex flex-col gap-4">
        {products.map((product, index) => (
          <ProductCard key={`product-${index}`} product={product} display={display} />
        ))}
      </div>
    );
  }

  const columnClasses: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`grid gap-4 ${columnClasses[columns] || columnClasses[3]}`}>
      {products.map((product, index) => (
        <ProductCard key={`product-${index}`} product={product} display={display} />
      ))}
    </div>
  );
};

// Main Component
export const ApiDataWidgetClient: React.FC<ApiDataWidgetClientProps> = ({ config }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<MappedProduct[]>([]);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Extract stable values
  const { action, dataMapper, display, cache, messages } = config;
  const endpoint = action.endpoint;
  const method = action.method;

  const fetchData = useCallback(async () => {
    if (!endpoint) {
      setLoading(false);
      setError({ type: 'validation', message: 'No endpoint configured' });
      return;
    }

    // Check cache
    if (cache.enabled) {
      const cacheKey = generateCacheKey(config.id, endpoint, method);
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...action.headers,
      };

      // Add auth
      if (action.auth?.type === 'bearer' && action.auth.token) {
        headers['Authorization'] = `Bearer ${action.auth.token}`;
      } else if (action.auth?.type === 'apiKey' && action.auth.apiKeyHeader && action.auth.apiKeyValue) {
        headers[action.auth.apiKeyHeader] = action.auth.apiKeyValue;
      }

      const response = await fetch(endpoint, {
        method,
        headers,
        body: method === 'POST' && action.body ? JSON.stringify(action.body) : undefined,
        signal: abortControllerRef.current.signal,
      });

      if (!isMountedRef.current) return;

      if (!response.ok) {
        setError({ type: 'http', message: `HTTP ${response.status}`, status: response.status });
        setLoading(false);
        return;
      }

      const responseData = await response.json();
      const mappedData = mapArrayData(responseData, dataMapper.rootPath, dataMapper.itemMapping);

      // Cache result
      if (cache.enabled && cache.duration > 0) {
        const cacheKey = generateCacheKey(config.id, endpoint, method);
        setCachedData(cacheKey, mappedData, cache.duration);
      }

      setData(mappedData);
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;
      if (err instanceof Error && err.name === 'AbortError') return;
      
      setError({
        type: 'network',
        message: err instanceof Error ? err.message : 'Network error',
      });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [endpoint, method, action, dataMapper, cache, config.id]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  if (loading) {
    return <LoadingIndicator message={messages.loading} />;
  }

  if (error) {
    return <ErrorDisplay message={messages.error} onRetry={fetchData} />;
  }

  if (data.length === 0) {
    return <EmptyState message={messages.empty} />;
  }

  return <ProductGrid products={data} display={display} />;
};

export default ApiDataWidgetClient;

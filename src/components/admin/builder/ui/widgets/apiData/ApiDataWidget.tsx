/**
 * ApiDataWidget Component
 * Main widget component that fetches data from API and displays products
 * Supports both legacy fixed fields and dynamic fields
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 * - Display loading indicator while fetching
 * - Display error message on failure
 * - Display empty state when no data
 * - Support configurable messages for loading, error, and empty states
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  ApiDataWidgetConfig,
  MappedProduct,
  MappedItem,
  DynamicField,
  ApiError,
} from '../../../core/types/apiDataWidget.types';
import {
  DEFAULT_DISPLAY_CONFIG,
  DEFAULT_CACHE_CONFIG,
  DEFAULT_MESSAGE_CONFIG,
} from '../../../core/types/apiDataWidget.types';
import { fetchData, type FetchResult } from '../../../services/apiData/ApiFetcher';
import { mapArrayData, mapDynamicData } from '../../../services/apiData/DataMapper';
import {
  generateCacheKey,
  getCachedDataSync,
  setCachedDataSync,
} from '../../../services/apiData/CacheManager';
import { ProductGrid } from './ProductGrid';
import { DynamicItemGrid } from './DynamicItemGrid';

export interface ApiDataWidgetProps {
  config: ApiDataWidgetConfig;
  /** Optional: Override for testing - skip actual API calls */
  testData?: MappedProduct[] | MappedItem[];
  /** Optional: Force error state for testing */
  testError?: ApiError;
}

// Extended state to support both legacy and dynamic data
interface ExtendedWidgetState {
  loading: boolean;
  error: ApiError | null;
  legacyData: MappedProduct[];
  dynamicData: MappedItem[];
}

/**
 * Loading indicator component
 */
const LoadingIndicator: React.FC<{ message: string }> = ({ message }) => (
  <div className="api-data-widget__loading flex flex-col items-center justify-center py-12">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4" />
    <p className="text-gray-600 text-sm">{message}</p>
  </div>
);

/**
 * Error display component
 */
const ErrorDisplay: React.FC<{ message: string; error?: ApiError; onRetry?: () => void }> = ({
  message,
  error,
  onRetry,
}) => (
  <div className="api-data-widget__error bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <div className="text-red-500 mb-2">
      <svg
        className="w-10 h-10 mx-auto"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    </div>
    <p className="text-red-700 font-medium">{message}</p>
    {error && (
      <p className="text-red-500 text-sm mt-1">
        {error.type === 'http' ? `Status: ${error.status}` : error.type}
      </p>
    )}
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

/**
 * Empty state component
 */
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="api-data-widget__empty bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
    <div className="text-gray-400 mb-2">
      <svg
        className="w-12 h-12 mx-auto"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    </div>
    <p className="text-gray-600">{message}</p>
  </div>
);

/**
 * ApiDataWidget - Main component for fetching and displaying API data
 */
export const ApiDataWidget: React.FC<ApiDataWidgetProps> = ({
  config,
  testData,
  testError,
}) => {
  // Merge config with defaults - memoize to prevent unnecessary re-renders
  const display = useMemo(() => ({ ...DEFAULT_DISPLAY_CONFIG, ...config.display }), [
    config.display?.layout,
    config.display?.columns,
    config.display?.showImage,
    config.display?.showPrice,
    config.display?.showDescription,
    config.display?.currency,
    config.display?.placeholderImage,
  ]);
  
  const cacheEnabled = config.cache?.enabled ?? DEFAULT_CACHE_CONFIG.enabled;
  const cacheDuration = config.cache?.duration ?? DEFAULT_CACHE_CONFIG.duration;
  
  const messages = useMemo(() => ({ ...DEFAULT_MESSAGE_CONFIG, ...config.messages }), [
    config.messages?.loading,
    config.messages?.error,
    config.messages?.empty,
  ]);

  // Extract primitive values for stable dependencies
  const configId = config.id;
  const endpoint = config.action.endpoint;
  const method = config.action.method;
  const bodyStr = config.action.body ? JSON.stringify(config.action.body) : '';
  const rootPath = config.dataMapper.rootPath;
  const itemMappingStr = config.dataMapper.itemMapping ? JSON.stringify(config.dataMapper.itemMapping) : '';
  const fieldsStr = config.dataMapper.fields ? JSON.stringify(config.dataMapper.fields) : '';
  
  // Check if using dynamic fields
  const useDynamicFields = config.dataMapper.fields && config.dataMapper.fields.length > 0;

  // State management - extended to support both legacy and dynamic data
  const [state, setState] = useState<ExtendedWidgetState>({
    loading: true,
    error: null,
    legacyData: [],
    dynamicData: [],
  });

  // AbortController ref for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Track if component is mounted
  const isMountedRef = useRef(true);

  // Fetch data function - use primitive dependencies to avoid infinite loops
  const fetchWidgetData = useCallback(async () => {
    // Handle test mode
    if (testData !== undefined) {
      if (useDynamicFields) {
        setState({ loading: false, error: null, legacyData: [], dynamicData: testData as MappedItem[] });
      } else {
        setState({ loading: false, error: null, legacyData: testData as MappedProduct[], dynamicData: [] });
      }
      return;
    }

    if (testError !== undefined) {
      setState({ loading: false, error: testError, legacyData: [], dynamicData: [] });
      return;
    }

    // Check cache first if enabled
    if (cacheEnabled) {
      const cacheKey = generateCacheKey(
        configId,
        endpoint,
        method,
        bodyStr ? JSON.parse(bodyStr) : undefined,
        { rootPath, itemMapping: itemMappingStr ? JSON.parse(itemMappingStr) : undefined }
      );
      const cachedData = getCachedDataSync(cacheKey);
      if (cachedData !== null) {
        if (useDynamicFields) {
          setState({ loading: false, error: null, legacyData: [], dynamicData: cachedData as MappedItem[] });
        } else {
          setState({ loading: false, error: null, legacyData: cachedData as MappedProduct[], dynamicData: [] });
        }
        return;
      }
    }

    // Set loading state
    setState((prev) => ({ ...prev, loading: true, error: null }));

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();

    try {
      // Fetch data from API
      const result: FetchResult<unknown> = await fetchData(
        config.action,
        abortControllerRef.current.signal
      );

      // Check if component is still mounted
      if (!isMountedRef.current) return;

      if (!result.success) {
        setState({ loading: false, error: result.error, legacyData: [], dynamicData: [] });
        return;
      }

      // Map the response data based on field type
      let mappedData: MappedProduct[] | MappedItem[];
      
      if (useDynamicFields && fieldsStr) {
        const fields = JSON.parse(fieldsStr) as DynamicField[];
        mappedData = mapDynamicData(result.data, rootPath, fields);
        setState({ loading: false, error: null, legacyData: [], dynamicData: mappedData });
      } else if (itemMappingStr) {
        mappedData = mapArrayData(result.data, rootPath, JSON.parse(itemMappingStr));
        setState({ loading: false, error: null, legacyData: mappedData, dynamicData: [] });
      } else {
        setState({ loading: false, error: null, legacyData: [], dynamicData: [] });
        return;
      }

      // Cache the result if enabled
      if (cacheEnabled && cacheDuration > 0) {
        const cacheKey = generateCacheKey(
          configId,
          endpoint,
          method,
          bodyStr ? JSON.parse(bodyStr) : undefined,
          { rootPath, itemMapping: itemMappingStr ? JSON.parse(itemMappingStr) : undefined }
        );
        setCachedDataSync(cacheKey, mappedData as MappedProduct[], cacheDuration);
      }
    } catch (err) {
      // Check if component is still mounted
      if (!isMountedRef.current) return;
      
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') return;
      
      // Handle unexpected errors
      const error: ApiError = {
        type: 'network',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      };
      setState({ loading: false, error, legacyData: [], dynamicData: [] });
    }
  }, [configId, endpoint, method, bodyStr, rootPath, itemMappingStr, fieldsStr, cacheEnabled, cacheDuration, testData, testError, config.action, useDynamicFields]);

  // Fetch data on mount and when config changes
  useEffect(() => {
    isMountedRef.current = true;
    fetchWidgetData();

    // Cleanup: abort pending request on unmount
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchWidgetData]);

  // Retry handler
  const handleRetry = useCallback(() => {
    fetchWidgetData();
  }, [fetchWidgetData]);

  // Render based on state
  const { loading, error, legacyData, dynamicData } = state;

  if (loading) {
    return (
      <div className="api-data-widget" data-widget-id={config.id}>
        <LoadingIndicator message={messages.loading} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="api-data-widget" data-widget-id={config.id}>
        <ErrorDisplay message={messages.error} error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // Render dynamic fields
  if (useDynamicFields && config.dataMapper.fields) {
    if (dynamicData.length === 0) {
      return (
        <div className="api-data-widget" data-widget-id={config.id}>
          <EmptyState message={messages.empty} />
        </div>
      );
    }
    return (
      <div className="api-data-widget" data-widget-id={config.id}>
        <DynamicItemGrid items={dynamicData} fields={config.dataMapper.fields} display={display} />
      </div>
    );
  }

  // Render legacy fields
  if (legacyData.length === 0) {
    return (
      <div className="api-data-widget" data-widget-id={config.id}>
        <EmptyState message={messages.empty} />
      </div>
    );
  }

  return (
    <div className="api-data-widget" data-widget-id={config.id}>
      <ProductGrid products={legacyData} display={display} />
    </div>
  );
};

export default ApiDataWidget;

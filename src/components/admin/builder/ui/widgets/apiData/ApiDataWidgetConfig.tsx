/**
 * ApiDataWidgetConfig Component
 * Builder configuration UI for API Data Widget
 * 
 * Requirements: 6.2, 6.3, 6.4, 6.5
 * - Provide configuration UI for API endpoint, method, headers
 * - Provide configuration UI for data mapping fields
 * - Provide preview of the widget with sample data
 * - Validate required fields before saving
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Play,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import type {
  ApiDataWidgetConfig as WidgetConfig,
  ApiAction,
  AuthConfig,
  DataMapperConfig,
  DisplayConfig,
  CacheConfig,
  MessageConfig,
  MappedProduct,
  MappedItem,
  ApiError,
  DynamicField,
} from '../../../core/types/apiDataWidget.types';
import {
  DEFAULT_DISPLAY_CONFIG,
  DEFAULT_CACHE_CONFIG,
  DEFAULT_MESSAGE_CONFIG,
  DEFAULT_AUTH_CONFIG,
  DEFAULT_ITEM_MAPPING,
  DEFAULT_DYNAMIC_FIELDS,
} from '../../../core/types/apiDataWidget.types';
import { fetchData, validateEndpoint } from '../../../services/apiData/ApiFetcher';
import { mapArrayData, mapDynamicData } from '../../../services/apiData/DataMapper';
import { ProductGrid } from './ProductGrid';
import { DynamicFieldsEditor } from './DynamicFieldsEditor';
import { DynamicItemGrid } from './DynamicItemGrid';

export interface ApiDataWidgetConfigProps {
  /** Current widget configuration */
  config: Partial<WidgetConfig>;
  /** Callback when configuration changes */
  onChange: (config: Partial<WidgetConfig>) => void;
  /** Dark mode flag */
  isDarkMode: boolean;
}

/**
 * Validation result for API Data Widget configuration
 */
export interface ApiDataValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

/**
 * Validates an API Data Widget configuration.
 * Can be used by the builder to validate before saving.
 * 
 * Requirements: 6.4, 6.5
 * - Validate required fields (endpoint URL)
 * - Validate URL format and HTTPS in production
 * 
 * @param config - The widget configuration to validate
 * @returns ApiDataValidationResult with isValid flag and any errors
 */
export function validateApiDataWidgetConfig(config: Partial<WidgetConfig>): ApiDataValidationResult {
  const errors: ValidationErrors = {};

  // Validate endpoint URL (required)
  const endpoint = config.action?.endpoint;
  if (!endpoint) {
    errors.endpoint = 'Endpoint URL is required';
  } else {
    const validation = validateEndpoint(endpoint);
    if (!validation.isValid) {
      errors.endpoint = validation.error;
    }
  }

  // Validate root path (required for data mapping)
  const rootPath = config.dataMapper?.rootPath;
  if (!rootPath) {
    errors.rootPath = 'Root path is required for data mapping';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

interface ValidationErrors {
  endpoint?: string;
  rootPath?: string;
  [key: string]: string | undefined;
}

interface HeaderEntry {
  key: string;
  value: string;
}

interface PreviewState {
  loading: boolean;
  error: ApiError | null;
  data: MappedProduct[];
  dynamicData: MappedItem[];
}

/**
 * Collapsible section component
 */
const Section: React.FC<{
  title: string;
  children: React.ReactNode;
  isDarkMode: boolean;
  defaultOpen?: boolean;
}> = ({ title, children, isDarkMode, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border rounded-lg ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 text-left font-medium text-sm ${
          isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        {title}
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && (
        <div className={`p-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Input field component with label
 */
const FormField: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
  isDarkMode: boolean;
  required?: boolean;
}> = ({ label, error, children, isDarkMode, required }) => (
  <div className="space-y-1">
    <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-xs text-red-500 flex items-center gap-1">
        <AlertCircle size={12} />
        {error}
      </p>
    )}
  </div>
);

/**
 * ApiDataWidgetConfig - Configuration UI for API Data Widget
 */
export const ApiDataWidgetConfig: React.FC<ApiDataWidgetConfigProps> = ({
  config,
  onChange,
  isDarkMode,
}) => {
  // Local state for headers as array (easier to edit)
  const [headers, setHeaders] = useState<HeaderEntry[]>(() => {
    const h = config.action?.headers || {};
    return Object.entries(h).map(([key, value]) => ({ key, value }));
  });

  // Validation errors
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Preview state
  const [preview, setPreview] = useState<PreviewState>({
    loading: false,
    error: null,
    data: [],
    dynamicData: [],
  });
  const [showPreview, setShowPreview] = useState(false);

  // Input classes
  const inputClass = `w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
  }`;

  const selectClass = `w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none ${
    isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'
  }`;

  // Get current values with defaults
  const action: ApiAction = {
    endpoint: config.action?.endpoint || '',
    method: config.action?.method || 'GET',
    headers: config.action?.headers || {},
    body: config.action?.body,
    auth: config.action?.auth || DEFAULT_AUTH_CONFIG,
  };

  const dataMapper: DataMapperConfig = {
    rootPath: config.dataMapper?.rootPath || '',
    itemMapping: config.dataMapper?.itemMapping || DEFAULT_ITEM_MAPPING,
    fields: config.dataMapper?.fields || DEFAULT_DYNAMIC_FIELDS,
  };

  // Get dynamic fields
  const dynamicFields = dataMapper.fields || DEFAULT_DYNAMIC_FIELDS;

  const display: DisplayConfig = { ...DEFAULT_DISPLAY_CONFIG, ...config.display };
  const cache: CacheConfig = { ...DEFAULT_CACHE_CONFIG, ...config.cache };
  const messages: MessageConfig = { ...DEFAULT_MESSAGE_CONFIG, ...config.messages };

  // Update action
  const updateAction = useCallback(
    (updates: Partial<ApiAction>) => {
      onChange({
        ...config,
        action: { ...action, ...updates },
      });
    },
    [config, action, onChange]
  );

  // Update auth
  const updateAuth = useCallback(
    (updates: Partial<AuthConfig>) => {
      updateAction({ auth: { ...action.auth, ...updates } as AuthConfig });
    },
    [action.auth, updateAction]
  );

  // Update data mapper
  const updateDataMapper = useCallback(
    (updates: Partial<DataMapperConfig>) => {
      onChange({
        ...config,
        dataMapper: { ...dataMapper, ...updates },
      });
    },
    [config, dataMapper, onChange]
  );

  // Update display
  const updateDisplay = useCallback(
    (updates: Partial<DisplayConfig>) => {
      onChange({
        ...config,
        display: { ...display, ...updates },
      });
    },
    [config, display, onChange]
  );

  // Update cache
  const updateCache = useCallback(
    (updates: Partial<CacheConfig>) => {
      onChange({
        ...config,
        cache: { ...cache, ...updates },
      });
    },
    [config, cache, onChange]
  );

  // Update messages
  const updateMessages = useCallback(
    (updates: Partial<MessageConfig>) => {
      onChange({
        ...config,
        messages: { ...messages, ...updates },
      });
    },
    [config, messages, onChange]
  );

  // Sync headers array to config
  useEffect(() => {
    const headersObj: Record<string, string> = {};
    headers.forEach(({ key, value }) => {
      if (key.trim()) {
        headersObj[key.trim()] = value;
      }
    });
    if (JSON.stringify(headersObj) !== JSON.stringify(action.headers)) {
      updateAction({ headers: headersObj });
    }
  }, [headers]);

  // Add header
  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  // Remove header
  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  // Update header
  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    setHeaders(headers.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  };

  // Validate configuration
  const validate = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    // Validate endpoint
    if (!action.endpoint) {
      newErrors.endpoint = 'Endpoint URL is required';
    } else {
      const validation = validateEndpoint(action.endpoint);
      if (!validation.isValid) {
        newErrors.endpoint = validation.error;
      }
    }

    // Validate root path
    if (!dataMapper.rootPath) {
      newErrors.rootPath = 'Root path is required for data mapping';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [action.endpoint, dataMapper.rootPath]);

  // Test fetch and preview
  const testFetch = useCallback(async () => {
    if (!validate()) return;

    setPreview({ loading: true, error: null, data: [], dynamicData: [] });
    setShowPreview(true);

    const result = await fetchData(action);

    if (!result.success) {
      setPreview({ loading: false, error: result.error, data: [], dynamicData: [] });
      return;
    }

    try {
      // Use dynamic fields if available, otherwise fall back to legacy mapping
      if (dynamicFields && dynamicFields.length > 0) {
        const mappedDynamicData = mapDynamicData(
          result.data,
          dataMapper.rootPath,
          dynamicFields
        );
        setPreview({ loading: false, error: null, data: [], dynamicData: mappedDynamicData });
      } else {
        const mappedData = mapArrayData(
          result.data,
          dataMapper.rootPath,
          dataMapper.itemMapping || DEFAULT_ITEM_MAPPING
        );
        setPreview({ loading: false, error: null, data: mappedData, dynamicData: [] });
      }
    } catch (err) {
      setPreview({
        loading: false,
        error: {
          type: 'parse',
          message: err instanceof Error ? err.message : 'Failed to map data',
        },
        data: [],
        dynamicData: [],
      });
    }
  }, [action, dataMapper, dynamicFields, validate]);

  return (
    <div className="space-y-4">
      {/* API Configuration Section */}
      <Section title="🔗 API Configuration" isDarkMode={isDarkMode}>
        <div className="space-y-3">
          {/* Endpoint URL */}
          <FormField label="Endpoint URL" error={errors.endpoint} isDarkMode={isDarkMode} required>
            <input
              type="text"
              className={`${inputClass} ${errors.endpoint ? 'border-red-500' : ''}`}
              value={action.endpoint}
              onChange={(e) => updateAction({ endpoint: e.target.value })}
              placeholder="https://api.example.com/products"
            />
          </FormField>

          {/* HTTP Method */}
          <FormField label="HTTP Method" isDarkMode={isDarkMode}>
            <select
              className={selectClass}
              value={action.method}
              onChange={(e) => updateAction({ method: e.target.value as 'GET' | 'POST' })}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </FormField>

          {/* Request Body (POST only) */}
          {action.method === 'POST' && (
            <FormField label="Request Body (JSON)" isDarkMode={isDarkMode}>
              <textarea
                className={inputClass}
                rows={4}
                value={action.body ? JSON.stringify(action.body, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const body = e.target.value ? JSON.parse(e.target.value) : undefined;
                    updateAction({ body });
                  } catch {
                    // Invalid JSON, keep as-is
                  }
                }}
                placeholder='{"key": "value"}'
              />
            </FormField>
          )}
        </div>
      </Section>

      {/* Headers Section */}
      <Section title="📋 Headers" isDarkMode={isDarkMode} defaultOpen={false}>
        <div className="space-y-2">
          {headers.map((header, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                className={`${inputClass} flex-1`}
                value={header.key}
                onChange={(e) => updateHeader(index, 'key', e.target.value)}
                placeholder="Header name"
              />
              <input
                type="text"
                className={`${inputClass} flex-1`}
                value={header.value}
                onChange={(e) => updateHeader(index, 'value', e.target.value)}
                placeholder="Header value"
              />
              <button
                type="button"
                onClick={() => removeHeader(index)}
                className={`p-2 rounded transition-colors ${
                  isDarkMode
                    ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400'
                    : 'hover:bg-red-100 text-gray-500 hover:text-red-600'
                }`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addHeader}
            className={`w-full p-2 text-sm rounded border border-dashed flex items-center justify-center gap-2 transition-colors ${
              isDarkMode
                ? 'border-gray-600 text-gray-400 hover:bg-gray-700'
                : 'border-gray-300 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Plus size={16} /> Add Header
          </button>
        </div>
      </Section>

      {/* Authentication Section */}
      <Section title="🔐 Authentication" isDarkMode={isDarkMode} defaultOpen={false}>
        <div className="space-y-3">
          <FormField label="Auth Type" isDarkMode={isDarkMode}>
            <select
              className={selectClass}
              value={action.auth?.type || 'none'}
              onChange={(e) => updateAuth({ type: e.target.value as AuthConfig['type'] })}
            >
              <option value="none">None</option>
              <option value="bearer">Bearer Token</option>
              <option value="apiKey">API Key</option>
            </select>
          </FormField>

          {action.auth?.type === 'bearer' && (
            <FormField label="Bearer Token" isDarkMode={isDarkMode}>
              <input
                type="password"
                className={inputClass}
                value={action.auth.token || ''}
                onChange={(e) => updateAuth({ token: e.target.value })}
                placeholder="Enter bearer token"
              />
            </FormField>
          )}

          {action.auth?.type === 'apiKey' && (
            <>
              <FormField label="Header Name" isDarkMode={isDarkMode}>
                <input
                  type="text"
                  className={inputClass}
                  value={action.auth.apiKeyHeader || ''}
                  onChange={(e) => updateAuth({ apiKeyHeader: e.target.value })}
                  placeholder="X-API-Key"
                />
              </FormField>
              <FormField label="API Key Value" isDarkMode={isDarkMode}>
                <input
                  type="password"
                  className={inputClass}
                  value={action.auth.apiKeyValue || ''}
                  onChange={(e) => updateAuth({ apiKeyValue: e.target.value })}
                  placeholder="Enter API key"
                />
              </FormField>
            </>
          )}
        </div>
      </Section>

      {/* Data Mapping Section */}
      <Section title="🗺️ Data Mapping" isDarkMode={isDarkMode}>
        <div className="space-y-3">
          <FormField
            label="Root Path (JSONPath to data)"
            error={errors.rootPath}
            isDarkMode={isDarkMode}
          >
            <input
              type="text"
              className={`${inputClass} ${errors.rootPath ? 'border-red-500' : ''}`}
              value={dataMapper.rootPath}
              onChange={(e) => updateDataMapper({ rootPath: e.target.value })}
              placeholder="data.products or leave empty for root"
            />
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Path to the data in API response. Leave empty if data is at root level.
            </p>
          </FormField>

          <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
            <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Field Mappings
            </p>
            <DynamicFieldsEditor
              fields={dynamicFields}
              onChange={(fields) => updateDataMapper({ fields })}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </Section>

      {/* Display Options Section */}
      <Section title="🎨 Display Options" isDarkMode={isDarkMode} defaultOpen={false}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Layout" isDarkMode={isDarkMode}>
              <select
                className={selectClass}
                value={display.layout}
                onChange={(e) => updateDisplay({ layout: e.target.value as 'grid' | 'list' | 'card' })}
              >
                <option value="grid">Grid</option>
                <option value="list">List</option>
                <option value="card">Card (Single)</option>
              </select>
            </FormField>
            <FormField label="Columns" isDarkMode={isDarkMode}>
              <select
                className={selectClass}
                value={display.columns}
                onChange={(e) => updateDisplay({ columns: parseInt(e.target.value) as 2 | 3 | 4 })}
              >
                <option value="2">2 Columns</option>
                <option value="3">3 Columns</option>
                <option value="4">4 Columns</option>
              </select>
            </FormField>
          </div>

          <FormField label="Currency Symbol" isDarkMode={isDarkMode}>
            <input
              type="text"
              className={inputClass}
              value={display.currency}
              onChange={(e) => updateDisplay({ currency: e.target.value })}
              placeholder="USD"
            />
          </FormField>

          <FormField label="Placeholder Image URL" isDarkMode={isDarkMode}>
            <input
              type="text"
              className={inputClass}
              value={display.placeholderImage}
              onChange={(e) => updateDisplay({ placeholderImage: e.target.value })}
              placeholder="https://via.placeholder.com/300x200"
            />
          </FormField>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={display.showImage}
                onChange={(e) => updateDisplay({ showImage: e.target.checked })}
                className="w-4 h-4"
              />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Show Image
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={display.showPrice}
                onChange={(e) => updateDisplay({ showPrice: e.target.checked })}
                className="w-4 h-4"
              />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Show Price
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={display.showDescription}
                onChange={(e) => updateDisplay({ showDescription: e.target.checked })}
                className="w-4 h-4"
              />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Show Description
              </span>
            </label>
          </div>
        </div>
      </Section>

      {/* Cache Settings Section */}
      <Section title="💾 Cache Settings" isDarkMode={isDarkMode} defaultOpen={false}>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={cache.enabled}
              onChange={(e) => updateCache({ enabled: e.target.checked })}
              className="w-4 h-4"
            />
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Enable Caching
            </span>
          </label>

          {cache.enabled && (
            <FormField label="Cache Duration (seconds)" isDarkMode={isDarkMode}>
              <input
                type="number"
                className={inputClass}
                value={cache.duration}
                onChange={(e) => updateCache({ duration: parseInt(e.target.value) || 0 })}
                min={0}
                placeholder="300"
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {cache.duration > 0
                  ? `Data will be cached for ${Math.floor(cache.duration / 60)} minutes`
                  : 'Caching disabled (0 seconds)'}
              </p>
            </FormField>
          )}
        </div>
      </Section>

      {/* Custom Messages Section */}
      <Section title="💬 Custom Messages" isDarkMode={isDarkMode} defaultOpen={false}>
        <div className="space-y-3">
          <FormField label="Loading Message" isDarkMode={isDarkMode}>
            <input
              type="text"
              className={inputClass}
              value={messages.loading}
              onChange={(e) => updateMessages({ loading: e.target.value })}
              placeholder="Loading..."
            />
          </FormField>
          <FormField label="Error Message" isDarkMode={isDarkMode}>
            <input
              type="text"
              className={inputClass}
              value={messages.error}
              onChange={(e) => updateMessages({ error: e.target.value })}
              placeholder="Failed to load data"
            />
          </FormField>
          <FormField label="Empty State Message" isDarkMode={isDarkMode}>
            <input
              type="text"
              className={inputClass}
              value={messages.empty}
              onChange={(e) => updateMessages({ empty: e.target.value })}
              placeholder="No items found"
            />
          </FormField>
        </div>
      </Section>

      {/* Test & Preview Section */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={testFetch}
            disabled={preview.loading}
            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600'
                : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300'
            }`}
          >
            {preview.loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play size={16} />
                Test API & Preview
              </>
            )}
          </button>
          {preview.data.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`p-2 rounded transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>

        {/* Preview Results */}
        {showPreview && (
          <div
            className={`border rounded-lg p-3 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
          >
            {preview.loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-blue-500" />
              </div>
            )}

            {preview.error && (
              <div
                className={`flex items-start gap-2 p-3 rounded ${
                  isDarkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-50 text-red-700'
                }`}
              >
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Error: {preview.error.type}</p>
                  <p className="text-xs mt-1">{preview.error.message}</p>
                </div>
              </div>
            )}

            {!preview.loading && !preview.error && preview.data.length === 0 && (
              <div
                className={`text-center py-4 text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                No data to preview. Click "Test API & Preview" to fetch data.
              </div>
            )}

            {/* Dynamic data preview */}
            {!preview.loading && !preview.error && preview.dynamicData.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={16} className="text-green-500" />
                  <span
                    className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    {preview.dynamicData.length} items loaded
                  </span>
                </div>
                <div className="max-h-96 overflow-auto">
                  <DynamicItemGrid
                    items={preview.dynamicData.slice(0, 6)}
                    fields={dynamicFields}
                    display={display}
                  />
                </div>
                {preview.dynamicData.length > 6 && (
                  <p
                    className={`text-xs text-center mt-2 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    Showing 6 of {preview.dynamicData.length} items
                  </p>
                )}
              </div>
            )}

            {/* Legacy data preview (fallback) */}
            {!preview.loading && !preview.error && preview.data.length > 0 && preview.dynamicData.length === 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={16} className="text-green-500" />
                  <span
                    className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    {preview.data.length} items loaded
                  </span>
                </div>
                <div className="max-h-96 overflow-auto">
                  <ProductGrid products={preview.data.slice(0, 6)} display={display} />
                </div>
                {preview.data.length > 6 && (
                  <p
                    className={`text-xs text-center mt-2 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    Showing 6 of {preview.data.length} items
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiDataWidgetConfig;

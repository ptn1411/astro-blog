/**
 * ApiFetcher - Utility for fetching data from external APIs
 * 
 * Handles request construction, authentication, URL validation,
 * and comprehensive error handling.
 */

import type { ApiAction, ApiError, AuthConfig } from '../../core/types/apiDataWidget.types';

/**
 * Checks if the current environment is production.
 * Can be overridden for testing purposes.
 */
export function isProductionEnvironment(): boolean {
  // Check various environment indicators
  if (typeof window !== 'undefined') {
    // Browser environment - check hostname
    const hostname = window.location.hostname;
    return hostname !== 'localhost' && 
           hostname !== '127.0.0.1' && 
           !hostname.startsWith('192.168.') &&
           !hostname.endsWith('.local');
  }
  
  // Node environment - check NODE_ENV
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'production';
  }
  
  return false;
}

/**
 * Validates an endpoint URL.
 * In production mode, only HTTPS URLs are allowed.
 * 
 * @param endpoint - The URL to validate
 * @param isProduction - Whether to enforce HTTPS (defaults to auto-detect)
 * @returns Object with isValid boolean and optional error message
 * 
 * @example
 * validateEndpoint('https://api.example.com/data') // { isValid: true }
 * validateEndpoint('http://api.example.com/data', true) // { isValid: false, error: '...' }
 */
export function validateEndpoint(
  endpoint: string,
  isProduction?: boolean
): { isValid: boolean; error?: string } {
  // Check if endpoint is provided
  if (!endpoint || endpoint.trim() === '') {
    return { isValid: false, error: 'Endpoint URL is required' };
  }

  // Try to parse the URL
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }

  // Check protocol
  const protocol = url.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') {
    return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
  }

  // In production, require HTTPS
  const isProd = isProduction ?? isProductionEnvironment();
  if (isProd && protocol !== 'https:') {
    return { isValid: false, error: 'HTTPS is required in production mode' };
  }

  return { isValid: true };
}

/**
 * Builds authentication headers based on auth configuration.
 * 
 * @param auth - Authentication configuration
 * @returns Headers object with auth headers added
 */
function buildAuthHeaders(auth?: AuthConfig): Record<string, string> {
  if (!auth || auth.type === 'none') {
    return {};
  }

  if (auth.type === 'bearer' && auth.token) {
    return { 'Authorization': `Bearer ${auth.token}` };
  }

  if (auth.type === 'apiKey' && auth.apiKeyHeader && auth.apiKeyValue) {
    return { [auth.apiKeyHeader]: auth.apiKeyValue };
  }

  return {};
}

/**
 * Builds a RequestInit object for the fetch API from an ApiAction.
 * 
 * @param action - The API action configuration
 * @returns RequestInit object ready for fetch()
 * 
 * @example
 * const init = buildRequestInit({
 *   endpoint: 'https://api.example.com/products',
 *   method: 'GET',
 *   headers: { 'X-Custom': 'value' },
 *   auth: { type: 'bearer', token: 'abc123' }
 * });
 * // Returns: { method: 'GET', headers: { 'X-Custom': 'value', 'Authorization': 'Bearer abc123' } }
 */
export function buildRequestInit(action: ApiAction): RequestInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...action.headers,
    ...buildAuthHeaders(action.auth),
  };

  const init: RequestInit = {
    method: action.method,
    headers,
  };

  // Add body for POST requests
  if (action.method === 'POST' && action.body) {
    init.body = JSON.stringify(action.body);
  }

  return init;
}

/**
 * Creates an ApiError from various error conditions.
 */
function createNetworkError(error: unknown): ApiError {
  const message = error instanceof Error ? error.message : 'Network request failed';
  
  // Check for abort/timeout
  if (error instanceof Error && error.name === 'AbortError') {
    return { type: 'timeout', message: 'Request was aborted or timed out' };
  }
  
  return { type: 'network', message };
}

function createHttpError(status: number, statusText: string): ApiError {
  return { 
    type: 'http', 
    status, 
    message: `HTTP ${status}: ${statusText || 'Request failed'}` 
  };
}

function createParseError(error: unknown): ApiError {
  const message = error instanceof Error ? error.message : 'Failed to parse response';
  return { type: 'parse', message };
}

function createValidationError(message: string): ApiError {
  return { type: 'validation', message };
}

/**
 * Result type for fetchData function.
 */
export type FetchResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };

/**
 * Fetches data from an API endpoint.
 * 
 * @param action - The API action configuration
 * @param abortSignal - Optional AbortSignal for cancellation
 * @param isProduction - Optional override for production mode check
 * @returns Promise resolving to FetchResult with data or error
 * 
 * @example
 * const controller = new AbortController();
 * const result = await fetchData(action, controller.signal);
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 */
export async function fetchData<T = unknown>(
  action: ApiAction,
  abortSignal?: AbortSignal,
  isProduction?: boolean
): Promise<FetchResult<T>> {
  // Validate endpoint URL
  const validation = validateEndpoint(action.endpoint, isProduction);
  if (!validation.isValid) {
    return { success: false, error: createValidationError(validation.error!) };
  }

  // Build request configuration
  const requestInit = buildRequestInit(action);
  
  // Add abort signal if provided
  if (abortSignal) {
    requestInit.signal = abortSignal;
  }

  try {
    // Make the fetch request
    const response = await fetch(action.endpoint, requestInit);

    // Check for HTTP errors
    if (!response.ok) {
      return { 
        success: false, 
        error: createHttpError(response.status, response.statusText) 
      };
    }

    // Parse JSON response
    try {
      const data = await response.json() as T;
      return { success: true, data };
    } catch (parseError) {
      return { success: false, error: createParseError(parseError) };
    }
  } catch (fetchError) {
    return { success: false, error: createNetworkError(fetchError) };
  }
}

/**
 * ApiFetcher class providing a stateful interface for API fetching.
 * 
 * Wraps the functional utilities with action-specific configuration
 * and provides AbortController management.
 */
export class ApiFetcher {
  private action: ApiAction;
  private abortController: AbortController | null = null;
  private isProduction?: boolean;

  /**
   * Creates a new ApiFetcher instance.
   * 
   * @param action - The API action configuration
   * @param isProduction - Optional override for production mode check
   */
  constructor(action: ApiAction, isProduction?: boolean) {
    this.action = action;
    this.isProduction = isProduction;
  }

  /**
   * Gets the current action configuration.
   */
  getAction(): ApiAction {
    return this.action;
  }

  /**
   * Updates the action configuration.
   */
  setAction(action: ApiAction): void {
    this.action = action;
  }

  /**
   * Validates the current endpoint URL.
   */
  validateEndpoint(): { isValid: boolean; error?: string } {
    return validateEndpoint(this.action.endpoint, this.isProduction);
  }

  /**
   * Fetches data from the configured endpoint.
   * Automatically manages AbortController for request cancellation.
   * 
   * @returns Promise resolving to FetchResult with data or error
   */
  async fetch<T = unknown>(): Promise<FetchResult<T>> {
    // Cancel any pending request
    this.abort();

    // Create new AbortController
    this.abortController = new AbortController();

    return fetchData<T>(this.action, this.abortController.signal, this.isProduction);
  }

  /**
   * Aborts the current pending request if any.
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Checks if there's a pending request.
   */
  isPending(): boolean {
    return this.abortController !== null;
  }

  /**
   * Builds the RequestInit for the current action.
   * Useful for debugging or custom fetch implementations.
   */
  buildRequestInit(): RequestInit {
    return buildRequestInit(this.action);
  }
}

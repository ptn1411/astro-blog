/**
 * Retry with Exponential Backoff Utility
 * 
 * Provides retry logic for network errors with increasing delays.
 * Used by CopilotKit integration to handle transient failures.
 * 
 * Requirements: 7.3
 */

import { AI_CONFIG } from '../../config';

/**
 * Error types that should trigger a retry
 */
export const RETRYABLE_ERRORS = [
  'NetworkError',
  'TypeError', // fetch throws TypeError for network issues
  'AbortError',
  'TimeoutError',
] as const;

/**
 * HTTP status codes that should trigger a retry
 */
export const RETRYABLE_STATUS_CODES = [
  408, // Request Timeout
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
] as const;

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay in milliseconds for exponential backoff */
  baseDelayMs: number;
  /** Maximum delay in milliseconds between retries */
  maxDelayMs: number;
  /** Optional callback when a retry occurs */
  onRetry?: (attempt: number, delay: number, error: Error) => void;
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDelayMs: number;
}

/**
 * Calculate delay for a given retry attempt using exponential backoff with jitter
 * 
 * Formula: min(maxDelay, baseDelay * 2^attempt + random jitter)
 * 
 * @param attempt - Current retry attempt (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  
  // Add jitter (0-25% of the delay) to prevent thundering herd
  const jitter = Math.random() * 0.25 * exponentialDelay;
  
  // Cap at maxDelay
  const delay = Math.min(config.maxDelayMs, exponentialDelay + jitter);
  
  return Math.round(delay);
}

/**
 * Check if an error is retryable
 * 
 * @param error - The error to check
 * @returns true if the error should trigger a retry
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Check error name
    if (RETRYABLE_ERRORS.includes(error.name as typeof RETRYABLE_ERRORS[number])) {
      return true;
    }
    
    // Check for network-related error messages
    const message = error.message.toLowerCase();
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    ) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if an HTTP response status code is retryable
 * 
 * @param status - HTTP status code
 * @returns true if the status code should trigger a retry
 */
export function isRetryableStatusCode(status: number): boolean {
  return RETRYABLE_STATUS_CODES.includes(status as typeof RETRYABLE_STATUS_CODES[number]);
}

/**
 * Sleep for a specified duration
 * 
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff
 * 
 * @param fn - Async function to execute
 * @param config - Retry configuration (defaults to AI_CONFIG.retry)
 * @returns RetryResult with success status, data, and metadata
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const fullConfig: RetryConfig = {
    maxRetries: config.maxRetries ?? AI_CONFIG.retry.maxRetries,
    baseDelayMs: config.baseDelayMs ?? AI_CONFIG.retry.baseDelayMs,
    maxDelayMs: config.maxDelayMs ?? AI_CONFIG.retry.maxDelayMs,
    onRetry: config.onRetry,
  };

  let lastError: Error | undefined;
  let totalDelayMs = 0;
  let attempts = 0;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    attempts = attempt + 1;
    
    try {
      const result = await fn();
      return {
        success: true,
        data: result,
        attempts,
        totalDelayMs,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry
      const shouldRetry = attempt < fullConfig.maxRetries && isRetryableError(error);
      
      if (!shouldRetry) {
        break;
      }
      
      // Calculate delay and wait
      const delay = calculateBackoffDelay(attempt, fullConfig);
      totalDelayMs += delay;
      
      // Notify about retry
      fullConfig.onRetry?.(attempt + 1, delay, lastError);
      
      await sleep(delay);
    }
  }

  return {
    success: false,
    error: lastError,
    attempts,
    totalDelayMs,
  };
}

/**
 * Wrapper for fetch with retry logic
 * 
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param retryConfig - Retry configuration
 * @returns Response or throws error after all retries exhausted
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryConfig?: Partial<RetryConfig>
): Promise<Response> {
  const result = await retryWithBackoff(async () => {
    const response = await fetch(url, options);
    
    // Check if response status is retryable
    if (isRetryableStatusCode(response.status)) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  }, retryConfig);

  if (!result.success || !result.data) {
    throw result.error || new Error('Request failed after retries');
  }

  return result.data;
}

/**
 * Default retry configuration from AI_CONFIG
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: AI_CONFIG.retry.maxRetries,
  baseDelayMs: AI_CONFIG.retry.baseDelayMs,
  maxDelayMs: AI_CONFIG.retry.maxDelayMs,
};

export default retryWithBackoff;

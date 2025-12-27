/**
 * useAIAvailability - Hook for managing AI feature availability
 * 
 * Provides graceful degradation when AI features fail.
 * Story Builder core functionality remains operational even when AI is unavailable.
 * 
 * Requirements: 7.4
 */

import React, { useState, useCallback, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

/**
 * AI availability status
 */
export type AIStatus = 
  | 'available'      // AI is working normally
  | 'degraded'       // AI has issues but may recover
  | 'unavailable'    // AI is completely unavailable
  | 'rate_limited'   // User has exceeded rate limit
  | 'auth_error';    // Authentication failed

/**
 * Error information for AI failures
 */
export interface AIError {
  type: AIStatus;
  message: string;
  retryAfter?: number; // Seconds until retry (for rate limiting)
  timestamp: number;
}

/**
 * AI availability state
 */
export interface AIAvailabilityState {
  /** Current AI status */
  status: AIStatus;
  /** Whether AI features are enabled */
  isEnabled: boolean;
  /** Current error (if any) */
  error: AIError | null;
  /** Number of consecutive failures */
  failureCount: number;
  /** Last successful AI interaction timestamp */
  lastSuccessAt: number | null;
}

/**
 * AI availability actions
 */
export interface AIAvailabilityActions {
  /** Report a successful AI interaction */
  reportSuccess: () => void;
  /** Report an AI failure */
  reportFailure: (error: AIError) => void;
  /** Manually disable AI features */
  disableAI: () => void;
  /** Manually enable AI features */
  enableAI: () => void;
  /** Reset error state and try again */
  resetError: () => void;
  /** Check if AI should be retried */
  shouldRetry: () => boolean;
}


/**
 * Combined AI availability context value
 */
export interface AIAvailabilityContextValue extends AIAvailabilityState, AIAvailabilityActions {}

/**
 * Default context value
 */
const defaultContextValue: AIAvailabilityContextValue = {
  status: 'available',
  isEnabled: true,
  error: null,
  failureCount: 0,
  lastSuccessAt: null,
  reportSuccess: () => {},
  reportFailure: () => {},
  disableAI: () => {},
  enableAI: () => {},
  resetError: () => {},
  shouldRetry: () => true,
};

/**
 * Context for AI availability
 */
export const AIAvailabilityContext = createContext<AIAvailabilityContextValue>(defaultContextValue);

/**
 * Maximum consecutive failures before disabling AI
 */
const MAX_FAILURES_BEFORE_DISABLE = 5;

/**
 * Time to wait before auto-recovering from degraded state (ms)
 */
const AUTO_RECOVERY_DELAY_MS = 30000; // 30 seconds

/**
 * Hook for managing AI availability state
 */
export function useAIAvailabilityState(): AIAvailabilityContextValue {
  const [state, setState] = useState<AIAvailabilityState>({
    status: 'available',
    isEnabled: true,
    error: null,
    failureCount: 0,
    lastSuccessAt: null,
  });

  // Auto-recovery timer
  useEffect(() => {
    if (state.status === 'degraded' && state.isEnabled) {
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          status: 'available',
          error: null,
          failureCount: 0,
        }));
      }, AUTO_RECOVERY_DELAY_MS);

      return () => clearTimeout(timer);
    }
  }, [state.status, state.isEnabled]);

  // Rate limit countdown
  useEffect(() => {
    if (state.status === 'rate_limited' && state.error?.retryAfter) {
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          status: 'available',
          error: null,
        }));
      }, state.error.retryAfter * 1000);

      return () => clearTimeout(timer);
    }
  }, [state.status, state.error?.retryAfter]);

  const reportSuccess = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'available',
      error: null,
      failureCount: 0,
      lastSuccessAt: Date.now(),
    }));
  }, []);

  const reportFailure = useCallback((error: AIError) => {
    setState(prev => {
      const newFailureCount = prev.failureCount + 1;
      const shouldDisable = newFailureCount >= MAX_FAILURES_BEFORE_DISABLE;

      // Determine new status based on error type
      let newStatus: AIStatus = error.type;
      if (shouldDisable && error.type !== 'rate_limited' && error.type !== 'auth_error') {
        newStatus = 'unavailable';
      }

      return {
        ...prev,
        status: newStatus,
        error,
        failureCount: newFailureCount,
        isEnabled: !shouldDisable || error.type === 'rate_limited',
      };
    });
  }, []);

  const disableAI = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'unavailable',
      isEnabled: false,
    }));
  }, []);

  const enableAI = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'available',
      isEnabled: true,
      error: null,
      failureCount: 0,
    }));
  }, []);

  const resetError = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: prev.isEnabled ? 'available' : 'unavailable',
      error: null,
      failureCount: 0,
    }));
  }, []);

  const shouldRetry = useCallback(() => {
    // Don't retry if disabled or auth error
    if (!state.isEnabled || state.status === 'auth_error') {
      return false;
    }
    
    // Don't retry if rate limited (wait for countdown)
    if (state.status === 'rate_limited') {
      return false;
    }
    
    // Allow retry if under failure threshold
    return state.failureCount < MAX_FAILURES_BEFORE_DISABLE;
  }, [state.isEnabled, state.status, state.failureCount]);

  return {
    ...state,
    reportSuccess,
    reportFailure,
    disableAI,
    enableAI,
    resetError,
    shouldRetry,
  };
}


/**
 * Provider component for AI availability context
 */
export interface AIAvailabilityProviderProps {
  children: ReactNode;
}

export function AIAvailabilityProvider({ children }: AIAvailabilityProviderProps) {
  const value = useAIAvailabilityState();

  return (
    <AIAvailabilityContext.Provider value={value}>
      {children}
    </AIAvailabilityContext.Provider>
  );
}

/**
 * Hook to access AI availability context
 */
export function useAIAvailability(): AIAvailabilityContextValue {
  return useContext(AIAvailabilityContext);
}

/**
 * Helper to create an AIError from various error types
 */
export function createAIError(
  error: unknown,
  httpStatus?: number
): AIError {
  const timestamp = Date.now();

  // Handle rate limiting
  if (httpStatus === 429) {
    // Try to extract Retry-After header value
    let retryAfter = 60; // Default 1 minute
    if (error instanceof Response) {
      const retryHeader = error.headers.get('Retry-After');
      if (retryHeader) {
        retryAfter = parseInt(retryHeader, 10) || 60;
      }
    }

    return {
      type: 'rate_limited',
      message: 'Đã vượt giới hạn sử dụng. Vui lòng thử lại sau.',
      retryAfter,
      timestamp,
    };
  }

  // Handle auth errors
  if (httpStatus === 401 || httpStatus === 403) {
    return {
      type: 'auth_error',
      message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
      timestamp,
    };
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'unavailable',
      message: 'Không thể kết nối đến AI service. Vui lòng kiểm tra kết nối mạng.',
      timestamp,
    };
  }

  // Handle server errors
  if (httpStatus && httpStatus >= 500) {
    return {
      type: 'degraded',
      message: 'AI service đang gặp sự cố. Vui lòng thử lại sau.',
      timestamp,
    };
  }

  // Generic error
  const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
  return {
    type: 'degraded',
    message,
    timestamp,
  };
}

/**
 * Check if Story Builder should show AI features
 * Returns true if AI is available or degraded (still usable)
 */
export function shouldShowAIFeatures(status: AIStatus): boolean {
  return status === 'available' || status === 'degraded';
}

/**
 * Get user-friendly status message
 */
export function getStatusMessage(state: AIAvailabilityState): string | null {
  switch (state.status) {
    case 'available':
      return null;
    case 'degraded':
      return 'AI đang gặp một số vấn đề. Một số tính năng có thể không hoạt động.';
    case 'unavailable':
      return 'AI không khả dụng. Story Builder vẫn hoạt động bình thường.';
    case 'rate_limited':
      if (state.error?.retryAfter) {
        const minutes = Math.ceil(state.error.retryAfter / 60);
        return `Đã vượt giới hạn sử dụng. Thử lại sau ${minutes} phút.`;
      }
      return 'Đã vượt giới hạn sử dụng. Vui lòng thử lại sau.';
    case 'auth_error':
      return 'Vui lòng đăng nhập lại để sử dụng AI.';
    default:
      return null;
  }
}

export default useAIAvailability;

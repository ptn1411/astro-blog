/**
 * AI Module - CopilotKit Integration for Story Builder
 * 
 * This module provides AI assistant capabilities for the Story Builder,
 * including chat interface, context awareness, and AI-powered actions.
 */

// Provider
export { CopilotProvider, CopilotAuthContext, useCopilotAuth } from './CopilotProvider';
export type { CopilotProviderProps, AuthState } from './CopilotProvider';

// Chat Component
export { StoryAIChat } from './StoryAIChat';
export type { StoryAIChatProps } from './StoryAIChat';

// Hooks
export { useStoryAI, buildStoryContext, formatContextForAI } from './useStoryAI';
export type { UseStoryAIOptions, StoryContext, StoryBuilderActions } from './useStoryAI';

// Retry Utilities
export {
  retryWithBackoff,
  fetchWithRetry,
  calculateBackoffDelay,
  isRetryableError,
  isRetryableStatusCode,
  sleep,
  DEFAULT_RETRY_CONFIG,
  RETRYABLE_ERRORS,
  RETRYABLE_STATUS_CODES,
} from './retryWithBackoff';
export type { RetryConfig, RetryResult } from './retryWithBackoff';

// AI Availability (Graceful Degradation)
export {
  useAIAvailability,
  useAIAvailabilityState,
  AIAvailabilityProvider,
  AIAvailabilityContext,
  createAIError,
  shouldShowAIFeatures,
  getStatusMessage,
} from './useAIAvailability';
export type {
  AIStatus,
  AIError,
  AIAvailabilityState,
  AIAvailabilityActions,
  AIAvailabilityContextValue,
  AIAvailabilityProviderProps,
} from './useAIAvailability';

// API Key Status Monitoring
export { AIKeyStatus, AIKeyStatusModal, AIKeyStatusButton } from './AIKeyStatus';
export type { AIKeyStatusProps, AIKeyStatusModalProps, AIKeyStatusButtonProps } from './AIKeyStatus';

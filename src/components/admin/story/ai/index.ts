/**
 * AI Module - CopilotKit Integration for Story Builder
 *
 * This module provides AI assistant capabilities for the Story Builder,
 * including chat interface, context awareness, and AI-powered actions.
 */

// Provider
export {
  CopilotAuthContext,
  CopilotProvider,
  ServerStatusContext,
  useCopilotAuth,
  useServerStatus,
} from './CopilotProvider';
export type { AuthState, CopilotProviderProps } from './CopilotProvider';

// Chat Component
export { StoryAIChat } from './StoryAIChat';
export type { StoryAIChatProps } from './StoryAIChat';

// Hooks
export { buildStoryContext, formatContextForAI, useStoryAI } from './useStoryAI';
export type { StoryBuilderActions, StoryContext, UseStoryAIOptions } from './useStoryAI';

// Retry Utilities
export {
  calculateBackoffDelay,
  DEFAULT_RETRY_CONFIG,
  fetchWithRetry,
  isRetryableError,
  isRetryableStatusCode,
  RETRYABLE_ERRORS,
  RETRYABLE_STATUS_CODES,
  retryWithBackoff,
  sleep,
} from './retryWithBackoff';
export type { RetryConfig, RetryResult } from './retryWithBackoff';

// AI Availability (Graceful Degradation)
export {
  AIAvailabilityContext,
  AIAvailabilityProvider,
  createAIError,
  getStatusMessage,
  shouldShowAIFeatures,
  useAIAvailability,
  useAIAvailabilityState,
} from './useAIAvailability';
export type {
  AIAvailabilityActions,
  AIAvailabilityContextValue,
  AIAvailabilityProviderProps,
  AIAvailabilityState,
  AIError,
  AIStatus,
} from './useAIAvailability';

// AI Settings
export { useAISettings } from './useAISettings';
export type { AISettings } from './useAISettings';

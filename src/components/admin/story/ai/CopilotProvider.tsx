/**
 * CopilotProvider - Wrapper component for CopilotKit integration
 * 
 * Wraps Story Builder with CopilotKit context and handles:
 * - GitHub token injection into headers
 * - Authentication error handling
 * - Connection to Worker proxy
 * - Graceful degradation when AI fails
 * - Auto-fallback from OpenRouter to Gemini
 * 
 * Requirements: 1.1, 1.5, 7.4
 */

import { CopilotKit } from '@copilotkit/react-core';
import React, { useCallback, useEffect, useState } from 'react';
import { getGitHubToken, getCopilotKitUrl } from '../../config';
import { AIAvailabilityProvider, useAIAvailability, createAIError } from './useAIAvailability';
import type { AIError } from './useAIAvailability';

type AIProvider = 'openrouter' | 'gemini';

export interface CopilotProviderProps {
  children: React.ReactNode;
  /** Override the default worker URL */
  workerUrl?: string;
  /** Callback when authentication fails */
  onAuthError?: (error: Error) => void;
  /** Callback when AI becomes unavailable */
  onAIUnavailable?: (error: AIError) => void;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface ProvidersInfo {
  openrouter: boolean;
  gemini: boolean;
  primary: AIProvider;
}

/**
 * Inner provider that uses AI availability context
 */
function CopilotProviderInner({ 
  children, 
  workerUrl,
  onAuthError,
  onAIUnavailable,
}: CopilotProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });
  const [currentProvider, setCurrentProvider] = useState<AIProvider>('gemini'); // Gemini first (higher free tier)
  const [providers, setProviders] = useState<ProvidersInfo | null>(null);
  const [failedProviders, setFailedProviders] = useState<Set<AIProvider>>(new Set());

  const aiAvailability = useAIAvailability();
  const baseUrl = workerUrl || getCopilotKitUrl();
  
  // Build runtime URL based on current provider
  const runtimeUrl = currentProvider === 'gemini' 
    ? `${baseUrl}/gemini`
    : baseUrl;

  // Fetch available providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const providersUrl = baseUrl.replace('/api/copilotkit', '/api/copilotkit/providers');
        const res = await fetch(providersUrl);
        if (res.ok) {
          const data = await res.json() as ProvidersInfo;
          setProviders(data);
          setCurrentProvider(data.primary);
        }
      } catch (e) {
        console.warn('Could not fetch providers info:', e);
      }
    };
    fetchProviders();
  }, [baseUrl]);

  // Get headers with GitHub token for authentication
  const getHeaders = useCallback(() => {
    const token = getGitHubToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }, []);

  // Handle CopilotKit errors with fallback logic
  const handleError = useCallback((error: unknown) => {
    console.error('CopilotKit error:', error);
    
    // Extract error message properly
    let errorMessage = 'Đã xảy ra lỗi với AI service';
    let statusCode: number | undefined;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      if ('message' in error) {
        errorMessage = String((error as { message: unknown }).message);
      }
      if ('status' in error) {
        statusCode = Number((error as { status: unknown }).status);
      }
    }
    
    // Check if this is a rate limit or quota error (should fallback)
    const isQuotaError = statusCode === 429 || 
      errorMessage.toLowerCase().includes('quota') ||
      errorMessage.toLowerCase().includes('rate limit') ||
      errorMessage.toLowerCase().includes('insufficient');
    
    if (isQuotaError && providers) {
      // Mark current provider as failed
      setFailedProviders(prev => new Set(prev).add(currentProvider));
      
      // Try to fallback to another provider
      // Gemini → OpenRouter fallback
      if (currentProvider === 'gemini' && providers.openrouter && !failedProviders.has('openrouter')) {
        console.log('Gemini quota exceeded, switching to OpenRouter...');
        setCurrentProvider('openrouter');
        return; // Don't report as unavailable yet
      }
      // OpenRouter → Gemini fallback (if started with OpenRouter)
      if (currentProvider === 'openrouter' && providers.gemini && !failedProviders.has('gemini')) {
        console.log('OpenRouter quota exceeded, switching to Gemini...');
        setCurrentProvider('gemini');
        return;
      }
    }
    
    // Report to availability system
    aiAvailability.reportFailure(createAIError(new Error(errorMessage), statusCode));
  }, [aiAvailability, currentProvider, providers, failedProviders]);

  // Check authentication on mount
  useEffect(() => {
    const token = getGitHubToken();
    if (token) {
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } else {
      const error = new Error('Vui lòng đăng nhập qua CMS để sử dụng AI');
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: error.message,
      });
      onAuthError?.(error);
      
      // Report auth error to availability system
      aiAvailability.reportFailure(createAIError(error, 401));
    }
  }, [onAuthError, aiAvailability]);

  // Notify when AI becomes unavailable
  useEffect(() => {
    if (aiAvailability.status === 'unavailable' && aiAvailability.error) {
      onAIUnavailable?.(aiAvailability.error);
    }
  }, [aiAvailability.status, aiAvailability.error, onAIUnavailable]);

  // If still loading, render children with auth context only
  if (authState.isLoading) {
    return (
      <CopilotAuthContext.Provider value={authState}>
        {children}
      </CopilotAuthContext.Provider>
    );
  }

  // If not authenticated, render children without CopilotKit
  if (!authState.isAuthenticated) {
    return (
      <CopilotAuthContext.Provider value={authState}>
        {children}
      </CopilotAuthContext.Provider>
    );
  }

  // If AI is completely disabled, render children without CopilotKit
  if (!aiAvailability.isEnabled && aiAvailability.status === 'unavailable') {
    return (
      <CopilotAuthContext.Provider value={authState}>
        {children}
      </CopilotAuthContext.Provider>
    );
  }

  return (
    <CopilotAuthContext.Provider value={authState}>
      <CopilotKit
        key={currentProvider} // Force re-mount when provider changes
        runtimeUrl={runtimeUrl}
        headers={getHeaders()}
        onError={handleError}
      >
        {children}
      </CopilotKit>
    </CopilotAuthContext.Provider>
  );
}

/**
 * CopilotProvider wraps children with CopilotKit context
 * Injects GitHub token for authentication with Worker proxy
 * Provides graceful degradation when AI features fail
 */
export function CopilotProvider(props: CopilotProviderProps) {
  return (
    <AIAvailabilityProvider>
      <CopilotProviderInner {...props} />
    </AIAvailabilityProvider>
  );
}

/**
 * Context for sharing auth state with child components
 */
export const CopilotAuthContext = React.createContext<AuthState>({
  isAuthenticated: false,
  isLoading: true,
  error: null,
});

/**
 * Hook to access CopilotKit auth state
 */
export function useCopilotAuth(): AuthState {
  return React.useContext(CopilotAuthContext);
}

export default CopilotProvider;

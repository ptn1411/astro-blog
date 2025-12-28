/**
 * CopilotProvider - Wrapper component for CopilotKit integration
 * 
 * Wraps Story Builder with CopilotKit context and handles:
 * - Server availability check before initializing
 * - GitHub token injection into headers
 * - Authentication error handling
 * - Graceful degradation when server is down
 */

import { CopilotKit } from '@copilotkit/react-core';
import React, { useCallback, useEffect, useState } from 'react';
import { getGitHubToken, AI_CONFIG } from '../../config';
import { AIAvailabilityProvider, useAIAvailability, createAIError } from './useAIAvailability';
import type { AIError } from './useAIAvailability';

export interface CopilotProviderProps {
  children: React.ReactNode;
  workerUrl?: string;
  onAuthError?: (error: Error) => void;
  onAIUnavailable?: (error: AIError) => void;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type ServerStatus = 'checking' | 'online' | 'offline';

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
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');

  const aiAvailability = useAIAvailability();
  const baseUrl = workerUrl || `${AI_CONFIG.workerUrl}${AI_CONFIG.endpoint}`;

  // Check if server is available
  useEffect(() => {
    const checkServer = async () => {
      try {
        const healthUrl = AI_CONFIG.workerUrl + '/health';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch(healthUrl, { 
          signal: controller.signal,
          mode: 'cors',
        });
        clearTimeout(timeout);
        
        if (res.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch {
        // Server not reachable - silently set offline
        setServerStatus('offline');
      }
    };

    checkServer();
  }, []);

  // Get headers with GitHub token
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

  // Handle CopilotKit errors silently
  const handleError = useCallback((error: unknown) => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('CopilotKit error (suppressed):', error);
    }
    
    let errorMessage = 'AI service error';
    let statusCode: number | undefined;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Don't report connection errors as they're expected when server is down
    if (!errorMessage.includes('fetch') && !errorMessage.includes('network')) {
      aiAvailability.reportFailure(createAIError(new Error(errorMessage), statusCode));
    }
  }, [aiAvailability]);

  // Check authentication
  useEffect(() => {
    const token = getGitHubToken();
    if (token) {
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } else {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: 'Vui lòng đăng nhập qua CMS để sử dụng AI',
      });
      onAuthError?.(new Error('Not authenticated'));
    }
  }, [onAuthError]);

  // Notify when AI becomes unavailable
  useEffect(() => {
    if (aiAvailability.status === 'unavailable' && aiAvailability.error) {
      onAIUnavailable?.(aiAvailability.error);
    }
  }, [aiAvailability.status, aiAvailability.error, onAIUnavailable]);

  // Always render children with auth context
  // Only wrap with CopilotKit if server is online and user is authenticated
  const shouldUseCopilotKit = 
    serverStatus === 'online' && 
    authState.isAuthenticated && 
    !authState.isLoading &&
    aiAvailability.isEnabled;

  if (!shouldUseCopilotKit) {
    return (
      <CopilotAuthContext.Provider value={authState}>
        <ServerStatusContext.Provider value={serverStatus}>
          {children}
        </ServerStatusContext.Provider>
      </CopilotAuthContext.Provider>
    );
  }

  return (
    <CopilotAuthContext.Provider value={authState}>
      <ServerStatusContext.Provider value={serverStatus}>
        <CopilotKit
          runtimeUrl={baseUrl}
          headers={getHeaders()}
          onError={handleError}
        >
          {children}
        </CopilotKit>
      </ServerStatusContext.Provider>
    </CopilotAuthContext.Provider>
  );
}

export function CopilotProvider(props: CopilotProviderProps) {
  return (
    <AIAvailabilityProvider>
      <CopilotProviderInner {...props} />
    </AIAvailabilityProvider>
  );
}

// Contexts
export const CopilotAuthContext = React.createContext<AuthState>({
  isAuthenticated: false,
  isLoading: true,
  error: null,
});

export const ServerStatusContext = React.createContext<ServerStatus>('checking');

// Hooks
export function useCopilotAuth(): AuthState {
  return React.useContext(CopilotAuthContext);
}

export function useServerStatus(): ServerStatus {
  return React.useContext(ServerStatusContext);
}

export default CopilotProvider;

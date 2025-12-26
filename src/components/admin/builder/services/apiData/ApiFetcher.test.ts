/**
 * ApiFetcher Tests
 * 
 * Tests for API fetching utilities including request construction,
 * URL validation, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  validateEndpoint, 
  buildRequestInit, 
  fetchData,
  ApiFetcher,
  type FetchResult
} from './ApiFetcher';
import type { ApiAction } from '../../core/types/apiDataWidget.types';

describe('ApiFetcher', () => {
  describe('validateEndpoint', () => {
    it('returns valid for HTTPS URL', () => {
      const result = validateEndpoint('https://api.example.com/data');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns valid for HTTP URL in non-production', () => {
      const result = validateEndpoint('http://api.example.com/data', false);
      expect(result.isValid).toBe(true);
    });

    it('returns invalid for HTTP URL in production', () => {
      const result = validateEndpoint('http://api.example.com/data', true);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('HTTPS is required');
    });

    it('returns invalid for empty endpoint', () => {
      const result = validateEndpoint('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('returns invalid for malformed URL', () => {
      const result = validateEndpoint('not-a-valid-url');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid URL');
    });

    it('returns invalid for non-HTTP protocol', () => {
      const result = validateEndpoint('ftp://files.example.com/data');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('HTTP or HTTPS');
    });
  });

  describe('buildRequestInit', () => {
    it('builds GET request with default headers', () => {
      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'GET',
      };

      const init = buildRequestInit(action);

      expect(init.method).toBe('GET');
      expect(init.headers).toEqual({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      });
      expect(init.body).toBeUndefined();
    });

    it('builds POST request with body', () => {
      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'POST',
        body: { query: 'test' },
      };

      const init = buildRequestInit(action);

      expect(init.method).toBe('POST');
      expect(init.body).toBe('{"query":"test"}');
    });

    it('includes custom headers', () => {
      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'GET',
        headers: { 'X-Custom-Header': 'custom-value' },
      };

      const init = buildRequestInit(action);

      expect((init.headers as Record<string, string>)['X-Custom-Header']).toBe('custom-value');
    });

    it('includes bearer token authentication', () => {
      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'GET',
        auth: { type: 'bearer', token: 'my-secret-token' },
      };

      const init = buildRequestInit(action);

      expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer my-secret-token');
    });

    it('includes API key authentication', () => {
      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'GET',
        auth: { 
          type: 'apiKey', 
          apiKeyHeader: 'X-API-Key', 
          apiKeyValue: 'my-api-key' 
        },
      };

      const init = buildRequestInit(action);

      expect((init.headers as Record<string, string>)['X-API-Key']).toBe('my-api-key');
    });

    it('handles no authentication', () => {
      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'GET',
        auth: { type: 'none' },
      };

      const init = buildRequestInit(action);

      expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
    });
  });

  describe('fetchData', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      vi.resetAllMocks();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('returns validation error for invalid endpoint', async () => {
      const action: ApiAction = {
        endpoint: '',
        method: 'GET',
      };

      const result = await fetchData(action);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('validation');
      }
    });

    it('returns success with data on successful fetch', async () => {
      const mockData = { products: [{ id: 1, name: 'Test' }] };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'GET',
      };

      const result = await fetchData(action);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockData);
      }
    });

    it('returns HTTP error for non-ok response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'GET',
      };

      const result = await fetchData(action);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('http');
        expect((result.error as { status: number }).status).toBe(404);
      }
    });

    it('returns parse error for invalid JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'GET',
      };

      const result = await fetchData(action);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('parse');
      }
    });

    it('returns network error on fetch failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'GET',
      };

      const result = await fetchData(action);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('network');
      }
    });

    it('returns timeout error on abort', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      global.fetch = vi.fn().mockRejectedValue(abortError);

      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'GET',
      };

      const result = await fetchData(action);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('timeout');
      }
    });

    it('passes abort signal to fetch', async () => {
      const mockData = { data: 'test' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const controller = new AbortController();
      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'GET',
      };

      await fetchData(action, controller.signal);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({ signal: controller.signal })
      );
    });
  });

  describe('ApiFetcher class', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      vi.resetAllMocks();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('creates instance with action', () => {
      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'GET',
      };

      const fetcher = new ApiFetcher(action);

      expect(fetcher.getAction()).toEqual(action);
    });

    it('validates endpoint', () => {
      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'GET',
      };

      const fetcher = new ApiFetcher(action);
      const result = fetcher.validateEndpoint();

      expect(result.isValid).toBe(true);
    });

    it('fetches data successfully', async () => {
      const mockData = { products: [] };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'GET',
      };

      const fetcher = new ApiFetcher(action);
      const result = await fetcher.fetch();

      expect(result.success).toBe(true);
    });

    it('aborts pending request on new fetch', async () => {
      let resolveFirst: (value: unknown) => void;
      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });

      global.fetch = vi.fn()
        .mockImplementationOnce(() => firstPromise)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'second' }),
        });

      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'GET',
      };

      const fetcher = new ApiFetcher(action);
      
      // Start first fetch (don't await)
      const firstFetch = fetcher.fetch();
      
      // Start second fetch (should abort first)
      const secondResult = await fetcher.fetch();

      expect(secondResult.success).toBe(true);
    });

    it('allows manual abort', () => {
      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'GET',
      };

      const fetcher = new ApiFetcher(action);
      
      // Should not throw
      fetcher.abort();
    });

    it('builds request init', () => {
      const action: ApiAction = {
        endpoint: 'https://api.example.com/data',
        method: 'POST',
        body: { test: true },
      };

      const fetcher = new ApiFetcher(action);
      const init = fetcher.buildRequestInit();

      expect(init.method).toBe('POST');
      expect(init.body).toBe('{"test":true}');
    });
  });
});

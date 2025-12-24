import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveMediaUrl, isLocalAssetPath, getEnvironmentMode } from './mediaUrl';

describe('mediaUrl', () => {
  describe('resolveMediaUrl', () => {
    describe('in development (localhost)', () => {
      beforeEach(() => {
        // Mock window.location for development
        vi.stubGlobal('window', {
          location: { hostname: 'localhost' }
        });
      });

      afterEach(() => {
        vi.unstubAllGlobals();
      });

      it('should return local path for ~/assets/ paths', () => {
        const result = resolveMediaUrl('~/assets/images/test.jpg');
        expect(result).toBe('/src/assets/images/test.jpg');
      });

      it('should return local path for /src/assets/ paths', () => {
        const result = resolveMediaUrl('/src/assets/images/test.jpg');
        expect(result).toBe('/src/assets/images/test.jpg');
      });

      it('should return full URL as-is', () => {
        const url = 'https://example.com/image.jpg';
        expect(resolveMediaUrl(url)).toBe(url);
      });

      it('should return data URL as-is', () => {
        const dataUrl = 'data:image/png;base64,abc123';
        expect(resolveMediaUrl(dataUrl)).toBe(dataUrl);
      });

      it('should return blob URL as-is', () => {
        const blobUrl = 'blob:http://localhost/abc123';
        expect(resolveMediaUrl(blobUrl)).toBe(blobUrl);
      });

      it('should return Astro processed paths as-is', () => {
        const astroPath = '/_astro/image.abc123.webp';
        expect(resolveMediaUrl(astroPath)).toBe(astroPath);
      });

      it('should handle empty/null values', () => {
        expect(resolveMediaUrl('')).toBe('');
        expect(resolveMediaUrl(null)).toBe('');
        expect(resolveMediaUrl(undefined)).toBe('');
      });
    });

    describe('in development (.test domain)', () => {
      beforeEach(() => {
        // Mock window.location for .test domain (local dev)
        vi.stubGlobal('window', {
          location: { hostname: 'client1.test' }
        });
      });

      afterEach(() => {
        vi.unstubAllGlobals();
      });

      it('should return local path for .test domains', () => {
        const result = resolveMediaUrl('~/assets/images/test.jpg');
        expect(result).toBe('/src/assets/images/test.jpg');
      });
    });

    describe('in development (local IP)', () => {
      beforeEach(() => {
        vi.stubGlobal('window', {
          location: { hostname: '192.168.1.100' }
        });
      });

      afterEach(() => {
        vi.unstubAllGlobals();
      });

      it('should return local path for local network IPs', () => {
        const result = resolveMediaUrl('~/assets/images/test.jpg');
        expect(result).toBe('/src/assets/images/test.jpg');
      });
    });

    describe('in production', () => {
      beforeEach(() => {
        // Mock window.location for production
        vi.stubGlobal('window', {
          location: { hostname: 'example.com' }
        });
      });

      afterEach(() => {
        vi.unstubAllGlobals();
      });

      it('should convert ~/assets/ paths to GitHub raw URL', () => {
        const result = resolveMediaUrl('~/assets/images/test.jpg');
        expect(result).toContain('raw.githubusercontent.com');
        expect(result).toContain('src/assets/images/test.jpg');
      });

      it('should convert /src/assets/ paths to GitHub raw URL', () => {
        const result = resolveMediaUrl('/src/assets/images/test.jpg');
        expect(result).toContain('raw.githubusercontent.com');
        expect(result).toContain('src/assets/images/test.jpg');
      });

      it('should return full URL as-is', () => {
        const url = 'https://example.com/image.jpg';
        expect(resolveMediaUrl(url)).toBe(url);
      });

      it('should return Astro processed paths as-is in production', () => {
        const astroPath = '/_astro/image.abc123.webp';
        expect(resolveMediaUrl(astroPath)).toBe(astroPath);
      });
    });
  });

  describe('isLocalAssetPath', () => {
    it('should return true for local asset paths', () => {
      expect(isLocalAssetPath('/src/assets/images/test.jpg')).toBe(true);
      expect(isLocalAssetPath('src/assets/images/test.jpg')).toBe(true);
      expect(isLocalAssetPath('~/assets/images/test.jpg')).toBe(true);
      expect(isLocalAssetPath('~/test.jpg')).toBe(true);
      expect(isLocalAssetPath('/public/image.jpg')).toBe(true);
    });

    it('should return false for external URLs', () => {
      expect(isLocalAssetPath('https://example.com/image.jpg')).toBe(false);
      expect(isLocalAssetPath('http://example.com/image.jpg')).toBe(false);
      expect(isLocalAssetPath('')).toBe(false);
    });
  });

  describe('getEnvironmentMode', () => {
    it('should return development for localhost', () => {
      vi.stubGlobal('window', {
        location: { hostname: 'localhost' }
      });
      expect(getEnvironmentMode()).toBe('development');
      vi.unstubAllGlobals();
    });

    it('should return development for .test domains', () => {
      vi.stubGlobal('window', {
        location: { hostname: 'client1.test' }
      });
      expect(getEnvironmentMode()).toBe('development');
      vi.unstubAllGlobals();
    });

    it('should return production for other hostnames', () => {
      vi.stubGlobal('window', {
        location: { hostname: 'example.com' }
      });
      expect(getEnvironmentMode()).toBe('production');
      vi.unstubAllGlobals();
    });
  });
});

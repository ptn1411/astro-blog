/**
 * Media URL Resolver
 * Converts local media paths to GitHub raw URLs in production
 */

import { GITHUB_CONFIG } from '~/components/admin/config';

// Check if running in production
function isProduction(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: check import.meta.env
    return import.meta.env.PROD === true;
  }
  
  const hostname = window.location.hostname;
  
  // Development environments
  const devHosts = [
    'localhost',
    '127.0.0.1',
  ];
  
  // Check for common local development patterns
  const isLocalDev = 
    devHosts.includes(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.localhost') ||
    hostname.startsWith('192.168.') || // Local network
    hostname.startsWith('10.') ||      // Local network
    hostname.startsWith('172.') ||     // Local network (172.16-31.x.x)
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname); // Any IP address
  
  return !isLocalDev;
}

// Build GitHub raw URL
function getGitHubRawUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${cleanPath}`;
}

/**
 * Normalize asset path to standard format
 * Handles various path formats:
 * - ~/assets/images/xxx.jpg -> src/assets/images/xxx.jpg
 * - /src/assets/images/xxx.jpg -> src/assets/images/xxx.jpg
 * - src/assets/images/xxx.jpg -> src/assets/images/xxx.jpg
 */
function normalizeAssetPath(path: string): string {
  if (!path) return path;
  
  // Handle ~/ prefix (Astro alias)
  if (path.startsWith('~/')) {
    return path.replace('~/', 'src/');
  }
  
  // Handle ~/assets/ prefix
  if (path.startsWith('~/assets/')) {
    return path.replace('~/assets/', 'src/assets/');
  }
  
  // Remove leading slash
  if (path.startsWith('/')) {
    return path.slice(1);
  }
  
  return path;
}

/**
 * Resolve media URL based on environment
 * - In development: returns local path (with proper format for dev server)
 * - In production: converts to GitHub raw URL
 * - Already processed URLs (Astro build, external URLs): returns as-is
 * 
 * @param localPath - Local path like "/src/assets/images/xxx.jpg" or "~/assets/images/xxx.jpg"
 * @returns Resolved URL
 */
export function resolveMediaUrl(localPath: string | undefined | null): string {
  if (!localPath) return '';
  
  // If already a full URL (http/https/data/blob), return as-is
  if (localPath.startsWith('http://') || 
      localPath.startsWith('https://') || 
      localPath.startsWith('data:') ||
      localPath.startsWith('blob:')) {
    return localPath;
  }

  // If already processed by Astro build (/_astro/ paths), return as-is
  if (localPath.startsWith('/_astro/') || localPath.startsWith('/_image')) {
    return localPath;
  }

  // Normalize the path first
  const normalizedPath = normalizeAssetPath(localPath);

  // In production, convert to GitHub raw URL
  if (isProduction()) {
    return getGitHubRawUrl(normalizedPath);
  }

  // In development, return path with leading slash for dev server
  return normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
}

/**
 * Resolve all media URLs in a story object
 * Recursively processes slides, elements, backgrounds, etc.
 */
export function resolveStoryMediaUrls<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => resolveStoryMediaUrls(item)) as T;
  }

  const result = { ...obj } as Record<string, unknown>;

  for (const key of Object.keys(result)) {
    const value = result[key];

    // Handle specific media fields
    if (key === 'content' && typeof value === 'string') {
      // Check if this is a media element (image, video, audio, gif, sticker)
      const parentType = (obj as Record<string, unknown>).type;
      if (['image', 'video', 'audio', 'gif', 'sticker'].includes(parentType as string)) {
        result[key] = resolveMediaUrl(value);
      }
    } else if (key === 'value' && typeof value === 'string') {
      // Background value (image/video)
      const parentType = (obj as Record<string, unknown>).type;
      if (['image', 'video'].includes(parentType as string)) {
        result[key] = resolveMediaUrl(value);
      }
    } else if (key === 'src' && typeof value === 'string') {
      // Audio src, carousel images, etc.
      result[key] = resolveMediaUrl(value);
    } else if (key === 'thumbnail' && typeof value === 'string') {
      result[key] = resolveMediaUrl(value);
    } else if (key === 'images' && Array.isArray(value)) {
      // Carousel/slider images array
      result[key] = value.map(img => {
        if (typeof img === 'string') {
          return resolveMediaUrl(img);
        } else if (img && typeof img === 'object' && 'src' in img) {
          return { ...img, src: resolveMediaUrl((img as { src: string }).src) };
        }
        return img;
      });
    } else if (typeof value === 'object' && value !== null) {
      // Recursively process nested objects
      result[key] = resolveStoryMediaUrls(value);
    }
  }

  return result as T;
}

/**
 * Check if a URL is a local asset path
 */
export function isLocalAssetPath(url: string): boolean {
  if (!url) return false;
  return url.startsWith('/src/assets/') || 
         url.startsWith('src/assets/') ||
         url.startsWith('~/assets/') ||
         url.startsWith('~/') ||
         url.startsWith('/public/');
}

/**
 * Get the environment mode
 */
export function getEnvironmentMode(): 'development' | 'production' {
  return isProduction() ? 'production' : 'development';
}

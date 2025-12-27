/**
 * GitHub Repository Configuration
 * Centralized config for all admin/builder GitHub operations
 */

export const GITHUB_CONFIG = {
  // Repository info
  owner: 'ptn1411',
  repo: 'astro-blog',
  branch: 'main',

  // Paths
  imagePath: 'src/assets/images',
  audioPath: 'src/assets/audio',
  videoPath: 'src/assets/videos',
  contentPaths: {
    pages: 'src/content/page',
    stories: 'src/content/stories',
    posts: 'src/content/post',
  },
} as const;

// Backwards compatible exports
export const REPO_OWNER = GITHUB_CONFIG.owner;
export const REPO_NAME = GITHUB_CONFIG.repo;
export const GITHUB_OWNER = GITHUB_CONFIG.owner;
export const GITHUB_REPO = GITHUB_CONFIG.repo;
export const GITHUB_BRANCH = GITHUB_CONFIG.branch;
export const IMAGE_PATH = GITHUB_CONFIG.imagePath;

// Helper to build GitHub API URLs
export function getGitHubApiUrl(path: string): string {
  return `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}?ref=${GITHUB_CONFIG.branch}`;
}

export function getGitHubContentUrl(path: string): string {
  return `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
}

/**
 * AI Service Configuration
 * Configuration for CopilotKit integration with Cloudflare Worker backend
 */
export const AI_CONFIG = {
  // Worker URL - use localhost for development
  workerUrl: typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://copilotkit.bug.edu.vn',
  
  // CopilotKit endpoint path
  endpoint: '/api/copilotkit',
  
  // Rate limiting settings (matching Worker configuration)
  rateLimit: {
    maxRequestsPerHour: 100,
    windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
  },
  
  // Retry settings for network errors
  retry: {
    maxRetries: 3,
    baseDelayMs: 1000, // Initial delay for exponential backoff
    maxDelayMs: 10000, // Maximum delay between retries
  },
  
  // UI settings
  ui: {
    defaultPosition: 'bottom-right' as const,
    defaultOpen: false,
  },
  
  // Allowed origins for CORS (should match Worker config)
  allowedOrigins: [
    'http://localhost:4321',
    'http://localhost:3000',
    'https://bug.edu.vn'
  ],
} as const;

// Helper to get full CopilotKit API URL
export function getCopilotKitUrl(): string {
  return `${AI_CONFIG.workerUrl}${AI_CONFIG.endpoint}`;
}

// Helper to get GitHub token from localStorage (set by Sveltia CMS)
export function getGitHubToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Sveltia CMS stores the token in localStorage
  const token = localStorage.getItem('sveltia-cms.user');
  if (!token) return null;
  
  try {
    const userData = JSON.parse(token);
    return userData?.token || userData?.backendGitGateway?.token || null;
  } catch {
    return null;
  }
}

// Helper to check if user is authenticated for AI features
export function isAIAuthenticated(): boolean {
  return getGitHubToken() !== null;
}

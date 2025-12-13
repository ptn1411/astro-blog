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

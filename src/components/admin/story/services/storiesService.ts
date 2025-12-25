import { GITHUB_BRANCH, GITHUB_CONFIG, getGitHubApiUrl, getGitHubContentUrl } from '../../config';
import type { Story } from '../types';
import { getGitHubToken, isLocalEnvironment } from '../utils/github';
import { parseMdxToStory, generateThumbnail } from '../utils/storyParser';

export interface StoredStory {
  id: string;
  story: Story;
  lastModified: string;
  thumbnail?: string;
  source?: 'local' | 'file' | 'github';
  path?: string;
  sha?: string;
}

// Load stories from all sources
export async function loadAllStories(): Promise<StoredStory[]> {
  const loadedStories: StoredStory[] = [];

  if (isLocalEnvironment()) {
    // Dev mode: fetch from local API
    try {
      const response = await fetch('/admin/get-stories');
      if (response.ok) {
        const data = await response.json();
        const fileStories = data.stories || [];

        for (const fileStory of fileStories) {
          try {
            const story = fileStory.story as Story;
            loadedStories.push({
              id: fileStory.id || `story-${story.id}`,
              story,
              lastModified:
                story.updatedAt || story.createdAt || fileStory.lastModified || new Date().toISOString(),
              thumbnail: generateThumbnail(story),
              source: 'file',
              path: fileStory.path,
            });
          } catch (e) {
            console.error('Failed to parse story from file:', e);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch from local API:', error);
    }
  } else {
    // Production mode: fetch from GitHub
    const token = getGitHubToken();
    if (token) {
      try {
        const response = await fetch(getGitHubApiUrl(GITHUB_CONFIG.contentPaths.stories), {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (response.ok) {
          const files = await response.json();

          for (const file of files) {
            if (file.name.endsWith('.mdx') || file.name.endsWith('.md')) {
              try {
                const contentResponse = await fetch(file.download_url);
                const mdxContent = await contentResponse.text();
                const story = parseMdxToStory(mdxContent);

                if (story) {
                  loadedStories.push({
                    id: `story-${story.id}`,
                    story,
                    lastModified: story.updatedAt || story.createdAt || new Date().toISOString(),
                    thumbnail: generateThumbnail(story),
                    source: 'github',
                    path: file.path,
                    sha: file.sha,
                  });
                }
              } catch (e) {
                console.error(`Failed to fetch story ${file.name}:`, e);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch from GitHub:', error);
      }
    }
  }

  // Also load from localStorage (drafts)
  const keys = Object.keys(localStorage).filter((key) => key.startsWith('story-'));
  keys.forEach((key) => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const story = JSON.parse(data) as Story;
        // Check if already loaded from file/GitHub
        const existingIndex = loadedStories.findIndex((s) => s.story.id === story.id);
        if (existingIndex === -1) {
          loadedStories.push({
            id: key,
            story,
            lastModified: story.updatedAt || story.createdAt || new Date().toISOString(),
            thumbnail: generateThumbnail(story),
            source: 'local',
          });
        }
      }
    } catch (e) {
      console.error(`Failed to parse story ${key}:`, e);
    }
  });

  // Sort by last modified
  loadedStories.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

  return loadedStories;
}

// Delete story from GitHub
export async function deleteStoryFromGitHub(path: string, sha: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(getGitHubContentUrl(path), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Delete story: ${path}`,
        sha,
        branch: GITHUB_BRANCH,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to delete story:', error);
    return false;
  }
}

// Delete story (handles all sources)
export async function deleteStory(story: StoredStory): Promise<void> {
  localStorage.removeItem(story.id);

  if (isLocalEnvironment() && story.source === 'file' && story.path) {
    const response = await fetch(`/admin/pages?path=${encodeURIComponent(story.path)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete locally');
    }
  } else {
    const token = getGitHubToken();
    if (token && story.source === 'github' && story.path && story.sha) {
      const success = await deleteStoryFromGitHub(story.path, story.sha, token);
      if (!success) {
        throw new Error('Failed to delete from GitHub');
      }
    }
  }
}

// Duplicate story
export function duplicateStory(story: StoredStory): Story {
  const newStory: Story = {
    ...story.story,
    id: `story-${Date.now()}`,
    title: `${story.story.title} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const newId = `story-${newStory.id}`;
  localStorage.setItem(newId, JSON.stringify(newStory));
  
  return newStory;
}

// Export story as JSON
export function exportStoryAsJSON(story: Story): void {
  const dataStr = JSON.stringify(story, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${story.title.replace(/\s+/g, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

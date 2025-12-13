import type { APIRoute } from 'astro';
import { devOnlyResponse, errorResponse, getFs, getPath, successResponse } from './_utils';

export const prerender = false;

interface StoryFile {
  id: string;
  story: Record<string, unknown>;
  lastModified: string;
  path: string;
}

// Parse YAML-like frontmatter (simple parser for our use case)
function parseFrontmatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatterStr = match[1];
  const result: Record<string, unknown> = {};

  // Parse each line - handle JSON values
  const lines = frontmatterStr.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (!key) continue;

    // Try to parse as JSON first (for arrays, objects)
    try {
      result[key] = JSON.parse(value);
    } catch {
      // If not JSON, treat as string (remove quotes if present)
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        result[key] = value.slice(1, -1);
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

export const GET: APIRoute = async () => {
  const devCheck = devOnlyResponse();
  if (devCheck) return devCheck;

  try {
    const fs = await getFs();
    const path = await getPath();

    const storiesDir = path.resolve(process.cwd(), 'src/content/stories');

    // Check if directory exists
    try {
      await fs.access(storiesDir);
    } catch {
      return successResponse({ stories: [] });
    }

    const files = await fs.readdir(storiesDir);
    const stories: StoryFile[] = [];

    for (const file of files) {
      if (!file.endsWith('.mdx') && !file.endsWith('.md') && !file.endsWith('.json')) {
        continue;
      }

      const filePath = path.join(storiesDir, file);

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const stats = await fs.stat(filePath);

        let storyData: Record<string, unknown> | null = null;

        if (file.endsWith('.json')) {
          storyData = JSON.parse(content);
        } else {
          // MDX/MD file - parse frontmatter
          storyData = parseFrontmatter(content);
        }

        if (storyData) {
          const storyId = (storyData.id as string) || file.replace(/\.(mdx?|json)$/, '');
          const lastModified = stats.mtime.toISOString();

          stories.push({
            id: storyId,
            story: {
              id: storyId,
              title: storyData.title || storyId,
              slides: storyData.slides || [],
              audio: storyData.audio,
              thumbnail: storyData.thumbnail,
              description: storyData.description,
              // Use file modification time as fallback
              settings: storyData.settings || {},
              createdAt: storyData.createdAt || lastModified,
              updatedAt: storyData.updatedAt || lastModified,
            },
            lastModified,
            path: `src/content/stories/${file}`,
          });
        }
      } catch (e) {
        console.error(`Failed to parse story file ${file}:`, e);
      }
    }

    // Sort by last modified (newest first)
    stories.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return successResponse({ stories });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('Failed to list stories:', e);
    return errorResponse(message);
  }
};

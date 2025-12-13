import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';

// Required for DELETE/POST methods in hybrid mode
export const prerender = false;

interface PageInfo {
  path: string;
  title: string;
  description: string;
  lastModified?: string;
  hasBuilderData: boolean;
}

function parsePageContent(content: string): {
  metadata: { title?: string; description?: string };
  hasBuilderData: boolean;
} {
  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const metadata: { title?: string; description?: string } = {};

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const titleMatch = frontmatter.match(/title:\s*['"]?([^'"\n]+)['"]?/);
    const descMatch = frontmatter.match(/description:\s*['"]?([^'"\n]+)['"]?/);

    if (titleMatch) metadata.title = titleMatch[1].trim();
    if (descMatch) metadata.description = descMatch[1].trim();
  }

  // Check for builder data
  const hasBuilderData = /\{\/\*\s*BUILDER_DATA_START/.test(content);

  return { metadata, hasBuilderData };
}

async function scanDirectory(dirPath: string, basePath: string): Promise<PageInfo[]> {
  const pages: PageInfo[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.join(basePath, entry.name).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subPages = await scanDirectory(fullPath, relativePath);
        pages.push(...subPages);
      } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const stats = await fs.stat(fullPath);
          const { metadata, hasBuilderData } = parsePageContent(content);

          pages.push({
            path: relativePath,
            title: metadata.title || entry.name.replace(/\.mdx?$/, ''),
            description: metadata.description || '',
            lastModified: stats.mtime.toISOString(),
            hasBuilderData,
          });
        } catch (err) {
          console.error(`Failed to read file ${fullPath}:`, err);
        }
      }
    }
  } catch (err) {
    console.error(`Failed to scan directory ${dirPath}:`, err);
  }

  return pages;
}

export const GET: APIRoute = async ({ url }) => {
  const pagePath = url.searchParams.get('path');

  // If path is provided, return the content of that specific page
  if (pagePath) {
    try {
      const fullPath = path.join(process.cwd(), pagePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return new Response(JSON.stringify({ content }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Page not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Otherwise, return list of all pages
  const contentDirs = [{ dir: 'src/content/page', base: 'src/content/page' }];

  const allPages: PageInfo[] = [];

  for (const { dir, base } of contentDirs) {
    const dirPath = path.join(process.cwd(), dir);
    try {
      await fs.access(dirPath);
      const pages = await scanDirectory(dirPath, base);
      allPages.push(...pages);
    } catch {
      // Directory doesn't exist, skip
    }
  }

  // Sort by last modified date (newest first)
  allPages.sort((a, b) => {
    if (!a.lastModified || !b.lastModified) return 0;
    return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
  });

  return new Response(JSON.stringify({ pages: allPages }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request, url }) => {
  // Use url from context instead of parsing request.url
  const pagePath = url.searchParams.get('path');

  console.log('DELETE request - URL:', url.toString());
  console.log('DELETE request - path param:', pagePath);

  if (!pagePath) {
    return new Response(JSON.stringify({ error: 'Path is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const fullPath = path.join(process.cwd(), pagePath);

    console.log('Attempting to delete:', fullPath);

    // Check if file exists first
    try {
      await fs.access(fullPath);
    } catch {
      return new Response(JSON.stringify({ error: `File not found: ${pagePath}` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await fs.unlink(fullPath);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Delete error:', err);
    return new Response(JSON.stringify({ error: `Failed to delete page: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

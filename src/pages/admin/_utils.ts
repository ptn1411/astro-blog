/**
 * Shared utilities for Admin API routes
 * This file contains common functions used across admin API endpoints
 */

// ============== Environment Checks ==============

/**
 * Check if running in development mode
 */
export function isDev(): boolean {
  return import.meta.env.DEV;
}

/**
 * Return 403 response if not in dev mode
 */
export function devOnlyResponse(): Response | null {
  if (!isDev()) {
    return new Response(JSON.stringify({ success: false, message: 'Not allowed in production' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}

// ============== Response Helpers ==============

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ success: false, message }, status);
}

export function successResponse(data: Record<string, unknown> = {}): Response {
  return jsonResponse({ success: true, ...data });
}

// ============== File Utilities ==============

/**
 * Sanitize filename to prevent path traversal and invalid characters
 */
export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Generate unique filename with timestamp
 */
export function generateUniqueFileName(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'file';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${ext}`;
}

/**
 * Get media type from MIME type
 */
export type MediaType = 'image' | 'video' | 'audio';

export function getMediaTypeFromMime(mimeType: string): MediaType {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'image';
}

/**
 * Get asset subdirectory based on media type
 */
export function getAssetSubDir(type: MediaType): string {
  switch (type) {
    case 'video':
      return 'videos';
    case 'audio':
      return 'audio';
    default:
      return 'images';
  }
}

// ============== Dynamic Imports (for non-Node environments) ==============

export async function getFs() {
  return (await import('node:fs/promises')).default;
}

export async function getPath() {
  return (await import('node:path')).default;
}

// ============== Frontmatter Parsing ==============

export function parseFrontmatter(content: string): {
  metadata: { title?: string; description?: string; [key: string]: unknown };
  hasBuilderData: boolean;
  body: string;
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const metadata: { title?: string; description?: string } = {};

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const titleMatch = frontmatter.match(/title:\s*['"]?([^'"\n]+)['"]?/);
    const descMatch = frontmatter.match(/description:\s*['"]?([^'"\n]+)['"]?/);

    if (titleMatch) metadata.title = titleMatch[1].trim();
    if (descMatch) metadata.description = descMatch[1].trim();
  }

  const hasBuilderData = /\{\/\*\s*BUILDER_DATA_START/.test(content);
  const body = frontmatterMatch ? content.slice(frontmatterMatch[0].length).trim() : content;

  return { metadata, hasBuilderData, body };
}

// ============== File Operations ==============

/**
 * Ensure directory exists, create if not
 */
export async function ensureDir(dirPath: string): Promise<void> {
  const fs = await getFs();
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  const fs = await getFs();
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get unique file path (add timestamp if exists)
 */
export async function getUniqueFilePath(targetPath: string): Promise<{ path: string; fileName: string }> {
  const path = await getPath();
  const exists = await fileExists(targetPath);

  if (!exists) {
    return { path: targetPath, fileName: path.basename(targetPath) };
  }

  const ext = path.extname(targetPath);
  const baseName = path.basename(targetPath, ext);
  const dirName = path.dirname(targetPath);
  const timestamp = Date.now();
  const newFileName = `${baseName}-${timestamp}${ext}`;

  return {
    path: path.join(dirName, newFileName),
    fileName: newFileName,
  };
}

// ============== Directory Scanning ==============

export interface FileInfo {
  name: string;
  path: string;
  relativePath: string;
  isDirectory: boolean;
}

export async function scanDirectory(dirPath: string, basePath: string, extensions?: string[]): Promise<FileInfo[]> {
  const fs = await getFs();
  const path = await getPath();
  const results: FileInfo[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.join(basePath, entry.name).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        const subFiles = await scanDirectory(fullPath, relativePath, extensions);
        results.push(...subFiles);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (!extensions || extensions.includes(ext)) {
          results.push({
            name: entry.name,
            path: fullPath,
            relativePath,
            isDirectory: false,
          });
        }
      }
    }
  } catch (err) {
    console.error(`Failed to scan directory ${dirPath}:`, err);
  }

  return results;
}

import type { APIRoute } from 'astro';
import { devOnlyResponse, ensureDir, errorResponse, getFs, getPath, successResponse } from './_utils';

export const prerender = false;

// Helper to save base64/blob image to file
async function saveImageToAssets(
  imageData: string,
  storyId: string,
  fs: typeof import('node:fs/promises'),
  path: typeof import('node:path')
): Promise<string | null> {
  if (!imageData) return null;

  // Check if it's a data URL or blob URL
  if (imageData.startsWith('data:image/')) {
    // Extract base64 data and extension
    const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return null;

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate filename
    const fileName = `story-${storyId}-thumbnail.${ext}`;
    const imagePath = path.resolve(process.cwd(), 'src/assets/images', fileName);

    // Ensure directory exists
    await ensureDir(path.dirname(imagePath));

    // Write image file
    await fs.writeFile(imagePath, buffer);

    // Return relative path for MDX frontmatter
    return `/src/assets/images/${fileName}`;
  }

  // If it's already a path reference, return as-is
  if (imageData.startsWith('~/') || imageData.startsWith('../')) {
    return imageData;
  }

  // If it's a URL (http/https), return as-is
  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    return imageData;
  }

  return null;
}

export const POST: APIRoute = async ({ request }) => {
  const devCheck = devOnlyResponse();
  if (devCheck) return devCheck;

  try {
    const fs = await getFs();
    const path = await getPath();

    const data = await request.json();
    const { id, title, slides, audio, thumbnail, description } = data;

    if (!id || !title) {
      return errorResponse('Missing id or title', 400);
    }

    // Sanitize ID for filename
    const sanitizedId = id.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    const fileName = `${sanitizedId}.mdx`;
    const targetPath = path.resolve(process.cwd(), 'src/content/stories', fileName);

    // Save thumbnail image if provided
    let thumbnailPath: string | null = null;
    if (thumbnail) {
      thumbnailPath = await saveImageToAssets(thumbnail, sanitizedId, fs, path);
    }

    // Create Frontmatter
    const frontmatter: Record<string, any> = {
      id,
      title,
      slides,
    };

    if (description) {
      frontmatter.description = description;
    }

    if (thumbnailPath) {
      frontmatter.thumbnail = thumbnailPath;
    }

    if (audio) {
      frontmatter.audio = audio;
    }

    // Serialize to YAML frontmatter
    const yamlString = Object.entries(frontmatter)
      .map(([key, value]) => {
        if (value === undefined) return '';
        return `${key}: ${JSON.stringify(value)}`;
      })
      .filter(Boolean)
      .join('\n');

    const fileContent = `---
${yamlString}
---
`;

    // Ensure directory exists
    await ensureDir(path.dirname(targetPath));

    // Write file
    await fs.writeFile(targetPath, fileContent, 'utf-8');

    return successResponse({
      message: 'Story saved successfully',
      path: `/src/content/stories/${fileName}`,
      thumbnailPath,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('Save story failed', e);
    return errorResponse(message);
  }
};

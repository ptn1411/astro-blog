import type { APIRoute } from 'astro';
import { devOnlyResponse, errorResponse, getFs, getPath, successResponse } from './_utils';

export const prerender = false;

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];

export const GET: APIRoute = async () => {
  const devCheck = devOnlyResponse();
  if (devCheck) return devCheck;

  try {
    const fs = await getFs();
    const path = await getPath();

    const targetDir = path.resolve(process.cwd(), 'src/assets/images');

    // Check if directory exists
    try {
      await fs.access(targetDir);
    } catch {
      return successResponse({ images: [] });
    }

    const files = await fs.readdir(targetDir);

    const images = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext);
      })
      .map((file) => ({
        name: file,
        path: `/src/assets/images/${file}`,
        url: `/src/assets/images/${file}`,
      }));

    return successResponse({ images });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('Failed to list images', e);
    return errorResponse(message);
  }
};

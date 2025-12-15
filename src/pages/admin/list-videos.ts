import type { APIRoute } from 'astro';
import { devOnlyResponse, errorResponse, getFs, getPath, successResponse } from './_utils';

export const prerender = false;

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.ogv'];

export const GET: APIRoute = async () => {
  const devCheck = devOnlyResponse();
  if (devCheck) return devCheck;

  try {
    const fs = await getFs();
    const path = await getPath();

    const targetDir = path.resolve(process.cwd(), 'src/assets/videos');

    // Check if directory exists
    try {
      await fs.access(targetDir);
    } catch {
      return successResponse({ videos: [] });
    }

    const files = await fs.readdir(targetDir);

    const videos = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return VIDEO_EXTENSIONS.includes(ext);
      })
      .map((file) => ({
        name: file,
        path: `/src/assets/videos/${file}`,
        url: `/src/assets/videos/${file}`,
      }));

    return successResponse({ videos });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('Failed to list video files', e);
    return errorResponse(message);
  }
};

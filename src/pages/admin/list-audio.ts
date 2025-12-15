import type { APIRoute } from 'astro';
import { devOnlyResponse, errorResponse, getFs, getPath, successResponse } from './_utils';

export const prerender = false;

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm'];

export const GET: APIRoute = async () => {
  const devCheck = devOnlyResponse();
  if (devCheck) return devCheck;

  try {
    const fs = await getFs();
    const path = await getPath();

    const targetDir = path.resolve(process.cwd(), 'src/assets/audio');

    // Check if directory exists
    try {
      await fs.access(targetDir);
    } catch {
      return successResponse({ audio: [] });
    }

    const files = await fs.readdir(targetDir);

    const audio = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return AUDIO_EXTENSIONS.includes(ext);
      })
      .map((file) => ({
        name: file,
        path: `/src/assets/audio/${file}`,
        url: `/src/assets/audio/${file}`,
      }));

    return successResponse({ audio });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('Failed to list audio files', e);
    return errorResponse(message);
  }
};

import type { APIRoute } from 'astro';
import { devOnlyResponse, errorResponse, getFs, getPath, successResponse } from './_utils';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const devCheck = devOnlyResponse();
  if (devCheck) return devCheck;

  try {
    const fs = await getFs();
    const path = await getPath();

    const body = await request.json();
    const { path: filePath, content } = body;

    if (!filePath || !content) {
      return errorResponse('Missing path or content', 400);
    }

    // Security check: Ensure we are writing to the project directory
    const validPrefix = 'src/content/';
    if (!filePath.startsWith(validPrefix)) {
      return errorResponse(`Invalid path. Must start with ${validPrefix}`, 400);
    }

    const absolutePath = path.resolve(process.cwd(), filePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });

    await fs.writeFile(absolutePath, content, 'utf-8');

    return successResponse({ message: 'File saved locally' });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('Local save failed', e);
    return errorResponse(message);
  }
};

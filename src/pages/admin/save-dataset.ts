import type { APIRoute } from 'astro';
import { devOnlyResponse, ensureDir, errorResponse, getFs, getPath, successResponse } from './_utils';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const devCheck = devOnlyResponse();
  if (devCheck) return devCheck;

  try {
    const fs = await getFs();
    const path = await getPath();

    const data = await request.json();
    const { prompt, slide } = data;

    if (!prompt || !slide) {
      return errorResponse('Missing prompt or slide data', 400);
    }

    // Set dataset file path
    const targetDir = path.resolve(process.cwd(), 'src/content/dataset');
    const targetFile = path.resolve(targetDir, 'ai_stories.jsonl');

    // Create JSON Lines record
    const record = JSON.stringify({
      timestamp: new Date().toISOString(),
      prompt,
      slide
    }) + '\n';

    // Ensure directory exists
    await ensureDir(targetDir);

    // Append to file (creates if not exists)
    await fs.appendFile(targetFile, record, 'utf-8');

    return successResponse({
      message: 'Dataset saved successfully',
      path: `/src/content/dataset/ai_stories.jsonl`,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('Save dataset failed', e);
    return errorResponse(message);
  }
};

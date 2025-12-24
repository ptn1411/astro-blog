import type { APIRoute } from 'astro';
import { devOnlyResponse, errorResponse, getFs, getPath, successResponse } from './_utils';

export const prerender = false;

const WIDGETS_PATH = 'src/content/data/custom-widgets.json';

// GET - Load widgets
export const GET: APIRoute = async () => {
  try {
    const fs = await getFs();
    const path = await getPath();
    
    const absolutePath = path.resolve(process.cwd(), WIDGETS_PATH);
    
    try {
      const content = await fs.readFile(absolutePath, 'utf-8');
      const data = JSON.parse(content);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      // File doesn't exist, return empty
      return new Response(JSON.stringify({ widgets: [], lastUpdated: null, version: '1.0.0' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('Failed to load widgets:', e);
    return errorResponse(message);
  }
};

// POST - Save widgets (dev only)
export const POST: APIRoute = async ({ request }) => {
  const devCheck = devOnlyResponse();
  if (devCheck) return devCheck;

  try {
    const fs = await getFs();
    const path = await getPath();

    const body = await request.json();
    const absolutePath = path.resolve(process.cwd(), WIDGETS_PATH);

    // Ensure directory exists
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });

    await fs.writeFile(absolutePath, JSON.stringify(body, null, 2), 'utf-8');

    return successResponse({ message: 'Widgets saved successfully' });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('Failed to save widgets:', e);
    return errorResponse(message);
  }
};

import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!import.meta.env.DEV) {
    return new Response('Not allowed in production', { status: 403 });
  }

  try {
    // Dynamic imports to avoid build errors in non-Node environments (e.g. Cloudflare)
    const fs = (await import('node:fs/promises')).default;
    const path = (await import('node:path')).default;

    const body = await request.json();
    const { path: filePath, content } = body;

    if (!filePath || !content) {
      return new Response('Missing path or content', { status: 400 });
    }

    // Security check: Ensure we are writing to the project directory
    const validPrefix = 'src/content/';
    if (!filePath.startsWith(validPrefix)) {
      return new Response(`Invalid path. Must start with ${validPrefix}`, { status: 400 });
    }

    const absolutePath = path.resolve(process.cwd(), filePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });

    await fs.writeFile(absolutePath, content, 'utf-8');

    return new Response(JSON.stringify({ success: true, message: 'File saved locally' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('Local save failed', e);
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

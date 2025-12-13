import type { APIRoute } from 'astro';
import {
  devOnlyResponse,
  ensureDir,
  errorResponse,
  getAssetSubDir,
  getFs,
  getMediaTypeFromMime,
  getPath,
  getUniqueFilePath,
  sanitizeFileName,
  successResponse,
} from './_utils';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const devCheck = devOnlyResponse();
  if (devCheck) return devCheck;

  try {
    const fs = await getFs();
    const path = await getPath();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;

    if (!file || !fileName) {
      return errorResponse('Missing file or fileName', 400);
    }

    const sanitizedFileName = sanitizeFileName(fileName);
    const mediaType = getMediaTypeFromMime(file.type);
    const subDir = getAssetSubDir(mediaType);
    const targetDir = path.resolve(process.cwd(), `src/assets/${subDir}`);

    await ensureDir(targetDir);

    const targetPath = path.join(targetDir, sanitizedFileName);
    const { path: finalPath, fileName: finalFileName } = await getUniqueFilePath(targetPath);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(finalPath, buffer);

    const mediaPath = `/src/assets/${subDir}/${finalFileName}`;

    return successResponse({
      message: 'Media uploaded locally',
      path: mediaPath,
      fileName: finalFileName,
      type: mediaType,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('Local media upload failed', e);
    return errorResponse(message);
  }
};

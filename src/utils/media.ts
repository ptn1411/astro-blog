import { Octokit } from '@octokit/rest';
import { GITHUB_CONFIG } from '~/components/admin/config';

// Type for media
export type MediaType = 'image' | 'video' | 'audio';

// Pending media for GitHub upload
export interface PendingMedia {
  id: string;
  file: File;
  fileName: string;
  type: MediaType;
  localPath: string;
}

const pendingMediaStore: Map<string, PendingMedia> = new Map();

// Helper functions
function getGitHubToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const storedUser = localStorage.getItem('sveltia-cms.user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      return user.token || null;
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
}

function isLocalEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  );
}

function generateFileName(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'file';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${ext}`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function getMediaPath(type: MediaType): string {
  switch (type) {
    case 'image':
      return GITHUB_CONFIG.imagePath;
    case 'video':
      return GITHUB_CONFIG.videoPath;
    case 'audio':
      return GITHUB_CONFIG.audioPath;
    default:
      return GITHUB_CONFIG.imagePath;
  }
}

function getMediaType(file: File): MediaType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'image';
}

// Upload media locally (dev mode)
async function uploadMediaToLocal(file: File, type: MediaType): Promise<string> {
  const fileName = generateFileName(file.name);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', fileName);
  formData.append('type', type);

  const res = await fetch('/admin/upload-media', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(data.message || 'Failed to upload media locally');
  }

  const mediaPath = getMediaPath(type);
  return `/${mediaPath}/${fileName}`;
}

// Upload media to GitHub (production mode)
export async function uploadMediaToGitHub(file: File, fileName: string, type: MediaType): Promise<void> {
  const token = getGitHubToken();
  if (!token) {
    throw new Error('Chưa đăng nhập GitHub. Vui lòng đăng nhập qua CMS trước.');
  }

  const octokit = new Octokit({ auth: token });
  const mediaPath = getMediaPath(type);
  const path = `${mediaPath}/${fileName}`;

  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

  // Check if file exists
  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_CONFIG.owner,
      repo: GITHUB_CONFIG.repo,
      path,
    });
    if (!Array.isArray(data)) {
      sha = data.sha;
    }
  } catch {
    // File doesn't exist, which is expected
  }

  // Upload to GitHub
  await octokit.repos.createOrUpdateFileContents({
    owner: GITHUB_CONFIG.owner,
    repo: GITHUB_CONFIG.repo,
    path,
    message: `Upload ${type}: ${fileName}`,
    content: base64,
    sha,
  });
}

// Main upload function - auto detects environment
export async function uploadMediaLocally(file: File): Promise<string> {
  const type = getMediaType(file);
  const isLocal = isLocalEnvironment();

  if (isLocal) {
    // Dev mode: upload to local filesystem
    return await uploadMediaToLocal(file, type);
  } else {
    // Production mode: add to pending queue, will upload when saving
    const fileName = generateFileName(file.name);
    const mediaPath = getMediaPath(type);
    const localPath = `/${mediaPath}/${fileName}`;

    const pendingMedia: PendingMedia = {
      id: generateId(),
      file,
      fileName,
      type,
      localPath,
    };

    pendingMediaStore.set(pendingMedia.id, pendingMedia);
    return localPath; // Return local path immediately, will be valid after upload
  }
}

// Get all pending media
export function getPendingMedia(): PendingMedia[] {
  return Array.from(pendingMediaStore.values());
}

// Clear all pending media
export function clearPendingMedia(): void {
  pendingMediaStore.clear();
}

// Remove specific pending media
export function removePendingMedia(id: string): void {
  pendingMediaStore.delete(id);
}

// Upload all pending media to GitHub
export async function uploadAllPendingMedia(
  onProgress?: (current: number, total: number, fileName: string, type: MediaType) => void
): Promise<void> {
  const pending = getPendingMedia();
  if (pending.length === 0) return;

  for (let i = 0; i < pending.length; i++) {
    const media = pending[i];
    onProgress?.(i + 1, pending.length, media.fileName, media.type);
    await uploadMediaToGitHub(media.file, media.fileName, media.type);
  }

  clearPendingMedia();
}

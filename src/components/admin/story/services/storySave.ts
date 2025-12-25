import { getPendingMedia, uploadAllPendingMedia } from '~/utils/media';
import { getGitHubToken, saveToGitHub } from '../../builder/services/save';
import { GITHUB_CONFIG } from '~/components/admin/config';
import type { Story } from '../types';
import { generateStoryMdx } from './storyExport';

export function isLocalEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local'))
  );
}

export async function saveStory(story: Story): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    if (isLocalEnvironment()) {
      // LOCAL: Save via API endpoint
      const res = await fetch('/admin/save-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(story),
      });

      if (!res.ok) throw new Error('Failed to save');

      const data = await res.json();
      return { success: true, path: data.path };
    } else {
      // PRODUCTION: Save to GitHub
      const token = getGitHubToken();
      if (!token) {
        return { success: false, error: 'Không tìm thấy GitHub token. Vui lòng đăng nhập lại.' };
      }

      // Check for pending media and upload first
      const pendingMedia = getPendingMedia();
      if (pendingMedia.length > 0) {
        const confirmUpload = confirm(
          `Có ${pendingMedia.length} file media đang chờ upload lên GitHub.\n` +
            `Bao gồm: ${pendingMedia.map((m) => `${m.type} (${m.fileName})`).join(', ')}\n\n` +
            'Bạn có muốn upload trước khi lưu không?'
        );

        if (confirmUpload) {
          await uploadAllPendingMedia((current, total, fileName, type) => {
            console.log(`Uploading ${type} ${current}/${total}: ${fileName}`);
          });
        }
      }

      // Generate MDX content and save to GitHub
      const sanitizedId = story.id.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
      const mdxContent = generateStoryMdx(story);
      const mdxPath = `${GITHUB_CONFIG.contentPaths.stories}/${sanitizedId}.mdx`;

      await saveToGitHub({
        path: mdxPath,
        content: mdxContent,
        message: `Update story: ${story.title}`,
        token,
      });

      return { success: true, path: mdxPath };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

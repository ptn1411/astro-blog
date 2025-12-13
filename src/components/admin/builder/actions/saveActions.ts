import { Octokit } from '@octokit/rest';

import { REPO_NAME, REPO_OWNER } from '../../config';

interface SaveToGitHubOptions {
  path: string;
  content: string;
  message: string;
  token: string;
}

export async function saveToGitHub({ path, content, message, token }: SaveToGitHubOptions): Promise<void> {
  const octokit = new Octokit({ auth: token });
  const contentEncoded = btoa(unescape(encodeURIComponent(content))); // Handle UTF-8 safely

  // Check if file exists to get SHA
  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path,
    });
    if (!Array.isArray(data)) {
      sha = data.sha;
    }
  } catch {
    // File doesn't exist, ignore
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path,
    message,
    content: contentEncoded,
    sha,
  });
}

export async function saveLocally(path: string, content: string): Promise<void> {
  const res = await fetch('/admin/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to save locally');
  }
}

export function getGitHubToken(): string | null {
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

export function isLocalEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  );
}

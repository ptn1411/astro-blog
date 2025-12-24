import { Octokit } from '@octokit/rest';
import { REPO_NAME, REPO_OWNER } from '../../config';
import type { WidgetSchema } from '../registry';
import { getGitHubToken, isLocalEnvironment } from './saveActions';

// Path để lưu custom widgets
const WIDGETS_LOCAL_STORAGE_KEY = 'astro-builder-custom-widgets';
const WIDGETS_GITHUB_PATH = 'src/content/data/custom-widgets.json';

export interface CustomWidgetData {
  widgets: WidgetSchema[];
  lastUpdated: string;
  version: string;
}

/**
 * Load custom widgets từ localStorage
 */
export function loadWidgetsFromLocalStorage(): WidgetSchema[] {
  try {
    const stored = localStorage.getItem(WIDGETS_LOCAL_STORAGE_KEY);
    if (stored) {
      const data: CustomWidgetData = JSON.parse(stored);
      return data.widgets || [];
    }
  } catch (error) {
    console.error('Failed to load widgets from localStorage:', error);
  }
  return [];
}

/**
 * Save custom widgets vào localStorage
 */
export function saveWidgetsToLocalStorage(widgets: WidgetSchema[]): void {
  try {
    const data: CustomWidgetData = {
      widgets,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
    };
    localStorage.setItem(WIDGETS_LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save widgets to localStorage:', error);
    throw error;
  }
}

/**
 * Load custom widgets từ GitHub
 */
export async function loadWidgetsFromGitHub(): Promise<WidgetSchema[]> {
  const token = getGitHubToken();
  if (!token) {
    console.warn('No GitHub token found, skipping GitHub widget load');
    return [];
  }

  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: WIDGETS_GITHUB_PATH,
    });

    if (!Array.isArray(data) && 'content' in data) {
      const content = atob(data.content);
      const widgetData: CustomWidgetData = JSON.parse(content);
      return widgetData.widgets || [];
    }
  } catch (error: any) {
    if (error.status === 404) {
      console.log('No custom widgets file found on GitHub');
      return [];
    }
    console.error('Failed to load widgets from GitHub:', error);
  }
  return [];
}

/**
 * Save custom widgets lên GitHub
 */
export async function saveWidgetsToGitHub(widgets: WidgetSchema[]): Promise<void> {
  const token = getGitHubToken();
  if (!token) {
    throw new Error('Not authenticated. Please log in via CMS first.');
  }

  const octokit = new Octokit({ auth: token });
  
  const data: CustomWidgetData = {
    widgets,
    lastUpdated: new Date().toISOString(),
    version: '1.0.0',
  };
  
  const content = JSON.stringify(data, null, 2);
  const contentEncoded = btoa(unescape(encodeURIComponent(content)));

  // Check if file exists to get SHA
  let sha: string | undefined;
  try {
    const { data: existingFile } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: WIDGETS_GITHUB_PATH,
    });
    if (!Array.isArray(existingFile)) {
      sha = existingFile.sha;
    }
  } catch {
    // File doesn't exist, will create new
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: WIDGETS_GITHUB_PATH,
    message: `Update custom widgets - ${new Date().toLocaleString()}`,
    content: contentEncoded,
    sha,
  });
}

/**
 * Save custom widgets locally via API endpoint
 */
export async function saveWidgetsLocally(widgets: WidgetSchema[]): Promise<void> {
  const data: CustomWidgetData = {
    widgets,
    lastUpdated: new Date().toISOString(),
    version: '1.0.0',
  };

  const res = await fetch('/admin/widgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to save widgets locally');
  }
}

/**
 * Load custom widgets - tự động chọn source phù hợp
 */
export async function loadCustomWidgets(): Promise<WidgetSchema[]> {
  // Luôn load từ localStorage trước (cache)
  const localWidgets = loadWidgetsFromLocalStorage();
  
  // Nếu là local environment, thử load từ API
  if (isLocalEnvironment()) {
    try {
      const res = await fetch('/admin/widgets');
      if (res.ok) {
        const data: CustomWidgetData = await res.json();
        if (data.widgets && data.widgets.length > 0) {
          // Sync to localStorage
          saveWidgetsToLocalStorage(data.widgets);
          return data.widgets;
        }
      }
    } catch (error) {
      console.error('Failed to load from local API:', error);
    }
    return localWidgets;
  }
  
  // Nếu không phải local environment, thử load từ GitHub
  try {
    const githubWidgets = await loadWidgetsFromGitHub();
    if (githubWidgets.length > 0) {
      // Sync to localStorage
      saveWidgetsToLocalStorage(githubWidgets);
      return githubWidgets;
    }
  } catch (error) {
    console.error('Failed to load from GitHub, using local cache:', error);
  }
  
  return localWidgets;
}

/**
 * Save custom widgets - lưu cả local và remote
 */
export async function saveCustomWidgets(widgets: WidgetSchema[]): Promise<{ local: boolean; remote: boolean }> {
  const result = { local: false, remote: false };
  
  // Luôn save vào localStorage
  try {
    saveWidgetsToLocalStorage(widgets);
    result.local = true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
  
  // Save lên GitHub hoặc local file
  try {
    if (isLocalEnvironment()) {
      await saveWidgetsLocally(widgets);
    } else {
      await saveWidgetsToGitHub(widgets);
    }
    result.remote = true;
  } catch (error) {
    console.error('Failed to save to remote:', error);
  }
  
  return result;
}

/**
 * Export widgets ra file JSON
 */
export function exportWidgetsToFile(widgets: WidgetSchema[]): void {
  const data: CustomWidgetData = {
    widgets,
    lastUpdated: new Date().toISOString(),
    version: '1.0.0',
  };
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'custom-widgets.json';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import widgets từ file JSON
 */
export function parseWidgetsFromFile(text: string): { success: boolean; widgets?: WidgetSchema[]; error?: string } {
  try {
    const data = JSON.parse(text);
    
    // Support cả format mới (có wrapper) và cũ (array trực tiếp)
    const widgets = data.widgets || (Array.isArray(data) ? data : null);
    
    if (!widgets || !Array.isArray(widgets)) {
      return { success: false, error: 'Invalid format: expected widgets array' };
    }
    
    // Validate basic widget structure
    for (const widget of widgets) {
      if (!widget.type || !widget.label || !widget.fields) {
        return { success: false, error: `Invalid widget: missing required fields (type, label, fields)` };
      }
    }
    
    return { success: true, widgets };
  } catch (error) {
    return { success: false, error: 'Failed to parse JSON file' };
  }
}

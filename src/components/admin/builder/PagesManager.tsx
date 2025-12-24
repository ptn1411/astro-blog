import { Edit, Eye, FolderOpen, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { GITHUB_BRANCH, GITHUB_CONFIG, getGitHubApiUrl, getGitHubContentUrl } from '../config';
import { getGitHubToken, isLocalEnvironment, type BuilderBlock, type PageMetadata } from './index';
import { useBuilderResponsive } from './hooks/useBuilderResponsive';
import { MobilePagesManager } from './mobile';

export interface PageInfo {
  path: string;
  title: string;
  description: string;
  lastModified?: string;
  hasBuilderData: boolean;
  sha?: string; // GitHub SHA for updates
}

interface PagesManagerProps {
  onEditPage?: (pageData: { blocks: BuilderBlock[]; metadata: PageMetadata; path: string }) => void;
  onCreateNew?: () => void;
  isDarkMode?: boolean;
}

async function fetchPagesFromGitHub(token: string): Promise<PageInfo[]> {
  const pages: PageInfo[] = [];
  const paths = [GITHUB_CONFIG.contentPaths.pages];

  for (const basePath of paths) {
    try {
      const response = await fetch(getGitHubApiUrl(basePath), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) continue;

      const files = await response.json();

      for (const file of files) {
        if (file.name.endsWith('.mdx') || file.name.endsWith('.md')) {
          // Fetch file content to extract metadata
          const contentResponse = await fetch(file.download_url);
          const content = await contentResponse.text();

          const { metadata, hasBuilderData } = parsePageContent(content);

          pages.push({
            path: file.path,
            title: metadata.title || file.name.replace(/\.mdx?$/, ''),
            description: metadata.description || '',
            hasBuilderData,
            sha: file.sha,
          });
        }
      }
    } catch (error) {
      console.error(`Failed to fetch from ${basePath}:`, error);
    }
  }

  return pages;
}

function parsePageContent(content: string): {
  metadata: { title?: string; description?: string };
  hasBuilderData: boolean;
  builderData?: { blocks: BuilderBlock[]; metadata: PageMetadata };
} {
  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const metadata: { title?: string; description?: string } = {};

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const titleMatch = frontmatter.match(/title:\s*['"]?([^'"\n]+)['"]?/);
    const descMatch = frontmatter.match(/description:\s*['"]?([^'"\n]+)['"]?/);

    if (titleMatch) metadata.title = titleMatch[1].trim();
    if (descMatch) metadata.description = descMatch[1].trim();
  }

  // Check for builder data
  const builderDataMatch = content.match(/\{\/\*\s*BUILDER_DATA_START\n([\s\S]*?)\nBUILDER_DATA_END\s*\*\/\}/);
  let builderData: { blocks: BuilderBlock[]; metadata: PageMetadata } | undefined;

  if (builderDataMatch) {
    try {
      builderData = JSON.parse(builderDataMatch[1]);
    } catch {
      console.error('Failed to parse builder data');
    }
  }

  return {
    metadata,
    hasBuilderData: !!builderDataMatch,
    builderData,
  };
}

// Helper to decode base64 with proper UTF-8 support
function decodeBase64UTF8(base64: string): string {
  // Remove any whitespace/newlines that GitHub might include
  const cleanBase64 = base64.replace(/\s/g, '');
  const binaryString = atob(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

async function fetchPageContent(path: string, token: string): Promise<string | null> {
  try {
    const response = await fetch(getGitHubApiUrl(path), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return decodeBase64UTF8(data.content);
  } catch (error) {
    console.error('Failed to fetch page content:', error);
    return null;
  }
}

async function deletePageFromGitHub(path: string, sha: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(getGitHubContentUrl(path), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Delete page: ${path}`,
        sha,
        branch: GITHUB_BRANCH,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to delete page:', error);
    return false;
  }
}

export default function PagesManager({ onEditPage, onCreateNew, isDarkMode: propDarkMode }: PagesManagerProps) {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Use prop directly, fallback to localStorage if not provided
  const isDarkMode =
    propDarkMode ?? (typeof window !== 'undefined' && localStorage.getItem('builder-dark-mode') === 'true');

  const [deleteConfirm, setDeleteConfirm] = useState<PageInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingPage, setLoadingPage] = useState<string | null>(null);

  // --- Responsive Layout Hook (Requirement: 4.1) ---
  const { layoutMode } = useBuilderResponsive();
  const showMobileLayout = layoutMode === 'mobile';

  // Fetch pages list
  const fetchPages = async () => {
    setIsLoading(true);
    try {
      if (isLocalEnvironment()) {
        // Local: fetch from API endpoint
        const response = await fetch('/admin/pages');
        if (response.ok) {
          const data = await response.json();
          setPages(data.pages || []);
        } else {
          loadFromLocalStorage();
        }
      } else {
        // GitHub: fetch from repo
        const token = getGitHubToken();
        if (token) {
          const githubPages = await fetchPagesFromGitHub(token);
          setPages(githubPages);
        } else {
          loadFromLocalStorage();
        }
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    // Load saved pages from localStorage
    const savedPages: PageInfo[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('builder-page-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          savedPages.push({
            path: key.replace('builder-page-', ''),
            title: data.metadata?.title || 'Untitled',
            description: data.metadata?.description || '',
            lastModified: data.savedAt,
            hasBuilderData: !!data.blocks,
          });
        } catch {
          console.error('Failed to parse page:', key);
        }
      }
    }
    setPages(savedPages);
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleDelete = async (page: PageInfo) => {
    setIsDeleting(true);
    try {
      if (isLocalEnvironment()) {
        // Local: delete via API
        const response = await fetch(`/admin/pages?path=${encodeURIComponent(page.path)}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to delete locally');
        }
      } else {
        // GitHub: delete from repo
        const token = getGitHubToken();
        if (token && page.sha) {
          const success = await deletePageFromGitHub(page.path, page.sha, token);
          if (!success) {
            throw new Error('Failed to delete from GitHub');
          }
        }
      }

      setPages((prev) => prev.filter((p) => p.path !== page.path));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete page:', error);
      alert('Failed to delete page: ' + (error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async (page: PageInfo) => {
    setLoadingPage(page.path);
    try {
      let content: string | null = null;

      if (isLocalEnvironment()) {
        // Local: fetch from API
        const response = await fetch(`/admin/pages?path=${encodeURIComponent(page.path)}`);
        if (response.ok) {
          const data = await response.json();
          content = data.content;
        }
      } else {
        // GitHub: fetch from repo
        const token = getGitHubToken();
        if (token) {
          content = await fetchPageContent(page.path, token);
        }
      }

      if (content) {
        const { builderData } = parsePageContent(content);

        if (builderData && onEditPage) {
          onEditPage({
            blocks: builderData.blocks,
            metadata: builderData.metadata,
            path: page.path,
          });
        } else if (onEditPage) {
          // No builder data, start with empty
          alert('This page does not have builder data. Starting with empty canvas.');
          onEditPage({
            blocks: [],
            metadata: { title: page.title, description: page.description },
            path: page.path,
          });
        }
      } else {
        alert('Failed to load page content');
      }
    } catch (error) {
      console.error('Failed to load page:', error);
      alert('Failed to load page: ' + (error as Error).message);
    } finally {
      setLoadingPage(null);
    }
  };

  const handlePreview = (page: PageInfo) => {
    // Open page in new tab
    const previewPath = page.path
      .replace(/^src\/content\/page\//, '/')
      .replace(/^src\/content\//, '/')
      .replace(/\.mdx?$/, '');
    window.open(previewPath, '_blank');
  };

  const filteredPages = pages.filter(
    (page) =>
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Mobile-specific callbacks (memoized for performance) ---
  const handleMobileEditPage = useCallback((page: PageInfo) => {
    handleEdit(page);
  }, []);

  const handleMobileDeletePage = useCallback((page: PageInfo) => {
    handleDelete(page);
  }, []);

  const handleMobilePreviewPage = useCallback((page: PageInfo) => {
    handlePreview(page);
  }, []);

  // --- Render Mobile Layout when on mobile viewport (Requirement: 4.1) ---
  if (showMobileLayout) {
    return (
      <MobilePagesManager
        pages={filteredPages}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onEditPage={handleMobileEditPage}
        onDeletePage={handleMobileDeletePage}
        onPreviewPage={handleMobilePreviewPage}
        onCreateNew={onCreateNew || (() => (window.location.href = '/admin/builder'))}
        onRefresh={fetchPages}
        isDarkMode={isDarkMode}
        loadingPage={loadingPage}
      />
    );
  }

  // --- Desktop Layout (original) ---

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header */}
      <header
        className={`px-6 py-4 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            📄 Pages Manager
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchPages}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="Refresh"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onCreateNew || (() => (window.location.href = '/admin/builder'))}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={20} /> New Page
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search
              size={18}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
            />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500'
                  : 'bg-white border-gray-300 text-gray-800 placeholder:text-gray-400'
              }`}
            />
          </div>
        </div>

        {/* Pages Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={32} className="animate-spin text-blue-500" />
          </div>
        ) : filteredPages.length === 0 ? (
          <div
            className={`text-center py-12 rounded-lg border-2 border-dashed ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
          >
            <FolderOpen size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchQuery ? 'No pages found matching your search' : 'No pages created yet'}
            </p>
            <button
              onClick={onCreateNew || (() => (window.location.href = '/admin/builder'))}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Create your first page
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPages.map((page) => (
              <div
                key={page.path}
                className={`rounded-lg border p-4 transition-all hover:shadow-lg ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                      {page.title}
                    </h3>
                    <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{page.path}</p>
                  </div>
                  {page.hasBuilderData && (
                    <span
                      className={`ml-2 px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                        isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      ✓ Builder
                    </span>
                  )}
                </div>

                {page.description && (
                  <p className={`text-sm mb-3 line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {page.description}
                  </p>
                )}

                {page.lastModified && (
                  <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Last modified: {new Date(page.lastModified).toLocaleString()}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(page)}
                    disabled={loadingPage === page.path}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {loadingPage === page.path ? <RefreshCw size={16} className="animate-spin" /> : <Edit size={16} />}
                    {loadingPage === page.path ? 'Loading...' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handlePreview(page)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                    title="Preview"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(page)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode ? 'hover:bg-red-900/50 text-red-400' : 'hover:bg-red-50 text-red-500'
                    }`}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-lg shadow-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                🗑️ Confirm Delete
              </h3>
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={20} />
              </button>
            </div>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Are you sure you want to delete this page? This action cannot be undone.
            </p>
            <div
              className={`text-sm mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
            >
              <p className="font-medium">{deleteConfirm.title}</p>
              <p className="text-xs opacity-70 mt-1">{deleteConfirm.path}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className={`px-4 py-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting && <RefreshCw size={16} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

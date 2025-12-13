import { Copy, Edit, Eye, FileText, Loader2, MoreVertical, Play, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GITHUB_CONFIG, getGitHubApiUrl } from '../config';
import type { Story } from './types';

// Helper functions
function getGitHubToken(): string | null {
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

interface StoriesManagerProps {
  onCreateNew: () => void;
  onEdit: (story: Story) => void;
}

interface StoredStory {
  id: string;
  story: Story;
  lastModified: string;
  thumbnail?: string;
  source?: 'local' | 'file' | 'github';
  path?: string;
  sha?: string;
}

export default function StoriesManager({ onCreateNew, onEdit }: StoriesManagerProps) {
  const [stories, setStories] = useState<StoredStory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  // Load stories from localStorage or GitHub/local API
  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setIsLoading(true);
    try {
      const loadedStories: StoredStory[] = [];

      if (isLocalEnvironment()) {
        // Dev mode: fetch from local API
        try {
          const response = await fetch('/admin/get-stories');
          if (response.ok) {
            const data = await response.json();
            const fileStories = data.stories || [];

            for (const fileStory of fileStories) {
              try {
                const story = fileStory.story as Story;
                loadedStories.push({
                  id: fileStory.id || `story-${story.id}`,
                  story,
                  lastModified:
                    story.updatedAt || story.createdAt || fileStory.lastModified || new Date().toISOString(),
                  thumbnail: generateThumbnail(story),
                  source: 'file',
                  path: fileStory.path,
                });
              } catch (e) {
                console.error('Failed to parse story from file:', e);
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch from local API:', error);
        }
      } else {
        // Production mode: fetch from GitHub
        const token = getGitHubToken();
        if (token) {
          try {
            const response = await fetch(getGitHubApiUrl(GITHUB_CONFIG.contentPaths.stories), {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
              },
            });

            if (response.ok) {
              const files = await response.json();

              for (const file of files) {
                if (file.name.endsWith('.json')) {
                  try {
                    const contentResponse = await fetch(file.download_url);
                    const story = (await contentResponse.json()) as Story;

                    loadedStories.push({
                      id: `story-${story.id}`,
                      story,
                      lastModified: story.updatedAt || story.createdAt || new Date().toISOString(),
                      thumbnail: generateThumbnail(story),
                      source: 'github',
                      path: file.path,
                      sha: file.sha,
                    });
                  } catch (e) {
                    console.error(`Failed to fetch story ${file.name}:`, e);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Failed to fetch from GitHub:', error);
          }
        }
      }

      // Also load from localStorage (drafts)
      const keys = Object.keys(localStorage).filter((key) => key.startsWith('story-'));
      keys.forEach((key) => {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const story = JSON.parse(data) as Story;
            // Check if already loaded from file/GitHub
            const existingIndex = loadedStories.findIndex((s) => s.story.id === story.id);
            if (existingIndex === -1) {
              loadedStories.push({
                id: key,
                story,
                lastModified: story.updatedAt || story.createdAt || new Date().toISOString(),
                thumbnail: generateThumbnail(story),
                source: 'local',
              });
            }
          }
        } catch (e) {
          console.error(`Failed to parse story ${key}:`, e);
        }
      });

      // Sort by last modified
      loadedStories.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

      setStories(loadedStories);
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateThumbnail = (story: Story): string => {
    // Get first slide background
    const firstSlide = story.slides[0];
    if (firstSlide?.background.type === 'image' && firstSlide.background.value) {
      return firstSlide.background.value;
    } else if (firstSlide?.background.type === 'color') {
      return firstSlide.background.value;
    } else if (firstSlide?.background.type === 'gradient' && firstSlide.background.gradient) {
      const colors = firstSlide.background.gradient.colors.map((c) => c.color).join(', ');
      return `linear-gradient(135deg, ${colors})`;
    }
    return '#1e293b';
  };

  const handleDelete = (storyId: string) => {
    if (confirm('Bạn có chắc muốn xóa bản tin này?')) {
      localStorage.removeItem(storyId);
      loadStories();
      setShowMenu(null);
    }
  };

  const handleDuplicate = (story: StoredStory) => {
    const newStory: Story = {
      ...story.story,
      id: `story-${Date.now()}`,
      title: `${story.story.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newId = `story-${newStory.id}`;
    localStorage.setItem(newId, JSON.stringify(newStory));
    loadStories();
    setShowMenu(null);
  };

  const handleExport = (story: StoredStory) => {
    const dataStr = JSON.stringify(story.story, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.story.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(null);
  };

  const isLocal = isLocalEnvironment();

  const filteredStories = stories.filter(
    (s) =>
      s.story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.story.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'github':
        return <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[9px] rounded">GitHub</span>;
      case 'file':
        return <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] rounded">Local</span>;
      case 'local':
        return <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[9px] rounded">Draft</span>;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Quản lý Bản tin
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {stories.length} bản tin • {filteredStories.length} hiển thị
              <span
                className={`ml-2 px-2 py-0.5 rounded text-xs ${isLocal ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}
              >
                {isLocal ? '🖥️ Dev Mode' : '☁️ Production'}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadStories()}
              disabled={isLoading}
              className="p-2.5 rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/30"
            >
              <Plus size={20} />
              Tạo bản tin mới
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-slate-400">Đang tải bản tin...</p>
            </div>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText size={48} className="text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">
              {searchQuery ? 'Không tìm thấy bản tin' : 'Chưa có bản tin nào'}
            </h3>
            <p className="text-slate-500 mb-4 max-w-md">
              {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Bắt đầu tạo bản tin đầu tiên của bạn với Story Builder'}
            </p>
            {!searchQuery && (
              <button
                onClick={onCreateNew}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
              >
                <Plus size={18} />
                Tạo bản tin mới
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {filteredStories.map((story) => (
              <div
                key={story.id}
                className={`group bg-slate-800 rounded-lg border transition-all cursor-pointer ${
                  selectedStory === story.id
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
                onClick={() => setSelectedStory(story.id)}
              >
                {/* Thumbnail */}
                <div className="aspect-[9/16] rounded-t-lg relative overflow-hidden bg-slate-700">
                  {story.thumbnail?.startsWith('http') ||
                  story.thumbnail?.startsWith('/') ||
                  story.thumbnail?.startsWith('data:') ? (
                    <img src={story.thumbnail} alt={story.story.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" style={{ background: story.thumbnail || '#1e293b' }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Slide count badge */}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-medium">
                    {story.story.slides.length} slides
                  </div>

                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <a
                      href={`/stories/${story.story.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors block"
                    >
                      <Play size={20} className="text-white" fill="white" />
                    </a>
                  </div>

                  {/* Menu button */}
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(showMenu === story.id ? null : story.id);
                      }}
                      className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Dropdown menu */}
                    {showMenu === story.id && (
                      <div className="absolute top-10 right-0 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(story.story);
                            setShowMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-700 transition-colors text-left"
                        >
                          <Edit size={16} />
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(story);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-700 transition-colors text-left"
                        >
                          <Copy size={16} />
                          Nhân bản
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExport(story);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-700 transition-colors text-left"
                        >
                          <Eye size={16} />
                          Export JSON
                        </button>
                        <div className="border-t border-slate-700" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(story.id);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-500/20 text-red-400 transition-colors text-left"
                        >
                          <Trash2 size={16} />
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-medium text-white text-sm line-clamp-1 flex-1">{story.story.title}</h3>
                    {getSourceBadge(story.source)}
                  </div>
                  <p className="text-[10px] text-slate-400">{formatDate(story.lastModified)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showMenu && <div className="fixed inset-0 z-0" onClick={() => setShowMenu(null)} />}
    </div>
  );
}

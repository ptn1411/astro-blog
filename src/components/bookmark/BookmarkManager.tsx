import { IconExternalLink, IconFilter, IconLayoutGrid, IconList, IconSearch, IconStar } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import ApiSheet from '~/utils/apiSheet';

// --- Interfaces ---

interface Bookmark {
  id: string;
  title: string;
  url: string;
  description: string;
  favicon: string;
  folder_id: string;
  tag_ids: string; // csv
  is_favorite: boolean;
}

interface Folder {
  id: string;
  name: string;
  slug: string;
  parent_id: string;
  icon: string;
  sort_order: number;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

// --- Components ---

const BookmarkCard = ({ bookmark, tags, viewMode }: { bookmark: Bookmark; tags: Tag[]; viewMode: 'grid' | 'list' }) => {
  const bookmarkTags = useMemo(() => {
    if (!bookmark.tag_ids) return [];
    const ids = bookmark.tag_ids
      .toString()
      .split(',')
      .map((s) => s.trim());
    return tags.filter((t) => ids.includes(t.id));
  }, [bookmark.tag_ids, tags]);

  // Default favicon if none provided
  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return 'https://www.google.com/s2/favicons?domain=example.com';
    }
  };

  const faviconUrl = bookmark.favicon || getFavicon(bookmark.url);

  if (viewMode === 'list') {
    return (
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 dark:bg-slate-700 p-2 mr-4 flex items-center justify-center overflow-hidden">
          <img
            src={faviconUrl}
            alt=""
            className="w-full h-full object-contain"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {bookmark.title}
            </h3>
            {bookmark.is_favorite && <IconStar className="w-3 h-3 text-yellow-500 fill-current" />}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{bookmark.url}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 ml-4">
          {bookmarkTags.map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              #{tag.name}
            </span>
          ))}
        </div>
        <IconExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 ml-4 opacity-0 group-hover:opacity-100 transition-all" />
      </a>
    );
  }

  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
    >
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-slate-700 p-2.5 flex items-center justify-center shadow-inner">
            <img
              src={faviconUrl}
              alt=""
              className="w-full h-full object-contain"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
          {bookmark.is_favorite && (
            <div className="p-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-full text-yellow-500">
              <IconStar className="w-4 h-4 fill-current" />
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {bookmark.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
          {bookmark.description || bookmark.url}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-auto">
          {bookmarkTags.map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>
      <div className="px-5 py-3 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-xs text-gray-400">
        <span className="truncate max-w-[80%]">{new URL(bookmark.url).hostname}</span>
        <IconExternalLink className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
      </div>
    </a>
  );
};

export default function BookmarkManager() {
  const [api, setApi] = useState<ApiSheet | null>(null);
  const [data, setData] = useState<{ bookmarks: Bookmark[]; folders: Folder[]; tags: Tag[] }>({
    bookmarks: [],
    folders: [],
    tags: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // UI State
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile

  useEffect(() => {
    const init = async () => {
      const url = localStorage.getItem('bookmark_script_url');
      const key = localStorage.getItem('bookmark_api_key');

      if (!url) {
        setIsLoading(false);
        setError('Configuration missing. Please set up one in Admin Dashboard first.');
        return;
      }

      try {
        const apiSheet = new ApiSheet(url, key || undefined);
        setApi(apiSheet);

        const [bookmarks, folders, tags] = await Promise.all([
          apiSheet.findAll<Bookmark[]>('Bookmarks'),
          apiSheet.findAll<Folder[]>('Folders'),
          apiSheet.findAll<Tag[]>('Tags'),
        ]);

        setData({
          bookmarks: Array.isArray(bookmarks) ? bookmarks : [],
          folders: Array.isArray(folders) ? folders : [],
          tags: Array.isArray(tags) ? tags : [],
        });
      } catch (err) {
        console.error(err);
        setError('Failed to load data. Please check your connection or configuration.');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const filteredBookmarks = useMemo(() => {
    return data.bookmarks.filter((b) => {
      // 1. Filter by Folder (if selected)
      if (activeFolderId && b.folder_id != activeFolderId) return false;

      // 2. Filter by Tags (if any selected) - OR logic (contains ANY selected tag) -> Changed to AND logic? Let's do OR for now
      if (selectedTagIds.length > 0) {
        if (!b.tag_ids) return false;
        const bTags = b.tag_ids
          .toString()
          .split(',')
          .map((t) => t.trim());
        const hasTag = selectedTagIds.some((id) => bTags.includes(id));
        if (!hasTag) return false;
      }

      // 3. Filter by Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          b.title.toLowerCase().includes(query) ||
          b.description?.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [data.bookmarks, activeFolderId, selectedTagIds, searchQuery]);

  // Sort folders
  const sortedFolders = useMemo(() => {
    return [...data.folders].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [data.folders]);

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 animate-pulse">Syncing Library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-6">
            <IconExternalLink className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connection Issue</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
          <a
            href="/admin/bookmarks"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Go to Admin Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0B0F19]">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-[#111827] border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-auto
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
          <div className="mb-8">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Folders</h2>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveFolderId(null)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeFolderId === null
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <IconLayoutGrid className="w-4 h-4 mr-3" />
                All Bookmarks
              </button>
              {sortedFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeFolderId === folder.id
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="w-4 h-4 mr-3 flex items-center justify-center text-lg">{folder.icon || '📁'}</span>
                  {folder.name}
                </button>
              ))}
            </nav>
          </div>

          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedTagIds.includes(tag.id)
                      ? 'ring-2 ring-offset-1 dark:ring-offset-gray-900'
                      : 'hover:opacity-80'
                  }`}
                  style={
                    {
                      backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : `${tag.color}15`,
                      color: selectedTagIds.includes(tag.id) ? '#fff' : tag.color,
                      borderColor: tag.color,
                      '--tw-ring-color': tag.color,
                    } as any
                  }
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center z-30">
          <div className="flex items-center w-full sm:w-auto">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 mr-4 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <IconList className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeFolderId ? data.folders.find((f) => f.id === activeFolderId)?.name : 'Library'}
            </h1>
            <span className="ml-3 px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-500">
              {filteredBookmarks.length}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-500 rounded-xl text-sm transition-all"
              />
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <IconLayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <IconList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* scrollable area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar" onClick={() => setIsSidebarOpen(false)}>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBookmarks.map((bookmark) => (
                <BookmarkCard key={bookmark.id} bookmark={bookmark} tags={data.tags} viewMode="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl mx-auto">
              {filteredBookmarks.map((bookmark) => (
                <BookmarkCard key={bookmark.id} bookmark={bookmark} tags={data.tags} viewMode="list" />
              ))}
            </div>
          )}

          {filteredBookmarks.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 pb-20">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-6">
                <IconFilter className="w-10 h-10 opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No items match your filter</h3>
              <p>Try selecting a different folder or clearing tags.</p>
              <button
                onClick={() => {
                  setActiveFolderId(null);
                  setSelectedTagIds([]);
                  setSearchQuery('');
                }}
                className="mt-6 text-blue-600 hover:underline text-sm font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

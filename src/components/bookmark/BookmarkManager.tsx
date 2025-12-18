import { IconExternalLink, IconFilter, IconLayoutGrid, IconList, IconSearch, IconX } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import ApiSheet, { type BookmarkEntity, type FolderEntity } from '~/utils/apiSheet';

// --- Components ---

const BookmarkCard = ({ bookmark, viewMode }: { bookmark: BookmarkEntity; viewMode: 'grid' | 'list' }) => {
  // Default favicon
  const getFavicon = (url?: string) => {
    if (!url) return 'https://www.google.com/s2/favicons?domain=example.com';
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return 'https://www.google.com/s2/favicons?domain=example.com';
    }
  };

  const faviconUrl = getFavicon(bookmark.url);

  if (viewMode === 'list') {
    return (
      <a
        href={bookmark.url || '#'}
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
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{bookmark.url}</p>
        </div>

        <IconExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 ml-4 opacity-0 group-hover:opacity-100 transition-all" />
      </a>
    );
  }

  return (
    <a
      href={bookmark.url || '#'}
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
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {bookmark.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
          {bookmark.description || bookmark.url}
        </p>
      </div>
      <div className="px-5 py-3 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-xs text-gray-400">
        <span className="truncate max-w-[80%]">{bookmark.url ? new URL(bookmark.url).hostname : 'No URL'}</span>
        <IconExternalLink className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
      </div>
    </a>
  );
};

export default function BookmarkManager() {
  const [data, setData] = useState<{ bookmarks: BookmarkEntity[]; folders: FolderEntity[] }>({
    bookmarks: [],
    folders: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // UI State
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile

  useEffect(() => {
    const init = async () => {
      const url = 'AKfycbx62imWuDJupXYYgEmXFIfG9DK0Bqcu4lO1pqJAz3d_oRQ9FgnULx60L8ahbR_jtkVT';
      const key = 'public_read_key_qnzwjacphuhqvifeswilhhywggvdffox';
      if (!url) {
        setIsLoading(false);
        setError('Configuration missing. Please set up one in Admin Dashboard first.');
        return;
      }

      try {
        const apiSheet = new ApiSheet(url, key || undefined);

        const [bookmarks, folders] = await Promise.all([
          apiSheet.findAll<BookmarkEntity[]>('Bookmarks'),
          apiSheet.findAll<FolderEntity[]>('Folders'),
        ]);

        setData({
          bookmarks: Array.isArray(bookmarks) ? bookmarks : [],
          folders: Array.isArray(folders) ? folders : [],
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
      // 0. Only show "link" type or undefined (legacy)
      if (b.type && b.type !== 'link') return false;

      // 1. Filter by Folder (if selected)
      // activeFolderId corresponds to chromeId of the folder
      if (activeFolderId && b.parentId !== activeFolderId) return false;

      // 2. Filter by Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          b.title.toLowerCase().includes(query) ||
          b.description?.toLowerCase().includes(query) ||
          (b.url && b.url.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [data.bookmarks, activeFolderId, searchQuery]);

  // Sort folders
  const sortedFolders = useMemo(() => {
    return [...data.folders].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [data.folders]);

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
          <div className="flex justify-between items-center lg:hidden mb-6">
            <span className="text-lg font-bold text-gray-900 dark:text-white">Menu</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Folders</h2>
            <nav className="space-y-1">
              <button
                onClick={() => {
                  setActiveFolderId(null);
                  setIsSidebarOpen(false);
                }}
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
                  onClick={() => {
                    setActiveFolderId(folder.chromeId);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeFolderId === folder.chromeId
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="w-4 h-4 mr-3 flex items-center justify-center text-lg">{'📁'}</span>
                  {folder.name}
                </button>
              ))}
            </nav>
            {localStorage.getItem('bookmark_api_key') && (
              <a
                href="/admin/bookmarks"
                className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <IconExternalLink className="w-4 h-4 mr-3" />
                Open Admin
              </a>
            )}
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
              {activeFolderId ? data.folders.find((f) => f.chromeId === activeFolderId)?.name : 'Library'}
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
                <BookmarkCard key={bookmark.id} bookmark={bookmark} viewMode="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl mx-auto">
              {filteredBookmarks.map((bookmark) => (
                <BookmarkCard key={bookmark.id} bookmark={bookmark} viewMode="list" />
              ))}
            </div>
          )}

          {filteredBookmarks.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 pb-20">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-6">
                <IconFilter className="w-10 h-10 opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No items match your filter</h3>
              <p>Try selecting a different folder.</p>
              <button
                onClick={() => {
                  setActiveFolderId(null);
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

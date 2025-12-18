import {
  IconBookmark,
  IconEdit,
  IconFolder,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconUpload,
  IconX,
} from '@tabler/icons-react';
import React, { useEffect, useState } from 'react';
import ApiSheet, { type BookmarkEntity, type BookmarkMetaEntity, type FolderEntity } from '~/utils/apiSheet';

// --- Components ---

const InputField = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <input
      className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
      {...props}
    />
  </div>
);

export default function BookmarkAdmin() {
  const [apiKey, setApiKey] = useState('');
  const [scriptUrl, setScriptUrl] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'folders' | 'meta'>('bookmarks');
  const [api, setApi] = useState<ApiSheet | null>(null);

  // Data State
  const [bookmarks, setBookmarks] = useState<BookmarkEntity[]>([]);
  const [folders, setFolders] = useState<FolderEntity[]>([]);
  const [metas, setMetas] = useState<BookmarkMetaEntity[]>([]);
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const storedKey = localStorage.getItem('bookmark_api_key');
    const storedUrl = localStorage.getItem('bookmark_script_url');
    if (storedKey) setApiKey(storedKey);
    if (storedUrl) setScriptUrl(storedUrl);

    if (storedUrl) {
      initializeApi(storedUrl, storedKey || undefined);
    }
  }, []);
  useEffect(() => {
    if (api) {
      fetchData();
    }
  }, [api]);

  const initializeApi = (url: string, key?: string) => {
    try {
      const newApi = new ApiSheet(url, key);
      setApi(newApi);
      setIsAuthenticated(true);
    } catch (e) {
      console.error('Failed to init API', e);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('bookmark_api_key', apiKey);
    localStorage.setItem('bookmark_script_url', scriptUrl);
    initializeApi(scriptUrl, apiKey);
  };

  const handleLogout = () => {
    localStorage.removeItem('bookmark_api_key');
    localStorage.removeItem('bookmark_script_url');
    setApiKey('');
    setScriptUrl('');
    setIsAuthenticated(false);
    setApi(null);
    setBookmarks([]);
    setFolders([]);
    setMetas([]);
  };

  const fetchData = async () => {
    if (!api) return;
    setIsLoading(true);
    try {
      // Parallel fetch for efficiency
      const [bookmarksRes, foldersRes, metasRes] = await Promise.all([
        api.findAll<BookmarkEntity[]>('Bookmarks'),
        api.findAll<FolderEntity[]>('Folders'),
        api.findAll<BookmarkMetaEntity[]>('BookmarkMeta'),
      ]);

      setBookmarks(Array.isArray(bookmarksRes) ? bookmarksRes : []);
      setFolders(Array.isArray(foldersRes) ? foldersRes : []);
      setMetas(Array.isArray(metasRes) ? metasRes : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!api) return;
    setIsLoading(true);

    const tableMap = {
      bookmarks: 'Bookmarks',
      folders: 'Folders',
      meta: 'BookmarkMeta',
    };

    const tableName = tableMap[activeTab];

    try {
      if (editItem && editItem.id) {
        // Update
        await api.updateById(tableName, { ...formData, id: editItem.id });
      } else {
        // Create
        // Need to ensure chromeId or other required fields are present if manual creation
        const newItem = {
          ...formData,
          chromeId: formData.chromeId || crypto.randomUUID(),
        };
        // For bookmarks, ensure type is set
        if (activeTab === 'bookmarks' && !newItem.type) {
          newItem.type = 'link';
        }

        await api.create(tableName, newItem);
      }
      setIsModalOpen(false);
      setEditItem(null);
      setFormData({});
      await fetchData();
    } catch (error) {
      console.error('Save failed', error);
      alert('Save failed: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    if (!api) return;

    const tableMap = {
      bookmarks: 'Bookmarks',
      folders: 'Folders',
      meta: 'BookmarkMeta',
    };
    const tableName = tableMap[activeTab];

    setIsLoading(true);
    try {
      await api.deleteById(tableName, id);
      await fetchData();
    } catch (error) {
      console.error('Delete failed', error);
      alert('Delete failed');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (item: any = null) => {
    setEditItem(item);
    setFormData(item || {});
    setIsModalOpen(true);
  };

  // Helper function to create slug from name
  const createSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Parse bookmarks HTML file
  const parseBookmarksHTML = (htmlContent: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    const newBookmarks: BookmarkEntity[] = [];
    const newFolders: FolderEntity[] = [];
    const folderMap = new Map<Element, string>();

    // Recursive function to process folders and bookmarks
    const processNode = (element: Element, parentFolderId: string, sortOrder: number = 0) => {
      const children = Array.from(element.children);
      let currentSortOrder = sortOrder;

      children.forEach((child) => {
        if (child.tagName === 'DT') {
          const h3 = child.querySelector('H3');
          const a = child.querySelector('A');
          const dl = child.querySelector('DL');

          // It's a folder
          if (h3 && dl) {
            const folderName = h3.textContent?.trim() || 'Untitled Folder';
            const chromeId = crypto.randomUUID(); // Generate a unique ID for the folder

            newFolders.push({
              chromeId: chromeId,
              name: folderName,
              slug: createSlug(folderName),
              parentId: parentFolderId,
              icon: '📁',
              sortOrder: currentSortOrder++,
            });

            folderMap.set(dl, chromeId);
            processNode(dl, chromeId, 0);
          }
          // It's a bookmark
          else if (a) {
            const href = a.getAttribute('HREF');
            const title = a.textContent?.trim() || 'Untitled';

            // Skip javascript bookmarklets and invalid URLs
            if (href && !href.startsWith('javascript:') && !href.startsWith('chrome://')) {
              newBookmarks.push({
                chromeId: crypto.randomUUID(),
                title,
                url: href,
                description: '',
                parentId: parentFolderId,
                index: currentSortOrder++,
                type: 'link',
              });
            }
          }
        }
        // Handle nested DL elements
        else if (child.tagName === 'DL') {
          const folderId = folderMap.get(child) || parentFolderId;
          processNode(child, folderId, 0);
        }
      });
    };

    // Find the main DL element and start processing
    const mainDL = doc.querySelector('DL');
    if (mainDL) {
      // Use '' for root parentId to match "No Folder" logic
      processNode(mainDL, '');
    }

    return { bookmarks: newBookmarks, folders: newFolders };
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be selected again if needed
    event.target.value = '';

    setIsLoading(true);

    try {
      const text = await file.text();
      const { bookmarks: parsedBookmarks, folders: parsedFolders } = parseBookmarksHTML(text);

      // Create folders first to ensure hierarchy (though parallelism might make this mute without transactions)
      // Using sequence for safety with potential weak backend
      for (const folder of parsedFolders) {
        await api?.create('Folders', folder);
      }
      for (const bookmark of parsedBookmarks) {
        await api?.create('Bookmarks', bookmark);
      }

      alert(`Successfully imported ${parsedFolders.length} folders and ${parsedBookmarks.length} bookmarks.`);
    } catch (err) {
      console.error('Error parsing bookmarks:', err);
      alert('Failed to import bookmarks.');
    } finally {
      fetchData();
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Script URL / ID</label>
            <input
              type="text"
              required
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/..."
              className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Key (Optional)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Connect
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans">
      {/* Navbar */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900 dark:text-white ml-2">Bookmark Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                <IconUpload className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                Import HTML
                <input type="file" accept=".html" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                onClick={fetchData}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                title="Reload Data"
              >
                <IconRefresh className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-4 mb-6 overflow-x-auto pb-2 border-b border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === 'bookmarks'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <IconBookmark className="w-4 h-4 mr-2" />
            Bookmarks
          </button>
          <button
            onClick={() => setActiveTab('folders')}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === 'folders'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <IconFolder className="w-4 h-4 mr-2" />
            Folders
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full sm:w-64">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm transition-colors w-full sm:w-auto justify-center"
          >
            <IconPlus className="w-4 h-4 mr-2" />
            Add New
          </button>
        </div>

        {/* Content Table */}
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  {activeTab === 'bookmarks' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        URL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                    </>
                  )}
                  {activeTab === 'folders' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Slug
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Parent
                      </th>
                    </>
                  )}

                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {activeTab === 'bookmarks' &&
                  bookmarks
                    .filter(
                      (b) =>
                        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        b.url?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {String(item.id || '').substring(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item.title.length > 40 ? item.title.substring(0, 40) + '...' : item.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500 hover:underline">
                          <a href={item.url} target="_blank" rel="noreferrer">
                            {item.url ? (item.url.length > 30 ? item.url.substring(0, 30) + '...' : item.url) : '-'}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openModal(item)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                          >
                            <IconEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id as number)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <IconTrash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                {activeTab === 'folders' &&
                  folders
                    .filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {String(item.id || '').substring(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white flex items-center">
                          <IconFolder className="w-4 h-4 mr-2 text-yellow-500" /> {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.slug}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.parentId || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openModal(item)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                          >
                            <IconEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id as number)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <IconTrash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {((activeTab === 'bookmarks' && bookmarks.length === 0) ||
              (activeTab === 'folders' && folders.length === 0)) && (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                {isLoading ? 'Loading data...' : 'No items found. Click "Add New" to create one.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
              onClick={() => setIsModalOpen(false)}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                    {editItem ? `Edit ${activeTab.slice(0, -1)}` : `New ${activeTab.slice(0, -1)}`}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <IconX className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  {/* Dynamic Fields based on activeTab */}
                  {activeTab === 'bookmarks' && (
                    <>
                      <InputField
                        label="Title"
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                      <InputField
                        label="URL"
                        type="url"
                        value={formData.url || ''}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        required
                      />
                      <InputField
                        label="Description"
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Folder
                        </label>
                        <select
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                          value={formData.parentId || ''}
                          onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                        >
                          <option value="">No Folder (Root)</option>
                          {folders.map((f) => (
                            <option key={f.id} value={f.chromeId}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                        <select
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                          value={formData.type || 'link'}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                          <option value="link">Link</option>
                          <option value="folder">Folder</option>
                        </select>
                      </div>
                    </>
                  )}

                  {activeTab === 'folders' && (
                    <>
                      <InputField
                        label="Name"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                      <InputField
                        label="Slug"
                        value={formData.slug || ''}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        required
                      />
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Parent Folder
                        </label>
                        <select
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                          value={formData.parentId || ''}
                          onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                        >
                          <option value="">Root</option>
                          {folders
                            .filter((f) => f.id !== editItem?.id)
                            .map((f) => (
                              <option key={f.id} value={f.chromeId}>
                                {f.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="mr-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

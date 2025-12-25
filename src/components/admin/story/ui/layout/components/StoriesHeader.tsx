import { Plus, RefreshCw, Search, X } from 'lucide-react';

interface StoriesHeaderProps {
  storiesCount: number;
  filteredCount: number;
  isLocal: boolean;
  isLoading: boolean;
  isMobile: boolean;
  searchQuery: string;
  showMobileSearch: boolean;
  onSearchChange: (query: string) => void;
  onToggleMobileSearch: () => void;
  onRefresh: () => void;
  onCreateNew: () => void;
}

export function StoriesHeader({
  storiesCount,
  filteredCount,
  isLocal,
  isLoading,
  isMobile,
  searchQuery,
  showMobileSearch,
  onSearchChange,
  onToggleMobileSearch,
  onRefresh,
  onCreateNew,
}: StoriesHeaderProps) {
  return (
    <div className="bg-slate-800 border-b border-slate-700 px-4 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between">
        <div className={isMobile ? 'flex-1 min-w-0' : ''}>
          <h1
            className={`font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent ${isMobile ? 'text-lg' : 'text-2xl'}`}
          >
            {isMobile ? 'Bản tin' : 'Quản lý Bản tin'}
          </h1>
          {!isMobile && (
            <p className="text-sm text-slate-400 mt-1">
              {storiesCount} bản tin • {filteredCount} hiển thị
              <span
                className={`ml-2 px-2 py-0.5 rounded text-xs ${isLocal ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}
              >
                {isLocal ? '🖥️ Dev Mode' : '☁️ Production'}
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile search toggle */}
          {isMobile && (
            <button
              onClick={onToggleMobileSearch}
              className={`p-2.5 rounded-lg border transition-colors ${
                showMobileSearch
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-slate-600 hover:bg-slate-700'
              }`}
              title="Tìm kiếm"
            >
              {showMobileSearch ? <X size={18} /> : <Search size={18} />}
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          {/* Desktop create button */}
          {!isMobile && (
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/30"
            >
              <Plus size={20} />
              Tạo bản tin mới
            </button>
          )}
        </div>
      </div>

      {/* Search - Desktop always visible, Mobile toggleable */}
      {(!isMobile || showMobileSearch) && (
        <div className={`${isMobile ? 'mt-3' : 'mt-4'}`}>
          <div className={`relative ${isMobile ? 'w-full' : 'max-w-md'}`}>
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc ID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus={isMobile && showMobileSearch}
            />
          </div>
        </div>
      )}
    </div>
  );
}

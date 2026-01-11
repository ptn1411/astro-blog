import { Clock, FileText, Plus, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useResponsive } from '../../../../../hooks/useResponsive';
import { useStoriesManager } from '../../hooks/useStoriesManager';
import { FloatingActionButton } from '../../mobile';
import type { StoredStory } from '../../services/storiesService';
import type { Story } from '../../types';
import { isLocalEnvironment } from '../../utils/github';

// Dashboard Components
import { ActionButton, EmptyState, LoadingSpinner, SearchBar, StatsCard } from './DashboardComponents';

// Existing Components
import { MobileStoryActions, StoriesGrid } from './components';

interface StoriesManagerProps {
  onCreateNew: () => void;
  onEdit: (story: Story) => void;
}

export function StoriesManager({ onCreateNew, onEdit }: StoriesManagerProps) {
  // Mobile responsive state
  const { isMobile, viewportWidth } = useResponsive();
  const [mobileActionStory, setMobileActionStory] = useState<StoredStory | null>(null);

  // Stories manager hook
  const {
    stories,
    filteredStories,
    searchQuery,
    setSearchQuery,
    isLoading,
    selectedStory,
    setSelectedStory,
    showMenu,
    setShowMenu,
    loadStories,
    handleDelete,
    handleDuplicate,
    handleExport,
  } = useStoriesManager();

  const isLocal = isLocalEnvironment();

  return (
    <div className="min-h-screen">
      {/* Dashboard Header with Stats */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-white mb-2">Quản lý Stories</h2>
            <p className="text-sm sm:text-base text-slate-400">Tạo và quản lý bản tin với animations và templates</p>
          </div>
          {!isMobile && (
            <ActionButton
              icon={<Plus className="w-5 h-5" />}
              label="Tạo Story mới"
              onClick={onCreateNew}
              variant="primary"
              size="md"
            />
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <StatsCard
            label="Tổng số Stories"
            value={stories.length}
            icon={<FileText className="w-5 h-5 text-blue-400" />}
          />
          <StatsCard
            label="Đã lọc"
            value={filteredStories.length}
            icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
          />
          <StatsCard
            label="Cập nhật gần đây"
            value={stories.length > 0 ? new Date(stories[0]?.lastModified).toLocaleDateString('vi-VN') : '-'}
            icon={<Clock className="w-5 h-5 text-orange-400" />}
          />
        </div>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm kiếm theo tiêu đề, mô tả..."
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* Stories Content */}
      {isLoading ? (
        <div className="py-20">
          <LoadingSpinner size="lg" label="Đang tải stories..." />
        </div>
      ) : filteredStories.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-10 h-10 text-slate-500" />}
          title={searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có story nào'}
          description={searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Bắt đầu tạo story đầu tiên của bạn'}
          action={{
            label: 'Tạo Story mới',
            onClick: onCreateNew,
          }}
        />
      ) : (
        <StoriesGrid
          stories={filteredStories}
          isLoading={isLoading}
          searchQuery={searchQuery}
          selectedStory={selectedStory}
          showMenu={showMenu}
          isMobile={isMobile}
          viewportWidth={viewportWidth}
          onSelectStory={setSelectedStory}
          onMobileAction={setMobileActionStory}
          onMenuToggle={setShowMenu}
          onEdit={(story) => {
            onEdit(story.story);
            setShowMenu(null);
          }}
          onDuplicate={handleDuplicate}
          onExport={handleExport}
          onDelete={handleDelete}
          onCreateNew={onCreateNew}
        />
      )}

      {/* Click outside to close menu */}
      {showMenu && <div className="fixed inset-0 z-0" onClick={() => setShowMenu(null)} />}

      {/* Mobile Floating Action Button */}
      {isMobile && (
        <FloatingActionButton
          icon={<Plus size={24} />}
          onClick={onCreateNew}
          position="bottom-right"
          size="large"
          color="bg-gradient-to-r from-blue-600 to-purple-600"
          label="Tạo bản tin mới"
        />
      )}

      {/* Mobile Story Actions Bottom Sheet */}
      <MobileStoryActions
        story={mobileActionStory}
        onClose={() => setMobileActionStory(null)}
        onEdit={() => mobileActionStory && onEdit(mobileActionStory.story)}
        onDuplicate={() => mobileActionStory && handleDuplicate(mobileActionStory)}
        onExport={() => mobileActionStory && handleExport(mobileActionStory)}
        onDelete={() => mobileActionStory && handleDelete(mobileActionStory)}
      />
    </div>
  );
}

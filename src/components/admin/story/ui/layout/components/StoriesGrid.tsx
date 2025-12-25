import { FileText, Loader2, Plus } from 'lucide-react';
import type { StoredStory } from '../../../services/storiesService';
import { StoryCard } from './StoryCard';

interface StoriesGridProps {
  stories: StoredStory[];
  isLoading: boolean;
  searchQuery: string;
  selectedStory: string | null;
  showMenu: string | null;
  isMobile: boolean;
  viewportWidth: number;
  onSelectStory: (id: string | null) => void;
  onMobileAction: (story: StoredStory) => void;
  onMenuToggle: (id: string | null) => void;
  onEdit: (story: StoredStory) => void;
  onDuplicate: (story: StoredStory) => void;
  onExport: (story: StoredStory) => void;
  onDelete: (story: StoredStory) => void;
  onCreateNew: () => void;
}

export function StoriesGrid({
  stories,
  isLoading,
  searchQuery,
  selectedStory,
  showMenu,
  isMobile,
  viewportWidth,
  onSelectStory,
  onMobileAction,
  onMenuToggle,
  onEdit,
  onDuplicate,
  onExport,
  onDelete,
  onCreateNew,
}: StoriesGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-slate-400">Đang tải bản tin...</p>
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
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
    );
  }

  const gridCols =
    viewportWidth < 480
      ? 'grid-cols-1'
      : viewportWidth < 768
        ? 'grid-cols-2'
        : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';

  return (
    <div className={`grid gap-3 ${gridCols}`}>
      {stories.map((story) => (
        <StoryCard
          key={story.id}
          story={story}
          isSelected={selectedStory === story.id}
          showMenu={showMenu === story.id}
          isMobile={isMobile}
          onSelect={() => {
            if (isMobile) {
              onMobileAction(story);
            } else {
              onSelectStory(story.id);
            }
          }}
          onMenuToggle={() => onMenuToggle(showMenu === story.id ? null : story.id)}
          onEdit={() => onEdit(story)}
          onDuplicate={() => onDuplicate(story)}
          onExport={() => onExport(story)}
          onDelete={() => onDelete(story)}
        />
      ))}
    </div>
  );
}

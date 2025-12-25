import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useResponsive } from '../../../../../hooks/useResponsive';
import { FloatingActionButton } from '../../mobile';
import { isLocalEnvironment } from '../../utils/github';
import { useStoriesManager } from '../../hooks/useStoriesManager';
import type { StoredStory } from '../../services/storiesService';
import type { Story } from '../../types';

// Components
import { StoriesHeader, StoriesGrid, MobileStoryActions } from './components';

interface StoriesManagerProps {
  onCreateNew: () => void;
  onEdit: (story: Story) => void;
}

export function StoriesManager({ onCreateNew, onEdit }: StoriesManagerProps) {
  // Mobile responsive state
  const { isMobile, viewportWidth } = useResponsive();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
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
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      {/* Header */}
      <StoriesHeader
        storiesCount={stories.length}
        filteredCount={filteredStories.length}
        isLocal={isLocal}
        isLoading={isLoading}
        isMobile={isMobile}
        searchQuery={searchQuery}
        showMobileSearch={showMobileSearch}
        onSearchChange={setSearchQuery}
        onToggleMobileSearch={() => setShowMobileSearch(!showMobileSearch)}
        onRefresh={loadStories}
        onCreateNew={onCreateNew}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
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
      </div>

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

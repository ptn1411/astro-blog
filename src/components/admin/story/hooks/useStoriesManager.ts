import { useEffect, useState, useCallback } from 'react';
import {
  loadAllStories,
  deleteStory,
  duplicateStory,
  exportStoryAsJSON,
  type StoredStory,
} from '../services/storiesService';

export function useStoriesManager() {
  const [stories, setStories] = useState<StoredStory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  // Load stories
  const loadStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedStories = await loadAllStories();
      setStories(loadedStories);
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadStories();
  }, [loadStories]);

  // Handle delete
  const handleDelete = useCallback(async (story: StoredStory) => {
    if (confirm('Bạn có chắc muốn xóa bản tin này?')) {
      try {
        await deleteStory(story);
        loadStories();
        setShowMenu(null);
      } catch (error) {
        console.error('Failed to delete story:', error);
        alert('Xóa bản tin thất bại. Vui lòng thử lại.');
      }
    }
  }, [loadStories]);

  // Handle duplicate
  const handleDuplicate = useCallback((story: StoredStory) => {
    duplicateStory(story);
    loadStories();
    setShowMenu(null);
  }, [loadStories]);

  // Handle export
  const handleExport = useCallback((story: StoredStory) => {
    exportStoryAsJSON(story.story);
    setShowMenu(null);
  }, []);

  // Filter stories
  const filteredStories = stories.filter(
    (s) =>
      s.story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.story.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
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
  };
}

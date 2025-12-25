import { Copy, Edit, Eye, Play, Trash2 } from 'lucide-react';
import { BottomSheet } from '../../../mobile';
import type { StoredStory } from '../../../services/storiesService';

interface MobileStoryActionsProps {
  story: StoredStory | null;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onDelete: () => void;
}

export function MobileStoryActions({
  story,
  onClose,
  onEdit,
  onDuplicate,
  onExport,
  onDelete,
}: MobileStoryActionsProps) {
  return (
    <BottomSheet
      isOpen={!!story}
      onClose={onClose}
      title={story?.story.title || 'Tùy chọn'}
      snapPoints={[0.4]}
      initialSnap={0}
    >
      {story && (
        <div className="p-4 space-y-2">
          <button
            onClick={() => {
              onEdit();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Edit size={20} className="text-blue-400" />
            <span className="text-white">Chỉnh sửa</span>
          </button>
          <button
            onClick={() => {
              onDuplicate();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Copy size={20} className="text-green-400" />
            <span className="text-white">Nhân bản</span>
          </button>
          <button
            onClick={() => {
              onExport();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Eye size={20} className="text-purple-400" />
            <span className="text-white">Export JSON</span>
          </button>
          <a
            href={`/stories/${story.story.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700 rounded-lg transition-colors"
            onClick={onClose}
          >
            <Play size={20} className="text-cyan-400" />
            <span className="text-white">Xem trước</span>
          </a>
          <div className="border-t border-slate-700 my-2" />
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <Trash2 size={20} className="text-red-400" />
            <span className="text-red-400">Xóa</span>
          </button>
        </div>
      )}
    </BottomSheet>
  );
}

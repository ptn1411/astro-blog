import { Copy, Edit, Eye, MoreVertical, Play, Trash2 } from 'lucide-react';
import { resolveMediaUrl } from '~/utils/mediaUrl';
import type { StoredStory } from '../../../services/storiesService';
import { formatRelativeDate } from '../../../utils/dateFormatter';

interface StoryCardProps {
  story: StoredStory;
  isSelected: boolean;
  showMenu: boolean;
  isMobile: boolean;
  onSelect: () => void;
  onMenuToggle: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onDelete: () => void;
}

function getSourceBadge(source?: string) {
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
}

export function StoryCard({
  story,
  isSelected,
  showMenu,
  isMobile,
  onSelect,
  onMenuToggle,
  onEdit,
  onDuplicate,
  onExport,
  onDelete,
}: StoryCardProps) {
  const isImageThumbnail =
    story.thumbnail?.startsWith('http') ||
    story.thumbnail?.startsWith('/') ||
    story.thumbnail?.startsWith('data:') ||
    story.thumbnail?.startsWith('src/') ||
    story.thumbnail?.startsWith('~/');

  return (
    <div
      className={`group bg-slate-800 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 shadow-lg shadow-blue-500/20'
          : 'border-slate-700 hover:border-slate-600'
      }`}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="aspect-[9/16] rounded-t-lg relative overflow-hidden bg-slate-700">
        {isImageThumbnail ? (
          <img
            src={resolveMediaUrl(story.thumbnail!)}
            alt={story.story.title}
            className="w-full h-full object-cover"
          />
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
            onClick={(e) => e.stopPropagation()}
          >
            <Play size={20} className="text-white" fill="white" />
          </a>
        </div>

        {/* Menu button */}
        {!isMobile && (
          <div className="absolute top-2 right-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMenuToggle();
              }}
              className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute top-10 right-0 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-700 transition-colors text-left"
                >
                  <Edit size={16} />
                  Chỉnh sửa
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-700 transition-colors text-left"
                >
                  <Copy size={16} />
                  Nhân bản
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExport();
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
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-500/20 text-red-400 transition-colors text-left"
                >
                  <Trash2 size={16} />
                  Xóa
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="font-medium text-white text-sm line-clamp-1 flex-1">{story.story.title}</h3>
          {getSourceBadge(story.source)}
        </div>
        <p className="text-[10px] text-slate-400">{formatRelativeDate(story.lastModified)}</p>
      </div>
    </div>
  );
}

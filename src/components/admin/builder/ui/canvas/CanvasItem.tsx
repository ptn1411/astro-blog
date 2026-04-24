import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, Copy, GripVertical, Trash2 } from 'lucide-react';
import React from 'react';
import { WIDGET_REGISTRY } from '../../config/registry';
import type { BuilderBlock } from '../../core/types/block.types';

interface CanvasItemProps {
  block: BuilderBlock;
  index: number;
  total: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onMoveUp?: (e: React.MouseEvent) => void;
  onMoveDown?: (e: React.MouseEvent) => void;
  isDarkMode: boolean;
}

export function CanvasItem({
  block,
  index,
  total,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  isDarkMode,
}: CanvasItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const widgetDef = WIDGET_REGISTRY.find((w) => w.type === block.type);
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const btnBase = `p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed`;
  const btnNeutral = isDarkMode
    ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-700'
    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100';
  const btnDanger = isDarkMode
    ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/10'
    : 'text-gray-500 hover:text-red-600 hover:bg-red-50';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative mb-2 border-2 rounded-lg group cursor-pointer transition-all ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } ${
        isSelected
          ? isDarkMode
            ? 'border-blue-400 ring-2 ring-blue-400/30 shadow-md'
            : 'border-blue-500 ring-2 ring-blue-100 shadow-md'
          : isDarkMode
            ? 'border-gray-700 hover:border-blue-500/60'
            : 'border-gray-200 hover:border-blue-300'
      }`}
      onClick={onSelect}
      {...attributes}
    >
      <div className="flex items-center gap-2 p-3">
        <div
          {...listeners}
          className={`cursor-grab active:cursor-grabbing flex-shrink-0 ${
            isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
          }`}
          onClick={(e) => e.stopPropagation()}
          title="Kéo để sắp xếp"
        >
          <GripVertical size={18} />
        </div>

        <div className={`flex-shrink-0 w-6 h-6 rounded text-[11px] font-mono font-semibold flex items-center justify-center ${
          isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
        }`}>
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <span className={`font-semibold text-sm block truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            {widgetDef?.label || block.type}
          </span>
          <span className={`text-xs truncate block ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {(block.props.title as string) || (block.props.tagline as string) || block.type}
          </span>
        </div>

        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {onMoveUp && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!isFirst) onMoveUp(e);
              }}
              disabled={isFirst}
              className={`${btnBase} ${btnNeutral}`}
              title="Di chuyển lên (Alt+↑)"
            >
              <ArrowUp size={14} />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!isLast) onMoveDown(e);
              }}
              disabled={isLast}
              className={`${btnBase} ${btnNeutral}`}
              title="Di chuyển xuống (Alt+↓)"
            >
              <ArrowDown size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onDuplicate}
            className={`${btnBase} ${btnNeutral}`}
            title="Nhân bản"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`${btnBase} ${btnDanger}`}
            title="Xoá (Delete)"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

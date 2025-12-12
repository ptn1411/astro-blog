import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, GripVertical, Trash2 } from 'lucide-react';
import React from 'react';
import { WIDGET_REGISTRY } from '../../registry';
import type { BuilderBlock } from '../types';

interface CanvasItemProps {
  block: BuilderBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  isDarkMode: boolean;
}

export function CanvasItem({ block, isSelected, onSelect, onDelete, onDuplicate, isDarkMode }: CanvasItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const widgetDef = WIDGET_REGISTRY.find((w) => w.type === block.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative p-4 mb-2 border-2 rounded group cursor-pointer transition-colors ${
        isDarkMode ? 'bg-gray-800 hover:border-blue-400' : 'bg-white hover:border-blue-300'
      } ${
        isSelected
          ? isDarkMode
            ? 'border-blue-400 ring-2 ring-blue-400/30'
            : 'border-blue-500 ring-2 ring-blue-100'
          : isDarkMode
            ? 'border-gray-600'
            : 'border-gray-200'
      }`}
      onClick={onSelect}
      {...attributes}
    >
      <div className="flex items-center gap-3">
        <div
          {...listeners}
          className={`cursor-grab ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <GripVertical size={20} />
        </div>
        <div className="flex-1">
          <span className={`font-bold text-sm block ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            {widgetDef?.label || block.type}
          </span>
          <span className={`text-xs truncate block max-w-[200px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {(block.props.title as string) || 'No title'}
          </span>
        </div>
        <button
          onClick={onDuplicate}
          className={`p-2 rounded transition-colors ${isDarkMode ? 'text-gray-500 hover:text-blue-400 hover:bg-blue-400/10' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`}
          title="Duplicate"
        >
          <Copy size={16} />
        </button>
        <button
          onClick={onDelete}
          className={`p-2 rounded transition-colors ${isDarkMode ? 'text-gray-500 hover:text-red-400 hover:bg-red-400/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

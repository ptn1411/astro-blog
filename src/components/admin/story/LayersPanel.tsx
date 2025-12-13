import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, Eye, EyeOff, GripVertical, Image, Lock, Shapes, Trash2, Type, Unlock, Video } from 'lucide-react';
import React from 'react';
import type { StoryElement } from './types';

interface LayersPanelProps {
  elements: StoryElement[];
  selectedElementIds: string[];
  onSelectElement: (id: string, multiSelect?: boolean) => void;
  onReorderElements: (elements: StoryElement[]) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
}

interface LayerItemProps {
  element: StoryElement;
  isSelected: boolean;
  onSelect: (multiSelect?: boolean) => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

// Get icon based on element type
const getElementIcon = (type: StoryElement['type']) => {
  switch (type) {
    case 'text':
      return <Type size={14} />;
    case 'image':
      return <Image size={14} />;
    case 'video':
      return <Video size={14} />;
    case 'shape':
      return <Shapes size={14} />;
    default:
      return <Shapes size={14} />;
  }
};

// Get element preview/label
const getElementLabel = (element: StoryElement): string => {
  switch (element.type) {
    case 'text':
      return element.content.slice(0, 20) + (element.content.length > 20 ? '...' : '');
    case 'image':
      return 'Image';
    case 'video':
      return 'Video';
    case 'shape':
      return element.shapeType ? element.shapeType.charAt(0).toUpperCase() + element.shapeType.slice(1) : 'Shape';
    case 'sticker':
      return 'Sticker';
    case 'gif':
      return 'GIF';
    default:
      return element.type;
  }
};

const LayerItem = ({
  element,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onDuplicate,
}: LayerItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: element.id,
    disabled: element.locked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isHidden = element.visible === false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors ${
        isDragging ? 'opacity-50 bg-slate-600' : ''
      } ${isSelected ? 'bg-blue-600/30 border border-blue-500/50' : 'hover:bg-slate-700/50 border border-transparent'} ${
        isHidden ? 'opacity-50' : ''
      }`}
      onClick={(e) => onSelect(e.shiftKey || e.ctrlKey || e.metaKey)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={`p-0.5 cursor-grab active:cursor-grabbing ${element.locked ? 'opacity-30 cursor-not-allowed' : ''}`}
      >
        <GripVertical size={12} className="text-slate-500" />
      </div>

      {/* Element icon */}
      <div
        className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center ${
          isSelected ? 'bg-blue-500/30 text-blue-300' : 'bg-slate-700 text-slate-400'
        }`}
      >
        {getElementIcon(element.type)}
      </div>

      {/* Element name */}
      <div className="flex-1 min-w-0">
        <span className={`text-xs truncate block ${isSelected ? 'text-white' : 'text-slate-300'}`}>
          {getElementLabel(element)}
        </span>
      </div>

      {/* Quick actions - visible on hover or when selected */}
      <div
        className={`flex items-center gap-0.5 transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {/* Visibility toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className={`p-1 rounded transition-colors ${
            isHidden ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-white'
          }`}
          title={isHidden ? 'Show' : 'Hide'}
        >
          {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>

        {/* Lock toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          className={`p-1 rounded transition-colors ${
            element.locked ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-400 hover:text-white'
          }`}
          title={element.locked ? 'Unlock' : 'Lock'}
        >
          {element.locked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>

        {/* Duplicate */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          title="Duplicate"
        >
          <Copy size={12} />
        </button>

        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded text-slate-400 hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

export const LayersPanel: React.FC<LayersPanelProps> = ({
  elements,
  selectedElementIds,
  onSelectElement,
  onReorderElements,
  onToggleVisibility,
  onToggleLock,
  onDeleteElement,
  onDuplicateElement,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort elements by z-index (highest first for layer panel)
  const sortedElements = [...elements].sort((a, b) => (b.style.zIndex || 0) - (a.style.zIndex || 0));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedElements.findIndex((el) => el.id === active.id);
    const newIndex = sortedElements.findIndex((el) => el.id === over.id);

    const reordered = arrayMove(sortedElements, oldIndex, newIndex);

    // Update z-index based on new order (reverse because highest z-index should be at top of list)
    const updatedElements = reordered.map((el, idx) => ({
      ...el,
      style: {
        ...el.style,
        zIndex: reordered.length - idx,
      },
    }));

    onReorderElements(updatedElements);
  };

  if (elements.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-slate-500 text-xs">No elements</div>
        <div className="text-slate-600 text-[10px] mt-1">Add elements from the left panel</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-700 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{elements.length} Layers</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500">Drag to reorder</span>
        </div>
      </div>

      {/* Layers list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedElements.map((el) => el.id)} strategy={verticalListSortingStrategy}>
            {sortedElements.map((element) => (
              <LayerItem
                key={element.id}
                element={element}
                isSelected={selectedElementIds.includes(element.id)}
                onSelect={(multiSelect) => onSelectElement(element.id, multiSelect)}
                onToggleVisibility={() => onToggleVisibility(element.id)}
                onToggleLock={() => onToggleLock(element.id)}
                onDelete={() => onDeleteElement(element.id)}
                onDuplicate={() => onDuplicateElement(element.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Footer with keyboard hints */}
      <div className="px-3 py-2 border-t border-slate-700">
        <div className="text-[10px] text-slate-500 space-y-0.5">
          <div>
            <kbd className="px-1 py-0.5 bg-slate-700 rounded text-[9px]">Shift</kbd>
            <span className="ml-1">+ click for multi-select</span>
          </div>
          <div>
            <kbd className="px-1 py-0.5 bg-slate-700 rounded text-[9px]">Del</kbd>
            <span className="ml-1">to delete selected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

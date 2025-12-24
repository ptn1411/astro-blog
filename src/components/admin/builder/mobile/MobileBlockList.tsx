import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DropAnimation } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, Edit2, GripVertical, MoreVertical, Trash2, X } from 'lucide-react';
import { BUILDER_TOUCH_CONFIG } from '../constants/breakpoints';
import { WIDGET_REGISTRY } from '../registry';
import type { BuilderBlock } from '../types';

/**
 * MobileBlockList Component - Touch-optimized block list for mobile devices
 * Requirements: 3.2, 3.3
 * 
 * Implements:
 * - Touch-optimized block cards with 44px minimum touch targets
 * - Long-press context menu (edit, duplicate, delete)
 * - Drag-and-drop reordering with @dnd-kit touch sensors
 * - Visual feedback during drag operations
 * - Smooth reordering animations
 */

export interface MobileBlockListProps {
  /** Array of builder blocks to display */
  blocks: BuilderBlock[];
  /** Currently selected block ID */
  selectedId: string | null;
  /** Callback when a block is selected */
  onSelect: (id: string) => void;
  /** Callback when blocks are reordered */
  onReorder: (blocks: BuilderBlock[]) => void;
  /** Callback when a block is deleted */
  onDelete: (id: string) => void;
  /** Callback when a block is duplicated */
  onDuplicate: (id: string) => void;
  /** Callback when edit properties is requested */
  onEditProperties?: (id: string) => void;
  /** Whether dark mode is enabled */
  isDarkMode?: boolean;
}

interface ContextMenuState {
  isOpen: boolean;
  blockId: string | null;
  position: { x: number; y: number };
}

/** Drop animation configuration for smooth transitions */
const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

/**
 * SortableBlockCard - Sortable wrapper for block cards
 * Wrapped with React.memo to prevent unnecessary re-renders (Requirement 10.4)
 */
interface SortableBlockCardProps {
  block: BuilderBlock;
  isSelected: boolean;
  onSelect: () => void;
  onLongPress: (position: { x: number; y: number }) => void;
  onMenuClick: (e: React.MouseEvent | React.TouchEvent) => void;
  isDarkMode: boolean;
  isOverlay?: boolean;
}

const SortableBlockCard: React.FC<SortableBlockCardProps> = React.memo(({
  block,
  isSelected,
  onSelect,
  onLongPress,
  onMenuClick,
  isDarkMode,
  isOverlay = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <MobileBlockCard
        block={block}
        isSelected={isSelected}
        onSelect={onSelect}
        onLongPress={onLongPress}
        onMenuClick={onMenuClick}
        isDarkMode={isDarkMode}
        isDragging={isDragging}
        isOverlay={isOverlay}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
});

// Display name for debugging
SortableBlockCard.displayName = 'SortableBlockCard';

/**
 * MobileBlockCard - Individual block card with touch interactions
 * Wrapped with React.memo to prevent unnecessary re-renders (Requirement 10.4)
 */
interface MobileBlockCardProps {
  block: BuilderBlock;
  isSelected: boolean;
  onSelect: () => void;
  onLongPress: (position: { x: number; y: number }) => void;
  onMenuClick: (e: React.MouseEvent | React.TouchEvent) => void;
  isDarkMode: boolean;
  isDragging?: boolean;
  isOverlay?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

const MobileBlockCard: React.FC<MobileBlockCardProps> = React.memo(({
  block,
  isSelected,
  onSelect,
  onLongPress,
  onMenuClick,
  isDarkMode,
  isDragging = false,
  isOverlay = false,
  dragHandleProps = {},
}) => {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const widgetDef = WIDGET_REGISTRY.find((w) => w.type === block.type);
  const IconComponent = widgetDef?.icon;

  // Clear long press timer
  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsPressed(false);
  }, []);

  // Handle touch start - start long press timer
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Don't start long press if touching the drag handle
    const target = e.target as HTMLElement;
    if (target.closest('[data-drag-handle]')) return;

    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsPressed(true);

    longPressTimerRef.current = setTimeout(() => {
      if (touchStartRef.current) {
        onLongPress({ x: touchStartRef.current.x, y: touchStartRef.current.y });
      }
      clearLongPress();
    }, BUILDER_TOUCH_CONFIG.longPressDelay);
  }, [onLongPress, clearLongPress]);

  // Handle touch move - cancel long press if moved too far
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Cancel long press if moved beyond threshold
    if (deltaX > BUILDER_TOUCH_CONFIG.dragStartThreshold || 
        deltaY > BUILDER_TOUCH_CONFIG.dragStartThreshold) {
      clearLongPress();
    }
  }, [clearLongPress]);

  // Handle touch end - clear timer and trigger tap if not long press
  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      // Long press didn't complete, treat as tap
      clearLongPress();
      onSelect();
    }
    touchStartRef.current = null;
  }, [clearLongPress, onSelect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`
        relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
        touch-manipulation select-none
        ${isDragging && !isOverlay ? 'opacity-50 scale-95' : ''}
        ${isOverlay ? 'shadow-2xl scale-105' : ''}
        ${isPressed && !isDragging ? 'scale-[0.98]' : ''}
        ${isSelected
          ? isDarkMode
            ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
            : 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
          : isDarkMode
            ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}
      style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget + 24}px` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={clearLongPress}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      <div
        data-drag-handle
        {...dragHandleProps}
        className={`
          flex-shrink-0 p-2 -ml-2 rounded-lg cursor-grab active:cursor-grabbing
          ${isDarkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}
        `}
        style={{ 
          minWidth: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px`,
          minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'none',
        }}
      >
        <GripVertical size={20} />
      </div>

      {/* Widget Icon */}
      {IconComponent && (
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
          ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}
        `}>
          <IconComponent size={20} />
        </div>
      )}

      {/* Block Info */}
      <div className="flex-1 min-w-0">
        <span className={`font-semibold text-base block truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {widgetDef?.label || block.type}
        </span>
        <span className={`text-sm truncate block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {(block.props.title as string) || (block.props.quote as string) || 'No title'}
        </span>
      </div>

      {/* Menu Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMenuClick(e);
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          onMenuClick(e);
        }}
        className={`
          flex-shrink-0 p-3 rounded-lg transition-colors touch-manipulation
          ${isDarkMode 
            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700 active:bg-gray-600' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200'
          }
        `}
        style={{ 
          minWidth: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px`,
          minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px`,
        }}
        aria-label="Block options"
      >
        <MoreVertical size={20} />
      </button>
    </div>
  );
});

// Display name for debugging
MobileBlockCard.displayName = 'MobileBlockCard';

/**
 * ContextMenu - Floating context menu for block actions
 */
interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isDarkMode: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  isDarkMode,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate menu position to keep it on screen
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(position.y, window.innerHeight - 200),
    left: Math.min(Math.max(position.x - 80, 16), window.innerWidth - 176),
    zIndex: 100,
  };

  const menuItemClass = `
    flex items-center gap-3 w-full px-4 py-3 text-left transition-colors touch-manipulation
    ${isDarkMode ? 'hover:bg-gray-700 active:bg-gray-600' : 'hover:bg-gray-100 active:bg-gray-200'}
  `;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/20" 
        onClick={onClose}
        onTouchEnd={onClose}
      />
      
      {/* Menu */}
      <div
        ref={menuRef}
        style={menuStyle}
        className={`
          w-44 rounded-xl shadow-xl border overflow-hidden z-50
          ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        `}
      >
        <button
          onClick={() => { onEdit(); onClose(); }}
          className={`${menuItemClass} ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
          style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
        >
          <Edit2 size={18} />
          <span>Edit</span>
        </button>
        
        <button
          onClick={() => { onDuplicate(); onClose(); }}
          className={`${menuItemClass} ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
          style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
        >
          <Copy size={18} />
          <span>Duplicate</span>
        </button>
        
        <div className={`h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        
        <button
          onClick={() => { onDelete(); onClose(); }}
          className={`${menuItemClass} text-red-500`}
          style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
        >
          <Trash2 size={18} />
          <span>Delete</span>
        </button>
      </div>
    </>
  );
};


/**
 * Main MobileBlockList Component
 * Wrapped with React.memo to prevent unnecessary re-renders (Requirement 10.4)
 */
export const MobileBlockList: React.FC<MobileBlockListProps> = React.memo(({
  blocks,
  selectedId,
  onSelect,
  onReorder,
  onDelete,
  onDuplicate,
  onEditProperties,
  isDarkMode = true,
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    blockId: null,
    position: { x: 0, y: 0 },
  });
  const [activeId, setActiveId] = useState<string | null>(null);

  // Get block IDs for sortable context
  const blockIds = useMemo(() => blocks.map((b) => b.id), [blocks]);

  // Configure touch and mouse sensors for drag-and-drop
  // Touch sensor with delay to distinguish from scroll/tap
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200, // 200ms delay before drag starts
      tolerance: BUILDER_TOUCH_CONFIG.dragStartThreshold,
    },
  });

  // Mouse sensor for desktop testing
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: BUILDER_TOUCH_CONFIG.dragStartThreshold,
    },
  });

  const sensors = useSensors(touchSensor, mouseSensor);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Close context menu if open
    setContextMenu({ isOpen: false, blockId: null, position: { x: 0, y: 0 } });
    // Provide haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }, []);

  // Handle drag end - reorder blocks
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newBlocks = arrayMove(blocks, oldIndex, newIndex);
        onReorder(newBlocks);
        // Provide haptic feedback on successful reorder
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }
  }, [blocks, onReorder]);

  // Handle long press to show context menu
  const handleLongPress = useCallback((blockId: string, position: { x: number; y: number }) => {
    // Don't show context menu while dragging
    if (activeId) return;
    
    // Provide haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    setContextMenu({
      isOpen: true,
      blockId,
      position,
    });
  }, [activeId]);

  // Handle menu button click
  const handleMenuClick = useCallback((blockId: string, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({
      isOpen: true,
      blockId,
      position: { x: rect.left, y: rect.bottom + 8 },
    });
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu({ isOpen: false, blockId: null, position: { x: 0, y: 0 } });
  }, []);

  // Handle edit action
  const handleEdit = useCallback(() => {
    if (contextMenu.blockId) {
      onSelect(contextMenu.blockId);
      onEditProperties?.(contextMenu.blockId);
    }
  }, [contextMenu.blockId, onSelect, onEditProperties]);

  // Handle duplicate action
  const handleDuplicate = useCallback(() => {
    if (contextMenu.blockId) {
      onDuplicate(contextMenu.blockId);
    }
  }, [contextMenu.blockId, onDuplicate]);

  // Handle delete action
  const handleDelete = useCallback(() => {
    if (contextMenu.blockId) {
      onDelete(contextMenu.blockId);
    }
  }, [contextMenu.blockId, onDelete]);

  // Get active block for drag overlay
  const activeBlock = useMemo(() => {
    if (!activeId) return null;
    return blocks.find((b) => b.id === activeId) || null;
  }, [activeId, blocks]);

  // Empty state
  if (blocks.length === 0) {
    return (
      <div className={`
        flex flex-col items-center justify-center py-12 px-6 text-center
        ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
      `}>
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center mb-4
          ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}
        `}>
          <X size={32} className="opacity-50" />
        </div>
        <p className="text-lg font-medium mb-2">No blocks yet</p>
        <p className="text-sm opacity-75">
          Add widgets from the Widgets tab to start building your page
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
          {/* Block List */}
          <div className="space-y-3 p-4">
            {blocks.map((block) => (
              <SortableBlockCard
                key={block.id}
                block={block}
                isSelected={selectedId === block.id}
                onSelect={() => onSelect(block.id)}
                onLongPress={(pos) => handleLongPress(block.id, pos)}
                onMenuClick={(e) => handleMenuClick(block.id, e)}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drag Overlay - Shows the dragged item */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeBlock ? (
            <MobileBlockCard
              block={activeBlock}
              isSelected={selectedId === activeBlock.id}
              onSelect={() => {}}
              onLongPress={() => {}}
              onMenuClick={() => {}}
              isDarkMode={isDarkMode}
              isDragging={true}
              isOverlay={true}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        isDarkMode={isDarkMode}
      />
    </div>
  );
});

// Display name for debugging
MobileBlockList.displayName = 'MobileBlockList';

export default MobileBlockList;

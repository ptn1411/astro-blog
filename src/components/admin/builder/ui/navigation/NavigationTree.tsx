/**
 * NavigationTree Component
 *
 * Container component that renders a tree of NavigationNodes with
 * integrated drag-and-drop functionality using DragDropManager.
 *
 * Features:
 * - Renders tree structure with TreeNode components
 * - Manages drag state through DragDropManager
 * - Shows drop indicators during drag operations
 * - Handles drop events and tree updates
 *
 * Requirements: 4.1, 4.2, 4.3
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import type { NavigationNode as NavigationNodeType } from '../../core/types/navigation.types';
import type { DropPosition } from '../../services/navigation/DragDropManager';
import {
  DragDropManager,
  isValidDrop,
} from '../../services/navigation/DragDropManager';
import { TreeNode } from './TreeNode';
import type { DragHandleProps, DropIndicatorProps } from './TreeNode';

/**
 * Props for NavigationTree component
 */
export interface NavigationTreeProps {
  /** The navigation tree data */
  nodes: NavigationNodeType[];
  /** Maximum allowed tree depth */
  maxDepth?: number;
  /** Callback when tree is updated (after drag-drop) */
  onTreeChange: (nodes: NavigationNodeType[]) => void;
  /** Callback when a node should be edited */
  onEditNode: (node: NavigationNodeType) => void;
  /** Callback when a node should be deleted */
  onDeleteNode: (nodeId: string) => void;
  /** Callback when a child should be added to a node */
  onAddChild: (parentId: string | null) => void;
  /** Dark mode flag */
  isDarkMode?: boolean;
  /** Empty state message */
  emptyMessage?: string;
}

/**
 * Drag state for the tree
 */
interface DragState {
  isDragging: boolean;
  draggedNodeId: string | null;
  dropTargetId: string | null;
  dropPosition: DropPosition | null;
}

const initialDragState: DragState = {
  isDragging: false,
  draggedNodeId: null,
  dropTargetId: null,
  dropPosition: null,
};

/**
 * NavigationTree Component
 */
export function NavigationTree({
  nodes,
  maxDepth = 2,
  onTreeChange,
  onEditNode,
  onDeleteNode,
  onAddChild,
  isDarkMode = false,
  emptyMessage = 'No navigation items. Click "Add Link" to create one.',
}: NavigationTreeProps) {
  // Drag state
  const [dragState, setDragState] = useState<DragState>(initialDragState);

  // Create DragDropManager instance (memoized)
  const dragDropManager = useMemo(() => {
    return new DragDropManager(nodes, maxDepth);
  }, [nodes, maxDepth]);

  // Handle drag start
  const handleDragStart = useCallback((nodeId: string) => {
    setDragState({
      isDragging: true,
      draggedNodeId: nodeId,
      dropTargetId: null,
      dropPosition: null,
    });
  }, []);

  // Handle drag end (without drop)
  const handleDragEnd = useCallback(() => {
    setDragState(initialDragState);
  }, []);

  // Handle drag over a potential drop target
  const handleDragOver = useCallback(
    (targetId: string, position: DropPosition) => {
      if (!dragState.isDragging || !dragState.draggedNodeId) return;

      // Validate the drop
      const valid = isValidDrop(nodes, dragState.draggedNodeId, targetId, position, maxDepth);

      if (valid) {
        setDragState((prev) => ({
          ...prev,
          dropTargetId: targetId,
          dropPosition: position,
        }));
      } else {
        setDragState((prev) => ({
          ...prev,
          dropTargetId: null,
          dropPosition: null,
        }));
      }
    },
    [dragState.isDragging, dragState.draggedNodeId, nodes, maxDepth]
  );

  // Handle drop
  const handleDrop = useCallback(() => {
    if (
      !dragState.isDragging ||
      !dragState.draggedNodeId ||
      !dragState.dropTargetId ||
      !dragState.dropPosition
    ) {
      setDragState(initialDragState);
      return;
    }

    // Use DragDropManager to perform the move
    dragDropManager.setTree(nodes);
    dragDropManager.startDrag(dragState.draggedNodeId);
    dragDropManager.updateDropTarget(dragState.dropTargetId, dragState.dropPosition);
    const result = dragDropManager.completeDrop();

    if (result.success) {
      onTreeChange(result.tree);
    }

    setDragState(initialDragState);
  }, [
    dragState.isDragging,
    dragState.draggedNodeId,
    dragState.dropTargetId,
    dragState.dropPosition,
    dragDropManager,
    nodes,
    onTreeChange,
  ]);

  // Create drag handle props for TreeNode
  const dragHandleProps: DragHandleProps = useMemo(
    () => ({
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      isDragging: dragState.isDragging,
      draggedNodeId: dragState.draggedNodeId,
    }),
    [handleDragStart, handleDragEnd, dragState.isDragging, dragState.draggedNodeId]
  );

  // Create drop indicator props for TreeNode
  const dropIndicatorProps: DropIndicatorProps = useMemo(
    () => ({
      dropTargetId: dragState.dropTargetId,
      dropPosition: dragState.dropPosition,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    }),
    [dragState.dropTargetId, dragState.dropPosition, handleDragOver, handleDrop]
  );

  // Handle adding a root-level node
  const handleAddRootNode = () => {
    onAddChild(null);
  };

  return (
    <div className="space-y-2">
      {/* Tree nodes */}
      {nodes.length > 0 ? (
        <div className="space-y-1">
          {nodes.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              maxDepth={maxDepth}
              onEdit={onEditNode}
              onDelete={onDeleteNode}
              onAddChild={onAddChild}
              dragHandleProps={dragHandleProps}
              dropIndicatorProps={dropIndicatorProps}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      ) : (
        <div
          className={`p-4 text-center text-sm rounded-lg border-2 border-dashed ${
            isDarkMode
              ? 'text-gray-500 border-gray-700 bg-gray-800/50'
              : 'text-gray-400 border-gray-300 bg-gray-50'
          }`}
        >
          {emptyMessage}
        </div>
      )}

      {/* Add root node button */}
      <button
        type="button"
        onClick={handleAddRootNode}
        className={`w-full p-2 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 transition-colors ${
          isDarkMode
            ? 'border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/10'
            : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
        }`}
      >
        <Plus size={16} />
        <span className="text-sm font-medium">Add Link</span>
      </button>

      {/* Drag overlay indicator */}
      {dragState.isDragging && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 ${
            isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
          }`}
        >
          {dragState.dropTargetId
            ? `Drop ${dragState.dropPosition === 'child' ? 'as child' : dragState.dropPosition}`
            : 'Drag to reorder'}
        </div>
      )}
    </div>
  );
}

export default NavigationTree;

/**
 * TreeNode Component
 *
 * Renders a single navigation node with:
 * - Text, href, and icon display
 * - Expand/collapse for children
 * - Edit/delete/add-child action buttons
 * - Drag handle for drag-and-drop reordering
 *
 * Requirements: 2.1, 3.1
 */

import React, { useState, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Edit2,
  Trash2,
  Plus,
  ExternalLink,
  Link as LinkIcon,
} from 'lucide-react';
import * as TablerIcons from '@tabler/icons-react';
import type { NavigationNode as NavigationNodeType } from '../../core/types/navigation.types';
import type { DropPosition } from '../../services/navigation/DragDropManager';

/**
 * Props for drag handle functionality
 */
export interface DragHandleProps {
  onDragStart: (nodeId: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  draggedNodeId: string | null;
}

/**
 * Props for drop indicator functionality
 */
export interface DropIndicatorProps {
  dropTargetId: string | null;
  dropPosition: DropPosition | null;
  onDragOver: (nodeId: string, position: DropPosition) => void;
  onDrop: () => void;
}

/**
 * Props for TreeNode component
 */
export interface TreeNodeProps {
  node: NavigationNodeType;
  depth: number;
  maxDepth: number;
  onEdit: (node: NavigationNodeType) => void;
  onDelete: (nodeId: string) => void;
  onAddChild: (parentId: string) => void;
  dragHandleProps: DragHandleProps;
  dropIndicatorProps: DropIndicatorProps;
  isDarkMode?: boolean;
}

/**
 * Converts tabler icon name to component
 */
function getTablerIcon(iconName: string): React.ComponentType<TablerIcons.IconProps> | null {
  if (!iconName) return null;

  // Handle "tabler:icon-name" format
  const name = iconName.startsWith('tabler:') ? iconName.replace('tabler:', '') : iconName;

  // Convert kebab-case to PascalCase and add Icon prefix
  const pascal = name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');

  const componentName = `Icon${pascal}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const icons = TablerIcons as any;
  return icons[componentName] || null;
}

/**
 * TreeNode Component
 */
export function TreeNode({
  node,
  depth,
  maxDepth,
  onEdit,
  onDelete,
  onAddChild,
  dragHandleProps,
  dropIndicatorProps,
  isDarkMode = false,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const nodeRef = useRef<HTMLDivElement>(null);

  const hasChildren = node.children && node.children.length > 0;
  const canAddChild = depth < maxDepth;
  const isBeingDragged = dragHandleProps.draggedNodeId === node.id;
  const isDropTarget = dropIndicatorProps.dropTargetId === node.id;

  // Get icon component if specified
  const IconComponent = node.icon ? getTablerIcon(node.icon) : null;

  // Handle drag start
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node.id);
    dragHandleProps.onDragStart(node.id);
  };

  // Handle drag end
  const handleDragEnd = () => {
    dragHandleProps.onDragEnd();
  };

  // Handle drag over to determine drop position
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isBeingDragged) return;

    const rect = nodeRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top;
    const height = rect.height;

    let position: DropPosition;
    if (y < height * 0.25) {
      position = 'before';
    } else if (y > height * 0.75) {
      position = 'after';
    } else {
      position = 'child';
    }

    dropIndicatorProps.onDragOver(node.id, position);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropIndicatorProps.onDrop();
  };

  // Toggle expand/collapse
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Base styles
  const baseClasses = `
    relative flex items-center gap-2 p-2 rounded-lg border transition-all
    ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
    ${isBeingDragged ? 'opacity-50' : 'opacity-100'}
    ${isDropTarget && dropIndicatorProps.dropPosition === 'child' ? (isDarkMode ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-400') : ''}
  `;

  // Indentation based on depth
  const indentStyle = { marginLeft: `${depth * 24}px` };

  return (
    <div className="relative">
      {/* Drop indicator - before */}
      {isDropTarget && dropIndicatorProps.dropPosition === 'before' && (
        <div
          className={`absolute left-0 right-0 h-0.5 -top-1 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-400'}`}
          style={indentStyle}
        />
      )}

      {/* Main node container */}
      <div
        ref={nodeRef}
        className={baseClasses}
        style={indentStyle}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={() => {}}
      >
        {/* Drag handle */}
        <div
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className={`cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}
        >
          <GripVertical size={16} />
        </div>

        {/* Expand/collapse button for nodes with children */}
        {hasChildren ? (
          <button
            type="button"
            onClick={toggleExpand}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <div className="w-6" /> // Spacer for alignment
        )}

        {/* Node icon */}
        {IconComponent ? (
          <IconComponent size={16} stroke={1.8} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
        ) : (
          <LinkIcon size={16} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
        )}

        {/* Node content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-sm truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              {node.text}
            </span>
            {node.target === '_blank' && (
              <ExternalLink size={12} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
            )}
          </div>
          <div className={`text-xs truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{node.href}</div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Add child button (only if depth allows) */}
          {canAddChild && (
            <button
              type="button"
              onClick={() => onAddChild(node.id)}
              title="Add child link"
              className={`p-1.5 rounded transition-colors ${
                isDarkMode
                  ? 'text-gray-400 hover:text-green-400 hover:bg-green-500/20'
                  : 'text-gray-500 hover:text-green-600 hover:bg-green-100'
              }`}
            >
              <Plus size={14} />
            </button>
          )}

          {/* Edit button */}
          <button
            type="button"
            onClick={() => onEdit(node)}
            title="Edit link"
            className={`p-1.5 rounded transition-colors ${
              isDarkMode
                ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/20'
                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-100'
            }`}
          >
            <Edit2 size={14} />
          </button>

          {/* Delete button */}
          <button
            type="button"
            onClick={() => onDelete(node.id)}
            title="Delete link"
            className={`p-1.5 rounded transition-colors ${
              isDarkMode
                ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/20'
                : 'text-gray-500 hover:text-red-600 hover:bg-red-100'
            }`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Drop indicator - after */}
      {isDropTarget && dropIndicatorProps.dropPosition === 'after' && (
        <div
          className={`absolute left-0 right-0 h-0.5 -bottom-1 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-400'}`}
          style={indentStyle}
        />
      )}

      {/* Children nodes */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              maxDepth={maxDepth}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              dragHandleProps={dragHandleProps}
              dropIndicatorProps={dropIndicatorProps}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TreeNode;

/**
 * DragDropManager - Service for managing drag-and-drop operations on navigation trees
 * 
 * Handles:
 * - Drag state management (startDrag, updateDropTarget, completeDrop, cancelDrag)
 * - Drop validation (prevent self-drop, prevent dropping into descendants)
 * - Tree reordering with before/after/child positions
 * - Tree integrity maintenance
 */

import type {
  NavigationNode,
  DragState,
  TreeUpdateResult,
} from '../../core/types/navigation.types';
import { MAX_TREE_DEPTH } from './TreeValidator';

/**
 * Drop position types for drag-and-drop operations
 */
export type DropPosition = 'before' | 'after' | 'child';

/**
 * Drop target information
 */
export interface DropTarget {
  targetId: string;
  position: DropPosition;
}

/**
 * Initial drag state
 */
export const initialDragState: DragState = {
  isDragging: false,
  draggedNodeId: null,
  dropTargetId: null,
  dropPosition: null,
};

/**
 * Finds a node by ID in the tree.
 * 
 * @param tree - Navigation tree to search
 * @param nodeId - ID of the node to find
 * @returns The found node or null
 */
export function findNodeById(
  tree: NavigationNode[],
  nodeId: string
): NavigationNode | null {
  for (const node of tree) {
    if (node.id === nodeId) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, nodeId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Finds the parent of a node by ID.
 * 
 * @param tree - Navigation tree to search
 * @param nodeId - ID of the node to find parent for
 * @returns Object with parent node and index, or null if not found
 */
export function findParentNode(
  tree: NavigationNode[],
  nodeId: string
): { parent: NavigationNode | null; index: number; siblings: NavigationNode[] } | null {
  // Check root level
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === nodeId) {
      return { parent: null, index: i, siblings: tree };
    }
  }

  // Check nested levels
  for (const node of tree) {
    if (node.children && node.children.length > 0) {
      for (let i = 0; i < node.children.length; i++) {
        if (node.children[i].id === nodeId) {
          return { parent: node, index: i, siblings: node.children };
        }
      }
      // Recursively search deeper
      const found = findParentNode(node.children, nodeId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Gets the depth of a node in the tree.
 * 
 * @param tree - Navigation tree to search
 * @param nodeId - ID of the node
 * @returns Depth of the node (1 for root level), or -1 if not found
 */
export function getNodeDepth(
  tree: NavigationNode[],
  nodeId: string,
  currentDepth: number = 1
): number {
  for (const node of tree) {
    if (node.id === nodeId) {
      return currentDepth;
    }
    if (node.children && node.children.length > 0) {
      const depth = getNodeDepth(node.children, nodeId, currentDepth + 1);
      if (depth !== -1) {
        return depth;
      }
    }
  }
  return -1;
}

/**
 * Gets the maximum depth of a subtree starting from a node.
 * 
 * @param node - Root node of the subtree
 * @returns Maximum depth of the subtree
 */
export function getSubtreeDepth(node: NavigationNode): number {
  if (!node.children || node.children.length === 0) {
    return 1;
  }
  let maxChildDepth = 0;
  for (const child of node.children) {
    const childDepth = getSubtreeDepth(child);
    maxChildDepth = Math.max(maxChildDepth, childDepth);
  }
  return 1 + maxChildDepth;
}

/**
 * Checks if a node is a descendant of another node.
 * 
 * @param tree - Navigation tree to search
 * @param ancestorId - ID of the potential ancestor
 * @param descendantId - ID of the potential descendant
 * @returns true if descendantId is a descendant of ancestorId
 */
export function isDescendant(
  tree: NavigationNode[],
  ancestorId: string,
  descendantId: string
): boolean {
  const ancestor = findNodeById(tree, ancestorId);
  if (!ancestor || !ancestor.children) {
    return false;
  }

  function checkDescendants(nodes: NavigationNode[]): boolean {
    for (const node of nodes) {
      if (node.id === descendantId) {
        return true;
      }
      if (node.children && node.children.length > 0) {
        if (checkDescendants(node.children)) {
          return true;
        }
      }
    }
    return false;
  }

  return checkDescendants(ancestor.children);
}

/**
 * Validates if a drop operation is allowed.
 * 
 * @param tree - Current navigation tree
 * @param sourceId - ID of the node being dragged
 * @param targetId - ID of the drop target
 * @param position - Drop position (before, after, child)
 * @param maxDepth - Maximum allowed tree depth
 * @returns true if the drop is valid, false otherwise
 */
export function isValidDrop(
  tree: NavigationNode[],
  sourceId: string,
  targetId: string,
  position: DropPosition,
  maxDepth: number = MAX_TREE_DEPTH
): boolean {
  // Prevent self-drop
  if (sourceId === targetId) {
    return false;
  }

  // Prevent dropping into own descendants
  if (isDescendant(tree, sourceId, targetId)) {
    return false;
  }

  // Check depth constraints for 'child' position
  if (position === 'child') {
    const sourceNode = findNodeById(tree, sourceId);
    if (!sourceNode) {
      return false;
    }

    // Get the depth of the target node
    const targetDepth = getNodeDepth(tree, targetId);
    if (targetDepth === -1) {
      return false;
    }

    // Calculate the depth of the source subtree
    const sourceSubtreeDepth = getSubtreeDepth(sourceNode);

    // New depth would be: targetDepth + sourceSubtreeDepth
    // This must not exceed maxDepth
    if (targetDepth + sourceSubtreeDepth > maxDepth) {
      return false;
    }
  }

  // For 'before' and 'after', check if moving would exceed depth
  if (position === 'before' || position === 'after') {
    const sourceNode = findNodeById(tree, sourceId);
    const targetParentInfo = findParentNode(tree, targetId);
    
    if (!sourceNode) {
      return false;
    }

    // Get the depth where the node will be placed
    let newParentDepth: number;
    if (targetParentInfo?.parent) {
      newParentDepth = getNodeDepth(tree, targetParentInfo.parent.id);
    } else {
      newParentDepth = 0; // Root level
    }

    const sourceSubtreeDepth = getSubtreeDepth(sourceNode);
    
    // New depth would be: newParentDepth + 1 (for the node itself) + (sourceSubtreeDepth - 1) for children
    if (newParentDepth + sourceSubtreeDepth > maxDepth) {
      return false;
    }
  }

  return true;
}

/**
 * Deep clones a navigation tree.
 * 
 * @param tree - Tree to clone
 * @returns Deep cloned tree
 */
export function cloneTree(tree: NavigationNode[]): NavigationNode[] {
  return JSON.parse(JSON.stringify(tree));
}

/**
 * Removes a node from the tree by ID.
 * 
 * @param tree - Navigation tree (will be mutated)
 * @param nodeId - ID of the node to remove
 * @returns The removed node, or null if not found
 */
export function removeNode(
  tree: NavigationNode[],
  nodeId: string
): NavigationNode | null {
  // Check root level
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === nodeId) {
      return tree.splice(i, 1)[0];
    }
  }

  // Check nested levels
  for (const node of tree) {
    if (node.children && node.children.length > 0) {
      for (let i = 0; i < node.children.length; i++) {
        if (node.children[i].id === nodeId) {
          return node.children.splice(i, 1)[0];
        }
      }
      // Recursively search deeper
      const removed = removeNode(node.children, nodeId);
      if (removed) {
        return removed;
      }
    }
  }
  return null;
}

/**
 * Inserts a node at a specific position in the tree.
 * 
 * @param tree - Navigation tree (will be mutated)
 * @param node - Node to insert
 * @param targetId - ID of the target node
 * @param position - Position relative to target (before, after, child)
 * @returns true if insertion was successful
 */
export function insertNode(
  tree: NavigationNode[],
  node: NavigationNode,
  targetId: string,
  position: DropPosition
): boolean {
  if (position === 'child') {
    // Insert as child of target
    const target = findNodeById(tree, targetId);
    if (!target) {
      return false;
    }
    if (!target.children) {
      target.children = [];
    }
    target.children.push(node);
    return true;
  }

  // For 'before' and 'after', find the target's parent and insert
  const parentInfo = findParentNode(tree, targetId);
  if (!parentInfo) {
    return false;
  }

  const insertIndex = position === 'before' ? parentInfo.index : parentInfo.index + 1;
  parentInfo.siblings.splice(insertIndex, 0, node);
  return true;
}

/**
 * Moves a node to a new position in the tree.
 * 
 * @param tree - Navigation tree (will be cloned, not mutated)
 * @param sourceId - ID of the node to move
 * @param targetId - ID of the target node
 * @param position - Position relative to target (before, after, child)
 * @returns TreeUpdateResult with the new tree and operation details
 */
export function moveNode(
  tree: NavigationNode[],
  sourceId: string,
  targetId: string,
  position: DropPosition
): TreeUpdateResult {
  // Clone the tree to avoid mutation
  const newTree = cloneTree(tree);

  // Remove the source node
  const sourceNode = removeNode(newTree, sourceId);
  if (!sourceNode) {
    return {
      success: false,
      tree: tree,
      movedNodeId: sourceId,
      newParentId: null,
      newIndex: -1,
    };
  }

  // Insert at new position
  const inserted = insertNode(newTree, sourceNode, targetId, position);
  if (!inserted) {
    // Restore original tree on failure
    return {
      success: false,
      tree: tree,
      movedNodeId: sourceId,
      newParentId: null,
      newIndex: -1,
    };
  }

  // Determine new parent and index
  let newParentId: string | null = null;
  let newIndex = -1;

  if (position === 'child') {
    newParentId = targetId;
    const parent = findNodeById(newTree, targetId);
    if (parent && parent.children) {
      newIndex = parent.children.length - 1;
    }
  } else {
    const parentInfo = findParentNode(newTree, sourceId);
    if (parentInfo) {
      newParentId = parentInfo.parent?.id ?? null;
      newIndex = parentInfo.index;
    }
  }

  return {
    success: true,
    tree: newTree,
    movedNodeId: sourceId,
    newParentId,
    newIndex,
  };
}


/**
 * DragDropManager class providing a stateful interface for drag-drop operations.
 * Manages drag state and provides methods for drag-drop workflow.
 */
export class DragDropManager {
  private tree: NavigationNode[];
  private originalTree: NavigationNode[];
  private dragState: DragState;
  private maxDepth: number;

  constructor(tree: NavigationNode[] = [], maxDepth: number = MAX_TREE_DEPTH) {
    this.tree = cloneTree(tree);
    this.originalTree = cloneTree(tree);
    this.dragState = { ...initialDragState };
    this.maxDepth = maxDepth;
  }

  /**
   * Gets the current drag state.
   */
  getDragState(): DragState {
    return { ...this.dragState };
  }

  /**
   * Gets the current tree.
   */
  getTree(): NavigationNode[] {
    return cloneTree(this.tree);
  }

  /**
   * Sets a new tree (e.g., after external updates).
   */
  setTree(tree: NavigationNode[]): void {
    this.tree = cloneTree(tree);
    if (!this.dragState.isDragging) {
      this.originalTree = cloneTree(tree);
    }
  }

  /**
   * Starts a drag operation.
   * 
   * @param nodeId - ID of the node being dragged
   */
  startDrag(nodeId: string): void {
    // Verify node exists
    const node = findNodeById(this.tree, nodeId);
    if (!node) {
      return;
    }

    // Store original tree state for potential cancel
    this.originalTree = cloneTree(this.tree);

    this.dragState = {
      isDragging: true,
      draggedNodeId: nodeId,
      dropTargetId: null,
      dropPosition: null,
    };
  }

  /**
   * Updates the current drop target.
   * 
   * @param targetId - ID of the target node
   * @param position - Drop position (before, after, child)
   */
  updateDropTarget(targetId: string, position: DropPosition): void {
    if (!this.dragState.isDragging || !this.dragState.draggedNodeId) {
      return;
    }

    // Validate the drop
    if (!this.isValidDrop(this.dragState.draggedNodeId, targetId, position)) {
      // Clear drop target if invalid
      this.dragState = {
        ...this.dragState,
        dropTargetId: null,
        dropPosition: null,
      };
      return;
    }

    this.dragState = {
      ...this.dragState,
      dropTargetId: targetId,
      dropPosition: position,
    };
  }

  /**
   * Completes the drag operation, moving the node to the new position.
   * 
   * @returns TreeUpdateResult with the operation result
   */
  completeDrop(): TreeUpdateResult {
    if (
      !this.dragState.isDragging ||
      !this.dragState.draggedNodeId ||
      !this.dragState.dropTargetId ||
      !this.dragState.dropPosition
    ) {
      // No valid drop target, cancel the drag
      this.cancelDrag();
      return {
        success: false,
        tree: this.tree,
        movedNodeId: this.dragState.draggedNodeId || '',
        newParentId: null,
        newIndex: -1,
      };
    }

    // Perform the move
    const result = moveNode(
      this.tree,
      this.dragState.draggedNodeId,
      this.dragState.dropTargetId,
      this.dragState.dropPosition
    );

    if (result.success) {
      this.tree = result.tree;
      this.originalTree = cloneTree(result.tree);
    }

    // Reset drag state
    this.dragState = { ...initialDragState };

    return result;
  }

  /**
   * Cancels the current drag operation, restoring the original tree state.
   */
  cancelDrag(): void {
    // Restore original tree
    this.tree = cloneTree(this.originalTree);
    
    // Reset drag state
    this.dragState = { ...initialDragState };
  }

  /**
   * Checks if a drop operation is valid.
   * 
   * @param sourceId - ID of the node being dragged
   * @param targetId - ID of the drop target
   * @param position - Drop position (optional, defaults to current drag state position)
   * @returns true if the drop is valid
   */
  isValidDrop(
    sourceId: string,
    targetId: string,
    position?: DropPosition
  ): boolean {
    const dropPosition = position || this.dragState.dropPosition || 'after';
    return isValidDrop(this.tree, sourceId, targetId, dropPosition, this.maxDepth);
  }

  /**
   * Checks if currently dragging.
   */
  isDragging(): boolean {
    return this.dragState.isDragging;
  }

  /**
   * Gets the ID of the currently dragged node.
   */
  getDraggedNodeId(): string | null {
    return this.dragState.draggedNodeId;
  }

  /**
   * Gets the current drop target.
   */
  getDropTarget(): DropTarget | null {
    if (!this.dragState.dropTargetId || !this.dragState.dropPosition) {
      return null;
    }
    return {
      targetId: this.dragState.dropTargetId,
      position: this.dragState.dropPosition,
    };
  }

  /**
   * Sets the maximum allowed tree depth.
   */
  setMaxDepth(maxDepth: number): void {
    this.maxDepth = maxDepth;
  }

  /**
   * Gets the current maximum depth setting.
   */
  getMaxDepth(): number {
    return this.maxDepth;
  }
}

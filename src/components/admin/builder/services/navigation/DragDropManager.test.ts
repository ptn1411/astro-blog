/**
 * DragDropManager tests
 * Tests for drag-drop operations on navigation trees
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DragDropManager,
  findNodeById,
  findParentNode,
  getNodeDepth,
  getSubtreeDepth,
  isDescendant,
  isValidDrop,
  cloneTree,
  removeNode,
  insertNode,
  moveNode,
  initialDragState,
} from './DragDropManager';
import type { NavigationNode } from '../../core/types/navigation.types';

// Test fixtures
const createTestTree = (): NavigationNode[] => [
  {
    id: 'home',
    text: 'Home',
    href: '/',
  },
  {
    id: 'services',
    text: 'Services',
    href: '/services',
    children: [
      { id: 'pricing', text: 'Pricing', href: '/pricing' },
      { id: 'projects', text: 'Projects', href: '/projects' },
    ],
  },
  {
    id: 'about',
    text: 'About',
    href: '/about',
  },
];

describe('DragDropManager utility functions', () => {
  describe('findNodeById', () => {
    it('should find root level node', () => {
      const tree = createTestTree();
      const node = findNodeById(tree, 'home');
      expect(node).not.toBeNull();
      expect(node?.text).toBe('Home');
    });

    it('should find nested node', () => {
      const tree = createTestTree();
      const node = findNodeById(tree, 'pricing');
      expect(node).not.toBeNull();
      expect(node?.text).toBe('Pricing');
    });

    it('should return null for non-existent node', () => {
      const tree = createTestTree();
      const node = findNodeById(tree, 'nonexistent');
      expect(node).toBeNull();
    });
  });

  describe('findParentNode', () => {
    it('should return null parent for root level node', () => {
      const tree = createTestTree();
      const result = findParentNode(tree, 'home');
      expect(result).not.toBeNull();
      expect(result?.parent).toBeNull();
      expect(result?.index).toBe(0);
    });

    it('should find parent of nested node', () => {
      const tree = createTestTree();
      const result = findParentNode(tree, 'pricing');
      expect(result).not.toBeNull();
      expect(result?.parent?.id).toBe('services');
      expect(result?.index).toBe(0);
    });

    it('should return null for non-existent node', () => {
      const tree = createTestTree();
      const result = findParentNode(tree, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getNodeDepth', () => {
    it('should return 1 for root level node', () => {
      const tree = createTestTree();
      expect(getNodeDepth(tree, 'home')).toBe(1);
    });

    it('should return 2 for nested node', () => {
      const tree = createTestTree();
      expect(getNodeDepth(tree, 'pricing')).toBe(2);
    });

    it('should return -1 for non-existent node', () => {
      const tree = createTestTree();
      expect(getNodeDepth(tree, 'nonexistent')).toBe(-1);
    });
  });

  describe('getSubtreeDepth', () => {
    it('should return 1 for leaf node', () => {
      const node: NavigationNode = { id: '1', text: 'Test', href: '/' };
      expect(getSubtreeDepth(node)).toBe(1);
    });

    it('should return 2 for node with children', () => {
      const node: NavigationNode = {
        id: '1',
        text: 'Test',
        href: '/',
        children: [{ id: '2', text: 'Child', href: '/child' }],
      };
      expect(getSubtreeDepth(node)).toBe(2);
    });
  });

  describe('isDescendant', () => {
    it('should return true for direct child', () => {
      const tree = createTestTree();
      expect(isDescendant(tree, 'services', 'pricing')).toBe(true);
    });

    it('should return false for non-descendant', () => {
      const tree = createTestTree();
      expect(isDescendant(tree, 'home', 'pricing')).toBe(false);
    });

    it('should return false for self', () => {
      const tree = createTestTree();
      expect(isDescendant(tree, 'services', 'services')).toBe(false);
    });
  });

  describe('isValidDrop', () => {
    it('should prevent self-drop', () => {
      const tree = createTestTree();
      expect(isValidDrop(tree, 'home', 'home', 'after')).toBe(false);
    });

    it('should prevent dropping into own descendants', () => {
      const tree = createTestTree();
      expect(isValidDrop(tree, 'services', 'pricing', 'child')).toBe(false);
    });

    it('should allow valid drop', () => {
      const tree = createTestTree();
      expect(isValidDrop(tree, 'home', 'about', 'before')).toBe(true);
    });

    it('should prevent exceeding max depth', () => {
      const tree = createTestTree();
      // pricing is at depth 2, adding it as child of another depth-2 node would exceed max
      expect(isValidDrop(tree, 'home', 'pricing', 'child', 2)).toBe(false);
    });

    it('should allow moving node as sibling at same level', () => {
      const tree = createTestTree();
      // Moving pricing before projects (both at depth 2) should be valid
      expect(isValidDrop(tree, 'pricing', 'projects', 'before')).toBe(true);
      expect(isValidDrop(tree, 'pricing', 'projects', 'after')).toBe(true);
    });

    it('should allow moving nested node to root level', () => {
      const tree = createTestTree();
      // Moving pricing to root level (before home) should be valid
      expect(isValidDrop(tree, 'pricing', 'home', 'before')).toBe(true);
    });

    it('should prevent dropping parent into its own child as sibling', () => {
      const tree = createTestTree();
      // services is parent of pricing, cannot drop services before/after pricing
      expect(isValidDrop(tree, 'services', 'pricing', 'before')).toBe(false);
      expect(isValidDrop(tree, 'services', 'pricing', 'after')).toBe(false);
    });
  });

  describe('cloneTree', () => {
    it('should create a deep copy', () => {
      const tree = createTestTree();
      const cloned = cloneTree(tree);
      
      // Modify original
      tree[0].text = 'Modified';
      
      // Clone should be unchanged
      expect(cloned[0].text).toBe('Home');
    });
  });

  describe('removeNode', () => {
    it('should remove root level node', () => {
      const tree = createTestTree();
      const removed = removeNode(tree, 'home');
      
      expect(removed).not.toBeNull();
      expect(removed?.id).toBe('home');
      expect(tree.length).toBe(2);
    });

    it('should remove nested node', () => {
      const tree = createTestTree();
      const removed = removeNode(tree, 'pricing');
      
      expect(removed).not.toBeNull();
      expect(removed?.id).toBe('pricing');
      expect(tree[1].children?.length).toBe(1);
    });
  });

  describe('insertNode', () => {
    it('should insert before target', () => {
      const tree = createTestTree();
      const newNode: NavigationNode = { id: 'new', text: 'New', href: '/new' };
      
      insertNode(tree, newNode, 'about', 'before');
      
      expect(tree[2].id).toBe('new');
      expect(tree[3].id).toBe('about');
    });

    it('should insert after target', () => {
      const tree = createTestTree();
      const newNode: NavigationNode = { id: 'new', text: 'New', href: '/new' };
      
      insertNode(tree, newNode, 'home', 'after');
      
      expect(tree[1].id).toBe('new');
    });

    it('should insert as child', () => {
      const tree = createTestTree();
      const newNode: NavigationNode = { id: 'new', text: 'New', href: '/new' };
      
      insertNode(tree, newNode, 'about', 'child');
      
      expect(tree[2].children?.length).toBe(1);
      expect(tree[2].children?.[0].id).toBe('new');
    });
  });

  describe('moveNode', () => {
    it('should move node to new position', () => {
      const tree = createTestTree();
      const result = moveNode(tree, 'home', 'about', 'after');
      
      expect(result.success).toBe(true);
      expect(result.tree[0].id).toBe('services');
      expect(result.tree[2].id).toBe('home');
    });

    it('should not mutate original tree', () => {
      const tree = createTestTree();
      moveNode(tree, 'home', 'about', 'after');
      
      expect(tree[0].id).toBe('home');
    });

    it('should move node before target', () => {
      const tree = createTestTree();
      const result = moveNode(tree, 'about', 'home', 'before');
      
      expect(result.success).toBe(true);
      expect(result.tree[0].id).toBe('about');
      expect(result.tree[1].id).toBe('home');
    });

    it('should move node as child of target', () => {
      const tree = createTestTree();
      const result = moveNode(tree, 'home', 'about', 'child');
      
      expect(result.success).toBe(true);
      expect(result.tree.length).toBe(2); // home moved to about's children
      expect(result.tree[1].children?.length).toBe(1);
      expect(result.tree[1].children?.[0].id).toBe('home');
    });

    it('should move nested node to root level', () => {
      const tree = createTestTree();
      const result = moveNode(tree, 'pricing', 'home', 'after');
      
      expect(result.success).toBe(true);
      expect(result.tree[1].id).toBe('pricing');
      expect(result.tree[2].children?.length).toBe(1); // services now has only projects
    });

    it('should move root node to nested level', () => {
      const tree = createTestTree();
      const result = moveNode(tree, 'home', 'services', 'child');
      
      expect(result.success).toBe(true);
      expect(result.tree.length).toBe(2);
      expect(result.tree[0].children?.length).toBe(3); // services now has pricing, projects, home
    });

    it('should preserve node children when moving', () => {
      const tree = createTestTree();
      const result = moveNode(tree, 'services', 'about', 'after');
      
      expect(result.success).toBe(true);
      expect(result.tree[2].id).toBe('services');
      expect(result.tree[2].children?.length).toBe(2);
      expect(result.tree[2].children?.[0].id).toBe('pricing');
    });

    it('should return correct newParentId and newIndex', () => {
      const tree = createTestTree();
      const result = moveNode(tree, 'home', 'services', 'child');
      
      expect(result.success).toBe(true);
      expect(result.newParentId).toBe('services');
      expect(result.movedNodeId).toBe('home');
    });

    it('should fail for non-existent source node', () => {
      const tree = createTestTree();
      const result = moveNode(tree, 'nonexistent', 'home', 'after');
      
      expect(result.success).toBe(false);
    });
  });
});

describe('DragDropManager class', () => {
  let manager: DragDropManager;

  beforeEach(() => {
    manager = new DragDropManager(createTestTree());
  });

  describe('initialization', () => {
    it('should initialize with correct state', () => {
      expect(manager.isDragging()).toBe(false);
      expect(manager.getDraggedNodeId()).toBeNull();
      expect(manager.getDropTarget()).toBeNull();
    });

    it('should store tree copy', () => {
      const tree = manager.getTree();
      expect(tree.length).toBe(3);
      expect(tree[0].id).toBe('home');
    });
  });

  describe('startDrag', () => {
    it('should start drag operation', () => {
      manager.startDrag('home');
      
      expect(manager.isDragging()).toBe(true);
      expect(manager.getDraggedNodeId()).toBe('home');
    });

    it('should not start drag for non-existent node', () => {
      manager.startDrag('nonexistent');
      
      expect(manager.isDragging()).toBe(false);
    });
  });

  describe('updateDropTarget', () => {
    it('should update drop target when valid', () => {
      manager.startDrag('home');
      manager.updateDropTarget('about', 'before');
      
      const target = manager.getDropTarget();
      expect(target?.targetId).toBe('about');
      expect(target?.position).toBe('before');
    });

    it('should clear drop target when invalid', () => {
      manager.startDrag('services');
      manager.updateDropTarget('pricing', 'child'); // Invalid: dropping into own child
      
      expect(manager.getDropTarget()).toBeNull();
    });

    it('should not update when not dragging', () => {
      manager.updateDropTarget('about', 'before');
      
      expect(manager.getDropTarget()).toBeNull();
    });
  });

  describe('completeDrop', () => {
    it('should complete valid drop', () => {
      manager.startDrag('home');
      manager.updateDropTarget('about', 'after');
      const result = manager.completeDrop();
      
      expect(result.success).toBe(true);
      expect(manager.isDragging()).toBe(false);
      
      const tree = manager.getTree();
      expect(tree[0].id).toBe('services');
      expect(tree[2].id).toBe('home');
    });

    it('should fail without valid drop target', () => {
      manager.startDrag('home');
      const result = manager.completeDrop();
      
      expect(result.success).toBe(false);
    });
  });

  describe('cancelDrag', () => {
    it('should restore original tree', () => {
      manager.startDrag('home');
      manager.updateDropTarget('about', 'after');
      manager.cancelDrag();
      
      expect(manager.isDragging()).toBe(false);
      
      const tree = manager.getTree();
      expect(tree[0].id).toBe('home');
    });
  });

  describe('isValidDrop', () => {
    it('should validate drop operations', () => {
      expect(manager.isValidDrop('home', 'about', 'before')).toBe(true);
      expect(manager.isValidDrop('home', 'home', 'after')).toBe(false);
    });
  });
});

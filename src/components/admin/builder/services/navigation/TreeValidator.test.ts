/**
 * TreeValidator Unit Tests
 * 
 * Tests for the TreeValidator service functions.
 */

import { describe, it, expect } from 'vitest';
import { 
  validateNode, 
  validateTree, 
  getMaxDepth, 
  canAddChild,
  validateHeaderLink,
  TreeValidator,
  MAX_TREE_DEPTH 
} from './TreeValidator';
import type { NavigationNode, HeaderLink } from '../../core/types/navigation.types';

describe('TreeValidator', () => {
  describe('validateNode', () => {
    it('validates a valid node', () => {
      const node = { text: 'Home', href: '/' };
      const result = validateNode(node);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails validation for empty text', () => {
      const node = { text: '', href: '/' };
      const result = validateNode(node);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'text',
        message: 'Link text is required',
      });
    });

    it('fails validation for missing text', () => {
      const node = { href: '/' };
      const result = validateNode(node);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'text')).toBe(true);
    });

    it('fails validation for empty href', () => {
      const node = { text: 'Home', href: '' };
      const result = validateNode(node);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'href',
        message: 'Link URL is required',
      });
    });

    it('fails validation for missing href', () => {
      const node = { text: 'Home' };
      const result = validateNode(node);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'href')).toBe(true);
    });

    it('fails validation for whitespace-only text', () => {
      const node = { text: '   ', href: '/' };
      const result = validateNode(node);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'text')).toBe(true);
    });

    it('validates target field when present', () => {
      const validNode = { text: 'Link', href: '/', target: '_blank' as const };
      expect(validateNode(validNode).valid).toBe(true);

      const invalidNode = { text: 'Link', href: '/', target: 'invalid' as any };
      const result = validateNode(invalidNode);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'target')).toBe(true);
    });
  });

  describe('getMaxDepth', () => {
    it('returns 0 for empty tree', () => {
      expect(getMaxDepth([])).toBe(0);
    });

    it('returns 1 for flat tree', () => {
      const tree: NavigationNode[] = [
        { id: '1', text: 'Home', href: '/' },
        { id: '2', text: 'About', href: '/about' },
      ];
      expect(getMaxDepth(tree)).toBe(1);
    });

    it('returns 2 for tree with one level of children', () => {
      const tree: NavigationNode[] = [
        { 
          id: '1', 
          text: 'Services', 
          href: '/services',
          children: [
            { id: '1.1', text: 'Pricing', href: '/pricing' },
          ],
        },
      ];
      expect(getMaxDepth(tree)).toBe(2);
    });

    it('returns 3 for tree with two levels of children', () => {
      const tree: NavigationNode[] = [
        { 
          id: '1', 
          text: 'Services', 
          href: '/services',
          children: [
            { 
              id: '1.1', 
              text: 'Pricing', 
              href: '/pricing',
              children: [
                { id: '1.1.1', text: 'Basic', href: '/pricing/basic' },
              ],
            },
          ],
        },
      ];
      expect(getMaxDepth(tree)).toBe(3);
    });
  });

  describe('validateTree', () => {
    it('validates a valid tree', () => {
      const tree: NavigationNode[] = [
        { id: '1', text: 'Home', href: '/' },
        { id: '2', text: 'About', href: '/about' },
      ];
      const result = validateTree(tree);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails validation for tree exceeding max depth', () => {
      const tree: NavigationNode[] = [
        { 
          id: '1', 
          text: 'Level 1', 
          href: '/l1',
          children: [
            { 
              id: '1.1', 
              text: 'Level 2', 
              href: '/l2',
              children: [
                { id: '1.1.1', text: 'Level 3', href: '/l3' },
              ],
            },
          ],
        },
      ];
      const result = validateTree(tree, 2);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tree')).toBe(true);
    });

    it('fails validation for node with missing id', () => {
      const tree: NavigationNode[] = [
        { id: '', text: 'Home', href: '/' },
      ];
      const result = validateTree(tree);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message === 'Node ID is required')).toBe(true);
    });

    it('validates nested nodes', () => {
      const tree: NavigationNode[] = [
        { 
          id: '1', 
          text: 'Menu', 
          href: '#',
          children: [
            { id: '1.1', text: '', href: '/sub' }, // Invalid: empty text
          ],
        },
      ];
      const result = validateTree(tree);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field.includes('children') && e.field.includes('text'))).toBe(true);
    });
  });

  describe('canAddChild', () => {
    it('allows adding child to root node when depth allows', () => {
      const tree: NavigationNode[] = [
        { id: '1', text: 'Home', href: '/' },
      ];
      expect(canAddChild(tree, '1', 2)).toBe(true);
    });

    it('prevents adding child when max depth would be exceeded', () => {
      const tree: NavigationNode[] = [
        { 
          id: '1', 
          text: 'Menu', 
          href: '#',
          children: [
            { id: '1.1', text: 'Sub', href: '/sub' },
          ],
        },
      ];
      // Node 1.1 is at depth 2, adding child would make depth 3
      expect(canAddChild(tree, '1.1', 2)).toBe(false);
    });

    it('allows adding child when parent not found (root-level add)', () => {
      const tree: NavigationNode[] = [
        { id: '1', text: 'Home', href: '/' },
      ];
      expect(canAddChild(tree, 'nonexistent', 2)).toBe(true);
    });
  });

  describe('validateHeaderLink', () => {
    it('validates a valid header link', () => {
      const link: Partial<HeaderLink> = { text: 'Home', href: '/' };
      const result = validateHeaderLink(link);
      expect(result.valid).toBe(true);
    });

    it('allows header link without href if it has nested links', () => {
      const link: Partial<HeaderLink> = { 
        text: 'Menu', 
        links: [{ text: 'Sub', href: '/sub' }] 
      };
      const result = validateHeaderLink(link);
      expect(result.valid).toBe(true);
    });

    it('fails validation for header link without href and no nested links', () => {
      const link: Partial<HeaderLink> = { text: 'Menu' };
      const result = validateHeaderLink(link);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'href')).toBe(true);
    });
  });

  describe('TreeValidator class', () => {
    it('creates instance with default max depth', () => {
      const validator = new TreeValidator();
      expect(validator.getMaxDepthSetting()).toBe(MAX_TREE_DEPTH);
    });

    it('creates instance with custom max depth', () => {
      const validator = new TreeValidator(3);
      expect(validator.getMaxDepthSetting()).toBe(3);
    });

    it('validates node using instance method', () => {
      const validator = new TreeValidator();
      const result = validator.validateNode({ text: 'Home', href: '/' });
      expect(result.valid).toBe(true);
    });

    it('validates tree using instance method', () => {
      const validator = new TreeValidator();
      const tree: NavigationNode[] = [
        { id: '1', text: 'Home', href: '/' },
      ];
      const result = validator.validateTree(tree);
      expect(result.valid).toBe(true);
    });

    it('allows updating max depth', () => {
      const validator = new TreeValidator(2);
      validator.setMaxDepth(3);
      expect(validator.getMaxDepthSetting()).toBe(3);
    });
  });
});

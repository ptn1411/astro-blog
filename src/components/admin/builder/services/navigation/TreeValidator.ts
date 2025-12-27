/**
 * TreeValidator - Service for validating navigation tree structures
 * 
 * Validates NavigationNode objects and tree structures against:
 * - Required fields (text, href)
 * - Tree depth constraints (max 2 levels)
 * - Schema validation
 */

import type { 
  NavigationNode, 
  ValidationResult, 
  ValidationError,
  HeaderLink 
} from '../../core/types/navigation.types';

/** Maximum allowed depth for navigation trees (root + 1 level of children) */
export const MAX_TREE_DEPTH = 2;

/**
 * Validates a single NavigationNode for required fields.
 * 
 * @param node - Partial NavigationNode to validate
 * @returns ValidationResult with any errors found
 * 
 * @example
 * validateNode({ text: 'Home', href: '/' }) // { valid: true, errors: [] }
 * validateNode({ text: '', href: '/' }) // { valid: false, errors: [{ field: 'text', message: '...' }] }
 */
export function validateNode(node: Partial<NavigationNode>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate text field - required and non-empty
  if (!node.text || typeof node.text !== 'string' || node.text.trim() === '') {
    errors.push({
      field: 'text',
      message: 'Link text is required',
    });
  }

  // Validate href field - required and non-empty
  if (!node.href || typeof node.href !== 'string' || node.href.trim() === '') {
    errors.push({
      field: 'href',
      message: 'Link URL is required',
    });
  }

  // Validate target field if present
  if (node.target !== undefined && node.target !== '_blank' && node.target !== '_self') {
    errors.push({
      field: 'target',
      message: 'Target must be "_blank" or "_self"',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates the maximum depth of a navigation tree.
 * 
 * @param nodes - Array of NavigationNode at the current level
 * @param currentDepth - Current depth in the tree (default: 1)
 * @returns Maximum depth found in the tree
 * 
 * @example
 * getMaxDepth([{ id: '1', text: 'Home', href: '/' }]) // 1
 * getMaxDepth([{ id: '1', text: 'Menu', href: '#', children: [{ id: '2', text: 'Sub', href: '/sub' }] }]) // 2
 */
export function getMaxDepth(nodes: NavigationNode[], currentDepth: number = 1): number {
  if (!nodes || nodes.length === 0) {
    return currentDepth > 1 ? currentDepth - 1 : 0;
  }

  let maxDepth = currentDepth;

  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      const childDepth = getMaxDepth(node.children, currentDepth + 1);
      maxDepth = Math.max(maxDepth, childDepth);
    }
  }

  return maxDepth;
}

/**
 * Validates an entire navigation tree structure.
 * Checks all nodes for required fields and validates depth constraints.
 * 
 * @param tree - Array of NavigationNode representing the tree
 * @param maxDepth - Maximum allowed depth (default: MAX_TREE_DEPTH)
 * @returns ValidationResult with all errors found
 * 
 * @example
 * validateTree([{ id: '1', text: 'Home', href: '/' }]) // { valid: true, errors: [] }
 */
export function validateTree(
  tree: NavigationNode[], 
  maxDepth: number = MAX_TREE_DEPTH
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check tree depth constraint
  const actualDepth = getMaxDepth(tree);
  if (actualDepth > maxDepth) {
    errors.push({
      field: 'tree',
      message: `Cannot add more than ${maxDepth} levels of nesting. Current depth: ${actualDepth}`,
    });
  }

  // Validate each node recursively
  function validateNodeRecursive(
    nodes: NavigationNode[], 
    path: string = ''
  ): void {
    nodes.forEach((node, index) => {
      const nodePath = path ? `${path}.${index}` : `${index}`;
      
      // Validate the node itself
      const nodeResult = validateNode(node);
      if (!nodeResult.valid) {
        nodeResult.errors.forEach((error) => {
          errors.push({
            field: `${nodePath}.${error.field}`,
            message: error.message,
          });
        });
      }

      // Validate id field
      if (!node.id || typeof node.id !== 'string' || node.id.trim() === '') {
        errors.push({
          field: `${nodePath}.id`,
          message: 'Node ID is required',
        });
      }

      // Recursively validate children
      if (node.children && node.children.length > 0) {
        validateNodeRecursive(node.children, `${nodePath}.children`);
      }
    });
  }

  validateNodeRecursive(tree);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a HeaderLink structure (used in header navigation).
 * HeaderLink has slightly different structure than NavigationNode.
 * 
 * @param link - Partial HeaderLink to validate
 * @returns ValidationResult with any errors found
 */
export function validateHeaderLink(link: Partial<HeaderLink>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate text field - required and non-empty
  if (!link.text || typeof link.text !== 'string' || link.text.trim() === '') {
    errors.push({
      field: 'text',
      message: 'Link text is required',
    });
  }

  // href is optional for HeaderLink if it has nested links
  const hasNestedLinks = link.links && link.links.length > 0;
  if (!hasNestedLinks && (!link.href || typeof link.href !== 'string' || link.href.trim() === '')) {
    errors.push({
      field: 'href',
      message: 'Link URL is required (unless link has nested items)',
    });
  }

  // Validate target field if present
  if (link.target !== undefined && link.target !== '_blank' && link.target !== '_self') {
    errors.push({
      field: 'target',
      message: 'Target must be "_blank" or "_self"',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if adding a child to a node would exceed the max depth.
 * 
 * @param tree - Current tree structure
 * @param parentId - ID of the parent node to add child to
 * @param maxDepth - Maximum allowed depth (default: MAX_TREE_DEPTH)
 * @returns true if adding a child is allowed, false otherwise
 */
export function canAddChild(
  tree: NavigationNode[], 
  parentId: string, 
  maxDepth: number = MAX_TREE_DEPTH
): boolean {
  // Find the depth of the parent node
  function findNodeDepth(
    nodes: NavigationNode[], 
    targetId: string, 
    currentDepth: number = 1
  ): number | null {
    for (const node of nodes) {
      if (node.id === targetId) {
        return currentDepth;
      }
      if (node.children && node.children.length > 0) {
        const childResult = findNodeDepth(node.children, targetId, currentDepth + 1);
        if (childResult !== null) {
          return childResult;
        }
      }
    }
    return null;
  }

  const parentDepth = findNodeDepth(tree, parentId);
  
  // If parent not found, allow adding (it might be a root-level add)
  if (parentDepth === null) {
    return true;
  }

  // Adding a child would increase depth by 1
  return parentDepth + 1 <= maxDepth;
}

/**
 * TreeValidator class providing a stateful interface for validation operations.
 */
export class TreeValidator {
  private maxDepth: number;

  constructor(maxDepth: number = MAX_TREE_DEPTH) {
    this.maxDepth = maxDepth;
  }

  /**
   * Validates a single NavigationNode.
   */
  validateNode(node: Partial<NavigationNode>): ValidationResult {
    return validateNode(node);
  }

  /**
   * Validates an entire navigation tree.
   */
  validateTree(tree: NavigationNode[]): ValidationResult {
    return validateTree(tree, this.maxDepth);
  }

  /**
   * Gets the maximum depth of a tree.
   */
  getMaxDepth(tree: NavigationNode[]): number {
    return getMaxDepth(tree);
  }

  /**
   * Checks if adding a child to a node is allowed.
   */
  canAddChild(tree: NavigationNode[], parentId: string): boolean {
    return canAddChild(tree, parentId, this.maxDepth);
  }

  /**
   * Validates a HeaderLink.
   */
  validateHeaderLink(link: Partial<HeaderLink>): ValidationResult {
    return validateHeaderLink(link);
  }

  /**
   * Sets the maximum allowed depth.
   */
  setMaxDepth(maxDepth: number): void {
    this.maxDepth = maxDepth;
  }

  /**
   * Gets the current maximum depth setting.
   */
  getMaxDepthSetting(): number {
    return this.maxDepth;
  }
}

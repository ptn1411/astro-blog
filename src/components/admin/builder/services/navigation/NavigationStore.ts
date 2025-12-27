/**
 * NavigationStore - State management for Layout Selector & Navigation Editor
 * Implements reducer pattern with actions for header/footer data management
 * 
 * Requirements: 2.1, 3.1 - Header and Footer data management
 */

import type {
  NavigationState,
  NavigationAction,
  HeaderData,
  FooterData,
  LayoutConfig,
  NavigationNode,
  DragState,
  HeaderLink,
} from '../../core/types/navigation.types';

// --- Default Values ---

const defaultDragState: DragState = {
  isDragging: false,
  draggedNodeId: null,
  dropTargetId: null,
  dropPosition: null,
};

const defaultLayout: LayoutConfig = {
  type: 'full-width',
  headerVisible: true,
  footerVisible: true,
  sidebarPosition: 'none',
};

const defaultHeaderData: HeaderData = {
  links: [],
  actions: [],
};

const defaultFooterData: FooterData = {
  links: [],
  secondaryLinks: [],
  socialLinks: [],
  footNote: '',
};

/**
 * Creates the initial navigation state
 */
export function createInitialState(
  headerData?: Partial<HeaderData>,
  footerData?: Partial<FooterData>,
  layout?: Partial<LayoutConfig>
): NavigationState {
  return {
    headerData: { ...defaultHeaderData, ...headerData },
    footerData: { ...defaultFooterData, ...footerData },
    layout: { ...defaultLayout, ...layout },
    isDirty: false,
    lastSaved: null,
    dragState: { ...defaultDragState },
  };
}

// --- Tree Traversal Utilities ---

/**
 * Converts HeaderLink to NavigationNode for tree operations
 */
export function headerLinkToNode(link: HeaderLink, id?: string): NavigationNode {
  return {
    id: id || generateNodeId(),
    text: link.text,
    href: link.href || '#',
    target: link.target,
    icon: link.icon,
    children: link.links?.map((child, index) => 
      headerLinkToNode(child, `${id || 'node'}-${index}`)
    ),
  };
}

/**
 * Converts NavigationNode back to HeaderLink
 */
export function nodeToHeaderLink(node: NavigationNode): HeaderLink {
  const link: HeaderLink = {
    text: node.text,
    href: node.href,
  };
  
  if (node.target) link.target = node.target;
  if (node.icon) link.icon = node.icon;
  if (node.children && node.children.length > 0) {
    link.links = node.children.map(nodeToHeaderLink);
  }
  
  return link;
}

/**
 * Generates a unique node ID
 */
export function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * HeaderLink with optional id for internal tracking
 */
type HeaderLinkWithId = HeaderLink & { id?: string };

/**
 * Deep clones header links array
 */
function cloneHeaderLinks(links: HeaderLink[]): HeaderLink[] {
  return links.map(link => ({
    ...link,
    links: link.links ? cloneHeaderLinks(link.links) : undefined,
  }));
}

/**
 * Adds a node to header links at specified parent
 */
function addNodeToHeaderLinks(
  links: HeaderLink[],
  parentId: string | null,
  node: NavigationNode
): HeaderLink[] {
  const newLinks = cloneHeaderLinks(links);
  const newLink: HeaderLinkWithId = {
    id: node.id,
    text: node.text,
    href: node.href,
    target: node.target,
    icon: node.icon,
  };

  if (parentId === null) {
    // Add to root level
    newLinks.push(newLink);
  } else {
    // Find parent and add as child
    const addToParent = (items: HeaderLink[]): boolean => {
      for (const item of items) {
        if ((item as HeaderLinkWithId).id === parentId) {
          if (!item.links) item.links = [];
          item.links.push(newLink);
          return true;
        }
        if (item.links && addToParent(item.links)) {
          return true;
        }
      }
      return false;
    };
    addToParent(newLinks);
  }

  return newLinks;
}

/**
 * Updates a node in header links
 */
function updateNodeInHeaderLinks(
  links: HeaderLink[],
  nodeId: string,
  updates: Partial<NavigationNode>
): HeaderLink[] {
  return links.map(link => {
    if ((link as HeaderLinkWithId).id === nodeId) {
      return {
        ...link,
        ...(updates.text !== undefined && { text: updates.text }),
        ...(updates.href !== undefined && { href: updates.href }),
        ...(updates.target !== undefined && { target: updates.target }),
        ...(updates.icon !== undefined && { icon: updates.icon }),
      };
    }
    if (link.links) {
      return {
        ...link,
        links: updateNodeInHeaderLinks(link.links, nodeId, updates),
      };
    }
    return link;
  });
}

/**
 * Deletes a node from header links (including all children)
 */
function deleteNodeFromHeaderLinks(
  links: HeaderLink[],
  nodeId: string
): HeaderLink[] {
  return links
    .filter(link => (link as HeaderLinkWithId).id !== nodeId)
    .map(link => ({
      ...link,
      links: link.links ? deleteNodeFromHeaderLinks(link.links, nodeId) : undefined,
    }));
}


// --- Footer Operations ---

/**
 * Adds a link group to footer
 */
function addFooterLinkGroup(
  footerData: FooterData,
  title: string
): FooterData {
  return {
    ...footerData,
    links: [
      ...footerData.links,
      { title, links: [] },
    ],
  };
}

/**
 * Adds a link to a footer group
 */
function addLinkToFooterGroup(
  footerData: FooterData,
  groupIndex: number,
  link: { text: string; href: string }
): FooterData {
  const newLinks = [...footerData.links];
  if (groupIndex >= 0 && groupIndex < newLinks.length) {
    newLinks[groupIndex] = {
      ...newLinks[groupIndex],
      links: [...newLinks[groupIndex].links, link],
    };
  }
  return { ...footerData, links: newLinks };
}

// --- Navigation Reducer ---

/**
 * Main reducer for navigation state management
 * Handles all navigation actions including CRUD operations
 * 
 * Requirements:
 * - 2.1, 3.1: Header and Footer data display
 * - 2.2, 2.3, 2.4: Header CRUD operations
 * - 3.2, 3.3: Footer CRUD operations
 */
export function navigationReducer(
  state: NavigationState,
  action: NavigationAction
): NavigationState {
  switch (action.type) {
    case 'SET_HEADER_DATA':
      return {
        ...state,
        headerData: action.payload,
        isDirty: true,
      };

    case 'SET_FOOTER_DATA':
      return {
        ...state,
        footerData: action.payload,
        isDirty: true,
      };

    case 'SET_LAYOUT':
      return {
        ...state,
        layout: action.payload,
        isDirty: true,
      };

    case 'ADD_NODE': {
      const { parentId, node, target } = action.payload;
      
      if (target === 'header') {
        return {
          ...state,
          headerData: {
            ...state.headerData,
            links: addNodeToHeaderLinks(state.headerData.links, parentId, node),
          },
          isDirty: true,
        };
      }
      
      // For footer, we handle it differently based on parentId
      // parentId could be a group index as string
      if (target === 'footer') {
        if (parentId === null) {
          // Add new link group
          return {
            ...state,
            footerData: addFooterLinkGroup(state.footerData, node.text),
            isDirty: true,
          };
        }
        // Add link to existing group
        const groupIndex = parseInt(parentId, 10);
        if (!isNaN(groupIndex)) {
          return {
            ...state,
            footerData: addLinkToFooterGroup(
              state.footerData,
              groupIndex,
              { text: node.text, href: node.href }
            ),
            isDirty: true,
          };
        }
      }
      
      return state;
    }

    case 'UPDATE_NODE': {
      const { nodeId, updates, target } = action.payload;
      
      if (target === 'header') {
        return {
          ...state,
          headerData: {
            ...state.headerData,
            links: updateNodeInHeaderLinks(state.headerData.links, nodeId, updates),
          },
          isDirty: true,
        };
      }
      
      // Footer update logic
      if (target === 'footer') {
        // Handle footer link updates
        // nodeId format: "group-{groupIndex}" or "link-{groupIndex}-{linkIndex}"
        const parts = nodeId.split('-');
        if (parts[0] === 'group' && parts.length === 2) {
          const groupIndex = parseInt(parts[1], 10);
          const newLinks = [...state.footerData.links];
          if (groupIndex >= 0 && groupIndex < newLinks.length) {
            newLinks[groupIndex] = {
              ...newLinks[groupIndex],
              title: updates.text || newLinks[groupIndex].title,
            };
          }
          return {
            ...state,
            footerData: { ...state.footerData, links: newLinks },
            isDirty: true,
          };
        }
        
        if (parts[0] === 'link' && parts.length === 3) {
          const groupIndex = parseInt(parts[1], 10);
          const linkIndex = parseInt(parts[2], 10);
          const newLinks = [...state.footerData.links];
          if (
            groupIndex >= 0 && groupIndex < newLinks.length &&
            linkIndex >= 0 && linkIndex < newLinks[groupIndex].links.length
          ) {
            const newGroupLinks = [...newLinks[groupIndex].links];
            newGroupLinks[linkIndex] = {
              ...newGroupLinks[linkIndex],
              ...(updates.text !== undefined && { text: updates.text }),
              ...(updates.href !== undefined && { href: updates.href }),
            };
            newLinks[groupIndex] = {
              ...newLinks[groupIndex],
              links: newGroupLinks,
            };
          }
          return {
            ...state,
            footerData: { ...state.footerData, links: newLinks },
            isDirty: true,
          };
        }
      }
      
      return state;
    }

    case 'DELETE_NODE': {
      const { nodeId, target } = action.payload;
      
      if (target === 'header') {
        return {
          ...state,
          headerData: {
            ...state.headerData,
            links: deleteNodeFromHeaderLinks(state.headerData.links, nodeId),
          },
          isDirty: true,
        };
      }
      
      // Footer delete logic
      if (target === 'footer') {
        const parts = nodeId.split('-');
        if (parts[0] === 'group' && parts.length === 2) {
          const groupIndex = parseInt(parts[1], 10);
          return {
            ...state,
            footerData: {
              ...state.footerData,
              links: state.footerData.links.filter((_, i) => i !== groupIndex),
            },
            isDirty: true,
          };
        }
        
        if (parts[0] === 'link' && parts.length === 3) {
          const groupIndex = parseInt(parts[1], 10);
          const linkIndex = parseInt(parts[2], 10);
          const newLinks = [...state.footerData.links];
          if (groupIndex >= 0 && groupIndex < newLinks.length) {
            newLinks[groupIndex] = {
              ...newLinks[groupIndex],
              links: newLinks[groupIndex].links.filter((_, i) => i !== linkIndex),
            };
          }
          return {
            ...state,
            footerData: { ...state.footerData, links: newLinks },
            isDirty: true,
          };
        }
      }
      
      return state;
    }

    case 'MOVE_NODE': {
      const { tree, target } = action.payload;
      
      if (target === 'header') {
        // Convert NavigationNode[] back to HeaderLink[]
        const newLinks = tree.map(nodeToHeaderLink);
        return {
          ...state,
          headerData: {
            ...state.headerData,
            links: newLinks,
          },
          isDirty: true,
        };
      }
      
      return state;
    }

    case 'START_DRAG':
      return {
        ...state,
        dragState: {
          ...state.dragState,
          isDragging: true,
          draggedNodeId: action.payload,
        },
      };

    case 'UPDATE_DROP_TARGET':
      return {
        ...state,
        dragState: {
          ...state.dragState,
          dropTargetId: action.payload.targetId,
          dropPosition: action.payload.position,
        },
      };

    case 'END_DRAG':
      return {
        ...state,
        dragState: { ...defaultDragState },
      };

    case 'MARK_SAVED':
      return {
        ...state,
        isDirty: false,
        lastSaved: new Date(),
      };

    default:
      return state;
  }
}

// --- Action Creators ---

/**
 * Creates action to set header data
 */
export function setHeaderData(data: HeaderData): NavigationAction {
  return { type: 'SET_HEADER_DATA', payload: data };
}

/**
 * Creates action to set footer data
 */
export function setFooterData(data: FooterData): NavigationAction {
  return { type: 'SET_FOOTER_DATA', payload: data };
}

/**
 * Creates action to set layout configuration
 */
export function setLayout(layout: LayoutConfig): NavigationAction {
  return { type: 'SET_LAYOUT', payload: layout };
}

/**
 * Creates action to add a new node
 */
export function addNode(
  parentId: string | null,
  node: NavigationNode,
  target: 'header' | 'footer'
): NavigationAction {
  return { type: 'ADD_NODE', payload: { parentId, node, target } };
}

/**
 * Creates action to update a node
 */
export function updateNode(
  nodeId: string,
  updates: Partial<NavigationNode>,
  target: 'header' | 'footer'
): NavigationAction {
  return { type: 'UPDATE_NODE', payload: { nodeId, updates, target } };
}

/**
 * Creates action to delete a node
 */
export function deleteNode(
  nodeId: string,
  target: 'header' | 'footer'
): NavigationAction {
  return { type: 'DELETE_NODE', payload: { nodeId, target } };
}

/**
 * Creates action to start drag operation
 */
export function startDrag(nodeId: string): NavigationAction {
  return { type: 'START_DRAG', payload: nodeId };
}

/**
 * Creates action to update drop target
 */
export function updateDropTarget(
  targetId: string,
  position: 'before' | 'after' | 'child'
): NavigationAction {
  return { type: 'UPDATE_DROP_TARGET', payload: { targetId, position } };
}

/**
 * Creates action to end drag operation
 */
export function endDrag(): NavigationAction {
  return { type: 'END_DRAG' };
}

/**
 * Creates action to mark state as saved
 */
export function markSaved(): NavigationAction {
  return { type: 'MARK_SAVED' };
}

// --- Utility Exports ---

export {
  defaultDragState,
  defaultLayout,
  defaultHeaderData,
  defaultFooterData,
};

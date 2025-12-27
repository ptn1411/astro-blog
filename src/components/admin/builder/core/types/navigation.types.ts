/**
 * Navigation types for Layout Selector & Navigation Editor
 * Contains NavigationNode, HeaderData, FooterData, and LayoutConfig types
 */

// --- Navigation Node Type ---
/**
 * Represents a single navigation menu item
 * Can contain nested children for dropdown menus
 */
export interface NavigationNode {
  id: string;
  text: string;
  href: string;
  target?: '_blank' | '_self';
  icon?: string;
  children?: NavigationNode[];
}

// --- Header Link Type ---
/**
 * Header link can be a simple link or a dropdown with nested links
 * Matches the structure in navigation.ts
 */
export interface HeaderLink {
  text: string;
  href?: string;
  target?: '_blank' | '_self';
  icon?: string;
  links?: HeaderLink[];
}

// --- Header Action Type ---
/**
 * Action button in header (e.g., GitHub link)
 */
export interface HeaderAction {
  text: string;
  href: string;
  target?: '_blank' | '_self';
}

// --- Header Data Structure ---
/**
 * Complete header configuration including navigation links and actions
 */
export interface HeaderData {
  links: HeaderLink[];
  actions: HeaderAction[];
}

// --- Footer Link Type ---
/**
 * Simple link used in footer sections
 */
export interface FooterLink {
  text: string;
  href: string;
}

// --- Footer Link Group ---
/**
 * A group of links with a title (footer column)
 */
export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

// --- Social Link Type ---
/**
 * Social media link with icon
 */
export interface SocialLink {
  ariaLabel: string;
  icon: string;
  href: string;
}

// --- Footer Data Structure ---
/**
 * Complete footer configuration
 */
export interface FooterData {
  links: FooterLinkGroup[];
  secondaryLinks: FooterLink[];
  socialLinks: SocialLink[];
  footNote: string;
}

// --- Layout Types ---
/**
 * Available layout template types
 */
export type LayoutType =
  | 'full-width'
  | 'with-sidebar-left'
  | 'with-sidebar-right'
  | 'minimal-header'
  | 'no-footer';

/**
 * Layout configuration for a page
 */
export interface LayoutConfig {
  type: LayoutType;
  headerVisible: boolean;
  footerVisible: boolean;
  sidebarPosition: 'left' | 'right' | 'none';
}

// --- Page Configuration (Extended) ---
/**
 * Extended page configuration including layout and navigation data
 */
export interface PageConfig {
  layout: LayoutConfig;
  headerData: HeaderData;
  footerData: FooterData;
}

// --- Validation Types ---
/**
 * Validation error for a specific field
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Result of validation operation
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// --- Tree Update Result ---
/**
 * Result of a tree modification operation (e.g., drag-drop)
 */
export interface TreeUpdateResult {
  success: boolean;
  tree: NavigationNode[];
  movedNodeId: string;
  newParentId: string | null;
  newIndex: number;
}

// --- Navigation State Types ---
/**
 * Drag state for drag-and-drop operations
 */
export interface DragState {
  isDragging: boolean;
  draggedNodeId: string | null;
  dropTargetId: string | null;
  dropPosition: 'before' | 'after' | 'child' | null;
}

/**
 * Complete navigation editor state
 */
export interface NavigationState {
  headerData: HeaderData;
  footerData: FooterData;
  layout: LayoutConfig;
  isDirty: boolean;
  lastSaved: Date | null;
  dragState: DragState;
}

// --- Navigation Actions ---
/**
 * Action types for navigation state management
 */
export type NavigationAction =
  | { type: 'SET_HEADER_DATA'; payload: HeaderData }
  | { type: 'SET_FOOTER_DATA'; payload: FooterData }
  | { type: 'SET_LAYOUT'; payload: LayoutConfig }
  | { type: 'ADD_NODE'; payload: { parentId: string | null; node: NavigationNode; target: 'header' | 'footer' } }
  | { type: 'UPDATE_NODE'; payload: { nodeId: string; updates: Partial<NavigationNode>; target: 'header' | 'footer' } }
  | { type: 'DELETE_NODE'; payload: { nodeId: string; target: 'header' | 'footer' } }
  | { type: 'MOVE_NODE'; payload: TreeUpdateResult & { target: 'header' | 'footer' } }
  | { type: 'START_DRAG'; payload: string }
  | { type: 'UPDATE_DROP_TARGET'; payload: { targetId: string; position: 'before' | 'after' | 'child' } }
  | { type: 'END_DRAG' }
  | { type: 'MARK_SAVED' };

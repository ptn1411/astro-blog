/**
 * useNavigationEditor Hook
 *
 * Combines NavigationStore, services (TreeValidator, TreeSerializer, DragDropManager),
 * and NavigationPersistence into a clean API for navigation editing components.
 *
 * Requirements: All (1.1-1.5, 2.1-2.7, 3.1-3.7, 4.1-4.7, 5.1-5.7, 6.1-6.5, 7.1-7.4)
 */

import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import type {
  NavigationState,
  HeaderData,
  FooterData,
  LayoutConfig,
  NavigationNode,
  TreeUpdateResult,
} from '../core/types/navigation.types';
import {
  navigationReducer,
  createInitialState,
  setHeaderData,
  setFooterData,
  setLayout,
  addNode,
  updateNode,
  deleteNode,
  startDrag,
  updateDropTarget,
  endDrag,
  markSaved,
  generateNodeId,
  headerLinkToNode,
  nodeToHeaderLink,
} from '../services/navigation/NavigationStore';
import {
  NavigationPersistence,
  createNavigationPersistence,
  type SaveResult,
} from '../services/navigation/NavigationPersistence';
import { validateNode, canAddChild } from '../services/navigation/TreeValidator';
import { toTypeScript } from '../services/navigation/TreeSerializer';
import {
  isValidDrop,
  moveNode,
  type DropPosition,
} from '../services/navigation/DragDropManager';

/**
 * Options for useNavigationEditor hook
 */
export interface UseNavigationEditorOptions {
  /** Initial header data */
  initialHeaderData?: HeaderData;
  /** Initial footer data */
  initialFooterData?: FooterData;
  /** Initial layout configuration */
  initialLayout?: LayoutConfig;
  /** Auto-save debounce delay in ms (default: 500) */
  autoSaveDelay?: number;
  /** Callback when save completes */
  onSave?: (result: SaveResult) => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
  /** Whether to load from storage on mount (default: true) */
  loadOnMount?: boolean;
}

/**
 * Return type for useNavigationEditor hook
 */
export interface UseNavigationEditorReturn {
  // State
  state: NavigationState;
  isDirty: boolean;
  lastSaved: Date | null;

  // Header operations
  headerData: HeaderData;
  setHeaderData: (data: HeaderData) => void;
  addHeaderNode: (parentId: string | null, node: Omit<NavigationNode, 'id'>) => void;
  updateHeaderNode: (nodeId: string, updates: Partial<NavigationNode>) => void;
  deleteHeaderNode: (nodeId: string) => void;

  // Footer operations
  footerData: FooterData;
  setFooterData: (data: FooterData) => void;
  addFooterGroup: (title: string) => void;
  addFooterLink: (groupIndex: number, link: { text: string; href: string }) => void;
  updateFooterGroup: (groupIndex: number, title: string) => void;
  deleteFooterGroup: (groupIndex: number) => void;
  updateFooterLink: (groupIndex: number, linkIndex: number, updates: { text?: string; href?: string }) => void;
  deleteFooterLink: (groupIndex: number, linkIndex: number) => void;
  updateSecondaryLinks: (links: Array<{ text: string; href: string }>) => void;
  updateSocialLinks: (links: Array<{ ariaLabel: string; icon: string; href: string }>) => void;
  updateFooterNote: (note: string) => void;

  // Layout operations
  layout: LayoutConfig;
  setLayout: (layout: LayoutConfig) => void;

  // Drag-drop operations
  dragState: NavigationState['dragState'];
  startDrag: (nodeId: string) => void;
  updateDropTarget: (targetId: string, position: DropPosition) => void;
  completeDrop: (target: 'header' | 'footer') => TreeUpdateResult;
  cancelDrag: () => void;
  isValidDrop: (sourceId: string, targetId: string, position: DropPosition) => boolean;

  // Validation
  validateNode: (node: Partial<NavigationNode>) => { valid: boolean; errors: Array<{ field: string; message: string }> };
  canAddChild: (parentId: string) => boolean;

  // Persistence
  saveToServer: () => Promise<SaveResult>;
  saveImmediately: () => SaveResult;
  load: () => Promise<void>;

  // Export
  exportToTypeScript: () => string;
  exportToJSON: () => string;

  // Utilities
  generateNodeId: () => string;
  headerLinkToNode: typeof headerLinkToNode;
  nodeToHeaderLink: typeof nodeToHeaderLink;
}

/**
 * useNavigationEditor Hook
 *
 * Provides a complete API for managing navigation data including:
 * - Header and footer data management
 * - Layout configuration
 * - Drag-and-drop tree reordering
 * - Validation
 * - Auto-save and server persistence
 * - Export to TypeScript and JSON
 */
export function useNavigationEditor(options: UseNavigationEditorOptions = {}): UseNavigationEditorReturn {
  const {
    initialHeaderData,
    initialFooterData,
    initialLayout,
    autoSaveDelay = 500,
    onSave,
    onError,
    loadOnMount = true,
  } = options;

  // Initialize state with reducer
  const [state, dispatch] = useReducer(
    navigationReducer,
    createInitialState(initialHeaderData, initialFooterData, initialLayout)
  );

  // Persistence instance
  const persistenceRef = useRef<NavigationPersistence | null>(null);

  // Track if initial load has happened
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize persistence
  useEffect(() => {
    persistenceRef.current = createNavigationPersistence({
      debounceDelay: autoSaveDelay,
      onSave,
      onError,
    });

    return () => {
      persistenceRef.current?.cancel();
    };
  }, [autoSaveDelay, onSave, onError]);

  // Load from storage on mount
  useEffect(() => {
    if (loadOnMount && !isLoaded) {
      const loadData = async () => {
        try {
          const data = await persistenceRef.current?.load();
          if (data) {
            dispatch(setHeaderData(data.headerData));
            dispatch(setFooterData(data.footerData));
            dispatch(setLayout(data.layout));
            dispatch(markSaved());
          }
        } catch (error) {
          console.error('Failed to load navigation data:', error);
        } finally {
          setIsLoaded(true);
        }
      };
      loadData();
    }
  }, [loadOnMount, isLoaded]);

  // Auto-save on state changes
  useEffect(() => {
    if (state.isDirty && isLoaded) {
      persistenceRef.current?.autoSave(state);
    }
  }, [state, isLoaded]);

  // --- Header Operations ---

  const handleSetHeaderData = useCallback((data: HeaderData) => {
    dispatch(setHeaderData(data));
  }, []);

  const handleAddHeaderNode = useCallback((parentId: string | null, nodeData: Omit<NavigationNode, 'id'>) => {
    const node: NavigationNode = {
      ...nodeData,
      id: generateNodeId(),
    };
    dispatch(addNode(parentId, node, 'header'));
  }, []);

  const handleUpdateHeaderNode = useCallback((nodeId: string, updates: Partial<NavigationNode>) => {
    dispatch(updateNode(nodeId, updates, 'header'));
  }, []);

  const handleDeleteHeaderNode = useCallback((nodeId: string) => {
    dispatch(deleteNode(nodeId, 'header'));
  }, []);

  // --- Footer Operations ---

  const handleSetFooterData = useCallback((data: FooterData) => {
    dispatch(setFooterData(data));
  }, []);

  const handleAddFooterGroup = useCallback((title: string) => {
    const node: NavigationNode = {
      id: generateNodeId(),
      text: title,
      href: '#',
    };
    dispatch(addNode(null, node, 'footer'));
  }, []);

  const handleAddFooterLink = useCallback((groupIndex: number, link: { text: string; href: string }) => {
    const node: NavigationNode = {
      id: generateNodeId(),
      text: link.text,
      href: link.href,
    };
    dispatch(addNode(String(groupIndex), node, 'footer'));
  }, []);

  const handleUpdateFooterGroup = useCallback((groupIndex: number, title: string) => {
    dispatch(updateNode(`group-${groupIndex}`, { text: title }, 'footer'));
  }, []);

  const handleDeleteFooterGroup = useCallback((groupIndex: number) => {
    dispatch(deleteNode(`group-${groupIndex}`, 'footer'));
  }, []);

  const handleUpdateFooterLink = useCallback(
    (groupIndex: number, linkIndex: number, updates: { text?: string; href?: string }) => {
      dispatch(updateNode(`link-${groupIndex}-${linkIndex}`, updates, 'footer'));
    },
    []
  );

  const handleDeleteFooterLink = useCallback((groupIndex: number, linkIndex: number) => {
    dispatch(deleteNode(`link-${groupIndex}-${linkIndex}`, 'footer'));
  }, []);

  const handleUpdateSecondaryLinks = useCallback(
    (links: Array<{ text: string; href: string }>) => {
      dispatch(
        setFooterData({
          ...state.footerData,
          secondaryLinks: links,
        })
      );
    },
    [state.footerData]
  );

  const handleUpdateSocialLinks = useCallback(
    (links: Array<{ ariaLabel: string; icon: string; href: string }>) => {
      dispatch(
        setFooterData({
          ...state.footerData,
          socialLinks: links,
        })
      );
    },
    [state.footerData]
  );

  const handleUpdateFooterNote = useCallback(
    (note: string) => {
      dispatch(
        setFooterData({
          ...state.footerData,
          footNote: note,
        })
      );
    },
    [state.footerData]
  );

  // --- Layout Operations ---

  const handleSetLayout = useCallback((layout: LayoutConfig) => {
    dispatch(setLayout(layout));
  }, []);

  // --- Drag-Drop Operations ---

  const handleStartDrag = useCallback((nodeId: string) => {
    dispatch(startDrag(nodeId));
  }, []);

  const handleUpdateDropTarget = useCallback((targetId: string, position: DropPosition) => {
    dispatch(updateDropTarget(targetId, position));
  }, []);

  const handleCompleteDrop = useCallback(
    (target: 'header' | 'footer'): TreeUpdateResult => {
      const { draggedNodeId, dropTargetId, dropPosition } = state.dragState;

      if (!draggedNodeId || !dropTargetId || !dropPosition) {
        dispatch(endDrag());
        return {
          success: false,
          tree: [],
          movedNodeId: draggedNodeId || '',
          newParentId: null,
          newIndex: -1,
        };
      }

      // Get current tree based on target
      let currentTree: NavigationNode[] = [];
      if (target === 'header') {
        currentTree = state.headerData.links.map((link, index) => headerLinkToNode(link, `header-${index}`));
      }

      // Perform the move
      const result = moveNode(currentTree, draggedNodeId, dropTargetId, dropPosition);

      if (result.success) {
        dispatch({
          type: 'MOVE_NODE',
          payload: { ...result, target },
        });
      }

      dispatch(endDrag());
      return result;
    },
    [state.dragState, state.headerData.links]
  );

  const handleCancelDrag = useCallback(() => {
    dispatch(endDrag());
  }, []);

  const handleIsValidDrop = useCallback(
    (sourceId: string, targetId: string, position: DropPosition): boolean => {
      // Get current header tree for validation
      const currentTree = state.headerData.links.map((link, index) => headerLinkToNode(link, `header-${index}`));
      return isValidDrop(currentTree, sourceId, targetId, position);
    },
    [state.headerData.links]
  );

  // --- Validation ---

  const handleValidateNode = useCallback((node: Partial<NavigationNode>) => {
    return validateNode(node);
  }, []);

  const handleCanAddChild = useCallback(
    (parentId: string): boolean => {
      const currentTree = state.headerData.links.map((link, index) => headerLinkToNode(link, `header-${index}`));
      return canAddChild(currentTree, parentId);
    },
    [state.headerData.links]
  );

  // --- Persistence ---

  const handleSaveToServer = useCallback(async (): Promise<SaveResult> => {
    if (!persistenceRef.current) {
      return { success: false, local: false, remote: false, error: 'Persistence not initialized' };
    }
    const result = await persistenceRef.current.saveToServer(state);
    if (result.success) {
      dispatch(markSaved());
    }
    return result;
  }, [state]);

  const handleSaveImmediately = useCallback((): SaveResult => {
    if (!persistenceRef.current) {
      return { success: false, local: false, remote: false, error: 'Persistence not initialized' };
    }
    const result = persistenceRef.current.saveImmediately(state);
    if (result.success) {
      dispatch(markSaved());
    }
    return result;
  }, [state]);

  const handleLoad = useCallback(async (): Promise<void> => {
    if (!persistenceRef.current) return;

    try {
      const data = await persistenceRef.current.load();
      if (data) {
        dispatch(setHeaderData(data.headerData));
        dispatch(setFooterData(data.footerData));
        dispatch(setLayout(data.layout));
        dispatch(markSaved());
      }
    } catch (error) {
      console.error('Failed to load navigation data:', error);
      throw error;
    }
  }, []);

  // --- Export ---

  const handleExportToTypeScript = useCallback((): string => {
    return toTypeScript(state.headerData, state.footerData);
  }, [state.headerData, state.footerData]);

  const handleExportToJSON = useCallback((): string => {
    return JSON.stringify(
      {
        headerData: state.headerData,
        footerData: state.footerData,
        layout: state.layout,
      },
      null,
      2
    );
  }, [state.headerData, state.footerData, state.layout]);

  return {
    // State
    state,
    isDirty: state.isDirty,
    lastSaved: state.lastSaved,

    // Header operations
    headerData: state.headerData,
    setHeaderData: handleSetHeaderData,
    addHeaderNode: handleAddHeaderNode,
    updateHeaderNode: handleUpdateHeaderNode,
    deleteHeaderNode: handleDeleteHeaderNode,

    // Footer operations
    footerData: state.footerData,
    setFooterData: handleSetFooterData,
    addFooterGroup: handleAddFooterGroup,
    addFooterLink: handleAddFooterLink,
    updateFooterGroup: handleUpdateFooterGroup,
    deleteFooterGroup: handleDeleteFooterGroup,
    updateFooterLink: handleUpdateFooterLink,
    deleteFooterLink: handleDeleteFooterLink,
    updateSecondaryLinks: handleUpdateSecondaryLinks,
    updateSocialLinks: handleUpdateSocialLinks,
    updateFooterNote: handleUpdateFooterNote,

    // Layout operations
    layout: state.layout,
    setLayout: handleSetLayout,

    // Drag-drop operations
    dragState: state.dragState,
    startDrag: handleStartDrag,
    updateDropTarget: handleUpdateDropTarget,
    completeDrop: handleCompleteDrop,
    cancelDrag: handleCancelDrag,
    isValidDrop: handleIsValidDrop,

    // Validation
    validateNode: handleValidateNode,
    canAddChild: handleCanAddChild,

    // Persistence
    saveToServer: handleSaveToServer,
    saveImmediately: handleSaveImmediately,
    load: handleLoad,

    // Export
    exportToTypeScript: handleExportToTypeScript,
    exportToJSON: handleExportToJSON,

    // Utilities
    generateNodeId,
    headerLinkToNode,
    nodeToHeaderLink,
  };
}

export default useNavigationEditor;

/**
 * NavigationStore Tests
 * Tests for navigation state management including CRUD operations
 * 
 * Requirements: 2.2, 2.3, 2.4, 5.2, 5.4, 5.6
 */

import { describe, it, expect } from 'vitest';
import {
  navigationReducer,
  createInitialState,
  addNode,
  updateNode,
  deleteNode,
  setHeaderData,
  setFooterData,
  setLayout,
  startDrag,
  updateDropTarget,
  endDrag,
  markSaved,
  generateNodeId,
  headerLinkToNode,
  nodeToHeaderLink,
} from './NavigationStore';
import type { NavigationNode, HeaderData, FooterData, LayoutConfig } from '../../core/types/navigation.types';

describe('NavigationStore', () => {
  describe('createInitialState', () => {
    it('should create default initial state', () => {
      const state = createInitialState();
      
      expect(state.headerData.links).toEqual([]);
      expect(state.headerData.actions).toEqual([]);
      expect(state.footerData.links).toEqual([]);
      expect(state.footerData.socialLinks).toEqual([]);
      expect(state.layout.type).toBe('full-width');
      expect(state.isDirty).toBe(false);
      expect(state.lastSaved).toBeNull();
      expect(state.dragState.isDragging).toBe(false);
    });

    it('should merge partial header data', () => {
      const state = createInitialState({
        links: [{ text: 'Home', href: '/' }],
      });
      
      expect(state.headerData.links).toHaveLength(1);
      expect(state.headerData.links[0].text).toBe('Home');
      expect(state.headerData.actions).toEqual([]);
    });

    it('should merge partial layout config', () => {
      const state = createInitialState(undefined, undefined, {
        type: 'with-sidebar-left',
      });
      
      expect(state.layout.type).toBe('with-sidebar-left');
      expect(state.layout.headerVisible).toBe(true);
    });
  });

  describe('SET_HEADER_DATA action', () => {
    it('should set header data and mark dirty', () => {
      const state = createInitialState();
      const headerData: HeaderData = {
        links: [{ text: 'Home', href: '/' }],
        actions: [{ text: 'Login', href: '/login' }],
      };
      
      const newState = navigationReducer(state, setHeaderData(headerData));
      
      expect(newState.headerData).toEqual(headerData);
      expect(newState.isDirty).toBe(true);
    });
  });

  describe('SET_FOOTER_DATA action', () => {
    it('should set footer data and mark dirty', () => {
      const state = createInitialState();
      const footerData: FooterData = {
        links: [{ title: 'Company', links: [{ text: 'About', href: '/about' }] }],
        secondaryLinks: [],
        socialLinks: [],
        footNote: 'Copyright 2024',
      };
      
      const newState = navigationReducer(state, setFooterData(footerData));
      
      expect(newState.footerData).toEqual(footerData);
      expect(newState.isDirty).toBe(true);
    });
  });

  describe('SET_LAYOUT action', () => {
    it('should set layout and mark dirty', () => {
      const state = createInitialState();
      const layout: LayoutConfig = {
        type: 'minimal-header',
        headerVisible: true,
        footerVisible: false,
        sidebarPosition: 'none',
      };
      
      const newState = navigationReducer(state, setLayout(layout));
      
      expect(newState.layout).toEqual(layout);
      expect(newState.isDirty).toBe(true);
    });
  });

  describe('ADD_NODE action - Header', () => {
    it('should add node to root level', () => {
      const state = createInitialState();
      const node: NavigationNode = {
        id: 'test-node-1',
        text: 'Home',
        href: '/',
      };
      
      const newState = navigationReducer(state, addNode(null, node, 'header'));
      
      expect(newState.headerData.links).toHaveLength(1);
      expect(newState.headerData.links[0].text).toBe('Home');
      expect(newState.isDirty).toBe(true);
    });

    it('should add node as child of existing node', () => {
      const initialState = createInitialState({
        links: [{ text: 'Services', href: '/services', id: 'parent-1' } as any],
      });
      const childNode: NavigationNode = {
        id: 'child-1',
        text: 'Pricing',
        href: '/pricing',
      };
      
      const newState = navigationReducer(initialState, addNode('parent-1', childNode, 'header'));
      
      expect(newState.headerData.links[0].links).toHaveLength(1);
      expect(newState.headerData.links[0].links![0].text).toBe('Pricing');
    });
  });

  describe('ADD_NODE action - Footer', () => {
    it('should add new link group when parentId is null', () => {
      const state = createInitialState();
      const node: NavigationNode = {
        id: 'group-1',
        text: 'Company',
        href: '#',
      };
      
      const newState = navigationReducer(state, addNode(null, node, 'footer'));
      
      expect(newState.footerData.links).toHaveLength(1);
      expect(newState.footerData.links[0].title).toBe('Company');
      expect(newState.footerData.links[0].links).toEqual([]);
    });

    it('should add link to existing group', () => {
      const initialState = createInitialState({}, {
        links: [{ title: 'Company', links: [] }],
        secondaryLinks: [],
        socialLinks: [],
        footNote: '',
      });
      const node: NavigationNode = {
        id: 'link-1',
        text: 'About',
        href: '/about',
      };
      
      const newState = navigationReducer(initialState, addNode('0', node, 'footer'));
      
      expect(newState.footerData.links[0].links).toHaveLength(1);
      expect(newState.footerData.links[0].links[0].text).toBe('About');
    });
  });

  describe('UPDATE_NODE action - Header', () => {
    it('should update node properties', () => {
      const initialState = createInitialState({
        links: [{ text: 'Home', href: '/', id: 'node-1' } as any],
      });
      
      const newState = navigationReducer(
        initialState,
        updateNode('node-1', { text: 'Homepage', href: '/home' }, 'header')
      );
      
      expect(newState.headerData.links[0].text).toBe('Homepage');
      expect(newState.headerData.links[0].href).toBe('/home');
      expect(newState.isDirty).toBe(true);
    });
  });

  describe('UPDATE_NODE action - Footer', () => {
    it('should update footer group title', () => {
      const initialState = createInitialState({}, {
        links: [{ title: 'Company', links: [] }],
        secondaryLinks: [],
        socialLinks: [],
        footNote: '',
      });
      
      const newState = navigationReducer(
        initialState,
        updateNode('group-0', { text: 'About Us' }, 'footer')
      );
      
      expect(newState.footerData.links[0].title).toBe('About Us');
    });

    it('should update footer link', () => {
      const initialState = createInitialState({}, {
        links: [{ title: 'Company', links: [{ text: 'About', href: '/about' }] }],
        secondaryLinks: [],
        socialLinks: [],
        footNote: '',
      });
      
      const newState = navigationReducer(
        initialState,
        updateNode('link-0-0', { text: 'About Us', href: '/about-us' }, 'footer')
      );
      
      expect(newState.footerData.links[0].links[0].text).toBe('About Us');
      expect(newState.footerData.links[0].links[0].href).toBe('/about-us');
    });
  });

  describe('DELETE_NODE action - Header', () => {
    it('should delete node from header', () => {
      const initialState = createInitialState({
        links: [
          { text: 'Home', href: '/', id: 'node-1' } as any,
          { text: 'About', href: '/about', id: 'node-2' } as any,
        ],
      });
      
      const newState = navigationReducer(initialState, deleteNode('node-1', 'header'));
      
      expect(newState.headerData.links).toHaveLength(1);
      expect(newState.headerData.links[0].text).toBe('About');
      expect(newState.isDirty).toBe(true);
    });

    it('should delete nested node', () => {
      const initialState = createInitialState({
        links: [{
          text: 'Services',
          href: '/services',
          id: 'parent-1',
          links: [
            { text: 'Pricing', href: '/pricing', id: 'child-1' } as any,
            { text: 'Support', href: '/support', id: 'child-2' } as any,
          ],
        } as any],
      });
      
      const newState = navigationReducer(initialState, deleteNode('child-1', 'header'));
      
      expect(newState.headerData.links[0].links).toHaveLength(1);
      expect(newState.headerData.links[0].links![0].text).toBe('Support');
    });
  });

  describe('DELETE_NODE action - Footer', () => {
    it('should delete footer group', () => {
      const initialState = createInitialState({}, {
        links: [
          { title: 'Company', links: [] },
          { title: 'Resources', links: [] },
        ],
        secondaryLinks: [],
        socialLinks: [],
        footNote: '',
      });
      
      const newState = navigationReducer(initialState, deleteNode('group-0', 'footer'));
      
      expect(newState.footerData.links).toHaveLength(1);
      expect(newState.footerData.links[0].title).toBe('Resources');
    });

    it('should delete link from footer group', () => {
      const initialState = createInitialState({}, {
        links: [{
          title: 'Company',
          links: [
            { text: 'About', href: '/about' },
            { text: 'Team', href: '/team' },
          ],
        }],
        secondaryLinks: [],
        socialLinks: [],
        footNote: '',
      });
      
      const newState = navigationReducer(initialState, deleteNode('link-0-0', 'footer'));
      
      expect(newState.footerData.links[0].links).toHaveLength(1);
      expect(newState.footerData.links[0].links[0].text).toBe('Team');
    });
  });

  describe('Drag state actions', () => {
    it('should start drag', () => {
      const state = createInitialState();
      
      const newState = navigationReducer(state, startDrag('node-1'));
      
      expect(newState.dragState.isDragging).toBe(true);
      expect(newState.dragState.draggedNodeId).toBe('node-1');
    });

    it('should update drop target', () => {
      const state = createInitialState();
      const dragState = navigationReducer(state, startDrag('node-1'));
      
      const newState = navigationReducer(
        dragState,
        updateDropTarget('node-2', 'after')
      );
      
      expect(newState.dragState.dropTargetId).toBe('node-2');
      expect(newState.dragState.dropPosition).toBe('after');
    });

    it('should end drag and reset state', () => {
      const state = createInitialState();
      const dragState = navigationReducer(state, startDrag('node-1'));
      
      const newState = navigationReducer(dragState, endDrag());
      
      expect(newState.dragState.isDragging).toBe(false);
      expect(newState.dragState.draggedNodeId).toBeNull();
      expect(newState.dragState.dropTargetId).toBeNull();
    });
  });

  describe('MARK_SAVED action', () => {
    it('should mark state as saved', () => {
      const state = createInitialState();
      const dirtyState = navigationReducer(state, setHeaderData({
        links: [{ text: 'Home', href: '/' }],
        actions: [],
      }));
      
      expect(dirtyState.isDirty).toBe(true);
      
      const savedState = navigationReducer(dirtyState, markSaved());
      
      expect(savedState.isDirty).toBe(false);
      expect(savedState.lastSaved).toBeInstanceOf(Date);
    });
  });

  describe('Utility functions', () => {
    it('generateNodeId should create unique IDs', () => {
      const id1 = generateNodeId();
      const id2 = generateNodeId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^node-\d+-[a-z0-9]+$/);
    });

    it('headerLinkToNode should convert HeaderLink to NavigationNode', () => {
      const link = {
        text: 'Home',
        href: '/',
        target: '_self' as const,
        icon: 'home',
        links: [{ text: 'Sub', href: '/sub' }],
      };
      
      const node = headerLinkToNode(link, 'test-id');
      
      expect(node.id).toBe('test-id');
      expect(node.text).toBe('Home');
      expect(node.href).toBe('/');
      expect(node.target).toBe('_self');
      expect(node.icon).toBe('home');
      expect(node.children).toHaveLength(1);
      expect(node.children![0].text).toBe('Sub');
    });

    it('nodeToHeaderLink should convert NavigationNode to HeaderLink', () => {
      const node: NavigationNode = {
        id: 'test-id',
        text: 'Home',
        href: '/',
        target: '_blank',
        icon: 'home',
        children: [{ id: 'child-1', text: 'Sub', href: '/sub' }],
      };
      
      const link = nodeToHeaderLink(node);
      
      expect(link.text).toBe('Home');
      expect(link.href).toBe('/');
      expect(link.target).toBe('_blank');
      expect(link.icon).toBe('home');
      expect(link.links).toHaveLength(1);
      expect(link.links![0].text).toBe('Sub');
    });
  });
});

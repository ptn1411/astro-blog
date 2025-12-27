/**
 * NavigationEditor Component
 *
 * Container component for editing navigation data (header and footer).
 * Supports two modes:
 * - Header mode: Edit header links tree and actions
 * - Footer mode: Edit footer link groups, secondary links, social links, and footer note
 *
 * Requirements: 2.1, 3.1
 */

import { useState, useCallback } from 'react';
import {
  Menu,
  Footprints,
  Plus,
  Save,
  AlertCircle,
  Check,
  Loader2,
  ExternalLink,
  Trash2,
  Edit2,
  Link as LinkIcon,
  Users,
} from 'lucide-react';
import type {
  HeaderData,
  FooterData,
  NavigationNode,
  HeaderLink,
  HeaderAction,
  FooterLinkGroup,
  FooterLink,
  SocialLink,
} from '../../core/types/navigation.types';
import { NavigationTree } from './NavigationTree';
import { NodeForm } from './NodeForm';
import { IconPicker } from '../pickers/IconPicker';

/**
 * Props for NavigationEditor component
 */
export interface NavigationEditorProps {
  /** Editor mode: 'header' for header navigation, 'footer' for footer sections */
  mode: 'header' | 'footer';
  /** Header data (required when mode is 'header') */
  headerData?: HeaderData;
  /** Footer data (required when mode is 'footer') */
  footerData?: FooterData;
  /** Callback when header data changes */
  onHeaderChange?: (data: HeaderData) => void;
  /** Callback when footer data changes */
  onFooterChange?: (data: FooterData) => void;
  /** Callback when save is requested */
  onSave?: () => Promise<void>;
  /** Dark mode flag */
  isDarkMode?: boolean;
}

/**
 * Form state for adding/editing nodes
 */
interface FormState {
  isOpen: boolean;
  mode: 'add' | 'edit';
  parentId: string | null;
  node?: NavigationNode;
}

/**
 * Tab type for footer editor
 */
type FooterTab = 'groups' | 'secondary' | 'social' | 'note';

/**
 * Converts HeaderLink array to NavigationNode array for tree display
 */
function headerLinksToNodes(links: HeaderLink[]): NavigationNode[] {
  return links.map((link, index) => {
    const linkWithId = link as HeaderLink & { id?: string };
    const id = linkWithId.id || `header-${index}-${Date.now()}`;
    return {
      id,
      text: link.text,
      href: link.href || '#',
      target: link.target,
      icon: link.icon,
      children: link.links ? headerLinksToNodes(link.links) : [],
    };
  });
}

/**
 * Converts NavigationNode array back to HeaderLink array
 */
function nodesToHeaderLinks(nodes: NavigationNode[]): HeaderLink[] {
  return nodes.map((node) => {
    const link: HeaderLink = {
      text: node.text,
    };
    if (node.href && node.href !== '#') {
      link.href = node.href;
    }
    if (node.target) link.target = node.target;
    if (node.icon) link.icon = node.icon;
    if (node.children && node.children.length > 0) {
      link.links = nodesToHeaderLinks(node.children);
    }
    return link;
  });
}

/**
 * NavigationEditor Component
 */
export function NavigationEditor({
  mode,
  headerData,
  footerData,
  onHeaderChange,
  onFooterChange,
  onSave,
  isDarkMode = false,
}: NavigationEditorProps) {
  // Form state for add/edit operations
  const [formState, setFormState] = useState<FormState>({
    isOpen: false,
    mode: 'add',
    parentId: null,
  });

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Footer tab state
  const [footerTab, setFooterTab] = useState<FooterTab>('groups');

  // Convert header links to nodes for tree display
  const headerNodes = headerData ? headerLinksToNodes(headerData.links) : [];

  // Handle tree change (drag-drop reorder)
  const handleTreeChange = useCallback(
    (nodes: NavigationNode[]) => {
      if (mode === 'header' && onHeaderChange && headerData) {
        const newLinks = nodesToHeaderLinks(nodes);
        onHeaderChange({
          ...headerData,
          links: newLinks,
        });
      }
    },
    [mode, onHeaderChange, headerData]
  );

  // Handle edit node
  const handleEditNode = useCallback((node: NavigationNode) => {
    setFormState({
      isOpen: true,
      mode: 'edit',
      parentId: null,
      node,
    });
  }, []);

  // Handle delete node
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (mode === 'header' && onHeaderChange && headerData) {
        const deleteFromNodes = (nodes: NavigationNode[]): NavigationNode[] => {
          return nodes
            .filter((n) => n.id !== nodeId)
            .map((n) => ({
              ...n,
              children: n.children ? deleteFromNodes(n.children) : [],
            }));
        };
        const newNodes = deleteFromNodes(headerNodes);
        onHeaderChange({
          ...headerData,
          links: nodesToHeaderLinks(newNodes),
        });
      }
    },
    [mode, onHeaderChange, headerData, headerNodes]
  );

  // Handle add child
  const handleAddChild = useCallback((parentId: string | null) => {
    setFormState({
      isOpen: true,
      mode: 'add',
      parentId,
    });
  }, []);

  // Handle form submit
  const handleFormSubmit = useCallback(
    (node: NavigationNode) => {
      if (mode === 'header' && onHeaderChange && headerData) {
        if (formState.mode === 'add') {
          // Add new node
          const addToNodes = (
            nodes: NavigationNode[],
            parentId: string | null,
            newNode: NavigationNode
          ): NavigationNode[] => {
            if (parentId === null) {
              return [...nodes, newNode];
            }
            return nodes.map((n) => {
              if (n.id === parentId) {
                return {
                  ...n,
                  children: [...(n.children || []), newNode],
                };
              }
              if (n.children) {
                return {
                  ...n,
                  children: addToNodes(n.children, parentId, newNode),
                };
              }
              return n;
            });
          };
          const newNodes = addToNodes(headerNodes, formState.parentId, node);
          onHeaderChange({
            ...headerData,
            links: nodesToHeaderLinks(newNodes),
          });
        } else {
          // Update existing node
          const updateInNodes = (nodes: NavigationNode[], updatedNode: NavigationNode): NavigationNode[] => {
            return nodes.map((n) => {
              if (n.id === updatedNode.id) {
                return { ...updatedNode, children: n.children };
              }
              if (n.children) {
                return {
                  ...n,
                  children: updateInNodes(n.children, updatedNode),
                };
              }
              return n;
            });
          };
          const newNodes = updateInNodes(headerNodes, node);
          onHeaderChange({
            ...headerData,
            links: nodesToHeaderLinks(newNodes),
          });
        }
      }
      setFormState({ isOpen: false, mode: 'add', parentId: null });
    },
    [mode, onHeaderChange, headerData, headerNodes, formState]
  );

  // Handle form cancel
  const handleFormCancel = useCallback(() => {
    setFormState({ isOpen: false, mode: 'add', parentId: null });
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await onSave();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  // Style classes
  const panelClass = `rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`;
  const headerClass = `flex items-center gap-2 p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`;
  const titleClass = `text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`;
  const tabClass = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
      active
        ? isDarkMode
          ? 'bg-blue-600 text-white'
          : 'bg-blue-600 text-white'
        : isDarkMode
          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
    }`;

  // Render header editor
  if (mode === 'header') {
    return (
      <div className={panelClass}>
        {/* Header */}
        <div className={headerClass}>
          <Menu size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
          <h3 className={titleClass}>Header Navigation</h3>
          {onSave && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                saveStatus === 'success'
                  ? 'bg-green-600 text-white'
                  : saveStatus === 'error'
                    ? 'bg-red-600 text-white'
                    : isDarkMode
                      ? 'bg-blue-600 text-white hover:bg-blue-500'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : saveStatus === 'success' ? (
                <Check size={14} />
              ) : saveStatus === 'error' ? (
                <AlertCircle size={14} />
              ) : (
                <Save size={14} />
              )}
              {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-4">
          {/* Form (when open) */}
          {formState.isOpen && (
            <NodeForm
              node={formState.node}
              mode={formState.mode}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isDarkMode={isDarkMode}
            />
          )}

          {/* Navigation Tree */}
          {!formState.isOpen && (
            <>
              <div className="space-y-2">
                <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Navigation Links
                </div>
                <NavigationTree
                  nodes={headerNodes}
                  maxDepth={2}
                  onTreeChange={handleTreeChange}
                  onEditNode={handleEditNode}
                  onDeleteNode={handleDeleteNode}
                  onAddChild={handleAddChild}
                  isDarkMode={isDarkMode}
                  emptyMessage="No navigation links. Click 'Add Link' to create one."
                />
              </div>

              {/* Header Actions Section */}
              <HeaderActionsEditor
                actions={headerData?.actions || []}
                onChange={(actions) => {
                  if (onHeaderChange && headerData) {
                    onHeaderChange({ ...headerData, actions });
                  }
                }}
                isDarkMode={isDarkMode}
              />
            </>
          )}
        </div>
      </div>
    );
  }

  // Render footer editor
  return (
    <div className={panelClass}>
      {/* Header */}
      <div className={headerClass}>
        <Footprints size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
        <h3 className={titleClass}>Footer Configuration</h3>
        {onSave && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              saveStatus === 'success'
                ? 'bg-green-600 text-white'
                : saveStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : isDarkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saveStatus === 'success' ? (
              <Check size={14} />
            ) : saveStatus === 'error' ? (
              <AlertCircle size={14} />
            ) : (
              <Save size={14} />
            )}
            {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button type="button" onClick={() => setFooterTab('groups')} className={tabClass(footerTab === 'groups')}>
          Link Groups
        </button>
        <button type="button" onClick={() => setFooterTab('secondary')} className={tabClass(footerTab === 'secondary')}>
          Secondary
        </button>
        <button type="button" onClick={() => setFooterTab('social')} className={tabClass(footerTab === 'social')}>
          Social
        </button>
        <button type="button" onClick={() => setFooterTab('note')} className={tabClass(footerTab === 'note')}>
          Note
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        {footerTab === 'groups' && (
          <FooterLinkGroupsEditor
            groups={footerData?.links || []}
            onChange={(links) => {
              if (onFooterChange && footerData) {
                onFooterChange({ ...footerData, links });
              }
            }}
            isDarkMode={isDarkMode}
          />
        )}
        {footerTab === 'secondary' && (
          <SecondaryLinksEditor
            links={footerData?.secondaryLinks || []}
            onChange={(secondaryLinks) => {
              if (onFooterChange && footerData) {
                onFooterChange({ ...footerData, secondaryLinks });
              }
            }}
            isDarkMode={isDarkMode}
          />
        )}
        {footerTab === 'social' && (
          <SocialLinksEditor
            links={footerData?.socialLinks || []}
            onChange={(socialLinks) => {
              if (onFooterChange && footerData) {
                onFooterChange({ ...footerData, socialLinks });
              }
            }}
            isDarkMode={isDarkMode}
          />
        )}
        {footerTab === 'note' && (
          <FooterNoteEditor
            note={footerData?.footNote || ''}
            onChange={(footNote) => {
              if (onFooterChange && footerData) {
                onFooterChange({ ...footerData, footNote });
              }
            }}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </div>
  );
}

export default NavigationEditor;


// --- Sub-components for Header and Footer editing ---

/**
 * HeaderActionsEditor - Edit header action buttons
 */
interface HeaderActionsEditorProps {
  actions: HeaderAction[];
  onChange: (actions: HeaderAction[]) => void;
  isDarkMode: boolean;
}

function HeaderActionsEditor({ actions, onChange, isDarkMode }: HeaderActionsEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newAction, setNewAction] = useState<HeaderAction>({ text: '', href: '' });
  const [isAdding, setIsAdding] = useState(false);

  const inputClass = `w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
  }`;

  const handleAdd = () => {
    if (newAction.text && newAction.href) {
      onChange([...actions, newAction]);
      setNewAction({ text: '', href: '' });
      setIsAdding(false);
    }
  };

  const handleUpdate = (index: number, updates: Partial<HeaderAction>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    onChange(newActions);
  };

  const handleDelete = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Action Buttons
      </div>

      {/* Existing actions */}
      <div className="space-y-2">
        {actions.map((action, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
          >
            {editingIndex === index ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={action.text}
                  onChange={(e) => handleUpdate(index, { text: e.target.value })}
                  placeholder="Button text"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={action.href}
                  onChange={(e) => handleUpdate(index, { href: e.target.value })}
                  placeholder="URL"
                  className={inputClass}
                />
                <div className="flex gap-2">
                  <select
                    value={action.target || '_self'}
                    onChange={(e) => handleUpdate(index, { target: e.target.value as '_blank' | '_self' })}
                    className={inputClass}
                  >
                    <option value="_self">Same window</option>
                    <option value="_blank">New tab</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    className={`px-3 py-1.5 text-xs font-medium rounded ${
                      isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                    }`}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExternalLink size={14} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {action.text}
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {action.href}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingIndex(index)}
                    className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                  >
                    <Edit2 size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-100'}`}
                  >
                    <Trash2 size={14} className={isDarkMode ? 'text-red-400' : 'text-red-500'} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new action */}
      {isAdding ? (
        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <div className="space-y-2">
            <input
              type="text"
              value={newAction.text}
              onChange={(e) => setNewAction({ ...newAction, text: e.target.value })}
              placeholder="Button text"
              className={inputClass}
            />
            <input
              type="text"
              value={newAction.href}
              onChange={(e) => setNewAction({ ...newAction, href: e.target.value })}
              placeholder="URL"
              className={inputClass}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newAction.text || !newAction.href}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded ${
                  isDarkMode ? 'bg-blue-600 text-white disabled:opacity-50' : 'bg-blue-600 text-white disabled:opacity-50'
                }`}
              >
                Add Action
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewAction({ text: '', href: '' });
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded ${
                  isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className={`w-full p-2 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 transition-colors ${
            isDarkMode
              ? 'border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400'
              : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600'
          }`}
        >
          <Plus size={14} />
          <span className="text-xs font-medium">Add Action Button</span>
        </button>
      )}
    </div>
  );
}


/**
 * FooterLinkGroupsEditor - Edit footer link groups (columns)
 * Requirements: 3.1, 3.2, 3.3
 */
interface FooterLinkGroupsEditorProps {
  groups: FooterLinkGroup[];
  onChange: (groups: FooterLinkGroup[]) => void;
  isDarkMode: boolean;
}

function FooterLinkGroupsEditor({ groups, onChange, isDarkMode }: FooterLinkGroupsEditorProps) {
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [addingLinkToGroup, setAddingLinkToGroup] = useState<number | null>(null);
  const [newLink, setNewLink] = useState<FooterLink>({ text: '', href: '' });

  const inputClass = `w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
  }`;

  const handleAddGroup = () => {
    if (newGroupTitle.trim()) {
      onChange([...groups, { title: newGroupTitle.trim(), links: [] }]);
      setNewGroupTitle('');
      setIsAddingGroup(false);
    }
  };

  const handleUpdateGroupTitle = (index: number, title: string) => {
    const newGroups = [...groups];
    newGroups[index] = { ...newGroups[index], title };
    onChange(newGroups);
  };

  const handleDeleteGroup = (index: number) => {
    onChange(groups.filter((_, i) => i !== index));
  };

  const handleAddLink = (groupIndex: number) => {
    if (newLink.text && newLink.href) {
      const newGroups = [...groups];
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        links: [...newGroups[groupIndex].links, newLink],
      };
      onChange(newGroups);
      setNewLink({ text: '', href: '' });
      setAddingLinkToGroup(null);
    }
  };

  const handleUpdateLink = (groupIndex: number, linkIndex: number, updates: Partial<FooterLink>) => {
    const newGroups = [...groups];
    const newLinks = [...newGroups[groupIndex].links];
    newLinks[linkIndex] = { ...newLinks[linkIndex], ...updates };
    newGroups[groupIndex] = { ...newGroups[groupIndex], links: newLinks };
    onChange(newGroups);
  };

  const handleDeleteLink = (groupIndex: number, linkIndex: number) => {
    const newGroups = [...groups];
    newGroups[groupIndex] = {
      ...newGroups[groupIndex],
      links: newGroups[groupIndex].links.filter((_, i) => i !== linkIndex),
    };
    onChange(newGroups);
  };

  return (
    <div className="space-y-3">
      {/* Existing groups */}
      {groups.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className={`rounded-lg border ${isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
        >
          {/* Group header */}
          <div
            className={`flex items-center justify-between p-2 cursor-pointer ${
              isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
            }`}
            onClick={() => setExpandedGroup(expandedGroup === groupIndex ? null : groupIndex)}
          >
            <div className="flex items-center gap-2">
              <Users size={14} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
              {editingTitle === groupIndex ? (
                <input
                  type="text"
                  value={group.title}
                  onChange={(e) => handleUpdateGroupTitle(groupIndex, e.target.value)}
                  onBlur={() => setEditingTitle(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(null)}
                  onClick={(e) => e.stopPropagation()}
                  className={`${inputClass} py-1`}
                  autoFocus
                />
              ) : (
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {group.title}
                </span>
              )}
              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                ({group.links.length} links)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTitle(groupIndex);
                }}
                className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
              >
                <Edit2 size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteGroup(groupIndex);
                }}
                className={`p-1 rounded ${isDarkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-100'}`}
              >
                <Trash2 size={12} className={isDarkMode ? 'text-red-400' : 'text-red-500'} />
              </button>
            </div>
          </div>

          {/* Group links (expanded) */}
          {expandedGroup === groupIndex && (
            <div className={`p-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className="space-y-1">
                {group.links.map((link, linkIndex) => (
                  <div
                    key={linkIndex}
                    className={`flex items-center justify-between p-2 rounded ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <LinkIcon size={12} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                      <input
                        type="text"
                        value={link.text}
                        onChange={(e) => handleUpdateLink(groupIndex, linkIndex, { text: e.target.value })}
                        className={`flex-1 min-w-0 p-1 text-xs border-0 bg-transparent ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}
                        placeholder="Link text"
                      />
                      <input
                        type="text"
                        value={link.href}
                        onChange={(e) => handleUpdateLink(groupIndex, linkIndex, { href: e.target.value })}
                        className={`flex-1 min-w-0 p-1 text-xs border-0 bg-transparent ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}
                        placeholder="URL"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteLink(groupIndex, linkIndex)}
                      className={`p-1 rounded ${isDarkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-100'}`}
                    >
                      <Trash2 size={12} className={isDarkMode ? 'text-red-400' : 'text-red-500'} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add link to group */}
              {addingLinkToGroup === groupIndex ? (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    value={newLink.text}
                    onChange={(e) => setNewLink({ ...newLink, text: e.target.value })}
                    placeholder="Link text"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={newLink.href}
                    onChange={(e) => setNewLink({ ...newLink, href: e.target.value })}
                    placeholder="URL"
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddLink(groupIndex)}
                      disabled={!newLink.text || !newLink.href}
                      className={`flex-1 px-2 py-1 text-xs font-medium rounded ${
                        isDarkMode ? 'bg-blue-600 text-white disabled:opacity-50' : 'bg-blue-600 text-white disabled:opacity-50'
                      }`}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingLinkToGroup(null);
                        setNewLink({ text: '', href: '' });
                      }}
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingLinkToGroup(groupIndex)}
                  className={`w-full mt-2 p-1.5 text-xs rounded border border-dashed flex items-center justify-center gap-1 ${
                    isDarkMode
                      ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400'
                      : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  <Plus size={12} />
                  Add Link
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add new group */}
      {isAddingGroup ? (
        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <input
            type="text"
            value={newGroupTitle}
            onChange={(e) => setNewGroupTitle(e.target.value)}
            placeholder="Group title (e.g., 'Resources', 'Company')"
            className={inputClass}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={handleAddGroup}
              disabled={!newGroupTitle.trim()}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded ${
                isDarkMode ? 'bg-blue-600 text-white disabled:opacity-50' : 'bg-blue-600 text-white disabled:opacity-50'
              }`}
            >
              Add Group
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingGroup(false);
                setNewGroupTitle('');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded ${
                isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAddingGroup(true)}
          className={`w-full p-2 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 transition-colors ${
            isDarkMode
              ? 'border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400'
              : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600'
          }`}
        >
          <Plus size={14} />
          <span className="text-xs font-medium">Add Link Group</span>
        </button>
      )}
    </div>
  );
}


/**
 * SecondaryLinksEditor - Edit footer secondary links (terms, privacy, etc.)
 * Requirements: 3.5
 */
interface SecondaryLinksEditorProps {
  links: FooterLink[];
  onChange: (links: FooterLink[]) => void;
  isDarkMode: boolean;
}

function SecondaryLinksEditor({ links, onChange, isDarkMode }: SecondaryLinksEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newLink, setNewLink] = useState<FooterLink>({ text: '', href: '' });

  const inputClass = `w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
  }`;

  const handleAdd = () => {
    if (newLink.text && newLink.href) {
      onChange([...links, newLink]);
      setNewLink({ text: '', href: '' });
      setIsAdding(false);
    }
  };

  const handleUpdate = (index: number, updates: Partial<FooterLink>) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], ...updates };
    onChange(newLinks);
  };

  const handleDelete = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Secondary links appear at the bottom of the footer (e.g., Terms, Privacy Policy)
      </div>

      {/* Existing links */}
      <div className="space-y-2">
        {links.map((link, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 p-2 rounded-lg ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}
          >
            <LinkIcon size={14} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
            <input
              type="text"
              value={link.text}
              onChange={(e) => handleUpdate(index, { text: e.target.value })}
              className={`flex-1 p-1.5 text-sm border rounded ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-200'
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
              placeholder="Link text"
            />
            <input
              type="text"
              value={link.href}
              onChange={(e) => handleUpdate(index, { href: e.target.value })}
              className={`flex-1 p-1.5 text-sm border rounded ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-200'
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
              placeholder="URL"
            />
            <button
              type="button"
              onClick={() => handleDelete(index)}
              className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-100'}`}
            >
              <Trash2 size={14} className={isDarkMode ? 'text-red-400' : 'text-red-500'} />
            </button>
          </div>
        ))}
      </div>

      {/* Add new link */}
      {isAdding ? (
        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <div className="space-y-2">
            <input
              type="text"
              value={newLink.text}
              onChange={(e) => setNewLink({ ...newLink, text: e.target.value })}
              placeholder="Link text (e.g., 'Terms of Service')"
              className={inputClass}
            />
            <input
              type="text"
              value={newLink.href}
              onChange={(e) => setNewLink({ ...newLink, href: e.target.value })}
              placeholder="URL (e.g., '/terms')"
              className={inputClass}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newLink.text || !newLink.href}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded ${
                  isDarkMode ? 'bg-blue-600 text-white disabled:opacity-50' : 'bg-blue-600 text-white disabled:opacity-50'
                }`}
              >
                Add Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewLink({ text: '', href: '' });
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded ${
                  isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className={`w-full p-2 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 transition-colors ${
            isDarkMode
              ? 'border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400'
              : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600'
          }`}
        >
          <Plus size={14} />
          <span className="text-xs font-medium">Add Secondary Link</span>
        </button>
      )}
    </div>
  );
}

/**
 * SocialLinksEditor - Edit footer social links with icon picker
 * Requirements: 3.6
 */
interface SocialLinksEditorProps {
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
  isDarkMode: boolean;
}

function SocialLinksEditor({ links, onChange, isDarkMode }: SocialLinksEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newLink, setNewLink] = useState<SocialLink>({ ariaLabel: '', icon: '', href: '' });

  const inputClass = `w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
  }`;

  const handleAdd = () => {
    if (newLink.ariaLabel && newLink.icon && newLink.href) {
      onChange([...links, newLink]);
      setNewLink({ ariaLabel: '', icon: '', href: '' });
      setIsAdding(false);
    }
  };

  const handleUpdate = (index: number, updates: Partial<SocialLink>) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], ...updates };
    onChange(newLinks);
  };

  const handleDelete = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  return (
    <div className="space-y-2">
      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Social media links with icons displayed in the footer
      </div>

      {/* Existing links */}
      <div className="space-y-2">
        {links.map((link, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg border ${isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
          >
            {editingIndex === index ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={link.ariaLabel}
                  onChange={(e) => handleUpdate(index, { ariaLabel: e.target.value })}
                  placeholder="Label (e.g., 'GitHub')"
                  className={inputClass}
                />
                <div>
                  <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Icon
                  </label>
                  <IconPicker
                    value={link.icon}
                    onChange={(icon) => handleUpdate(index, { icon })}
                    isDarkMode={isDarkMode}
                  />
                </div>
                <input
                  type="text"
                  value={link.href}
                  onChange={(e) => handleUpdate(index, { href: e.target.value })}
                  placeholder="URL"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setEditingIndex(null)}
                  className={`w-full px-3 py-1.5 text-xs font-medium rounded ${
                    isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                  }`}
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {link.icon || 'No icon'}
                  </span>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {link.ariaLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingIndex(index)}
                    className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                  >
                    <Edit2 size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-100'}`}
                  >
                    <Trash2 size={14} className={isDarkMode ? 'text-red-400' : 'text-red-500'} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new social link */}
      {isAdding ? (
        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <div className="space-y-2">
            <input
              type="text"
              value={newLink.ariaLabel}
              onChange={(e) => setNewLink({ ...newLink, ariaLabel: e.target.value })}
              placeholder="Label (e.g., 'GitHub', 'Twitter')"
              className={inputClass}
            />
            <div>
              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Icon
              </label>
              <IconPicker
                value={newLink.icon}
                onChange={(icon) => setNewLink({ ...newLink, icon })}
                isDarkMode={isDarkMode}
              />
            </div>
            <input
              type="text"
              value={newLink.href}
              onChange={(e) => setNewLink({ ...newLink, href: e.target.value })}
              placeholder="URL (e.g., 'https://github.com/username')"
              className={inputClass}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newLink.ariaLabel || !newLink.icon || !newLink.href}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded ${
                  isDarkMode ? 'bg-blue-600 text-white disabled:opacity-50' : 'bg-blue-600 text-white disabled:opacity-50'
                }`}
              >
                Add Social Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewLink({ ariaLabel: '', icon: '', href: '' });
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded ${
                  isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className={`w-full p-2 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 transition-colors ${
            isDarkMode
              ? 'border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400'
              : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600'
          }`}
        >
          <Plus size={14} />
          <span className="text-xs font-medium">Add Social Link</span>
        </button>
      )}
    </div>
  );
}

/**
 * FooterNoteEditor - Edit footer note with HTML support
 * Requirements: 3.4
 */
interface FooterNoteEditorProps {
  note: string;
  onChange: (note: string) => void;
  isDarkMode: boolean;
}

function FooterNoteEditor({ note, onChange, isDarkMode }: FooterNoteEditorProps) {
  const textareaClass = `w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors resize-none ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
  }`;

  return (
    <div className="space-y-2">
      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Footer note displayed at the bottom. Supports HTML for links and formatting.
      </div>

      <textarea
        value={note}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Copyright © 2024 - Built with <a href='https://astro.build'>Astro</a>"
        rows={4}
        className={textareaClass}
      />

      {/* Preview */}
      {note && (
        <div className="space-y-1">
          <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Preview:
          </div>
          <div
            className={`p-3 rounded-lg text-sm ${
              isDarkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}
            dangerouslySetInnerHTML={{ __html: note }}
          />
        </div>
      )}

      {/* Quick templates */}
      <div className="space-y-1">
        <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Quick templates:
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => onChange(`Copyright © ${new Date().getFullYear()} - Your Company Name`)}
            className={`px-2 py-1 text-xs rounded ${
              isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Simple Copyright
          </button>
          <button
            type="button"
            onClick={() =>
              onChange(
                `Copyright © ${new Date().getFullYear()} - Built with <a class="text-blue-600 underline" href="https://astro.build">Astro</a>`
              )
            }
            className={`px-2 py-1 text-xs rounded ${
              isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            With Astro Link
          </button>
        </div>
      </div>
    </div>
  );
}

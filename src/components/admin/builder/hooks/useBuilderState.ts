import { useState, useRef, useEffect } from 'react';
import type { BuilderBlock, PageMetadata } from '../core/types';
import { useAutoSave } from './useAutoSave';
import { useBuilderHistory } from './useBuilderHistory';
import { usePreviewSync } from './usePreviewSync';
import { useWidgetRegistry } from './useWidgetRegistry';
import { useBuilderResponsive } from './useBuilderResponsive';

export type BuilderMode = 'create' | 'edit';
export type ViewType = 'pages' | 'builder';
export type PreviewMode = 'desktop' | 'mobile';

export interface BuilderState {
  // View state
  currentView: ViewType;
  editingPath: string | null;
  builderMode: BuilderMode;
  showBlocksPanel: boolean;
  showPropsPanel: boolean;
  
  // Core state
  blocks: BuilderBlock[];
  selectedId: string | null;
  metadata: PageMetadata;
  previewMode: PreviewMode;
  
  // Modal state
  isSaveModalOpen: boolean;
  isSaving: boolean;
  isDownloadMenuOpen: boolean;
  isTemplateModalOpen: boolean;
  isPasteModalOpen: boolean;
  pasteJsonText: string;
  isAIPromptModalOpen: boolean;
  websiteDescription: string;
  isWidgetManagerOpen: boolean;
  
  // UI state
  isDarkMode: boolean;
  searchQuery: string;
  collapsedCategories: Set<string>;
}

export interface BuilderStateSetters {
  setCurrentView: React.Dispatch<React.SetStateAction<ViewType>>;
  setEditingPath: React.Dispatch<React.SetStateAction<string | null>>;
  setBuilderMode: React.Dispatch<React.SetStateAction<BuilderMode>>;
  setShowBlocksPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPropsPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setBlocks: React.Dispatch<React.SetStateAction<BuilderBlock[]>>;
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
  setMetadata: React.Dispatch<React.SetStateAction<PageMetadata>>;
  setPreviewMode: React.Dispatch<React.SetStateAction<PreviewMode>>;
  setIsSaveModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDownloadMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTemplateModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPasteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPasteJsonText: React.Dispatch<React.SetStateAction<string>>;
  setIsAIPromptModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setWebsiteDescription: React.Dispatch<React.SetStateAction<string>>;
  setIsWidgetManagerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setCollapsedCategories: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function useBuilderState() {
  // --- View Mode State ---
  const [currentView, setCurrentView] = useState<ViewType>('pages');
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [builderMode, setBuilderMode] = useState<BuilderMode>('create');
  const [showBlocksPanel, setShowBlocksPanel] = useState(true);
  const [showPropsPanel, setShowPropsPanel] = useState(true);

  // --- Core State ---
  const [blocks, setBlocks] = useState<BuilderBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<PageMetadata>({ title: 'Untitled Page', description: '' });
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');

  // --- Modal State ---
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteJsonText, setPasteJsonText] = useState('');
  const [isAIPromptModalOpen, setIsAIPromptModalOpen] = useState(false);
  const [websiteDescription, setWebsiteDescription] = useState('');
  const [isWidgetManagerOpen, setIsWidgetManagerOpen] = useState(false);

  // --- Refs ---
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- UI State ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('builder-dark-mode') === 'true';
    }
    return false;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // --- Custom Hooks ---
  const { pushToHistory, undo, redo, canUndo, canRedo, history } = useBuilderHistory([]);
  const { lastSaved, loadFromStorage, clearStorage } = useAutoSave(blocks, metadata, true);
  usePreviewSync(currentView === 'builder' ? blocks : [], metadata, iframeRef);
  const widgetRegistry = useWidgetRegistry();
  const { layoutMode } = useBuilderResponsive();
  const showMobileLayout = layoutMode === 'mobile';

  // --- Persist Dark Mode ---
  useEffect(() => {
    localStorage.setItem('builder-dark-mode', String(isDarkMode));
  }, [isDarkMode]);

  // --- Track blocks changes to history ---
  useEffect(() => {
    if (blocks.length > 0 || history.length > 1) {
      pushToHistory(blocks);
    }
  }, [blocks]);

  // --- Load from localStorage on mount ---
  useEffect(() => {
    if (currentView === 'builder' && !editingPath) {
      const saved = loadFromStorage();
      if (saved && saved.blocks.length > 0) {
        setBlocks(saved.blocks);
        if (saved.metadata) setMetadata(saved.metadata);
      }
    }
  }, [currentView, editingPath]);

  const state: BuilderState = {
    currentView,
    editingPath,
    builderMode,
    showBlocksPanel,
    showPropsPanel,
    blocks,
    selectedId,
    metadata,
    previewMode,
    isSaveModalOpen,
    isSaving,
    isDownloadMenuOpen,
    isTemplateModalOpen,
    isPasteModalOpen,
    pasteJsonText,
    isAIPromptModalOpen,
    websiteDescription,
    isWidgetManagerOpen,
    isDarkMode,
    searchQuery,
    collapsedCategories,
  };

  const setters: BuilderStateSetters = {
    setCurrentView,
    setEditingPath,
    setBuilderMode,
    setShowBlocksPanel,
    setShowPropsPanel,
    setBlocks,
    setSelectedId,
    setMetadata,
    setPreviewMode,
    setIsSaveModalOpen,
    setIsSaving,
    setIsDownloadMenuOpen,
    setIsTemplateModalOpen,
    setIsPasteModalOpen,
    setPasteJsonText,
    setIsAIPromptModalOpen,
    setWebsiteDescription,
    setIsWidgetManagerOpen,
    setIsDarkMode,
    setSearchQuery,
    setCollapsedCategories,
  };

  return {
    state,
    setters,
    refs: { iframeRef, fileInputRef },
    history: { pushToHistory, undo, redo, canUndo, canRedo },
    autoSave: { lastSaved, loadFromStorage, clearStorage },
    widgetRegistry,
    showMobileLayout,
  };
}

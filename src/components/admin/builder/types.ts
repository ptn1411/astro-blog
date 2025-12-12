import type { WidgetType } from '../registry';

// --- Builder Block Type ---
export interface BuilderBlock {
  id: string;
  type: WidgetType;
  props: Record<string, unknown>;
}

// --- Metadata Type ---
export interface PageMetadata {
  title: string;
  description: string;
}

// --- Template Type ---
export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  blocks: Omit<BuilderBlock, 'id'>[];
}

// --- Component Props Types ---
export interface CanvasItemProps {
  block: BuilderBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  isDarkMode: boolean;
}

export interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (path: string, message: string) => void;
  isSaving: boolean;
}

export interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (templateId: string) => void;
  onClear: () => void;
  isDarkMode: boolean;
}

export interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  historyIndex: number;
  historyLength: number;
  onUndo: () => void;
  onRedo: () => void;
  lastSaved: Date | null;
  onOpenTemplates: () => void;
  onOpenSave: () => void;
  onExportJSON: () => void;
  onExportMDX: () => void;
  onImport: () => void;
  onOpenPreview: () => void;
  previewMode: 'desktop' | 'mobile';
  setPreviewMode: (mode: 'desktop' | 'mobile') => void;
}

export interface SidebarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  collapsedCategories: Set<string>;
  toggleCategory: (categoryId: string) => void;
  isDarkMode: boolean;
}

export interface CanvasProps {
  blocks: BuilderBlock[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  isDarkMode: boolean;
  previewMode: 'desktop' | 'mobile';
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

export interface PropsEditorProps {
  selectedBlock: BuilderBlock | null;
  onUpdateProps: (id: string, props: Record<string, unknown>) => void;
  isDarkMode: boolean;
  metadata: PageMetadata;
  setMetadata: (metadata: PageMetadata) => void;
}

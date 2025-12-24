import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ChevronDown,
  ChevronRight,
  Clipboard,
  CloudUpload,
  Code,
  Copy,
  Download,
  ExternalLink,
  Files,
  FileText,
  Layers,
  Monitor,
  Moon,
  PanelLeft,
  PanelRight,
  PenSquare,
  Plus,
  Redo2,
  Save,
  Search,
  Smartphone,
  Sparkles,
  Sun,
  Undo2,
  Upload,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { toMDX } from '~/utils/serializer';

import { getPendingImages, uploadAllPendingImages } from './ImagePicker';
import { PropsEditor } from './components/PropsEditor';
import { WIDGET_CATEGORIES, WIDGET_REGISTRY, type WidgetType } from './registry';

// Import from builder modules
import PagesManager from './PagesManager';
import {
  CanvasItem,
  deepClone,
  exportJSON,
  exportMDX,
  generateId,
  getGitHubToken,
  isLocalEnvironment,
  PAGE_TEMPLATES,
  parseImportedJSON,
  saveLocally,
  SaveModal,
  saveToGitHub,
  SidebarItem,
  TemplateModal,
  useAutoSave,
  useBuilderHistory,
  usePreviewSync,
  type BuilderBlock,
  type PageMetadata,
} from './index';

// Import responsive hook and mobile layout
import { useBuilderResponsive } from './hooks/useBuilderResponsive';
import { MobileBuilderLayout, MobilePagesManager, type PageInfo } from './mobile';
export type BuilderMode = 'create' | 'edit';
// --- Main Builder Component ---
export default function BuilderApp() {
  // --- View Mode State ---
  const [currentView, setCurrentView] = useState<'pages' | 'builder'>('pages');
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [builderMode, setBuilderMode] = useState<BuilderMode>('create');
  const [showBlocksPanel, setShowBlocksPanel] = useState(true);
  const [showPropsPanel, setShowPropsPanel] = useState(true);
  // --- Core State ---
  const [blocks, setBlocks] = useState<BuilderBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<PageMetadata>({ title: 'Untitled Page', description: '' });
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteJsonText, setPasteJsonText] = useState('');
  const [isAIPromptModalOpen, setIsAIPromptModalOpen] = useState(false);
  const [websiteDescription, setWebsiteDescription] = useState('');

  // Refs
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
  // Only sync preview when in builder view
  usePreviewSync(currentView === 'builder' ? blocks : [], metadata, iframeRef);
  
  // --- Responsive Layout Hook (Requirements: 1.1, 1.2, 1.3) ---
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

  // --- Load from localStorage on mount (only for builder view) ---
  useEffect(() => {
    if (currentView === 'builder' && !editingPath) {
      const saved = loadFromStorage();
      if (saved && saved.blocks.length > 0) {
        setBlocks(saved.blocks);
        if (saved.metadata) setMetadata(saved.metadata);
      }
    }
  }, [currentView, editingPath]);

  // --- Handle editing a page from PagesManager ---
  const handleEditPage = (pageData: { blocks: BuilderBlock[]; metadata: PageMetadata; path: string }) => {
    setBlocks(pageData.blocks);
    setMetadata(pageData.metadata);
    setEditingPath(pageData.path);
    setCurrentView('builder');
    setSelectedId(null);
    setBuilderMode('edit');
  };

  // --- Create new page ---
  const handleCreateNew = () => {
    setBlocks([]);
    setMetadata({ title: 'Untitled Page', description: '' });
    setEditingPath(null);
    setCurrentView('builder');
    setSelectedId(null);
    setBuilderMode('create');
    clearStorage();
  };

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const result = undo();
        if (result) setBlocks(result);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        const result = redo();
        if (result) setBlocks(result);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // --- DND Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- Actions ---
  const handleSave = async (path: string, message: string) => {
    setIsSaving(true);
    try {
      const content = toMDX(blocks, metadata);
      if (isLocalEnvironment()) {
        await saveLocally(path, content);
        alert('Saved locally!');
      } else {
        const token = getGitHubToken();
        if (!token) {
          alert('Not authenticated. Please log in via CMS first.');
          return;
        }

        // Upload pending images first
        const pendingImages = getPendingImages();
        if (pendingImages.length > 0) {
          const confirmUpload = confirm(
            `Có ${pendingImages.length} hình ảnh đang chờ upload.\nBạn có muốn upload lên GitHub không?`
          );
          if (confirmUpload) {
            await uploadAllPendingImages((current, total, fileName) => {
              console.log(`Uploading image ${current}/${total}: ${fileName}`);
            });
          }
        }

        await saveToGitHub({ path, content, message, token });
        alert('Saved successfully to GitHub!');
      }
      setIsSaveModalOpen(false);
    } catch (e: unknown) {
      const error = e as Error;
      console.error('Save failed', error);
      alert(`Save failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const addBlock = (type: WidgetType) => {
    const def = WIDGET_REGISTRY.find((w) => w.type === type);
    if (!def) return;
    const newBlock: BuilderBlock = {
      id: generateId(),
      type,
      props: deepClone(def.defaultProps),
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedId(newBlock.id);
  };

  const updateBlockProps = (id: string, newProps: Record<string, unknown>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, props: newProps } : b)));
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      if (selectedId === id) setSelectedId(null);
      return next;
    });
  };

  const duplicateBlock = (id: string) => {
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    const newBlock: BuilderBlock = {
      id: generateId(),
      type: block.type,
      props: deepClone(block.props),
    };
    const index = blocks.findIndex((b) => b.id === id);
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, newBlock);
      return next;
    });
    setSelectedId(newBlock.id);
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const applyTemplate = (templateId: string) => {
    const template = PAGE_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      const newBlocks = template.blocks.map((b) => ({
        id: generateId(),
        type: b.type,
        props: deepClone(b.props),
      }));
      setBlocks(newBlocks);
      setIsTemplateModalOpen(false);
    }
  };

  const clearPage = () => {
    if (confirm('Clear all blocks? This cannot be undone.')) {
      setBlocks([]);
      clearStorage();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const openPreviewInNewTab = () => {
    localStorage.setItem('astro-builder-blocks', JSON.stringify({ blocks, metadata }));
    window.open('/admin/preview', '_blank');
  };

  const handleExportJSON = () => exportJSON(blocks, metadata);
  const handleExportMDX = () => exportMDX(blocks, metadata);

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseImportedJSON(text);
      if (result.success && result.blocks) {
        setBlocks(result.blocks);
        if (result.metadata) setMetadata(result.metadata);
        alert('Imported successfully!');
      } else {
        alert(result.error || 'Import failed');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    if (!pasteJsonText.trim()) {
      alert('Please paste JSON content first');
      return;
    }
    const result = parseImportedJSON(pasteJsonText);
    if (result.success && result.blocks) {
      setBlocks(result.blocks);
      if (result.metadata) setMetadata(result.metadata);
      setPasteJsonText('');
      setIsPasteModalOpen(false);
      alert('Imported successfully!');
    } else {
      alert(result.error || 'Import failed');
    }
  };

  const generateAIPrompt = () => {
    const widgetDocs = WIDGET_REGISTRY.map((w) => {
      const fieldsDoc = w.fields
        .map((f) => {
          let fieldInfo = `    - ${f.name} (${f.type}): ${f.label}`;
          if (f.type === 'array' && f.arraySchema) {
            fieldInfo += `\n      ArraySchema: ${JSON.stringify(f.arraySchema)}`;
          }
          return fieldInfo;
        })
        .join('\n');
      return `## ${w.type} (${w.label}) - Category: ${w.category}\n  Default Props: ${JSON.stringify(w.defaultProps, null, 2)}\n  Fields:\n${fieldsDoc}`;
    }).join('\n\n');

    return `Bạn là một AI chuyên gia tạo JSON cho Astro Page Builder. Tạo JSON theo đúng format dưới đây.

=== MÔ TẢ TRANG WEB CẦN TẠO ===
${websiteDescription || '[Thêm mô tả trang web của bạn ở đây]'}

=== OUTPUT FORMAT (BẮT BUỘC) ===
\`\`\`json
{
  "blocks": [
    {
      "id": "unique-id-1",
      "type": "WidgetType",
      "props": { ...widget props... }
    }
  ],
  "metadata": {
    "title": "Page Title",
    "description": "Page description for SEO"
  }
}
\`\`\`

=== DANH SÁCH WIDGETS CÓ SẴN ===

${widgetDocs}

=== ANIMATION EFFECTS (HIỆU ỨNG) ===

Hệ thống hỗ trợ 2 engine animation: GSAP và Anime.js

**Animation Engine Options:**
- "gsap" - GSAP animation library (mạnh mẽ, hiệu suất cao)
- "anime" - Anime.js library (nhẹ, dễ sử dụng)

**Entrance Animations (Hiệu ứng xuất hiện):**
- fadeIn - Mờ dần vào
- fadeInUp - Mờ dần từ dưới lên
- fadeInDown - Mờ dần từ trên xuống
- fadeInLeft - Mờ dần từ trái sang
- fadeInRight - Mờ dần từ phải sang
- zoomIn - Phóng to vào
- rotateIn - Xoay vào
- scaleIn - Scale vào (anime.js)
- bounceIn - Nảy vào (anime.js)
- elasticIn - Đàn hồi vào (anime.js)
- slideInX - Trượt ngang (anime.js)
- slideInY - Trượt dọc (anime.js)

**Loop Animations (Hiệu ứng lặp):**
- pulse - Nhịp đập
- float - Lơ lửng
- spin - Xoay tròn
- wiggle - Lắc lư
- swing - Đung đưa
- tada - Nhấn mạnh
- bounce - Nảy

**Cách sử dụng Animation trong props:**

1. Animation cho toàn widget (áp dụng cho Hero, Features, Stats, etc.):
\`\`\`json
{
  "animationEngine": "gsap",
  "animationType": "fadeInUp",
  "animationDuration": 1000,
  "animationDelay": 0,
  "loopAnimation": "pulse"
}
\`\`\`

2. Animation cho từng phần tử (Hero - title và image):
\`\`\`json
{
  "titleAnimationType": "fadeInUp",
  "titleAnimationDuration": 800,
  "titleAnimationDelay": 0,
  "imageAnimationType": "zoomIn",
  "imageAnimationDuration": 1000,
  "imageAnimationDelay": 200
}
\`\`\`

3. Animation cho items (Features, Content1):
\`\`\`json
{
  "itemAnimationType": "fadeInUp",
  "itemAnimationDuration": 600,
  "itemAnimationDelay": 100
}
\`\`\`

=== QUY TẮC ===
1. Mỗi block phải có: id (unique string), type (từ danh sách trên), props (theo defaultProps)
2. Sử dụng icon format: "tabler:icon-name" (ví dụ: tabler:check, tabler:star, tabler:rocket)
3. Image URLs có thể dùng Unsplash: https://images.unsplash.com/photo-xxx
4. Đảm bảo JSON valid, không có trailing comma
5. Tạo nội dung phù hợp với mô tả trang web
6. Thêm animation effects để trang web sinh động hơn

=== VÍ DỤ MẪU ===
\`\`\`json
{
  "blocks": [
    {
      "id": "hero-1",
      "type": "Hero",
      "props": {
        "title": "Welcome to Our Site",
        "subtitle": "Build amazing things",
        "tagline": "Hello",
        "actions": [{ "variant": "primary", "text": "Get Started", "href": "#" }],
        "titleAnimationType": "fadeInUp",
        "titleAnimationDuration": 800,
        "imageAnimationType": "zoomIn",
        "imageAnimationDuration": 1000,
        "imageAnimationDelay": 200
      }
    },
    {
      "id": "features-1",
      "type": "Features",
      "props": {
        "title": "Our Features",
        "items": [
          { "title": "Fast", "description": "Lightning speed", "icon": "tabler:rocket" },
          { "title": "Secure", "description": "Bank-level security", "icon": "tabler:shield-check" }
        ],
        "itemAnimationType": "fadeInUp",
        "itemAnimationDuration": 600,
        "itemAnimationDelay": 100
      }
    },
    {
      "id": "stats-1",
      "type": "Stats",
      "props": {
        "title": "Our Impact",
        "stats": [
          { "title": "Users", "amount": "50K+", "icon": "tabler:users" },
          { "title": "Downloads", "amount": "100K+", "icon": "tabler:download" },
          { "title": "Countries", "amount": "30+", "icon": "tabler:world" }
        ],
        "animationEngine": "gsap",
        "animationType": "fadeIn",
        "animationDuration": 800
      }
    },
    {
      "id": "testimonials-1",
      "type": "Testimonials",
      "props": {
        "title": "What Clients Say",
        "testimonials": [
          { "name": "John Doe", "job": "CEO", "testimonial": "Amazing product!", "image": { "src": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300", "alt": "John" } }
        ],
        "animationEngine": "anime",
        "animationType": "bounceIn",
        "animationDuration": 1000
      }
    },
    {
      "id": "pricing-1",
      "type": "Pricing",
      "props": {
        "title": "Simple Pricing",
        "prices": [
          { "title": "Basic", "price": 29, "period": "/month", "items": [{ "description": "Feature 1" }, { "description": "Feature 2" }], "callToAction": { "text": "Start Free", "href": "#" } },
          { "title": "Pro", "price": 99, "period": "/month", "hasRibbon": true, "ribbonTitle": "Popular", "items": [{ "description": "All Basic features" }, { "description": "Priority support" }], "callToAction": { "text": "Get Started", "href": "#" } }
        ],
        "animationType": "fadeInUp",
        "animationDuration": 800
      }
    },
    {
      "id": "team-1",
      "type": "Team",
      "props": {
        "title": "Our Team",
        "members": [
          { "name": "Jane Smith", "role": "Founder", "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300", "bio": "Visionary leader" }
        ],
        "animationType": "zoomIn",
        "animationDuration": 700
      }
    },
    {
      "id": "timeline-1",
      "type": "Timeline",
      "props": {
        "title": "Our Journey",
        "items": [
          { "year": "2020", "title": "Founded", "description": "Started the company", "icon": "tabler:rocket" },
          { "year": "2023", "title": "Growth", "description": "Reached 50K users", "icon": "tabler:trending-up" }
        ],
        "animationType": "fadeInLeft",
        "animationDuration": 600
      }
    },
    {
      "id": "faq-1",
      "type": "FAQs",
      "props": {
        "title": "FAQ",
        "items": [
          { "title": "How does it work?", "description": "Simply sign up and start using our platform." },
          { "title": "Is there a free trial?", "description": "Yes, 14 days free trial for all plans." }
        ],
        "animationType": "fadeIn",
        "animationDuration": 500
      }
    },
    {
      "id": "cta-1",
      "type": "CallToAction",
      "props": {
        "title": "Ready to Start?",
        "subtitle": "Join thousands of happy customers",
        "actions": [{ "variant": "primary", "text": "Get Started Free", "href": "#" }],
        "animationType": "fadeInUp",
        "animationDuration": 800,
        "loopAnimation": "pulse"
      }
    }
  ],
  "metadata": {
    "title": "My Website",
    "description": "A great website"
  }
}
\`\`\`

=== THÊM VÍ DỤ WIDGETS PHỔ BIẾN ===

Banner với animation:
\`\`\`json
{ "id": "banner-1", "type": "Banner", "props": { "title": "Sale 50% Off", "subtitle": "Limited time offer", "image": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200", "callToAction": { "text": "Shop Now", "href": "#" }, "variant": "gradient", "animationType": "fadeIn", "animationDuration": 1000 } }
\`\`\`

Cards với animation:
\`\`\`json
{ "id": "cards-1", "type": "Cards", "props": { "title": "Services", "columns": 3, "cards": [{ "title": "Web Dev", "description": "Modern websites", "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400", "link": "#" }], "animationType": "fadeInUp", "animationDuration": 600, "animationDelay": 100 } }
\`\`\`

Gallery với animation:
\`\`\`json
{ "id": "gallery-1", "type": "Gallery", "props": { "title": "Portfolio", "columns": 3, "images": [{ "src": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600", "alt": "Project 1" }], "animationType": "zoomIn", "animationDuration": 500 } }
\`\`\`

Newsletter với animation:
\`\`\`json
{ "id": "newsletter-1", "type": "Newsletter", "props": { "title": "Subscribe", "subtitle": "Get updates", "placeholder": "Your email", "buttonText": "Subscribe", "animationType": "fadeInUp", "animationDuration": 700 } }
\`\`\`

SocialLinks với animation:
\`\`\`json
{ "id": "social-1", "type": "SocialLinks", "props": { "title": "Follow Us", "style": "icons", "links": [{ "platform": "facebook", "url": "#", "icon": "tabler:brand-facebook" }, { "platform": "twitter", "url": "#", "icon": "tabler:brand-twitter" }], "animationType": "bounceIn", "animationEngine": "anime", "animationDuration": 800 } }
\`\`\`

Contact với animation:
\`\`\`json
{ "id": "contact-1", "type": "Contact", "props": { "title": "Contact Us", "inputs": [{ "type": "text", "name": "name", "label": "Name" }, { "type": "email", "name": "email", "label": "Email" }], "textarea": { "label": "Message" }, "button": "Send", "animationType": "fadeIn", "animationDuration": 600 } }
\`\`\`

EffectsWidget (Widget chuyên về hiệu ứng):
\`\`\`json
{ "id": "effects-1", "type": "EffectsWidget", "props": { "title": "Animation Showcase", "subtitle": "See our effects in action", "items": [{ "title": "Fade Effect", "animation": "fadeIn", "engine": "gsap" }, { "title": "Bounce Effect", "animation": "bounceIn", "engine": "anime" }, { "title": "Rotate Effect", "animation": "rotateIn", "engine": "gsap" }] } }
\`\`\`

Hãy tạo JSON hoàn chỉnh cho trang web theo mô tả trên, nhớ thêm các hiệu ứng animation phù hợp để trang web sinh động và chuyên nghiệp hơn.`;
  };

  const copyPromptToClipboard = async () => {
    const prompt = generateAIPrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      alert('Đã copy prompt! Paste vào ChatGPT/Claude để tạo JSON.');
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = prompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Đã copy prompt!');
    }
  };

  // --- Listen for sidebar widget clicks ---
  useEffect(() => {
    const handler = (e: CustomEvent) => addBlock(e.detail);
    window.addEventListener('add-widget' as keyof WindowEventMap, handler as EventListener);
    return () => window.removeEventListener('add-widget' as keyof WindowEventMap, handler as EventListener);
  }, []);

  // --- Derived State ---
  const filteredWidgets = WIDGET_REGISTRY.filter((widget) =>
    widget.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedBlock = blocks.find((b) => b.id === selectedId);
  const selectedDef = selectedBlock ? WIDGET_REGISTRY.find((w) => w.type === selectedBlock.type) : null;

  // --- Mobile-specific callbacks (memoized for performance - Requirement 10.4) ---
  const handleMobileUndo = useCallback(() => {
    const result = undo();
    if (result) setBlocks(result);
  }, [undo]);

  const handleMobileRedo = useCallback(() => {
    const result = redo();
    if (result) setBlocks(result);
  }, [redo]);

  const handleMobilePasteJSON = useCallback((json: string) => {
    const result = parseImportedJSON(json);
    if (result.success && result.blocks) {
      setBlocks(result.blocks);
      if (result.metadata) setMetadata(result.metadata);
      alert('Imported successfully!');
    } else {
      alert(result.error || 'Import failed');
    }
  }, []);

  const handleMobileImportJSON = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Check if there are unsaved changes (for mobile layout)
  const hasUnsavedChanges = useMemo(() => {
    return blocks.length > 0 || metadata.title !== 'Untitled Page';
  }, [blocks, metadata.title]);

  // --- Render Mobile Layout when on mobile viewport (Requirements: 1.1, 1.2, 1.3) ---
  if (showMobileLayout) {
    return (
      <div className={`h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Hidden file input for import */}
        <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />
        
        {currentView === 'pages' ? (
          <MobilePagesManager
            pages={[]} // Pages will be fetched by the component
            isLoading={false}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onEditPage={(page: PageInfo) => {
              // Trigger edit flow - this will be handled by fetching page content
              handleEditPage({
                blocks: [],
                metadata: { title: page.title, description: page.description },
                path: page.path,
              });
            }}
            onDeletePage={() => {}}
            onPreviewPage={(page: PageInfo) => {
              const previewPath = page.path
                .replace(/^src\/content\/page\//, '/')
                .replace(/^src\/content\//, '/')
                .replace(/\.mdx?$/, '');
              window.open(previewPath, '_blank');
            }}
            onCreateNew={handleCreateNew}
            onRefresh={() => {}}
            isDarkMode={isDarkMode}
          />
        ) : (
          <MobileBuilderLayout
            blocks={blocks}
            selectedId={selectedId}
            metadata={metadata}
            onBlocksChange={setBlocks}
            onSelectBlock={setSelectedId}
            onMetadataChange={setMetadata}
            onSave={() => setIsSaveModalOpen(true)}
            onBack={() => setCurrentView('pages')}
            isDarkMode={isDarkMode}
            currentView={currentView}
            onViewChange={setCurrentView}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            editingPath={editingPath}
            onUndo={handleMobileUndo}
            onRedo={handleMobileRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            onExportJSON={handleExportJSON}
            onExportMDX={handleExportMDX}
            onImportJSON={handleMobileImportJSON}
            onPasteJSON={handleMobilePasteJSON}
            onClearPage={clearPage}
            onOpenTemplates={() => setIsTemplateModalOpen(true)}
            previewUrl="/admin/preview"
            saveMode={builderMode}
            onSaveWithPath={handleSave}
            aiPromptDescription={websiteDescription}
            onAIPromptDescriptionChange={setWebsiteDescription}
            generateAIPrompt={generateAIPrompt}
          />
        )}
        
        {/* Desktop modals still needed for mobile */}
        <SaveModal
          editingPath={editingPath}
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleSave}
          isSaving={isSaving}
          mode={builderMode}
        />
        <TemplateModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onApply={applyTemplate}
          onClear={clearPage}
          isDarkMode={isDarkMode}
        />
      </div>
    );
  }

  // --- Desktop Layout (original) ---

  return (
    <div
      className={`flex flex-col h-screen overflow-hidden transition-colors ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-slate-800'}`}
    >
      {/* Modals */}
      <SaveModal
        editingPath={editingPath}
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSave}
        isSaving={isSaving}
        mode={builderMode}
      />
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onApply={applyTemplate}
        onClear={clearPage}
        isDarkMode={isDarkMode}
      />

      {/* Paste JSON Modal */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-full max-w-2xl mx-4 rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div
              className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Import JSON</h2>
              <button
                onClick={() => {
                  setIsPasteModalOpen(false);
                  setPasteJsonText('');
                }}
                className={`p-1 rounded hover:bg-gray-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'}`}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Paste your JSON content below:
              </p>
              <textarea
                value={pasteJsonText}
                onChange={(e) => setPasteJsonText(e.target.value)}
                placeholder='{"blocks": [...], "metadata": {...}}'
                className={`w-full h-64 p-3 text-sm font-mono rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400'}`}
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setIsPasteModalOpen(false);
                    setPasteJsonText('');
                  }}
                  className={`px-4 py-2 text-sm rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasteImport}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Prompt Generator Modal */}
      {isAIPromptModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-4xl mx-4 rounded-lg shadow-xl max-h-[90vh] flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <div
              className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <h2
                className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
              >
                <Sparkles size={20} className="text-purple-500" />
                AI Prompt Generator
              </h2>
              <button
                onClick={() => setIsAIPromptModalOpen(false)}
                className={`p-1 rounded hover:bg-gray-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'}`}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  📝 Mô tả trang web cần tạo:
                </label>
                <textarea
                  value={websiteDescription}
                  onChange={(e) => setWebsiteDescription(e.target.value)}
                  placeholder="Ví dụ: Trang landing page cho công ty công nghệ, có hero section với hình ảnh, phần giới thiệu tính năng (3 cột), testimonials từ khách hàng, bảng giá 3 gói (Basic, Pro, Enterprise), phần FAQ và form liên hệ..."
                  className={`w-full h-32 p-3 text-sm rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400'}`}
                />
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  🤖 Prompt sẽ được tạo (Preview):
                </label>
                <div
                  className={`h-64 p-3 text-xs font-mono rounded-lg border overflow-y-auto whitespace-pre-wrap ${isDarkMode ? 'bg-gray-900 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'}`}
                >
                  {generateAIPrompt()}
                </div>
              </div>

              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-blue-800'}`}>
                  <strong>Hướng dẫn:</strong>
                </p>
                <ol
                  className={`text-sm mt-1 list-decimal list-inside space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-blue-700'}`}
                >
                  <li>Nhập mô tả trang web bạn muốn tạo ở trên</li>
                  <li>Click "Copy Prompt" để copy toàn bộ prompt</li>
                  <li>Paste vào ChatGPT, Claude, hoặc AI khác</li>
                  <li>Copy JSON kết quả từ AI</li>
                  <li>Quay lại đây, click "Paste JSON" để import</li>
                </ol>
              </div>
            </div>
            <div
              className={`flex justify-end gap-2 p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <button
                onClick={() => setIsAIPromptModalOpen(false)}
                className={`px-4 py-2 text-sm rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                Đóng
              </button>
              <button
                onClick={copyPromptToClipboard}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded font-medium"
              >
                <Copy size={16} /> Copy Prompt
              </button>
              <button
                onClick={() => {
                  setIsAIPromptModalOpen(false);
                  setIsPasteModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
              >
                <Clipboard size={16} /> Paste JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />

      {/* Header */}
      <header
        className={`px-4 py-3 flex items-center justify-between shadow-sm z-10 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Phạm Thành Nam - Astro Builder
          </h1>
          {/* View Toggle Tabs */}
          <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <button
              onClick={() => setCurrentView('pages')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                currentView === 'pages'
                  ? isDarkMode
                    ? 'bg-gray-600 text-white'
                    : 'bg-white shadow text-gray-800'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Files size={16} /> Pages
            </button>
            <button
              onClick={() => setCurrentView('builder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                currentView === 'builder'
                  ? isDarkMode
                    ? 'bg-gray-600 text-white'
                    : 'bg-white shadow text-gray-800'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <PenSquare size={16} /> Builder
            </button>
          </div>
          {/* Editing indicator */}
          {editingPath && currentView === 'builder' && (
            <span
              className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}
            >
              ✏️ Editing: {editingPath.split('/').pop()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentView === 'builder' && (
            <>
              {/* Undo/Redo */}
              <div className={`flex rounded-md p-1 mr-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <button
                  onClick={() => {
                    const r = undo();
                    if (r) setBlocks(r);
                  }}
                  disabled={!canUndo}
                  className={`p-1.5 rounded transition-colors ${!canUndo ? 'opacity-40 cursor-not-allowed' : isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 size={18} />
                </button>
                <button
                  onClick={() => {
                    const r = redo();
                    if (r) setBlocks(r);
                  }}
                  disabled={!canRedo}
                  className={`p-1.5 rounded transition-colors ${!canRedo ? 'opacity-40 cursor-not-allowed' : isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 size={18} />
                </button>
              </div>

              {/* Auto-save indicator */}
              {lastSaved && (
                <span className={`text-xs mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Save size={12} className="inline mr-1" />
                  {lastSaved.toLocaleTimeString()}
                </span>
              )}

              {/* Templates Button */}
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className={`p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                title="Page Templates"
              >
                <Layers size={20} />
              </button>

              {/* Preview Mode Toggle */}
              <div className={`flex rounded-md p-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-1.5 rounded ${previewMode === 'desktop' ? (isDarkMode ? 'bg-gray-600' : 'bg-white shadow') : ''}`}
                  title="Desktop"
                >
                  <Monitor size={18} />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-1.5 rounded ${previewMode === 'mobile' ? (isDarkMode ? 'bg-gray-600' : 'bg-white shadow') : ''}`}
                  title="Mobile"
                >
                  <Smartphone size={18} />
                </button>
              </div>
            </>
          )}
          {currentView === 'builder' && (
            <>
              <div className={`w-px h-4 mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
              <button
                onClick={() => setShowBlocksPanel(!showBlocksPanel)}
                className={`p-1.5 rounded-md transition-colors ${
                  showBlocksPanel
                    ? isDarkMode
                      ? 'bg-gray-600 text-white'
                      : 'bg-white shadow text-gray-800'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Toggle Blocks Panel"
              >
                <PanelLeft size={16} />
              </button>
              <button
                onClick={() => setShowPropsPanel(!showPropsPanel)}
                className={`p-1.5 rounded-md transition-colors ${
                  showPropsPanel
                    ? isDarkMode
                      ? 'bg-gray-600 text-white'
                      : 'bg-white shadow text-gray-800'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Toggle Properties Panel"
              >
                <PanelRight size={16} />
              </button>
              <div className={`w-px h-4 mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
            </>
          )}
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-600'}`}
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {currentView === 'builder' && (
            <>
              {/* Download Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                  className={`flex items-center gap-1 px-3 py-2 text-sm rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <Download size={18} /> More
                </button>
                {isDownloadMenuOpen && (
                  <>
                    {/* Overlay to close menu when clicking outside */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsDownloadMenuOpen(false)}
                    />
                    <div
                      className={`absolute right-0 top-full mt-1 w-48 rounded-lg shadow-xl z-20 py-1 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
                    >
                      <button
                        onClick={handleExportJSON}
                        className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                      >
                        <Code size={16} /> Export JSON
                      </button>
                      <button
                        onClick={handleExportMDX}
                        className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                      >
                        <FileText size={16} /> Export MDX
                      </button>
                      <hr className={`my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                      >
                        <Upload size={16} /> Import File
                      </button>
                      <button
                        onClick={() => {
                          setIsDownloadMenuOpen(false);
                          setIsPasteModalOpen(true);
                        }}
                        className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                      >
                        <Clipboard size={16} /> Paste JSON
                      </button>
                      <hr className={`my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                      <button
                        onClick={() => {
                          setIsDownloadMenuOpen(false);
                          setIsAIPromptModalOpen(true);
                        }}
                        className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-purple-400' : 'hover:bg-gray-50 text-purple-600'}`}
                      >
                        <Sparkles size={16} /> AI Prompt
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Save & Preview */}
              <button
                onClick={openPreviewInNewTab}
                className={`flex items-center gap-1 px-3 py-2 text-sm rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <ExternalLink size={18} /> Preview
              </button>
              <button
                onClick={() => setIsSaveModalOpen(true)}
                className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
              >
                <CloudUpload size={18} /> Save
              </button>
            </>
          )}

          {currentView === 'pages' && (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
            >
              <Plus size={18} /> New Page
            </button>
          )}
        </div>
      </header>

      {/* Main Content - Pages View */}
      {currentView === 'pages' && (
        <PagesManager onEditPage={handleEditPage} onCreateNew={handleCreateNew} isDarkMode={isDarkMode} />
      )}

      {/* Main Content - Builder View */}
      {currentView === 'builder' && (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div
            className={`w-64 flex-shrink-0 overflow-y-auto p-4 border-r ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            <div className="mb-4">
              <div className="relative">
                <Search
                  size={16}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                />
                <input
                  type="text"
                  placeholder="Search widgets..."
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {WIDGET_CATEGORIES.map((category) => {
              const categoryWidgets = filteredWidgets.filter((w) => w.category === category.id);
              if (categoryWidgets.length === 0) return null;
              const isCollapsed = collapsedCategories.has(category.id);

              return (
                <div key={category.id} className="mb-4">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 text-sm font-semibold rounded transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <span>{category.label}</span>
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {!isCollapsed && (
                    <div className="mt-2 space-y-2">
                      {categoryWidgets.map((widget) => (
                        <SidebarItem key={widget.type} widget={widget} isDarkMode={isDarkMode} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Canvas */}
          <div className={`flex-1 flex flex-col overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="flex-1 flex gap-4 p-4 overflow-hidden">
              {/* Blocks List */}
              {showBlocksPanel && (
                <div
                  className={`w-72 flex-shrink-0 overflow-y-auto rounded-lg border p-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Page Structure ({blocks.length})
                  </h3>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                      {blocks.map((block) => (
                        <CanvasItem
                          key={block.id}
                          block={block}
                          isSelected={selectedId === block.id}
                          onSelect={() => {
                            setSelectedId(block.id);
                            setShowPropsPanel(true);
                          }}
                          onDelete={(e) => {
                            e.stopPropagation();
                            deleteBlock(block.id);
                          }}
                          onDuplicate={(e) => {
                            e.stopPropagation();
                            duplicateBlock(block.id);
                          }}
                          isDarkMode={isDarkMode}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                  {blocks.length === 0 && (
                    <div className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <p className="text-sm">No blocks yet</p>
                      <p className="text-xs mt-1">Click a widget to add</p>
                    </div>
                  )}
                </div>
              )}

              {/* Preview */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div
                  className={`flex-1 rounded-lg border overflow-hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
                >
                  <iframe
                    ref={iframeRef}
                    className={`w-full h-full ${previewMode === 'mobile' ? 'max-w-[375px] mx-auto' : ''}`}
                    title="Preview"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          {showPropsPanel && (
            <div
              className={`w-80 flex-shrink-0 overflow-y-auto p-4 border-l ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {selectedBlock ? `Edit: ${selectedDef?.label || selectedBlock.type}` : 'Page Settings'}
              </h3>
              <PropsEditor
                selectedBlock={selectedBlock || null}
                selectedDef={selectedDef || null}
                updateBlockProps={updateBlockProps}
                metadata={metadata}
                setMetadata={setMetadata}
                isDarkMode={isDarkMode}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

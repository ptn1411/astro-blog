import React, { useState, useRef, useCallback } from 'react';
import {
  AtSign,
  BarChart3,
  CheckCircle2,
  Code2,
  Divide,
  Hash,
  LayoutTemplate,
  Link2,
  List,
  Loader2,
  MapPin,
  MousePointerClick,
  Music,
  Play,
  QrCode,
  Quote,
  Search,
  SlidersHorizontal,
  Square,
  Star,
  Sticker,
  Timer,
  Type,
  User,
  Video,
  Wand2,
  X,
  Circle,
  Triangle,
  Diamond,
  Pentagon,
  Hexagon,
  Octagon,
  Heart,
  ArrowRight,
  Plus,
  Zap,
  Minus,
  MessageCircle,
  Cloud,
  Moon,
  Sun,
} from 'lucide-react';
import { uploadMediaLocally } from '~/utils/media';
import { GiphyPanel } from '../ui/panels';
import { StoryImagePicker } from '../ui/pickers';
import type { ElementType, ShapeType, StoryTemplate } from '../types';

/**
 * MobileResourcesPanel Component
 * 
 * A mobile-optimized resources panel that appears as a full-screen modal.
 * Features:
 * - Horizontal scrollable category tabs
 * - Sticky search input
 * - Auto-close on resource selection
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */

export interface MobileResourcesPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when panel should close */
  onClose: () => void;
  /** Callback when an element is added */
  onAddElement: (type: ElementType, content: string, extra?: Record<string, unknown>) => void;
  /** Callback when a template is applied */
  onApplyTemplate?: (template: StoryTemplate) => void;
}

type TabType = 'elements' | 'shapes' | 'stickers' | 'gifs' | 'templates' | 'audio' | 'interactive' | 'social';

// Shape definitions
const SHAPES: { type: ShapeType; icon: React.ReactNode; label: string }[] = [
  { type: 'rectangle', icon: <Square size={24} />, label: 'Rectangle' },
  { type: 'circle', icon: <Circle size={24} />, label: 'Circle' },
  { type: 'triangle', icon: <Triangle size={24} />, label: 'Triangle' },
  { type: 'diamond', icon: <Diamond size={24} />, label: 'Diamond' },
  { type: 'pentagon', icon: <Pentagon size={24} />, label: 'Pentagon' },
  { type: 'hexagon', icon: <Hexagon size={24} />, label: 'Hexagon' },
  { type: 'octagon', icon: <Octagon size={24} />, label: 'Octagon' },
  { type: 'star', icon: <Star size={24} />, label: 'Star' },
  { type: 'heart', icon: <Heart size={24} />, label: 'Heart' },
  { type: 'arrow', icon: <ArrowRight size={24} />, label: 'Arrow' },
  { type: 'plus', icon: <Plus size={24} />, label: 'Plus' },
  { type: 'cross', icon: <Zap size={24} />, label: 'Cross' },
  { type: 'line', icon: <Minus size={24} />, label: 'Line' },
  { type: 'speech-bubble', icon: <MessageCircle size={24} />, label: 'Speech' },
  { type: 'cloud', icon: <Cloud size={24} />, label: 'Cloud' },
  { type: 'moon', icon: <Moon size={24} />, label: 'Moon' },
  { type: 'sun', icon: <Sun size={24} />, label: 'Sun' },
];

// Built-in stickers
const STICKERS = [
  '🔥', '⭐', '❤️', '👍', '🎉', '✨', '💯', '🚀',
  '😊', '😂', '🥰', '😎', '🤔', '👀', '💪', '🙌',
  '🎵', '🎨', '📸', '💡', '🏆', '🎯', '💥', '🌟',
  '🍕', '🍔', '☕', '🍩', '🎂', '🍦', '🥤', '🧁',
  '🎬', '📱', '💻', '🎮', '🎸', '🎤', '📷', '🖼️',
  '🎁', '💎', '👑', '🦋', '🌈', '☀️', '🌙', '⚡',
];

// Tab configuration
const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'elements', label: 'Elements', icon: <Type size={18} /> },
  { id: 'shapes', label: 'Shapes', icon: <Square size={18} /> },
  { id: 'interactive', label: 'Interactive', icon: <SlidersHorizontal size={18} /> },
  { id: 'social', label: 'Social', icon: <AtSign size={18} /> },
  { id: 'stickers', label: 'Stickers', icon: <Sticker size={18} /> },
  { id: 'gifs', label: 'GIFs', icon: <Wand2 size={18} /> },
  { id: 'templates', label: 'Templates', icon: <LayoutTemplate size={18} /> },
  { id: 'audio', label: 'Audio', icon: <Music size={18} /> },
];

export const MobileResourcesPanel: React.FC<MobileResourcesPanelProps> = ({
  isOpen,
  onClose,
  onAddElement,
  onApplyTemplate: _onApplyTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('elements');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadType) return;

    setIsUploading(true);
    try {
      const path = await uploadMediaLocally(file);
      handleAddElement(uploadType, path);
    } catch (error) {
      console.error(error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      setUploadType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (type: 'image' | 'video') => {
    setUploadType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : 'video/*';
      fileInputRef.current.click();
    }
  };

  // Handle adding element with auto-close (Requirement 5.3)
  const handleAddElement = useCallback((
    type: ElementType, 
    content: string, 
    extra?: Record<string, unknown>
  ) => {
    onAddElement(type, content, extra);
    // Auto-close panel after selection
    setTimeout(() => {
      onClose();
    }, 150);
  }, [onAddElement, onClose]);

  // Handle image selection from picker
  const handleImageSelect = useCallback((path: string) => {
    if (path) {
      handleAddElement('image', path);
    }
  }, [handleAddElement]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Add Resources"
    >
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
      />

      {/* Header with close button and search (sticky) */}
      <div className="flex-shrink-0 bg-slate-900 border-b border-slate-700 sticky top-0 z-10">
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Add Element</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search input (sticky - Requirement 5.5) */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search 
              size={20} 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
            />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              style={{ minHeight: '48px' }}
            />
          </div>
        </div>

        {/* Horizontal scrollable tabs (Requirement 5.2) */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex px-4 pb-2 gap-2 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
                style={{ minHeight: '44px' }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4">
        {/* Elements Tab */}
        {activeTab === 'elements' && (
          <ElementsTabContent
            onAddElement={handleAddElement}
            onImageSelect={handleImageSelect}
            onTriggerUpload={triggerUpload}
            isUploading={isUploading}
            uploadType={uploadType}
          />
        )}

        {/* Shapes Tab */}
        {activeTab === 'shapes' && (
          <ShapesTabContent onAddElement={handleAddElement} />
        )}

        {/* Stickers Tab */}
        {activeTab === 'stickers' && (
          <StickersTabContent onAddElement={handleAddElement} />
        )}

        {/* GIFs Tab */}
        {activeTab === 'gifs' && (
          <GifsTabContent onAddElement={handleAddElement} />
        )}

        {/* Interactive Tab */}
        {activeTab === 'interactive' && (
          <InteractiveTabContent onAddElement={handleAddElement} />
        )}

        {/* Social Tab */}
        {activeTab === 'social' && (
          <SocialTabContent onAddElement={handleAddElement} />
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <TemplatesTabContent />
        )}

        {/* Audio Tab */}
        {activeTab === 'audio' && (
          <AudioTabContent />
        )}
      </div>
    </div>
  );
};


// ============================================
// Elements Tab Content
// ============================================
interface ElementsTabContentProps {
  onAddElement: (type: ElementType, content: string, extra?: Record<string, unknown>) => void;
  onImageSelect: (path: string) => void;
  onTriggerUpload: (type: 'image' | 'video') => void;
  isUploading: boolean;
  uploadType: 'image' | 'video' | null;
}

const ElementsTabContent: React.FC<ElementsTabContentProps> = ({
  onAddElement,
  onImageSelect,
  onTriggerUpload,
  isUploading,
  uploadType,
}) => (
  <div className="space-y-6">
    {/* Basic Elements */}
    <div>
      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Basic Elements
      </h4>
      <div className="grid grid-cols-3 gap-3">
        <ElementButton
          icon={<Type size={28} className="text-pink-400" />}
          label="Text"
          onClick={() => onAddElement('text', 'New Text')}
        />
        
        <div className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-xl border border-slate-700 min-h-[100px]">
          <StoryImagePicker 
            value="" 
            onChange={onImageSelect}
          />
        </div>

        <ElementButton
          icon={
            isUploading && uploadType === 'video' 
              ? <Loader2 size={28} className="text-green-400 animate-spin" />
              : <Video size={28} className="text-green-400" />
          }
          label="Video"
          onClick={() => onTriggerUpload('video')}
          disabled={isUploading}
        />

        <ElementButton
          icon={<Square size={28} className="text-yellow-400" />}
          label="Shape"
          onClick={() => onAddElement('shape', '', { shapeType: 'rectangle' })}
        />

        <ElementButton
          icon={<MousePointerClick size={28} className="text-purple-400" />}
          label="Button"
          onClick={() => onAddElement('button', 'Click me', {
            button: { href: '#', target: '_self', variant: 'primary' },
            style: {
              width: 160,
              height: 48,
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 'semibold',
              borderRadius: 8,
              textAlign: 'center',
            },
          })}
        />

        <ElementButton
          icon={<Divide size={28} className="text-slate-400" />}
          label="Divider"
          onClick={() => onAddElement('divider', '', {
            divider: { style: 'solid', thickness: 2 },
            style: {
              width: 280,
              height: 4,
              backgroundColor: '#ffffff',
              opacity: 0.3,
            },
          })}
        />

        <ElementButton
          icon={<Quote size={28} className="text-amber-400" />}
          label="Quote"
          onClick={() => onAddElement('quote', '"Your quote here"', {
            quote: { author: 'Author Name', style: 'decorative' },
            style: {
              width: 280,
              height: 150,
              color: '#ffffff',
              fontSize: 20,
              fontStyle: 'italic',
              textAlign: 'center',
            },
          })}
        />

        <ElementButton
          icon={<List size={28} className="text-cyan-400" />}
          label="List"
          onClick={() => onAddElement('list', '', {
            list: { items: ['Item 1', 'Item 2', 'Item 3'], type: 'bullet' },
            style: {
              width: 250,
              height: 120,
              color: '#ffffff',
              fontSize: 16,
              textAlign: 'left',
            },
          })}
        />

        <ElementButton
          icon={<User size={28} className="text-indigo-400" />}
          label="Avatar"
          onClick={() => onAddElement('avatar', '', {
            avatar: { name: 'User Name', subtitle: '@username', size: 'lg', shape: 'circle' },
            style: {
              width: 200,
              height: 80,
              backgroundColor: '#3b82f6',
            },
          })}
        />
      </div>
    </div>

    {/* Quick Add Text */}
    <div>
      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Quick Add Text
      </h4>
      <div className="space-y-2">
        <QuickAddButton
          label="Heading"
          className="text-2xl font-bold"
          onClick={() => onAddElement('text', 'HEADING', {
            style: { fontSize: 48, fontWeight: 'bold' },
          })}
        />
        <QuickAddButton
          label="Subheading"
          className="text-lg font-medium"
          onClick={() => onAddElement('text', 'Subheading', {
            style: { fontSize: 24, fontWeight: 'medium' },
          })}
        />
        <QuickAddButton
          label="Body text goes here..."
          className="text-base"
          onClick={() => onAddElement('text', 'Body text goes here...', {
            style: { fontSize: 16, fontWeight: 'normal' },
          })}
        />
        <QuickAddButton
          label="Caption text"
          className="text-sm opacity-70"
          onClick={() => onAddElement('text', 'Caption text', {
            style: { fontSize: 12, fontWeight: 'normal', opacity: 0.7 },
          })}
        />
      </div>
    </div>
  </div>
);

// ============================================
// Shapes Tab Content
// ============================================
interface ShapesTabContentProps {
  onAddElement: (type: ElementType, content: string, extra?: Record<string, unknown>) => void;
}

const ShapesTabContent: React.FC<ShapesTabContentProps> = ({ onAddElement }) => (
  <div>
    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
      Shapes
    </h4>
    <div className="grid grid-cols-4 gap-3">
      {SHAPES.map((shape) => (
        <button
          key={shape.type}
          onClick={() => onAddElement('shape', '', { shapeType: shape.type })}
          className="flex flex-col items-center justify-center p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
          style={{ minHeight: '80px' }}
        >
          <span className="text-blue-400 mb-1">{shape.icon}</span>
          <span className="text-xs text-slate-400">{shape.label}</span>
        </button>
      ))}
    </div>
  </div>
);

// ============================================
// Stickers Tab Content
// ============================================
interface StickersTabContentProps {
  onAddElement: (type: ElementType, content: string, extra?: Record<string, unknown>) => void;
}

const StickersTabContent: React.FC<StickersTabContentProps> = ({ onAddElement }) => (
  <div>
    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
      Emoji Stickers
    </h4>
    <div className="grid grid-cols-6 gap-2">
      {STICKERS.map((sticker, index) => (
        <button
          key={index}
          onClick={() => onAddElement('sticker', sticker, {
            style: { fontSize: 48, width: 60, height: 60 },
          })}
          className="flex items-center justify-center p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors text-3xl"
          style={{ minHeight: '60px', minWidth: '60px' }}
        >
          {sticker}
        </button>
      ))}
    </div>
  </div>
);

// ============================================
// GIFs Tab Content
// ============================================
interface GifsTabContentProps {
  onAddElement: (type: ElementType, content: string, extra?: Record<string, unknown>) => void;
}

const GifsTabContent: React.FC<GifsTabContentProps> = ({ onAddElement }) => (
  <div>
    <GiphyPanel
      onSelectGif={(url) => onAddElement('gif', url, {
        style: { width: 200, height: 200 },
      })}
    />
  </div>
);

// ============================================
// Interactive Tab Content
// ============================================
interface InteractiveTabContentProps {
  onAddElement: (type: ElementType, content: string, extra?: Record<string, unknown>) => void;
}

const InteractiveTabContent: React.FC<InteractiveTabContentProps> = ({ onAddElement }) => (
  <div className="space-y-6">
    <div>
      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Interactive Elements
      </h4>
      <div className="grid grid-cols-3 gap-3">
        <ElementButton
          icon={<BarChart3 size={28} className="text-blue-400" />}
          label="Poll"
          onClick={() => onAddElement('poll', '', {
            poll: { question: 'Your question?', options: ['Option 1', 'Option 2'] },
            style: { width: 280, height: 200 },
          })}
        />
        <ElementButton
          icon={<Timer size={28} className="text-orange-400" />}
          label="Countdown"
          onClick={() => onAddElement('countdown', '', {
            countdown: { targetDate: new Date(Date.now() + 86400000).toISOString(), label: 'Event' },
            style: { width: 280, height: 100 },
          })}
        />
        <ElementButton
          icon={<Star size={28} className="text-yellow-400" />}
          label="Rating"
          onClick={() => onAddElement('rating', '', {
            rating: { value: 4, max: 5, icon: 'star', showValue: true },
            style: { width: 200, height: 50 },
          })}
        />
        <ElementButton
          icon={<SlidersHorizontal size={28} className="text-green-400" />}
          label="Progress"
          onClick={() => onAddElement('progress', '', {
            progress: { value: 75, max: 100, label: 'Progress', showPercent: true, variant: 'bar' },
            style: { width: 280, height: 60 },
          })}
        />
        <ElementButton
          icon={<Play size={28} className="text-red-400" />}
          label="Timer"
          onClick={() => onAddElement('timer', '', {
            timer: { duration: 60, autoStart: false, showLabels: true, format: 'ms' },
            style: { width: 200, height: 80 },
          })}
        />
        <ElementButton
          icon={<QrCode size={28} className="text-purple-400" />}
          label="QR Code"
          onClick={() => onAddElement('qrcode', '', {
            qrcode: { data: 'https://example.com', size: 150 },
            style: { width: 150, height: 150 },
          })}
        />
      </div>
    </div>
  </div>
);

// ============================================
// Social Tab Content
// ============================================
interface SocialTabContentProps {
  onAddElement: (type: ElementType, content: string, extra?: Record<string, unknown>) => void;
}

const SocialTabContent: React.FC<SocialTabContentProps> = ({ onAddElement }) => (
  <div className="space-y-6">
    <div>
      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Social Elements
      </h4>
      <div className="grid grid-cols-3 gap-3">
        <ElementButton
          icon={<AtSign size={28} className="text-pink-400" />}
          label="Mention"
          onClick={() => onAddElement('mention', '', {
            mention: { username: 'username', platform: 'instagram', verified: false },
            style: { width: 180, height: 40, fontSize: 16 },
          })}
        />
        <ElementButton
          icon={<Hash size={28} className="text-blue-400" />}
          label="Hashtag"
          onClick={() => onAddElement('hashtag', '', {
            hashtag: { tags: ['hashtag1', 'hashtag2'], clickable: true },
            style: { width: 200, height: 40, fontSize: 14 },
          })}
        />
        <ElementButton
          icon={<Link2 size={28} className="text-green-400" />}
          label="Link"
          onClick={() => onAddElement('link', 'Click here', {
            link: { url: 'https://example.com', label: 'Click here' },
            style: { width: 150, height: 40, color: '#3b82f6', fontSize: 16 },
          })}
        />
        <ElementButton
          icon={<MapPin size={28} className="text-red-400" />}
          label="Location"
          onClick={() => onAddElement('location', '', {
            location: { name: 'Location Name', address: '123 Street' },
            style: { width: 200, height: 60 },
          })}
        />
        <ElementButton
          icon={<Code2 size={28} className="text-emerald-400" />}
          label="Code"
          onClick={() => onAddElement('codeblock', 'const hello = "world";', {
            codeblock: { language: 'javascript', theme: 'dark', showLineNumbers: true },
            style: {
              width: 280,
              height: 100,
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              fontSize: 14,
              fontFamily: 'monospace',
              borderRadius: 8,
            },
          })}
        />
        <ElementButton
          icon={<CheckCircle2 size={28} className="text-teal-400" />}
          label="Checklist"
          onClick={() => onAddElement('list', '', {
            list: { items: ['Task 1', 'Task 2', 'Task 3'], type: 'checklist' },
            style: { width: 250, height: 120, color: '#ffffff', fontSize: 16 },
          })}
        />
      </div>
    </div>
  </div>
);

// ============================================
// Templates Tab Content
// ============================================
const TemplatesTabContent: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <LayoutTemplate size={48} className="text-slate-600 mb-4" />
    <h4 className="text-lg font-medium text-slate-400 mb-2">Templates</h4>
    <p className="text-sm text-slate-500">
      Templates coming soon. Browse pre-made story designs.
    </p>
  </div>
);

// ============================================
// Audio Tab Content
// ============================================
const AudioTabContent: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Music size={48} className="text-slate-600 mb-4" />
    <h4 className="text-lg font-medium text-slate-400 mb-2">Audio</h4>
    <p className="text-sm text-slate-500">
      Add background music to your story from the timeline.
    </p>
  </div>
);

// ============================================
// Helper Components
// ============================================
interface ElementButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const ElementButton: React.FC<ElementButtonProps> = ({ 
  icon, 
  label, 
  onClick, 
  disabled = false 
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    style={{ minHeight: '100px' }}
  >
    <span className="mb-2">{icon}</span>
    <span className="text-sm font-medium text-slate-200">{label}</span>
  </button>
);

interface QuickAddButtonProps {
  label: string;
  className?: string;
  onClick: () => void;
}

const QuickAddButton: React.FC<QuickAddButtonProps> = ({ 
  label, 
  className = '', 
  onClick 
}) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-white ${className}`}
    style={{ minHeight: '52px' }}
  >
    {label}
  </button>
);

export default MobileResourcesPanel;

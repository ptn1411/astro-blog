import React, { useState, useCallback } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Copy,
  Lock,
  Move,
  Palette,
  Sparkles,
  Trash2,
  Unlock,
  Check,
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import {
  ANIMATION_PRESETS,
  COLOR_PRESETS,
  FONT_OPTIONS,
  TRANSITION_PRESETS,
  type AnimationType,
  type ElementStyle,
  type FontWeight,
  type StoryElement,
  type StorySlide,
  type TextAlign,
  type TransitionType,
} from '../types';

/**
 * MobilePropertiesPanel Component
 * 
 * A mobile-optimized properties panel that wraps content in a BottomSheet.
 * Features:
 * - Collapsible sections for organization
 * - Slider controls instead of number inputs
 * - Done button to dismiss
 * 
 * Requirements: 4.1, 4.3, 4.4, 4.5
 */

export interface MobilePropertiesPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when panel should close */
  onClose: () => void;
  /** Currently selected element (null for slide properties) */
  element: StoryElement | null;
  /** Current slide */
  slide: StorySlide;
  /** Callback to update element properties */
  onUpdateElement: (updates: Partial<StoryElement> | Partial<ElementStyle>) => void;
  /** Callback to update slide properties */
  onUpdateSlide: (updates: Partial<StorySlide>) => void;
  /** Callback to delete element */
  onDeleteElement?: () => void;
  /** Callback to duplicate element */
  onDuplicateElement?: () => void;
  /** Callback to toggle element lock */
  onToggleLock?: () => void;
}

/** Snap points for the bottom sheet: 40%, 70%, 95% */
const SNAP_POINTS = [0.4, 0.7, 0.95];

// ============================================
// Collapsible Section Component
// ============================================
interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ 
  title, 
  icon, 
  defaultOpen = true, 
  children 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-700 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors active:bg-slate-700"
      >
        <div className="flex items-center gap-3 text-base font-medium text-slate-200">
          {icon}
          {title}
        </div>
        <ChevronDown 
          size={20} 
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================
// Field Label Component
// ============================================
interface FieldProps {
  label: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, children }) => (
  <div>
    <label className="text-sm text-slate-400 block mb-2">{label}</label>
    {children}
  </div>
);

// ============================================
// Mobile Slider Component (replaces number inputs)
// ============================================
interface MobileSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const MobileSlider: React.FC<MobileSliderProps> = ({ 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1, 
  unit = '' 
}) => (
  <div className="flex items-center gap-3">
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      style={{ minHeight: '44px' }} // Touch-friendly height
    />
    <span className="text-sm text-slate-300 w-16 text-right font-mono">
      {value}{unit}
    </span>
  </div>
);

// ============================================
// Color Picker Component
// ============================================
interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  presets?: string[];
}

const ColorPicker: React.FC<ColorPickerProps> = ({ 
  value, 
  onChange, 
  presets = COLOR_PRESETS.backgrounds 
}) => (
  <div className="space-y-3">
    <div className="grid grid-cols-8 gap-2">
      {presets.slice(0, 16).map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={`w-9 h-9 rounded-lg border-2 transition-all ${
            value === color 
              ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-800 border-blue-500' 
              : 'border-slate-600'
          }`}
          style={{ backgroundColor: color, minWidth: '36px', minHeight: '36px' }}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
    <div className="flex gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-12 bg-transparent border border-slate-600 rounded-lg cursor-pointer"
        style={{ minWidth: '48px', minHeight: '48px' }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
        placeholder="#ffffff"
      />
    </div>
  </div>
);

// ============================================
// Select Component
// ============================================
interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}

const Select: React.FC<SelectProps> = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-blue-500"
    style={{ minHeight: '48px' }}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

// ============================================
// Main Component
// ============================================
export const MobilePropertiesPanel: React.FC<MobilePropertiesPanelProps> = ({
  isOpen,
  onClose,
  element,
  slide,
  onUpdateElement,
  onUpdateSlide,
  onDeleteElement,
  onDuplicateElement,
  onToggleLock,
}) => {
  const [activeTab, setActiveTab] = useState<'style' | 'animation'>('style');

  // Animation type options
  const animationOptions = Object.keys(ANIMATION_PRESETS).map((key) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
    value: key,
  }));

  // Transition type options
  const transitionOptions = Object.keys(TRANSITION_PRESETS).map((key) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: key,
  }));

  // Font weight options
  const fontWeightOptions: { label: string; value: FontWeight }[] = [
    { label: 'Normal', value: 'normal' },
    { label: 'Medium', value: 'medium' },
    { label: 'Semibold', value: 'semibold' },
    { label: 'Bold', value: 'bold' },
  ];

  // Handle done button
  const handleDone = useCallback(() => {
    onClose();
  }, [onClose]);

  // Get panel title
  const getPanelTitle = () => {
    if (!element) return 'Slide Properties';
    return `${element.type.charAt(0).toUpperCase() + element.type.slice(1)} Properties`;
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={getPanelTitle()}
      snapPoints={SNAP_POINTS}
      initialSnap={1}
    >
      <div className="flex flex-col h-full">
        {/* Element Actions Bar (when element is selected) */}
        {element && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleLock}
                className={`p-3 rounded-lg transition-colors ${
                  element.locked 
                    ? 'bg-yellow-500/20 text-yellow-400' 
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
                style={{ minWidth: '48px', minHeight: '48px' }}
                aria-label={element.locked ? 'Unlock element' : 'Lock element'}
              >
                {element.locked ? <Lock size={20} /> : <Unlock size={20} />}
              </button>
              <button
                onClick={onDuplicateElement}
                className="p-3 bg-slate-700 rounded-lg text-slate-400 hover:bg-slate-600 transition-colors"
                style={{ minWidth: '48px', minHeight: '48px' }}
                aria-label="Duplicate element"
              >
                <Copy size={20} />
              </button>
              <button
                onClick={onDeleteElement}
                className="p-3 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
                style={{ minWidth: '48px', minHeight: '48px' }}
                aria-label="Delete element"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Tabs (for elements only) */}
        {element && (
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setActiveTab('style')}
              className={`flex-1 py-4 text-base font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'style' 
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/30' 
                  : 'text-slate-400'
              }`}
              style={{ minHeight: '56px' }}
            >
              <Palette size={18} />
              Style
            </button>
            <button
              onClick={() => setActiveTab('animation')}
              className={`flex-1 py-4 text-base font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'animation' 
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/30' 
                  : 'text-slate-400'
              }`}
              style={{ minHeight: '56px' }}
            >
              <Sparkles size={18} />
              Animation
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {!element ? (
            // Slide Properties
            <SlidePropertiesContent
              slide={slide}
              onUpdateSlide={onUpdateSlide}
              transitionOptions={transitionOptions}
            />
          ) : activeTab === 'style' ? (
            // Element Style Properties
            <ElementStyleContent
              element={element}
              onUpdateElement={onUpdateElement}
              fontWeightOptions={fontWeightOptions}
            />
          ) : (
            // Element Animation Properties
            <ElementAnimationContent
              element={element}
              onUpdateElement={onUpdateElement}
              animationOptions={animationOptions}
            />
          )}
        </div>

        {/* Done Button */}
        <div className="flex-shrink-0 p-4 border-t border-slate-700 bg-slate-800">
          <button
            onClick={handleDone}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            style={{ minHeight: '56px' }}
          >
            <Check size={20} />
            Done
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};


// ============================================
// Slide Properties Content
// ============================================
interface SlidePropertiesContentProps {
  slide: StorySlide;
  onUpdateSlide: (updates: Partial<StorySlide>) => void;
  transitionOptions: { label: string; value: string }[];
}

const SlidePropertiesContent: React.FC<SlidePropertiesContentProps> = ({
  slide,
  onUpdateSlide,
  transitionOptions,
}) => (
  <>
    <Section title="Timing" icon={<Move size={18} />} defaultOpen>
      <Field label="Duration (seconds)">
        <MobileSlider
          value={slide.duration}
          onChange={(v) => onUpdateSlide({ duration: v })}
          min={1}
          max={30}
          step={0.5}
          unit="s"
        />
      </Field>
    </Section>

    <Section title="Background" icon={<Palette size={18} />}>
      <Field label="Type">
        <div className="grid grid-cols-4 gap-2">
          {(['color', 'image', 'video', 'gradient'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onUpdateSlide({ background: { ...slide.background, type } })}
              className={`py-3 text-sm rounded-lg transition-colors ${
                slide.background.type === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
              style={{ minHeight: '48px' }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </Field>

      {slide.background.type === 'color' && (
        <Field label="Color">
          <ColorPicker
            value={slide.background.value}
            onChange={(v) => onUpdateSlide({ background: { ...slide.background, value: v } })}
          />
        </Field>
      )}

      {slide.background.type === 'gradient' && (
        <Field label="Gradient Presets">
          <div className="grid grid-cols-3 gap-2">
            {COLOR_PRESETS.gradients.map((g) => (
              <button
                key={g.name}
                onClick={() =>
                  onUpdateSlide({
                    background: {
                      type: 'gradient',
                      value: '',
                      gradient: {
                        type: 'linear',
                        angle: 135,
                        colors: g.colors.map((c, i) => ({
                          color: c,
                          position: (i / (g.colors.length - 1)) * 100,
                        })),
                      },
                    },
                  })
                }
                className="h-14 rounded-lg border-2 border-slate-600 hover:border-blue-500 transition-colors"
                style={{
                  background: `linear-gradient(135deg, ${g.colors.join(', ')})`,
                  minHeight: '56px',
                }}
                title={g.name}
              />
            ))}
          </div>
        </Field>
      )}
    </Section>

    <Section title="Transition" icon={<Sparkles size={18} />}>
      <Field label="Type">
        <Select
          value={slide.transition?.type || 'fade'}
          onChange={(v) =>
            onUpdateSlide({
              transition: {
                type: v as TransitionType,
                duration: TRANSITION_PRESETS[v as TransitionType].duration,
              },
            })
          }
          options={transitionOptions}
        />
      </Field>
      <Field label="Duration">
        <MobileSlider
          value={slide.transition?.duration || 500}
          onChange={(v) =>
            onUpdateSlide({
              transition: { ...slide.transition!, duration: v },
            })
          }
          min={100}
          max={2000}
          step={100}
          unit="ms"
        />
      </Field>
    </Section>
  </>
);

// ============================================
// Element Style Content
// ============================================
interface ElementStyleContentProps {
  element: StoryElement;
  onUpdateElement: (updates: Partial<StoryElement> | Partial<ElementStyle>) => void;
  fontWeightOptions: { label: string; value: FontWeight }[];
}

const ElementStyleContent: React.FC<ElementStyleContentProps> = ({
  element,
  onUpdateElement,
  fontWeightOptions,
}) => (
  <>
    {/* Position Section */}
    <Section title="Position" icon={<Move size={18} />} defaultOpen>
      <div className="grid grid-cols-2 gap-4">
        <Field label="X Position">
          <MobileSlider
            value={element.style.x}
            onChange={(v) => onUpdateElement({ x: v })}
            min={-100}
            max={400}
            unit="px"
          />
        </Field>
        <Field label="Y Position">
          <MobileSlider
            value={element.style.y}
            onChange={(v) => onUpdateElement({ y: v })}
            min={-100}
            max={700}
            unit="px"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Width">
          <MobileSlider
            value={element.style.width}
            onChange={(v) => onUpdateElement({ width: v })}
            min={20}
            max={400}
            unit="px"
          />
        </Field>
        <Field label="Height">
          <MobileSlider
            value={element.style.height}
            onChange={(v) => onUpdateElement({ height: v })}
            min={20}
            max={700}
            unit="px"
          />
        </Field>
      </div>
      <Field label="Rotation">
        <MobileSlider
          value={element.style.rotation}
          onChange={(v) => onUpdateElement({ rotation: v })}
          min={-180}
          max={180}
          unit="°"
        />
      </Field>
      <Field label="Opacity">
        <MobileSlider
          value={Math.round((element.style.opacity ?? 1) * 100)}
          onChange={(v) => onUpdateElement({ opacity: v / 100 })}
          min={0}
          max={100}
          unit="%"
        />
      </Field>
    </Section>

    {/* Text-specific properties */}
    {element.type === 'text' && (
      <Section title="Text Style" icon={<Bold size={18} />}>
        <Field label="Content">
          <textarea
            value={element.content}
            onChange={(e) => onUpdateElement({ content: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
            style={{ minHeight: '100px' }}
          />
        </Field>
        <Field label="Font">
          <Select
            value={element.style.fontFamily || FONT_OPTIONS[0].value}
            onChange={(v) => onUpdateElement({ fontFamily: v })}
            options={FONT_OPTIONS}
          />
        </Field>
        <Field label="Font Size">
          <MobileSlider
            value={element.style.fontSize || 24}
            onChange={(v) => onUpdateElement({ fontSize: v })}
            min={8}
            max={120}
            unit="px"
          />
        </Field>
        <Field label="Font Weight">
          <div className="grid grid-cols-4 gap-2">
            {fontWeightOptions.map((w) => (
              <button
                key={w.value}
                onClick={() => onUpdateElement({ fontWeight: w.value })}
                className={`py-3 text-sm rounded-lg transition-colors ${
                  element.style.fontWeight === w.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
                style={{ minHeight: '48px' }}
              >
                {w.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Alignment">
          <div className="grid grid-cols-3 gap-2">
            {(['left', 'center', 'right'] as TextAlign[]).map((align) => (
              <button
                key={align}
                onClick={() => onUpdateElement({ textAlign: align })}
                className={`py-3 rounded-lg transition-colors flex items-center justify-center ${
                  element.style.textAlign === align
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
                style={{ minHeight: '48px' }}
              >
                {align === 'left' && <AlignLeft size={20} />}
                {align === 'center' && <AlignCenter size={20} />}
                {align === 'right' && <AlignRight size={20} />}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Text Color">
          <ColorPicker
            value={element.style.color || '#ffffff'}
            onChange={(v) => onUpdateElement({ color: v })}
            presets={COLOR_PRESETS.text}
          />
        </Field>
      </Section>
    )}

    {/* Image-specific properties */}
    {element.type === 'image' && (
      <Section title="Image Style" icon={<Palette size={18} />}>
        <Field label="Border Radius">
          <MobileSlider
            value={element.style.borderRadius || 0}
            onChange={(v) => onUpdateElement({ borderRadius: v })}
            min={0}
            max={200}
            unit="px"
          />
        </Field>
        <Field label="Quick Shapes">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Square', value: 0 },
              { label: 'Rounded', value: 12 },
              { label: 'Circle', value: 999 },
            ].map((shape) => (
              <button
                key={shape.label}
                onClick={() => onUpdateElement({ borderRadius: shape.value })}
                className={`py-3 text-sm rounded-lg transition-colors ${
                  element.style.borderRadius === shape.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
                style={{ minHeight: '48px' }}
              >
                {shape.label}
              </button>
            ))}
          </div>
        </Field>
      </Section>
    )}

    {/* Shape-specific properties */}
    {element.type === 'shape' && (
      <Section title="Shape Style" icon={<Palette size={18} />}>
        <Field label="Background Color">
          <ColorPicker
            value={element.style.backgroundColor || '#3b82f6'}
            onChange={(v) => onUpdateElement({ backgroundColor: v })}
          />
        </Field>
        <Field label="Border Radius">
          <MobileSlider
            value={element.style.borderRadius || 0}
            onChange={(v) => onUpdateElement({ borderRadius: v })}
            min={0}
            max={100}
            unit="px"
          />
        </Field>
        <Field label="Border Width">
          <MobileSlider
            value={element.style.borderWidth || 0}
            onChange={(v) => onUpdateElement({ borderWidth: v })}
            min={0}
            max={20}
            unit="px"
          />
        </Field>
        {(element.style.borderWidth ?? 0) > 0 && (
          <Field label="Border Color">
            <ColorPicker
              value={element.style.borderColor || '#ffffff'}
              onChange={(v) => onUpdateElement({ borderColor: v })}
            />
          </Field>
        )}
      </Section>
    )}

    {/* Button-specific properties */}
    {element.type === 'button' && (
      <Section title="Button Style" icon={<Palette size={18} />}>
        <Field label="Button Text">
          <input
            type="text"
            value={element.content}
            onChange={(e) => onUpdateElement({ content: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-blue-500"
            placeholder="Click me"
            style={{ minHeight: '48px' }}
          />
        </Field>
        <Field label="Link URL">
          <input
            type="url"
            value={element.button?.href || ''}
            onChange={(e) =>
              onUpdateElement({
                button: { ...element.button, href: e.target.value, target: element.button?.target || '_self' },
              })
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-blue-500"
            placeholder="https://example.com"
            style={{ minHeight: '48px' }}
          />
        </Field>
        <Field label="Background Color">
          <ColorPicker
            value={element.style.backgroundColor || '#3b82f6'}
            onChange={(v) => onUpdateElement({ backgroundColor: v })}
          />
        </Field>
        <Field label="Text Color">
          <ColorPicker
            value={element.style.color || '#ffffff'}
            onChange={(v) => onUpdateElement({ color: v })}
            presets={COLOR_PRESETS.text}
          />
        </Field>
        <Field label="Border Radius">
          <MobileSlider
            value={element.style.borderRadius || 8}
            onChange={(v) => onUpdateElement({ borderRadius: v })}
            min={0}
            max={50}
            unit="px"
          />
        </Field>
      </Section>
    )}
  </>
);

// ============================================
// Element Animation Content
// ============================================
interface ElementAnimationContentProps {
  element: StoryElement;
  onUpdateElement: (updates: Partial<StoryElement> | Partial<ElementStyle>) => void;
  animationOptions: { label: string; value: string }[];
}

const ElementAnimationContent: React.FC<ElementAnimationContentProps> = ({
  element,
  onUpdateElement,
  animationOptions,
}) => (
  <>
    <Section title="Enter Animation" icon={<Sparkles size={18} />} defaultOpen>
      <Field label="Animation Type">
        <Select
          value={element.animation?.enter?.type || 'none'}
          onChange={(v) =>
            onUpdateElement({
              animation: {
                ...element.animation,
                enter: {
                  ...element.animation?.enter,
                  type: v as AnimationType,
                  duration: element.animation?.enter?.duration || 500,
                  delay: element.animation?.enter?.delay || 0,
                  easing: element.animation?.enter?.easing || 'ease-out',
                },
              },
            })
          }
          options={animationOptions}
        />
      </Field>
      {element.animation?.enter?.type && element.animation.enter.type !== 'none' && (
        <>
          <Field label="Duration">
            <MobileSlider
              value={element.animation.enter.duration || 500}
              onChange={(v) =>
                onUpdateElement({
                  animation: {
                    ...element.animation,
                    enter: { ...element.animation!.enter!, duration: v },
                  },
                })
              }
              min={100}
              max={3000}
              step={100}
              unit="ms"
            />
          </Field>
          <Field label="Delay">
            <MobileSlider
              value={element.animation.enter.delay || 0}
              onChange={(v) =>
                onUpdateElement({
                  animation: {
                    ...element.animation,
                    enter: { ...element.animation!.enter!, delay: v },
                  },
                })
              }
              min={0}
              max={5000}
              step={100}
              unit="ms"
            />
          </Field>
        </>
      )}
    </Section>

    <Section title="Loop Animation" icon={<Sparkles size={18} />}>
      <Field label="Animation Type">
        <Select
          value={element.animation?.loop?.type || 'none'}
          onChange={(v) =>
            onUpdateElement({
              animation: {
                ...element.animation,
                loop: {
                  ...element.animation?.loop,
                  type: v as AnimationType,
                  duration: element.animation?.loop?.duration || 1000,
                  delay: element.animation?.loop?.delay || 0,
                  easing: element.animation?.loop?.easing || 'ease-in-out',
                },
              },
            })
          }
          options={[
            { label: 'None', value: 'none' },
            { label: 'Pulse', value: 'pulse' },
            { label: 'Bounce', value: 'bounce' },
            { label: 'Float', value: 'float' },
            { label: 'Shake', value: 'shake' },
            { label: 'Rotate', value: 'rotate' },
          ]}
        />
      </Field>
      {element.animation?.loop?.type && element.animation.loop.type !== 'none' && (
        <Field label="Duration">
          <MobileSlider
            value={element.animation.loop.duration || 1000}
            onChange={(v) =>
              onUpdateElement({
                animation: {
                  ...element.animation,
                  loop: { ...element.animation!.loop!, duration: v },
                },
              })
            }
            min={500}
            max={5000}
            step={100}
            unit="ms"
          />
        </Field>
      )}
    </Section>
  </>
);

export default MobilePropertiesPanel;

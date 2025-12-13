import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Copy,
  Layers,
  Lock,
  RotateCcw,
  Sparkles,
  Trash2,
  Unlock,
} from 'lucide-react';
import React, { useState } from 'react';
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
} from './types';

interface PropertiesPanelProps {
  element: StoryElement | null;
  slide: StorySlide;
  onUpdateElement: (updates: Partial<StoryElement> | Partial<ElementStyle>) => void;
  onUpdateSlide: (updates: Partial<StorySlide>) => void;
  onDeleteElement?: () => void;
  onDuplicateElement?: () => void;
  onToggleLock?: () => void;
}

// Collapsible Section Component
const Section: React.FC<{
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, defaultOpen = true, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-700 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          {icon}
          {title}
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="px-3 pb-4 space-y-3">{children}</div>}
    </div>
  );
};

// Input Field Component
const Field: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div>
    <label className="text-xs text-slate-400 block mb-1.5">{label}</label>
    {children}
  </div>
);

// Select Component
const Select: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}> = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

// Number Input with slider
const NumberSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}> = ({ value, onChange, min = 0, max = 100, step = 1, unit = '' }) => (
  <div className="flex items-center gap-2">
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
    />
    <span className="text-xs text-slate-400 w-12 text-right">
      {value}
      {unit}
    </span>
  </div>
);

// Color Picker with presets
const ColorPicker: React.FC<{
  value: string;
  onChange: (value: string) => void;
  presets?: string[];
}> = ({ value, onChange, presets = COLOR_PRESETS.backgrounds }) => (
  <div className="space-y-2">
    <div className="flex gap-1 flex-wrap">
      {presets.slice(0, 12).map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={`w-6 h-6 rounded border ${value === color ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-slate-800' : 'border-slate-600'}`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
    <div className="flex gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 bg-transparent border border-slate-600 rounded cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
      />
    </div>
  </div>
);

export const PropertiesPanelV2: React.FC<PropertiesPanelProps> = ({
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
    { label: 'Extra Bold', value: 'extrabold' },
  ];

  // If no element is selected, show slide properties
  if (!element) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Slide Properties</h3>
        </div>

        <Section title="Timing" defaultOpen>
          <Field label="Duration (seconds)">
            <NumberSlider
              value={slide.duration}
              onChange={(v) => onUpdateSlide({ duration: v })}
              min={1}
              max={30}
              step={0.5}
              unit="s"
            />
          </Field>
        </Section>

        <Section title="Background">
          <Field label="Type">
            <div className="flex gap-2">
              {(['color', 'image', 'gradient'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onUpdateSlide({ background: { ...slide.background, type } })}
                  className={`flex-1 py-2 text-xs rounded transition-colors ${
                    slide.background.type === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
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
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1">
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
                    className="h-12 rounded-lg border border-slate-600 hover:border-blue-500 transition-colors"
                    style={{
                      background: `linear-gradient(135deg, ${g.colors.join(', ')})`,
                    }}
                    title={g.name}
                  />
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Transition">
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
            <NumberSlider
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
      </div>
    );
  }

  // Element is selected - show element properties
  return (
    <div className="h-full flex flex-col">
      {/* Header with element type */}
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 capitalize">{element.type} Properties</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleLock}
            className={`p-1.5 rounded transition-colors ${
              element.locked ? 'bg-yellow-500/20 text-yellow-400' : 'hover:bg-slate-700 text-slate-400'
            }`}
            title={element.locked ? 'Unlock' : 'Lock'}
          >
            {element.locked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
          <button
            onClick={onDuplicateElement}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 transition-colors"
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={onDeleteElement}
            className="p-1.5 hover:bg-red-500/20 rounded text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'style' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Style
        </button>
        <button
          onClick={() => setActiveTab('animation')}
          className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'animation'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Sparkles size={14} />
          Animation
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'style' ? (
          <>
            {/* Text-specific properties */}
            {element.type === 'text' && (
              <Section title="Text" defaultOpen>
                <Field label="Content">
                  <textarea
                    value={element.content}
                    onChange={(e) => onUpdateElement({ content: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                  />
                </Field>
                <Field label="Font">
                  <Select
                    value={element.style.fontFamily || FONT_OPTIONS[0].value}
                    onChange={(v) => onUpdateElement({ fontFamily: v })}
                    options={FONT_OPTIONS}
                  />
                </Field>
                <Field label="Size & Weight">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={element.style.fontSize || 24}
                      onChange={(e) => onUpdateElement({ fontSize: Number(e.target.value) })}
                      className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
                    />
                    <div className="flex-1 flex gap-1">
                      {fontWeightOptions.slice(0, 3).map((w) => (
                        <button
                          key={w.value}
                          onClick={() => onUpdateElement({ fontWeight: w.value })}
                          className={`flex-1 p-1.5 rounded text-xs transition-colors ${
                            element.style.fontWeight === w.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          <Bold
                            size={14}
                            className="mx-auto"
                            style={{ strokeWidth: w.value === 'bold' ? 3 : w.value === 'semibold' ? 2.5 : 2 }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </Field>
                <Field label="Alignment">
                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as TextAlign[]).map((align) => (
                      <button
                        key={align}
                        onClick={() => onUpdateElement({ textAlign: align })}
                        className={`flex-1 p-2 rounded transition-colors ${
                          element.style.textAlign === align
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {align === 'left' && <AlignLeft size={16} className="mx-auto" />}
                        {align === 'center' && <AlignCenter size={16} className="mx-auto" />}
                        {align === 'right' && <AlignRight size={16} className="mx-auto" />}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Color">
                  <ColorPicker
                    value={element.style.color || '#ffffff'}
                    onChange={(v) => onUpdateElement({ color: v })}
                    presets={COLOR_PRESETS.text}
                  />
                </Field>
              </Section>
            )}

            {/* Button-specific properties */}
            {element.type === 'button' && (
              <Section title="Button" defaultOpen>
                <Field label="Button Text">
                  <input
                    type="text"
                    value={element.content}
                    onChange={(e) => onUpdateElement({ content: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="Click me"
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
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="https://example.com"
                  />
                </Field>
                <Field label="Open In">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        onUpdateElement({
                          button: { ...element.button, href: element.button?.href || '#', target: '_self' },
                        })
                      }
                      className={`flex-1 py-2 text-xs rounded transition-colors ${
                        element.button?.target !== '_blank'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Same Tab
                    </button>
                    <button
                      onClick={() =>
                        onUpdateElement({
                          button: { ...element.button, href: element.button?.href || '#', target: '_blank' },
                        })
                      }
                      className={`flex-1 py-2 text-xs rounded transition-colors ${
                        element.button?.target === '_blank'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      New Tab
                    </button>
                  </div>
                </Field>
                <Field label="Style">
                  <div className="grid grid-cols-2 gap-2">
                    {(['primary', 'secondary', 'outline', 'ghost'] as const).map((variant) => (
                      <button
                        key={variant}
                        onClick={() =>
                          onUpdateElement({
                            button: { ...element.button, href: element.button?.href || '#', variant },
                          })
                        }
                        className={`py-2 text-xs rounded transition-colors capitalize ${
                          element.button?.variant === variant
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {variant}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Font Size">
                  <NumberSlider
                    value={element.style.fontSize || 16}
                    onChange={(v) => onUpdateElement({ fontSize: v })}
                    min={10}
                    max={48}
                    unit="px"
                  />
                </Field>
                <Field label="Background Color">
                  <ColorPicker
                    value={element.style.backgroundColor || '#3b82f6'}
                    onChange={(v) => onUpdateElement({ backgroundColor: v })}
                    presets={COLOR_PRESETS.backgrounds}
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
                  <NumberSlider
                    value={element.style.borderRadius || 8}
                    onChange={(v) => onUpdateElement({ borderRadius: v })}
                    min={0}
                    max={50}
                    unit="px"
                  />
                </Field>
              </Section>
            )}

            {/* Transform properties */}
            <Section title="Transform" icon={<RotateCcw size={14} />}>
              <div className="grid grid-cols-2 gap-2">
                <Field label="X Position">
                  <input
                    type="number"
                    value={Math.round(element.style.x)}
                    onChange={(e) => onUpdateElement({ x: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
                  />
                </Field>
                <Field label="Y Position">
                  <input
                    type="number"
                    value={Math.round(element.style.y)}
                    onChange={(e) => onUpdateElement({ y: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
                  />
                </Field>
                <Field label="Width">
                  <input
                    type="number"
                    value={Math.round(element.style.width)}
                    onChange={(e) => onUpdateElement({ width: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
                  />
                </Field>
                <Field label="Height">
                  <input
                    type="number"
                    value={Math.round(element.style.height)}
                    onChange={(e) => onUpdateElement({ height: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
                  />
                </Field>
              </div>
              <Field label="Rotation">
                <NumberSlider
                  value={element.style.rotation || 0}
                  onChange={(v) => onUpdateElement({ rotation: v })}
                  min={-180}
                  max={180}
                  unit="°"
                />
              </Field>
            </Section>

            {/* Appearance */}
            <Section title="Appearance" icon={<Layers size={14} />}>
              <Field label="Opacity">
                <NumberSlider
                  value={(element.style.opacity ?? 1) * 100}
                  onChange={(v) => onUpdateElement({ opacity: v / 100 })}
                  min={0}
                  max={100}
                  unit="%"
                />
              </Field>
              <Field label="Z-Index">
                <NumberSlider
                  value={element.style.zIndex}
                  onChange={(v) => onUpdateElement({ zIndex: v })}
                  min={0}
                  max={100}
                />
              </Field>
              {/* Background Color for shapes */}
              {element.type === 'shape' && (
                <Field label="Fill Color">
                  <ColorPicker
                    value={element.style.backgroundColor || '#3b82f6'}
                    onChange={(v) => onUpdateElement({ backgroundColor: v })}
                    presets={COLOR_PRESETS.backgrounds}
                  />
                </Field>
              )}
              {element.type !== 'text' && (
                <Field label="Border Radius">
                  <NumberSlider
                    value={element.style.borderRadius || 0}
                    onChange={(v) => onUpdateElement({ borderRadius: v })}
                    min={0}
                    max={100}
                    unit="px"
                  />
                </Field>
              )}
              <Field label="Blur">
                <NumberSlider
                  value={element.style.blur || 0}
                  onChange={(v) => onUpdateElement({ blur: v })}
                  min={0}
                  max={20}
                  unit="px"
                />
              </Field>
            </Section>
          </>
        ) : (
          /* Animation tab */
          <>
            <Section title="Enter Animation" defaultOpen>
              <Field label="Type">
                <Select
                  value={element.animation?.enter?.type || 'none'}
                  onChange={(v) =>
                    onUpdateElement({
                      animation: {
                        ...element.animation,
                        enter: {
                          type: v as AnimationType,
                          duration: ANIMATION_PRESETS[v as AnimationType].duration || 500,
                          delay: element.animation?.enter?.delay || 0,
                          easing: ANIMATION_PRESETS[v as AnimationType].easing || 'ease-out',
                        },
                      },
                    } as Partial<StoryElement>)
                  }
                  options={animationOptions}
                />
              </Field>
              {element.animation?.enter?.type && element.animation.enter.type !== 'none' && (
                <>
                  <Field label="Duration">
                    <NumberSlider
                      value={element.animation.enter.duration}
                      onChange={(v) =>
                        onUpdateElement({
                          animation: {
                            ...element.animation,
                            enter: { ...element.animation!.enter!, duration: v },
                          },
                        } as Partial<StoryElement>)
                      }
                      min={100}
                      max={3000}
                      step={100}
                      unit="ms"
                    />
                  </Field>
                  <Field label="Delay">
                    <NumberSlider
                      value={element.animation.enter.delay}
                      onChange={(v) =>
                        onUpdateElement({
                          animation: {
                            ...element.animation,
                            enter: { ...element.animation!.enter!, delay: v },
                          },
                        } as Partial<StoryElement>)
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

            <Section title="Loop Animation" defaultOpen={false}>
              <Field label="Type">
                <Select
                  value={element.animation?.loop?.type || 'none'}
                  onChange={(v) =>
                    onUpdateElement({
                      animation: {
                        ...element.animation,
                        loop: {
                          type: v as AnimationType,
                          duration: 1000,
                          delay: 0,
                          easing: 'ease-in-out',
                        },
                      },
                    } as Partial<StoryElement>)
                  }
                  options={[
                    { label: 'None', value: 'none' },
                    { label: 'Pulse', value: 'pulse' },
                    { label: 'Float', value: 'float' },
                    { label: 'Shake', value: 'shake' },
                  ]}
                />
              </Field>
            </Section>
          </>
        )}
      </div>
    </div>
  );
};

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
  Wand2,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ANIME_EASINGS,
  GSAP_ANIMATION_NAMES,
  GSAP_EASINGS,
  gsap,
  LOOP_ANIMATION_NAMES,
  playAnimeAnimation,
  playAnimeLoopAnimation,
  playGSAPAnimation,
  playLoopAnimation,
  playSpringLoopAnimation,
  SPRING_ANIMATION_NAMES,
  stopAnimations,
} from '../../animations';
import {
  ALL_ANIMATION_TEMPLATES,
  ANIME_TEMPLATES,
  GSAP_TEMPLATES,
  LOOP_TEMPLATES,
  type AnimationTemplate,
} from '../../animationTemplates';
import { StoryImagePicker, StoryVideoPicker } from '../pickers/StoryMediaPicker';
import {
  ANIMATION_PRESETS,
  COLOR_PRESETS,
  FONT_OPTIONS,
  TRANSITION_PRESETS,
  type AnimationType,
  type ElementStyle,
  type FontWeight,
  type ShapeType,
  type StoryElement,
  type StorySlide,
  type TextAlign,
  type TransitionType,
} from '../../types';

interface PropertiesPanelProps {
  element: StoryElement | null;
  slide: StorySlide;
  onUpdateElement: (updates: Partial<StoryElement> | Partial<ElementStyle>) => void;
  onUpdateSlide: (updates: Partial<StorySlide>) => void;
  onDeleteElement?: () => void;
  onDuplicateElement?: () => void;
  onToggleLock?: () => void;
  onPreviewAnimation?: () => void;
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

// Loop Animation Preview Component
const LoopAnimationPreview: React.FC<{
  animationType: string;
  engine: 'css' | 'gsap' | 'anime';
  bounce?: number;
  loopDelay?: number;
}> = ({ animationType, engine, bounce = 0.7, loopDelay = 250 }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<ReturnType<typeof playLoopAnimation> | ReturnType<typeof playAnimeLoopAnimation> | null>(
    null
  );

  useEffect(() => {
    if (!previewRef.current || !animationType || animationType === 'none') {
      return;
    }

    // Clean up previous animation
    if (animationRef.current) {
      if (engine === 'gsap') {
        stopAnimations(previewRef.current);
      } else if ('cancel' in animationRef.current) {
        (animationRef.current as { cancel: () => void }).cancel();
      }
    }

    // Start new animation
    if (engine === 'gsap') {
      animationRef.current = playLoopAnimation(previewRef.current, animationType, 'gsap');
    } else if (engine === 'anime') {
      if (animationType.startsWith('spring')) {
        animationRef.current = playSpringLoopAnimation(previewRef.current, animationType, {
          bounce,
          loopDelay,
        });
      } else {
        animationRef.current = playAnimeLoopAnimation(previewRef.current, animationType, {
          duration: 1000,
        });
      }
    }

    return () => {
      if (previewRef.current && animationRef.current) {
        if (engine === 'gsap') {
          stopAnimations(previewRef.current);
        } else if ('cancel' in animationRef.current) {
          (animationRef.current as { cancel: () => void }).cancel();
        }
      }
    };
  }, [animationType, engine, bounce, loopDelay]);

  if (!animationType || animationType === 'none') {
    return null;
  }

  return (
    <div className="mt-2 p-3 bg-slate-900 rounded-lg border border-slate-700">
      <div className="text-xs text-slate-500 mb-2">Preview</div>
      <div className="flex justify-center items-center h-16 bg-slate-800 rounded">
        <div ref={previewRef} className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg" />
      </div>
    </div>
  );
};

// Enter Animation Preview Component
const EnterAnimationPreview: React.FC<{
  animationType: string;
  engine?: 'css' | 'gsap' | 'anime';
  gsapType?: string;
  animeType?: string;
  duration?: number;
  easing?: string;
}> = ({ animationType, engine = 'css', gsapType, animeType, duration = 500, easing }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [key, setKey] = useState(0); // For re-triggering animation

  const playAnimation = useCallback(() => {
    if (!previewRef.current || isPlaying) return;

    setIsPlaying(true);
    const el = previewRef.current;

    // Reset element to initial hidden state
    gsap.set(el, { opacity: 0, scale: 0.5, x: 0, y: 0, rotation: 0 });

    // Small delay to ensure reset is applied
    requestAnimationFrame(() => {
      if (!previewRef.current) return;

      if (engine === 'gsap' && gsapType) {
        // Use GSAP animation
        playGSAPAnimation(previewRef.current, gsapType, {
          duration: duration / 1000,
          ease: easing || 'power2.out',
          onComplete: () => setIsPlaying(false),
        });
      } else if (engine === 'anime' && animeType) {
        // Use Anime.js animation
        const anim = playAnimeAnimation(previewRef.current, animeType, {
          duration,
          easing: easing || 'easeOutQuad',
          onComplete: () => setIsPlaying(false),
        });
        if (!anim) {
          // Fallback if animation not found
          gsap.to(el, { opacity: 1, scale: 1, duration: duration / 1000, onComplete: () => setIsPlaying(false) });
        }
      } else if (engine === 'css' && animationType && animationType !== 'none') {
        // CSS animation - use GSAP for preview since CSS keyframes are complex
        const animationMap: Record<string, object> = {
          fadeIn: { opacity: 0 },
          fadeOut: { opacity: 1 },
          fadeInUp: { opacity: 0, y: 30 },
          fadeInDown: { opacity: 0, y: -30 },
          slideInLeft: { x: -50, opacity: 0 },
          slideInRight: { x: 50, opacity: 0 },
          slideInUp: { y: 50, opacity: 0 },
          slideInDown: { y: -50, opacity: 0 },
          scaleIn: { scale: 0, opacity: 0 },
          scaleOut: { scale: 1.5, opacity: 0 },
          bounceIn: { scale: 0, opacity: 0 },
          rotateIn: { rotation: -180, scale: 0, opacity: 0 },
          zoomIn: { scale: 0.3, opacity: 0 },
          pulse: { scale: 0.9 },
          shake: { x: -10 },
          float: { y: 10 },
        };

        const fromVars = animationMap[animationType] || { opacity: 0 };
        gsap.set(el, fromVars);
        
        gsap.to(el, {
          opacity: 1,
          scale: 1,
          x: 0,
          y: 0,
          rotation: 0,
          duration: duration / 1000,
          ease: animationType === 'bounceIn' ? 'bounce.out' : 'power2.out',
          onComplete: () => setIsPlaying(false),
        });
      } else {
        // No animation, just show
        gsap.to(el, { opacity: 1, scale: 1, duration: 0.3, onComplete: () => setIsPlaying(false) });
      }
    });
  }, [engine, gsapType, animeType, animationType, duration, easing, isPlaying]);

  // Play animation when type changes or replay is clicked
  useEffect(() => {
    const hasAnimation = 
      (engine === 'gsap' && gsapType) || 
      (engine === 'anime' && animeType) || 
      (engine === 'css' && animationType && animationType !== 'none');
    
    if (hasAnimation) {
      // Small delay to let the component mount
      const timer = setTimeout(() => playAnimation(), 100);
      return () => clearTimeout(timer);
    }
  }, [gsapType, animeType, animationType, engine, key]);

  // Don't show if no animation selected
  const hasAnimation = 
    (engine === 'gsap' && gsapType) || 
    (engine === 'anime' && animeType) || 
    (engine === 'css' && animationType && animationType !== 'none');
  
  if (!hasAnimation) {
    return null;
  }

  return (
    <div className="mt-2 p-3 bg-slate-900 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-slate-500">Preview</div>
        <button
          onClick={() => {
            if (!isPlaying) {
              setKey((k) => k + 1);
            }
          }}
          disabled={isPlaying}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            isPlaying ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500'
          }`}
        >
          {isPlaying ? '...' : '▶ Replay'}
        </button>
      </div>
      <div className="flex justify-center items-center h-16 bg-slate-800 rounded overflow-hidden">
        <div
          ref={previewRef}
          className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg"
          style={{ opacity: 0, transform: 'scale(0.5)' }}
        />
      </div>
    </div>
  );
};

export const PropertiesPanelV2: React.FC<PropertiesPanelProps> = ({
  element,
  slide,
  onUpdateElement,
  onUpdateSlide,
  onDeleteElement,
  onDuplicateElement,
  onToggleLock,
  onPreviewAnimation,
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
            <div className="flex gap-1">
              {(['color', 'image', 'video', 'gradient'] as const).map((type) => (
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

          {slide.background.type === 'image' && (
            <div className="space-y-3">
              <Field label="Chọn hình">
                <StoryImagePicker
                  value={slide.background.value || ''}
                  onChange={(v) => onUpdateSlide({ background: { ...slide.background, value: v } })}
                  label="Hình nền Slide"
                />
              </Field>
              {slide.background.value && (
                <>
                  <Field label="Size">
                    <Select
                      value={slide.background.size || 'cover'}
                      onChange={(v) => onUpdateSlide({ background: { ...slide.background, size: v } })}
                      options={[
                        { label: 'Cover', value: 'cover' },
                        { label: 'Contain', value: 'contain' },
                        { label: 'Auto', value: 'auto' },
                        { label: '100%', value: '100% 100%' },
                      ]}
                    />
                  </Field>
                  <Field label="Position">
                    <Select
                      value={slide.background.position || 'center'}
                      onChange={(v) => onUpdateSlide({ background: { ...slide.background, position: v } })}
                      options={[
                        { label: 'Center', value: 'center' },
                        { label: 'Top', value: 'top' },
                        { label: 'Bottom', value: 'bottom' },
                        { label: 'Left', value: 'left' },
                        { label: 'Right', value: 'right' },
                        { label: 'Top Left', value: 'top left' },
                        { label: 'Top Right', value: 'top right' },
                        { label: 'Bottom Left', value: 'bottom left' },
                        { label: 'Bottom Right', value: 'bottom right' },
                      ]}
                    />
                  </Field>
                  <Field label="Overlay">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!slide.background.overlay}
                        onChange={(e) =>
                          onUpdateSlide({
                            background: {
                              ...slide.background,
                              overlay: e.target.checked ? 'rgba(0,0,0,0.5)' : undefined,
                            },
                          })
                        }
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                      />
                      {slide.background.overlay && (
                        <input
                          type="text"
                          value={slide.background.overlay}
                          onChange={(e) =>
                            onUpdateSlide({
                              background: { ...slide.background, overlay: e.target.value },
                            })
                          }
                          placeholder="rgba(0,0,0,0.5)"
                          className="flex-1 px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white"
                        />
                      )}
                    </div>
                  </Field>
                </>
              )}
            </div>
          )}

          {slide.background.type === 'video' && (
            <div className="space-y-3">
              <Field label="Chọn video">
                <StoryVideoPicker
                  value={slide.background.value || ''}
                  onChange={(v) => onUpdateSlide({ background: { ...slide.background, value: v } })}
                  label="Video nền Slide"
                />
              </Field>
              {slide.background.value && (
                <Field label="Overlay">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!slide.background.overlay}
                      onChange={(e) =>
                        onUpdateSlide({
                          background: {
                            ...slide.background,
                            overlay: e.target.checked ? 'rgba(0,0,0,0.5)' : undefined,
                          },
                        })
                      }
                      className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                    />
                    {slide.background.overlay && (
                      <input
                        type="text"
                        value={slide.background.overlay}
                        onChange={(e) =>
                          onUpdateSlide({
                            background: { ...slide.background, overlay: e.target.value },
                          })
                        }
                        placeholder="rgba(0,0,0,0.5)"
                        className="flex-1 px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white"
                      />
                    )}
                  </div>
                </Field>
              )}
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

            {/* Image-specific properties */}
            {element.type === 'image' && (
              <Section title="Image" defaultOpen>
                <Field label="Image Source">
                  <StoryImagePicker
                    value={element.content || ''}
                    onChange={(value) => onUpdateElement({ content: value })}
                  />
                </Field>
                <Field label="Size">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        onUpdateElement({
                          style: {
                            ...element.style,
                            width: 360,
                            height: 640,
                            x: 0,
                            y: 0,
                          },
                        })
                      }
                      className="flex-1 py-2 text-xs rounded transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600"
                    >
                      Full Size
                    </button>
                    <button
                      onClick={() =>
                        onUpdateElement({
                          style: { ...element.style, width: 280, height: 200 },
                        })
                      }
                      className="flex-1 py-2 text-xs rounded transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600"
                    >
                      Medium
                    </button>
                    <button
                      onClick={() =>
                        onUpdateElement({
                          style: { ...element.style, width: 150, height: 150 },
                        })
                      }
                      className="flex-1 py-2 text-xs rounded transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600"
                    >
                      Small
                    </button>
                  </div>
                </Field>
                <Field label="Shape">
                  <div className="flex gap-2">
                    {(
                      [
                        { label: 'Square', value: 0 },
                        { label: 'Rounded', value: 12 },
                        { label: 'Circle', value: 999 },
                      ] as const
                    ).map((shape) => (
                      <button
                        key={shape.label}
                        onClick={() =>
                          onUpdateElement({
                            borderRadius: shape.value,
                          })
                        }
                        className={`flex-1 py-2 text-xs rounded transition-colors ${
                          element.style.borderRadius === shape.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {shape.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Border Radius">
                  <NumberSlider
                    value={element.style.borderRadius || 0}
                    onChange={(v) => onUpdateElement({ borderRadius: v })}
                    min={0}
                    max={100}
                    unit="px"
                  />
                </Field>
                <Field label="Opacity">
                  <NumberSlider
                    value={(element.style.opacity ?? 1) * 100}
                    onChange={(v) => onUpdateElement({ opacity: v / 100 })}
                    min={0}
                    max={100}
                    unit="%"
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

            {/* Quote-specific properties */}
            {element.type === 'quote' && (
              <Section title="Quote" defaultOpen>
                <Field label="Quote Text">
                  <textarea
                    value={element.content}
                    onChange={(e) => onUpdateElement({ content: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Your quote here..."
                  />
                </Field>
                <Field label="Author">
                  <input
                    type="text"
                    value={element.quote?.author || ''}
                    onChange={(e) =>
                      onUpdateElement({
                        quote: { ...element.quote, author: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="Author name"
                  />
                </Field>
                <Field label="Font Size">
                  <NumberSlider
                    value={element.style.fontSize || 20}
                    onChange={(v) => onUpdateElement({ fontSize: v })}
                    min={12}
                    max={48}
                    unit="px"
                  />
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

            {/* List-specific properties */}
            {element.type === 'list' && (
              <Section title="List" defaultOpen>
                <Field label="List Type">
                  <div className="flex gap-2">
                    {(['bullet', 'numbered', 'checklist'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() =>
                          onUpdateElement({
                            list: { ...element.list!, type },
                          })
                        }
                        className={`flex-1 py-2 text-xs rounded transition-colors capitalize ${
                          element.list?.type === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Items (one per line)">
                  <textarea
                    value={element.list?.items?.join('\n') || ''}
                    onChange={(e) =>
                      onUpdateElement({
                        list: { ...element.list!, items: e.target.value.split('\n').filter(Boolean) },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={4}
                    placeholder="Item 1&#10;Item 2&#10;Item 3"
                  />
                </Field>
                <Field label="Font Size">
                  <NumberSlider
                    value={element.style.fontSize || 16}
                    onChange={(v) => onUpdateElement({ fontSize: v })}
                    min={10}
                    max={32}
                    unit="px"
                  />
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

            {/* Rating-specific properties */}
            {element.type === 'rating' && (
              <Section title="Rating" defaultOpen>
                <Field label="Value">
                  <NumberSlider
                    value={element.rating?.value || 0}
                    onChange={(v) =>
                      onUpdateElement({
                        rating: { ...element.rating!, value: v },
                      })
                    }
                    min={0}
                    max={element.rating?.max || 5}
                    step={1}
                  />
                </Field>
                <Field label="Max Value">
                  <NumberSlider
                    value={element.rating?.max || 5}
                    onChange={(v) =>
                      onUpdateElement({
                        rating: { ...element.rating!, max: v },
                      })
                    }
                    min={3}
                    max={10}
                    step={1}
                  />
                </Field>
                <Field label="Icon">
                  <div className="flex gap-2">
                    {(['star', 'heart', 'circle'] as const).map((icon) => (
                      <button
                        key={icon}
                        onClick={() =>
                          onUpdateElement({
                            rating: { ...element.rating!, icon },
                          })
                        }
                        className={`flex-1 py-2 text-xl rounded transition-colors ${
                          element.rating?.icon === icon ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      >
                        {icon === 'star' ? '⭐' : icon === 'heart' ? '❤️' : '●'}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Show Value">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={element.rating?.showValue ?? true}
                      onChange={(e) =>
                        onUpdateElement({
                          rating: { ...element.rating!, showValue: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className="text-sm text-slate-300">Display rating number</span>
                  </label>
                </Field>
              </Section>
            )}

            {/* Progress-specific properties */}
            {element.type === 'progress' && (
              <Section title="Progress" defaultOpen>
                <Field label="Value">
                  <NumberSlider
                    value={element.progress?.value || 0}
                    onChange={(v) =>
                      onUpdateElement({
                        progress: { ...element.progress!, value: v },
                      })
                    }
                    min={0}
                    max={element.progress?.max || 100}
                    step={1}
                  />
                </Field>
                <Field label="Label">
                  <input
                    type="text"
                    value={element.progress?.label || ''}
                    onChange={(e) =>
                      onUpdateElement({
                        progress: { ...element.progress!, label: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="Progress label"
                  />
                </Field>
                <Field label="Variant">
                  <div className="flex gap-2">
                    {(['bar', 'circle'] as const).map((variant) => (
                      <button
                        key={variant}
                        onClick={() =>
                          onUpdateElement({
                            progress: { ...element.progress!, variant },
                          })
                        }
                        className={`flex-1 py-2 text-xs rounded transition-colors capitalize ${
                          element.progress?.variant === variant
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {variant}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Show Percentage">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={element.progress?.showPercent ?? true}
                      onChange={(e) =>
                        onUpdateElement({
                          progress: { ...element.progress!, showPercent: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className="text-sm text-slate-300">Display percentage</span>
                  </label>
                </Field>
              </Section>
            )}

            {/* Avatar-specific properties */}
            {element.type === 'avatar' && (
              <Section title="Avatar" defaultOpen>
                <Field label="Image URL">
                  <StoryImagePicker
                    value={element.content || ''}
                    onChange={(value) => onUpdateElement({ content: value })}
                  />
                </Field>
                <Field label="Name">
                  <input
                    type="text"
                    value={element.avatar?.name || ''}
                    onChange={(e) =>
                      onUpdateElement({
                        avatar: { ...element.avatar, name: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="User Name"
                  />
                </Field>
                <Field label="Subtitle">
                  <input
                    type="text"
                    value={element.avatar?.subtitle || ''}
                    onChange={(e) =>
                      onUpdateElement({
                        avatar: { ...element.avatar, subtitle: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="@username"
                  />
                </Field>
                <Field label="Size">
                  <div className="flex gap-2">
                    {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() =>
                          onUpdateElement({
                            avatar: { ...element.avatar, size },
                          })
                        }
                        className={`flex-1 py-2 text-xs rounded transition-colors uppercase ${
                          element.avatar?.size === size
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Shape">
                  <div className="flex gap-2">
                    {(['circle', 'square', 'rounded'] as const).map((shape) => (
                      <button
                        key={shape}
                        onClick={() =>
                          onUpdateElement({
                            avatar: { ...element.avatar, shape },
                          })
                        }
                        className={`flex-1 py-2 text-xs rounded transition-colors capitalize ${
                          element.avatar?.shape === shape
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Background Color">
                  <ColorPicker
                    value={element.style.backgroundColor || '#3b82f6'}
                    onChange={(v) => onUpdateElement({ backgroundColor: v })}
                    presets={COLOR_PRESETS.backgrounds}
                  />
                </Field>
              </Section>
            )}

            {/* Timer-specific properties */}
            {element.type === 'timer' && (
              <Section title="Timer" defaultOpen>
                <Field label="Duration (seconds)">
                  <NumberSlider
                    value={element.timer?.duration || 60}
                    onChange={(v) =>
                      onUpdateElement({
                        timer: { ...element.timer!, duration: v },
                      })
                    }
                    min={1}
                    max={600}
                    step={1}
                    unit="s"
                  />
                </Field>
                <Field label="Show Labels">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={element.timer?.showLabels ?? true}
                      onChange={(e) =>
                        onUpdateElement({
                          timer: { ...element.timer!, showLabels: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className="text-sm text-slate-300">Display min/sec labels</span>
                  </label>
                </Field>
                <Field label="Font Size">
                  <NumberSlider
                    value={element.style.fontSize || 36}
                    onChange={(v) => onUpdateElement({ fontSize: v })}
                    min={16}
                    max={72}
                    unit="px"
                  />
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

            {/* Countdown-specific properties */}
            {element.type === 'countdown' && (
              <Section title="Countdown" defaultOpen>
                <Field label="Target Date">
                  <input
                    type="datetime-local"
                    value={element.countdown?.targetDate?.slice(0, 16) || ''}
                    onChange={(e) =>
                      onUpdateElement({
                        countdown: { ...element.countdown!, targetDate: new Date(e.target.value).toISOString() },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </Field>
                <Field label="Label">
                  <input
                    type="text"
                    value={element.countdown?.label || ''}
                    onChange={(e) =>
                      onUpdateElement({
                        countdown: { ...element.countdown!, label: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="Ends in"
                  />
                </Field>
                <Field label="Font Size">
                  <NumberSlider
                    value={element.style.fontSize || 28}
                    onChange={(v) => onUpdateElement({ fontSize: v })}
                    min={14}
                    max={48}
                    unit="px"
                  />
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

            {element.type === 'slider' && (
              <Section title="Slider" defaultOpen>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">Slides</p>
                    <button
                      type="button"
                      onClick={() => {
                        const prevImages = element.slider?.images || [];
                        const nextImages = [...prevImages, { src: '', caption: `Slide ${prevImages.length + 1}` }];
                        onUpdateElement({
                          slider: { ...element.slider, images: nextImages },
                        });
                      }}
                      className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-200 hover:bg-slate-600"
                    >
                      Add slide
                    </button>
                  </div>

                  {(element.slider?.images || []).length === 0 && (
                    <div className="text-xs text-slate-400">No slides yet. Click "Add slide".</div>
                  )}

                  {(element.slider?.images || []).map((img, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-700 bg-slate-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-medium">Slide {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const prevImages = element.slider?.images || [];
                            const nextImages = prevImages.filter((_, i) => i !== idx);
                            onUpdateElement({
                              slider: { ...element.slider, images: nextImages },
                            });
                          }}
                          className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-300 hover:bg-red-500/30"
                        >
                          Remove
                        </button>
                      </div>

                      <Field label="Image">
                        <StoryImagePicker
                          value={img.src || ''}
                          onChange={(value) => {
                            const prevImages = element.slider?.images || [];
                            const nextImages = prevImages.map((it, i) => (i === idx ? { ...it, src: value } : it));
                            onUpdateElement({
                              slider: { ...element.slider, images: nextImages },
                            });
                          }}
                        />
                      </Field>

                      <Field label="Caption">
                        <input
                          type="text"
                          value={img.caption || ''}
                          onChange={(e) => {
                            const prevImages = element.slider?.images || [];
                            const nextImages = prevImages.map((it, i) =>
                              i === idx ? { ...it, caption: e.target.value } : it
                            );
                            onUpdateElement({
                              slider: { ...element.slider, images: nextImages },
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                          placeholder="Slide caption"
                        />
                      </Field>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Location-specific properties */}
            {element.type === 'location' && (
              <Section title="Location" defaultOpen>
                <Field label="Location Name">
                  <input
                    type="text"
                    value={element.location?.name || ''}
                    onChange={(e) =>
                      onUpdateElement({
                        location: { ...element.location, name: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="Location Name"
                  />
                </Field>
                <Field label="Address">
                  <input
                    type="text"
                    value={element.location?.address || ''}
                    onChange={(e) =>
                      onUpdateElement({
                        location: { ...element.location!, address: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="Address (optional)"
                  />
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

            {/* Mention-specific properties */}
            {element.type === 'mention' && (
              <Section title="Mention" defaultOpen>
                <Field label="Username">
                  <input
                    type="text"
                    value={element.mention?.username || ''}
                    onChange={(e) =>
                      onUpdateElement({
                        mention: { ...element.mention, username: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="username"
                  />
                </Field>
                <Field label="Platform">
                  <div className="flex gap-2">
                    {(['instagram', 'twitter', 'tiktok'] as const).map((platform) => (
                      <button
                        key={platform}
                        onClick={() =>
                          onUpdateElement({
                            mention: { ...element.mention!, platform },
                          })
                        }
                        className={`flex-1 py-2 text-xs rounded transition-colors capitalize ${
                          element.mention?.platform === platform
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Verified Badge">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={element.mention?.verified ?? false}
                      onChange={(e) =>
                        onUpdateElement({
                          mention: { ...element.mention!, verified: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className="text-sm text-slate-300">Show verified badge</span>
                  </label>
                </Field>
                <Field label="Color">
                  <ColorPicker
                    value={element.style.color || '#3b82f6'}
                    onChange={(v) => onUpdateElement({ color: v })}
                    presets={COLOR_PRESETS.backgrounds}
                  />
                </Field>
              </Section>
            )}

            {/* Hashtag-specific properties */}
            {element.type === 'hashtag' && (
              <Section title="Hashtags" defaultOpen>
                <Field label="Tags (one per line)">
                  <textarea
                    value={element.hashtag?.tags?.join('\n') || ''}
                    onChange={(e) =>
                      onUpdateElement({
                        hashtag: {
                          ...element.hashtag!,
                          tags: e.target.value
                            .split('\n')
                            .filter(Boolean)
                            .map((t) => t.replace('#', '')),
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="trending&#10;viral&#10;fyp"
                  />
                </Field>
                <Field label="Color">
                  <ColorPicker
                    value={element.style.color || '#3b82f6'}
                    onChange={(v) => onUpdateElement({ color: v })}
                    presets={COLOR_PRESETS.backgrounds}
                  />
                </Field>
              </Section>
            )}

            {/* Codeblock-specific properties */}
            {element.type === 'codeblock' && (
              <Section title="Code" defaultOpen>
                <Field label="Code">
                  <textarea
                    value={element.content}
                    onChange={(e) => onUpdateElement({ content: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none font-mono"
                    rows={5}
                    placeholder="const hello = 'world';"
                  />
                </Field>
                <Field label="Language">
                  <Select
                    value={element.codeblock?.language || 'javascript'}
                    onChange={(v) =>
                      onUpdateElement({
                        codeblock: { ...element.codeblock!, language: v },
                      })
                    }
                    options={[
                      { label: 'JavaScript', value: 'javascript' },
                      { label: 'TypeScript', value: 'typescript' },
                      { label: 'Python', value: 'python' },
                      { label: 'HTML', value: 'html' },
                      { label: 'CSS', value: 'css' },
                      { label: 'JSON', value: 'json' },
                    ]}
                  />
                </Field>
                <Field label="Theme">
                  <div className="flex gap-2">
                    {(['dark', 'light'] as const).map((theme) => (
                      <button
                        key={theme}
                        onClick={() =>
                          onUpdateElement({
                            codeblock: { ...element.codeblock!, theme },
                          })
                        }
                        className={`flex-1 py-2 text-xs rounded transition-colors capitalize ${
                          element.codeblock?.theme === theme
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </Field>
              </Section>
            )}

            {/* QR Code-specific properties */}
            {element.type === 'qrcode' && (
              <Section title="QR Code" defaultOpen>
                <Field label="Data / URL">
                  <input
                    type="text"
                    value={element.qrcode?.data || ''}
                    onChange={(e) =>
                      onUpdateElement({
                        qrcode: { ...element.qrcode!, data: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="https://example.com"
                  />
                </Field>
                <Field label="Size">
                  <NumberSlider
                    value={element.qrcode?.size || 150}
                    onChange={(v) =>
                      onUpdateElement({
                        qrcode: { ...element.qrcode!, size: v },
                      })
                    }
                    min={50}
                    max={300}
                    unit="px"
                  />
                </Field>
                <Field label="Color">
                  <ColorPicker
                    value={element.qrcode?.color || '#000000'}
                    onChange={(v) =>
                      onUpdateElement({
                        qrcode: { ...element.qrcode!, color: v },
                      })
                    }
                    presets={['#000000', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af']}
                  />
                </Field>
                <Field label="Background">
                  <ColorPicker
                    value={element.qrcode?.bgColor || '#ffffff'}
                    onChange={(v) =>
                      onUpdateElement({
                        qrcode: { ...element.qrcode!, bgColor: v },
                      })
                    }
                    presets={COLOR_PRESETS.text}
                  />
                </Field>
              </Section>
            )}

            {/* Embed-specific properties */}
            {element.type === 'embed' && (
              <Section title="Embed" defaultOpen>
                <Field label="Platform">
                  <Select
                    value={element.embed?.type || 'youtube'}
                    onChange={(v) =>
                      onUpdateElement({
                        embed: {
                          ...element.embed!,
                          type: v as 'youtube' | 'spotify' | 'twitter' | 'instagram' | 'tiktok' | 'custom',
                        },
                      })
                    }
                    options={[
                      { label: 'YouTube', value: 'youtube' },
                      { label: 'Spotify', value: 'spotify' },
                      { label: 'Twitter', value: 'twitter' },
                      { label: 'Instagram', value: 'instagram' },
                      { label: 'TikTok', value: 'tiktok' },
                      { label: 'Custom', value: 'custom' },
                    ]}
                  />
                </Field>
                <Field label="URL">
                  <input
                    type="url"
                    value={element.embed?.url || ''}
                    onChange={(e) =>
                      onUpdateElement({
                        embed: { ...element.embed!, url: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="Paste embed URL..."
                  />
                </Field>
              </Section>
            )}

            {/* Poll-specific properties */}
            {element.type === 'poll' && (
              <Section title="Poll" defaultOpen>
                <Field label="Question">
                  <input
                    type="text"
                    value={element.poll?.question || ''}
                    onChange={(e) =>
                      onUpdateElement({
                        poll: { ...element.poll!, question: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="Your question?"
                  />
                </Field>
                <Field label="Options (one per line)">
                  <textarea
                    value={element.poll?.options?.join('\n') || ''}
                    onChange={(e) =>
                      onUpdateElement({
                        poll: { ...element.poll!, options: e.target.value.split('\n').filter(Boolean) },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={4}
                    placeholder="Option A&#10;Option B&#10;Option C"
                  />
                </Field>
                <Field label="Submit URL (POST)">
                  <input
                    type="url"
                    value={element.poll?.submitUrl || ''}
                    onChange={(e) =>
                      onUpdateElement({
                        poll: { ...element.poll!, submitUrl: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="https://your-endpoint.example.com/poll"
                  />
                </Field>
              </Section>
            )}

            {/* Divider-specific properties */}
            {element.type === 'divider' && (
              <Section title="Divider" defaultOpen>
                <Field label="Style">
                  <div className="flex gap-2">
                    {(['solid', 'dashed', 'dotted', 'gradient'] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() =>
                          onUpdateElement({
                            divider: { ...element.divider!, style },
                          })
                        }
                        className={`flex-1 py-2 text-xs rounded transition-colors capitalize ${
                          element.divider?.style === style
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Thickness">
                  <NumberSlider
                    value={element.divider?.thickness || 2}
                    onChange={(v) =>
                      onUpdateElement({
                        divider: { ...element.divider!, thickness: v },
                      })
                    }
                    min={1}
                    max={10}
                    unit="px"
                  />
                </Field>
                <Field label="Color">
                  <ColorPicker
                    value={element.style.backgroundColor || '#ffffff'}
                    onChange={(v) => onUpdateElement({ backgroundColor: v })}
                    presets={COLOR_PRESETS.text}
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
              {/* Shape Type Selector */}
              {element.type === 'shape' && (
                <Field label="Shape Type">
                  <Select
                    value={element.shapeType || 'rectangle'}
                    onChange={(v) => onUpdateElement({ shapeType: v as ShapeType })}
                    options={[
                      { label: 'Rectangle', value: 'rectangle' },
                      { label: 'Circle', value: 'circle' },
                      { label: 'Triangle', value: 'triangle' },
                      { label: 'Star', value: 'star' },
                      { label: 'Heart', value: 'heart' },
                      { label: 'Hexagon', value: 'hexagon' },
                      { label: 'Pentagon', value: 'pentagon' },
                      { label: 'Diamond', value: 'diamond' },
                      { label: 'Arrow', value: 'arrow' },
                      { label: 'Line', value: 'line' },
                      { label: 'Cross', value: 'cross' },
                      { label: 'Octagon', value: 'octagon' },
                      { label: 'Squircle', value: 'squircle' },
                      { label: 'Pill', value: 'pill' },
                      { label: 'Ring', value: 'ring' },
                      { label: 'Donut', value: 'donut' },
                      { label: 'Blob', value: 'blob' },
                      { label: 'Cloud', value: 'cloud' },
                      { label: 'Lightning', value: 'lightning' },
                      { label: 'Moon', value: 'moon' },
                      { label: 'Sun', value: 'sun' },
                      { label: 'Check', value: 'check' },
                      { label: 'X Mark', value: 'x-mark' },
                      { label: 'Bracket', value: 'bracket' },
                      { label: 'Cursor', value: 'cursor' },
                      { label: 'Zigzag', value: 'zigzag' },
                      { label: 'Frame', value: 'frame' },
                      { label: 'Corner', value: 'corner' },
                      { label: 'Spiral', value: 'spiral' },
                    ]}
                  />
                </Field>
              )}
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
            {/* Animation Templates Section */}
            <Section title="Animation Templates" icon={<Wand2 size={14} />} defaultOpen>
              <div className="space-y-3">
                {/* Template Category Filter */}
                <div className="flex gap-1 flex-wrap">
                  {[
                    { label: 'GSAP', templates: GSAP_TEMPLATES, color: 'green' },
                    { label: 'Anime', templates: ANIME_TEMPLATES, color: 'purple' },
                    { label: 'Loop', templates: LOOP_TEMPLATES, color: 'orange' },
                  ].map(({ label, templates, color }) => (
                    <div key={label} className="flex-1 min-w-[80px]">
                      <div className={`text-[10px] font-medium mb-1 text-${color}-400 flex items-center gap-1`}>
                        <Zap size={10} /> {label}
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {templates.slice(0, 5).map((template: AnimationTemplate) => (
                          <button
                            key={template.id}
                            onClick={() => {
                              // Apply template animation
                              if (template.category === 'emphasis' && template.id.startsWith('loop-')) {
                                // Loop animation
                                onUpdateElement({
                                  animation: {
                                    ...element.animation,
                                    loop: {
                                      ...template.animation,
                                      engine: template.engine,
                                      type: template.animation.type || 'pulse',
                                    },
                                  },
                                } as Partial<StoryElement>);
                              } else {
                                // Enter animation
                                onUpdateElement({
                                  animation: {
                                    ...element.animation,
                                    enter: {
                                      ...template.animation,
                                      engine: template.engine,
                                      gsapType: template.engine === 'gsap' ? template.animation.type : undefined,
                                      animeType: template.engine === 'anime' ? template.animation.type : undefined,
                                    },
                                  },
                                } as Partial<StoryElement>);
                              }
                              // Trigger animation preview
                              setTimeout(() => onPreviewAnimation?.(), 50);
                            }}
                            className="w-full px-2 py-1.5 text-[10px] text-left bg-slate-700/50 hover:bg-slate-600 rounded transition-colors"
                            title={template.description}
                          >
                            {template.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* All Templates Dropdown */}
                <details className="group">
                  <summary className="cursor-pointer text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <ChevronDown size={12} className="group-open:rotate-180 transition-transform" />
                    Xem tất cả templates ({ALL_ANIMATION_TEMPLATES.length})
                  </summary>
                  <div className="mt-2 grid grid-cols-2 gap-1 max-h-48 overflow-y-auto p-1 bg-slate-800/50 rounded">
                    {ALL_ANIMATION_TEMPLATES.map((template: AnimationTemplate) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          if (template.category === 'emphasis' && template.id.startsWith('loop-')) {
                            onUpdateElement({
                              animation: {
                                ...element.animation,
                                loop: {
                                  ...template.animation,
                                  engine: template.engine,
                                  type: template.animation.type || 'pulse',
                                },
                              },
                            } as Partial<StoryElement>);
                          } else {
                            onUpdateElement({
                              animation: {
                                ...element.animation,
                                enter: {
                                  ...template.animation,
                                  engine: template.engine,
                                  gsapType: template.engine === 'gsap' ? template.animation.type : undefined,
                                  animeType: template.engine === 'anime' ? template.animation.type : undefined,
                                },
                              },
                            } as Partial<StoryElement>);
                          }
                          // Trigger animation preview
                          setTimeout(() => onPreviewAnimation?.(), 50);
                        }}
                        className={`p-2 text-[10px] text-left rounded transition-colors ${
                          template.engine === 'gsap'
                            ? 'bg-green-900/30 hover:bg-green-800/50 border border-green-800/50'
                            : template.engine === 'anime'
                              ? 'bg-purple-900/30 hover:bg-purple-800/50 border border-purple-800/50'
                              : 'bg-slate-700/50 hover:bg-slate-600 border border-slate-600/50'
                        }`}
                        title={template.description}
                      >
                        <div className="font-medium text-slate-200 truncate">{template.name}</div>
                        <div className="text-[9px] text-slate-400 truncate">{template.category}</div>
                      </button>
                    ))}
                  </div>
                </details>
              </div>
            </Section>

            <Section title="Enter Animation" defaultOpen>
              {/* Animation Engine Selector */}
              <Field label="Engine">
                <div className="flex gap-1">
                  {(['css', 'gsap', 'anime'] as const).map((engine) => (
                    <button
                      key={engine}
                      onClick={() =>
                        onUpdateElement({
                          animation: {
                            ...element.animation,
                            enter: { ...element.animation?.enter, engine, type: 'none' as AnimationType },
                          },
                        } as Partial<StoryElement>)
                      }
                      className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                        (element.animation?.enter?.engine || 'css') === engine
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {engine === 'css' ? 'CSS' : engine === 'gsap' ? 'GSAP' : 'Anime'}
                    </button>
                  ))}
                </div>
              </Field>

              {/* CSS Animations */}
              {(element.animation?.enter?.engine || 'css') === 'css' && (
                <Field label="Type">
                  <Select
                    value={element.animation?.enter?.type || 'none'}
                    onChange={(v) =>
                      onUpdateElement({
                        animation: {
                          ...element.animation,
                          enter: {
                            ...element.animation?.enter,
                            type: v as AnimationType,
                            duration: ANIMATION_PRESETS[v as AnimationType]?.duration || 500,
                            delay: element.animation?.enter?.delay || 0,
                            easing: ANIMATION_PRESETS[v as AnimationType]?.easing || 'ease-out',
                          },
                        },
                      } as Partial<StoryElement>)
                    }
                    options={animationOptions}
                  />
                </Field>
              )}

              {/* GSAP Animations */}
              {element.animation?.enter?.engine === 'gsap' && (
                <>
                  <Field label="Animation">
                    <Select
                      value={element.animation?.enter?.gsapType || 'fadeIn'}
                      onChange={(v) =>
                        onUpdateElement({
                          animation: {
                            ...element.animation,
                            enter: {
                              ...element.animation?.enter,
                              gsapType: v,
                              type: 'fadeIn' as AnimationType,
                              duration: element.animation?.enter?.duration || 600,
                              delay: element.animation?.enter?.delay || 0,
                              easing: 'ease-out',
                            },
                          },
                        } as Partial<StoryElement>)
                      }
                      options={GSAP_ANIMATION_NAMES.map((name) => ({
                        label: name.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
                        value: name,
                      }))}
                    />
                  </Field>
                  <Field label="Easing">
                    <Select
                      value={element.animation?.enter?.gsapEase || 'power2.out'}
                      onChange={(v) =>
                        onUpdateElement({
                          animation: {
                            ...element.animation,
                            enter: { ...element.animation?.enter, gsapEase: v },
                          },
                        } as Partial<StoryElement>)
                      }
                      options={GSAP_EASINGS}
                    />
                  </Field>
                </>
              )}

              {/* Anime.js Animations */}
              {element.animation?.enter?.engine === 'anime' && (
                <>
                  <Field label="Animation">
                    <Select
                      value={element.animation?.enter?.animeType || 'reveal'}
                      onChange={(v) =>
                        onUpdateElement({
                          animation: {
                            ...element.animation,
                            enter: {
                              ...element.animation?.enter,
                              animeType: v,
                              type: 'fadeIn' as AnimationType,
                              duration: element.animation?.enter?.duration || 600,
                              delay: element.animation?.enter?.delay || 0,
                              easing: 'ease-out',
                            },
                          },
                        } as Partial<StoryElement>)
                      }
                      options={[
                        { label: 'Text Reveal', value: 'reveal' },
                        { label: 'Text Wave', value: 'wave' },
                        { label: 'Text Glitch', value: 'glitch' },
                        { label: 'Cascade', value: 'cascade' },
                      ]}
                    />
                  </Field>
                  <Field label="Easing">
                    <Select
                      value={element.animation?.enter?.animeEase || 'easeOutQuad'}
                      onChange={(v) =>
                        onUpdateElement({
                          animation: {
                            ...element.animation,
                            enter: { ...element.animation?.enter, animeEase: v },
                          },
                        } as Partial<StoryElement>)
                      }
                      options={ANIME_EASINGS}
                    />
                  </Field>
                  {element.type === 'text' && (
                    <Field label="Stagger">
                      <NumberSlider
                        value={element.animation?.enter?.stagger || 30}
                        onChange={(v) =>
                          onUpdateElement({
                            animation: {
                              ...element.animation,
                              enter: { ...element.animation?.enter, stagger: v },
                            },
                          } as Partial<StoryElement>)
                        }
                        min={10}
                        max={200}
                        step={10}
                        unit="ms"
                      />
                    </Field>
                  )}
                </>
              )}

              {/* Common timing controls */}
              {(element.animation?.enter?.type !== 'none' ||
                element.animation?.enter?.gsapType ||
                element.animation?.enter?.animeType) && (
                <>
                  <Field label="Duration">
                    <NumberSlider
                      value={element.animation?.enter?.duration || 500}
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
                      value={element.animation?.enter?.delay || 0}
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

              {/* Live Enter Animation Preview */}
              {(element.animation?.enter?.type !== 'none' ||
                element.animation?.enter?.gsapType ||
                element.animation?.enter?.animeType) && (
                <EnterAnimationPreview
                  animationType={element.animation?.enter?.type || 'none'}
                  engine={(element.animation?.enter?.engine as 'css' | 'gsap' | 'anime') || 'css'}
                  gsapType={element.animation?.enter?.gsapType}
                  animeType={element.animation?.enter?.animeType}
                  duration={element.animation?.enter?.duration || 500}
                  easing={element.animation?.enter?.gsapEase || element.animation?.enter?.animeEase}
                />
              )}
            </Section>

            <Section title="Loop Animation" defaultOpen={false}>
              {/* Loop Engine */}
              <Field label="Engine">
                <div className="flex gap-1">
                  {(['css', 'gsap', 'anime'] as const).map((engine) => (
                    <button
                      key={engine}
                      onClick={() =>
                        onUpdateElement({
                          animation: {
                            ...element.animation,
                            loop: { ...element.animation?.loop, engine, type: 'none' as AnimationType },
                          },
                        } as Partial<StoryElement>)
                      }
                      className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                        (element.animation?.loop?.engine || 'css') === engine
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {engine === 'css' ? 'CSS' : engine === 'gsap' ? 'GSAP' : 'Anime'}
                    </button>
                  ))}
                </div>
              </Field>

              {/* CSS Loop */}
              {(element.animation?.loop?.engine || 'css') === 'css' && (
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
              )}

              {/* GSAP Loop */}
              {element.animation?.loop?.engine === 'gsap' && (
                <Field label="Type">
                  <Select
                    value={element.animation?.loop?.type || 'none'}
                    onChange={(v) =>
                      onUpdateElement({
                        animation: {
                          ...element.animation,
                          loop: {
                            ...element.animation?.loop,
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
                      ...LOOP_ANIMATION_NAMES.map((name) => ({
                        label: name.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
                        value: name,
                      })),
                    ]}
                  />
                </Field>
              )}

              {/* Anime Loop - includes Spring animations */}
              {element.animation?.loop?.engine === 'anime' && (
                <>
                  <Field label="Type">
                    <Select
                      value={element.animation?.loop?.type || 'none'}
                      onChange={(v) =>
                        onUpdateElement({
                          animation: {
                            ...element.animation,
                            loop: {
                              ...element.animation?.loop,
                              type: v as AnimationType,
                              duration: 1000,
                              delay: 0,
                              easing: 'ease-in-out',
                              bounce: v.startsWith('spring') ? 0.7 : undefined,
                              loopDelay: v.startsWith('spring') ? 250 : undefined,
                            },
                          },
                        } as Partial<StoryElement>)
                      }
                      options={[
                        { label: 'None', value: 'none' },
                        { label: '── Standard ──', value: '_standard_header', disabled: true } as {
                          label: string;
                          value: string;
                          disabled?: boolean;
                        },
                        ...LOOP_ANIMATION_NAMES.map((name) => ({
                          label: name.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
                          value: name,
                        })),
                        { label: '── Spring Physics ──', value: '_spring_header', disabled: true } as {
                          label: string;
                          value: string;
                          disabled?: boolean;
                        },
                        ...SPRING_ANIMATION_NAMES.map((name) => ({
                          label:
                            name
                              .replace('spring', '')
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, (s) => s.toUpperCase())
                              .trim() || 'Spring',
                          value: name,
                        })),
                      ]}
                    />
                  </Field>

                  {/* Spring-specific controls */}
                  {element.animation?.loop?.type?.startsWith('spring') && (
                    <>
                      <Field label="Bounce">
                        <NumberSlider
                          value={(element.animation?.loop?.bounce || 0.7) * 100}
                          onChange={(v) =>
                            onUpdateElement({
                              animation: {
                                ...element.animation,
                                loop: { ...element.animation!.loop!, bounce: v / 100 },
                              },
                            } as Partial<StoryElement>)
                          }
                          min={10}
                          max={100}
                          step={5}
                          unit="%"
                        />
                      </Field>
                      <Field label="Loop Delay">
                        <NumberSlider
                          value={element.animation?.loop?.loopDelay || 250}
                          onChange={(v) =>
                            onUpdateElement({
                              animation: {
                                ...element.animation,
                                loop: { ...element.animation!.loop!, loopDelay: v },
                              },
                            } as Partial<StoryElement>)
                          }
                          min={0}
                          max={1000}
                          step={50}
                          unit="ms"
                        />
                      </Field>
                    </>
                  )}
                </>
              )}

              {element.animation?.loop?.type && element.animation.loop.type !== 'none' && (
                <Field label="Duration">
                  <NumberSlider
                    value={element.animation.loop.duration || 1000}
                    onChange={(v) =>
                      onUpdateElement({
                        animation: {
                          ...element.animation,
                          loop: { ...element.animation!.loop!, duration: v },
                        },
                      } as Partial<StoryElement>)
                    }
                    min={200}
                    max={5000}
                    step={100}
                    unit="ms"
                  />
                </Field>
              )}

              {/* Live Animation Preview */}
              {element.animation?.loop?.type && element.animation.loop.type !== 'none' && (
                <LoopAnimationPreview
                  animationType={element.animation.loop.type}
                  engine={(element.animation.loop.engine as 'css' | 'gsap' | 'anime') || 'css'}
                  bounce={element.animation.loop.bounce}
                  loopDelay={element.animation.loop.loopDelay}
                />
              )}
            </Section>

            {/* Animation Preview Hint */}
            <div className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg mx-3 mb-3">
              <div className="flex flex-col gap-1 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-yellow-500" />
                  <span>
                    <strong className="text-slate-300">GSAP</strong> = Pro animations |{' '}
                    <strong className="text-slate-300">Anime</strong> = Text & Spring effects
                  </span>
                </div>
                <div className="pl-6 text-slate-500">💫 Spring = Physics-based bouncy motion</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

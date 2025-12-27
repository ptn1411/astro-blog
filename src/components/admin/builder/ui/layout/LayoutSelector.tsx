import { Check, Layout, Sparkles, FileText, Layers } from 'lucide-react';

/**
 * Available Astro layout types from src/layouts/
 * Only layouts compatible with page builder (no special props required)
 */
export type AstroLayoutType =
  | 'AnimationPageLayout'
  | 'AnimationLayout'
  | 'PageLayout'
  | 'Layout';

/**
 * Layout template definition
 */
interface LayoutTemplate {
  type: AstroLayoutType;
  label: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

/**
 * Props for LayoutSelector component
 */
interface LayoutSelectorProps {
  currentLayout: AstroLayoutType;
  onLayoutChange: (layout: AstroLayoutType) => void;
  isDarkMode?: boolean;
}

/**
 * Available layout templates matching src/layouts/
 */
const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    type: 'AnimationPageLayout',
    label: 'Animation Page',
    description: 'Full page layout with animations, header & footer',
    icon: <Sparkles size={20} />,
    features: ['Header', 'Footer', 'Animations', 'View Transitions'],
  },
  {
    type: 'PageLayout',
    label: 'Standard Page',
    description: 'Standard page layout with header & footer',
    icon: <Layout size={20} />,
    features: ['Header', 'Footer', 'View Transitions'],
  },
  {
    type: 'AnimationLayout',
    label: 'Animation Base',
    description: 'Base layout with animations, no header/footer',
    icon: <Layers size={20} />,
    features: ['Animations', 'View Transitions', 'Matrix Rain'],
  },
  {
    type: 'Layout',
    label: 'Base Layout',
    description: 'Minimal base layout without header/footer',
    icon: <FileText size={20} />,
    features: ['View Transitions', 'Matrix Rain'],
  },
];

/**
 * LayoutSelector Component
 *
 * Displays available Astro layouts from src/layouts/ and allows
 * users to select a layout for their page.
 */
export function LayoutSelector({ currentLayout, onLayoutChange, isDarkMode = false }: LayoutSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Layout size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Page Layout</h3>
      </div>

      {/* Layout List */}
      <div className="space-y-2">
        {LAYOUT_TEMPLATES.map((template) => {
          const isActive = currentLayout === template.type;

          return (
            <button
              key={template.type}
              type="button"
              onClick={() => onLayoutChange(template.type)}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                isActive
                  ? isDarkMode
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-blue-600 bg-blue-50'
                  : isDarkMode
                    ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`p-2 rounded-lg ${
                    isActive
                      ? isDarkMode
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-blue-100 text-blue-600'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {template.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        isActive
                          ? isDarkMode
                            ? 'text-blue-400'
                            : 'text-blue-700'
                          : isDarkMode
                            ? 'text-gray-200'
                            : 'text-gray-800'
                      }`}
                    >
                      {template.label}
                    </span>
                    {isActive && <Check size={14} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />}
                  </div>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {template.description}
                  </p>
                  {/* Features */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.features.map((feature) => (
                      <span
                        key={feature}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Current Layout Info */}
      <div
        className={`p-3 rounded-lg text-xs ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
        }`}
      >
        <div className={`font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Selected Layout</div>
        <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          <code className={`text-xs px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            ~/layouts/{currentLayout}.astro
          </code>
        </div>
      </div>
    </div>
  );
}

export default LayoutSelector;

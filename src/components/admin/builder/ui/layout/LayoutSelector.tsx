import React from 'react';
import { Check, Layout, PanelLeft, PanelRight, Minus, Square } from 'lucide-react';
import type { LayoutConfig, LayoutType } from '../../core/types/navigation.types';

/**
 * Layout template definition for visual preview
 */
interface LayoutTemplate {
  type: LayoutType;
  label: string;
  description: string;
  icon: React.ReactNode;
  config: LayoutConfig;
}

/**
 * Props for LayoutSelector component
 */
interface LayoutSelectorProps {
  currentLayout: LayoutConfig;
  onLayoutChange: (layout: LayoutConfig) => void;
  isDarkMode?: boolean;
}

/**
 * Available layout templates with their configurations
 */
const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    type: 'full-width',
    label: 'Full Width',
    description: 'Standard layout with header and footer',
    icon: <Layout size={24} />,
    config: {
      type: 'full-width',
      headerVisible: true,
      footerVisible: true,
      sidebarPosition: 'none',
    },
  },
  {
    type: 'with-sidebar-left',
    label: 'Left Sidebar',
    description: 'Layout with sidebar on the left',
    icon: <PanelLeft size={24} />,
    config: {
      type: 'with-sidebar-left',
      headerVisible: true,
      footerVisible: true,
      sidebarPosition: 'left',
    },
  },
  {
    type: 'with-sidebar-right',
    label: 'Right Sidebar',
    description: 'Layout with sidebar on the right',
    icon: <PanelRight size={24} />,
    config: {
      type: 'with-sidebar-right',
      headerVisible: true,
      footerVisible: true,
      sidebarPosition: 'right',
    },
  },
  {
    type: 'minimal-header',
    label: 'Minimal Header',
    description: 'Compact header with full content area',
    icon: <Minus size={24} />,
    config: {
      type: 'minimal-header',
      headerVisible: true,
      footerVisible: true,
      sidebarPosition: 'none',
    },
  },
  {
    type: 'no-footer',
    label: 'No Footer',
    description: 'Layout without footer section',
    icon: <Square size={24} />,
    config: {
      type: 'no-footer',
      headerVisible: true,
      footerVisible: false,
      sidebarPosition: 'none',
    },
  },
];

/**
 * Visual preview component for a layout template
 */
function LayoutPreview({
  template,
  isActive,
  isDarkMode,
}: {
  template: LayoutTemplate;
  isActive: boolean;
  isDarkMode: boolean;
}) {
  const { config } = template;

  return (
    <div
      className={`relative w-full aspect-[4/3] rounded border-2 overflow-hidden ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
      } ${isActive ? (isDarkMode ? 'border-blue-500' : 'border-blue-600') : isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
    >
      {/* Header */}
      {config.headerVisible && (
        <div
          className={`absolute top-0 left-0 right-0 h-3 ${
            config.type === 'minimal-header'
              ? isDarkMode
                ? 'bg-gray-700'
                : 'bg-gray-300'
              : isDarkMode
                ? 'bg-gray-600'
                : 'bg-gray-400'
          }`}
        />
      )}

      {/* Content area with optional sidebar */}
      <div
        className={`absolute ${config.headerVisible ? 'top-4' : 'top-1'} ${config.footerVisible ? 'bottom-4' : 'bottom-1'} left-1 right-1 flex gap-1`}
      >
        {/* Left Sidebar */}
        {config.sidebarPosition === 'left' && (
          <div className={`w-1/4 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
        )}

        {/* Main Content */}
        <div className={`flex-1 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />

        {/* Right Sidebar */}
        {config.sidebarPosition === 'right' && (
          <div className={`w-1/4 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
        )}
      </div>

      {/* Footer */}
      {config.footerVisible && (
        <div className={`absolute bottom-0 left-0 right-0 h-3 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'}`} />
      )}

      {/* Active indicator */}
      {isActive && (
        <div
          className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-blue-500' : 'bg-blue-600'
          }`}
        >
          <Check size={12} className="text-white" />
        </div>
      )}
    </div>
  );
}

/**
 * LayoutSelector Component
 *
 * Displays available layout templates as visual previews and allows
 * users to select a layout for their page.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.5
 */
export function LayoutSelector({ currentLayout, onLayoutChange, isDarkMode = false }: LayoutSelectorProps) {
  const handleLayoutSelect = (template: LayoutTemplate) => {
    onLayoutChange(template.config);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Layout size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Page Layout</h3>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-2 gap-3">
        {LAYOUT_TEMPLATES.map((template) => {
          const isActive = currentLayout.type === template.type;

          return (
            <button
              key={template.type}
              type="button"
              onClick={() => handleLayoutSelect(template)}
              className={`p-3 rounded-lg border transition-all text-left ${
                isActive
                  ? isDarkMode
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-blue-600 bg-blue-50'
                  : isDarkMode
                    ? 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-750'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* Visual Preview */}
              <LayoutPreview template={template} isActive={isActive} isDarkMode={isDarkMode} />

              {/* Label and Description */}
              <div className="mt-2">
                <div className="flex items-center gap-1.5">
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{template.icon}</span>
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
                </div>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {template.description}
                </p>
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
        <div className={`font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Current Settings</div>
        <div className={`space-y-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <div>
            Header: <span className="font-medium">{currentLayout.headerVisible ? 'Visible' : 'Hidden'}</span>
          </div>
          <div>
            Footer: <span className="font-medium">{currentLayout.footerVisible ? 'Visible' : 'Hidden'}</span>
          </div>
          <div>
            Sidebar:{' '}
            <span className="font-medium">
              {currentLayout.sidebarPosition === 'none' ? 'None' : `${currentLayout.sidebarPosition} side`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LayoutSelector;

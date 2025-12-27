/**
 * LayoutPanel Component
 *
 * A panel for selecting Astro layout and editing custom navigation for the current page.
 * Integrates with page metadata to persist layout and navigation selection.
 */

import { useState } from 'react';
import { Layout, Menu, Footprints } from 'lucide-react';
import { LayoutSelector, type AstroLayoutType } from '../layout/LayoutSelector';
import { NavigationEditor } from '../navigation/NavigationEditor';
import type { HeaderData as NavHeaderData, FooterData as NavFooterData } from '../../core/types/navigation.types';

// Re-export types for external use
export type HeaderData = NavHeaderData;
export type FooterData = NavFooterData;

type TabType = 'layout' | 'header' | 'footer';

export interface LayoutPanelProps {
  isDarkMode?: boolean;
  currentLayout: AstroLayoutType;
  onLayoutChange: (layout: AstroLayoutType) => void;
  headerData?: HeaderData;
  footerData?: FooterData;
  onHeaderDataChange?: (data: HeaderData) => void;
  onFooterDataChange?: (data: FooterData) => void;
}

export function LayoutPanel({
  isDarkMode = false,
  currentLayout,
  onLayoutChange,
  headerData,
  footerData,
  onHeaderDataChange,
  onFooterDataChange,
}: LayoutPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('layout');

  const tabClass = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
      active
        ? isDarkMode
          ? 'bg-blue-600 text-white'
          : 'bg-blue-600 text-white'
        : isDarkMode
          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
    }`;

  // Check if navigation is customized
  const hasCustomHeader = headerData && (headerData.links?.length || headerData.actions?.length);
  const hasCustomFooter = footerData && (
    footerData.links?.length || 
    footerData.secondaryLinks?.length || 
    footerData.socialLinks?.length ||
    footerData.footNote
  );

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <div className="flex items-center gap-2">
          <Layout size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
          <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Page Config
          </h3>
        </div>
        {(hasCustomHeader || hasCustomFooter) && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
            Custom Nav
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button type="button" onClick={() => setActiveTab('layout')} className={tabClass(activeTab === 'layout')}>
          <Layout size={14} />
          Layout
        </button>
        <button type="button" onClick={() => setActiveTab('header')} className={tabClass(activeTab === 'header')}>
          <Menu size={14} />
          Header
          {hasCustomHeader && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
        </button>
        <button type="button" onClick={() => setActiveTab('footer')} className={tabClass(activeTab === 'footer')}>
          <Footprints size={14} />
          Footer
          {hasCustomFooter && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'layout' && (
          <LayoutSelector
            currentLayout={currentLayout}
            onLayoutChange={onLayoutChange}
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === 'header' && onHeaderDataChange && (
          <NavigationEditor
            mode="header"
            headerData={headerData}
            onHeaderChange={onHeaderDataChange}
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === 'footer' && onFooterDataChange && (
          <NavigationEditor
            mode="footer"
            footerData={footerData}
            onFooterChange={onFooterDataChange}
            isDarkMode={isDarkMode}
          />
        )}
      </div>

      {/* Info */}
      <div className={`p-3 border-t text-xs ${isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-500'}`}>
        {hasCustomHeader || hasCustomFooter ? (
          <p>Custom navigation will be saved with this page.</p>
        ) : (
          <p>Using default navigation from ~/navigation.ts</p>
        )}
      </div>
    </div>
  );
}

export default LayoutPanel;

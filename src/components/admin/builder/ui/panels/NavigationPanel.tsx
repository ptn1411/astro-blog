/**
 * NavigationPanel Component
 *
 * A panel component that integrates NavigationEditor and LayoutSelector
 * into the builder sidebar. Provides a tabbed interface for managing
 * page layout, header navigation, and footer configuration.
 *
 * Requirements: All (1.1-1.5, 2.1-2.7, 3.1-3.7)
 */

import { useState, useCallback } from 'react';
import { Layout, Menu, Footprints, Download, Upload, AlertCircle, Check, Loader2 } from 'lucide-react';
import { NavigationEditor } from '../navigation/NavigationEditor';
import { useNavigationEditor } from '../../hooks/useNavigationEditor';
import type { HeaderData, FooterData, LayoutConfig } from '../../core/types/navigation.types';

/**
 * Tab type for the navigation panel
 */
type NavigationPanelTab = 'layout' | 'header' | 'footer';

/**
 * Props for NavigationPanel component
 */
export interface NavigationPanelProps {
  /** Dark mode flag */
  isDarkMode?: boolean;
  /** Initial header data */
  initialHeaderData?: HeaderData;
  /** Initial footer data */
  initialFooterData?: FooterData;
  /** Initial layout configuration */
  initialLayout?: LayoutConfig;
  /** Callback when configuration changes */
  onConfigChange?: (config: { headerData: HeaderData; footerData: FooterData; layout: LayoutConfig }) => void;
}

/**
 * NavigationPanel Component
 *
 * Provides a unified interface for managing page layout and navigation.
 * Integrates with useNavigationEditor hook for state management and persistence.
 */
export function NavigationPanel({
  isDarkMode = false,
  initialHeaderData,
  initialFooterData,
  initialLayout,
  onConfigChange,
}: NavigationPanelProps) {
  // Active tab state
  const [activeTab, setActiveTab] = useState<NavigationPanelTab>('layout');

  // Save status state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Use the navigation editor hook
  const {
    headerData,
    footerData,
    layout,
    isDirty,
    setHeaderData,
    setFooterData,
    // setLayout - not used in this panel, layout is managed via LayoutPanel
    saveToServer,
    exportToTypeScript,
    exportToJSON,
  } = useNavigationEditor({
    initialHeaderData,
    initialFooterData,
    initialLayout,
    onSave: (result) => {
      if (result.success) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    },
    onError: (error) => {
      console.error('Navigation save error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
  });

  // Handle header data change
  const handleHeaderChange = useCallback(
    (data: HeaderData) => {
      setHeaderData(data);
      onConfigChange?.({ headerData: data, footerData, layout });
    },
    [setHeaderData, footerData, layout, onConfigChange]
  );

  // Handle footer data change
  const handleFooterChange = useCallback(
    (data: FooterData) => {
      setFooterData(data);
      onConfigChange?.({ headerData, footerData: data, layout });
    },
    [setFooterData, headerData, layout, onConfigChange]
  );

  // Handle save to server
  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      await saveToServer();
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [saveToServer]);

  // Handle export to TypeScript
  const handleExportTypeScript = useCallback(() => {
    const content = exportToTypeScript();
    const blob = new Blob([content], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'navigation.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportToTypeScript]);

  // Handle export to JSON
  const handleExportJSON = useCallback(() => {
    const content = exportToJSON();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'navigation-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportToJSON]);

  // Style classes
  const panelClass = `h-full flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`;
  const headerClass = `flex items-center justify-between p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`;
  const tabsClass = `flex gap-1 p-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`;
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
  const contentClass = 'flex-1 overflow-y-auto p-3';

  return (
    <div className={panelClass}>
      {/* Header */}
      <div className={headerClass}>
        <div className="flex items-center gap-2">
          <Layout size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
          <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Page Configuration
          </h3>
          {isDirty && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>
              Unsaved
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Export dropdown */}
          <div className="relative group">
            <button
              type="button"
              className={`p-1.5 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              title="Export"
            >
              <Download size={16} />
            </button>
            <div className={`absolute right-0 top-full mt-1 w-40 rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <button
                type="button"
                onClick={handleExportTypeScript}
                className={`w-full px-3 py-2 text-xs text-left transition-colors ${isDarkMode ? 'hover:bg-gray-600 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                Export as TypeScript
              </button>
              <button
                type="button"
                onClick={handleExportJSON}
                className={`w-full px-3 py-2 text-xs text-left transition-colors ${isDarkMode ? 'hover:bg-gray-600 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                Export as JSON
              </button>
            </div>
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              saveStatus === 'success'
                ? 'bg-green-600 text-white'
                : saveStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : isDarkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
            }`}
          >
            {saveStatus === 'saving' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saveStatus === 'success' ? (
              <Check size={14} />
            ) : saveStatus === 'error' ? (
              <AlertCircle size={14} />
            ) : (
              <Upload size={14} />
            )}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={tabsClass}>
        <button type="button" onClick={() => setActiveTab('layout')} className={tabClass(activeTab === 'layout')}>
          <Layout size={14} />
          Layout
        </button>
        <button type="button" onClick={() => setActiveTab('header')} className={tabClass(activeTab === 'header')}>
          <Menu size={14} />
          Header
        </button>
        <button type="button" onClick={() => setActiveTab('footer')} className={tabClass(activeTab === 'footer')}>
          <Footprints size={14} />
          Footer
        </button>
      </div>

      {/* Content */}
      <div className={contentClass}>
        {activeTab === 'layout' && (
          <div className={`p-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <Layout size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">Layout configuration is managed through the page metadata.</p>
            <p className="text-xs mt-2">Use the Layout Panel in the builder sidebar.</p>
          </div>
        )}
        {activeTab === 'header' && (
          <NavigationEditor
            mode="header"
            headerData={headerData}
            onHeaderChange={handleHeaderChange}
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === 'footer' && (
          <NavigationEditor
            mode="footer"
            footerData={footerData}
            onFooterChange={handleFooterChange}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </div>
  );
}

export default NavigationPanel;

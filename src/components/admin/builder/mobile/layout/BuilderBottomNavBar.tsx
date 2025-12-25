import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Layers, PanelRight, LayoutGrid } from 'lucide-react';

/**
 * BuilderBottomNavBar Component - Mobile tab bar with animated indicator for Page Builder
 * Requirements: 2.1, 2.2
 * 
 * Implements:
 * - Bottom navigation bar with tabs for Widgets, Canvas, and Properties
 * - Animated tab indicator that follows active tab
 * - Touch-optimized with minimum 44x44px touch targets
 * - Safe area inset support for notched devices
 */

/** View types for the mobile builder */
export type BuilderMobileView = 'widgets' | 'canvas' | 'properties';

export interface BuilderNavTab {
  /** Unique identifier for the tab */
  id: BuilderMobileView;
  /** Display label */
  label: string;
  /** Icon element to display */
  icon: React.ReactNode;
}

export interface BuilderBottomNavBarProps {
  /** Currently active tab ID */
  activeTab: BuilderMobileView;
  /** Callback when tab changes */
  onTabChange: (tabId: BuilderMobileView) => void;
  /** Whether dark mode is enabled */
  isDarkMode?: boolean;
  /** Whether to show badge on properties tab (e.g., when block is selected) */
  showPropertiesBadge?: boolean;
}

/** Default tabs for the builder navigation */
const BUILDER_TABS: BuilderNavTab[] = [
  {
    id: 'widgets',
    label: 'Widgets',
    icon: <LayoutGrid size={22} />,
  },
  {
    id: 'canvas',
    label: 'Canvas',
    icon: <Layers size={22} />,
  },
  {
    id: 'properties',
    label: 'Properties',
    icon: <PanelRight size={22} />,
  },
];

/**
 * Calculate safe area inset for notched devices
 * Uses CSS env() with fallback
 */
const SAFE_AREA_BOTTOM = 'env(safe-area-inset-bottom, 0px)';

export const BuilderBottomNavBar: React.FC<BuilderBottomNavBarProps> = ({
  activeTab,
  onTabChange,
  isDarkMode = true,
  showPropertiesBadge = false,
}) => {
  const navRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  // Update indicator position when active tab changes
  const updateIndicator = useCallback(() => {
    const activeTabElement = tabRefs.current.get(activeTab);
    const navElement = navRef.current;

    if (activeTabElement && navElement) {
      const navRect = navElement.getBoundingClientRect();
      const tabRect = activeTabElement.getBoundingClientRect();

      setIndicatorStyle({
        left: tabRect.left - navRect.left,
        width: tabRect.width,
      });
    }
  }, [activeTab]);

  // Update indicator on mount and when active tab changes
  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  // Update indicator on window resize
  useEffect(() => {
    const handleResize = () => {
      updateIndicator();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicator]);

  // Store tab ref
  const setTabRef = useCallback((id: string, element: HTMLButtonElement | null) => {
    if (element) {
      tabRefs.current.set(id, element);
    } else {
      tabRefs.current.delete(id);
    }
  }, []);

  // Handle tab click
  const handleTabClick = useCallback((tabId: BuilderMobileView) => {
    onTabChange(tabId);
  }, [onTabChange]);

  return (
    <nav
      ref={navRef}
      className={`fixed bottom-0 left-0 right-0 z-40 border-t ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}
      style={{
        paddingBottom: SAFE_AREA_BOTTOM,
      }}
      role="tablist"
      aria-label="Builder navigation"
    >
      {/* Active tab indicator */}
      <div
        className="absolute top-0 h-0.5 bg-blue-500 transition-all duration-300 ease-out"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
        aria-hidden="true"
      />

      {/* Tab buttons */}
      <div className="flex items-stretch">
        {BUILDER_TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const showBadge = tab.id === 'properties' && showPropertiesBadge;

          return (
            <button
              key={tab.id}
              ref={(el) => setTabRef(tab.id, el)}
              onClick={() => handleTabClick(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              className={`
                flex-1 flex flex-col items-center justify-center
                py-2 px-1 min-h-[56px] relative
                transition-colors duration-200
                touch-manipulation
                ${isActive 
                  ? 'text-blue-500' 
                  : isDarkMode 
                    ? 'text-gray-400 hover:text-gray-300' 
                    : 'text-gray-500 hover:text-gray-700'
                }
              `}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              {/* Icon with scale animation */}
              <span
                className={`
                  mb-1 transition-transform duration-200 relative
                  ${isActive ? 'scale-110' : 'scale-100'}
                `}
              >
                {tab.icon}
                {/* Badge indicator */}
                {showBadge && (
                  <span 
                    className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"
                    aria-label="Block selected"
                  />
                )}
              </span>

              {/* Label */}
              <span
                className={`
                  text-xs font-medium transition-all duration-200
                  ${isActive ? 'opacity-100' : 'opacity-70'}
                `}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BuilderBottomNavBar;

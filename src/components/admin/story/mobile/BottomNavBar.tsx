import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * BottomNavBar Component - Mobile tab bar with animated indicator
 * Requirements: 7.3
 */

export interface NavTab {
  /** Unique identifier for the tab */
  id: string;
  /** Display label */
  label: string;
  /** Icon element to display */
  icon: React.ReactNode;
}

export interface BottomNavBarProps {
  /** Array of tab configurations */
  tabs: NavTab[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when tab changes */
  onTabChange: (tabId: string) => void;
}

/**
 * Calculate safe area inset for notched devices
 * Uses CSS env() with fallback
 */
const SAFE_AREA_BOTTOM = 'env(safe-area-inset-bottom, 0px)';

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
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

  return (
    <nav
      ref={navRef}
      className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-40"
      style={{
        paddingBottom: SAFE_AREA_BOTTOM,
      }}
      role="tablist"
      aria-label="Main navigation"
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
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              ref={(el) => setTabRef(tab.id, el)}
              onClick={() => onTabChange(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              className={`
                flex-1 flex flex-col items-center justify-center
                py-2 px-1 min-h-[56px]
                transition-colors duration-200
                touch-manipulation
                ${isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-300'}
              `}
            >
              {/* Icon */}
              <span
                className={`
                  mb-1 transition-transform duration-200
                  ${isActive ? 'scale-110' : 'scale-100'}
                `}
              >
                {tab.icon}
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

export default BottomNavBar;

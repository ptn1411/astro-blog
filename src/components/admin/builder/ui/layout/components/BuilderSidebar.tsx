import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import React from 'react';
import { WIDGET_CATEGORIES } from '../../../config/registry';
import { SidebarItem } from '../../sidebar/SidebarItem';

interface Widget {
  type: string;
  label: string;
  category: string;
  fields: Array<{
    name: string;
    type: string;
    label: string;
    arraySchema?: unknown;
  }>;
  defaultProps: Record<string, unknown>;
}

interface BuilderSidebarProps {
  isDarkMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  widgets: Widget[];
  collapsedCategories: Set<string>;
  toggleCategory: (categoryId: string) => void;
}

export function BuilderSidebar({
  isDarkMode,
  searchQuery,
  setSearchQuery,
  widgets,
  collapsedCategories,
  toggleCategory,
}: BuilderSidebarProps) {
  const filteredWidgets = widgets.filter((widget) =>
    widget.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`w-64 flex-shrink-0 overflow-y-auto p-4 border-r ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
    >
      <div className="mb-4">
        <div className="relative">
          <Search
            size={16}
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
          />
          <input
            type="text"
            placeholder="Search widgets..."
            className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {WIDGET_CATEGORIES.map((category) => {
        const categoryWidgets = filteredWidgets.filter((w) => w.category === category.id);
        if (categoryWidgets.length === 0) return null;
        const isCollapsed = collapsedCategories.has(category.id);

        return (
          <div key={category.id} className="mb-4">
            <button
              onClick={() => toggleCategory(category.id)}
              className={`w-full flex items-center justify-between px-2 py-1.5 text-sm font-semibold rounded transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <span>{category.label}</span>
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </button>
            {!isCollapsed && (
              <div className="mt-2 space-y-2">
                {categoryWidgets.map((widget) => (
                  <SidebarItem key={widget.type} widget={widget} isDarkMode={isDarkMode} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

import { Box } from 'lucide-react';
import React from 'react';
import type { WidgetSchema } from '../registry';

interface SidebarItemProps {
  widget: WidgetSchema;
  isDarkMode: boolean;
}

export function SidebarItem({ widget, isDarkMode }: SidebarItemProps) {
  // Use Box as fallback icon if widget.icon is null
  const IconComponent = widget.icon || Box;

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('add-widget', { detail: widget.type }));
  };

  return (
    <div
      onClick={handleClick}
      className={`p-3 border rounded shadow-sm cursor-pointer flex items-center gap-2 transition-colors ${
        isDarkMode
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200'
          : 'bg-white border-gray-200 hover:bg-blue-50 text-gray-700'
      }`}
    >
      <IconComponent size={16} />
      <span className="font-medium text-sm">{widget.label}</span>
    </div>
  );
}

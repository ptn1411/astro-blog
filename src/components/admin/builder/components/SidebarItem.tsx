import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import { WIDGET_REGISTRY } from '../../registry';

interface SidebarItemProps {
  widget: (typeof WIDGET_REGISTRY)[0];
  isDarkMode: boolean;
}

export function SidebarItem({ widget, isDarkMode }: SidebarItemProps) {
  const { attributes, listeners, setNodeRef, transform } = useSortable({
    id: `sidebar-${widget.type}`,
    data: {
      type: 'sidebar-item',
      widgetType: widget.type,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      onClick={() => window.dispatchEvent(new CustomEvent('add-widget', { detail: widget.type }))}
      className={`p-3 border rounded shadow-sm cursor-pointer flex items-center gap-2 transition-colors ${
        isDarkMode
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200'
          : 'bg-white border-gray-200 hover:bg-blue-50 text-gray-700'
      }`}
    >
      <widget.icon size={16} />
      <span className="font-medium text-sm">{widget.label}</span>
    </div>
  );
}

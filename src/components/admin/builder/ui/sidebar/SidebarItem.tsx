import { Box } from 'lucide-react';
import React from 'react';
import type { WidgetSchema } from '../../config/registry';

interface SidebarItemProps {
  widget: WidgetSchema;
  isDarkMode: boolean;
}

export const WIDGET_DRAG_MIME = 'application/x-builder-widget';

export function SidebarItem({ widget, isDarkMode }: SidebarItemProps) {
  const IconComponent = widget.icon || Box;

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('add-widget', { detail: widget.type }));
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(WIDGET_DRAG_MIME, widget.type);
    e.dataTransfer.setData('text/plain', widget.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      className={`p-3 border rounded shadow-sm cursor-grab active:cursor-grabbing flex items-center gap-2 transition-colors ${
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

import React, { useState } from 'react';
import { WIDGET_DRAG_MIME } from '../sidebar/SidebarItem';

interface DropSlotProps {
  onDropWidget: (type: string) => void;
  isDarkMode: boolean;
  variant?: 'slim' | 'empty';
}

export function DropSlot({ onDropWidget, isDarkMode, variant = 'slim' }: DropSlotProps) {
  const [active, setActive] = useState(false);

  const isWidgetDrag = (e: React.DragEvent) =>
    Array.from(e.dataTransfer.types).includes(WIDGET_DRAG_MIME);

  const handleDragOver = (e: React.DragEvent) => {
    if (!isWidgetDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!active) setActive(true);
  };

  const handleDragLeave = () => setActive(false);

  const handleDrop = (e: React.DragEvent) => {
    if (!isWidgetDrag(e)) return;
    e.preventDefault();
    const type = e.dataTransfer.getData(WIDGET_DRAG_MIME) || e.dataTransfer.getData('text/plain');
    setActive(false);
    if (type) onDropWidget(type);
  };

  if (variant === 'empty') {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-3 rounded-lg border-2 border-dashed text-center py-10 transition-colors ${
          active
            ? isDarkMode
              ? 'border-blue-400 bg-blue-500/10 text-blue-200'
              : 'border-blue-500 bg-blue-50 text-blue-700'
            : isDarkMode
              ? 'border-gray-700 text-gray-500'
              : 'border-gray-300 text-gray-400'
        }`}
      >
        <p className="text-sm font-medium">
          {active ? 'Thả để thêm widget' : 'Kéo widget từ sidebar vào đây'}
        </p>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`transition-all ${active ? 'h-6 my-1' : 'h-2 my-0.5'}`}
    >
      <div
        className={`h-full rounded-full transition-colors ${
          active
            ? isDarkMode
              ? 'bg-blue-400'
              : 'bg-blue-500'
            : 'bg-transparent'
        }`}
      />
    </div>
  );
}

/**
 * DynamicItemGrid - Renders a grid/list of items with dynamic fields
 */

import React from 'react';
import type { DynamicField, MappedItem, DisplayConfig } from '../../../core/types/apiDataWidget.types';
import { DynamicItemCard } from './DynamicItemCard';

export interface DynamicItemGridProps {
  items: MappedItem[];
  fields: DynamicField[];
  display: DisplayConfig;
}

export const DynamicItemGrid: React.FC<DynamicItemGridProps> = ({
  items,
  fields,
  display,
}) => {
  const { layout, columns } = display;

  if (items.length === 0) return null;

  // List layout
  if (layout === 'list') {
    return (
      <div className="flex flex-col gap-4">
        {items.map((item, index) => (
          <DynamicItemCard
            key={`item-${index}`}
            item={item}
            fields={fields}
            display={display}
          />
        ))}
      </div>
    );
  }

  // Card layout (single item, centered)
  if (layout === 'card') {
    return (
      <div className="max-w-md mx-auto">
        {items.slice(0, 1).map((item, index) => (
          <DynamicItemCard
            key={`item-${index}`}
            item={item}
            fields={fields}
            display={display}
          />
        ))}
      </div>
    );
  }

  // Grid layout
  const columnClasses: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`grid gap-4 ${columnClasses[columns] || columnClasses[3]}`}>
      {items.map((item, index) => (
        <DynamicItemCard
          key={`item-${index}`}
          item={item}
          fields={fields}
          display={display}
        />
      ))}
    </div>
  );
};

export default DynamicItemGrid;

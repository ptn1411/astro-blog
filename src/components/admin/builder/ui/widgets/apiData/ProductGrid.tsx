/**
 * ProductGrid Component
 * Displays products in a responsive grid or list layout
 * 
 * Requirements: 3.1
 * - Display items in a responsive grid (1 column mobile, 2-3 columns desktop)
 * - Support grid and list layouts
 * - Support configurable columns (2, 3, 4)
 */

import React from 'react';
import type { MappedProduct, DisplayConfig } from '../../../core/types/apiDataWidget.types';
import { ProductCard } from './ProductCard';

export interface ProductGridProps {
  products: MappedProduct[];
  display: DisplayConfig;
}

/**
 * Get CSS grid classes based on column count
 */
const getGridClasses = (columns: 2 | 3 | 4): string => {
  const columnClasses: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };
  return columnClasses[columns] || columnClasses[3];
};

export const ProductGrid: React.FC<ProductGridProps> = ({ products, display }) => {
  const { layout, columns } = display;

  if (products.length === 0) {
    return null;
  }

  // List layout - single column
  if (layout === 'list') {
    return (
      <div className="product-grid product-grid--list flex flex-col gap-4">
        {products.map((product, index) => (
          <ProductCard
            key={`product-${index}-${product.name}`}
            product={product}
            display={display}
          />
        ))}
      </div>
    );
  }

  // Grid layout - responsive columns
  const gridClasses = getGridClasses(columns);

  return (
    <div className={`product-grid product-grid--grid grid gap-4 ${gridClasses}`}>
      {products.map((product, index) => (
        <ProductCard
          key={`product-${index}-${product.name}`}
          product={product}
          display={display}
        />
      ))}
    </div>
  );
};

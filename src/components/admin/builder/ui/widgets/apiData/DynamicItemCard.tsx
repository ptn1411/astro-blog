/**
 * DynamicItemCard - Renders a single item with dynamic fields
 */

import React from 'react';
import type { DynamicField, MappedItem, DisplayConfig } from '../../../core/types/apiDataWidget.types';

export interface DynamicItemCardProps {
  item: MappedItem;
  fields: DynamicField[];
  display: DisplayConfig;
}

/**
 * Sanitize text to prevent XSS
 */
function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format price with currency
 */
function formatPrice(price: unknown, currency: string): string {
  const numPrice = typeof price === 'number' ? price : parseFloat(String(price));
  if (isNaN(numPrice)) return '';
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(numPrice);
  } catch {
    return `${currency} ${numPrice.toFixed(2)}`;
  }
}

/**
 * Render a single field value based on its type
 */
const FieldRenderer: React.FC<{
  field: DynamicField;
  value: unknown;
  display: DisplayConfig;
}> = ({ field, value, display }) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  switch (field.type) {
    case 'image':
      return (
        <div className="aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-t-lg">
          <img
            src={String(value)}
            alt={field.label}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== display.placeholderImage) {
                target.src = display.placeholderImage;
              }
            }}
          />
        </div>
      );

    case 'price':
      return (
        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
          {formatPrice(value, display.currency)}
        </p>
      );

    case 'link':
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm truncate block"
        >
          {String(value)}
        </a>
      );

    case 'badge': {
      const badges = Array.isArray(value) ? value : [value];
      return (
        <div className="flex flex-wrap gap-1">
          {badges.map((badge, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
            >
              {sanitizeText(String(badge))}
            </span>
          ))}
        </div>
      );
    }

    case 'html':
      return (
        <div
          className="text-sm text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: String(value) }}
        />
      );

    case 'text':
    default:
      return (
        <p className={`text-sm text-gray-700 dark:text-gray-300 ${field.className || ''}`}>
          {sanitizeText(String(value))}
        </p>
      );
  }
};

export const DynamicItemCard: React.FC<DynamicItemCardProps> = ({
  item,
  fields,
  display,
}) => {
  // Separate image fields from other fields
  const imageFields = fields.filter((f) => f.type === 'image');
  const otherFields = fields.filter((f) => f.type !== 'image');

  // Find first text field to use as title
  const titleField = otherFields.find((f) => f.type === 'text');
  const remainingFields = titleField
    ? otherFields.filter((f) => f.id !== titleField.id)
    : otherFields;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Image (first image field) */}
      {imageFields.length > 0 && display.showImage && (
        <FieldRenderer
          field={imageFields[0]}
          value={item[imageFields[0].id]}
          display={display}
        />
      )}

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Title (first text field) */}
        {titleField && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
            {sanitizeText(String(item[titleField.id] || ''))}
          </h3>
        )}

        {/* Other fields */}
        {remainingFields.map((field) => {
          const value = item[field.id];
          if (value === null || value === undefined || value === '') return null;

          return (
            <div key={field.id}>
              {field.label && field.type !== 'price' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                  {field.label}
                </p>
              )}
              <FieldRenderer field={field} value={value} display={display} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DynamicItemCard;

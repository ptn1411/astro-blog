/**
 * ProductCard Component
 * Displays a single product with image, name, price, and description
 * 
 * Requirements: 3.2, 3.3, 3.4
 * - Display product image, name, price, and description
 * - Format price with configurable currency symbol
 * - Display placeholder image when image is missing
 */

import React from 'react';
import type { MappedProduct, DisplayConfig } from '../../../core/types/apiDataWidget.types';
import { sanitizeText, formatPrice } from '../../../utils/sanitize';

export interface ProductCardProps {
  product: MappedProduct;
  display: DisplayConfig;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, display }) => {
  const { showImage, showPrice, showDescription, currency, placeholderImage } = display;

  // Use placeholder if image is missing
  const imageUrl = product.image || placeholderImage;

  // Sanitize text content to prevent XSS
  const sanitizedName = sanitizeText(product.name);
  const sanitizedDescription = sanitizeText(product.description);

  // Format price with currency
  const formattedPrice = product.price !== null ? formatPrice(product.price, currency) : '';

  const cardContent = (
    <div className="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {showImage && (
        <div className="product-card__image-container aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={sanitizedName || 'Product image'}
            className="product-card__image w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== placeholderImage) {
                target.src = placeholderImage;
              }
            }}
          />
        </div>
      )}
      <div className="product-card__content p-4">
        <h3
          className="product-card__name text-lg font-semibold text-gray-900 line-clamp-2"
          dangerouslySetInnerHTML={{ __html: sanitizedName }}
        />
        {showPrice && formattedPrice && (
          <p className="product-card__price text-xl font-bold text-blue-600 mt-2">
            {formattedPrice}
          </p>
        )}
        {showDescription && sanitizedDescription && (
          <p
            className="product-card__description text-sm text-gray-600 mt-2 line-clamp-3"
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />
        )}
      </div>
    </div>
  );

  // Wrap in link if URL is provided
  if (product.url) {
    return (
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        className="product-card__link block"
      >
        {cardContent}
      </a>
    );
  }

  return cardContent;
};

/**
 * DataMapper - Utility for extracting and mapping data from API responses
 * 
 * Supports JSONPath-like dot notation for accessing nested properties
 * and mapping arrays of data to MappedProduct format.
 */

import type { ItemMapping, MappedProduct } from '../../core/types/apiDataWidget.types';

/**
 * Extracts a value from an object using dot notation path.
 * 
 * @param obj - The source object to extract from
 * @param path - Dot notation path (e.g., "data.products", "price.amount")
 * @returns The value at the path, or null if not found
 * 
 * @example
 * getValueByPath({ data: { name: 'Test' } }, 'data.name') // 'Test'
 * getValueByPath({ items: [1, 2] }, 'items.0') // 1
 * getValueByPath({}, 'missing.path') // null
 */
export function getValueByPath(obj: unknown, path: string): unknown {
  // Handle empty path - return the object itself
  if (!path || path.trim() === '') {
    return obj;
  }

  // Handle null/undefined input
  if (obj === null || obj === undefined) {
    return null;
  }

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    // Check if current is an object or array we can traverse
    if (current === null || current === undefined) {
      return null;
    }

    if (typeof current !== 'object') {
      return null;
    }

    // Handle array index access
    const arrayIndex = parseInt(part, 10);
    if (!isNaN(arrayIndex) && Array.isArray(current)) {
      current = current[arrayIndex];
    } else {
      // Handle object property access
      current = (current as Record<string, unknown>)[part];
    }
  }

  return current ?? null;
}

/**
 * Maps a single item from API response to MappedProduct format.
 * 
 * @param item - The source item object
 * @param itemMapping - Field mapping configuration
 * @returns MappedProduct with extracted values or null for missing fields
 */
function mapSingleItem(item: unknown, itemMapping: ItemMapping): MappedProduct {
  const name = getValueByPath(item, itemMapping.name);
  const price = getValueByPath(item, itemMapping.price);
  const image = getValueByPath(item, itemMapping.image);
  const description = getValueByPath(item, itemMapping.description);
  const url = itemMapping.url ? getValueByPath(item, itemMapping.url) : null;

  return {
    name: typeof name === 'string' ? name : (name !== null ? String(name) : ''),
    price: typeof price === 'number' ? price : (typeof price === 'string' ? parseFloat(price) || null : null),
    image: typeof image === 'string' ? image : null,
    description: typeof description === 'string' ? description : null,
    url: typeof url === 'string' ? url : null,
  };
}

/**
 * Maps array data from API response to MappedProduct array.
 * Also supports single object responses by wrapping them in an array.
 * 
 * @param data - The full API response object
 * @param rootPath - Path to the array/object in the response (e.g., "data.products")
 * @param itemMapping - Field mapping configuration for each item
 * @returns Array of MappedProduct objects
 * 
 * @example
 * // Array response
 * const response = {
 *   data: {
 *     products: [
 *       { title: 'Product 1', price: 99.99, thumbnail: 'url1', desc: 'Description 1' }
 *     ]
 *   }
 * };
 * const mapping = { name: 'title', price: 'price', image: 'thumbnail', description: 'desc' };
 * mapArrayData(response, 'data.products', mapping);
 * // Returns: [{ name: 'Product 1', price: 99.99, image: 'url1', description: 'Description 1', url: null }]
 * 
 * // Single object response
 * const singleUser = { name: 'John', email: 'john@example.com' };
 * mapArrayData(singleUser, '', { name: 'name', description: 'email', ... });
 * // Returns: [{ name: 'John', description: 'john@example.com', ... }]
 */
export function mapArrayData(
  data: unknown,
  rootPath: string,
  itemMapping: ItemMapping
): MappedProduct[] {
  // Extract the data from the response using rootPath
  const extractedData = getValueByPath(data, rootPath);

  // If it's an array, map each item
  if (Array.isArray(extractedData)) {
    return extractedData.map((item) => mapSingleItem(item, itemMapping));
  }

  // If it's a single object (not null/undefined), wrap it in an array
  if (extractedData !== null && extractedData !== undefined && typeof extractedData === 'object') {
    return [mapSingleItem(extractedData, itemMapping)];
  }

  // Otherwise return empty array
  return [];
}

/**
 * DataMapper class providing a stateful interface for data mapping operations.
 */
export class DataMapper {
  private rootPath: string;
  private itemMapping: ItemMapping;

  constructor(rootPath: string, itemMapping: ItemMapping) {
    this.rootPath = rootPath;
    this.itemMapping = itemMapping;
  }

  /**
   * Maps API response data to MappedProduct array.
   */
  map(data: unknown): MappedProduct[] {
    return mapArrayData(data, this.rootPath, this.itemMapping);
  }

  /**
   * Updates the root path configuration.
   */
  setRootPath(rootPath: string): void {
    this.rootPath = rootPath;
  }

  /**
   * Updates the item mapping configuration.
   */
  setItemMapping(itemMapping: ItemMapping): void {
    this.itemMapping = itemMapping;
  }

  /**
   * Gets the current root path.
   */
  getRootPath(): string {
    return this.rootPath;
  }

  /**
   * Gets the current item mapping.
   */
  getItemMapping(): ItemMapping {
    return this.itemMapping;
  }
}

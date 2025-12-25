/**
 * Utility Functions for Builder Module
 */

// Re-export common utilities from shared
export { generateId, deepClone, downloadFile } from '../../shared/utils';

/**
 * Get nested object value by dot notation path
 */
export const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
};

/**
 * Set nested object value by dot notation path
 */
export const setNestedValue = (obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> => {
  // Import deepClone from shared for internal use
  const clone = JSON.parse(JSON.stringify(obj));
  const parts = path.split('.');
  let current: Record<string, unknown> = clone;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
  return clone;
};

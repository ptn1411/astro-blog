/**
 * Utility Functions for Story Module
 */

// Re-export common utilities from shared
export { generateId, generateTimestampId, deepClone, downloadFile } from '../../shared/utils';

/**
 * Generate a unique filename for media uploads
 * @param prefix - Prefix for the filename (e.g., 'story-image', 'story-audio')
 * @param originalName - Original filename to extract extension from
 * @returns A unique filename with timestamp and random string
 */
export const generateMediaFilename = (prefix: string, originalName: string): string => {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'bin';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}.${ext}`;
};

/**
 * Generate a unique slide ID
 * @returns A unique slide ID with timestamp
 */
export const generateSlideId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `slide-${timestamp}-${random}`;
};

/**
 * Generate a unique element ID
 * @returns A unique element ID with timestamp
 */
export const generateElementId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `el-${timestamp}-${random}`;
};

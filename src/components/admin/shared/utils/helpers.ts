/**
 * Shared Utility Functions for Admin Modules
 *
 * These utilities are truly common and can be used by both
 * Builder and Story modules without creating coupling.
 */

/**
 * Generate a unique ID
 * @param prefix - Optional prefix for the ID
 * @returns A unique string ID
 */
export const generateId = (prefix?: string): string => {
  const id = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}-${id}` : id;
};

/**
 * Generate a unique ID with timestamp for better uniqueness
 * @param prefix - Optional prefix for the ID
 * @returns A unique string ID with timestamp
 */
export const generateTimestampId = (prefix?: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
};

/**
 * Deep clone an object using JSON serialization
 * Note: This method doesn't preserve functions, undefined values, or circular references
 * @param obj - Object to clone
 * @returns Deep cloned object
 */
export const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

/**
 * Download content as a file
 * @param content - File content as string
 * @param filename - Name of the file to download
 * @param mimeType - MIME type of the file
 */
export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

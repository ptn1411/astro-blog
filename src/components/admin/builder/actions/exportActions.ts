import { toMDX } from '~/utils/serializer';
import type { BuilderBlock, PageMetadata } from '../types';
import { downloadFile } from '../utils';

export function exportJSON(blocks: BuilderBlock[], metadata: PageMetadata): void {
  const json = JSON.stringify({ metadata, blocks }, null, 2);
  downloadFile(json, 'page.json', 'application/json');
}

export function exportMDX(blocks: BuilderBlock[], metadata: PageMetadata): void {
  const mdx = toMDX(blocks, metadata);
  downloadFile(mdx, 'page.mdx', 'text/markdown');
}

export interface ImportResult {
  success: boolean;
  blocks?: BuilderBlock[];
  metadata?: PageMetadata;
  error?: string;
}

export function parseImportedJSON(text: string): ImportResult {
  try {
    const data = JSON.parse(text);
    if (data.blocks && Array.isArray(data.blocks)) {
      return {
        success: true,
        blocks: data.blocks,
        metadata: data.metadata,
      };
    }
    return {
      success: false,
      error: 'Invalid JSON format: missing "blocks" array',
    };
  } catch (err) {
    return {
      success: false,
      error: 'Failed to parse JSON',
    };
  }
}

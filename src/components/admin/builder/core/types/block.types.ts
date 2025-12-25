/**
 * Block types for Builder Module
 * Contains BuilderBlock, PageMetadata, and PageTemplate types
 */

import type { WidgetType } from '../../config/registry';

// --- Builder Block Type ---
export interface BuilderBlock {
  id: string;
  type: WidgetType | string; // Allow custom widget types
  props: Record<string, unknown>;
}

// --- Metadata Type ---
export interface PageMetadata {
  title: string;
  description: string;
}

// --- Template Type ---
export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  blocks: Omit<BuilderBlock, 'id'>[];
}

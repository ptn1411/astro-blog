/**
 * Block types for Builder Module
 * Contains BuilderBlock, PageMetadata, and PageTemplate types
 */

import type { WidgetType } from '../../config/registry';

// Re-export navigation types for consistency
export type {
  HeaderLink,
  HeaderAction,
  HeaderData,
  FooterLink,
  FooterLinkGroup,
  SocialLink,
  FooterData,
} from './navigation.types';

import type { HeaderData, FooterData } from './navigation.types';

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
  layout?: string;
  headerData?: HeaderData;
  footerData?: FooterData;
}

// --- Template Type ---
export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  blocks: Omit<BuilderBlock, 'id'>[];
}

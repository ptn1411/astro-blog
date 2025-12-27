// Type declarations for @pagefind/default-ui
declare module '@pagefind/default-ui' {
  export interface PagefindUIOptions {
    element?: string | HTMLElement;
    bundlePath?: string;
    baseUrl?: string;
    pageSize?: number;
    resetStyles?: boolean;
    showImages?: boolean;
    showSubResults?: boolean;
    excerptLength?: number;
    processResult?: (result: PagefindResult) => PagefindResult;
    processTerm?: (term: string) => string;
    debounceTimeoutMs?: number;
    mergeIndex?: Array<{
      bundlePath: string;
      baseUrl?: string;
    }>;
    translations?: Partial<PagefindTranslations>;
    autofocus?: boolean;
    sort?: Record<string, 'asc' | 'desc'>;
  }

  export interface PagefindResult {
    url: string;
    content: string;
    word_count: number;
    filters: Record<string, string[]>;
    meta: Record<string, string>;
    anchors: Array<{
      element: string;
      id: string;
      text: string;
    }>;
    weighted_locations: Array<{
      weight: number;
      balanced_score: number;
      location: number;
    }>;
    locations: number[];
    raw_content: string;
    raw_url: string;
    excerpt: string;
    sub_results: PagefindSubResult[];
  }

  export interface PagefindSubResult {
    title: string;
    url: string;
    excerpt: string;
    anchor?: {
      element: string;
      id: string;
      text: string;
    };
  }

  export interface PagefindTranslations {
    placeholder: string;
    clear_search: string;
    load_more: string;
    search_label: string;
    filters_label: string;
    zero_results: string;
    many_results: string;
    one_result: string;
    alt_search: string;
    search_suggestion: string;
    searching: string;
  }

  export class PagefindUI {
    constructor(options: PagefindUIOptions);
    triggerSearch(term: string): void;
    destroy(): void;
  }
}

import type { WidgetType } from '~/components/admin/builder/config/registry';

interface BuilderBlock {
  id: string;
  type: WidgetType | string; // Allow custom widget types
  props: Record<string, any>;
}

export interface PageMetadata {
  title?: string;
  description?: string;
}

export interface BuilderData {
  version: string;
  blocks: BuilderBlock[];
  metadata: PageMetadata;
  savedAt: string;
}

// Map widget types to their import paths
const IMPORTS: Record<string, string> = {
  Hero: '~/components/widgets/Hero.astro',
  Hero2: '~/components/widgets/Hero2.astro',
  HeroText: '~/components/widgets/HeroText.astro',
  Features: '~/components/widgets/Features.astro',
  Features2: '~/components/widgets/Features2.astro',
  Features3: '~/components/widgets/Features3.astro',
  Content1: '~/components/widgets/Content.astro',
  CallToAction: '~/components/widgets/CallToAction.astro',
  Pricing: '~/components/widgets/Pricing.astro',
  Stats: '~/components/widgets/Stats.astro',
  Note: '~/components/widgets/Note.astro',
  FAQs: '~/components/widgets/FAQs.astro',
  Testimonials: '~/components/widgets/Testimonials.astro',
  Brands: '~/components/widgets/Brands.astro',
  Contact: '~/components/widgets/Contact.astro',
  Steps: '~/components/widgets/Steps.astro',
  Steps2: '~/components/widgets/Steps2.astro',
  BlogLatestPosts: '~/components/widgets/BlogLatestPosts.astro',
  BlogHighlightedPosts: '~/components/widgets/BlogHighlightedPosts.astro',
  Announcement: '~/components/widgets/Announcement.astro',
  TableOfContents: '~/components/widgets/TableOfContents.astro',
  Divider: '~/components/widgets/Divider.astro',
  Spacer: '~/components/widgets/Spacer.astro',
  Quote: '~/components/widgets/Quote.astro',
  Video: '~/components/widgets/Video.astro',
  Gallery: '~/components/widgets/Gallery.astro',
  Team: '~/components/widgets/Team.astro',
  Newsletter: '~/components/widgets/Newsletter.astro',
  Countdown: '~/components/widgets/Countdown.astro',
  Banner: '~/components/widgets/Banner.astro',
  Accordion: '~/components/widgets/Accordion.astro',
  Timeline: '~/components/widgets/Timeline.astro',
  Cards: '~/components/widgets/Cards.astro',
  LogoCloud: '~/components/widgets/LogoCloud.astro',
  Comparison: '~/components/widgets/Comparison.astro',
  SocialLinks: '~/components/widgets/SocialLinks.astro',
  Map: '~/components/widgets/Map.astro',
  Alert: '~/components/widgets/Alert.astro',
  FeatureList: '~/components/widgets/FeatureList.astro',
  ProductShowcase: '~/components/widgets/ProductShowcase.astro',
  Awards: '~/components/widgets/Awards.astro',
  Partners: '~/components/widgets/Partners.astro',
  Downloads: '~/components/widgets/Downloads.astro',
  Events: '~/components/widgets/Events.astro',
  EffectsWidget: '~/components/widgets/EffectsWidget.astro',
  ImageSlider: '~/components/widgets/ImageSlider.astro',
  ProductFilter: '~/components/widgets/ProductFilter.astro',
  ApiDataWidget: '~/components/widgets/ApiDataWidget.astro',
};

export type ElementMetadata = {
  title?: string;
  description?: string;
};

// Custom widget template interface
interface WidgetTemplate {
  layout: string;
  containerClass?: string;
  showHeader?: boolean;
  headerPosition?: string;
  elements: TemplateElement[];
}

interface TemplateElement {
  type: string;
  field?: string; // Optional - not needed for layout grids with nested elements
  className?: string;
  imageSize?: string;
  imageShape?: string;
  buttonVariant?: string;
  listStyle?: string;
  gridCols?: number;
  condition?: string;
  elements?: TemplateElement[]; // Nested elements for layout grids
  itemTemplate?: {
    layout?: string;
    containerClass?: string;
    elements: TemplateElement[];
  };
  // Carousel specific
  slidesToShow?: number;
  autoplay?: boolean;
  autoplayInterval?: number;
  showArrows?: boolean;
  showDots?: boolean;
}

// Load custom widgets from localStorage (for serialization)
function loadCustomWidgetsForSerializer(): Map<string, { template?: WidgetTemplate }> {
  const widgetMap = new Map<string, { template?: WidgetTemplate }>();
  
  if (typeof window === 'undefined') return widgetMap;
  
  try {
    const stored = localStorage.getItem('astro-builder-custom-widgets');
    if (stored) {
      const data = JSON.parse(stored);
      const widgets = data.widgets || [];
      widgets.forEach((w: any) => {
        widgetMap.set(w.type, { template: w.template });
      });
    }
  } catch (e) {
    console.error('Failed to load custom widgets for serializer:', e);
  }
  
  return widgetMap;
}

// Get nested value from object
function getNestedValue(obj: any, path: string): any {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

// Merge CSS classes and remove duplicates
function mergeClasses(...classes: (string | undefined)[]): string {
  const allClasses = classes
    .filter(Boolean)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean);
  
  // Remove duplicates while preserving order, then escape for MDX
  const merged = [...new Set(allClasses)].join(' ');
  return escapeTailwindClass(merged);
}

// Get SVG icon for social platforms
function getSocialIconSvg(iconOrPlatform: string): string {
  const platform = iconOrPlatform?.replace('tabler:brand-', '').replace('tabler:', '').toLowerCase() || '';
  
  const icons: Record<string, string> = {
    github: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
    linkedin: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    twitter: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>',
    facebook: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    instagram: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
    youtube: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
    email: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
    website: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>',
  };
  
  return icons[platform] || `<span class="text-sm font-bold">${platform.charAt(0).toUpperCase()}</span>`;
}

// Render custom widget to HTML based on template
function renderCustomWidgetToHTML(type: string, props: Record<string, any>, template?: WidgetTemplate): string {
  if (!template) {
    // Fallback: render as a simple div with JSON data
    const title = escapeHtmlContent(String(props.title || props.name || type));
    const subtitle = props.subtitle || props.description ? escapeHtmlContent(String(props.subtitle || props.description)) : '';
    return `<div class="custom-widget custom-widget-${type.toLowerCase()}" data-widget-type="${escapeHtmlAttr(type)}">
  <div class="p-6 bg-white dark:bg-slate-900 rounded-lg shadow">
    <h3 class="text-xl font-bold mb-4">${title}</h3>
    ${subtitle ? `<p class="text-gray-600 dark:text-slate-400">${subtitle}</p>` : ''}
  </div>
</div>`;
  }

  const elements = template.elements.map(el => renderTemplateElement(el, props)).filter(Boolean).join('\n    ');
  
  const layoutClasses: Record<string, string> = {
    card: 'max-w-2xl mx-auto',
    section: 'max-w-6xl mx-auto',
    list: 'max-w-4xl mx-auto',
    grid: 'max-w-7xl mx-auto',
    hero: 'max-w-6xl mx-auto',
  };

  const containerClass = template.containerClass || '';
  const layoutClass = layoutClasses[template.layout] || layoutClasses.section;

  let headerHTML = '';
  if (template.showHeader && (props.title || props.subtitle || props.tagline)) {
    const headerAlign = template.headerPosition === 'left' ? 'text-left' : 'text-center';
    headerHTML = `
    <div class="mb-8 md:mb-12 ${headerAlign}">
      ${props.tagline ? `<p class="text-base text-primary dark:text-blue-200 font-bold tracking-wide uppercase mb-2">${escapeHtmlContent(String(props.tagline))}</p>` : ''}
      ${props.title ? `<h2 class="text-3xl md:text-4xl font-bold dark:text-white mb-4">${escapeHtmlContent(String(props.title))}</h2>` : ''}
      ${props.subtitle ? `<p class="text-xl text-gray-600 dark:text-slate-400 max-w-3xl ${template.headerPosition !== 'left' ? 'mx-auto' : ''}">${escapeHtmlContent(String(props.subtitle))}</p>` : ''}
    </div>`;
  }

  if (template.layout === 'card') {
    return `<section class="relative not-prose px-4 py-16 md:py-20 lg:py-24 ${layoutClass}">
  <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 ${containerClass}">
    ${elements}
  </div>
</section>`;
  }

  return `<section class="relative not-prose px-4 py-16 md:py-20 lg:py-24 ${layoutClass} ${containerClass}">
  ${headerHTML}
  ${elements}
</section>`;
}

// Render a single template element to HTML
function renderTemplateElement(element: TemplateElement, props: Record<string, any>): string {
  const value = element.field ? getNestedValue(props, element.field) : undefined;
  const className = element.className || '';
  
  // For grid/carousel with nested elements, don't require value
  if ((element.type === 'grid' || element.type === 'carousel') && element.elements && element.elements.length > 0) {
    // Continue to switch statement
  } else if (value === undefined || value === null) {
    return '';
  }

  switch (element.type) {
    case 'title':
      return `<h2 class="${mergeClasses('text-2xl md:text-3xl font-bold dark:text-white', className)}">${escapeHtmlContent(String(value))}</h2>`;
    
    case 'subtitle':
      return `<p class="${mergeClasses('text-lg text-gray-600 dark:text-slate-400', className)}">${escapeHtmlContent(String(value))}</p>`;
    
    case 'text':
      return `<p class="${mergeClasses('text-gray-600 dark:text-slate-400', className)}">${escapeHtmlContent(String(value))}</p>`;
    
    case 'image': {
      const src = typeof value === 'string' ? value : value?.src;
      const alt = typeof value === 'string' ? '' : value?.alt || '';
      const sizeClasses: Record<string, string> = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-32 h-32',
        xl: 'w-48 h-48',
        full: 'w-full h-auto',
      };
      const shapeClasses: Record<string, string> = {
        square: '',
        rounded: 'rounded-lg',
        circle: 'rounded-full',
      };
      const size = sizeClasses[element.imageSize || 'md'];
      const shape = shapeClasses[element.imageShape || 'rounded'];
      return `<img src="${escapeHtmlAttr(src)}" alt="${escapeHtmlAttr(alt)}" class="${mergeClasses('object-cover', size, shape, className)}" />`;
    }
    
    case 'button': {
      const text = typeof value === 'string' ? value : value?.text;
      const href = typeof value === 'string' ? '#' : value?.href || '#';
      const variantClasses: Record<string, string> = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-slate-700 dark:text-white',
        outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
      };
      const variant = variantClasses[element.buttonVariant || 'primary'];
      return `<a href="${escapeHtmlAttr(href)}" class="${mergeClasses('inline-block px-6 py-3 rounded-lg font-medium transition', variant, className)}">${escapeHtmlContent(String(text))}</a>`;
    }
    
    case 'tags': {
      // Handle both array and string values for tags/badge
      if (!value) return '';
      const tagsArray = Array.isArray(value) ? value : [value];
      if (tagsArray.length === 0 || (tagsArray.length === 1 && !tagsArray[0])) return '';
      return `<div class="${mergeClasses('flex flex-wrap gap-2', className)}">
      ${tagsArray.map((tag: string) => `<span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm">${escapeHtmlContent(String(tag))}</span>`).join('\n      ')}
    </div>`;
    }
    
    case 'list': {
      if (!Array.isArray(value)) return '';
      const listItems = value.map((item: any) => {
        const text = typeof item === 'string' ? item : item?.text || item?.title || item?.description || '';
        const checkIcon = element.listStyle === 'check' ? '<span class="text-green-500 mr-2">✓</span>' : '';
        return `<li class="flex items-start gap-2">${checkIcon}<span>${escapeHtmlContent(String(text))}</span></li>`;
      }).join('\n      ');
      return `<ul class="space-y-2 ${className}">
      ${listItems}
    </ul>`;
    }
    
    case 'progress':
      if (!Array.isArray(value)) return '';
      return `<div class="space-y-4 ${className}">
      ${value.map((item: any) => `<div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="font-medium dark:text-white">${escapeHtmlContent(String(item.name))}</span>
          <span class="text-gray-500">${escapeHtmlContent(String(item.level))}%</span>
        </div>
        <div class="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full rounded-full" style="width: ${Number(item.level) || 0}%; background-color: ${escapeHtmlAttr(item.color || '#3b82f6')}"></div>
        </div>
      </div>`).join('\n      ')}
    </div>`;
    
    case 'social':
      if (!Array.isArray(value)) return '';
      return `<div class="${mergeClasses('flex gap-3', className)}">
      ${value.map((link: any) => {
        const iconSvg = getSocialIconSvg(link.icon || link.platform);
        return `<a href="${escapeHtmlAttr(link.url || '#')}" class="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900 transition" target="_blank" rel="noopener noreferrer">${iconSvg}</a>`;
      }).join('\n      ')}
    </div>`;
    
    case 'divider':
      return `<hr class="border-gray-200 dark:border-slate-700 my-4 ${className}" />`;
    
    case 'grid': {
      const gridCols = props.columns || element.gridCols || 3;
      const gridColsClasses: Record<number, string> = {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
      };
      const gridColsClass = gridColsClasses[gridCols] || 'grid-cols-3';
      
      // Case 1: Grid with nested elements (layout grid, no data field)
      if (element.elements && element.elements.length > 0) {
        const nestedElements = element.elements.map(childEl => renderTemplateElement(childEl, props)).filter(Boolean).join('\n    ');
        return `<div class="${mergeClasses('grid', gridColsClass, 'md:' + gridColsClass, className)}">
    ${nestedElements}
  </div>`;
      }
      
      // Case 2: Grid with data field (data-driven grid)
      if (!Array.isArray(value)) return '';
      
      // If itemTemplate is defined, render each item using the template
      if (element.itemTemplate) {
        const itemContainerClass = element.itemTemplate.containerClass || '';
        return `<div class="${mergeClasses('grid', gridColsClass, 'md:' + gridColsClass, className)}">
      ${value.map((item: any) => {
        const itemElements = element.itemTemplate!.elements.map(childEl => {
          // Check condition
          if (childEl.condition && !getNestedValue(item, childEl.condition)) {
            return '';
          }
          return renderTemplateElement(childEl, item);
        }).filter(Boolean).join('\n        ');
        return `<div class="${mergeClasses('bg-white dark:bg-slate-800 rounded-lg shadow p-4 relative', itemContainerClass)}">
        ${itemElements}
      </div>`;
      }).join('\n      ')}
    </div>`;
      }
      
      return `<div class="${mergeClasses('grid', gridColsClass, 'md:' + gridColsClass, className)}">
      ${value.map((item: any) => {
        const src = typeof item === 'string' ? item : item?.src || '';
        const alt = typeof item === 'string' ? '' : item?.alt || '';
        const caption = item?.caption || '';
        const link = item?.link || '';
        
        const imgHtml = `<img src="${escapeHtmlAttr(src)}" alt="${escapeHtmlAttr(alt)}" class="w-full h-48 object-cover rounded-lg" />`;
        const captionHtml = caption ? `<p class="mt-2 text-sm text-gray-600 dark:text-slate-400 text-center">${escapeHtmlContent(caption)}</p>` : '';
        
        if (link) {
          return `<a href="${escapeHtmlAttr(link)}" class="block group">
        ${imgHtml}
        ${captionHtml}
      </a>`;
        }
        return `<div class="group">
        ${imgHtml}
        ${captionHtml}
      </div>`;
      }).join('\n      ')}
    </div>`;
    }
    
    case 'carousel': {
      // Carousel - render as grid for static HTML output
      if (!Array.isArray(value)) return '';
      const slidesToShow = props.slidesToShow || element.slidesToShow || 4;
      const gridColsClasses: Record<number, string> = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
      };
      const gridColsClass = gridColsClasses[slidesToShow] || 'grid-cols-4';
      
      // If itemTemplate is defined, render each item using the template
      if (element.itemTemplate) {
        const itemContainerClass = element.itemTemplate.containerClass || '';
        return `<div class="${mergeClasses('grid gap-4', gridColsClass, className)}">
      ${value.map((item: any) => {
        const itemElements = element.itemTemplate!.elements.map(childEl => {
          // Check condition
          if (childEl.condition && !getNestedValue(item, childEl.condition)) {
            return '';
          }
          return renderTemplateElement(childEl, item);
        }).filter(Boolean).join('\n        ');
        return `<div class="${mergeClasses('bg-white dark:bg-slate-800 rounded-lg shadow relative overflow-hidden', itemContainerClass)}">
        ${itemElements}
      </div>`;
      }).join('\n      ')}
    </div>`;
      }
      
      return `<div class="${mergeClasses('grid gap-4', gridColsClass, className)}">
      ${value.map((item: any) => `<div class="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">${escapeHtmlContent(JSON.stringify(item))}</div>`).join('\n      ')}
    </div>`;
    }
    
    case 'custom': {
      let htmlContent = String(value || '');
      
      // For HTML content fields (like priceHtml), render directly
      if (element.field?.toLowerCase().includes('html')) {
        return `<div class="${className}">${htmlContent}</div>`;
      }
      
      // Process template placeholders like {{categories}}, {{priceRanges}}, {{colors}}
      const placeholderRegex = /\{\{(\w+)\}\}/g;
      htmlContent = htmlContent.replace(placeholderRegex, (match, fieldName) => {
        const fieldValue = props[fieldName];
        if (!fieldValue) return '';
        
        // Render array fields
        if (Array.isArray(fieldValue)) {
          // Check if it's a categories/priceRanges type (has name/label and active)
          if (fieldValue[0]?.name || fieldValue[0]?.label) {
            const listId = `filter-${fieldName}-${Date.now()}`;
            return `<ul id="${listId}" class="filter-list space-y-1.5" data-filter-type="${fieldName}">
            ${fieldValue.map((item: any, idx: number) => {
              const label = item.name || item.label;
              const count = item.count !== undefined 
                ? `<span class="filter-count px-2 py-0.5 text-xs rounded-full transition-all ${item.active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}">${item.count}</span>` 
                : '';
              const activeClass = item.active 
                ? 'active bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25' 
                : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300';
              return `<li class="list-none"><button data-filter-id="${escapeHtmlAttr(item.id || String(idx))}" class="filter-btn w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${activeClass}">${escapeHtmlContent(label)}${count}</button></li>`;
            }).join('\n            ')}
          </ul>`;
          }
          // Check if it's a colors type (has hex)
          if (fieldValue[0]?.hex) {
            return `<div class="color-filter flex flex-wrap gap-2" data-filter-type="colors">
            ${fieldValue.map((item: any, idx: number) => {
              const activeClass = item.active 
                ? 'active ring-2 ring-blue-500 ring-offset-2 scale-110' 
                : 'hover:scale-110 hover:ring-2 hover:ring-gray-300 hover:ring-offset-1';
              const borderClass = item.hex?.toUpperCase() === '#FFFFFF' ? 'border-2 border-gray-200' : 'border border-transparent';
              const checkIcon = item.active ? `<svg class="w-4 h-4 mx-auto text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>` : '';
              return `<button data-color-id="${escapeHtmlAttr(item.id || String(idx))}" class="color-btn w-8 h-8 rounded-full ${borderClass} transition-all duration-200 shadow-sm hover:shadow-md ${activeClass}" style="background-color: ${escapeHtmlAttr(item.hex)}" title="${escapeHtmlAttr(item.name)}">${checkIcon}</button>`;
            }).join('\n            ')}
          </div>`;
          }
          // Default array rendering
          return fieldValue.map((item: any) => `<span class="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">${typeof item === 'string' ? escapeHtmlContent(item) : escapeHtmlContent(JSON.stringify(item))}</span>`).join(' ');
        }
        
        return escapeHtmlContent(String(fieldValue));
      });
      
      // Note: Interactive JS only works in preview mode (React)
      // For static MDX output, filters are display-only
      // To add interactivity, include a separate client-side script
      
      // For quote-like content, wrap with quotation marks
      if (className.includes('italic') || element.field === 'quote') {
        return `<div class="${className}">"${htmlContent}"</div>`;
      }
      return `<div class="${className}">${htmlContent}</div>`;
    }
    
    default:
      return '';
  }
}

// Escape special characters for YAML strings
function escapeYamlString(str: string): string {
  if (!str) return str;
  // Escape single quotes by doubling them in YAML
  return str.replace(/'/g, "''");
}

// Escape special characters for HTML attributes
function escapeHtmlAttr(str: string): string {
  if (!str) return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Escape special characters for HTML content
function escapeHtmlContent(str: string): string {
  if (!str) return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Escape Tailwind classes that contain special characters for MDX compatibility
function escapeTailwindClass(className: string): string {
  if (!className) return className;
  // Remove content-[] classes with quotes as they break MDX parsing
  // These will need to be handled differently in the actual CSS
  return className
    .replace(/before:content-\[[^\]]*['"][^\]]*\]/g, '')
    .replace(/after:content-\[[^\]]*['"][^\]]*\]/g, '')
    .replace(/content-\[[^\]]*['"][^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toJSON(blocks: BuilderBlock[], metadata?: ElementMetadata): string {
  return JSON.stringify({ metadata, blocks }, null, 2);
}

/**
 * Convert blocks to MDX with embedded builder data for re-editing
 */
export function toMDX(blocks: BuilderBlock[], metadata?: ElementMetadata): string {
  const customWidgets = loadCustomWidgetsForSerializer();
  const usedTypes = new Set(blocks.map((b) => b.type));

  const escapedTitle = escapeYamlString(metadata?.title || 'Generated Page');
  const escapedDescription = escapeYamlString(metadata?.description || '');

  let mdx = `---
title: '${escapedTitle}'
${
  escapedDescription
    ? `metadata:
  description: '${escapedDescription}'`
    : ''
}
---\n\n`;

  // Add imports (only for built-in widgets)
  usedTypes.forEach((type) => {
    if (IMPORTS[type]) {
      mdx += `import ${type} from '${IMPORTS[type]}';\n`;
    }
  });

  mdx += '\n';

  // Add components
  blocks.forEach((block) => {
    // Check if this is a custom widget
    const customWidget = customWidgets.get(block.type);
    
    if (customWidget || !IMPORTS[block.type]) {
      // Custom widget - render as HTML
      const html = renderCustomWidgetToHTML(block.type, block.props, customWidget?.template);
      mdx += `${html}\n\n`;
    } else {
      // Built-in widget - render as component
      const propsStrings = Object.entries(block.props)
        .map(([key, value]) => {
          if (value === undefined || value === null || value === '') return '';

          if (typeof value === 'string') {
            return `${key}="${value.replace(/"/g, '&quot;')}"`;
          }

          if (typeof value === 'boolean') {
            return value ? key : `${key}={false}`;
          }

          return `${key}={${JSON.stringify(value)}}`;
        })
        .filter(Boolean)
        .join(' ');

      mdx += `<${block.type} ${propsStrings} />\n\n`;
    }
  });

  // Embed builder data as a comment for re-editing
  const builderData: BuilderData = {
    version: '1.0',
    blocks,
    metadata: metadata || { title: '', description: '' },
    savedAt: new Date().toISOString(),
  };

  const builderDataComment = `{/* BUILDER_DATA_START
${JSON.stringify(builderData, null, 2)}
BUILDER_DATA_END */}`;

  mdx += `\n${builderDataComment}\n`;

  return mdx;
}

/**
 * Parse MDX content and extract builder data if present
 */
export function parseMDXBuilderData(mdxContent: string): BuilderData | null {
  const builderDataMatch = mdxContent.match(/\{\/\*\s*BUILDER_DATA_START\n([\s\S]*?)\nBUILDER_DATA_END\s*\*\/\}/);

  if (!builderDataMatch) {
    return null;
  }

  try {
    const data = JSON.parse(builderDataMatch[1]);
    return {
      version: data.version || '1.0',
      blocks: data.blocks || [],
      metadata: data.metadata || { title: '', description: '' },
      savedAt: data.savedAt || '',
    };
  } catch (e) {
    console.error('Failed to parse builder data from MDX:', e);
    return null;
  }
}

/**
 * Extract frontmatter metadata from MDX content
 */
export function parseMDXFrontmatter(mdxContent: string): PageMetadata {
  const frontmatterMatch = mdxContent.match(/^---\n([\s\S]*?)\n---/);
  const metadata: PageMetadata = {};

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const titleMatch = frontmatter.match(/title:\s*['"]?([^'"\n]+)['"]?/);
    const descMatch = frontmatter.match(/description:\s*['"]?([^'"\n]+)['"]?/);

    if (titleMatch) metadata.title = titleMatch[1].trim();
    if (descMatch) metadata.description = descMatch[1].trim();
  }

  return metadata;
}

/**
 * Check if MDX content has builder data
 */
export function hasMDXBuilderData(mdxContent: string): boolean {
  return /\{\/\*\s*BUILDER_DATA_START/.test(mdxContent);
}

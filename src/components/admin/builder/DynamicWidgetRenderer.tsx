import * as TablerIcons from '@tabler/icons-react';
import React, { useState } from 'react';

// Template types cho dynamic rendering
export interface WidgetTemplate {
  layout: 'card' | 'section' | 'list' | 'grid' | 'hero';
  containerClass?: string;
  showHeader?: boolean;
  headerPosition?: 'left' | 'center';
  elements: TemplateElement[];
}

export interface TemplateElement {
  type: 'title' | 'subtitle' | 'text' | 'image' | 'icon' | 'button' | 'list' | 'grid' | 'carousel' | 'progress' | 'tags' | 'social' | 'divider' | 'custom';
  field: string; // Field name from props
  className?: string;
  wrapper?: string; // Wrapper element class
  condition?: string; // Field name to check for conditional rendering
  children?: TemplateElement[];
  elements?: TemplateElement[]; // Alternative to children for nested elements
  // Specific props for each type
  imageSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  imageShape?: 'square' | 'rounded' | 'circle';
  buttonVariant?: 'primary' | 'secondary' | 'outline';
  gridCols?: number;
  listStyle?: 'bullet' | 'check' | 'number' | 'none';
  // Item template for grid/carousel items
  itemTemplate?: {
    layout?: string;
    containerClass?: string;
    elements: TemplateElement[];
  };
  // Carousel specific props
  slidesToShow?: number;
  autoplay?: boolean;
  autoplayInterval?: number;
  showArrows?: boolean;
  showDots?: boolean;
}

// Filter item types
interface CategoryItem {
  id: string;
  name?: string;
  label?: string;
  count?: number;
  active?: boolean;
}

interface ColorItem {
  id: string;
  name: string;
  hex: string;
  active?: boolean;
}

// Interactive Filter Sidebar Component
interface FilterSidebarProps {
  htmlTemplate: string;
  categories?: CategoryItem[];
  priceRanges?: CategoryItem[];
  colors?: ColorItem[];
  className?: string;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
  htmlTemplate, 
  categories: initialCategories, 
  priceRanges: initialPriceRanges, 
  colors: initialColors,
  className 
}) => {
  const [categories, setCategories] = useState(initialCategories || []);
  const [priceRanges, setPriceRanges] = useState(initialPriceRanges || []);
  const [colors, setColors] = useState(initialColors || []);

  const handleCategoryClick = (id: string) => {
    setCategories(prev => prev.map(cat => ({
      ...cat,
      active: cat.id === id
    })));
  };

  const handlePriceRangeClick = (id: string) => {
    setPriceRanges(prev => prev.map(range => ({
      ...range,
      active: range.id === id
    })));
  };

  const handleColorClick = (id: string) => {
    setColors(prev => prev.map(color => ({
      ...color,
      active: color.id === id ? !color.active : color.active
    })));
  };

  const clearFilters = () => {
    setCategories(prev => prev.map((cat, i) => ({ ...cat, active: i === 0 })));
    setPriceRanges(prev => prev.map((range, i) => ({ ...range, active: i === 0 })));
    setColors(prev => prev.map(color => ({ ...color, active: false })));
  };

  // Parse HTML template and replace placeholders with React components
  const parts = htmlTemplate.split(/(\{\{categories\}\}|\{\{priceRanges\}\}|\{\{colors\}\})/);

  return (
    <div className={cn('space-y-6', className)}>
      {parts.map((part, index) => {
        if (part === '{{categories}}') {
          return (
            <ul key={index} className="space-y-1.5">
              {categories.map((item) => (
                <li key={item.id} className="list-none">
                  <button
                    onClick={() => handleCategoryClick(item.id)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                      item.active
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {item.name || item.label}
                    {item.count !== undefined && (
                      <span className={cn(
                        'px-2 py-0.5 text-xs rounded-full',
                        item.active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                      )}>
                        {item.count}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          );
        }
        
        if (part === '{{priceRanges}}') {
          return (
            <ul key={index} className="space-y-1.5">
              {priceRanges.map((item) => (
                <li key={item.id} className="list-none">
                  <button
                    onClick={() => handlePriceRangeClick(item.id)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                      item.active
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {item.name || item.label}
                  </button>
                </li>
              ))}
            </ul>
          );
        }
        
        if (part === '{{colors}}') {
          return (
            <div key={index} className="flex flex-wrap gap-2">
              {colors.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleColorClick(item.id)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all duration-200 shadow-sm hover:shadow-md',
                    item.hex?.toUpperCase() === '#FFFFFF' ? 'border-2 border-gray-200' : 'border border-transparent',
                    item.active
                      ? 'ring-2 ring-blue-500 ring-offset-2 scale-110'
                      : 'hover:scale-110 hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                  )}
                  style={{ backgroundColor: item.hex }}
                  title={item.name}
                >
                  <span className="sr-only">{item.name}</span>
                  {item.active && (
                    <svg className="w-4 h-4 mx-auto text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          );
        }
        
        // Check for clear filter button
        if (part.includes('Xóa bộ lọc') || part.includes('Clear') || part.includes('Reset')) {
          const beforeButton = part.split(/<button[^>]*>.*?<\/button>/i)[0] || '';
          return (
            <React.Fragment key={index}>
              <div dangerouslySetInnerHTML={{ __html: beforeButton }} />
              <button
                onClick={clearFilters}
                className="w-full py-2.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200"
              >
                Xóa bộ lọc
              </button>
            </React.Fragment>
          );
        }
        
        // Regular HTML content
        if (part.trim()) {
          return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />;
        }
        
        return null;
      })}
    </div>
  );
};

// Helper functions
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

const getNestedValue = (obj: any, path: string): any => {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

const tablerNameToComponent = (name: string) => {
  return 'Icon' + name.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
};

// Element Renderers
const renderIcon = (iconName: string, size = 24, className?: string) => {
  if (!iconName) return null;
  
  if (iconName.startsWith('tabler:')) {
    const name = iconName.replace('tabler:', '');
    const componentName = tablerNameToComponent(name);
    const IconComponent = (TablerIcons as any)[componentName];
    if (IconComponent) {
      return <IconComponent size={size} className={className} />;
    }
  }
  
  // Fallback to emoji or text
  return <span className={className}>{iconName}</span>;
};

const renderElement = (element: TemplateElement, props: Record<string, any>, index: number): React.ReactNode => {
  const value = getNestedValue(props, element.field);
  
  // Conditional rendering
  if (element.condition && !getNestedValue(props, element.condition)) {
    return null;
  }
  
  const key = `${element.type}-${element.field}-${index}`;
  
  switch (element.type) {
    case 'title':
      return (
        <h2 
          key={key}
          className={cn('text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight', element.className)}
          dangerouslySetInnerHTML={{ __html: value || '' }}
        />
      );
      
    case 'subtitle':
      return (
        <p 
          key={key}
          className={cn('text-base text-gray-500 dark:text-slate-400', element.className)}
          dangerouslySetInnerHTML={{ __html: value || '' }}
        />
      );
      
    case 'text':
      return (
        <p 
          key={key}
          className={cn('text-sm text-gray-500 dark:text-slate-400 leading-relaxed', element.className)}
          dangerouslySetInnerHTML={{ __html: value || '' }}
        />
      );
      
    case 'image': {
      if (!value) return null;
      const imgSrc = typeof value === 'string' ? value : value?.src;
      const imgAlt = typeof value === 'string' ? '' : value?.alt || '';
      const sizeClasses = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-full aspect-square',
        xl: 'w-48 h-48',
        full: 'w-full h-auto',
      };
      const shapeClasses = {
        square: '',
        rounded: 'rounded-xl',
        circle: 'rounded-full',
      };
      return (
        <div key={key} className="overflow-hidden">
          <img
            src={imgSrc}
            alt={imgAlt}
            className={cn(
              'object-cover transition-transform duration-500 group-hover:scale-110',
              sizeClasses[element.imageSize || 'md'],
              shapeClasses[element.imageShape || 'rounded'],
              element.className
            )}
          />
        </div>
      );
    }
      
    case 'icon':
      return (
        <div key={key} className={cn('flex items-center justify-center', element.className)}>
          {renderIcon(value, 32)}
        </div>
      );
      
    case 'button': {
      if (!value) return null;
      const btnText = typeof value === 'string' ? value : value?.text;
      const btnHref = typeof value === 'string' ? '#' : value?.href || value?.url || '#';
      const btnIcon = typeof value === 'object' ? value?.icon : null;
      const variantClasses = {
        primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40',
        secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600',
        outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950',
      };
      return (
        <a
          key={key}
          href={btnHref}
          className={cn(
            'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200',
            variantClasses[element.buttonVariant || 'primary'],
            element.className
          )}
        >
          {btnIcon && renderIcon(btnIcon, 18)}
          {btnText}
        </a>
      );
    }
      
    case 'list': {
      if (!Array.isArray(value)) return null;
      const listStyleClasses = {
        bullet: 'list-disc list-inside',
        check: '',
        number: 'list-decimal list-inside',
        none: '',
      };
      return (
        <ul key={key} className={cn(listStyleClasses[element.listStyle || 'none'], 'space-y-2', element.className)}>
          {value.map((item: any, i: number) => (
            <li key={i} className="flex items-start gap-2">
              {element.listStyle === 'check' && <span className="text-green-500 mt-1">✓</span>}
              <span>{typeof item === 'string' ? item : item?.text || item?.title || item?.description || JSON.stringify(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
      
    case 'tags': {
      // Handle both array and string values for tags/badge
      if (!value) return null;
      const tagsArray = Array.isArray(value) ? value : [value];
      if (tagsArray.length === 0 || (tagsArray.length === 1 && !tagsArray[0])) return null;
      
      // Determine badge style based on content
      const getBadgeStyle = (tag: string) => {
        const tagLower = tag.toLowerCase();
        if (tagLower.includes('sale') || tagLower.includes('%')) {
          return 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25';
        }
        if (tagLower.includes('new') || tagLower.includes('mới')) {
          return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25';
        }
        if (tagLower.includes('hot')) {
          return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25';
        }
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25';
      };
      
      return (
        <div key={key} className={cn('flex flex-wrap gap-1.5', element.className)}>
          {tagsArray.map((tag: string, i: number) => (
            <span
              key={i}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg',
                getBadgeStyle(tag)
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      );
    }
      
    case 'social':
      if (!Array.isArray(value)) return null;
      return (
        <div key={key} className={cn('flex gap-3', element.className)}>
          {value.map((link: any, i: number) => (
            <a
              key={i}
              href={link.url || '#'}
              className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900 transition"
            >
              {renderIcon(link.icon, 20) || <span>{link.platform?.charAt(0)}</span>}
            </a>
          ))}
        </div>
      );
      
    case 'progress':
      if (!Array.isArray(value)) return null;
      return (
        <div key={key} className={cn('space-y-4', element.className)}>
          {value.map((item: any, i: number) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium dark:text-white">{item.name}</span>
                <span className="text-gray-500">{item.level}%</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${item.level}%`, backgroundColor: item.color || '#3b82f6' }}
                />
              </div>
            </div>
          ))}
        </div>
      );
      
    case 'grid': {
      const cols = props.columns || element.gridCols || 3;
      const gridColClasses: Record<number, string> = {
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-3',
        4: 'md:grid-cols-4',
        5: 'md:grid-cols-5',
        6: 'md:grid-cols-6',
      };
      const gridColClass = gridColClasses[cols] || 'md:grid-cols-3';
      
      // Case 1: Grid with nested elements (layout grid, no data field)
      if (element.elements && element.elements.length > 0) {
        return (
          <div 
            key={key} 
            className={cn(
              'grid gap-6 grid-cols-1',
              gridColClass,
              element.className
            )}
          >
            {element.elements.map((childEl, ci) => renderElement(childEl, props, ci))}
          </div>
        );
      }
      
      // Case 2: Grid with data field (data-driven grid)
      if (!Array.isArray(value)) return null;
      
      return (
        <div 
          key={key} 
          className={cn(
            'grid gap-6 grid-cols-1',
            gridColClass,
            element.className
          )}
        >
          {value.map((item: any, i: number) => {
            // If itemTemplate is defined, render each item using the template
            if (element.itemTemplate) {
              const itemContainerClass = element.itemTemplate.containerClass || '';
              return (
                <div 
                  key={i} 
                  className={cn(
                    'bg-white dark:bg-slate-800/50 rounded-2xl overflow-hidden relative',
                    'border border-gray-100 dark:border-slate-700',
                    'hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-slate-900/50',
                    'hover:-translate-y-1 transition-all duration-300',
                    itemContainerClass
                  )}
                >
                  {element.itemTemplate.elements.map((childEl, ci) => 
                    renderElement(childEl, item, ci)
                  )}
                </div>
              );
            }
            
            // Check if item is an image object
            if (item?.src) {
              return (
                <div key={i} className="group">
                  {item.link ? (
                    <a href={item.link} className="block">
                      <img 
                        src={item.src} 
                        alt={item.alt || ''} 
                        className="w-full h-48 object-cover rounded-lg transition-transform group-hover:scale-105" 
                      />
                      {item.caption && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400 text-center">{item.caption}</p>
                      )}
                    </a>
                  ) : (
                    <>
                      <img 
                        src={item.src} 
                        alt={item.alt || ''} 
                        className="w-full h-48 object-cover rounded-lg transition-transform group-hover:scale-105" 
                      />
                      {item.caption && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400 text-center">{item.caption}</p>
                      )}
                    </>
                  )}
                </div>
              );
            }
            // Fallback for other item types
            return (
              <div key={i} className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
                {element.children?.map((child, ci) => renderElement(child, item, ci))}
                {!element.children && <span>{JSON.stringify(item)}</span>}
              </div>
            );
          })}
        </div>
      );
    }
      
    case 'divider':
      return <hr key={key} className={cn('border-gray-200 dark:border-slate-700 my-4', element.className)} />;
    
    case 'carousel': {
      if (!Array.isArray(value)) return null;
      // Get carousel settings from element or props
      const slidesToShow = props.slidesToShow || element.slidesToShow || 4;
      const showArrows = props.showArrows !== undefined ? props.showArrows : element.showArrows !== undefined ? element.showArrows : true;
      const showDots = props.showDots !== undefined ? props.showDots : element.showDots !== undefined ? element.showDots : true;
      
      // For preview, render as a scrollable grid (actual carousel needs client-side JS)
      const gridColClasses: Record<number, string> = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
      };
      const gridColClass = gridColClasses[slidesToShow] || 'grid-cols-4';
      
      return (
        <div key={key} className={cn('relative', element.className)}>
          {/* Carousel container */}
          <div className={cn('grid gap-4', gridColClass)}>
            {value.slice(0, slidesToShow).map((item: any, i: number) => {
              // If itemTemplate is defined, render each item using the template
              if (element.itemTemplate) {
                const itemContainerClass = element.itemTemplate.containerClass || '';
                return (
                  <div 
                    key={i} 
                    className={cn('bg-white dark:bg-slate-800 rounded-lg shadow relative overflow-hidden', itemContainerClass)}
                  >
                    {element.itemTemplate.elements.map((childEl, ci) => 
                      renderElement(childEl, item, ci)
                    )}
                  </div>
                );
              }
              // Fallback
              return (
                <div key={i} className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
                  <span>{JSON.stringify(item)}</span>
                </div>
              );
            })}
          </div>
          
          {/* Navigation arrows placeholder */}
          {showArrows && (
            <>
              <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          
          {/* Dots placeholder */}
          {showDots && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: Math.ceil(value.length / slidesToShow) }).map((_, i) => (
                <button
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full transition',
                    i === 0 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      );
    }
      
    case 'custom': {
      // For custom HTML content with template placeholders
      const htmlContent = value || '';
      
      // Check if this is a filter sidebar with template placeholders
      if (String(htmlContent).includes('{{categories}}') || String(htmlContent).includes('{{priceRanges}}') || String(htmlContent).includes('{{colors}}')) {
        return (
          <FilterSidebar 
            key={key}
            htmlTemplate={String(htmlContent)}
            categories={props.categories}
            priceRanges={props.priceRanges}
            colors={props.colors}
            className={element.className}
          />
        );
      }
      
      // Regular custom HTML content
      return (
        <div 
          key={key}
          className={element.className}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
    }
      
    default:
      return null;
  }
};

// Layout Renderers
const renderCardLayout = (template: WidgetTemplate, props: Record<string, any>) => {
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-2xl mx-auto">
      <div className={cn('bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-slate-900/50 p-8', template.containerClass)}>
        {template.elements.map((el, i) => renderElement(el, props, i))}
      </div>
    </section>
  );
};

const renderSectionLayout = (template: WidgetTemplate, props: Record<string, any>) => {
  return (
    <section className={cn('relative not-prose px-4 py-12 md:py-16 lg:py-20 max-w-7xl mx-auto', template.containerClass)}>
      {template.showHeader && (
        <div className={cn('mb-10 md:mb-14', template.headerPosition === 'left' ? 'text-left' : 'text-center')}>
          {props.tagline && (
            <span className="inline-block px-4 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 rounded-full mb-4">
              {props.tagline}
            </span>
          )}
          {props.title && (
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">{props.title}</h2>
          )}
          {props.subtitle && (
            <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">{props.subtitle}</p>
          )}
        </div>
      )}
      {template.elements.map((el, i) => renderElement(el, props, i))}
    </section>
  );
};

const renderListLayout = (template: WidgetTemplate, props: Record<string, any>) => {
  return (
    <section className={cn('relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-4xl mx-auto', template.containerClass)}>
      {template.showHeader && props.title && (
        <h2 className="text-3xl font-bold dark:text-white mb-8 text-center">{props.title}</h2>
      )}
      <div className="space-y-4">
        {template.elements.map((el, i) => renderElement(el, props, i))}
      </div>
    </section>
  );
};

const renderGridLayout = (template: WidgetTemplate, props: Record<string, any>) => {
  return (
    <section className={cn('relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-7xl mx-auto', template.containerClass)}>
      {template.showHeader && props.title && (
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold dark:text-white mb-4">{props.title}</h2>
          {props.subtitle && <p className="text-xl text-gray-600 dark:text-slate-400">{props.subtitle}</p>}
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {template.elements.map((el, i) => renderElement(el, props, i))}
      </div>
    </section>
  );
};

// Main Dynamic Renderer
interface DynamicWidgetRendererProps {
  template: WidgetTemplate;
  props: Record<string, any>;
}

export const DynamicWidgetRenderer: React.FC<DynamicWidgetRendererProps> = ({ template, props }) => {
  switch (template.layout) {
    case 'card':
      return renderCardLayout(template, props);
    case 'section':
      return renderSectionLayout(template, props);
    case 'list':
      return renderListLayout(template, props);
    case 'grid':
      return renderGridLayout(template, props);
    case 'hero':
      return renderSectionLayout(template, props); // Use section for hero
    default:
      return renderSectionLayout(template, props);
  }
};

// Default template for widgets without custom template
export const getDefaultTemplate = (props: Record<string, any>): WidgetTemplate => {
  const elements: TemplateElement[] = [];
  
  // Auto-detect fields and create elements
  if (props.avatar || props.image) {
    elements.push({ type: 'image', field: props.avatar ? 'avatar' : 'image', imageSize: 'lg', imageShape: 'circle', className: 'mx-auto mb-6' });
  }
  if (props.name) {
    elements.push({ type: 'title', field: 'name', className: 'text-center mb-2' });
  }
  if (props.title && !props.name) {
    elements.push({ type: 'title', field: 'title', className: 'text-center mb-2' });
  }
  if (props.subtitle || props.role || props.job) {
    elements.push({ type: 'subtitle', field: props.subtitle ? 'subtitle' : (props.role ? 'role' : 'job'), className: 'text-center text-blue-600 mb-4' });
  }
  if (props.bio || props.description || props.content) {
    elements.push({ type: 'text', field: props.bio ? 'bio' : (props.description ? 'description' : 'content'), className: 'text-center mb-6' });
  }
  if (props.skills && Array.isArray(props.skills) && typeof props.skills[0] === 'string') {
    elements.push({ type: 'tags', field: 'skills', className: 'justify-center mb-6' });
  }
  if (props.skills && Array.isArray(props.skills) && typeof props.skills[0] === 'object') {
    elements.push({ type: 'progress', field: 'skills', className: 'mb-6' });
  }
  if (props.features && Array.isArray(props.features)) {
    elements.push({ type: 'list', field: 'features', listStyle: 'check', className: 'mb-6' });
  }
  if (props.socialLinks) {
    elements.push({ type: 'social', field: 'socialLinks', className: 'justify-center' });
  }
  if (props.callToAction) {
    elements.push({ type: 'button', field: 'callToAction', buttonVariant: 'primary', className: 'text-center' });
  }
  
  return {
    layout: 'card',
    showHeader: false,
    elements,
  };
};

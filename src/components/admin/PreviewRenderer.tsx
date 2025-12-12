import React from 'react';
import { WIDGET_REGISTRY, type WidgetType } from './registry';

interface PreviewRendererProps {
  type: WidgetType;
  props: Record<string, unknown>;
}

// Helper to simplify class names
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

export const PreviewRenderer: React.FC<PreviewRendererProps> = ({ type, props }) => {
  const widgetDef = WIDGET_REGISTRY.find((w) => w.type === type);

  if (!widgetDef) {
    return <div className="p-4 bg-red-100 text-red-700">Unknown Widget: {type}</div>;
  }

  // --- Specific Overrides for Complex Widgets ---
  // You can extend this switch for widgets that need special layout
  switch (type) {
    case 'Hero':
    case 'Hero2':
    case 'HeroText':
      return <HeroRenderer {...props} def={widgetDef} />;
    case 'Features':
    case 'Features2':
    case 'Features3':
      return <FeaturesRenderer {...props} def={widgetDef} />;
    case 'Content':
      return <ContentRenderer {...props} def={widgetDef} />;
    case 'Steps':
    case 'Steps2':
      return <StepsRenderer {...props} def={widgetDef} />;
    default:
      return <GenericRenderer type={type} props={props} />;
  }
};

// --- Renderers ---

const GenericRenderer: React.FC<{ type: string; props: Record<string, any> }> = ({ type, props }) => {
  return (
    <section className="relative not-prose scroll-mt-[72px]" id={props.id || undefined}>
      <div className={cn('relative mx-auto px-4 lg:py-20 md:py-16 py-12 text-default', props.isDark ? 'dark' : '')}>
        <div className="max-w-3xl mx-auto text-center p-6 border border-dashed border-gray-300 rounded-lg">
          <h3 className="text-xl font-bold mb-2">{type} Widget</h3>
          <p className="text-gray-500">Generic Preview (Implement specific renderer for better visual)</p>
          <pre className="mt-4 text-left bg-gray-100 p-2 text-xs overflow-auto max-h-40 rounded">
            {JSON.stringify(props, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  );
};

// Common Header Helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WidgetHeader = ({ title, subtitle, tagline, position = 'center' }: any) => {
  if (!title && !subtitle && !tagline) return null;

  return (
    <div className={cn('mb-8 md:mx-auto md:mb-12 text-center max-w-3xl', position === 'left' ? 'text-left ml-0' : '')}>
      {tagline && (
        <p
          className="text-base text-primary dark:text-blue-200 font-bold tracking-wide uppercase"
          dangerouslySetInnerHTML={{ __html: tagline }}
        />
      )}
      {title && (
        <h2
          className="text-4xl md:text-5xl font-bold leading-tighter tracking-tighter mb-4 font-heading"
          dangerouslySetInnerHTML={{ __html: title }}
        />
      )}
      {subtitle && (
        <p
          className="max-w-3xl mx-auto sm:text-center text-xl text-muted dark:text-slate-400"
          dangerouslySetInnerHTML={{ __html: subtitle }}
        />
      )}
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HeroRenderer = (props: any) => {
  const { title, subtitle, tagline, content, image, actions } = props;

  return (
    <section className="relative md:-mt-[76px] not-prose">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="pt-0 md:pt-[76px] pointer-events-none"></div>
        <div className="py-12 md:py-20 lg:py-0 lg:flex lg:items-center lg:h-screen lg:gap-8">
          <div className="basis-1/2 text-center lg:text-left pb-10 md:pb-16 mx-auto">
            {tagline && (
              <p
                className="text-base text-primary dark:text-blue-200 font-bold tracking-wide uppercase"
                dangerouslySetInnerHTML={{ __html: tagline }}
              />
            )}
            {title && (
              <h1
                className="text-5xl md:text-6xl font-bold leading-tighter tracking-tighter mb-4 font-heading dark:text-gray-200"
                dangerouslySetInnerHTML={{ __html: title }}
              />
            )}
            <div
              className="max-w-3xl mx-auto lg:max-w-none text-xl text-muted mb-6 dark:text-slate-300"
              dangerouslySetInnerHTML={{ __html: subtitle || content }}
            />

            {actions && (
              <div className="max-w-xs sm:max-w-md m-auto flex flex-nowrap flex-col sm:flex-row sm:justify-center gap-4 lg:justify-start lg:m-0 lg:max-w-7xl">
                {actions.map((action: any, i: number) => (
                  <a
                    key={i}
                    href={action.href}
                    className={cn('btn w-full sm:w-auto', action.variant === 'primary' ? 'btn-primary' : '')}
                  >
                    {action.text}
                  </a>
                ))}
              </div>
            )}
          </div>
          {image && (
            <div className="basis-1/2">
              <img src={image.src} alt={image.alt} className="mx-auto rounded-md w-full" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FeaturesRenderer = (props: any) => {
  const { title, subtitle, tagline, items, columns = 2 } = props;

  return (
    <section className="scroll-mt-16 relative not-prose">
      <div className="absolute inset-0 bg-blue-50 dark:bg-slate-800 pointer-events-none mb-32" aria-hidden="true"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
        <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />

        <div
          className={cn(
            'grid gap-6 dark:text-white sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
            columns === 2 ? 'lg:grid-cols-2' : '',
            columns === 3 ? 'lg:grid-cols-3' : '',
            columns >= 4 ? 'lg:grid-cols-4' : ''
          )}
        >
          {items &&
            items.map((item: any, i: number) => (
              <div
                key={i}
                className="relative flex flex-col p-6 bg-white dark:bg-slate-900 rounded shadow-lg hover:shadow-md transition-shadow border border-transparent dark:border-slate-800"
              >
                <div className="flex items-center mb-4">
                  {/* Icon placeholder since we don't have the icon resolver here */}
                  <div className="w-10 h-10 rounded bg-primary text-white flex items-center justify-center mr-4">★</div>
                  <div className="text-xl font-bold">{item.title}</div>
                </div>
                {item.description && (
                  <p className="text-muted text-md mt-2" dangerouslySetInnerHTML={{ __html: item.description }} />
                )}
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ContentRenderer = (props: any) => {
  const { title, subtitle, content, image, isReversed, items } = props;

  return (
    <section className="py-16 md:py-20 not-prose">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className={cn('md:flex md:gap-16 items-center', isReversed ? 'md:flex-row-reverse' : '')}>
          <div className="md:basis-1/2 self-center">
            <WidgetHeader title={title} subtitle={subtitle} position="left" />
            <div className="mb-10 text-lg dark:text-slate-400" dangerouslySetInnerHTML={{ __html: content }} />

            {items && (
              <div className="space-y-4">
                {items.map((item: any, i: number) => (
                  <div key={i} className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-gray-50">
                        Ok
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium leading-6 dark:text-white">
                        {item.title || item.description}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {image && (
            <div className="md:basis-1/2 md:mt-0 mt-10">
              <img src={image.src} alt={image.alt} className="mx-auto w-full rounded-lg bg-gray-500 shadow-lg" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StepsRenderer = (props: any) => {
  const { title, subtitle, items, image } = props;

  return (
    <section className="px-4 py-16 sm:px-6 mx-auto lg:px-8 lg:py-20 max-w-6xl">
      <div className="grid gap-6 row-gap-10 md:grid-cols-2">
        <div className="md:py-6 md:pr-16 text-gray-700 dark:text-gray-400">
          <WidgetHeader title={title} subtitle={subtitle} position="left" />
          {items &&
            items.map((item: any, i: number) => (
              <div key={i} className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-secondary border-2">
                      {i + 1}
                    </div>
                  </div>
                  <div className="w-px h-full bg-gray-300 dark:bg-slate-500"></div>
                </div>
                <div className="pt-1 pb-8">
                  <p className="mb-2 text-xl font-bold text-gray-900 dark:text-slate-300">{item.title}</p>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
        </div>
        <div className="relative">
          {image && (
            <img
              src={image.src}
              alt={image.alt}
              className="inset-0 object-cover object-top w-full rounded-md shadow-lg md:absolute md:h-full bg-gray-400 dark:bg-slate-700"
            />
          )}
        </div>
      </div>
    </section>
  );
};

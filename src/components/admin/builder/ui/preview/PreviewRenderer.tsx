import * as TablerIcons from '@tabler/icons-react';
import React from 'react';
import { playAnimeAnimation, playGSAPAnimation } from '../../../story/animations';
import { WidgetWrapper } from '../canvas/WidgetWrapper';
import { WIDGET_REGISTRY, type WidgetType } from '../../config/registry';
import { DynamicWidgetRenderer, getDefaultTemplate } from './DynamicWidgetRenderer';

function tablerNameToComponent(name: string) {
  return (
    'Icon' +
    name
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('')
  );
}
interface PreviewRendererProps {
  type: WidgetType | string; // Allow custom widget types
  props: Record<string, unknown>;
  widgetDef?: any; // Optional widget definition for custom widgets
}

// Helper to simplify class names
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

export const PreviewRenderer: React.FC<PreviewRendererProps> = (renderProps) => {
  const { type, props: widgetProps, widgetDef: externalWidgetDef } = renderProps;
  const widgetDef = externalWidgetDef || WIDGET_REGISTRY.find((w) => w.type === type);

  // Don't block rendering for custom widgets - just use GenericRenderer
  return (
    <WidgetWrapper
      animationEngine={widgetProps.animationEngine as any}
      animationType={widgetProps.animationType as string}
      loopAnimation={widgetProps.loopAnimation as string}
      animationDuration={widgetProps.animationDuration as number}
      animationDelay={widgetProps.animationDelay as number}
    >
      <InnerPreviewRenderer type={type} props={widgetProps} widgetDef={widgetDef} />
    </WidgetWrapper>
  );
};

const InnerPreviewRenderer: React.FC<{
  type: WidgetType | string;
  props: Record<string, unknown>;
  widgetDef: any;
}> = ({ type, props, widgetDef }) => {
  // --- Specific Overrides for Complex Widgets ---
  // You can extend this switch for widgets that need special layout
  switch (type) {
    case 'Stats':
      return <StatsRenderer {...props} />;
    case 'Brands':
      return <BrandsRenderer {...props} />;
    case 'Pricing':
      return <PricingRenderer {...props} />;
    case 'Testimonials':
      return <TestimonialsRenderer {...props} />;
    case 'CallToAction':
      return <CallToActionRenderer {...props} />;
    case 'Contact':
      return <ContactRenderer {...props} />;
    case 'Announcement':
      return <AnnouncementRenderer {...props} />;
    case 'Note':
      return <NoteRenderer {...props} />;
    case 'Countdown':
      return <CountdownRenderer {...props} />;
    case 'Newsletter':
      return <NewsletterRenderer {...props} />;
    case 'Divider':
      return <DividerRenderer {...props} />;
    case 'Spacer':
      return <SpacerRenderer {...props} />;
    case 'TableOfContents':
      return <TableOfContentsRenderer {...props} />;
    case 'Video':
      return <VideoRenderer {...props} />;
    case 'Gallery':
      return <GalleryRenderer {...props} />;
    case 'ImageSlider':
      return <ImageSliderRenderer {...props} />;
    case 'Team':
      return <TeamRenderer {...props} />;
    case 'Quote':
      return <QuoteRenderer {...props} />;
    case 'FAQs':
      return <FAQsRenderer {...props} />;
    case 'BlogLatestPosts':
    case 'BlogHighlightedPosts':
      return <BlogPostsRenderer {...props} type={type} />;

    case 'Hero':
    case 'Hero2':
    case 'HeroText':
      return <HeroRenderer {...props} def={widgetDef} />;
    case 'Features':
    case 'Features2':
    case 'Features3':
      return <FeaturesRenderer {...props} def={widgetDef} />;
    case 'Content1':
      return <ContentRenderer {...props} def={widgetDef} />;
    case 'Steps':
    case 'Steps2':
      return <StepsRenderer {...props} def={widgetDef} />;
    case 'Banner':
      return <BannerRenderer {...props} />;
    case 'Accordion':
      return <AccordionRenderer {...props} />;
    case 'Timeline':
      return <TimelineRenderer {...props} />;
    case 'Cards':
      return <CardsRenderer {...props} />;
    case 'LogoCloud':
      return <LogoCloudRenderer {...props} />;
    case 'Comparison':
      return <ComparisonRenderer {...props} />;
    case 'SocialLinks':
      return <SocialLinksRenderer {...props} />;
    case 'Map':
      return <MapRenderer {...props} />;
    case 'Alert':
      return <AlertRenderer {...props} />;
    case 'FeatureList':
      return <FeatureListRenderer {...props} />;
    case 'ProductShowcase':
      return <ProductShowcaseRenderer {...props} />;
    case 'Awards':
      return <AwardsRenderer {...props} />;
    case 'Partners':
      return <PartnersRenderer {...props} />;
    case 'Downloads':
      return <DownloadsRenderer {...props} />;
    case 'Events':
      return <EventsRenderer {...props} />;
    case 'EffectsWidget':
      return <EffectsWidgetRenderer {...props} />;
    // Custom Widgets - Use Dynamic Renderer
    default:
      // For custom widgets with template, use DynamicWidgetRenderer
      if (widgetDef?.template) {
        return <DynamicWidgetRenderer template={widgetDef.template} props={props} />;
      }
      // For unknown widgets without definition, auto-generate template
      if (!widgetDef) {
        const autoTemplate = getDefaultTemplate(props);
        return <DynamicWidgetRenderer template={autoTemplate} props={props} />;
      }
      // Fallback to generic renderer
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
  const {
    title,
    subtitle,
    tagline,
    content,
    image,
    actions,
    // Internal animation props
    titleAnimationType,
    titleAnimationDuration,
    titleAnimationDelay,
    imageAnimationType,
    imageAnimationDuration,
    imageAnimationDelay,
  } = props;

  return (
    <section className="relative md:-mt-[76px] not-prose">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="py-12 md:py-20 lg:py-0 lg:flex lg:items-center lg:h-screen lg:gap-8">
          <div className="basis-1/2 text-center lg:text-left pb-10 md:pb-16 mx-auto">
            {tagline && (
              <p
                className="text-base text-primary dark:text-blue-200 font-bold tracking-wide uppercase"
                dangerouslySetInnerHTML={{ __html: tagline }}
              />
            )}
            {title && (
              <WidgetWrapper
                animationType={titleAnimationType}
                animationDuration={titleAnimationDuration}
                animationDelay={titleAnimationDelay}
              >
                <h1
                  className="text-5xl md:text-6xl font-bold leading-tighter tracking-tighter mb-4 font-heading dark:text-gray-200"
                  dangerouslySetInnerHTML={{ __html: title }}
                />
              </WidgetWrapper>
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
              <WidgetWrapper
                animationType={imageAnimationType}
                animationDuration={imageAnimationDuration}
                animationDelay={imageAnimationDelay}
              >
                <img src={image.src} alt={image.alt} className="mx-auto rounded-md w-full" />
              </WidgetWrapper>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FeaturesRenderer = (props: any) => {
  const {
    title,
    subtitle,
    tagline,
    items,
    columns = 2,
    // Item animation props
    itemAnimationType,
    itemAnimationDuration = 1000,
    itemAnimationDelay = 0,
  } = props;

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
              <WidgetWrapper
                key={i}
                animationType={itemAnimationType}
                animationDuration={itemAnimationDuration}
                animationDelay={itemAnimationDelay + i * 150} // Stagger effect
              >
                <div className="relative flex flex-col p-6 bg-white dark:bg-slate-900 rounded shadow-lg hover:shadow-md transition-shadow border border-transparent dark:border-slate-800 h-full">
                  <div className="flex items-center mb-4">
                    {/* Icon placeholder since we don't have the icon resolver here */}
                    <div className="w-10 h-10 rounded bg-primary text-white flex items-center justify-center mr-4">
                      ★
                    </div>
                    <div className="text-xl font-bold">{item.title}</div>
                  </div>
                  {item.description && (
                    <p className="text-muted text-md mt-2" dangerouslySetInnerHTML={{ __html: item.description }} />
                  )}
                </div>
              </WidgetWrapper>
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

// --- Social & Marketing Renderers ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StatsRenderer = (props: any) => {
  const { title, subtitle, tagline, stats } = props;
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-7xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats &&
          stats.map((stat: any, i: number) => (
            <div
              key={i}
              className="text-center p-4 min-h-[140px] flex items-center justify-center flex-col bg-white dark:bg-slate-900 shadow-sm rounded-lg"
            >
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{stat.amount}</div>
              <div className="text-sm uppercase tracking-widest text-gray-800 dark:text-slate-400 font-bold">
                {stat.title}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BrandsRenderer = (props: any) => {
  const { title, subtitle, tagline, images, icons } = props;
  return (
    <section className="py-12 bg-blue-50 dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-60">
          {images &&
            images.map((img: any, i: number) => (
              <img
                key={i}
                src={img.src}
                alt={img.alt}
                className="h-10 w-auto grayscale mix-blend-multiply dark:mix-blend-normal dark:invert"
              />
            ))}
          {icons && icons.length > 0 && <div className="text-center">Icons Not Supported in Preview</div>}
        </div>
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PricingRenderer = (props: any) => {
  const { title, subtitle, tagline, prices } = props;
  return (
    <section className="relative not-prose py-16 md:py-20 lg:py-24 max-w-7xl mx-auto px-4">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div className="flex flex-wrap justify-center gap-4 dark:text-white sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {prices &&
          prices.map((price: any, i: number) => (
            <div
              key={i}
              className="flex flex-col justify-between w-full max-w-sm p-6 mx-auto bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-xl hover:shadow-2xl transition-shadow relative"
            >
              <div className="px-2 py-0">
                <h3 className="text-center text-xl font-semibold uppercase tracking-wider mb-4">{price.title}</h3>
                <div className="flex justify-center items-baseline my-8">
                  <span className="mr-2 text-5xl font-extrabold">${price.price}</span>
                  <span className="text-gray-500 dark:text-slate-400">{price.period}</span>
                </div>
                <ul className="mb-8 space-y-4 text-left">
                  {price.items &&
                    price.items.map((item: any, idx: number) => (
                      <li key={idx} className="flex items-center space-x-3">
                        <span className="text-green-500">✓</span>
                        <span>{item.description}</span>
                      </li>
                    ))}
                </ul>
              </div>
              {price.callToAction && (
                <a
                  href={price.callToAction.href}
                  className="btn w-full btn-primary block text-center py-2 px-4 rounded"
                >
                  {price.callToAction.text}
                </a>
              )}
            </div>
          ))}
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TestimonialsRenderer = (props: any) => {
  const { title, subtitle, tagline, testimonials } = props;
  return (
    <section className="relative not-prose py-16 md:py-20 lg:py-24 px-4 max-w-7xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials &&
          testimonials.map((t: any, i: number) => (
            <div
              key={i}
              className="flex flex-col p-6 bg-white dark:bg-slate-900 rounded shadow-md border border-gray-100 dark:border-slate-800"
            >
              <blockquote className="flex-auto">
                <p className="text-base text-gray-900 dark:text-slate-300">"{t.testimonial}"</p>
              </blockquote>
              <div className="flex items-center mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                {t.image && <img src={t.image.src} alt={t.name} className="h-10 w-10 rounded-full mr-3 object-cover" />}
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">{t.job}</div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CallToActionRenderer = (props: any) => {
  const { title, subtitle, tagline, actions } = props;
  return (
    <section className="relative not-prose py-16 md:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="py-12 md:py-20 rounded-lg shadow-xl dark:shadow-none bg-blue-600 dark:bg-slate-900 text-center p-8">
          <h2
            className="text-3xl md:text-4xl font-bold leading-tighter tracking-tighter mb-4 font-heading text-white"
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <p className="text-xl text-blue-100 dark:text-slate-400" dangerouslySetInnerHTML={{ __html: subtitle }} />

          {actions && (
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              {actions.map((action: any, i: number) => (
                <a
                  key={i}
                  href={action.href}
                  className="btn bg-white text-blue-600 hover:bg-gray-100 dark:bg-slate-700 dark:text-white px-6 py-3 rounded font-bold"
                >
                  {action.text}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ContactRenderer = (props: any) => {
  const { title, subtitle, tagline, inputs, textarea, button, disclaimer } = props;
  return (
    <section className="relative not-prose py-16 md:py-20 lg:py-24 max-w-7xl mx-auto px-4">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div className="max-w-xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-lg shadow-md border dark:border-slate-800">
        <form className="space-y-4">
          {inputs &&
            inputs.map((input: any, i: number) => (
              <div key={i}>
                <label className="block text-sm font-medium mb-1">{input.label}</label>
                <input
                  type={input.type || 'text'}
                  className="w-full px-4 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={input.label}
                  disabled
                />
              </div>
            ))}
          {textarea && (
            <div>
              <label className="block text-sm font-medium mb-1">{textarea.label}</label>
              <textarea
                rows={4}
                className="w-full px-4 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500"
                placeholder={textarea.label}
                disabled
              ></textarea>
            </div>
          )}
          {disclaimer && (
            <div className="mt-3 text-xs text-gray-500 dark:text-slate-400 text-center">{disclaimer.label}</div>
          )}
          <div className="mt-6">
            <button
              className="w-full btn btn-primary py-2 px-4 rounded bg-blue-600 text-white hover:bg-blue-700"
              disabled
            >
              {button}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

// --- Utility & Misc Renderers ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnnouncementRenderer = (props: any) => {
  const { title, badge, link } = props;
  return (
    <div className="text-muted text-sm bg-blue-50 dark:bg-slate-800 dark:border-b dark:border-slate-700 dark:text-slate-400 py-2 px-3 relative overflow-hidden whitespace-nowrap text-ellipsis">
      <span className="text-xs font-semibold px-1 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-2">
        {badge}
      </span>
      <a href={link} className="hover:underline">
        {title}
      </a>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NoteRenderer = (props: any) => {
  const { title } = props;
  return (
    <section className="bg-blue-50 dark:bg-slate-800 not-prose">
      <div
        className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-md text-center font-medium"
        dangerouslySetInnerHTML={{ __html: title }}
      />
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DividerRenderer = (props: any) => {
  return <hr className="my-8 border-gray-200 dark:border-slate-700" />;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpacerRenderer = (props: any) => {
  const { height = '4rem' } = props;
  return <div style={{ height }}></div>;
};

// --- Content Components ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FAQsRenderer = (props: any) => {
  const { title, subtitle, tagline, items, columns = 1 } = props;

  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-7xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div
        className={cn(
          'grid gap-8 dark:text-white sm:grid-cols-1 md:grid-cols-2',
          columns === 1 ? 'md:grid-cols-1 max-w-4xl mx-auto' : ''
        )}
      >
        {items &&
          items.map((item: any, i: number) => (
            <div key={i} className="mb-4">
              <h3 className="mb-2 text-lg font-bold">
                <span className="text-blue-600 dark:text-blue-400 mr-2">Q:</span>
                {item.title}
              </h3>
              <div className="text-muted dark:text-slate-400">{item.description}</div>
            </div>
          ))}
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GalleryRenderer = (props: any) => {
  const { title, subtitle, tagline, images, columns = 3 } = props;
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-7xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div
        className={cn(
          'grid gap-4',
          columns === 2 ? 'grid-cols-2' : '',
          columns === 3 ? 'grid-cols-3' : '',
          columns >= 4 ? 'grid-cols-4' : 'grid-cols-3'
        )}
      >
        {images &&
          images.map((img: any, i: number) => (
            <img
              key={i}
              src={img.src}
              alt={img.alt}
              className="w-full h-auto rounded shadow-lg object-cover hover:scale-[1.02] transition-transform"
            />
          ))}
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ImageSliderRenderer = (props: any) => {
  const { title, subtitle, tagline, images, autoplay } = props;
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-6xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div className="relative aspect-video bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg group">
        {images && images.length > 0 ? (
          <>
            <img src={images[0].src} alt={images[0].alt} className="w-full h-full object-cover" />
            {images.length > 1 && (
              <>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4">
                  <div className="p-2 bg-black/30 rounded-full text-white">
                    <TablerIcons.IconChevronLeft size={24} />
                  </div>
                  <div className="p-2 bg-black/30 rounded-full text-white">
                    <TablerIcons.IconChevronRight size={24} />
                  </div>
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_: any, i: number) => (
                    <div key={i} className={cn('w-2 h-2 rounded-full', i === 0 ? 'bg-white' : 'bg-white/50')} />
                  ))}
                </div>
              </>
            )}
            {autoplay && (
              <div className="absolute top-4 right-4 text-xs bg-black/50 text-white px-2 py-1 rounded">Autoplay On</div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">No Images Selected</div>
        )}
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TeamRenderer = (props: any) => {
  const { title, subtitle, tagline, members } = props;
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-7xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {members &&
          members.map((member: any, i: number) => (
            <div key={i} className="text-center">
              <img
                src={member.image}
                alt={member.name}
                className="mx-auto rounded-full w-32 h-32 object-cover mb-4 shadow-lg border-4 border-white dark:border-slate-800"
              />
              <h3 className="text-xl font-bold dark:text-white">{member.name}</h3>
              <p className="text-blue-600 dark:text-blue-400 mb-2">{member.role}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">{member.bio}</p>
            </div>
          ))}
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VideoRenderer = (props: any) => {
  const { title, subtitle, tagline, videoUrl } = props;
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-4xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-black">
        <iframe src={videoUrl} className="absolute inset-0 w-full h-full" allowFullScreen></iframe>
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const QuoteRenderer = (props: any) => {
  const { quote, author, role, image } = props;
  return (
    <section className="py-16 bg-blue-50 dark:bg-slate-800 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <blockquote className="text-2xl md:text-3xl font-serif italic text-gray-900 dark:text-white mb-8">
          "{quote}"
        </blockquote>
        <div className="flex items-center justify-center space-x-4">
          {image && <img src={image} alt={author} className="w-12 h-12 rounded-full" />}
          <div className="text-left">
            <div className="font-bold dark:text-white">{author}</div>
            <div className="text-sm text-gray-500 dark:text-slate-400">{role}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Mock Renderers for complex/server-side widgets ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BlogPostsRenderer = (props: any) => {
  const { title, count = 4, type } = props;
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-7xl mx-auto">
      <div className="mb-8 md:mx-auto md:mb-12 text-center max-w-3xl">
        <h2 className="text-4xl md:text-5xl font-bold leading-tighter tracking-tighter mb-4 font-heading">{title}</h2>
        <p className="text-xl text-muted">Astro Content Collection ({type})</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col bg-white dark:bg-slate-900 rounded-lg shadow-lg overflow-hidden border dark:border-slate-800 opacity-70"
          >
            <div className="h-48 bg-gray-200 dark:bg-slate-800 flex items-center justify-center text-gray-400">
              Post Image {i + 1}
            </div>
            <div className="p-4 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-slate-800 w-3/4 mb-3 rounded"></div>
              <div className="h-3 bg-gray-200 dark:bg-slate-800 mb-2 rounded"></div>
              <div className="h-3 bg-gray-200 dark:bg-slate-800 w-1/2 rounded"></div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center mt-8 text-xs text-gray-500">Note: Actual blog posts will appear in the built site.</p>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NewsletterRenderer = (props: any) => {
  const { title, subtitle, placeholder, buttonText } = props;
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 bg-blue-600 dark:bg-blue-900 text-white text-center">
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">{subtitle}</p>
      <div className="flex max-w-md mx-auto gap-2">
        <input type="email" placeholder={placeholder} className="flex-1 px-4 py-3 rounded text-gray-900" disabled />
        <button className="px-6 py-3 bg-white text-blue-600 font-bold rounded" disabled>
          {buttonText}
        </button>
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CountdownRenderer = (props: any) => {
  const { title, subtitle, targetDate } = props;
  return (
    <section className="relative not-prose px-4 py-16 text-center">
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <p className="text-xl text-muted mb-8">{subtitle}</p>
      <div className="flex justify-center gap-6">
        {['Days', 'Hours', 'Minutes', 'Seconds'].map((label) => (
          <div key={label} className="text-center">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">00</div>
            <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-400">Target: {new Date(targetDate).toLocaleDateString()}</p>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EffectsWidgetRenderer = (props: any) => {
  const { title, subtitle, items } = props;

  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-7xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {items?.map((item: any, idx: number) => (
          <EffectItem key={idx} item={item} />
        ))}
      </div>
    </section>
  );
};

const EffectItem = ({ item }: { item: any }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (isHovered && ref.current) {
      // Re-trigger animation on hover for demo purposes
      if (item.engine === 'gsap') {
        playGSAPAnimation(ref.current, item.animation, { duration: 1 });
      } else if (item.engine === 'anime') {
        playAnimeAnimation(ref.current, item.animation, { duration: 1000 });
      }
    }
  }, [isHovered, item]);

  return (
    <div
      className="p-6 bg-white dark:bg-slate-900 shadow-lg rounded-xl flex flex-col items-center justify-center min-h-[200px] cursor-pointer border border-transparent hover:border-blue-500 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div ref={ref} className="text-4xl mb-4 bg-blue-100 dark:bg-blue-900 p-4 rounded-full">
        ✨
      </div>
      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Engine:{' '}
        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{item.engine}</span>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Effect:{' '}
        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{item.animation}</span>
      </div>
      <p className="mt-4 text-xs text-center text-gray-400">Hover to replay</p>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TableOfContentsRenderer = (props: any) => {
  const { headings } = props;
  return (
    <nav className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg my-8 max-w-md">
      <h3 className="font-bold mb-3 uppercase text-xs text-gray-500">Table of contents</h3>
      <ul className="space-y-2 text-sm">
        {headings &&
          headings.map((h: any, i: number) => (
            <li
              key={i}
              className="pl-2 border-l-2 border-transparent hover:border-blue-500 hover:text-blue-600 cursor-pointer"
            >
              {h.text}
            </li>
          ))}
      </ul>
    </nav>
  );
};

// --- New Widget Renderers ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BannerRenderer = (props: any) => {
  const { title, subtitle, image, actions, variant = 'default' } = props;
  const bgClass =
    variant === 'gradient'
      ? 'bg-gradient-to-r from-blue-600 to-purple-600'
      : variant === 'dark'
        ? 'bg-slate-900'
        : 'bg-blue-600';
  return (
    <section className={cn('relative not-prose py-20 text-white', bgClass)}>
      {image && (
        <div className="absolute inset-0 z-0">
          <img src={image.src} alt={image.alt} className="w-full h-full object-cover opacity-30" />
        </div>
      )}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">{title}</h2>
        <p className="text-xl text-white/80 mb-8">{subtitle}</p>
        {actions && (
          <div className="flex flex-wrap gap-4 justify-center">
            {actions.map((action: any, i: number) => (
              <a
                key={i}
                href={action.href}
                className="btn bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100"
              >
                {action.text}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AccordionRenderer = (props: any) => {
  const { title, subtitle, tagline, items } = props;
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-4xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div className="space-y-4">
        {items &&
          items.map((item: any, i: number) => (
            <div key={i} className="border border-gray-200 dark:border-slate-700 rounded-lg">
              <button className="w-full px-6 py-4 text-left font-semibold flex justify-between items-center">
                {item.title}
                <span className="text-gray-400">+</span>
              </button>
              <div className="px-6 pb-4 text-gray-600 dark:text-slate-400">{item.description}</div>
            </div>
          ))}
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TimelineRenderer = (props: any) => {
  const { title, subtitle, tagline, items } = props;
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-4xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div className="relative">
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-blue-200 dark:bg-slate-700"></div>
        {items &&
          items.map((item: any, i: number) => (
            <div key={i} className={cn('relative flex items-start mb-8', i % 2 === 0 ? 'md:flex-row-reverse' : '')}>
              <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-blue-600 rounded-full transform -translate-x-1/2"></div>
              <div
                className={cn(
                  'ml-12 md:ml-0 md:w-1/2 p-4 bg-white dark:bg-slate-900 rounded-lg shadow',
                  i % 2 === 0 ? 'md:mr-8' : 'md:ml-8'
                )}
              >
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">{item.date}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-slate-400">{item.description}</p>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CardsRenderer = (props: any) => {
  const { title, subtitle, tagline, cards, columns = 3 } = props;
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-7xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div className={cn('grid gap-6', `grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns}`)}>
        {cards &&
          cards.map((card: any, i: number) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {card.image && <img src={card.image.src} alt={card.image.alt} className="w-full h-48 object-cover" />}
              <div className="p-6">
                <h3 className="font-bold text-xl mb-2">{card.title}</h3>
                <p className="text-gray-600 dark:text-slate-400 mb-4">{card.description}</p>
                {card.link && (
                  <a href={card.link.href} className="text-blue-600 hover:underline">
                    {card.link.text} →
                  </a>
                )}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LogoCloudRenderer = (props: any) => {
  const { title, subtitle, logos } = props;
  return (
    <section className="relative not-prose py-12 bg-gray-50 dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        {title && <h3 className="text-center text-lg text-gray-500 mb-8">{title}</h3>}
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {logos &&
            logos.map((logo: any, i: number) => (
              <img
                key={i}
                src={logo.src}
                alt={logo.alt}
                className="h-8 md:h-10 w-auto grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition"
              />
            ))}
        </div>
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ComparisonRenderer = (props: any) => {
  const { title, subtitle, tagline, plans } = props;
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-6xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-slate-800">
              <th className="p-4 text-left">Feature</th>
              {plans &&
                plans.map((plan: any, i: number) => (
                  <th key={i} className="p-4 text-center font-bold">
                    {plan.name}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {plans &&
              plans[0]?.features?.map((feature: any, fi: number) => (
                <tr key={fi} className="border-b dark:border-slate-700">
                  <td className="p-4">{feature.name}</td>
                  {plans.map((plan: any, pi: number) => (
                    <td key={pi} className="p-4 text-center">
                      {plan.features[fi]?.included ? '✓' : '−'}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SocialLinksRenderer = (props: any) => {
  const { title, links } = props;

  return (
    <section className="relative not-prose py-12">
      <div className="max-w-xl mx-auto text-center">
        {title && <h3 className="text-xl font-bold mb-6">{title}</h3>}

        <div className="flex justify-center gap-4">
          {links?.map((link: any, i: number) => {
            let IconComponent: any | null = null;

            if (typeof link.icon === 'string' && link.icon.startsWith('tabler:')) {
              const iconName = link.icon.replace('tabler:', '');
              const componentName = tablerNameToComponent(iconName);
              IconComponent = (TablerIcons as unknown as any)[componentName] || null;
            }

            return (
              <a
                key={i}
                href={link.href}
                title={link.label}
                className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-full
                           flex items-center justify-center
                           hover:bg-blue-100 dark:hover:bg-blue-900 transition"
              >
                {IconComponent ? (
                  <IconComponent size={20} stroke={1.8} />
                ) : (
                  <span className="text-lg">{link.label?.charAt(0)}</span>
                )}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MapRenderer = (props: any) => {
  const { title, address, embedUrl, height = '400px' } = props;
  return (
    <section className="relative not-prose">
      <div className="max-w-7xl mx-auto">
        {title && <h3 className="text-2xl font-bold text-center py-8">{title}</h3>}
        {address && <p className="text-center text-gray-600 dark:text-slate-400 mb-4">{address}</p>}
        <div className="bg-gray-200 dark:bg-slate-800 flex items-center justify-center" style={{ height }}>
          {embedUrl ? (
            <iframe src={embedUrl} className="w-full h-full border-0" allowFullScreen loading="lazy"></iframe>
          ) : (
            <span className="text-gray-500">Map Preview - Add embedUrl to display</span>
          )}
        </div>
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AlertRenderer = (props: any) => {
  const { title, message, type = 'info', dismissible } = props;
  const colors = {
    info: 'bg-blue-50 border-blue-500 text-blue-700',
    success: 'bg-green-50 border-green-500 text-green-700',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-700',
    error: 'bg-red-50 border-red-500 text-red-700',
  };
  return (
    <div className={cn('border-l-4 p-4 my-4', colors[type as keyof typeof colors] || colors.info)}>
      <div className="flex justify-between">
        <div>
          {title && <p className="font-bold mb-1">{title}</p>}
          <p>{message}</p>
        </div>
        {dismissible && <button className="text-xl font-bold opacity-50 hover:opacity-100">×</button>}
      </div>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FeatureListRenderer = (props: any) => {
  const { title, subtitle, tagline, features, columns = 2 } = props;
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-6xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div className={cn('grid gap-6', `grid-cols-1 md:grid-cols-${columns}`)}>
        {features &&
          features.map((feature: any, i: number) => (
            <div key={i} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600">
                ✓
              </div>
              <div>
                <h4 className="font-semibold mb-1">{feature.title}</h4>
                <p className="text-gray-600 dark:text-slate-400 text-sm">{feature.description}</p>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProductShowcaseRenderer = (props: any) => {
  const { title, subtitle, tagline, products } = props;
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-7xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {products &&
          products.map((product: any, i: number) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition"
            >
              {product.image && (
                <img
                  src={product.image.src}
                  alt={product.image.alt}
                  className="w-32 h-32 mx-auto mb-4 object-contain"
                />
              )}
              <h3 className="font-bold text-lg mb-2">{product.name}</h3>
              <p className="text-gray-600 dark:text-slate-400 text-sm mb-4">{product.description}</p>
              {product.price && <p className="text-2xl font-bold text-blue-600">{product.price}</p>}
              {product.callToAction && (
                <a href={product.callToAction.href} className="mt-4 inline-block btn btn-primary px-6 py-2 rounded">
                  {product.callToAction.text}
                </a>
              )}
            </div>
          ))}
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AwardsRenderer = (props: any) => {
  const { title, subtitle, tagline, awards } = props;
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-6xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {awards &&
          awards.map((award: any, i: number) => (
            <div
              key={i}
              className="text-center p-6 bg-gradient-to-b from-yellow-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center text-3xl">
                🏆
              </div>
              <h4 className="font-bold mb-1">{award.title}</h4>
              <p className="text-sm text-gray-500">{award.organization}</p>
              <p className="text-xs text-gray-400 mt-1">{award.year}</p>
            </div>
          ))}
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PartnersRenderer = (props: any) => {
  const { title, subtitle, tagline, partners } = props;
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-7xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {partners &&
          partners.map((partner: any, i: number) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg shadow">
              {partner.logo && (
                <img src={partner.logo.src} alt={partner.logo.alt} className="w-16 h-16 object-contain" />
              )}
              <div>
                <h4 className="font-bold">{partner.name}</h4>
                <p className="text-sm text-gray-500 dark:text-slate-400">{partner.description}</p>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DownloadsRenderer = (props: any) => {
  const { title, subtitle, tagline, files } = props;
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-4xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div className="space-y-4">
        {files &&
          files.map((file: any, i: number) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-lg shadow border dark:border-slate-700"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center text-blue-600">
                  📄
                </div>
                <div>
                  <h4 className="font-semibold">{file.name}</h4>
                  <p className="text-sm text-gray-500">
                    {file.size} • {file.format}
                  </p>
                </div>
              </div>
              <a href={file.url} className="btn bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Download
              </a>
            </div>
          ))}
      </div>
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EventsRenderer = (props: any) => {
  const { title, subtitle, tagline, events } = props;
  return (
    <section className="relative not-prose px-4 py-16 md:py-20 lg:py-24 max-w-6xl mx-auto">
      <WidgetHeader title={title} subtitle={subtitle} tagline={tagline} />
      <div className="space-y-6">
        {events &&
          events.map((event: any, i: number) => (
            <div key={i} className="flex gap-6 p-6 bg-white dark:bg-slate-900 rounded-xl shadow-lg">
              <div className="flex-shrink-0 w-20 text-center">
                <div className="text-3xl font-bold text-blue-600">{new Date(event.date).getDate()}</div>
                <div className="text-sm text-gray-500 uppercase">
                  {new Date(event.date).toLocaleString('default', { month: 'short' })}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-2">{event.title}</h3>
                <p className="text-gray-600 dark:text-slate-400 mb-2">{event.description}</p>
                <div className="flex gap-4 text-sm text-gray-500">
                  {event.location && <span>📍 {event.location}</span>}
                  {event.time && <span>🕐 {event.time}</span>}
                </div>
              </div>
              {event.link && (
                <a href={event.link.href} className="self-center btn bg-blue-600 text-white px-4 py-2 rounded">
                  {event.link.text || 'Register'}
                </a>
              )}
            </div>
          ))}
      </div>
    </section>
  );
};

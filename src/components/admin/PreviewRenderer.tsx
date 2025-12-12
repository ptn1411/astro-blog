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

import type { WidgetType } from '~/components/admin/registry';

interface BuilderBlock {
  id: string;
  type: WidgetType;
  props: Record<string, any>;
}

// Map widget types to their import paths
const IMPORTS: Record<WidgetType, string> = {
  Hero: '~/components/widgets/Hero.astro',
  Hero2: '~/components/widgets/Hero2.astro',
  HeroText: '~/components/widgets/HeroText.astro',
  Features: '~/components/widgets/Features.astro',
  Features2: '~/components/widgets/Features2.astro',
  Features3: '~/components/widgets/Features3.astro',
  Content: '~/components/widgets/Content.astro',
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
};

export type ElementMetadata = {
  title?: string;
  description?: string;
};

export function toJSON(blocks: BuilderBlock[], metadata?: ElementMetadata): string {
  return JSON.stringify({ metadata, blocks }, null, 2);
}

export function toMDX(blocks: BuilderBlock[], metadata?: ElementMetadata): string {
  const usedTypes = new Set(blocks.map((b) => b.type));

  let mdx = `---
title: '${metadata?.title || 'Generated Page'}'
${
  metadata?.description
    ? `metadata:
  description: '${metadata.description}'`
    : ''
}
---\n\n`;

  // Add imports
  usedTypes.forEach((type) => {
    if (IMPORTS[type]) {
      mdx += `import ${type} from '${IMPORTS[type]}';\n`;
    }
  });

  mdx += '\n';

  // Add components
  blocks.forEach((block) => {
    const propsStrings = Object.entries(block.props)
      .map(([key, value]) => {
        if (value === undefined || value === null || value === '') return '';

        if (typeof value === 'string') {
          // Simple strings can be quoted, but if they contain newlines or special chars, maybe use expressions?
          // optimizing for simple strings for now
          return `${key}="${value.replace(/"/g, '&quot;')}"`;
        }

        if (typeof value === 'boolean') {
          return value ? key : `${key}={false}`;
        }

        // Arrays and objects need to be JSON stringified inside curly braces
        return `${key}={${JSON.stringify(value)}}`;
      })
      .filter(Boolean)
      .join(' ');

    mdx += `<${block.type} ${propsStrings} />\n\n`;
  });

  return mdx;
}

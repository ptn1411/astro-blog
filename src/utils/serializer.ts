import type { WidgetType } from '~/components/admin/builder/registry';

interface BuilderBlock {
  id: string;
  type: WidgetType;
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
};

export type ElementMetadata = {
  title?: string;
  description?: string;
};

export function toJSON(blocks: BuilderBlock[], metadata?: ElementMetadata): string {
  return JSON.stringify({ metadata, blocks }, null, 2);
}

/**
 * Convert blocks to MDX with embedded builder data for re-editing
 */
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

import { SITE } from 'astrowind:config';

import { getBlogPermalink, getCanonical, getPermalink } from './permalinks';

import type { Post } from '~/types';

const DEFAULT_LANGUAGE = 'vi';

const toAbsoluteUrl = (value: string | URL | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  try {
    const base = SITE.site || 'https://example.com';
    if (value instanceof URL) {
      return value.toString();
    }
    return new URL(String(value), base).toString();
  } catch {
    return undefined;
  }
};

export const PROFILE = {
  name: 'Phạm Thành Nam',
  jobTitle: 'Lập trình viên Fullstack & Maker',
  description:
    'Phát triển web fullstack, kiến trúc hệ thống và tạo ra những công cụ sáng tạo giúp ý tưởng trở thành sản phẩm.',
  image: 'https://avatars.githubusercontent.com/u/57529765?v=4',
  email: 'mailto:phamnam.dev@gmail.com',
  location: {
    '@type': 'Country',
    name: 'Vietnam',
  },
  sameAs: [
    'https://github.com/ptndz',
    'https://www.linkedin.com/in/ptn1411',
    'https://t.me/Ptn1411',
    'https://ptndz.dev',
  ],
} as const;

export const buildPersonSchema = (url: string, overrides: Record<string, unknown> = {}) => {
  const schema: Record<string, unknown> = {
    '@type': 'Person',
    name: PROFILE.name,
    jobTitle: PROFILE.jobTitle,
    url: toAbsoluteUrl(url),
    description: PROFILE.description,
    image: PROFILE.image,
    sameAs: PROFILE.sameAs,
    email: PROFILE.email,
    nationality: PROFILE.location,
  };

  return {
    ...schema,
    ...overrides,
  };
};

export const buildProfessionalServiceSchema = ({
  url,
  serviceTypes,
  description,
  name,
  areaServed = 'Global',
}: {
  url: string;
  serviceTypes: string[];
  description?: string;
  name?: string;
  areaServed?: string;
}) => {
  const schema: Record<string, unknown> = {
    '@type': 'ProfessionalService',
    name: name || `${PROFILE.name} Studio`,
    url: toAbsoluteUrl(url),
    description: description || PROFILE.description,
    serviceType: serviceTypes,
    areaServed,
    provider: {
      '@type': 'Person',
      name: PROFILE.name,
    },
    inLanguage: DEFAULT_LANGUAGE,
  };

  if (PROFILE.sameAs.length) {
    schema.sameAs = PROFILE.sameAs;
  }

  return schema;
};

export const buildContactPageSchema = ({
  url,
  email,
  telephone,
  description,
  contactType = 'customer service',
}: {
  url: string;
  email?: string;
  telephone?: string;
  description?: string;
  contactType?: string;
}) => {
  const contactPoint: Record<string, unknown> = {
    '@type': 'ContactPoint',
    contactType,
    availableLanguage: [DEFAULT_LANGUAGE, 'en'],
  };

  if (email) {
    contactPoint.email = email;
  }
  if (telephone) {
    contactPoint.telephone = telephone;
  }

  return {
    '@type': 'ContactPage',
    url: toAbsoluteUrl(url),
    name: `Liên hệ ${PROFILE.name}`,
    description: description || PROFILE.description,
    contactPoint: [contactPoint],
    sameAs: PROFILE.sameAs,
  };
};

export const buildBreadcrumbList = (items: Array<{ name: string; url: string | URL }>) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: toAbsoluteUrl(item.url),
  })),
});

export const buildBlogPostingSchema = ({
  url,
  title,
  description,
  image,
  datePublished,
  dateModified,
  tags,
  category,
  authorName,
  readingTimeMinutes,
}: {
  url: string | URL;
  title: string;
  description?: string;
  image?: string;
  datePublished: Date;
  dateModified?: Date;
  tags?: string[];
  category?: string;
  authorName?: string;
  readingTimeMinutes?: number;
}) => {
  const schema: Record<string, unknown> = {
    '@type': 'BlogPosting',
    headline: title,
    name: title,
    description,
    url: toAbsoluteUrl(url),
    mainEntityOfPage: toAbsoluteUrl(url),
    datePublished: datePublished.toISOString(),
    dateModified: (dateModified ?? datePublished).toISOString(),
    author: {
      '@type': 'Person',
      name: authorName || PROFILE.name,
    },
    publisher: {
      '@type': 'Person',
      name: PROFILE.name,
    },
    inLanguage: DEFAULT_LANGUAGE,
  };

  if (image) {
    schema.image = [toAbsoluteUrl(image)];
  }

  if (tags?.length) {
    schema.keywords = tags.join(', ');
  }

  if (category) {
    schema.articleSection = category;
  }

  if (readingTimeMinutes) {
    schema.timeRequired = `PT${Math.ceil(readingTimeMinutes)}M`;
  }

  return schema;
};

export const buildBlogListingSchema = ({
  url,
  name,
  description,
  posts,
  taxonomy,
  currentPage,
  totalPages,
  startIndex = 0,
}: {
  url: string;
  name: string;
  description?: string;
  posts: Array<Pick<Post, 'title' | 'permalink' | 'publishDate'>>;
  taxonomy?: { type: 'category' | 'tag'; name: string };
  currentPage?: number;
  totalPages?: number;
  startIndex?: number;
}) => {
  const baseUrl = toAbsoluteUrl(getBlogPermalink());
  const absoluteUrl = toAbsoluteUrl(url);
  const pageLabel =
    currentPage && currentPage > 1 ? `${name} - Trang ${currentPage}` : name;
  const offset = Number.isFinite(startIndex) ? Number(startIndex) : 0;

  const schema: Record<string, unknown> = {
    '@type': 'CollectionPage',
    name: pageLabel,
    description,
    url: absoluteUrl,
    mainEntityOfPage: absoluteUrl,
    inLanguage: DEFAULT_LANGUAGE,
    isPartOf: {
      '@type': 'Blog',
      name: SITE.name,
      url: baseUrl,
      inLanguage: DEFAULT_LANGUAGE,
    },
    hasPart: posts.map((post, index) => {
      const permalink = getPermalink(post.permalink, 'post');
      const absolutePermalink = toAbsoluteUrl(permalink) ?? String(getCanonical(permalink));

      return {
        '@type': 'BlogPosting',
        name: post.title,
        url: absolutePermalink,
        datePublished: post.publishDate?.toISOString?.(),
        position: offset + index + 1,
      };
    }),
  };

  if (taxonomy) {
    schema.about = {
      '@type': taxonomy.type === 'category' ? 'Thing' : 'DefinedTerm',
      name: taxonomy.name,
    };
  }

  if (currentPage && currentPage > 1) {
    schema.pagination = totalPages
      ? `Trang ${currentPage} / ${totalPages}`
      : `Trang ${currentPage}`;
  }

  if (typeof totalPages === 'number') {
    schema.numberOfItems = posts.length;
  }

  return schema;
};

export const ensureAbsolute = (path: string) => String(getCanonical(path));

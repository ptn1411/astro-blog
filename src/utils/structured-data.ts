import { SITE, STRUCTURED_DATA } from 'astrowind:config';

import { getBlogPermalink, getCanonical, getPermalink } from './permalinks';

import type { Post } from '~/types';

const DEFAULT_LANGUAGE = STRUCTURED_DATA.defaultLanguage || 'vi';

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
  name: STRUCTURED_DATA.profile?.name || 'Your Name',
  jobTitle: STRUCTURED_DATA.profile?.jobTitle || 'Your Job Title',
  description: STRUCTURED_DATA.profile?.description || 'Your description',
  image: STRUCTURED_DATA.profile?.image || '',
  email: STRUCTURED_DATA.profile?.email || 'mailto:contact@example.com',
  location: {
    '@type': STRUCTURED_DATA.profile?.location?.type || 'Country',
    name: STRUCTURED_DATA.profile?.location?.name || 'Vietnam',
  },
  sameAs: STRUCTURED_DATA.profile?.sameAs || [],
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
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: name || `${PROFILE.name} Studio`,
    url: toAbsoluteUrl(url),
    description: description || PROFILE.description,
    serviceType: serviceTypes,
    areaServed: {
      '@type': 'Country',
      name: areaServed || 'Vietnam',
    },
    provider: {
      '@type': 'Person',
      name: PROFILE.name,
      jobTitle: PROFILE.jobTitle,
      url: toAbsoluteUrl(SITE.site),
      image: PROFILE.image,
      sameAs: PROFILE.sameAs,
    },
    inLanguage: DEFAULT_LANGUAGE,

    // ✅ Bổ sung thông tin liên hệ & thương hiệu
    image: STRUCTURED_DATA.business?.image || 'https://bug.edu.vn/cover.jpg',
    logo: STRUCTURED_DATA.business?.logo || 'https://bug.edu.vn/logo.png',
    telephone: STRUCTURED_DATA.business?.telephone || '+84-346-038-772',
    email: PROFILE.email,
    priceRange: STRUCTURED_DATA.business?.priceRange || '$$',
    openingHours: STRUCTURED_DATA.business?.openingHours || 'Mo-Fr 09:00-18:00',

    // ✅ Địa chỉ chi tiết
    address: {
      '@type': 'PostalAddress',
      streetAddress: STRUCTURED_DATA.business?.address?.streetAddress || 'Hà Nội, Việt Nam',
      addressLocality: STRUCTURED_DATA.business?.address?.addressLocality || 'Hà Nội',
      addressRegion: STRUCTURED_DATA.business?.address?.addressRegion || 'Hà Nội',
      postalCode: STRUCTURED_DATA.business?.address?.postalCode || '100000',
      addressCountry: STRUCTURED_DATA.business?.address?.addressCountry || 'VN',
    },

    // ✅ Thêm ContactPoint cho hỗ trợ khách hàng
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: STRUCTURED_DATA.business?.contactPoint?.contactType || 'Customer Support',
      telephone: STRUCTURED_DATA.business?.contactPoint?.telephone || '+84-345-038-772',
      email: STRUCTURED_DATA.business?.contactPoint?.email || 'contact@bug.edu.vn',
      availableLanguage: STRUCTURED_DATA.business?.contactPoint?.availableLanguage || ['Vietnamese', 'English'],
    },

    // ✅ Thêm AggregateRating (tùy chọn, giúp SEO mạnh hơn)
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: STRUCTURED_DATA.business?.aggregateRating?.ratingValue || '5',
      reviewCount: STRUCTURED_DATA.business?.aggregateRating?.reviewCount || '26',
    },
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
      url: toAbsoluteUrl(SITE.site),
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
  const pageLabel = currentPage && currentPage > 1 ? `${name} - Trang ${currentPage}` : name;
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
    schema.pagination = totalPages ? `Trang ${currentPage} / ${totalPages}` : `Trang ${currentPage}`;
  }

  if (typeof totalPages === 'number') {
    schema.numberOfItems = posts.length;
  }

  return schema;
};

export const ensureAbsolute = (path: string) => String(getCanonical(path));

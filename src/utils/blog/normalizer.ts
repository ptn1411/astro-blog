import type { CollectionEntry } from 'astro:content';
import { render } from 'astro:content';
import type { Post } from '~/types';
import { cleanSlug } from '../permalinks';
import { generatePermalink } from './permalink';

export const getNormalizedPost = async (post: CollectionEntry<'post'>): Promise<Post> => {
  const { id, data } = post;
  const { Content, remarkPluginFrontmatter } = await render(post);

  const {
    publishDate: rawPublishDate = new Date(),
    updateDate: rawUpdateDate,
    title,
    excerpt,
    image,
    tags: rawTags = [],
    category: rawCategory,
    author,
    draft = false,
    metadata = {},
    series: rawSeries,
  } = data;

  const slug = cleanSlug(id);
  const publishDate = new Date(rawPublishDate);
  const updateDate = rawUpdateDate ? new Date(rawUpdateDate) : undefined;

  const category = rawCategory
    ? {
        slug: cleanSlug(rawCategory),
        title: rawCategory,
      }
    : undefined;

  const tags = rawTags.map((tag: string) => ({
    slug: cleanSlug(tag),
    title: tag,
  }));

  const seriesId = rawSeries?.id ? cleanSlug(rawSeries.id) : undefined;
  const series =
    rawSeries && (seriesId || rawSeries.title || rawSeries.part || rawSeries.totalParts)
      ? {
          id: seriesId,
          title: rawSeries.title || rawSeries.id,
          part: rawSeries.part,
          totalParts: rawSeries.totalParts,
        }
      : undefined;

  return {
    id: id,
    slug: slug,
    permalink: await generatePermalink({ id, slug, publishDate, category: category?.slug }),
    publishDate: publishDate,
    updateDate: updateDate,
    title: title || 'Untitled',
    excerpt: excerpt,
    image: image,
    category: category,
    tags: tags,
    author: author,
    series,
    draft: draft,
    metadata,
    Content: Content,
    readingTime: remarkPluginFrontmatter?.readingTime,
    headings: remarkPluginFrontmatter?.headings,
  };
};

export const getNormalizedSanityPost = async (sanityDoc: any): Promise<Post> => {
  const {
    _id,
    slug,
    title,
    excerpt,
    image,
    publishDate,
    updateDate,
    category,
    tags = [],
    author,
    series,
    metadata = {},
    body,
  } = sanityDoc;

  const pDate = new Date(publishDate || Date.now());
  const uDate = updateDate ? new Date(updateDate) : undefined;

  let imageUrl: string | undefined = undefined;
  if (image?.asset?._ref) {
    const { urlForImage } = await import('~/utils/sanity/image');
    imageUrl = urlForImage(image).auto('format').width(900).url();
  }

  return {
    id: _id,
    slug: slug,
    permalink: await generatePermalink({ id: _id, slug, publishDate: pDate, category: category?.slug }),
    publishDate: pDate,
    updateDate: uDate,
    title: title || 'Untitled',
    excerpt: excerpt,
    image: imageUrl,
    category: category,
    tags: tags,
    author: author,
    series: series,
    draft: false,
    metadata: metadata,
    body: body,
    readingTime: 5,
  } as Post;
};


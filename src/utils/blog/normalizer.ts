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

import type { Post, Taxonomy } from '~/types';
import { fetchPosts } from './index';

const sortTaxonomies = (items: Iterable<Taxonomy>) =>
  Array.from(items).sort((a, b) => a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' }));

export const findCategories = async (): Promise<Array<Taxonomy>> => {
  const posts = await fetchPosts();
  const map = new Map<string, Taxonomy>();

  posts.forEach((post) => {
    if (post.category?.slug) {
      const { slug, title } = post.category;
      if (!map.has(slug)) {
        map.set(slug, { slug, title });
      }
    }
  });

  return sortTaxonomies(map.values());
};

export const findTags = async (): Promise<Array<Taxonomy>> => {
  const posts = await fetchPosts();
  const map = new Map<string, Taxonomy>();

  posts.forEach((post) => {
    if (Array.isArray(post.tags)) {
      post.tags.forEach((tag) => {
        if (tag?.slug && !map.has(tag.slug)) {
          map.set(tag.slug, { slug: tag.slug, title: tag.title });
        }
      });
    }
  });

  return sortTaxonomies(map.values());
};

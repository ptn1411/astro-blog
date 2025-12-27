import type { PaginateFunction } from 'astro';
import { getCollection } from 'astro:content';
import type { Post, Taxonomy } from '~/types';
import { BLOG_BASE, CATEGORY_BASE, cleanSlug, TAG_BASE } from '../permalinks';
import {
  blogPostsPerPage,
  isBlogCategoryRouteEnabled,
  isBlogEnabled,
  isBlogListRouteEnabled,
  isBlogPostRouteEnabled,
  isBlogTagRouteEnabled,
} from './config';
import { fetchPosts } from './index';

export const getStaticPathsBlogList = async ({ paginate }: { paginate: PaginateFunction }) => {
  if (!isBlogEnabled || !isBlogListRouteEnabled) return [];
  return paginate(await fetchPosts(), {
    params: { blog: BLOG_BASE || undefined },
    pageSize: blogPostsPerPage,
  });
};

export const getStaticPathsBlogPost = async () => {
  if (!isBlogEnabled || !isBlogPostRouteEnabled) return [];
  return (await fetchPosts()).flatMap((post) => ({
    params: {
      blog: post.permalink,
    },
    props: { post },
  }));
};

export const getStaticPathsBlogCategory = async ({ paginate }: { paginate: PaginateFunction }) => {
  if (!isBlogEnabled || !isBlogCategoryRouteEnabled) return [];

  const [posts, categoryEntries] = await Promise.all([fetchPosts(), getCollection('category')]);

  const categoryMeta = new Map<string, Taxonomy>();
  categoryEntries.forEach((entry) => {
    const slug = cleanSlug(entry.data.name);
    categoryMeta.set(slug, {
      slug,
      title: entry.data.name,
      description: entry.data.description,
    });
  });

  const postsByCategory = new Map<string, Post[]>();
  posts.forEach((post) => {
    const slug = post.category?.slug;
    if (!slug) return;
    if (!postsByCategory.has(slug)) {
      postsByCategory.set(slug, []);
    }
    postsByCategory.get(slug)?.push(post);
  });

  return Array.from(postsByCategory.entries()).flatMap(([categorySlug, categoryPosts]) =>
    paginate(categoryPosts, {
      params: { category: categorySlug, blog: CATEGORY_BASE || undefined },
      pageSize: blogPostsPerPage,
      props: {
        category: categoryMeta.get(categorySlug) ?? {
          slug: categorySlug,
          title: categoryPosts[0]?.category?.title ?? categorySlug,
        },
      },
    })
  );
};

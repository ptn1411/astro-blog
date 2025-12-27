import { getCollection } from 'astro:content';
import type { PaginateFunction } from 'astro';
import type { Post } from '~/types';
import { cleanSlug, TAG_BASE } from '../permalinks';
import { getNormalizedPost } from './normalizer';
import { compareSeriesPosts, matchesSeries } from './series';
import { blogPostsPerPage, isBlogEnabled, isBlogTagRouteEnabled } from './config';

// Re-export config
export {
  isBlogEnabled,
  isRelatedPostsEnabled,
  isBlogListRouteEnabled,
  isBlogPostRouteEnabled,
  isBlogCategoryRouteEnabled,
  isBlogTagRouteEnabled,
  blogListRobots,
  blogPostRobots,
  blogCategoryRobots,
  blogTagRobots,
  blogPostsPerPage,
} from './config';

// Re-export types
export type { AuthorWithStats } from './author';

// Re-export functions
export { findPostsByAuthor, findAuthorsWithStats } from './author';
export { findCategories, findTags } from './taxonomy';
export { getStaticPathsBlogList, getStaticPathsBlogPost, getStaticPathsBlogCategory } from './staticPaths';
export { getRelatedPosts } from './related';

let _posts: Array<Post>;

const load = async function (): Promise<Array<Post>> {
  const posts = await getCollection('post');
  const normalizedPosts = posts.map(async (post) => await getNormalizedPost(post));

  const results = (await Promise.all(normalizedPosts))
    .sort((a, b) => b.publishDate.valueOf() - a.publishDate.valueOf())
    .filter((post) => !post.draft);

  return results;
};

export const fetchPosts = async (): Promise<Array<Post>> => {
  if (!_posts) {
    _posts = await load();
  }
  return _posts;
};

export const findSeriesPosts = async (post: Post): Promise<Array<Post>> => {
  if (!post.series) return [];

  const posts = await fetchPosts();
  return posts.filter((p) => matchesSeries(p.series, post.series)).sort(compareSeriesPosts);
};

export const findPostsBySlugs = async (slugs: Array<string>): Promise<Array<Post>> => {
  if (!Array.isArray(slugs)) return [];

  const posts = await fetchPosts();

  return slugs.reduce(function (r: Array<Post>, slug: string) {
    posts.some(function (post: Post) {
      return slug === post.slug && r.push(post);
    });
    return r;
  }, []);
};

export const findPostsByIds = async (ids: Array<string>): Promise<Array<Post>> => {
  if (!Array.isArray(ids)) return [];

  const posts = await fetchPosts();

  return ids.reduce(function (r: Array<Post>, id: string) {
    posts.some(function (post: Post) {
      return id === post.id && r.push(post);
    });
    return r;
  }, []);
};

export const findLatestPosts = async ({ count }: { count?: number }): Promise<Array<Post>> => {
  const _count = count || 4;
  const posts = await fetchPosts();

  return posts ? posts.slice(0, _count) : [];
};

export const getStaticPathsBlogTag = async ({ paginate }: { paginate: PaginateFunction }) => {
  if (!isBlogEnabled || !isBlogTagRouteEnabled) return [];

  const [posts, tagEntries] = await Promise.all([fetchPosts(), getCollection('tag')]);

  const tagMeta = new Map<string, { slug: string; title: string; description?: string }>();
  tagEntries.forEach((entry) => {
    const slug = cleanSlug(entry.data.name);
    tagMeta.set(slug, {
      slug,
      title: entry.data.name,
      description: entry.data.description,
    });
  });

  const postsByTag = new Map<string, Post[]>();
  posts.forEach((post) => {
    if (!Array.isArray(post.tags)) return;
    post.tags.forEach((tag) => {
      if (!tag?.slug) return;
      if (!postsByTag.has(tag.slug)) {
        postsByTag.set(tag.slug, []);
      }
      postsByTag.get(tag.slug)?.push(post);
    });
  });

  return Array.from(postsByTag.entries()).flatMap(([tagSlug, tagPosts]) =>
    paginate(tagPosts, {
      params: { tag: tagSlug, blog: TAG_BASE || undefined },
      pageSize: blogPostsPerPage,
      props: {
        tag: tagMeta.get(tagSlug) ?? {
          slug: tagSlug,
          title: tagPosts[0]?.tags?.find((t) => t.slug === tagSlug)?.title ?? tagSlug,
        },
      },
    })
  );
};

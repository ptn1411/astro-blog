import type { PaginateFunction } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { getCollection, render } from 'astro:content';
import { APP_BLOG } from 'astrowind:config';
import type { Post, Taxonomy } from '~/types';
import { BLOG_BASE, CATEGORY_BASE, cleanSlug, POST_PERMALINK_PATTERN, TAG_BASE, trimSlash } from './permalinks';

const generatePermalink = async ({
  id,
  slug,
  publishDate,
  category,
}: {
  id: string;
  slug: string;
  publishDate: Date;
  category: string | undefined;
}) => {
  const year = String(publishDate.getFullYear()).padStart(4, '0');
  const month = String(publishDate.getMonth() + 1).padStart(2, '0');
  const day = String(publishDate.getDate()).padStart(2, '0');
  const hour = String(publishDate.getHours()).padStart(2, '0');
  const minute = String(publishDate.getMinutes()).padStart(2, '0');
  const second = String(publishDate.getSeconds()).padStart(2, '0');

  const permalink = POST_PERMALINK_PATTERN.replace('%slug%', slug)
    .replace('%id%', id)
    .replace('%category%', category || '')
    .replace('%year%', year)
    .replace('%month%', month)
    .replace('%day%', day)
    .replace('%hour%', hour)
    .replace('%minute%', minute)
    .replace('%second%', second);

  return permalink
    .split('/')
    .map((el) => trimSlash(el))
    .filter((el) => !!el)
    .join('/');
};

const getNormalizedPost = async (post: CollectionEntry<'post'>): Promise<Post> => {
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

  const slug = cleanSlug(id); // cleanSlug(rawSlug.split('/').pop());
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
    // or 'content' in case you consume from API

    readingTime: remarkPluginFrontmatter?.readingTime,
    headings: remarkPluginFrontmatter?.headings,
  };
};

const load = async function (): Promise<Array<Post>> {
  const posts = await getCollection('post');
  const normalizedPosts = posts.map(async (post) => await getNormalizedPost(post));

  const results = (await Promise.all(normalizedPosts))
    .sort((a, b) => b.publishDate.valueOf() - a.publishDate.valueOf())
    .filter((post) => !post.draft);

  return results;
};

const compareSeriesPosts = (a: Post, b: Post) => {
  const aPart = a.series?.part;
  const bPart = b.series?.part;

  if (typeof aPart === 'number' && typeof bPart === 'number') {
    return aPart - bPart;
  }

  if (typeof aPart === 'number') return -1;
  if (typeof bPart === 'number') return 1;

  return a.publishDate.valueOf() - b.publishDate.valueOf();
};

const matchesSeries = (seriesA?: Post['series'], seriesB?: Post['series']) => {
  if (!seriesA || !seriesB) return false;
  if (seriesA.id && seriesB.id && seriesA.id === seriesB.id) return true;

  const normalizedA = seriesA.title?.trim().toLowerCase();
  const normalizedB = seriesB.title?.trim().toLowerCase();
  if (normalizedA && normalizedB && normalizedA === normalizedB) return true;

  return false;
};

let _posts: Array<Post>;

/** */
export const isBlogEnabled = APP_BLOG.isEnabled;
export const isRelatedPostsEnabled = APP_BLOG.isRelatedPostsEnabled;
export const isBlogListRouteEnabled = APP_BLOG.list.isEnabled;
export const isBlogPostRouteEnabled = APP_BLOG.post.isEnabled;
export const isBlogCategoryRouteEnabled = APP_BLOG.category.isEnabled;
export const isBlogTagRouteEnabled = APP_BLOG.tag.isEnabled;

export const blogListRobots = APP_BLOG.list.robots;
export const blogPostRobots = APP_BLOG.post.robots;
export const blogCategoryRobots = APP_BLOG.category.robots;
export const blogTagRobots = APP_BLOG.tag.robots;

export const blogPostsPerPage = APP_BLOG?.postsPerPage;

/** */
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

/** */
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

/** */
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

/** */
export const findLatestPosts = async ({ count }: { count?: number }): Promise<Array<Post>> => {
  const _count = count || 4;
  const posts = await fetchPosts();

  return posts ? posts.slice(0, _count) : [];
};

const sortTaxonomies = (items: Iterable<Taxonomy>) =>
  Array.from(items).sort((a, b) => a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' }));

/** */
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

/** */
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

/** */
export const findPostsByAuthor = async (authorName: string): Promise<Array<Post>> => {
  if (!authorName) return [];

  const normalized = authorName.trim().toLowerCase();
  const posts = await fetchPosts();

  return posts.filter((post) => post.author?.trim().toLowerCase() === normalized);
};

type AuthorEntry = CollectionEntry<'author'>;

export interface AuthorWithStats extends AuthorEntry {
  postCount: number;
}

/** */
export const findAuthorsWithStats = async (): Promise<Array<AuthorWithStats>> => {
  const [authors, posts] = await Promise.all([getCollection('author'), fetchPosts()]);

  return authors.map((author) => {
    const postCount = posts.filter((post) => post.author === author.data.name).length;
    return {
      ...author,
      postCount,
    } satisfies AuthorWithStats;
  });
};

/** */
export const getStaticPathsBlogList = async ({ paginate }: { paginate: PaginateFunction }) => {
  if (!isBlogEnabled || !isBlogListRouteEnabled) return [];
  return paginate(await fetchPosts(), {
    params: { blog: BLOG_BASE || undefined },
    pageSize: blogPostsPerPage,
  });
};

/** */
export const getStaticPathsBlogPost = async () => {
  if (!isBlogEnabled || !isBlogPostRouteEnabled) return [];
  return (await fetchPosts()).flatMap((post) => ({
    params: {
      blog: post.permalink,
    },
    props: { post },
  }));
};

/** */
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

/** */
export const getStaticPathsBlogTag = async ({ paginate }: { paginate: PaginateFunction }) => {
  if (!isBlogEnabled || !isBlogTagRouteEnabled) return [];

  const [posts, tagEntries] = await Promise.all([fetchPosts(), getCollection('tag')]);

  const tagMeta = new Map<string, Taxonomy>();
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
        tag:
          tagMeta.get(tagSlug) ??
          ({
            slug: tagSlug,
            title: tagPosts[0]?.tags?.find((t) => t.slug === tagSlug)?.title ?? tagSlug,
          } satisfies Taxonomy),
      },
    })
  );
};

/** */
export async function getRelatedPosts(originalPost: Post, maxResults: number = 4): Promise<Post[]> {
  const allPosts = await fetchPosts();
  const originalTagsSet = new Set(originalPost.tags ? originalPost.tags.map((tag) => tag.slug) : []);

  const postsWithScores = allPosts.reduce((acc: { post: Post; score: number }[], iteratedPost: Post) => {
    if (iteratedPost.slug === originalPost.slug) return acc;

    let score = 0;
    if (matchesSeries(iteratedPost.series, originalPost.series)) {
      score += 20;
    }
    if (iteratedPost.category && originalPost.category && iteratedPost.category.slug === originalPost.category.slug) {
      score += 5;
    }

    if (iteratedPost.tags) {
      iteratedPost.tags.forEach((tag) => {
        if (originalTagsSet.has(tag.slug)) {
          score += 1;
        }
      });
    }

    acc.push({ post: iteratedPost, score });
    return acc;
  }, []);

  postsWithScores.sort((a, b) => b.score - a.score);

  const selectedPosts: Post[] = [];
  let i = 0;
  while (selectedPosts.length < maxResults && i < postsWithScores.length) {
    selectedPosts.push(postsWithScores[i].post);
    i++;
  }

  return selectedPosts;
}

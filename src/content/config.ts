import { glob } from 'astro/loaders';
import { defineCollection, getCollection, type SchemaContext, z } from 'astro:content';

/**
 * Định nghĩa Metadata mở rộng (SEO, OpenGraph, Twitter,...)
 */
const metadataDefinition = () =>
  z
    .object({
      title: z.string().optional(),
      ignoreTitleTemplate: z.boolean().optional(),
      canonical: z.string().url().optional(),
      robots: z
        .object({
          index: z.boolean().optional(),
          follow: z.boolean().optional(),
        })
        .optional(),
      description: z.string().optional(),
      openGraph: z
        .object({
          url: z.string().optional(),
          siteName: z.string().optional(),
          images: z
            .array(
              z.object({
                url: z.string(),
                width: z.number().optional(),
                height: z.number().optional(),
              })
            )
            .optional(),
          locale: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),
      twitter: z
        .object({
          handle: z.string().optional(),
          site: z.string().optional(),
          cardType: z.string().optional(),
        })
        .optional(),
      structuredData: z.union([z.record(z.any()), z.array(z.record(z.any()))]).optional(),
    })
    .optional();

/**
 * Collection: AUTHOR
 */
const authorCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/content/author' }),
  schema: ({ image }: SchemaContext) =>
    z.object({
      name: z.string(),
      username: z.string().optional(),
      email: z.string().optional(),
      avatar: image().optional(),
      bio: z.string().optional(),
      website: z.string().optional(),
    }),
});

/**
 * Collection: CATEGORY
 */
const categoryCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/content/category' }),
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
  }),
});

/**
 * Collection: TAG
 */
const tagCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/content/tag' }),
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
  }),
});

/**
 * Collection: POST
 */
const postCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/content/post' }),
  schema: ({ image }: SchemaContext) =>
    z.object({
      publishDate: z.date().optional(),
      updateDate: z.date().optional(),
      draft: z.boolean().optional(),

      title: z.string().optional(),
      excerpt: z.string().optional(),
      image: image().optional(),

      category: z.string().optional(), // sẽ được map sang object
      tags: z.array(z.string()).optional(), // sẽ được map sang array object
      author: z.string().optional(), // sẽ được map sang object

      metadata: metadataDefinition(),
    }),
});

/**
 * Hàm tiện ích: Tự động resolve liên kết thật
 * Trả về object bài viết với dữ liệu liên quan (author, category, tags)
 */
export async function resolveRelations() {
  const [posts, authors, categories, tags] = await Promise.all([
    getCollection('post'),
    getCollection('author'),
    getCollection('category'),
    getCollection('tag'),
  ]);

  const authorMap = new Map(authors.map((a) => [a.data.name, a]));
  const categoryMap = new Map(categories.map((c) => [c.data.name, c]));
  const tagMap = new Map(tags.map((t) => [t.data.name, t]));

  return posts.map((post) => ({
    ...post,
    author: post.data.author ? (authorMap.get(post.data.author) ?? null) : null,
    category: post.data.category ? (categoryMap.get(post.data.category) ?? null) : null,
    tags: post.data.tags ? post.data.tags.map((tagName) => tagMap.get(tagName) ?? { data: { name: tagName } }) : [],
  }));
}

/**
 * Xuất collections cho Astro
 */
export const collections = {
  post: postCollection,
  author: authorCollection,
  category: categoryCollection,
  tag: tagCollection,
};

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
      stories: z.array(z.string()).optional(), // Danh sách story IDs muốn hiển thị
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

      series: z
        .object({
          id: z.string().optional(),
          title: z.string().optional(),
          part: z.number().int().min(1).optional(),
          totalParts: z.number().int().min(1).optional(),
        })
        .optional()
        .nullable()
        .transform((value) => (value ? value : undefined)),

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
 * Collection: PAGE
 */
const pageCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/content/page' }),
  schema: ({ image }: SchemaContext) =>
    z.object({
      title: z.string().optional(),
      metadata: metadataDefinition(),
      image: image().optional(),
    }),
});

/**
 * Collection: STORY
 */
const storyCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/content/stories' }),
  schema: ({ image }: SchemaContext) =>
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      slides: z.array(z.any()), // Storing complex slide data
      audio: z
        .object({
          src: z.string(),
          volume: z.number(),
        })
        .optional(),
      thumbnail: image().optional(), // Image field for cover/thumbnail,
      settings: z
        .object({
          autoPlay: z.boolean().optional(),
          loop: z.boolean().optional(),
          progressBar: z.boolean().optional(),
        })
        .optional(),
      createdAt: z.date().optional(),
      updatedAt: z.date().optional(),
    }),
});

/**
 * Xuất collections cho Astro
 */
export const collections = {
  post: postCollection,
  author: authorCollection,
  category: categoryCollection,
  tag: tagCollection,
  page: pageCollection,
  stories: storyCollection,
};

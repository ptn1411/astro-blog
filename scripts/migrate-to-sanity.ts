import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { markdownToPortableText } from '@portabletext/markdown';
import { createClient } from '@sanity/client';

// Load .env
import 'dotenv/config';

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID || 'whq7qfq3';
const dataset = process.env.PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN;

if (!token) {
  console.error('❌ SANITY_API_TOKEN is missing in environment!');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
});

const ROOT_DIR = process.cwd();
const POSTS_DIR = path.join(ROOT_DIR, 'src/content/post');
const AUTHORS_DIR = path.join(ROOT_DIR, 'src/content/author');
const CATEGORIES_DIR = path.join(ROOT_DIR, 'src/content/category');
const TAGS_DIR = path.join(ROOT_DIR, 'src/content/tag');

// Cache image uploads để tránh upload lặp lại
const uploadedAssetsCache = new Map<string, string>();

// Lookup maps để resolve quan hệ chính xác
const categoryLookup = new Map<string, string>();
const tagLookup = new Map<string, string>();
const authorLookup = new Map<string, string>();

async function uploadLocalAsset(imagePath: string): Promise<string | null> {
  if (!imagePath) return null;

  let cleanPath = imagePath.trim();
  if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);

  const absolutePath = path.resolve(ROOT_DIR, cleanPath);
  if (!fs.existsSync(absolutePath)) {
    console.warn(`  ⚠️ Không tìm thấy file ảnh: ${absolutePath}`);
    return null;
  }

  if (uploadedAssetsCache.has(absolutePath)) {
    return uploadedAssetsCache.get(absolutePath)!;
  }

  try {
    const fileStream = fs.createReadStream(absolutePath);
    const asset = await client.assets.upload('image', fileStream, {
      filename: path.basename(absolutePath),
    });
    uploadedAssetsCache.set(absolutePath, asset._id);
    return asset._id;
  } catch (err: any) {
    console.error(`  ❌ Lỗi khi upload ảnh ${absolutePath}:`, err.message);
    return null;
  }
}

function cleanSlug(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function migrateCategories() {
  console.log('\n--- 1. BẮT ĐẦU MIGRATE CATEGORIES ---');
  if (!fs.existsSync(CATEGORIES_DIR)) return;
  const files = fs.readdirSync(CATEGORIES_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));

  for (const file of files) {
    const filePath = path.join(CATEGORIES_DIR, file);
    const slug = cleanSlug(path.basename(file, path.extname(file)));
    const { data } = matter(fs.readFileSync(filePath, 'utf-8'));
    const name = data.name || slug;

    const doc = {
      _id: `category-${slug}`,
      _type: 'category',
      name: name,
      slug: { _type: 'slug', current: slug },
      description: data.description || '',
    };

    await client.createOrReplace(doc);
    categoryLookup.set(name.toLowerCase(), doc._id);
    categoryLookup.set(slug, doc._id);
    categoryLookup.set(cleanSlug(name), doc._id);
    console.log(`  ✓ Đã import category: ${doc.name} (${doc._id})`);
  }
}

async function migrateTags() {
  console.log('\n--- 2. BẮT ĐẦU MIGRATE TAGS ---');
  if (!fs.existsSync(TAGS_DIR)) return;
  const files = fs.readdirSync(TAGS_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));

  for (const file of files) {
    const filePath = path.join(TAGS_DIR, file);
    const slug = cleanSlug(path.basename(file, path.extname(file)));
    const { data } = matter(fs.readFileSync(filePath, 'utf-8'));
    const name = data.name || slug;

    const doc = {
      _id: `tag-${slug}`,
      _type: 'tag',
      name: name,
      slug: { _type: 'slug', current: slug },
      description: data.description || '',
    };

    await client.createOrReplace(doc);
    tagLookup.set(name.toLowerCase(), doc._id);
    tagLookup.set(slug, doc._id);
    tagLookup.set(cleanSlug(name), doc._id);
    console.log(`  ✓ Đã import tag: ${doc.name} (${doc._id})`);
  }
}

async function migrateAuthors() {
  console.log('\n--- 3. BẮT ĐẦU MIGRATE AUTHORS ---');
  if (!fs.existsSync(AUTHORS_DIR)) return;
  const files = fs.readdirSync(AUTHORS_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));

  for (const file of files) {
    const filePath = path.join(AUTHORS_DIR, file);
    const { data, content } = matter(fs.readFileSync(filePath, 'utf-8'));
    const username = data.username ? cleanSlug(data.username) : cleanSlug(data.name || 'author');
    const name = data.name || username;

    let avatarAssetId: string | null = null;
    if (data.avatar) {
      avatarAssetId = await uploadLocalAsset(data.avatar);
    }

    const blocks = markdownToPortableText(content || '');

    const doc: any = {
      _id: `author-${username}`,
      _type: 'author',
      name: name,
      username: { _type: 'slug', current: username },
      email: data.email || '',
      bio: data.bio || '',
      website: data.website || '',
      body: blocks,
    };

    if (avatarAssetId) {
      doc.avatar = {
        _type: 'image',
        asset: { _type: 'reference', _ref: avatarAssetId },
      };
    }

    await client.createOrReplace(doc);
    authorLookup.set(name.toLowerCase(), doc._id);
    authorLookup.set(username, doc._id);
    authorLookup.set(cleanSlug(name), doc._id);
    console.log(`  ✓ Đã import author: ${doc.name} (${doc._id})`);
  }
}

async function resolveCategoryRef(categoryName?: string): Promise<{ _type: 'reference'; _ref: string } | undefined> {
  if (!categoryName) return undefined;
  const key = categoryName.toLowerCase();
  const slug = cleanSlug(categoryName);

  let targetId = categoryLookup.get(key) || categoryLookup.get(slug);
  if (!targetId) {
    // Tự động tạo nếu chưa có
    targetId = `category-${slug}`;
    await client.createIfNotExists({
      _id: targetId,
      _type: 'category',
      name: categoryName,
      slug: { _type: 'slug', current: slug },
    });
    categoryLookup.set(key, targetId);
    categoryLookup.set(slug, targetId);
  }
  return { _type: 'reference', _ref: targetId };
}

async function resolveTagRef(tagName: string): Promise<{ _key: string; _type: 'reference'; _ref: string }> {
  const key = tagName.toLowerCase();
  const slug = cleanSlug(tagName);

  let targetId = tagLookup.get(key) || tagLookup.get(slug);
  if (!targetId) {
    // Tự động tạo nếu chưa có
    targetId = `tag-${slug}`;
    await client.createIfNotExists({
      _id: targetId,
      _type: 'tag',
      name: tagName,
      slug: { _type: 'slug', current: slug },
    });
    tagLookup.set(key, targetId);
    tagLookup.set(slug, targetId);
  }
  return { _key: `tag-${slug}`, _type: 'reference', _ref: targetId };
}

async function resolveAuthorRef(authorName?: string): Promise<{ _type: 'reference'; _ref: string } | undefined> {
  if (!authorName) return undefined;
  const key = authorName.toLowerCase();
  const slug = cleanSlug(authorName);

  let targetId = authorLookup.get(key) || authorLookup.get(slug);
  if (!targetId) {
    targetId = `author-${slug}`;
    await client.createIfNotExists({
      _id: targetId,
      _type: 'author',
      name: authorName,
      username: { _type: 'slug', current: slug },
    });
    authorLookup.set(key, targetId);
    authorLookup.set(slug, targetId);
  }
  return { _type: 'reference', _ref: targetId };
}

async function migratePosts() {
  console.log('\n--- 4. BẮT ĐẦU MIGRATE 72 POSTS ---');
  if (!fs.existsSync(POSTS_DIR)) return;
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  console.log(`Tổng số bài viết phát hiện: ${files.length}`);

  let count = 0;
  for (const file of files) {
    count++;
    const filePath = path.join(POSTS_DIR, file);
    const rawSlug = path.basename(file, path.extname(file));
    const slug = cleanSlug(rawSlug);
    const { data, content } = matter(fs.readFileSync(filePath, 'utf-8'));

    // Upload cover image
    let imageAssetId: string | null = null;
    if (data.image) {
      imageAssetId = await uploadLocalAsset(data.image);
    }

    // Convert markdown to Portable Text
    const blocks = markdownToPortableText(content || '');

    // Map relationships an toàn
    const authorRef = await resolveAuthorRef(data.author);
    const categoryRef = await resolveCategoryRef(data.category);

    const tagRefs = Array.isArray(data.tags)
      ? await Promise.all(data.tags.map((t: string) => resolveTagRef(t)))
      : [];

    const doc: any = {
      _id: `post-${slug}`,
      _type: 'post',
      title: data.title || rawSlug,
      slug: { _type: 'slug', current: slug },
      excerpt: data.excerpt || '',
      publishDate: data.publishDate ? new Date(data.publishDate).toISOString() : new Date().toISOString(),
      updateDate: data.updateDate ? new Date(data.updateDate).toISOString() : undefined,
      draft: Boolean(data.draft),
      body: blocks,
    };

    if (imageAssetId) {
      doc.image = {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageAssetId },
      };
    }

    if (authorRef) doc.author = authorRef;
    if (categoryRef) doc.category = categoryRef;
    if (tagRefs.length > 0) doc.tags = tagRefs;

    if (data.series) {
      doc.series = {
        _type: 'series',
        id: data.series.id || '',
        title: data.series.title || '',
        part: data.series.part ? Number(data.series.part) : undefined,
        totalParts: data.series.totalParts ? Number(data.series.totalParts) : undefined,
      };
    }

    await client.createOrReplace(doc);
    console.log(`  [${count}/${files.length}] ✓ Đã import: ${doc.title.slice(0, 50)}... (${doc._id})`);
  }
}

async function main() {
  console.log(`🚀 Bắt đầu quá trình Migration sang Sanity: ${projectId} (${dataset})`);
  const startTime = Date.now();

  try {
    await migrateCategories();
    await migrateTags();
    await migrateAuthors();
    await migratePosts();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🎉 HOÀN THÀNH MIGRATION 72 BÀI VIẾT TRONG ${elapsed} GIÂY!`);
  } catch (error) {
    console.error('\n❌ Có lỗi xảy ra trong quá trình migration:', error);
    process.exit(1);
  }
}

main();

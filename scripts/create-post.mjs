#!/usr/bin/env node
/**
 * Create a new blog post MDX file in src/content/post.
 * Usage:
 *   node scripts/create-post.mjs --title "..." --excerpt "..." --category "..." --tags "a,b" --author "..." --body-file /tmp/body.mdx
 */

import fs from 'node:fs';
import path from 'node:path';

function slugify(input) {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const val = argv[i + 1];
    args[key] = val;
    i++;
  }
  return args;
}

const args = parseArgs(process.argv);
const title = args.title;
const excerpt = args.excerpt ?? '';
const category = args.category ?? 'IT';
const tags = (args.tags ?? '')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean);
const author = args.author ?? 'Phạm Thành Nam';
const bodyFile = args['body-file'];

if (!title) {
  console.error('Missing --title');
  process.exit(1);
}
if (!bodyFile) {
  console.error('Missing --body-file');
  process.exit(1);
}

const body = fs.readFileSync(bodyFile, 'utf8').trim() + '\n';
const publishDate = new Date().toISOString();

const baseSlug = slugify(title) || `bai-viet-${Date.now()}`;
const outDir = path.join(process.cwd(), 'src', 'content', 'post');
fs.mkdirSync(outDir, { recursive: true });

let filename = `${baseSlug}.mdx`;
let outPath = path.join(outDir, filename);
let n = 2;
while (fs.existsSync(outPath)) {
  filename = `${baseSlug}-${n}.mdx`;
  outPath = path.join(outDir, filename);
  n++;
}

const fm = [
  '---',
  `title: "${title.replace(/"/g, '\\"')}"`,
  `excerpt: "${excerpt.replace(/"/g, '\\"')}"`,
  `category: "${category.replace(/"/g, '\\"')}"`,
  'tags:',
  ...tags.map((t) => `  - ${t}`),
  `author: "${author.replace(/"/g, '\\"')}"`,
  'image: /src/assets/images/hero-image.png',
  `publishDate: ${publishDate}`,
  '---',
  '',
].join('\n');

fs.writeFileSync(outPath, fm + body, 'utf8');
process.stdout.write(path.relative(process.cwd(), outPath));

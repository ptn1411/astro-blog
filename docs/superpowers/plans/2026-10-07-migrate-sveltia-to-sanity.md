# Migrate Sveltia CMS to Sanity CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển đổi toàn bộ hệ thống quản trị nội dung từ Sveltia CMS (Git-based MDX) sang Sanity CMS (Headless Content Lake) cho dự án `astro-blog`, bảo toàn 100% 72 bài viết, permalink, SEO và loại bỏ các file phụ thuộc Sveltia cũ.

**Architecture:** Sử dụng Sanity Content Lake làm nguồn sự thật (single source of truth). Dữ liệu MDX được ETL tự động sang Portable Text và Sanity Documents với deterministic IDs. Astro truy vấn qua GROQ API với `@sanity/client` và render Portable Text bằng `astro-portabletext`. Sanity Studio được nhúng trực tiếp tại route `/studio`.

**Tech Stack:** Astro 5, Sanity Studio v3, `@sanity/astro`, `@sanity/client`, `@sanity/image-url`, `astro-portabletext`, `@portabletext/markdown`, `gray-matter`, TypeScript.

**Spec:** Chuyển đổi từ Sveltia CMS sang Sanity CMS theo chuẩn `sanity-migration` và `sanity-best-practices`.

## Global Constraints
- Preserve exact permalinks (`/blog/[slug]` hoặc permalink theo cấu hình hiện tại) — không làm gãy SEO/link cũ.
- Deterministic IDs: `post-${slug}`, `author-${username}`, `category-${slug}`, `tag-${slug}` để migration có thể chạy lại an toàn (idempotent).
- Không lưu raw HTML trong bài viết: chuyển đổi toàn bộ Markdown sang Portable Text blocks.
- Tất cả ảnh local trong `src/assets/images/` được upload lên Sanity Image Pipeline.

---

## Phase 1: Khởi Tạo Sanity Project & Thiết Lập Schema

### Task 1: Cài đặt dependencies và khởi tạo Sanity Config
**Files:**
- Create: `sanity.config.ts`
- Create: `sanity.cli.ts`
- Modify: `package.json`
- Modify: `astro.config.ts`
- Modify: `.env`

- [x] **Step 1: Cài đặt các gói phụ thuộc cần thiết**
  ```bash
  npm install @sanity/astro @sanity/client @sanity/image-url astro-portabletext sanity
  npm install -D @portabletext/markdown gray-matter
  ```

- [x] **Step 2: Cập nhật `.env` với Sanity Environment Variables**
  Thêm `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET=production`, `SANITY_API_TOKEN` (write token cho migration).

- [x] **Step 3: Tạo `sanity.config.ts` và `sanity.cli.ts`**
  Định nghĩa workspace Sanity với schema types và desk structure.

- [x] **Step 4: Tích hợp `@sanity/astro` vào `astro.config.ts`**
  Cấu hình plugin `sanity()` trong mảng `integrations`.

---

### Task 2: Xây dựng toàn bộ Sanity Schema Types (Đầy đủ 6 Collections & Block Components)
Đối chiếu 100% từ `public/admin/config.yml` và `src/content/config.ts`.

**Files:**
- Create: `src/sanity/schemaTypes/index.ts`
- Create: `src/sanity/schemaTypes/blockContent.ts` (Portable Text với editor components)
- Create: `src/sanity/schemaTypes/post.ts`
- Create: `src/sanity/schemaTypes/author.ts`
- Create: `src/sanity/schemaTypes/category.ts`
- Create: `src/sanity/schemaTypes/tag.ts`
- Create: `src/sanity/schemaTypes/page.ts`
- Create: `src/sanity/schemaTypes/story.ts`
- Create: `src/sanity/schemaTypes/objects/series.ts`
- Create: `src/sanity/schemaTypes/objects/seoMetadata.ts`
- Create: `src/sanity/schemaTypes/objects/youtube.ts`
- Create: `src/sanity/schemaTypes/objects/vimeo.ts`
- Create: `src/sanity/schemaTypes/objects/tweet.ts`
- Create: `src/sanity/schemaTypes/objects/codeBlock.ts`
- Create: `src/sanity/schemaTypes/objects/slide.ts`

- [x] **Step 1: Tạo `blockContent.ts` & Embed Components (tương ứng `editor_components` & `buttons` trong config.yml)**
  - Decorators: `strong`, `em`, `code`, `underline`, `strike-through`
  - Annotations: `link` (href, target blank)
  - Custom Objects tích hợp sẵn:
    + `codeBlock`: Code snippets có chọn `language` và `filename`
    + `youtube`: Embed video YouTube (`url`)
    + `vimeo`: Embed video Vimeo (`url`)
    + `tweet`: Embed Twitter/X post (`url`)
    + `customImage`: Image có `alt`, `caption`
    + `table`: Hỗ trợ bảng dữ liệu (tương ứng button `table`)

- [x] **Step 2: Tạo `post.ts` (Collection POST)**
  - `title`: string (required)
  - `slug`: slug từ title (required)
  - `excerpt`: text
  - `category`: reference `category`
  - `tags`: array of reference `tag`
  - `author`: reference `author`
  - `series`: object `series` (`id`, `title`, `part`, `totalParts`)
  - `image`: image (hotspot)
  - `publishDate`: datetime (required)
  - `updateDate`: datetime
  - `draft`: boolean
  - `body`: `blockContent`
  - `metadata`: object `seoMetadata` (canonical, robots, openGraph, twitter)

- [x] **Step 3: Tạo `author.ts` (Collection AUTHOR)**
  - `name`: string (required)
  - `username`: string (slug format)
  - `email`: string
  - `avatar`: image
  - `bio`: text (max 150 ký tự)
  - `website`: url string
  - `stories`: array of reference `story` (tương ứng field `stories` trong config.yml)
  - `body`: `blockContent` (giới thiệu chi tiết tác giả)

- [x] **Step 4: Tạo `category.ts` & `tag.ts` (Collections CATEGORY & TAG)**
  - `name`: string (required)
  - `slug`: slug
  - `description`: text

- [ ] **Step 5: Tạo `page.ts` (Collection PAGE)**
  - `title`: string
  - `slug`: slug
  - `image`: image
  - `pageLayout`: string list ('Layout', 'PageLayout', 'AnimationLayout', 'AnimationPageLayout')
  - `metadata`: object `seoMetadata`
  - `headerData` & `footerData`: custom navigation objects
  - `body`: `blockContent`

- [x] **Step 6: Tạo `story.ts` (Collection STORIES)**
  - `id`: string
  - `title`: string
  - `description`: text
  - `thumbnail`: image
  - `audio`: file
  - `autoPlay`: boolean
  - `loop`: boolean
  - `createdAt`: datetime
  - `slides`: array of `slide` objects:
    + `id`: string
    + `duration`: number
    + `bgColor`: string
    + `bgImage`: image
    + `text`: text
    + `textColor`: string
    + `textSize`: string ('small', 'medium', 'large')
    + `image`: image
    + `rawElements`: array / json (hỗ trợ builder elements chi tiết)

- [x] **Step 7: Tổng hợp export tại `src/sanity/schemaTypes/index.ts`**

---

### Task 3: Cấu hình nhúng Sanity Studio tại `/studio`
**Files:**
- Create: `src/pages/studio/[...index].astro`

- [x] **Step 1: Tạo route Studio trong Astro**
  Sử dụng component `Studio` từ `@sanity/astro` để render Studio SPA trực tiếp trong ứng dụng.
- [x] **Step 2: Kiểm tra truy cập `http://localhost:4321/studio`**
  Đảm bảo màn hình đăng nhập và giao diện Sanity Studio hiển thị bình thường.

---

## Phase 2: Kịch Bản ETL & Migration Dữ Liệu

### Task 4: Xây dựng script ETL Migration
**Files:**
- Create: `scripts/migrate-to-sanity.ts`

- [x] **Step 1: Khởi tạo migration client với Sanity Write Token**
- [x] **Step 2: Hàm trích xuất và import Categories & Tags**
  Đọc các file trong `src/content/category/` và `src/content/tag/`, dùng `createOrReplace` với ID `category-${slug}` và `tag-${slug}`.
- [x] **Step 3: Hàm trích xuất và import Authors (kèm avatar upload)**
  Đọc `src/content/author/`, upload file ảnh avatar lên Sanity Asset, lưu `author-${username}`.

---

### Task 5: Migration 72 Bài Viết Post (Assets & Portable Text)
**Files:**
- Modify: `scripts/migrate-to-sanity.ts`

- [x] **Step 1: Xử lý upload Featured Images**
  Đọc đường dẫn ảnh từ frontmatter bài viết, tìm ảnh trong `src/assets/images/`, tải lên qua `sanityClient.assets.upload('image', fs.createReadStream(...))` và gán asset ref.
- [x] **Step 2: Chuyển đổi Markdown Body sang Portable Text**
  Sử dụng `markdownToPortableText` từ `@portabletext/markdown` để parse body MDX của 72 bài viết thành Portable Text blocks hợp lệ.
- [x] **Step 3: Map quan hệ References**
  Map `author` ➔ `{ _type: 'reference', _ref: 'author-' + authorSlug }`.
  Map `category` ➔ `{ _type: 'reference', _ref: 'category-' + categorySlug }`.
  Map `tags` ➔ mảng reference `tag-${tagSlug}`.
- [x] **Step 4: Thực thi di chuyển toàn bộ 72 bài viết**
  Chạy `npx tsx scripts/migrate-to-sanity.ts` và ghi log tiến độ từng bài.
- [x] **Step 5: Di chuyển Pages (`src/content/page/`) và Stories (`src/content/stories/`)**
  - Pages: Upload ảnh cover, convert body sang Portable Text, map layout & metadata.
  - Stories: Upload ảnh cover/thumbnails, upload audio file sang Sanity Asset, map toàn bộ slides và animation elements sang Sanity story documents.
- [x] **Step 6: Kiểm tra số lượng và tính vẹn toàn**
  Truy vấn GROQ kiểm tra:
  + `count(*[_type == "post"]) == 72`
  + `count(*[_type == "author"]) == 2`
  + `count(*[_type == "category"]) == 12`
  + `count(*[_type == "tag"]) == 13`
  + `count(*[_type == "page"]) == 2`
  + `count(*[_type == "story"]) == 8`

---

## Phase 3: Tích Hợp Frontend Astro & Render Portable Text

### Task 6: Xây dựng Sanity Query & Client Layer
**Files:**
- Create: `src/utils/sanity/client.ts`
- Create: `src/utils/sanity/queries.ts`
- Create: `src/utils/sanity/image.ts`

- [x] **Step 1: Thiết lập client Sanity và urlFor image builder**
- [x] **Step 2: Viết GROQ queries cho Posts, Categories, Tags, Authors**
  Truy vấn mở rộng (dereferencing `->`) để lấy đầy đủ author name, category title, tags title.

---

### Task 7: Thay thế Data Fetching trong Blog Layer
**Files:**
- Modify: `src/utils/blog/index.ts`
- Modify: `src/utils/blog/normalizer.ts`
- Modify: `src/utils/blog/staticPaths.ts`

- [x] **Step 1: Chuyển đổi hàm `load()` trong `src/utils/blog/index.ts`**
  Thay vì `getCollection('post')`, gọi `sanityClient.fetch(allPostsQuery)`.
- [x] **Step 2: Cập nhật `normalizer.ts`**
  Chuyển đổi Post document từ Sanity sang interface `Post` hiện tại để không làm gãy các components giao diện đang dùng.
- [x] **Step 3: Cập nhật các hàm Taxonomy (`findCategories`, `findTags`, `findAuthors`)**

---

### Task 8: Render Portable Text trong SinglePost
**Files:**
- Create: `src/components/blog/PortableTextRenderer.astro`
- Modify: `src/components/blog/SinglePost.astro`
- Modify: `src/pages/[...blog]/index.astro`

- [x] **Step 1: Tạo `PortableTextRenderer.astro`**
  Định nghĩa custom components cho các block đặc biệt: hình ảnh responsive, block quote, code fence (syntax highlighting), links.
- [x] **Step 2: Cập nhật `SinglePost.astro` và `src/pages/[...blog]/index.astro`**
  Render `<PortableTextRenderer value={post.body} />` thay cho slot MDX trước đây.

---

## Phase 4: Gỡ Bỏ Sveltia CMS & Refactor Admin

### Task 9: Xóa các tệp Sveltia CMS
**Files:**
- Delete: `src/pages/admin.html`
- Delete: `public/admin/config.yml`

- [x] **Step 1: Xóa `src/pages/admin.html`**
- [x] **Step 2: Xóa thư mục `public/admin/`**
- [x] **Step 3: Cập nhật chuyển hướng (redirect) `/admin` sang `/studio`**

---

### Task 10: Dọn dẹp code phụ thuộc Sveltia User
**Files:**
- Modify: `src/utils/media.ts`
- Modify: `src/components/admin/config.ts`
- Modify: `src/components/admin/story/utils/github.ts`
- Modify: `src/components/admin/builder/services/save/saveActions.ts`
- Modify: `src/pages/admin/_utils.ts`

- [x] **Step 1: Loại bỏ phụ thuộc vào `localStorage.getItem('sveltia-cms.user')`**
- [x] **Step 2: Thay thế logic lưu trữ sang Sanity API Client hoặc Studio Desk**
- [x] **Step 3: Cập nhật `.gitignore` (xóa bỏ các quy tắc cũ nếu có)**

---

## Phase 5: Kiểm Thử, Đối Soát & Cutover

### Task 11: Kiểm thử toàn diện & nghiệm thu
- [x] **Step 1: Kiểm thử số lượng bài viết và taxonomy**
  So sánh 72 bài viết trên Sanity với 72 bài viết trong `src/content/post/`.
- [x] **Step 2: Kiểm thử các đường dẫn URL & Permalink**
  Đảm bảo mọi link bài viết, danh mục, thẻ, tác giả đều trả về mã HTTP 200.
- [x] **Step 3: Kiểm thử hiển thị nội dung & hình ảnh**
  Kiểm tra hiển thị ảnh cover, ảnh trong bài viết, code snippets, bảng, danh sách.
- [x] **Step 4: Chạy kiểm tra tĩnh và build sản phẩm**
  ```bash
  npm run check
  npm run build
  ```
- [ ] **Step 5: Đóng gói lưu trữ thư mục `src/content/post/`**
  Di chuyển hoặc nén thư mục `src/content/post/` sang backup sau khi website chạy hoàn toàn ổn định trên Sanity.

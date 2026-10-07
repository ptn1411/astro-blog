// GROQ Queries cho Astro Blog

// Toàn bộ bài viết (cho trang danh sách Blog)
export const allPostsQuery = `*[_type == "post" && (!defined(draft) || draft == false)] | order(publishDate desc) {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  publishDate,
  updateDate,
  image,
  "category": category->{
    "title": name,
    "slug": slug.current
  },
  "tags": tags[]->{
    "title": name,
    "slug": slug.current
  },
  "author": author->name,
  series,
  metadata
}`;

// Chi tiết 1 bài viết theo slug
export const postBySlugQuery = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  publishDate,
  updateDate,
  image,
  "category": category->{
    "title": name,
    "slug": slug.current
  },
  "tags": tags[]->{
    "title": name,
    "slug": slug.current
  },
  "author": author->name,
  "authorUsername": author->username.current,
  series,
  body,
  metadata
}`;

// Danh sách danh mục
export const allCategoriesQuery = `*[_type == "category"] | order(name asc) {
  _id,
  "title": name,
  "slug": slug.current,
  description
}`;

// Danh sách thẻ
export const allTagsQuery = `*[_type == "tag"] | order(name asc) {
  _id,
  "title": name,
  "slug": slug.current,
  description
}`;

// Danh sách tác giả
export const allAuthorsQuery = `*[_type == "author"] | order(name asc) {
  _id,
  name,
  "username": username.current,
  email,
  avatar,
  bio,
  website,
  body
}`;

// Danh sách Stories
export const allStoriesQuery = `*[_type == "story"] | order(createdAt desc) {
  _id,
  id,
  title,
  description,
  thumbnail,
  "audioUrl": audio.asset->url,
  autoPlay,
  loop,
  createdAt,
  slides
}`;

// Re-export everything from the blog module for backward compatibility
export {
  // Config
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
  // Posts
  fetchPosts,
  findSeriesPosts,
  findPostsBySlugs,
  findPostsByIds,
  findLatestPosts,
  // Taxonomy
  findCategories,
  findTags,
  // Author
  findPostsByAuthor,
  findAuthorsWithStats,
  // Static paths
  getStaticPathsBlogList,
  getStaticPathsBlogPost,
  getStaticPathsBlogCategory,
  getStaticPathsBlogTag,
  // Related
  getRelatedPosts,
} from './blog/index';

export type { AuthorWithStats } from './blog/index';

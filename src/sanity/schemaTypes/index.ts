import { authorType } from './author';
import { blockContentType } from './blockContent';
import { categoryType } from './category';
import { pageType } from './page';
import { postType } from './post';
import { storyType } from './story';
import { tagType } from './tag';

// Object types
import { codeBlockType } from './objects/codeBlock';
import { seoMetadataType } from './objects/seoMetadata';
import { seriesType } from './objects/series';
import { slideType } from './objects/slide';
import { tweetType } from './objects/tweet';
import { vimeoType } from './objects/vimeo';
import { youtubeType } from './objects/youtube';

export const schemaTypes = [
  // Document types
  postType,
  authorType,
  categoryType,
  tagType,
  pageType,
  storyType,

  // Object / Block types
  blockContentType,
  seriesType,
  seoMetadataType,
  slideType,
  codeBlockType,
  youtubeType,
  vimeoType,
  tweetType,
];

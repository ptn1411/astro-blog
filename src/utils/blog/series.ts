import type { Post } from '~/types';

export const compareSeriesPosts = (a: Post, b: Post) => {
  const aPart = a.series?.part;
  const bPart = b.series?.part;

  if (typeof aPart === 'number' && typeof bPart === 'number') {
    return aPart - bPart;
  }

  if (typeof aPart === 'number') return -1;
  if (typeof bPart === 'number') return 1;

  return a.publishDate.valueOf() - b.publishDate.valueOf();
};

export const matchesSeries = (seriesA?: Post['series'], seriesB?: Post['series']) => {
  if (!seriesA || !seriesB) return false;
  if (seriesA.id && seriesB.id && seriesA.id === seriesB.id) return true;

  const normalizedA = seriesA.title?.trim().toLowerCase();
  const normalizedB = seriesB.title?.trim().toLowerCase();
  if (normalizedA && normalizedB && normalizedA === normalizedB) return true;

  return false;
};

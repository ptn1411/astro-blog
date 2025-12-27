import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import type { Post } from '~/types';
import { fetchPosts } from './index';

type AuthorEntry = CollectionEntry<'author'>;

export interface AuthorWithStats extends AuthorEntry {
  postCount: number;
}

export const findPostsByAuthor = async (authorName: string): Promise<Array<Post>> => {
  if (!authorName) return [];

  const normalized = authorName.trim().toLowerCase();
  const posts = await fetchPosts();

  return posts.filter((post) => post.author?.trim().toLowerCase() === normalized);
};

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

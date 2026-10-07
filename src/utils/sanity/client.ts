import { createClient } from '@sanity/client';

export const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID || process.env.PUBLIC_SANITY_PROJECT_ID || 'whq7qfq3';
export const dataset = import.meta.env.PUBLIC_SANITY_DATASET || process.env.PUBLIC_SANITY_DATASET || 'production';
export const apiVersion = '2024-01-01';

// Client cho Frontend (read-only, hỗ trợ CDN)
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});

// Client cho Scripts / Mutation (cần API Token)
export const getSanityWriteClient = (token?: string) => {
  const writeToken = token || process.env.SANITY_API_TOKEN;
  if (!writeToken) {
    throw new Error('SANITY_API_TOKEN is required for write operations');
  }
  return createClient({
    projectId,
    dataset,
    apiVersion,
    token: writeToken,
    useCdn: false,
  });
};

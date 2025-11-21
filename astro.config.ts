import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig, sharpImageService } from 'astro/config';

import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import type { AstroIntegration } from 'astro';
import compress from 'astro-compress';
import icon from 'astro-icon';
import pagefind from 'astro-pagefind';
import { visualizer } from 'rollup-plugin-visualizer';
import astrowind from './vendor/integration';

import {
  extractHeadingsRemarkPlugin,
  lazyImagesRehypePlugin,
  readingTimeRemarkPlugin,
  responsiveTablesRehypePlugin,
} from './src/utils/frontmatter';
import { remarkFixImagePaths } from './src/utils/remark-fix-image-paths';

import react from '@astrojs/react';

import cloudflare from '@astrojs/cloudflare';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hasExternalScripts = true;
const whenExternalScripts = (items: (() => AstroIntegration) | (() => AstroIntegration)[] = []) =>
  hasExternalScripts ? (Array.isArray(items) ? items.map((item) => item()) : [items()]) : [];

export default defineConfig({
  output: 'static',

  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap(),
    mdx(),
    icon({
      include: {
        tabler: ['*'],
        'flat-color-icons': [
          'template',
          'gallery',
          'approval',
          'document',
          'advertising',
          'currency-exchange',
          'voice-presentation',
          'business-contact',
          'database',
        ],
      },
    }),
    ...whenExternalScripts(() =>
      partytown({
        config: { forward: ['dataLayer.push'] },
      })
    ),
    pagefind(),
    compress({
      CSS: true,
      HTML: {
        'html-minifier-terser': {
          removeAttributeQuotes: false,
        },
      },
      Image: false,
      JavaScript: true,
      SVG: false,
      Logger: 1,
    }),
    astrowind({
      config: './src/config.yaml',
    }),
    react(),
  ],

  image: {
    service: sharpImageService(),
    domains: ['cdn.pixabay.com'],
  },

  markdown: {
    remarkPlugins: [remarkFixImagePaths, readingTimeRemarkPlugin, extractHeadingsRemarkPlugin],
    rehypePlugins: [responsiveTablesRehypePlugin, lazyImagesRehypePlugin],
  },

  vite: {
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
    plugins: [visualizer({ open: false })],
  },

  adapter: cloudflare(),
});

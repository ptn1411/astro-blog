import path from 'path';
import { fileURLToPath } from 'url';

process.env.SANITY_ASTRO_DISABLE_MODULE_DEDUPE = 'true';

import { defineConfig } from 'astro/config';

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
import sanity from '@sanity/astro';

import {
  extractHeadingsRemarkPlugin,
  lazyImagesRehypePlugin,
  readingTimeRemarkPlugin,
  responsiveTablesRehypePlugin,
} from './src/utils/frontmatter';
import { remarkFixImagePaths } from './src/utils/remark-fix-image-paths';

import react from '@astrojs/react';

import cloudflare from '@astrojs/cloudflare';
import { unified } from '@astrojs/markdown-remark';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hasExternalScripts = true;
const whenExternalScripts = (items: (() => AstroIntegration) | (() => AstroIntegration)[] = []) =>
  hasExternalScripts ? (Array.isArray(items) ? items.map((item) => item()) : [items()]) : [];

export default defineConfig({
  output: 'static',
  redirects: {
    '/admin': '/studio',
  },

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
      JavaScript: false, // Vite's esbuild already minifies JS, avoiding extra memory-heavy terser pass
      SVG: false,
      Logger: 1,
    }),
    astrowind({
      config: './src/config.yaml',
    }),
    react(),
    sanity({
      projectId: process.env.PUBLIC_SANITY_PROJECT_ID || 'whq7qfq3',
      dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
      apiVersion: '2024-01-01',
      useCdn: true,
      studioBasePath: '/studio',
    }),
  ],

  image: {
    domains: ['cdn.pixabay.com', 'cdn.sanity.io'],
  },

  markdown: {
    processor: unified({
      remarkPlugins: [remarkFixImagePaths, readingTimeRemarkPlugin, extractHeadingsRemarkPlugin],
      rehypePlugins: [responsiveTablesRehypePlugin, lazyImagesRehypePlugin],
    }),
  },

  vite: {
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom', 'styled-components', 'sanity', '@sanity/ui'],
    },
    plugins: [
      ...(process.env.ANALYZE === 'true' ? [visualizer({ open: false, filename: 'dist/stats.html' })] : []),
    ],
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react-is',
        'styled-components',
        'lodash/startCase.js',
        'lucide-react',
        'gsap',
        'animejs',
      ],
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        // @ffmpeg packages contain native WASM — Rollup cannot bundle them statically.
        // They are loaded at runtime via toBlobURL() from CDN, so marking external is safe.
        external: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/sanity') || id.includes('node_modules/@sanity')) {
              return 'sanity-vendor';
            }
            if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
              return 'three-vendor';
            }
            if (id.includes('node_modules/mermaid') || id.includes('node_modules/cytoscape')) {
              return 'diagrams-vendor';
            }
            if (id.includes('src/utils/blog/')) {
              return 'blog-utils';
            }
          },
        },
      },
    },
    ssr: {
      external: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    },
    server: {
      host: true,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
  },

  ...(process.env.NODE_ENV === 'production' ? { adapter: cloudflare() } : {}),
});

/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { seoPages } from './vite-plugins/seo-pages.ts';
import { ALL_PAGES, SITE, TOOL_METAS } from './src/tools/meta.ts';

/**
 * BASE_PATH: where the app is served from. "/" for a custom domain or local use,
 * "/neverupload/" for https://<user>.github.io/neverupload/. Set by the deploy workflow.
 * SITE_URL: absolute URL used for canonical links and the sitemap.
 */
const base = normalizeBase(process.env.BASE_PATH ?? '/');
const siteUrl = (process.env.SITE_URL ?? 'https://99proteam.github.io/neverupload').replace(
  /\/+$/,
  '',
);

function normalizeBase(path: string): string {
  const trimmed = path.trim().replace(/^\/*|\/*$/g, '');
  return trimmed ? `/${trimmed}/` : '/';
}

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'neverupload: private PDF & image tools',
        short_name: 'neverupload',
        description: SITE.description,
        theme_color: '#059669',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        id: '.',
        lang: 'en',
        dir: 'ltr',
        orientation: 'any',
        categories: ['productivity', 'utilities'],
        shortcuts: [
          {
            name: 'Merge PDF',
            url: 'merge-pdf/',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Compress PDF',
            url: 'compress-pdf/',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Images to PDF',
            url: 'images-to-pdf/',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Compress Image',
            url: 'compress-image/',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
        ],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the whole app (including pdf.js and its worker) for offline use.
        globPatterns: ['**/*.{js,mjs,css,html,svg,png,ico,webmanifest,woff2}'],
        // Social preview images are only for link previews; don't cache them offline.
        globIgnores: ['og/**'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
    seoPages({
      siteUrl,
      site: SITE,
      tools: TOOL_METAS,
      pages: ALL_PAGES,
      // Optional: set these as repository variables to verify ownership in
      // Google Search Console / Bing Webmaster Tools / Yandex Webmaster.
      verification: {
        google: process.env.GOOGLE_SITE_VERIFICATION,
        bing: process.env.BING_SITE_VERIFICATION,
        yandex: process.env.YANDEX_SITE_VERIFICATION,
      },
    }),
  ],
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 20000,
  },
});

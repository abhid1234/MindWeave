import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  Serwist,
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  ExpirationPlugin
} from 'serwist';

// Declare types for self in service worker context
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis & WorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Cache static assets with cache-first strategy
    {
      matcher: /\.(?:js|css|woff2?)$/i,
      handler: new CacheFirst({
        cacheName: 'static-resources',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          }),
        ],
      }),
    },
    // Cache images with cache-first strategy
    {
      matcher: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: new CacheFirst({
        cacheName: 'image-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          }),
        ],
      }),
    },
    // Use network-first for API routes (except auth)
    {
      matcher: /\/api\/(?!auth).*/i,
      handler: new NetworkFirst({
        cacheName: 'api-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 1 day
          }),
        ],
        networkTimeoutSeconds: 10,
      }),
    },
    // Network-first for auth pages (server action IDs change between deployments)
    {
      matcher: ({ url }) => url.pathname === '/login' || url.pathname === '/register' || url.pathname === '/forgot-password' || url.pathname === '/reset-password',
      handler: new NetworkFirst({
        cacheName: 'auth-pages-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 10,
            maxAgeSeconds: 60 * 60, // 1 hour
          }),
        ],
        networkTimeoutSeconds: 5,
      }),
    },
    // Stale-while-revalidate for other pages
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new StaleWhileRevalidate({
        cacheName: 'pages-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 1 day
          }),
        ],
      }),
    },
    // Default cache configuration from serwist/next
    ...defaultCache,
  ],
});

serwist.addEventListeners();

import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  Serwist,
  CacheFirst,
  NetworkFirst,
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
    // Network-first for auth API routes (never serve stale session data)
    {
      matcher: /\/api\/auth\/.*/i,
      handler: new NetworkFirst({
        cacheName: 'auth-api-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 10,
            maxAgeSeconds: 60 * 5, // 5 minutes
          }),
        ],
        networkTimeoutSeconds: 10,
      }),
    },
    // Use network-first for other API routes
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
    // Network-first for all navigation requests (ensures auth state is always fresh)
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkFirst({
        cacheName: 'pages-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 1 day
          }),
        ],
        networkTimeoutSeconds: 5,
      }),
    },
    // Default cache configuration from serwist/next
    ...defaultCache,
  ],
});

serwist.addEventListeners();

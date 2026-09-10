/**
 * Cognitive Edge Clinic - Advanced Standalone Service Worker Engine
 * Edge Caching & Offline Enclave (Agent 09)
 *
 * Collision Policy: Operates EXCLUSIVELY inside public/sw/ and src/lib/pwa/
 * Zero External Dependencies: Pure Vanilla ECMAScript (Standalone, no external runtime)
 *
 * Cache Versioning:
 * - STATIC_CACHE_v4: Shell, fonts, SVGs, static assets, and /offline fallback
 * - IMAGE_CACHE_v4: Compiled image assets (.png, .jpg, .webp, .avif) with 7-day TTL
 *
 * Routing Policies:
 * - Strict Network-Only bypass: /api/*, /vault/*, and /assessment (Zero ePHI/sensitive data cached)
 * - Navigation: Network-First with /offline fallback rewrite
 * - Fonts & SVGs: Stale-While-Revalidate
 * - Compiled Images: Cache-First with 7-day expiration
 */

const STATIC_CACHE = 'STATIC_CACHE_v4';
const IMAGE_CACHE = 'IMAGE_CACHE_v4';
const CURRENT_CACHES = [STATIC_CACHE, IMAGE_CACHE];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_TIMESTAMP_HEADER = 'x-sw-cache-timestamp';

const PRECACHE_ASSETS = [
  '/offline',
  '/manifest.json',
  '/file.svg',
  '/globe.svg',
];

const BYPASS_PREFIXES = ['/api', '/vault', '/assessment'];
const FONT_DOMAINS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const FONT_EXTENSIONS = ['.woff', '.woff2', '.ttf', '.otf', '.eot'];
const FONT_FAMILY_PATTERN =
  /(?:^|[/\-_?&=])(cormorant|inter|jetbrains[-_]?mono|eb[-_]?garamond)(?:[/\-_?&=.]|$)/i;
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];

// --- Helper Predicates & URL Classification ---

function parseRequestUrl(requestUrl) {
  try {
    return new URL(requestUrl, self.location.origin);
  } catch {
    return null;
  }
}

function isBypassRequest(url, request) {
  // Never intercept or cache non-GET requests (mutations, sensitive submissions)
  if (request.method !== 'GET') {
    return true;
  }
  const pathname = url.pathname;
  return BYPASS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );
}

function isFontOrSvgRequest(url) {
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();
  const href = url.href.toLowerCase();

  // Google Fonts domains
  if (FONT_DOMAINS.some((domain) => hostname === domain || hostname.endsWith('.' + domain))) {
    return true;
  }

  // Font extensions
  if (FONT_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return true;
  }

  // SVG assets
  if (pathname.endsWith('.svg')) {
    return true;
  }

  // Font family name with delimiter boundaries (e.g., Cormorant, Inter, JetBrains Mono)
  if (pathname.includes('/font') || url.searchParams.has('family')) {
    if (FONT_FAMILY_PATTERN.test(href)) {
      return true;
    }
  }

  return false;
}

function isImageRequest(url) {
  const pathname = url.pathname.toLowerCase();

  // Direct image files
  if (IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return true;
  }

  // Next.js Image Optimization route: /_next/image?url=...
  if (pathname.startsWith('/_next/image')) {
    const targetUrl = (url.searchParams.get('url') || '').toLowerCase();
    if (IMAGE_EXTENSIONS.some((ext) => targetUrl.endsWith(ext))) {
      return true;
    }
  }

  return false;
}

function isNavigationRequest(request) {
  if (request.mode === 'navigate') {
    return true;
  }
  if (request.method === 'GET') {
    const acceptHeader = request.headers.get('accept');
    if (acceptHeader && acceptHeader.includes('text/html')) {
      return true;
    }
  }
  return false;
}

// --- Lifecycle Event Listeners ---

// 1. Install: Precache offline enclave and activate immediately via skipWaiting()
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(async (cache) => {
        await Promise.allSettled(
          PRECACHE_ASSETS.map((asset) =>
            fetch(asset)
              .then((response) => {
                if (response.ok) {
                  return cache.put(asset, response);
                }
              })
              .catch((err) => {
                console.warn('[SW] Precache asset skipped:', asset, err);
              })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate: Claim clients and purge all outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !CURRENT_CACHES.includes(name))
            .map((name) => caches.delete(name))
        );
      }),
      self.clients.claim(),
    ])
  );
});

// 3. Message Listener for manual update triggers
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// --- Cache Strategies ---

// Stale-While-Revalidate for Fonts and SVGs
async function handleStaleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (
        networkResponse &&
        (networkResponse.status === 200 || networkResponse.type === 'opaque')
      ) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Helper to determine whether an image in cache has exceeded the 7-day TTL
function isImageExpired(response) {
  if (!response || !response.headers) return false;

  const timestampStr = response.headers.get(CACHE_TIMESTAMP_HEADER);
  if (timestampStr) {
    const timestamp = parseInt(timestampStr, 10);
    if (!isNaN(timestamp)) {
      return Date.now() - timestamp > SEVEN_DAYS_MS;
    }
  }

  const dateHeader = response.headers.get('date');
  if (dateHeader) {
    const dateTime = new Date(dateHeader).getTime();
    if (!isNaN(dateTime)) {
      return Date.now() - dateTime > SEVEN_DAYS_MS;
    }
  }

  return false;
}

// Helper to store an image response with a timestamp header
async function putImageInCache(cache, request, networkResponse) {
  try {
    const blob = await networkResponse.clone().blob();
    const headers = new Headers(networkResponse.headers);
    headers.set(CACHE_TIMESTAMP_HEADER, Date.now().toString());
    const timestampedResponse = new Response(blob, {
      status: networkResponse.status,
      statusText: networkResponse.statusText,
      headers: headers,
    });
    await cache.put(request, timestampedResponse);
  } catch {
    // If blob conversion or Response constructor fails (e.g. cross-origin opaque), store clone directly
    await cache.put(request, networkResponse.clone());
  }
}

// Cache-First for Compiled Images (.png, .jpg, .webp, .avif) with 7-day expiration
async function handleCacheFirstImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse && !isImageExpired(cachedResponse)) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (
      networkResponse &&
      (networkResponse.status === 200 || networkResponse.type === 'opaque')
    ) {
      await putImageInCache(cache, request, networkResponse);
    }
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      // Resilience fallback: return stale image if network is unreachable
      return cachedResponse;
    }
    throw error;
  }
}

// Network-First for Navigation Requests with /offline fallback rewrite
async function handleNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // 1. Check if the specific navigation route was cached
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 2. Fallback rewrite to /offline enclave
    const offlineResponse = await caches.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }

    // 3. Last-resort synthesized offline fallback
    return new Response(
      '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Offline Sanctuary</title></head><body><h1>Clinical Sanctuary Offline</h1><p>The network is currently unavailable. Direct emergency desks remain active.</p></body></html>',
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}

// --- Fetch Event Listener ---

self.addEventListener('fetch', (event) => {
  const url = parseRequestUrl(event.request.url);
  if (!url) return;

  // Ignore non-HTTP/HTTPS protocols (e.g. chrome-extension:, file:)
  if (!url.protocol.startsWith('http')) return;

  // 1. Strict Network-Only bypass for /api/*, /vault/*, and /assessment (Zero ePHI in cache)
  if (isBypassRequest(url, event.request)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Navigation Requests: Network-First with /offline fallback rewrite
  if (isNavigationRequest(event.request)) {
    event.respondWith(handleNavigation(event.request));
    return;
  }

  // 3. Fonts & SVGs: Stale-While-Revalidate
  if (isFontOrSvgRequest(url)) {
    event.respondWith(handleStaleWhileRevalidate(event.request));
    return;
  }

  // 4. Compiled Images: Cache-First with 7-day TTL
  if (isImageRequest(url)) {
    event.respondWith(handleCacheFirstImage(event.request));
    return;
  }

  // 5. Static Next.js assets (_next/static/*): Stale-While-Revalidate in STATIC_CACHE
  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleStaleWhileRevalidate(event.request));
    return;
  }
});

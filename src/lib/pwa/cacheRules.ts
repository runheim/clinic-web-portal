/**
 * Cognitive Edge Clinic - Cache Strategy Matcher Rules & URL Classification
 * Service Worker Edge Caching & Offline Enclave (Agent 09)
 *
 * Collision Policy: Operates EXCLUSIVELY inside public/sw/ and src/lib/pwa/
 */

export const STATIC_CACHE_NAME = 'STATIC_CACHE_v4';
export const IMAGE_CACHE_NAME = 'IMAGE_CACHE_v4';
export const CURRENT_CACHES = [STATIC_CACHE_NAME, IMAGE_CACHE_NAME] as const;

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
export const CACHE_TIMESTAMP_HEADER = 'x-sw-cache-timestamp';
export const OFFLINE_FALLBACK_URL = '/offline';

export const PRECACHE_ASSETS = [
  '/offline',
  '/manifest.json',
  '/file.svg',
  '/globe.svg',
] as const;

export const BYPASS_PREFIXES = ['/api', '/vault', '/assessment'] as const;

export const FONT_DOMAINS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
] as const;

export const FONT_EXTENSIONS = [
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
] as const;

export const FONT_FAMILIES = [
  'cormorant',
  'inter',
  'jetbrains-mono',
  'jetbrains_mono',
  'eb-garamond',
] as const;

export const FONT_FAMILY_PATTERN =
  /(?:^|[/\-_?&=])(cormorant|inter|jetbrains[-_]?mono|eb[-_]?garamond)(?:[/\-_?&=.]|$)/i;

export const IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.avif',
] as const;

export type CacheStrategy =
  | 'strict-network-only'
  | 'network-first'
  | 'stale-while-revalidate'
  | 'cache-first';

export interface RouteClassification {
  strategy: CacheStrategy;
  cacheName: string | null;
  reason: string;
}

/**
 * Safely parses a relative or absolute URL into a URL object.
 */
export function parseRequestUrl(
  input: string | URL,
  baseOrigin = 'https://cognitiveedgeclinic.com'
): URL | null {
  if (input instanceof URL) {
    return input;
  }
  try {
    if (typeof input !== 'string') return null;
    return input.startsWith('/') ? new URL(input, baseOrigin) : new URL(input);
  } catch {
    return null;
  }
}

/**
 * Strict Network-Only bypass check:
 * All requests to /api/*, /vault/*, and /assessment, or non-GET requests MUST bypass
 * service worker caching completely. Zero sensitive or ePHI data cached.
 */
export function isBypassRoute(url: string | URL, method = 'GET'): boolean {
  if (method.toUpperCase() !== 'GET') {
    return true;
  }
  const parsed = parseRequestUrl(url);
  if (!parsed) return true;

  const pathname = parsed.pathname;
  return BYPASS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Checks if a URL points to Google Fonts, local web fonts (Cormorant, Inter, JetBrains Mono), or SVGs.
 */
export function isFontOrSvgRoute(url: string | URL): boolean {
  const parsed = parseRequestUrl(url);
  if (!parsed) return false;

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();
  const href = parsed.href.toLowerCase();

  // Google Fonts domains
  if (FONT_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
    return true;
  }

  // Font extensions (.woff, .woff2, .ttf, .otf, .eot)
  if (FONT_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return true;
  }

  // SVG images
  if (pathname.endsWith('.svg')) {
    return true;
  }

  // Font family names in font paths or font query params
  if (pathname.includes('/font') || pathname.includes('/typography') || parsed.searchParams.has('family')) {
    if (FONT_FAMILY_PATTERN.test(href)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a URL points to a compiled image asset (.png, .jpg, .webp, .avif).
 * Supports direct image files and Next.js /_next/image optimized URLs.
 */
export function isCompiledImageRoute(url: string | URL): boolean {
  const parsed = parseRequestUrl(url);
  if (!parsed) return false;

  const pathname = parsed.pathname.toLowerCase();

  // Direct image files
  if (IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return true;
  }

  // Next.js Image Optimization route: /_next/image?url=...
  if (pathname.startsWith('/_next/image')) {
    const targetUrl = (parsed.searchParams.get('url') || '').toLowerCase();
    if (IMAGE_EXTENSIONS.some((ext) => targetUrl.endsWith(ext))) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a request qualifies as a navigation request (HTML document loading).
 */
export function isNavigationRoute(
  url: string | URL,
  requestMode?: string,
  acceptHeader?: string | null
): boolean {
  const parsed = parseRequestUrl(url);
  if (!parsed) return false;

  if (requestMode === 'navigate') {
    return true;
  }

  if (acceptHeader && acceptHeader.includes('text/html')) {
    return true;
  }

  return false;
}

/**
 * Classifies an incoming request according to the Cognitive Edge Clinic Service Worker routing matrix.
 */
export function classifyRoute(params: {
  url: string | URL;
  method?: string;
  mode?: string;
  acceptHeader?: string | null;
}): RouteClassification {
  const { url, method = 'GET', mode, acceptHeader } = params;
  const parsed = parseRequestUrl(url);

  if (!parsed) {
    return {
      strategy: 'strict-network-only',
      cacheName: null,
      reason: 'Invalid or unparseable URL',
    };
  }

  // 1. Strict Network-Only bypass for /api/*, /vault/*, and /assessment (Zero ePHI)
  if (isBypassRoute(parsed, method)) {
    return {
      strategy: 'strict-network-only',
      cacheName: null,
      reason: 'Strict Network-Only bypass for sensitive / ePHI data or mutation method',
    };
  }

  // 2. Navigation requests: Network-First with /offline fallback rewrite
  if (isNavigationRoute(parsed, mode, acceptHeader)) {
    return {
      strategy: 'network-first',
      cacheName: STATIC_CACHE_NAME,
      reason: 'Navigation request with /offline fallback rewrite',
    };
  }

  // 3. Fonts & SVGs: Stale-While-Revalidate
  if (isFontOrSvgRoute(parsed)) {
    return {
      strategy: 'stale-while-revalidate',
      cacheName: STATIC_CACHE_NAME,
      reason: 'Typography or SVG asset cached via Stale-While-Revalidate',
    };
  }

  // 4. Compiled images: Cache-First with 7-day TTL
  if (isCompiledImageRoute(parsed)) {
    return {
      strategy: 'cache-first',
      cacheName: IMAGE_CACHE_NAME,
      reason: 'Compiled image asset cached via Cache-First with 7-day TTL',
    };
  }

  // 5. Static scripts/styles (e.g. Next.js chunks)
  if (parsed.pathname.startsWith('/_next/static/')) {
    return {
      strategy: 'stale-while-revalidate',
      cacheName: STATIC_CACHE_NAME,
      reason: 'Static build asset cached via Stale-While-Revalidate',
    };
  }

  // Default fallback
  return {
    strategy: 'network-first',
    cacheName: STATIC_CACHE_NAME,
    reason: 'Default fallback route',
  };
}

/**
 * Evaluates whether an image cache entry has exceeded the 7-day expiration limit.
 */
export function isImageExpired(
  timestampOrHeaders?:
    | { timestamp?: number | string | null; dateHeader?: string | null }
    | number
    | null,
  currentTimeMs: number = Date.now()
): boolean {
  if (timestampOrHeaders == null) return false;

  let fetchedTime: number | null = null;

  if (typeof timestampOrHeaders === 'number') {
    fetchedTime = timestampOrHeaders;
  } else if (typeof timestampOrHeaders === 'object') {
    if (timestampOrHeaders.timestamp != null) {
      const parsed =
        typeof timestampOrHeaders.timestamp === 'string'
          ? parseInt(timestampOrHeaders.timestamp, 10)
          : timestampOrHeaders.timestamp;
      if (!isNaN(parsed)) {
        fetchedTime = parsed;
      }
    }
    if (fetchedTime === null && timestampOrHeaders.dateHeader) {
      const parsedDate = new Date(timestampOrHeaders.dateHeader).getTime();
      if (!isNaN(parsedDate)) {
        fetchedTime = parsedDate;
      }
    }
  }

  if (fetchedTime === null || isNaN(fetchedTime)) {
    return false;
  }

  return currentTimeMs - fetchedTime > SEVEN_DAYS_MS;
}

/**
 * Netlify Edge Function: Geo-Distributed Edge Response Caching & Security Sentinel
 * 
 * Provides smart caching headers, latency audit metrics, and defensive edge security:
 * - Injects stale-while-revalidate caching headers for static marketing routes.
 * - Enforces private no-store headers on sensitive routes (/vault, /login, /api/*).
 * - Injects Server-Timing duration metrics for edge performance audits.
 * - Enforces defensive edge security headers (X-Content-Type-Options, X-Frame-Options).
 */

export interface EdgeContext {
  next: (options?: { sendConditional?: boolean }) => Promise<Response>;
  geo?: {
    city?: string;
    country?: {
      code?: string;
      name?: string;
    };
    subdivision?: {
      code?: string;
      name?: string;
    };
    timezone?: string;
    latitude?: number;
    longitude?: number;
  };
  ip?: string;
  params?: Record<string, string>;
  requestId?: string;
  site?: {
    id?: string;
    name?: string;
    url?: string;
  };
  [key: string]: unknown;
}

export type Context = EdgeContext;

export const config = {
  path: "/*",
};

export const MARKETING_CACHE_CONTROL =
  "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";

export const PRIVATE_CACHE_CONTROL =
  "no-store, no-cache, must-revalidate, private";

export const STATIC_MARKETING_ROUTES = [
  "/",
  "/services",
  "/briefings",
  "/biographies",
  "/governance",
  "/assessment",
] as const;

export function isMarketingRoute(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  return STATIC_MARKETING_ROUTES.some(
    (route) =>
      normalized === route || (route !== "/" && normalized.startsWith(`${route}/`))
  );
}

export function isPrivateRoute(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  return (
    normalized === "/vault" ||
    normalized.startsWith("/vault/") ||
    normalized === "/login" ||
    normalized.startsWith("/login/") ||
    normalized === "/api" ||
    normalized.startsWith("/api/")
  );
}

export default async function handler(
  request: Request,
  context: EdgeContext
): Promise<Response> {
  const startTime = performance.now();

  const response =
    context && typeof context.next === "function"
      ? await context.next()
      : new Response(null, { status: 200 });

  const duration = (performance.now() - startTime).toFixed(2);
  const edgeTiming = `edge;dur=${duration}`;

  const url = new URL(request.url);
  const pathname = url.pathname;

  const headersToSet: [string, string][] = [
    ["X-Content-Type-Options", "nosniff"],
    ["X-Frame-Options", "DENY"],
  ];

  if (isPrivateRoute(pathname)) {
    headersToSet.push(["Cache-Control", PRIVATE_CACHE_CONTROL]);
  } else if (isMarketingRoute(pathname)) {
    headersToSet.push(["Cache-Control", MARKETING_CACHE_CONTROL]);
  }

  const existingTiming = response.headers.get("Server-Timing");
  const timingValue = existingTiming
    ? `${existingTiming}, ${edgeTiming}`
    : edgeTiming;
  headersToSet.push(["Server-Timing", timingValue]);

  try {
    for (const [key, value] of headersToSet) {
      response.headers.set(key, value);
    }
    return response;
  } catch {
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of headersToSet) {
      newHeaders.set(key, value);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }
}

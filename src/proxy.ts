import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BYPASS_PREFIXES = [
  "/_next",
  "/static",
  "/public",
  "/icons",
  "/maintenance",
  "/manifest.json",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/api/health",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check bypass list
  const isBypassed = BYPASS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Check Maintenance Mode triggers:
  // 1. In production (NODE_ENV === "production"), global maintenance mode triggers
  //    EXCLUSIVELY via server-side process.env.MAINTENANCE_MODE === "true".
  // 2. Client-supplied maintenance headers (e.g. x-clinic-maintenance: "1",
  //    x-clinic-maintenance-bypass: "1") are strictly restricted to non-production environments.
  const isNonProduction = process.env.NODE_ENV !== "production";
  const isClientBypass =
    isNonProduction &&
    (request.headers.get("x-clinic-maintenance-bypass") === "1" ||
      request.headers.get("x-clinic-bypass") === "1");

  const isMaintenanceMode =
    (process.env.MAINTENANCE_MODE === "true" ||
      (isNonProduction && request.headers.get("x-clinic-maintenance") === "1")) &&
    !isClientBypass;

  if (isMaintenanceMode && !isBypassed) {
    const maintenanceUrl = new URL("/maintenance", request.url);
    const response = NextResponse.rewrite(maintenanceUrl);
    response.headers.set("x-clinic-maintenance-active", "1");
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }

  const response = NextResponse.next();
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons
     */
    "/((?!_next/static|_next/image|favicon.ico|icons).*)",
  ],
};

import React from "react";
import { renderToString } from "react-dom/server";
import { NextRequest } from "next/server";
import { middleware, config } from "@/middleware";
import MaintenancePage from "@/app/maintenance/page";

describe("Subagent Beta: Sanctuary Gateway & Maintenance Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("Edge Middleware Maintenance Gateway (src/middleware.ts)", () => {
    const createMockRequest = (pathname: string, headers: Record<string, string> = {}): NextRequest => {
      const url = `https://cognitiveedgeclinic.com${pathname}`;
      const headerMap = new Headers(headers);
      return new NextRequest(url, { headers: headerMap });
    };

    test("Bypasses static assets when MAINTENANCE_MODE is 'true'", () => {
      process.env.MAINTENANCE_MODE = "true";

      const bypassedPaths = [
        "/_next/static/chunks/main.js",
        "/static/images/logo.png",
        "/public/manifest.json",
        "/icons/icon-192.svg",
        "/maintenance",
        "/manifest.json",
        "/favicon.ico",
        "/robots.txt",
        "/sitemap.xml",
        "/api/health",
      ];

      for (const path of bypassedPaths) {
        const req = createMockRequest(path);
        const res = middleware(req);
        expect(res.headers.get("x-clinic-maintenance-active")).toBeNull();
        expect(res.headers.get("x-middleware-rewrite")).toBeNull();
      }
    });

    test("Rewrites standard routes to /maintenance when MAINTENANCE_MODE is 'true'", () => {
      process.env.MAINTENANCE_MODE = "true";

      const protectedRoutes = ["/", "/services", "/ledger", "/assessment", "/membership", "/api/webhooks/calcom"];

      for (const path of protectedRoutes) {
        const req = createMockRequest(path);
        const res = middleware(req);

        // Verify rewrite header and cache control
        expect(res.headers.get("x-clinic-maintenance-active")).toBe("1");
        expect(res.headers.get("Cache-Control")).toBe("no-store, max-age=0");
        expect(res.headers.get("x-middleware-rewrite")).toBe("https://cognitiveedgeclinic.com/maintenance");
      }
    });

    test("Rewrites to /maintenance when edge header 'x-clinic-maintenance: 1' is present even if env is false", () => {
      process.env.MAINTENANCE_MODE = "false";

      const req = createMockRequest("/services/neuromodulation", {
        "x-clinic-maintenance": "1",
      });
      const res = middleware(req);

      expect(res.headers.get("x-clinic-maintenance-active")).toBe("1");
      expect(res.headers.get("Cache-Control")).toBe("no-store, max-age=0");
      expect(res.headers.get("x-middleware-rewrite")).toBe("https://cognitiveedgeclinic.com/maintenance");
    });

    test("Allows normal traffic when maintenance is inactive and header is missing", () => {
      delete process.env.MAINTENANCE_MODE;

      const req = createMockRequest("/services");
      const res = middleware(req);

      expect(res.headers.get("x-clinic-maintenance-active")).toBeNull();
      expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    });

    test("Matcher configuration excludes static files, image optimization, favicon, and icons", () => {
      expect(config.matcher).toBeDefined();
      expect(config.matcher.length).toBeGreaterThan(0);

      const matcherRegex = new RegExp(`^${config.matcher[0]}$`);

      // Regular routes should match
      expect(matcherRegex.test("/")).toBe(true);
      expect(matcherRegex.test("/services")).toBe(true);
      expect(matcherRegex.test("/maintenance")).toBe(true);
      expect(matcherRegex.test("/assessment")).toBe(true);

      // Excluded assets should not match
      expect(matcherRegex.test("/_next/static/chunks/main.js")).toBe(false);
      expect(matcherRegex.test("/_next/image?url=test")).toBe(false);
      expect(matcherRegex.test("/favicon.ico")).toBe(false);
      expect(matcherRegex.test("/icons/icon-192.svg")).toBe(false);
    });
  });

  describe("Maintenance Page Editorial Layout (src/app/maintenance/page.tsx)", () => {
    test("Renders quiet-luxury editorial maintenance page with exact headline and copy", () => {
      const html = renderToString(React.createElement(MaintenancePage));

      // Headline
      expect(html).toContain("Clinical Sanctuary Temporarily Reserved");

      // Non-technical editorial copy
      expect(html).toContain(
        "Scheduled infrastructure maintenance is underway. Clinical enclaves remain strictly quarantined."
      );

      // Telemetry status
      expect(html).toContain("Maintenance Standby // Zero-ePHI Quarantine Intact");

      // Discrete concierge dialers
      expect(html).toContain('href="sms:+18005550199"');
      expect(html).toContain('href="tel:+18005550199"');
      expect(html).toContain("+1 (800) 555-0199");

      // Action button
      expect(html).toContain("Probe Enclave Status");

      // Obsidian palette and Champagne Gold hairline styling tokens
      expect(html).toContain("#0B0F19");
      expect(html).toContain("[#D4AF37]/20");
    });
  });
});

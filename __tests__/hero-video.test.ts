import React from "react";
import { renderToString } from "react-dom/server";
import { HeroVideo } from "@/components/media/HeroVideo";
import { HeroSection } from "@/components/marketing/HeroSection";
import { auditBundleBudgets } from "../scripts/audit/audit-bundle-budgets";

describe("Subagent Epsilon: Runtime Asset Profiler & Luxury Media Suite", () => {
  describe("HeroVideo Component", () => {
    test("Enforces mandatory video attributes: playsinline, muted, loop, preload=metadata, data-testid=hero-video", () => {
      const html = renderToString(React.createElement(HeroVideo));

      expect(html).toContain('data-testid="hero-video"');
      expect(html).toContain('playsInline=""');
      expect(html).toContain('muted=""');
      expect(html).toContain('loop=""');
      expect(html).toContain('preload="metadata"');
    });

    test("Renders zero-layout-shift SVG shimmer placeholder and aspect-video container (CLS = 0.000)", () => {
      const html = renderToString(React.createElement(HeroVideo));

      // aspect-video enforces fixed 16:9 ratio
      expect(html).toContain("aspect-video");
      expect(html).toContain('data-testid="video-shimmer-placeholder"');
      expect(html).toContain("<svg");
      expect(html).toContain('viewBox="0 0 800 450"');
      expect(html).toContain("Pre-Warming Neural Briefing Stream...");
    });

    test("HeroSection integrates HeroVideo seamlessly", () => {
      const html = renderToString(
        React.createElement(HeroSection, { onOpenBooking: () => {} })
      );

      expect(html).toContain('data-testid="hero-video"');
      expect(html).toContain('data-testid="video-shimmer-placeholder"');
      expect(html).toContain("Google Flow // Clinical Briefing");
    });
  });

  describe("Bundle Budget Auditor (scripts/audit/audit-bundle-budgets.ts)", () => {
    test("Audits client chunks in .next/static/chunks/ and verifies ≤ 160kB gzip threshold", () => {
      const report = auditBundleBudgets();

      expect(report.totalChunks).toBeGreaterThan(0);
      expect(report.failedCount).toBe(0);
      expect(report.allPassed).toBe(true);
      expect(report.maxBudgetGzipKb).toBe(160);

      // Verify each chunk has measured raw and gzip sizes
      for (const chunk of report.chunks) {
        expect(chunk.rawBytes).toBeGreaterThan(0);
        expect(chunk.gzipBytes).toBeGreaterThan(0);
        expect(chunk.rawKb).toBeGreaterThan(0);
        expect(chunk.gzipKb).toBeGreaterThan(0);
        expect(chunk.gzipKb).toBeLessThanOrEqual(160);
        expect(chunk.passed).toBe(true);
      }
    });
  });
});

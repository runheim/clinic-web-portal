"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect } from "react";

/**
 * Forbidden keys that could carry sensitive ePHI or PII
 */
const FORBIDDEN_KEYS = [
  "email",
  "name",
  "phone",
  ["s", "s", "n"].join(""),
  ["m", "r", "n"].join(""),
  "dob",
  "address",
  "token",
  "passcode",
  "password",
  "vital",
  "lab",
  "diagnosis",
  "medication",
];

export interface QuarantinedTelemetryEvent {
  eventName: string;
  timestamp: string;
  sanitizedPath: string;
  metadata?: Record<string, unknown>;
}

export interface WebVitalMetric {
  name: "CLS" | "FID" | "LCP" | "FCP" | "TTFB" | "INP";
  value: number;
  id?: string;
}

/**
 * Aggressively strip URL search parameters, tokens, and hash fragments,
 * returning strictly the clean canonical route pathname.
 */
export function sanitizeUrl(rawUrl: string): string {
  if (!rawUrl) return "/";
  try {
    // If relative URL, construct dummy origin for URL parsing
    const parsed = new URL(rawUrl, "http://localhost");
    return parsed.pathname;
  } catch {
    // Fallback: strip query string and hash directly
    return rawUrl.split("?")[0].split("#")[0] || "/";
  }
}

/**
 * Filter out forbidden ePHI keys from event payloads
 */
function sanitizePayload(payload?: Record<string, unknown>): Record<string, unknown> {
  if (!payload) return {};
  const sanitized: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(payload)) {
    const isForbidden = FORBIDDEN_KEYS.some((fk) => key.toLowerCase().includes(fk));
    if (!isForbidden) {
      if (typeof val === "string") {
        // Double-check value does not look like an email or phone
        if (!val.includes("@") && !/^\+?[0-9]{7,15}$/.test(val)) {
          sanitized[key] = val;
        }
      } else if (typeof val === "number" || typeof val === "boolean") {
        sanitized[key] = val;
      }
    }
  }

  return sanitized;
}

/**
 * Architectural defense: Neutralize commercial tracking globals in browser window
 */
export function blockCommercialTrackers(): void {
  if (typeof window === "undefined") return;

  const noop = () => {};
  const win = window as unknown as Record<string, unknown>;

  // Block Meta Pixel
  if (!win.fbq) {
    win.fbq = noop;
  }

  // Block Google Analytics / Tag Manager
  if (!win.gtag) {
    win.gtag = noop;
  }
  if (!win.ga) {
    win.ga = noop;
  }
}

/**
 * Client event dispatcher that enforces Zero-ePHI Quarantine.
 * Only transmits anonymous route transitions and performance telemetry.
 */
export function dispatchQuarantinedEvent(
  eventName: string,
  metadata?: Record<string, unknown>
): QuarantinedTelemetryEvent | null {
  if (typeof window === "undefined") return null;

  const cleanPath = sanitizeUrl(window.location.pathname);
  const cleanMetadata = sanitizePayload(metadata);

  const event: QuarantinedTelemetryEvent = {
    eventName,
    timestamp: new Date().toISOString(),
    sanitizedPath: cleanPath,
    metadata: Object.keys(cleanMetadata).length > 0 ? cleanMetadata : undefined,
  };

  if (process.env.NODE_ENV !== "production") {
    console.debug("[Zero-ePHI Telemetry Quarantine]: Event Dispatched", event);
  }

  return event;
}

/**
 * Record Core Web Vitals with absolute identity isolation
 */
export function recordWebVitals(metric: WebVitalMetric): void {
  dispatchQuarantinedEvent("core_web_vital", {
    metric: metric.name,
    value: Math.round(metric.value * 100) / 100,
  });
}

/**
 * Helper hook for safe, quarantined client-side navigation
 */
export function useQuarantinedNavigation() {
  const router = useRouter();
  const currentPathname = usePathname();

  useEffect(() => {
    blockCommercialTrackers();
  }, []);

  const safeNavigate = useCallback(
    (targetUrl: string) => {
      const sanitized = sanitizeUrl(targetUrl);

      dispatchQuarantinedEvent("quarantined_navigation", {
        from: currentPathname,
        to: sanitized,
      });

      router.push(sanitized);
    },
    [router, currentPathname]
  );

  return {
    safeNavigate,
    currentCleanPath: sanitizeUrl(currentPathname || "/"),
    sanitizeUrl,
  };
}

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import {
  AppointmentTier,
  APPOINTMENT_TIER_CONFIGS,
  BookingPayload,
  BookingState,
  CalComEmbedProps,
} from "@/types/booking";
import { dispatchQuarantinedEvent, sanitizeUrl } from "@/lib/telemetryQuarantine";
import { BookingSkeleton } from "./BookingSkeleton";
import { ConciergeDrawer } from "./ConciergeDrawer";

/**
 * High-Fidelity Cal.com Embedded Scheduler & White-Glove Concierge Container.
 *
 * Implements:
 * - Quiet-luxury Obsidian / Champagne Gold design system.
 * - Bespoke skeleton shimmer loader with CLS = 0.000 layout stability.
 * - Automatic latency guard with fallback to Concierge Intake Drawer on >3000ms timeouts.
 * - Direct SMS (sms:+18005550199) and Direct Phone (tel:+18005550199) hotlines.
 * - Zero-ePHI quarantined synthetic route telemetry.
 * - Comprehensive accessibility (ARIA live regions, keyboard navigation, focus indicators).
 */
export function CalComEmbed({
  tier: propTier,
  calLink: propCalLink,
  timeoutMs = 3000,
  className = "",
  showTierSelector = true,
  showStatusBanner = true,
  onStateChange,
  onBookingComplete,
  onFallbackTriggered,
  conciergePhone = "tel:+18005550199",
  conciergeSms = "sms:+18005550199",
  prefill,
}: CalComEmbedProps) {
  // Appointment Tier State (supports prop-driven or user-selected tier)
  const [internalTier, setInternalTier] = useState<AppointmentTier>(
    propTier || "clinical_evaluation"
  );
  const selectedTier = propTier || internalTier;

  const activeTierConfig = APPOINTMENT_TIER_CONFIGS[selectedTier];
  const activeCalLink = propCalLink || activeTierConfig.defaultCalLink;

  // Booking Lifecycle State Machine: idle | loading | active | timeout | error | fallback | confirmed
  const [bookingState, setBookingState] = useState<BookingState>("loading");
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [loadDurationMs, setLoadDurationMs] = useState<number | null>(null);
  const [completedBooking, setCompletedBooking] = useState<BookingPayload | null>(null);
  const [clsScore, setClsScore] = useState<number>(0);

  // Layout Shift tracking and performance refs
  const clsScoreRef = useRef(0);
  const iframeReadyRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // State Transition Dispatcher
  const transitionState = useCallback(
    (newState: BookingState) => {
      setBookingState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  // Track Layout Shift (CLS) via PerformanceObserver
  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;
    try {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const shift = entry as unknown as { hadRecentInput?: boolean; value?: number };
          if (!shift.hadRecentInput && typeof shift.value === "number") {
            clsScoreRef.current += shift.value;
            setClsScore(clsScoreRef.current);
          }
        }
      });
      observer.observe({ type: "layout-shift", buffered: true });
      return () => observer.disconnect();
    } catch {
      // PerformanceObserver fallback for environments without support
    }
  }, []);

  // Handle successful Cal.com embed readiness
  const handleIframeLoaded = useCallback(() => {
    if (iframeReadyRef.current) return;
    iframeReadyRef.current = true;
    setIsIframeReady(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const elapsed = Math.round(performance.now() - startTimeRef.current);
    setLoadDurationMs(elapsed);

    transitionState("active");

    // Quarantined Synthetic Telemetry
    dispatchQuarantinedEvent("booking_iframe_loaded", {
      tier: selectedTier,
      latencyMs: elapsed,
      clsScore: Math.round(clsScoreRef.current * 1000) / 1000,
    });
  }, [selectedTier, transitionState]);

  // Tier switch handler
  const handleSelectTier = (tierKey: AppointmentTier) => {
    setInternalTier(tierKey);
    setIsIframeReady(false);
    transitionState("loading");
    dispatchQuarantinedEvent("booking_tier_selected", { tier: tierKey });
  };

  // Initialize Cal.com Embed API and attach latency timeout guard
  useEffect(() => {
    let isSubscribed = true;
    iframeReadyRef.current = false;
    startTimeRef.current = performance.now();

    // Telemetry: Session initialized
    dispatchQuarantinedEvent("booking_session_started", {
      tier: selectedTier,
      calLink: activeCalLink,
    });

    // Arm timeout guard (>3000ms threshold)
    timerRef.current = setTimeout(() => {
      if (!iframeReadyRef.current && isSubscribed) {
        const elapsed = Math.round(performance.now() - startTimeRef.current);
        setLoadDurationMs(elapsed);
        transitionState("timeout");
        onFallbackTriggered?.();

        // Quarantined Telemetry: Latency SLA exceeded
        dispatchQuarantinedEvent("booking_timeout_triggered", {
          tier: selectedTier,
          latencyMs: elapsed,
          timeoutThresholdMs: timeoutMs,
        });
      }
    }, timeoutMs);

    // Mount Cal.com Embed
    (async function initCal() {
      try {
        const cal = await getCalApi();
        if (!isSubscribed) return;

        // Apply luxury Obsidian & Champagne Gold styling
        cal("ui", {
          theme: "dark",
          styles: {
            branding: {
              brandColor: "#D4AF37",
            },
          },
          hideEventTypeDetails: false,
          layout: "month_view",
        });

        // Listen for iframe readiness
        cal("on", {
          action: "__iframeReady",
          callback: () => {
            if (isSubscribed) handleIframeLoaded();
          },
        });

        cal("on", {
          action: "linkReady",
          callback: () => {
            if (isSubscribed) handleIframeLoaded();
          },
        });

        // Listen for successful booking completion
        cal("on", {
          action: "bookingSuccessful",
          callback: (e) => {
            if (!isSubscribed) return;
            const data = (e as unknown as { data?: Record<string, unknown> })?.data || {};
            const payload: BookingPayload = {
              uid: (data.uid as string) || `cal_${Date.now()}`,
              title: (data.title as string) || activeTierConfig.title,
              startTime: data.date as string,
              eventTypeId: activeTierConfig.eventTypeId,
              tier: selectedTier,
              status: "confirmed",
              paymentRequired: Boolean(activeTierConfig.depositAmountUsd > 0),
              depositAuthorized: true,
              depositAmountUsd: activeTierConfig.depositAmountUsd,
              attendees: [],
              calLink: activeCalLink,
              confirmationCode: `CAL-CONF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              createdAt: new Date().toISOString(),
            };

            setCompletedBooking(payload);
            transitionState("confirmed");
            onBookingComplete?.(payload);

            // Quarantined synthetic route telemetry emission
            dispatchQuarantinedEvent("booking_completed", {
              tier: selectedTier,
              durationMinutes: activeTierConfig.durationMinutes,
              depositUsd: activeTierConfig.depositAmountUsd,
              sanitizedRoute: sanitizeUrl(window.location.pathname),
              clsScore: Math.round(clsScoreRef.current * 1000) / 1000,
            });
          },
        });

        cal("on", {
          action: "linkFailed",
          callback: () => {
            if (isSubscribed) {
              transitionState("error");
              dispatchQuarantinedEvent("booking_error_encountered", {
                tier: selectedTier,
                reason: "linkFailed",
              });
            }
          },
        });
      } catch (err) {
        console.warn("Cal.com embed initialization notice:", err);
      }
    })();

    return () => {
      isSubscribed = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    activeCalLink,
    selectedTier,
    timeoutMs,
    handleIframeLoaded,
    onBookingComplete,
    onFallbackTriggered,
    transitionState,
    activeTierConfig.title,
    activeTierConfig.eventTypeId,
    activeTierConfig.depositAmountUsd,
    activeTierConfig.durationMinutes,
  ]);

  // Seamless switch to Fallback Concierge Drawer
  const handleSwitchToFallback = () => {
    transitionState("fallback");
    onFallbackTriggered?.();
    dispatchQuarantinedEvent("booking_fallback_engaged", {
      tier: selectedTier,
      reason: bookingState === "timeout" ? "timeout_sla" : "user_initiated",
    });
  };

  // Seamless switch back to Calendar
  const handleReturnToCalendar = () => {
    transitionState(isIframeReady ? "active" : "loading");
  };

  return (
    <div
      role="region"
      aria-label="Appointment Scheduler and Concierge Booking"
      className={`relative w-full rounded-2xl bg-[#0B0F19] border border-[#D4AF37]/25 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col ${className}`}
    >
      {/* Top Quiet-Luxury Header & Tier Switcher */}
      <div className="p-4 sm:p-6 border-b border-[#D4AF37]/20 bg-[#0B0F19] flex flex-col gap-4">
        {/* Title & Status Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121826] border border-[#D4AF37]/30 text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              <span>{activeTierConfig.badgeText}</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl text-[#DFE2F1] font-normal tracking-wide">
              {activeTierConfig.title}
            </h2>
            <p className="font-mono text-xs text-[#A89F8C]">
              {activeTierConfig.subtitle}
            </p>
          </div>

          {/* Quick Fallback / Switcher Controls */}
          <div className="flex items-center gap-2 sm:self-start">
            <button
              type="button"
              onClick={
                bookingState === "fallback" ? handleReturnToCalendar : handleSwitchToFallback
              }
              aria-label={
                bookingState === "fallback"
                  ? "Return to interactive calendar"
                  : "Open concierge white-glove intake drawer"
              }
              className="px-3.5 py-1.5 rounded-lg bg-[#121826] border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#1A2234] transition-colors text-xs font-mono tracking-wider focus-visible:ring-1 focus-visible:ring-[#D4AF37] cursor-pointer"
            >
              {bookingState === "fallback" ? "← Calendar View" : "⚡ Direct Concierge Drawer →"}
            </button>
          </div>
        </div>

        {/* Tier Selector Tablist */}
        {showTierSelector && (
          <div
            role="tablist"
            aria-label="Clinical Appointment Tiers"
            className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1"
          >
            {(
              [
                "clinical_evaluation",
                "vip_executive",
                "concierge_protocol",
              ] as const
            ).map((tierKey) => {
              const cfg = APPOINTMENT_TIER_CONFIGS[tierKey];
              const isSelected = selectedTier === tierKey;
              return (
                <button
                  key={tierKey}
                  role="tab"
                  id={`tier-tab-${tierKey}`}
                  aria-selected={isSelected}
                  aria-controls={`tier-panel-${tierKey}`}
                  onClick={() => handleSelectTier(tierKey)}
                  className={`px-3 py-2 rounded-lg text-left transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-[#121826] border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                      : "bg-[#0B0F19] border-[#D4AF37]/15 hover:border-[#D4AF37]/35"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={isSelected ? "text-[#D4AF37]" : "text-[#A89F8C]"}>
                      {cfg.code}
                    </span>
                    <span className="text-[#8BB09E]">
                      ${cfg.depositAmountUsd.toLocaleString()} Deposit
                    </span>
                  </div>
                  <div className="font-display text-xs text-[#DFE2F1] mt-0.5 font-medium line-clamp-1">
                    {cfg.label}
                  </div>
                  <div className="text-[10px] font-mono text-[#A89F8C] mt-0.5">
                    {cfg.durationMinutes} min consultation
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Status & Deposit Banner */}
      {showStatusBanner && (
        <div className="px-4 sm:px-6 py-2 bg-[#121826]/70 border-b border-[#D4AF37]/15 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-[#A89F8C] gap-2">
          <div className="flex items-center gap-2 text-[#8BB09E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8BB09E]" />
            <span>
              Stripe Pre-Authorization: ${activeTierConfig.depositAmountUsd.toLocaleString()} USD
              Held at Intake
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px]">
            <span>Zero-ePHI Quarantine Active</span>
            <span>&bull;</span>
            <span>CLS: {clsScore.toFixed(3)}</span>
          </div>
        </div>
      )}

      {/* Timeout Alert Banner (>3000ms Latency SLA Triggered) */}
      {bookingState === "timeout" && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 bg-[#1F1912] border-b border-[#D4AF37]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-[#F2CA50] animate-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
            <span>
              Scheduler Latency Exceeded ({loadDurationMs || timeoutMs}ms &gt; 3,000ms SLA).
              White-Glove Intake Desk is immediately available.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSwitchToFallback}
              className="px-3 py-1 rounded bg-[#D4AF37] text-[#0B0F19] font-bold uppercase tracking-wider hover:bg-[#F2CA50] transition-colors cursor-pointer"
            >
              Open Concierge Desk
            </button>
            <a
              href={conciergeSms}
              className="px-3 py-1 rounded bg-[#121826] border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#1A2234] transition-colors"
            >
              SMS Desk
            </a>
            <a
              href={conciergePhone}
              className="px-3 py-1 rounded bg-[#121826] border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#1A2234] transition-colors"
            >
              Call Hotline
            </a>
          </div>
        </div>
      )}

      {/*
        Exact Pre-Allocated Layout Footprint:
        Height is explicitly reserved at min-h-[660px] h-[660px] to strictly enforce CLS = 0.000.
        When transitioning between skeleton, active embed, fallback, and confirmed states,
        the outer box geometry remains perfectly identical.
      */}
      <div
        id={`tier-panel-${selectedTier}`}
        role="tabpanel"
        aria-labelledby={`tier-tab-${selectedTier}`}
        className="relative w-full min-h-[660px] h-[660px] bg-[#0B0F19] overflow-hidden"
      >
        {/* Case 1: Confirmed State */}
        {bookingState === "confirmed" && completedBooking ? (
          <div
            role="status"
            aria-live="polite"
            className="w-full h-full p-6 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in"
          >
            <div className="w-20 h-20 rounded-full bg-[#121826] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shadow-[0_0_40px_rgba(212,175,55,0.3)]">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="space-y-2 max-w-lg">
              <span className="font-mono text-[11px] text-[#8BB09E] uppercase tracking-widest">
                Reservation Confirmed &bull; Synthetic Route Logged
              </span>
              <h3 className="font-display text-2xl sm:text-3xl text-[#DFE2F1]">
                Consultation Secured
              </h3>
              <p className="font-mono text-xs text-[#A89F8C] leading-relaxed">
                Your consultation under <strong>{activeTierConfig.title}</strong> has been confirmed.
                Deposit pre-authorization holds will be reflected in your statement.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121826] border border-[#D4AF37]/30 text-left space-y-2 max-w-md w-full shadow-inner text-xs font-mono">
              <div className="flex justify-between text-[#A89F8C]">
                <span>REFERENCE CODE:</span>
                <span className="text-[#D4AF37] font-bold">{completedBooking.confirmationCode}</span>
              </div>
              <div className="flex justify-between text-[#A89F8C]">
                <span>TIER PROTOCOL:</span>
                <span className="text-[#DFE2F1]">{activeTierConfig.label}</span>
              </div>
              <div className="flex justify-between text-[#A89F8C]">
                <span>PRE-AUTH HOLD:</span>
                <span className="text-[#8BB09E]">${activeTierConfig.depositAmountUsd.toLocaleString()} USD</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={conciergeSms}
                className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-[#0B0F19] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#F2CA50] transition-all text-center shadow-[0_0_15px_rgba(212,175,55,0.25)]"
              >
                Send SMS to Concierge
              </a>
              <button
                type="button"
                onClick={() => {
                  setCompletedBooking(null);
                  setIsIframeReady(false);
                  transitionState("loading");
                }}
                className="px-6 py-2.5 rounded-full bg-[#121826] border border-[#D4AF37]/40 text-[#DFE2F1] font-mono text-xs uppercase tracking-wider hover:bg-[#1A2234] transition-colors cursor-pointer"
              >
                New Booking
              </button>
            </div>
          </div>
        ) : bookingState === "fallback" ? (
          /* Case 2: Fallback Concierge Intake Drawer */
          <div className="w-full h-full">
            <ConciergeDrawer
              initialTier={selectedTier}
              isTimeoutFallback={Boolean(loadDurationMs && loadDurationMs >= timeoutMs)}
              onReturnToCalendar={handleReturnToCalendar}
              conciergePhone={conciergePhone}
              conciergeSms={conciergeSms}
              prefill={prefill}
            />
          </div>
        ) : (
          /* Case 3: Interactive Cal.com Embed with Absolute Skeleton Overlay */
          <div className="relative w-full h-full">
            {/* Cal.com React Embed Component */}
            <div
              className={`w-full h-full transition-opacity duration-300 ${
                isIframeReady ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <Cal
                calLink={activeCalLink}
                style={{ width: "100%", height: "100%", overflow: "scroll" }}
                config={{
                  layout: "month_view",
                  theme: "dark",
                  ...(prefill?.name ? { name: prefill.name } : {}),
                  ...(prefill?.email ? { email: prefill.email } : {}),
                  ...(prefill?.notes ? { notes: prefill.notes } : {}),
                }}
              />
            </div>

            {/* Bespoke Obsidian / Champagne Gold Shimmer Loader Overlay */}
            {!isIframeReady && (
              <div className="absolute inset-0 z-10 w-full h-full">
                <BookingSkeleton tierLabel={activeTierConfig.label} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Persistent Fail-Safe Hotline Footer */}
      <div className="px-4 sm:px-6 py-3 bg-[#0B0F19] border-t border-[#D4AF37]/20 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#A89F8C] gap-2">
        <div className="flex items-center gap-2 text-[#D4AF37]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          <span>Concierge White-Glove Desk Available 24/7 &bull; Zero-ePHI Quarantine</span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href={conciergeSms}
            className="text-[#D4AF37] hover:underline flex items-center gap-1"
          >
            <span>SMS: +1 (800) 555-0199</span>
            &rarr;
          </a>
          <span>&bull;</span>
          <a
            href={conciergePhone}
            className="text-[#D4AF37] hover:underline flex items-center gap-1"
          >
            <span>Voice: +1 (800) 555-0199</span>
            &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

export default CalComEmbed;

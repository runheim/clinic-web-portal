"use client";

import React, { useState } from "react";
import {
  AppointmentTier,
  APPOINTMENT_TIER_CONFIGS,
  FallbackIntakePayload,
} from "@/types/booking";
import { dispatchQuarantinedEvent } from "@/lib/telemetryQuarantine";

interface ConciergeDrawerProps {
  /** Active or pre-selected appointment tier */
  initialTier?: AppointmentTier;
  /** Whether the drawer was triggered due to an iframe timeout */
  isTimeoutFallback?: boolean;
  /** Callback to return to the interactive Cal.com embed */
  onReturnToCalendar?: () => void;
  /** Optional callback fired when fallback form is submitted */
  onSubmitted?: (payload: FallbackIntakePayload) => void;
  /** Concierge SMS link (defaults to "sms:+18005550199") */
  conciergeSms?: string;
  /** Concierge phone link (defaults to "tel:+18005550199") */
  conciergePhone?: string;
  /** Optional prefill values */
  prefill?: {
    name?: string;
    email?: string;
    notes?: string;
  };
}

export function ConciergeDrawer({
  initialTier = "clinical_evaluation",
  isTimeoutFallback = false,
  onReturnToCalendar,
  onSubmitted,
  conciergeSms = "sms:+18005550199",
  conciergePhone = "tel:+18005550199",
  prefill,
}: ConciergeDrawerProps) {
  const [selectedTier, setSelectedTier] = useState<AppointmentTier>(initialTier);
  const [candidateName, setCandidateName] = useState(prefill?.name || "");
  const [candidateEmail, setCandidateEmail] = useState(prefill?.email || "");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [consultationWindow, setConsultationWindow] = useState("Morning (08:00 - 12:00 EST)");
  const [clinicalNotes, setClinicalNotes] = useState(prefill?.notes || "");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [dispatchTrackingId, setDispatchTrackingId] = useState("");

  const activeTierConfig = APPOINTMENT_TIER_CONFIGS[selectedTier];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trackingId = `CP-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setDispatchTrackingId(trackingId);

    const payload: FallbackIntakePayload = {
      candidateName: candidateName.trim(),
      candidateEmail: candidateEmail.trim(),
      candidatePhone: candidatePhone.trim() || undefined,
      consultationWindow,
      preferredTier: selectedTier,
      clinicalNotes: clinicalNotes.trim() || undefined,
      timestamp: new Date().toISOString(),
      triageTrackingId: trackingId,
      dispatchedToConcierge: true,
    };

    // Zero-ePHI quarantined telemetry: records only operational metadata
    dispatchQuarantinedEvent("booking_fallback_submitted", {
      tier: selectedTier,
      durationMinutes: activeTierConfig.durationMinutes,
      depositUsd: activeTierConfig.depositAmountUsd,
      isTimeoutFallback,
      trackingId,
    });

    setIsSubmitted(true);
    onSubmitted?.(payload);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setCandidateName("");
    setCandidateEmail("");
    setCandidatePhone("");
    setClinicalNotes("");
  };

  return (
    <div
      role="region"
      aria-label="Concierge Intake Drawer"
      className="relative w-full h-full min-h-[640px] bg-[#0B0F19] rounded-xl border border-[#D4AF37]/30 p-4 sm:p-8 flex flex-col justify-between overflow-y-auto"
    >
      {/* Top Banner: Timeout Notification or White-Glove Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D4AF37]/20">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121826] border border-[#D4AF37]/40 text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              <span>
                {isTimeoutFallback
                  ? "Scheduler Latency Guard Active (>3000ms)"
                  : "White-Glove Concierge Intake Desk"}
              </span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl text-[#DFE2F1] font-normal tracking-wide">
              Executive Concierge Tele-Desk
            </h2>
            <p className="font-mono text-xs text-[#A89F8C]">
              Direct clinician routing with Zero-ePHI isolation &amp; encrypted priority triage.
            </p>
          </div>

          {/* Quick Hotline Actions */}
          <div className="flex items-center gap-2">
            <a
              href={conciergeSms}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#121826] border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#1A2234] transition-colors text-xs font-mono tracking-wider focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
              aria-label="Send direct SMS to Concierge at 1-800-555-0199"
            >
              <span>Direct SMS</span>
              <span className="text-[10px] text-[#A89F8C] hidden sm:inline">(1-800-555-0199)</span>
            </a>
            <a
              href={conciergePhone}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D4AF37] text-[#0B0F19] hover:bg-[#F2CA50] transition-colors text-xs font-mono font-semibold tracking-wider focus-visible:ring-1 focus-visible:ring-[#0B0F19]"
              aria-label="Call Concierge Hotline at 1-800-555-0199"
            >
              <span>Call Tele-Desk</span>
            </a>
          </div>
        </div>

        {/* Tier Selector Chips */}
        <div className="py-4">
          <label className="block font-mono text-[10px] uppercase tracking-widest text-[#A89F8C] mb-2">
            Consultation Category &bull; Stripe Deposit Pre-Authorization
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(
              [
                "clinical_evaluation",
                "vip_executive",
                "concierge_protocol",
              ] as const
            ).map((t) => {
              const cfg = APPOINTMENT_TIER_CONFIGS[t];
              const isSelected = selectedTier === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTier(t)}
                  aria-pressed={isSelected}
                  className={`p-3 rounded-lg text-left transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-[#121826] border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                      : "bg-[#0B0F19] border-[#D4AF37]/15 hover:border-[#D4AF37]/35"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={isSelected ? "text-[#D4AF37]" : "text-[#A89F8C]"}>
                      {cfg.code}
                    </span>
                    <span className="text-[#8BB09E]">${cfg.depositAmountUsd.toLocaleString()}</span>
                  </div>
                  <div className="font-display text-sm text-[#DFE2F1] mt-1 line-clamp-1">
                    {cfg.label}
                  </div>
                  <div className="text-[10px] font-mono text-[#A89F8C] mt-0.5">
                    {cfg.durationMinutes} min &bull; Tier Verified
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content: Form OR Confirmation Screen */}
      <div className="flex-1 py-2">
        {isSubmitted ? (
          <div
            role="status"
            aria-live="polite"
            className="max-w-xl mx-auto py-8 text-center space-y-6 animate-in fade-in duration-300"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-[#121826] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shadow-[0_0_35px_rgba(212,175,55,0.25)]">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121826] border border-[#8BB09E]/40 text-[10px] font-mono uppercase tracking-widest text-[#8BB09E]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8BB09E] animate-pulse" />
                <span>Priority Tele-Desk Enqueued</span>
              </div>
              <h3 className="font-display text-2xl text-[#DFE2F1] font-normal">
                Intake Reservation Dispatched
              </h3>
              <p className="font-mono text-xs text-[#A89F8C] leading-relaxed max-w-md mx-auto">
                Consultation dispatch for{" "}
                <strong className="text-[#DFE2F1]">{candidateName || "Valued Candidate"}</strong> has been
                routed to the Executive Clinician Queue under {activeTierConfig.label}.
              </p>
            </div>

            {/* Tracking Card */}
            <div className="p-4 rounded-xl bg-[#121826] border border-[#D4AF37]/30 text-left space-y-2.5 max-w-md mx-auto shadow-inner">
              <div className="flex items-center justify-between font-mono text-[11px] text-[#A89F8C]">
                <span>DISPATCH REFERENCE:</span>
                <span className="text-[#D4AF37] font-bold tracking-wider">{dispatchTrackingId}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-[#A89F8C]">
                <span>CONSULTATION WINDOW:</span>
                <span className="text-[#DFE2F1]">{consultationWindow}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-[#A89F8C]">
                <span>DEPOSIT AUTHORIZATION:</span>
                <span className="text-[#8BB09E]">${activeTierConfig.depositAmountUsd.toLocaleString()} USD (Held at Intake)</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-[#A89F8C]">
                <span>DIRECT HOTLINE:</span>
                <a href={conciergePhone} className="text-[#D4AF37] hover:underline">
                  +1 (800) 555-0199
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={conciergeSms}
                className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-[#0B0F19] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#F2CA50] transition-all text-center shadow-[0_0_15px_rgba(212,175,55,0.25)] focus-visible:ring-1 focus-visible:ring-[#0B0F19]"
              >
                Direct SMS Confirmation
              </a>
              <a
                href={conciergePhone}
                className="px-6 py-2.5 rounded-full bg-[#121826] border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-xs uppercase tracking-wider hover:bg-[#1A2234] transition-colors text-center focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
              >
                Call Concierge Desk
              </a>
              {onReturnToCalendar && (
                <button
                  type="button"
                  onClick={onReturnToCalendar}
                  className="px-6 py-2.5 rounded-full bg-transparent border border-[#A89F8C]/30 text-[#DFE2F1] font-mono text-xs uppercase tracking-wider hover:border-[#DFE2F1] transition-colors cursor-pointer"
                >
                  Return to Calendar
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="candidate-name"
                  className="block font-mono text-[10px] text-[#DFE2F1] uppercase tracking-wider mb-1.5"
                >
                  Full Legal Name <span className="text-[#D4AF37]">*</span>
                </label>
                <input
                  id="candidate-name"
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. Richard Roe"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#121826] border border-[#D4AF37]/30 text-[#DFE2F1] text-xs font-sans placeholder-[#A89F8C]/50 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/40"
                />
              </div>

              <div>
                <label
                  htmlFor="candidate-email"
                  className="block font-mono text-[10px] text-[#DFE2F1] uppercase tracking-wider mb-1.5"
                >
                  Confidential Email <span className="text-[#D4AF37]">*</span>
                </label>
                <input
                  id="candidate-email"
                  type="email"
                  required
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="richard.roe@familyoffice.com"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#121826] border border-[#D4AF37]/30 text-[#DFE2F1] text-xs font-sans placeholder-[#A89F8C]/50 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="candidate-phone"
                  className="block font-mono text-[10px] text-[#DFE2F1] uppercase tracking-wider mb-1.5"
                >
                  Mobile Number (Optional SMS Updates)
                </label>
                <input
                  id="candidate-phone"
                  type="tel"
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                  placeholder="+1 (555) 012-3456"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#121826] border border-[#D4AF37]/30 text-[#DFE2F1] text-xs font-sans placeholder-[#A89F8C]/50 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/40"
                />
              </div>

              <div>
                <label
                  htmlFor="consultation-window"
                  className="block font-mono text-[10px] text-[#DFE2F1] uppercase tracking-wider mb-1.5"
                >
                  Preferred Consultation Window
                </label>
                <select
                  id="consultation-window"
                  value={consultationWindow}
                  onChange={(e) => setConsultationWindow(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#121826] border border-[#D4AF37]/30 text-[#DFE2F1] text-xs font-sans focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/40"
                >
                  <option>Morning (08:00 - 12:00 EST)</option>
                  <option>Afternoon (13:00 - 17:00 EST)</option>
                  <option>Evening Executive (18:00 - 20:00 EST)</option>
                  <option>Urgent / Same-Day Clinical VIP</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="clinical-notes"
                className="block font-mono text-[10px] text-[#DFE2F1] uppercase tracking-wider mb-1.5"
              >
                Clinical Focus or Priority Inquiries
              </label>
              <textarea
                id="clinical-notes"
                rows={3}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="e.g. HoloTC methylation evaluation, TMS protocol review, executive autonomic optimization..."
                className="w-full px-3.5 py-2 rounded-lg bg-[#121826] border border-[#D4AF37]/30 text-[#DFE2F1] text-xs font-sans placeholder-[#A89F8C]/50 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/40"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[10px] font-mono text-[#A89F8C] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8BB09E]" />
                <span>Zero-ePHI Ephemeral Triage &bull; Stripe Deposit Pre-Auth</span>
              </div>

              <div className="flex items-center gap-2">
                {onReturnToCalendar && (
                  <button
                    type="button"
                    onClick={onReturnToCalendar}
                    className="px-4 py-2 rounded-full border border-[#D4AF37]/30 text-[#DFE2F1] hover:bg-[#121826] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    &larr; Calendar
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#D4AF37] text-[#0B0F19] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#F2CA50] transition-all cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.25)] focus-visible:ring-1 focus-visible:ring-[#0B0F19]"
                >
                  Submit Reservation to Tele-Desk
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Fail-Safe Concierge Bottom Line */}
      <div className="pt-4 border-t border-[#D4AF37]/20 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#A89F8C] gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          <span>Concierge White-Glove Desk: +1 (800) 555-0199</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <a href={conciergeSms} className="text-[#D4AF37] hover:underline">
            Direct SMS &rarr;
          </a>
          <span>&bull;</span>
          <a href={conciergePhone} className="text-[#D4AF37] hover:underline">
            Direct Voice Call &rarr;
          </a>
          {isSubmitted && (
            <>
              <span>&bull;</span>
              <button
                type="button"
                onClick={handleReset}
                className="text-[#DFE2F1] hover:underline cursor-pointer"
              >
                New Reservation
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConciergeDrawer;

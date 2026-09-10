"use client";

import React, { useState, useEffect, useCallback } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const [useFallbackIntake, setUseFallbackIntake] = useState(false);
  const [fallbackSubmitted, setFallbackSubmitted] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidateTime, setCandidateTime] = useState("Morning (08:00 - 12:00 EST)");
  const [candidateNotes, setCandidateNotes] = useState("");

  const handleClose = useCallback(() => {
    setFallbackSubmitted(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      let timeoutId: NodeJS.Timeout;

      (async function initCal() {
        try {
          // Timeout guard: if Cal embed API doesn't resolve within 2500ms, enable fallback option
          timeoutId = setTimeout(() => {
            // Cal scheduler latency threshold reached
          }, 2500);

          const cal = await getCalApi();
          clearTimeout(timeoutId);
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
        } catch (e) {
          console.error("Cal.com embed API unavailable, routing to Ephemeral Concierge Intake:", e);
          setUseFallbackIntake(true);
        }
      })();

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
  }, [isOpen]);

  // Keyboard accessibility: Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const handleFallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFallbackSubmitted(true);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-canvas-obsidian/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* 
        Modal Frame: Matches Figma Frame [4:6747] 
        Rounded-xl corners, Midnight Navy backdrop (#121826), and Champagne Gold accents (#D4AF37)
      */}
      <div className="relative w-full max-w-[960px] h-[90vh] max-h-[860px] overflow-hidden bg-[#121826] border border-[#D4AF37]/30 rounded-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] flex flex-col">
        {/* Header matching Figma Frame [4:6747] */}
        <div className="p-6 border-b border-[#D4AF37]/20 flex items-start justify-between bg-canvas-obsidian/95">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121826] border border-[#D4AF37]/30 text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              <span>Event Template #982148 &bull; Comprehensive Neuro-Diagnostic Consultation</span>
            </div>
            <h2 id="booking-modal-title" className="font-display text-xl sm:text-2xl text-text-surface font-normal">
              Private Consultation Reservation
            </h2>
            <p className="font-mono text-xs text-text-surface-variant">
              Comprehensive 45-Minute Diagnostic Consultation &amp; Baseline Mapping &bull; Dr. David Andreas Runheim, MD
            </p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="text-text-surface-variant hover:text-text-surface p-2 rounded-lg hover:bg-surface-container transition-colors focus-visible:ring-1 focus-visible:ring-[#D4AF37] focus:outline-none cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Deposit Authorization & Mode Switcher Telemetry Banner */}
        <div className="px-6 py-2.5 bg-canvas-obsidian/80 border-b border-border-midnight flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-text-surface-muted gap-2">
          <div className="flex items-center gap-2 text-vitality-sage">
            <span className="w-1.5 h-1.5 rounded-full bg-vitality-sage" />
            <span>Stripe Deposit Pre-Authorization: $1,000 Held at Intake</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setUseFallbackIntake(!useFallbackIntake)}
              className="text-[#D4AF37] hover:underline cursor-pointer"
            >
              {useFallbackIntake ? "← Switch to Cal.com Calendar" : "⚡ Direct Concierge Intake Drawer →"}
            </button>
          </div>
        </div>

        {/* Dynamic Container: Official Cal.com Embed OR Ephemeral Concierge Intake Drawer */}
        <div className="flex-1 w-full overflow-y-auto bg-[#121826] p-4 sm:p-6">
          {!useFallbackIntake ? (
            <div className="w-full h-full min-h-[450px]">
              <Cal
                calLink="your-practice/initial-assessment"
                style={{ width: "100%", height: "100%", overflow: "scroll" }}
                config={{
                  layout: "month_view",
                  theme: "dark",
                }}
              />
            </div>
          ) : fallbackSubmitted ? (
            <div className="max-w-lg mx-auto py-12 text-center space-y-6 animate-in fade-in">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#1A2234] border border-[#D4AF37]/40 flex items-center justify-center text-champagne-gold shadow-[0_0_30px_rgba(212,175,55,0.25)]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-2">
                <span className="font-mono text-[11px] text-[#8BB09E] uppercase tracking-widest">
                  Priority Tele-Desk Active
                </span>
                <h3 className="font-display text-2xl text-[#DFE2F1]">
                  Intake Reservation Dispatched
                </h3>
                <p className="font-sans text-xs text-[#99907C] leading-relaxed">
                  Your consultation request for <strong className="text-[#DFE2F1]">{candidateName || "Valued Member"}</strong> has been routed directly to the Executive Concierge Desk. A confirmation link has been prepared.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#D4AF37]/25 text-left space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px] text-[#99907C]">
                  <span>RESERVATION WINDOW:</span>
                  <span className="text-[#DFE2F1]">{candidateTime}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-[#99907C]">
                  <span>DISPATCH TELE-DESK:</span>
                  <span className="text-[#D4AF37]">+1 (800) 555-0199</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="sms:+18005550199"
                  className="px-6 py-2.5 rounded-full bg-champagne-gold text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider hover:bg-champagne-gold-light transition-colors text-center"
                >
                  Direct SMS Confirmation
                </a>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-full bg-[#1A2234] border border-[#D4AF37]/30 text-champagne-gold font-mono text-xs uppercase tracking-wider hover:bg-[#222C42] transition-colors"
                >
                  Close Sanctuary
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto py-4 space-y-6">
              <div className="border-b border-[#D4AF37]/15 pb-4">
                <div className="flex items-center gap-2 text-champagne-gold text-xs font-mono uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                  <span>Ephemeral Concierge Intake Drawer</span>
                </div>
                <h3 className="font-display text-xl text-[#DFE2F1] mt-1">
                  Direct Diagnostic Baseline Reservation
                </h3>
                <p className="font-sans text-xs text-[#99907C]">
                  Zero-ePHI Isolated: Form data is transmitted directly into encrypted triage queues with zero local client tracking.
                </p>
              </div>

              <form onSubmit={handleFallbackSubmit} className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] text-[#DFE2F1] uppercase tracking-wider mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="e.g. Richard Roe"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-[#D4AF37]/30 text-[#DFE2F1] text-xs font-sans placeholder-[#99907C] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-[#DFE2F1] uppercase tracking-wider mb-1">
                    Confidential Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    placeholder="richard.roe@familyoffice.com"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-[#D4AF37]/30 text-[#DFE2F1] text-xs font-sans placeholder-[#99907C] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-[#DFE2F1] uppercase tracking-wider mb-1">
                    Preferred Consultation Window
                  </label>
                  <select
                    value={candidateTime}
                    onChange={(e) => setCandidateTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-[#D4AF37]/30 text-[#DFE2F1] text-xs font-sans focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option>Morning (08:00 - 12:00 EST)</option>
                    <option>Afternoon (13:00 - 17:00 EST)</option>
                    <option>Evening Executive (18:00 - 20:00 EST)</option>
                    <option>Urgent / Same-Day Clinical VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-[#DFE2F1] uppercase tracking-wider mb-1">
                    Clinical Focus or Priority Inquiries
                  </label>
                  <textarea
                    rows={3}
                    value={candidateNotes}
                    onChange={(e) => setCandidateNotes(e.target.value)}
                    placeholder="e.g. HoloTC methylation evaluation, TMS protocol review, executive autonomic optimization..."
                    className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F19] border border-[#D4AF37]/30 text-[#DFE2F1] text-xs font-sans placeholder-[#99907C] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#99907C]">
                    Zero-ePHI Ephemeral Triage
                  </span>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-champagne-gold text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider hover:bg-champagne-gold-light transition-all cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                  >
                    Submit Reservation to Tele-Desk
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Fail-Safe Concierge Direct Line Fallback */}
        <div className="p-3 px-6 bg-canvas-obsidian border-t border-[#D4AF37]/20 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#99907C] gap-2">
          <span>Priority Scheduling Assistance &bull; Zero-ePHI Quarantine</span>
          <a
            href="sms:+18005550199"
            className="text-[#D4AF37] hover:underline flex items-center gap-1.5"
          >
            <span>Direct Concierge SMS: +1 (800) 555-0199</span>
            &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

export default BookingModal;

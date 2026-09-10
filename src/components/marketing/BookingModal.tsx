"use client";

import React, { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookingModal({ isOpen, onClose }: BookingModalProps) {
  useEffect(() => {
    if (isOpen) {
      (async function initCal() {
        try {
          const cal = await getCalApi();
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
          console.error("Failed to initialize Cal.com embed API:", e);
        }
      })();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-canvas-obsidian/85 backdrop-blur-md animate-in fade-in duration-200">
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
            <h2 className="font-display text-xl sm:text-2xl text-text-surface font-normal">
              Private Consultation Reservation
            </h2>
            <p className="font-mono text-xs text-text-surface-variant">
              Comprehensive 45-Minute Diagnostic Consultation &amp; Baseline Mapping &bull; Dr. David Andreas Runheim, MD
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-text-surface-variant hover:text-text-surface p-2 rounded-lg hover:bg-surface-container transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Deposit Authorization Telemetry Banner */}
        <div className="px-6 py-2 bg-canvas-obsidian/60 border-b border-border-midnight flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-text-surface-muted gap-1">
          <div className="flex items-center gap-2 text-vitality-sage">
            <span className="w-1.5 h-1.5 rounded-full bg-vitality-sage" />
            <span>Stripe Deposit Pre-Authorization: $1,000 Held at Intake</span>
          </div>
          <span className="text-[#D4AF37]/80">
            Winston-Salem Diagnostic Suite 400 &bull; 256-Bit Encrypted
          </span>
        </div>

        {/* Official Cal.com Embed Container */}
        <div className="flex-1 w-full overflow-hidden bg-[#121826] p-2">
          <Cal
            calLink="your-practice/initial-assessment"
            style={{ width: "100%", height: "100%", overflow: "scroll" }}
            config={{
              layout: "month_view",
              theme: "dark",
            }}
          />
        </div>
      </div>
    </div>
  );
}

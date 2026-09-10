"use client";

import React from "react";
import Link from "next/link";

export default function MaintenancePage() {
  const handleProbeStatus = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-text-surface flex flex-col justify-between selection:bg-champagne-gold selection:text-text-on-gold relative overflow-hidden font-body">
      {/* Ambient Gold Nebula Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[480px] bg-[#D4AF37]/5 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[380px] h-[380px] bg-[#D4AF37]/[0.03] blur-[100px] rounded-full pointer-events-none" />

      {/* Top Quiet-Luxury Header */}
      <header className="w-full border-b border-[#D4AF37]/20 bg-[#0B0F19]/90 backdrop-blur-md px-6 lg:px-12 py-5 relative z-20">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex flex-col items-center sm:items-start text-center sm:text-left focus:outline-none"
          >
            <span className="font-display text-lg sm:text-xl tracking-[0.18em] text-champagne-gold font-semibold uppercase group-hover:text-champagne-gold-light transition-colors">
              Cognitive Edge Clinic
            </span>
            <span className="font-mono text-[9px] tracking-[0.25em] text-text-surface-muted uppercase mt-0.5">
              Discreet Concierge Neurology &bull; Resuscitation
            </span>
          </Link>

          {/* Telemetry Status Indicator */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#121826]/80 border border-[#D4AF37]/20 shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-champagne-gold font-medium">
              Maintenance Standby // Zero-ePHI Quarantine Intact
            </span>
          </div>
        </div>
      </header>

      {/* Main Editorial Sanctuary Centerpiece */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12 lg:py-16">
        <div className="max-w-2xl w-full text-center space-y-8 bg-[#121826]/80 border border-[#D4AF37]/20 rounded-2xl p-8 sm:p-12 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          {/* Architectural Telemetry Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0B0F19] border border-[#D4AF37]/20 text-[10px] font-mono uppercase tracking-[0.2em] text-champagne-gold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>Maintenance Standby // Zero-ePHI Quarantine Intact</span>
          </div>

          {/* Editorial Typography */}
          <div className="space-y-4">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-text-surface font-normal leading-[1.15] tracking-tight">
              Clinical Sanctuary Temporarily Reserved
            </h1>
            <p className="font-body text-base sm:text-lg text-text-surface-variant max-w-xl mx-auto leading-relaxed font-light">
              Scheduled infrastructure maintenance is underway. Clinical enclaves remain strictly quarantined.
            </p>
            <p className="font-body text-xs sm:text-sm text-text-surface-muted max-w-lg mx-auto leading-relaxed">
              Dr. David Andreas Runheim and our clinical informatics team are conducting scheduled perimeter updates. Offline patient archives and encrypted diagnostic records remain completely isolated.
            </p>
          </div>

          {/* Direct Urgent Concierge Dialers */}
          <div className="p-6 rounded-xl bg-[#0B0F19]/90 border border-[#D4AF37]/20 text-left space-y-4 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D4AF37]/20 pb-3">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-champagne-gold font-semibold block">
                  Priority Tele-Desk Active
                </span>
                <span className="font-sans text-[11px] text-text-surface-muted">
                  Spruce Health Emergency Clinical Channel
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-vitality-sage">
                <span className="w-1.5 h-1.5 rounded-full bg-vitality-sage" />
                <span>Continuous Concierge Line</span>
              </div>
            </div>

            <p className="font-body text-xs text-text-surface-variant leading-relaxed">
              Active concierge members and urgent diagnostic inquiries bypass edge maintenance windows via direct carrier channels:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <a
                href="sms:+18005550199"
                className="group flex items-center justify-between px-4 py-3.5 rounded-lg bg-[#121826] border border-[#D4AF37]/20 text-champagne-gold hover:border-champagne-gold hover:bg-[#1A2234] transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded bg-[#0B0F19] border border-[#D4AF37]/20 text-xs">
                    💬
                  </span>
                  <div className="text-left">
                    <span className="font-mono text-xs uppercase tracking-wider block font-medium group-hover:text-champagne-gold-light">
                      VIP Concierge SMS
                    </span>
                    <span className="font-mono text-[11px] text-text-surface-muted">
                      +1 (800) 555-0199
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs text-champagne-gold/60 group-hover:translate-x-0.5 transition-transform">
                  &rarr;
                </span>
              </a>

              <a
                href="tel:+18005550199"
                className="group flex items-center justify-between px-4 py-3.5 rounded-lg bg-[#121826] border border-[#D4AF37]/20 text-champagne-gold hover:border-champagne-gold hover:bg-[#1A2234] transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded bg-[#0B0F19] border border-[#D4AF37]/20 text-xs">
                    📞
                  </span>
                  <div className="text-left">
                    <span className="font-mono text-xs uppercase tracking-wider block font-medium group-hover:text-champagne-gold-light">
                      Physician Hotline
                    </span>
                    <span className="font-mono text-[11px] text-text-surface-muted">
                      +1 (800) 555-0199
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs text-champagne-gold/60 group-hover:translate-x-0.5 transition-transform">
                  &rarr;
                </span>
              </a>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleProbeStatus}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_25px_rgba(212,175,55,0.45)] btn-luxury-shimmer text-center cursor-pointer"
            >
              Probe Enclave Status
            </button>
            <Link
              href="/status"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#121826] hover:bg-[#0B0F19] border border-[#D4AF37]/20 hover:border-champagne-gold text-text-surface font-mono text-xs font-medium uppercase tracking-wider transition-all text-center"
            >
              View Telemetry Dashboard
            </Link>
          </div>

          {/* Zero-ePHI Quarantine Assurance Footnote */}
          <div className="pt-6 border-t border-[#D4AF37]/20 text-center space-y-1">
            <p className="font-mono text-[10px] text-text-surface-muted uppercase tracking-widest">
              Winston-Salem Diagnostic Suite &bull; Certified Concierge Continuity
            </p>
            <p className="font-mono text-[9px] text-[#D4AF37]/70 uppercase tracking-widest">
              Zero-ePHI Architecture &bull; ISO/IEC 27001 & HIPAA Security Rule Enforced
            </p>
          </div>
        </div>
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[#D4AF37]/20 bg-[#121826]/90 backdrop-blur-md py-6 px-6 text-center font-mono text-xs text-text-surface-muted relative z-20">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 COGNITIVE EDGE CLINICAL GROUP. ALL CLINICAL ENCLAVES QUARANTINED.</span>
          <span className="text-champagne-gold">
            TELEMETRY: Maintenance Standby // Zero-ePHI Quarantine Intact
          </span>
        </div>
      </footer>
    </div>
  );
}


"use client";

import React from "react";
import Link from "next/link";

export default function MaintenancePage() {
  const handleCheckStatus = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface flex flex-col justify-between selection:bg-champagne-gold selection:text-text-on-gold relative overflow-hidden">
      {/* Ambient Gold Nebula Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-champagne-gold/5 blur-[130px] rounded-full pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full border-b border-border-gold-subtle bg-canvas-obsidian/90 backdrop-blur-md px-6 lg:px-12 py-5">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-display text-lg tracking-wider text-champagne-gold font-semibold">
            COGNITIVE EDGE CLINIC
          </Link>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-champagne-gold">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>Infrastructure Maintenance Active</span>
          </div>
        </div>
      </header>

      {/* Editorial Maintenance Centerpiece */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-xl w-full text-center space-y-8 bg-surface-midnight/80 border border-[#D4AF37]/30 rounded-2xl p-8 sm:p-12 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-canvas-obsidian border border-[#D4AF37]/35 text-[10px] font-mono uppercase tracking-widest text-champagne-gold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            <span>Scheduled Enclave Upgrade &bull; Zero-ePHI Quarantine Intact</span>
          </div>

          {/* Typography */}
          <div className="space-y-3">
            <h1 className="font-display text-4xl sm:text-5xl text-text-surface font-normal leading-tight">
              Clinical Sanctuary Temporarily Reserved
            </h1>
            <p className="font-body text-sm sm:text-base text-text-surface-variant max-w-md mx-auto leading-relaxed">
              Scheduled infrastructure maintenance and cryptographic key rotations are currently underway. Clinical enclaves remain strictly isolated and offline patient records remain unaffected.
            </p>
          </div>

          {/* Direct Urgent Concierge Dialers */}
          <div className="p-5 rounded-xl bg-canvas-obsidian/85 border border-border-gold-subtle/40 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-champagne-gold font-semibold">
                Priority Tele-Desk Active
              </span>
              <span className="font-mono text-[10px] text-vitality-sage">Spruce Care Desk</span>
            </div>
            <p className="font-sans text-xs text-text-surface-variant">
              Active concierge members and urgent diagnostic inquiries bypass edge maintenance windows via direct carrier channels:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <a
                href="sms:+18005550199"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#121826] border border-[#D4AF37]/40 text-champagne-gold font-mono text-xs hover:bg-[#1A2234] transition-colors"
              >
                <span>💬 Priority VIP SMS</span>
              </a>
              <a
                href="tel:+18005550199"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#121826] border border-[#D4AF37]/40 text-champagne-gold font-mono text-xs hover:bg-[#1A2234] transition-colors"
              >
                <span>📞 Physician Hotline</span>
              </a>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleCheckStatus}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] btn-luxury-shimmer text-center cursor-pointer"
            >
              Probe Enclave Status
            </button>
            <Link
              href="/status"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-surface-midnight hover:bg-canvas-obsidian border border-border-gold-subtle hover:border-champagne-gold text-text-surface font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-inner text-center"
            >
              View Telemetry Dashboard
            </Link>
          </div>

          {/* Zero-ePHI Quarantine Assurance */}
          <div className="pt-6 border-t border-border-midnight text-center">
            <p className="font-mono text-[10px] text-text-surface-muted uppercase tracking-widest">
              Winston-Salem Diagnostic Suite &bull; Certified Concierge Continuity
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-gold-subtle bg-surface-midnight/90 py-6 px-6 text-center font-mono text-xs text-text-surface-muted">
        &copy; 2026 COGNITIVE EDGE CLINICAL GROUP &bull; ALL CLINICAL ENCLAVES QUARANTINED
      </footer>
    </div>
  );
}

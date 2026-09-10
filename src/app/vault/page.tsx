"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function VaultMemberCommandCenter() {
  const [isConciergeVIP, setIsConciergeVIP] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface flex flex-col justify-between p-6 lg:p-12 selection:bg-champagne-gold selection:text-text-on-gold">
      {/* Top Navigation & Compliance Quarantine Banner */}
      <header className="space-y-4 border-b border-border-gold-subtle pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="group">
              <span className="font-display text-xl tracking-wider text-champagne-gold font-semibold group-hover:text-champagne-gold-light transition-colors">
                COGNITIVE EDGE CLINIC
              </span>
            </Link>
            <span className="text-xs font-mono text-text-surface-muted">/</span>
            <span className="font-mono text-xs text-text-surface-variant uppercase tracking-widest">
              Zero-ePHI Command Center
            </span>
          </div>

          {/* Member Tier Switcher (Interactive for Testing & Live State) */}
          <div className="flex items-center gap-3 bg-surface-midnight border border-border-midnight px-3 py-1.5 rounded-full">
            <span className="font-mono text-[11px] text-text-surface-muted uppercase tracking-wider">
              Member Tier:
            </span>
            <button
              type="button"
              onClick={() => setIsConciergeVIP(false)}
              className={`px-3 py-1 rounded-full font-mono text-[11px] uppercase tracking-wider transition-all ${
                !isConciergeVIP
                  ? "bg-canvas-obsidian text-text-surface border border-border-gold-subtle font-semibold"
                  : "text-text-surface-muted hover:text-text-surface"
              }`}
            >
              Standard Member
            </button>
            <button
              type="button"
              onClick={() => setIsConciergeVIP(true)}
              className={`px-3 py-1 rounded-full font-mono text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                isConciergeVIP
                  ? "bg-champagne-gold text-text-on-gold font-bold shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                  : "text-text-surface-muted hover:text-champagne-gold"
              }`}
            >
              <span>★</span>
              <span>Concierge VIP</span>
            </button>
          </div>
        </div>

        {/* Zero-ePHI Quarantine Assurance Badge */}
        <div className="p-3 rounded-lg bg-surface-midnight/80 border border-vitality-sage/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-vitality-sage">
            <span className="w-2 h-2 rounded-full bg-vitality-sage animate-pulse" />
            <span className="font-semibold uppercase tracking-wider">
              Zero-ePHI Quarantine Protocol Active
            </span>
          </div>
          <span className="text-text-surface-muted text-[11px]">
            No patient telemetry (HRV, sleep stages), vitals, or laboratory databases are persisted or stored locally.
          </span>
        </div>
      </header>

      {/* Main Content Grid: Two Primary Clinical Modules */}
      <main className="max-w-6xl w-full mx-auto my-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* =========================================================================
            MODULE A: Diagnostic Vault & EHR Card
            Double-bordered Midnight Navy panel with Muted Sage (#4E6B5E) accents.
            Target: eClinicalWorks certified portal
           ========================================================================= */}
        <div className="lg:col-span-5 bg-[#121826] border-2 border-[#4E6B5E]/50 ring-1 ring-[#4E6B5E]/20 rounded-xl p-8 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
          {/* Subtle Corner Ambient Aura */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-vitality-sage/10 blur-3xl pointer-events-none rounded-full" />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#4E6B5E] font-semibold px-2.5 py-1 rounded bg-canvas-obsidian border border-[#4E6B5E]/40">
                Official Diagnostic Vault
              </span>
              <span className="font-mono text-[10px] text-text-surface-muted">
                HIPAA / ONC Certified
              </span>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-2xl text-text-surface leading-snug">
                Diagnostic Vault &amp; EHR Portal
              </h2>
              <p className="font-body text-sm text-text-surface-variant leading-relaxed">
                Official Diagnostic Vault: Access your certified lab panels, metabolic biomarkers, and clinical encounter notes directly within eClinicalWorks.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-canvas-obsidian/70 border border-border-midnight space-y-2.5 text-xs font-mono text-text-surface-muted">
              <div className="flex items-center gap-2 text-text-surface-variant">
                <span className="text-champagne-gold">&bull;</span>
                <span>Certified Metabolic &amp; Biochemical Panels</span>
              </div>
              <div className="flex items-center gap-2 text-text-surface-variant">
                <span className="text-champagne-gold">&bull;</span>
                <span>Diagnostic Imaging &amp; Quantitative EEG Records</span>
              </div>
              <div className="flex items-center gap-2 text-text-surface-variant">
                <span className="text-champagne-gold">&bull;</span>
                <span>Formal Physician Encounter Notes &amp; Rx Protocols</span>
              </div>
            </div>
          </div>

          <div className="pt-8 mt-6 border-t border-border-midnight space-y-3">
            <a
              href="https://mycwXX.eclinicalworks.com/portal"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]"
            >
              <span>Launch eClinicalWorks Portal</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <p className="text-center font-mono text-[10px] text-text-surface-muted">
              Secure external cryptographic redirection &bull; Direct eClinicalWorks Bridge
            </p>
          </div>
        </div>

        {/* =========================================================================
            MODULE B: Bespoke Spruce Health Care Console
            Header: "Secure Clinical Communications (Spruce Health)"
            Tier 1 (All Members): "Care Desk Direct"
            Tier 2 (Concierge VIP Members): "Physician Direct VIP Hotline" (Gold-bordered #D4AF37)
            Gated via isConciergeVIP
           ========================================================================= */}
        <div className="lg:col-span-7 bg-[#121826] border border-border-midnight rounded-xl p-8 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-champagne-gold font-semibold px-2.5 py-1 rounded bg-canvas-obsidian border border-border-gold-subtle">
                Bespoke Care Console
              </span>
              <span className="font-mono text-[10px] text-text-surface-muted">
                HIPAA-Compliant Encrypted Relay
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl text-text-surface">
                Secure Clinical Communications (Spruce Health)
              </h2>
              <p className="font-body text-sm text-text-surface-variant">
                Direct asynchronous and priority messaging channels powered by Spruce Health.
              </p>
            </div>

            {/* TIER 1: Care Desk Direct (Available to all members) */}
            <div className="p-5 rounded-lg bg-canvas-obsidian border border-border-midnight space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-vitality-sage" />
                  <h3 className="font-display text-lg text-text-surface">Tier 1: Care Desk Direct</h3>
                </div>
                <span className="font-mono text-[10px] text-text-surface-muted uppercase">
                  Staff Triage &bull; Active
                </span>
              </div>
              <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                Connect with our clinical administrative team for protocol scheduling, pre-intake safety packets, and non-emergent nursing triage.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="sms:+18005550199"
                  className="px-4 py-2 rounded-lg bg-surface-midnight hover:bg-surface-container border border-border-midnight hover:border-border-gold-subtle text-text-surface font-mono text-xs transition-colors flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 text-champagne-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span>SMS Direct: +1 (800) 555-0199</span>
                </a>
                <a
                  href="https://spruce.care/yourpractice"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-surface-midnight hover:bg-surface-container border border-border-midnight hover:border-border-gold-subtle text-text-surface font-mono text-xs transition-colors flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 text-champagne-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                  </svg>
                  <span>Open Spruce Web App</span>
                </a>
              </div>
            </div>

            {/* TIER 2: Physician Direct VIP Hotline (Gold-bordered #D4AF37) */}
            <div className="relative rounded-lg p-5 bg-canvas-obsidian border border-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.15)] transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
                    <h3 className="font-display text-lg text-[#D4AF37]">
                      Tier 2: Physician Direct VIP Hotline
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                    VIP Concierge
                  </span>
                </div>
                <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                  Priority direct encrypted cellular corridor to Dr. David Andreas Runheim, MD for urgent biomarker anomalies and bespoke protocol titration.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="tel:+18005550188"
                    className="px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <span>Direct Call: +1 (800) 555-0188</span>
                  </a>
                  <span className="font-mono text-[11px] text-vitality-sage">
                    Average Physician Response: &lt; 15 Minutes
                  </span>
                </div>
              </div>

              {/* Gated Overlay for Standard Members: Frosted-glass blur with gold padlock */}
              {!isConciergeVIP && (
                <div className="absolute inset-0 rounded-lg backdrop-blur-sm bg-black/40 border border-border-midnight flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in duration-200">
                  {/* Gold Padlock Icon */}
                  <div className="w-10 h-10 rounded-full bg-surface-midnight border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-2.5 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                    <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 00-7.5 0v3h7.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="font-mono text-xs text-text-surface max-w-sm mb-3">
                    Direct Physician Hotline is reserved exclusively for Concierge VIP members.{" "}
                    <button
                      type="button"
                      onClick={() => setShowUpgradeModal(true)}
                      className="text-[#D4AF37] hover:text-champagne-gold-light tracking-wider font-semibold underline underline-offset-4"
                    >
                      [Upgrade Plan]
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-border-midnight flex items-center justify-between text-[11px] font-mono text-text-surface-muted">
            <span>Powered by Spruce Health Care Messenger</span>
            <span>BAA Signed &bull; SOC2 Certified</span>
          </div>
        </div>
      </main>

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-obsidian/80 backdrop-blur-sm">
          <div className="max-w-md w-full bg-surface-midnight border border-border-gold-accent rounded-xl p-8 space-y-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-champagne-gold/10 border border-champagne-gold flex items-center justify-center text-champagne-gold">
              ★
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-2xl text-text-surface">Concierge VIP Membership</h3>
              <p className="font-body text-xs text-text-surface-variant">
                Unlock 24/7 direct physician cellular access to Dr. David Andreas Runheim, priority diagnostic suite booking, and continuous bio-telemetry oversight.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsConciergeVIP(true);
                  setShowUpgradeModal(false);
                }}
                className="w-full py-3 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all"
              >
                Enable Demo VIP Tier &rarr;
              </button>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="font-mono text-xs text-text-surface-muted hover:text-text-surface"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Footer */}
      <footer className="text-center font-mono text-[10px] text-text-surface-muted pt-6 border-t border-border-gold-subtle">
        &copy; 2026 COGNITIVE EDGE CLINICAL GROUP &bull; ZERO-ePHI QUARANTINE STANDARD &bull; eClinicalWorks &amp; Spruce BAA Secure
      </footer>
    </div>
  );
}

"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookingModal } from "@/components/marketing/BookingModal";

function VaultInner() {
  const searchParams = useSearchParams();
  const initialTier = searchParams.get("tier");
  const [isConciergeVIP, setIsConciergeVIP] = useState(initialTier === "vip");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface flex flex-col justify-between p-6 lg:p-12 selection:bg-champagne-gold selection:text-text-on-gold relative">
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

          {/* Active Member Status Pill */}
          <div className="flex items-center gap-3 bg-surface-midnight border border-border-midnight px-4 py-1.5 rounded-full shadow-inner">
            <span className="font-mono text-[11px] text-text-surface-muted uppercase tracking-wider">
              Active Tier:
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConciergeVIP ? "bg-champagne-gold animate-pulse" : "bg-vitality-sage"
                }`}
              />
              <span
                className={`font-mono text-[11px] uppercase tracking-wider font-semibold transition-colors ${
                  isConciergeVIP ? "text-champagne-gold" : "text-text-surface"
                }`}
              >
                {isConciergeVIP ? "Concierge VIP Member" : "Standard Cognitive Edge"}
              </span>
            </div>
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
              className="w-full py-3.5 px-6 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] btn-luxury-shimmer"
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
                    className="px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold transition-all flex items-center gap-2 btn-luxury-shimmer"
                  >
                    <span>Direct Call: +1 (800) 555-0188</span>
                  </a>
                  <span className="font-mono text-[11px] text-vitality-sage">
                    Average Physician Response: &lt; 15 Minutes
                  </span>
                </div>
              </div>

              {/* Gated Overlay for Standard Members: Frosted-glass backdrop-blur-md bg-black/50 with gold padlock */}
              {!isConciergeVIP && (
                <div className="absolute inset-0 rounded-lg backdrop-blur-md backdrop-blur-sm bg-black/50 border border-border-midnight flex flex-col items-center justify-center p-6 text-center z-20 transition-all duration-300 animate-in fade-in">
                  {/* Gold Padlock Icon */}
                  <div className="w-10 h-10 rounded-full bg-surface-midnight border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-2.5 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                    <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 00-7.5 0v3h7.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="font-mono text-xs text-text-surface max-w-sm mb-3">
                    Direct Physician Hotline is reserved exclusively for Concierge VIP members.{" "}
                    <Link
                      href="/membership#comparison"
                      className="text-[#D4AF37] hover:text-champagne-gold-light tracking-wider font-semibold underline underline-offset-4"
                    >
                      [Upgrade Membership Tier]
                    </Link>
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

        {/* =========================================================================
            MODULE C: Retainer & Payment Management Vault
            Framed in Midnight Navy (#121826) with thin metallic borders (border border-[#D4AF37]/30).
            Zero-Financial-Data: PCI-DSS Level 1 tokenized Stripe Customer Portal.
           ========================================================================= */}
        <div className="lg:col-span-12 bg-[#121826] border border-[#D4AF37]/30 rounded-xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-champagne-gold/5 blur-3xl pointer-events-none rounded-full" />

          {/* Module C Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-midnight pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-champagne-gold">
                <span className="w-1.5 h-1.5 rounded-full bg-vitality-sage animate-pulse" />
                <span>Financial Enclave &bull; Module 03</span>
              </div>
              <h2 className="font-display text-2xl text-text-surface">
                Retainer &amp; Payment Management
              </h2>
              <p className="font-body text-xs text-text-surface-variant">
                PCI-DSS Level 1 tokenized billing portal, membership retainers, and concierge encounter credits.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-canvas-obsidian border border-vitality-sage/30 text-xs font-mono text-vitality-sage">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Zero Card Data Persisted &bull; Stripe PCI-DSS Level 1</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Active Membership Retainer Card */}
            <div className="p-6 rounded-xl bg-canvas-obsidian border border-border-midnight space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-surface-muted">
                  Membership Retainer Status
                </span>
                <div className="space-y-1">
                  <h3 className="font-display text-xl text-text-surface">
                    {isConciergeVIP ? "Concierge VIP Retainer Active" : "Cognitive Edge Member"}
                  </h3>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="w-2 h-2 rounded-full bg-vitality-sage animate-ping" />
                    <span className="font-mono text-xs text-vitality-sage font-semibold uppercase tracking-wider">
                      Current &bull; Good Standing
                    </span>
                  </div>
                </div>
                <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                  {isConciergeVIP
                    ? "Full concierge neuro-restorative coverage including 24/7 direct physician routing and on-demand clinical titrations."
                    : "Standard neuro-metabolic monitoring, biannual laboratory evaluations, and Care Desk direct communication corridor."}
                </p>
              </div>

              <div className="pt-4 border-t border-border-midnight space-y-1 font-mono text-[11px] text-text-surface-muted">
                <div className="flex justify-between">
                  <span>Renewal Cycle:</span>
                  <span className="text-text-surface">October 1, 2026</span>
                </div>
                <div className="flex justify-between">
                  <span>Cadence:</span>
                  <span className="text-champagne-gold">Renews Automatically</span>
                </div>
              </div>
            </div>

            {/* Feature 2: Tokenized Stripe Customer Portal Bridge */}
            <div className="p-6 rounded-xl bg-canvas-obsidian border border-border-midnight space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-surface-muted">
                  Billing &amp; Tax Documentation
                </span>
                <h3 className="font-display text-xl text-text-surface">
                  Invoices &amp; Superbills
                </h3>
                <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                  Access official itemized Superbills with ICD-10 diagnostic codes, modify card payment tokens, 
                  or review past encounter retainer receipts in Stripe&apos;s encrypted vault.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <a
                  href="https://billing.stripe.com/p/session/test_portal_session_cognitive_edge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-lg bg-surface-midnight hover:bg-surface-container border border-border-gold-subtle hover:border-champagne-gold text-champagne-gold font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <span>Manage Retainer &amp; Invoices</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <p className="font-mono text-[10px] text-text-surface-muted text-center">
                  Redirects securely to Stripe Billing Engine
                </p>
              </div>
            </div>

            {/* Feature 3: Concierge Booking Shortcuts */}
            <div className="p-6 rounded-xl bg-canvas-obsidian border border-[#D4AF37]/30 space-y-4 flex flex-col justify-between shadow-inner">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-champagne-gold font-semibold">
                    Fast-Track Scheduling
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-champagne-gold animate-pulse" />
                </div>
                <h3 className="font-display text-xl text-text-surface">
                  Concierge Booking Desk
                </h3>
                <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                  Schedule clinical review blocks, laboratory redraw sessions, or in-clinic neuromodulation cycles directly 
                  without re-entering intake questionnaires or personal data.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(true)}
                  className="w-full py-3 px-4 rounded-lg bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.25)] btn-luxury-shimmer"
                >
                  <span>Open Cal.com Scheduling Desk</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <p className="font-mono text-[10px] text-champagne-gold/80 text-center">
                  Instant Verification &bull; Cal.com Embed
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          TASK 1: Discrete Floating VIP Tier Switcher Preview Bar
          Anchored subtly in the bottom-right corner of the viewport
         ========================================================================= */}
      <aside
        aria-label="VIP Preview Switcher"
        className="fixed bottom-6 right-6 z-40 bg-surface-midnight/95 backdrop-blur-xl border border-border-gold-accent rounded-full p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.85)] flex items-center gap-1.5 transition-all duration-300 hover:border-champagne-gold"
      >
        <div className="hidden sm:flex items-center gap-1.5 px-3 font-mono text-[10px] text-text-surface-muted uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-champagne-gold animate-pulse" />
          <span>Tier Switcher:</span>
        </div>
        <button
          type="button"
          onClick={() => setIsConciergeVIP(false)}
          className={`px-3 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-wider transition-all duration-200 ${
            !isConciergeVIP
              ? "bg-canvas-obsidian text-text-surface border border-border-gold-subtle font-semibold shadow-inner"
              : "text-text-surface-muted hover:text-text-surface"
          }`}
        >
          Standard Cognitive Edge
        </button>
        <button
          type="button"
          onClick={() => setIsConciergeVIP(true)}
          className={`px-3.5 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
            isConciergeVIP
              ? "bg-champagne-gold text-text-on-gold font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)]"
              : "text-text-surface-muted hover:text-champagne-gold"
          }`}
        >
          <span className="text-xs">★</span>
          <span>Concierge VIP Member</span>
        </button>
      </aside>

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-obsidian/80 backdrop-blur-sm">
          <div className="max-w-md w-full bg-surface-midnight border border-border-gold-accent rounded-xl p-8 space-y-6 text-center shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
            <div className="w-12 h-12 mx-auto rounded-full bg-champagne-gold/10 border border-champagne-gold flex items-center justify-center text-champagne-gold text-lg">
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
                className="w-full py-3 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] btn-luxury-shimmer"
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

      {/* On-Domain Cal.com Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}

export default function VaultMemberCommandCenter() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas-obsidian flex items-center justify-center font-mono text-xs text-champagne-gold">
          INITIALIZING ZERO-ePHI COMMAND CENTER...
        </div>
      }
    >
      <VaultInner />
    </Suspense>
  );
}

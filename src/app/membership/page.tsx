"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import { Footer } from "@/components/Footer";
import { BookingModal } from "@/components/marketing/BookingModal";

export default function MembershipSuitePage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface selection:bg-champagne-gold selection:text-text-on-gold flex flex-col">
      <TopNavBar />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 lg:px-10 py-16 space-y-24">
        {/* Editorial Header */}
        <section className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-champagne-gold px-3.5 py-1.5 rounded-full bg-surface-midnight border border-[#D4AF37]/30 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-champagne-gold animate-pulse" />
            <span>Private Longevity Practice &bull; Restricted Annual Cohorts</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-text-surface font-normal leading-tight">
            Concierge Membership &amp; Investment Architecture
          </h1>

          <p className="font-body text-base sm:text-lg text-text-surface-variant leading-relaxed">
            Our practice deliberately restricts patient volume to maintain uncompromising stoichiometric precision, 
            rapid physician access corridors, and continuous bio-telemetry oversight. 
            Select your clinical tier to architect your longevity continuum.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4 text-xs font-mono text-text-surface-muted">
            <span>&bull; Zero-ePHI Enclave</span>
            <span>&bull; eClinicalWorks Encrypted Vault</span>
            <span>&bull; Direct Spruce Telemetry</span>
          </div>
        </section>

        {/* 3-Tier Membership Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* =========================================================================
              TIER 1: Cognitive Edge Foundation
             ========================================================================= */}
          <div className="rounded-2xl p-8 bg-[#121826] border border-[#D4AF37]/20 shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between space-y-8 hover:border-[#D4AF37]/40 transition-all duration-300">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="font-mono text-xs uppercase tracking-widest text-vitality-sage font-semibold">
                  Tier 01 &bull; Core Neuro-Protection
                </span>
                <h2 className="font-display text-3xl text-text-surface">
                  Cognitive Edge Foundation
                </h2>
                <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                  Tailored for proactive executives, founders, and individuals seeking quantitative baseline mapping 
                  and stoichiometric neuro-protection.
                </p>
              </div>

              <div className="pt-4 border-t border-border-midnight space-y-4">
                <div className="font-mono text-[11px] uppercase tracking-wider text-champagne-gold font-semibold">
                  Included Clinical Protocols:
                </div>
                <ul className="space-y-3 font-body text-xs text-text-surface-variant">
                  <li className="flex items-start gap-2.5">
                    <span className="text-champagne-gold font-mono">&bull;</span>
                    <span><strong>Biomarker Mapping:</strong> Baseline quantification of HoloTC, MMA, Whole Blood TDP, RBC Magnesium, and Omega-3 Index.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-champagne-gold font-mono">&bull;</span>
                    <span><strong>Diagnostic Vault Access:</strong> Direct external cryptographic bridge into eClinicalWorks healow records enclave.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-champagne-gold font-mono">&bull;</span>
                    <span><strong>Care Desk Communications:</strong> Tier 1 Spruce Health Care Console for asynchronous nursing triage, scheduling, and refills.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-champagne-gold font-mono">&bull;</span>
                    <span><strong>Semiannual Reassessment:</strong> Longitudinal metabolic titration and targeted coenzyme formulation adjustment.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-border-midnight space-y-3">
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="w-full py-3.5 px-6 rounded-full bg-surface-midnight hover:bg-canvas-obsidian text-text-surface border border-border-gold-subtle hover:border-champagne-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-inner"
              >
                Apply for Cognitive Edge
              </button>
              <p className="text-center font-mono text-[10px] text-text-surface-muted">
                Standard Consultation &bull; Diagnostic Deposit Required
              </p>
            </div>
          </div>

          {/* =========================================================================
              TIER 2: Peak Performance Continuum
             ========================================================================= */}
          <div className="rounded-2xl p-8 bg-[#121826] border border-[#D4AF37]/30 shadow-[0_15px_40px_rgba(0,0,0,0.7)] flex flex-col justify-between space-y-8 hover:border-[#D4AF37]/60 transition-all duration-300 relative">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="font-mono text-xs uppercase tracking-widest text-champagne-gold font-semibold">
                  Tier 02 &bull; Active Recovery &amp; Cellular Resuscitation
                </span>
                <h2 className="font-display text-3xl text-text-surface">
                  Peak Performance Continuum
                </h2>
                <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                  Engineered for high-demand professionals and athletes requiring accelerated recovery, 
                  mitochondrial replenishment, and autonomic nervous system recalibration.
                </p>
              </div>

              <div className="pt-4 border-t border-border-midnight space-y-4">
                <div className="font-mono text-[11px] uppercase tracking-wider text-champagne-gold font-semibold">
                  Foundation Tier PLUS:
                </div>
                <ul className="space-y-3 font-body text-xs text-text-surface-variant">
                  <li className="flex items-start gap-2.5">
                    <span className="text-champagne-gold font-mono">&bull;</span>
                    <span><strong>Accelerated Monitoring:</strong> Bimonthly longitudinal biomarker draws with continuous stoichiometric ratio tracking.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-champagne-gold font-mono">&bull;</span>
                    <span><strong>Subcutaneous Peptides:</strong> Physician-calibrated bioregulator protocols (Epitalon, GHK-Cu, BPC-157).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-champagne-gold font-mono">&bull;</span>
                    <span><strong>HIFEM Core Stabilization:</strong> BTL Emsella neuromodulation cycles fortifying pelvic diaphragm &amp; autonomic vagal reserve.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-champagne-gold font-mono">&bull;</span>
                    <span><strong>Priority Care Desk:</strong> Fast-tracked communication corridor with dedicated clinical nursing coordinator.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-border-midnight space-y-3">
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="w-full py-3.5 px-6 rounded-full bg-surface-midnight hover:bg-canvas-obsidian text-champagne-gold border border-champagne-gold/60 hover:border-champagne-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-inner"
              >
                Request Performance Tier
              </button>
              <p className="text-center font-mono text-[10px] text-text-surface-muted">
                Fast-Track Intake &bull; Full Modality Evaluation
              </p>
            </div>
          </div>

          {/* =========================================================================
              TIER 3: Concierge Neuro-Restorative VIP (The Flagship Offering)
             ========================================================================= */}
          <div className="rounded-2xl p-8 bg-gradient-to-b from-[#182033] via-[#121826] to-[#0B0F19] border-2 border-champagne-gold shadow-[0_20px_60px_rgba(212,175,55,0.25)] flex flex-col justify-between space-y-8 relative overflow-hidden ring-1 ring-champagne-gold/40">
            {/* Ambient Gold Nebula Aura */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-champagne-gold/15 blur-3xl pointer-events-none rounded-full" />

            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-champagne-gold text-text-on-gold font-mono text-[10px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(212,175,55,0.5)]">
                  <span>★</span>
                  <span>By Physician Invitation &bull; VIP Access</span>
                </div>
                <h2 className="font-display text-3xl text-text-surface mt-2">
                  Concierge Neuro-Restorative VIP
                </h2>
                <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                  Our premier offering for ultra-high-net-worth clients seeking total biological deceleration, 
                  bespoke compounded protocols, and direct priority access to clinical leadership.
                </p>
              </div>

              <div className="pt-4 border-t border-champagne-gold/30 space-y-4">
                <div className="font-mono text-[11px] uppercase tracking-wider text-champagne-gold font-semibold">
                  Exclusive Flagship Privileges:
                </div>
                <ul className="space-y-3 font-body text-xs text-text-surface-variant">
                  <li className="flex items-start gap-2.5">
                    <span className="text-champagne-gold font-mono font-bold">&bull;</span>
                    <span><strong>Physician Direct VIP Hotline:</strong> 24/7 prioritized direct communication channel to Dr. David Andreas Runheim via dedicated private Spruce VIP cellular routing (&lt;15 min response).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-champagne-gold font-mono font-bold">&bull;</span>
                    <span><strong>DLPFC TMS Neuromodulation:</strong> Comprehensive 10 Hz Theta-Burst TMS protocols paired with Ca-AKG epigenetic priming and continuous EEG tracking.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-champagne-gold font-mono font-bold">&bull;</span>
                    <span><strong>Compounding Pharmacy Coordination:</strong> Custom bespoke formulations, stoichiometric cofactor IV pushes, and physician prescription oversight.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-champagne-gold font-mono font-bold">&bull;</span>
                    <span><strong>Private Treatment Enclave:</strong> Guaranteed reservations in our private executive recovery suites and seamless travel medical coordination.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-champagne-gold/30 space-y-3 relative z-10">
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="w-full py-4 px-6 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:shadow-[0_0_35px_rgba(212,175,55,0.6)] btn-luxury-shimmer"
              >
                Inquire for Concierge VIP Access &rarr;
              </button>
              <p className="text-center font-mono text-[10px] text-champagne-gold-light">
                Extremely Limited Cohort &bull; Direct Physician Interview
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            TIER COMPARISON MATRIX & UPGRADE WIRE (#comparison)
           ========================================================================= */}
        <section id="comparison" className="scroll-mt-24 space-y-8">
          <div className="space-y-2 text-center max-w-2xl mx-auto">
            <div className="font-mono text-xs uppercase tracking-widest text-champagne-gold">
              Comprehensive Feature Audit &bull; Deep-Link Hook
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-text-surface">
              Membership Architecture Comparison
            </h2>
            <p className="font-body text-sm text-text-surface-variant">
              Examine the detailed breakdown of biomarker frequency, physician access corridors, 
              modality coverage, and compliance assurances across all three practice tiers.
            </p>
          </div>

          <div className="rounded-2xl bg-surface-midnight border border-[#D4AF37]/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-canvas-obsidian/90 border-b border-border-midnight text-text-surface-muted text-[11px] uppercase tracking-wider">
                    <th className="p-5">Clinical Capabilities &amp; Access</th>
                    <th className="p-5 text-center">Foundation</th>
                    <th className="p-5 text-center">Continuum</th>
                    <th className="p-5 text-center text-champagne-gold bg-surface-midnight/80">Concierge VIP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-midnight/70 font-body text-xs text-text-surface-variant">
                  {/* Category 1: Physician Access */}
                  <tr className="bg-canvas-obsidian/50 font-mono text-[10px] uppercase text-vitality-sage">
                    <td colSpan={4} className="p-3 px-5 font-semibold tracking-wider">
                      Physician Access &amp; Clinical Response SLA
                    </td>
                  </tr>
                  <tr>
                    <td className="p-5 font-mono text-text-surface">Physician Direct VIP Cellular Hotline</td>
                    <td className="p-5 text-center text-text-surface-muted">&mdash;</td>
                    <td className="p-5 text-center text-text-surface-muted">&mdash;</td>
                    <td className="p-5 text-center text-champagne-gold font-bold bg-surface-midnight/50">
                      24/7 Priority Access (&lt;15m SLA)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-5 font-mono text-text-surface">Spruce Health Care Console</td>
                    <td className="p-5 text-center text-text-surface">Tier 1 Care Desk</td>
                    <td className="p-5 text-center text-text-surface">Priority Care Desk</td>
                    <td className="p-5 text-center text-champagne-gold font-semibold bg-surface-midnight/50">
                      Direct Physician Corridor
                    </td>
                  </tr>
                  <tr>
                    <td className="p-5 font-mono text-text-surface">Comprehensive Consultations</td>
                    <td className="p-5 text-center text-text-surface">Semiannual (2/year)</td>
                    <td className="p-5 text-center text-text-surface">Quarterly (4/year)</td>
                    <td className="p-5 text-center text-champagne-gold font-bold bg-surface-midnight/50">
                      Monthly &amp; On-Demand
                    </td>
                  </tr>

                  {/* Category 2: Biomarkers & Stoichiometry */}
                  <tr className="bg-canvas-obsidian/50 font-mono text-[10px] uppercase text-vitality-sage">
                    <td colSpan={4} className="p-3 px-5 font-semibold tracking-wider">
                      Biomarker Stoichiometry &amp; Diagnostic Panels
                    </td>
                  </tr>
                  <tr>
                    <td className="p-5 font-mono text-text-surface">HoloTC B12, MMA, Whole Blood TDP</td>
                    <td className="p-5 text-center text-vitality-sage">Annual</td>
                    <td className="p-5 text-center text-vitality-sage">Semiannual</td>
                    <td className="p-5 text-center text-champagne-gold font-semibold bg-surface-midnight/50">
                      Quarterly / Continuous
                    </td>
                  </tr>
                  <tr>
                    <td className="p-5 font-mono text-text-surface">RBC Magnesium &amp; Omega-3 Index</td>
                    <td className="p-5 text-center text-vitality-sage">Annual</td>
                    <td className="p-5 text-center text-vitality-sage">Semiannual</td>
                    <td className="p-5 text-center text-champagne-gold font-semibold bg-surface-midnight/50">
                      Continuous Titration
                    </td>
                  </tr>

                  {/* Category 3: Clinical Modalities */}
                  <tr className="bg-canvas-obsidian/50 font-mono text-[10px] uppercase text-vitality-sage">
                    <td colSpan={4} className="p-3 px-5 font-semibold tracking-wider">
                      Advanced Modality Coverage
                    </td>
                  </tr>
                  <tr>
                    <td className="p-5 font-mono text-text-surface">Subcutaneous Peptide Protocols</td>
                    <td className="p-5 text-center text-text-surface-muted">&mdash;</td>
                    <td className="p-5 text-center text-vitality-sage">Epitalon / BPC-157</td>
                    <td className="p-5 text-center text-champagne-gold font-semibold bg-surface-midnight/50">
                      Comprehensive Custom Stack
                    </td>
                  </tr>
                  <tr>
                    <td className="p-5 font-mono text-text-surface">BTL Emsella Autonomic HIFEM</td>
                    <td className="p-5 text-center text-text-surface-muted">A La Carte</td>
                    <td className="p-5 text-center text-vitality-sage">Included Cycles</td>
                    <td className="p-5 text-center text-champagne-gold font-semibold bg-surface-midnight/50">
                      Unlimited Precision Sessions
                    </td>
                  </tr>
                  <tr>
                    <td className="p-5 font-mono text-text-surface">10 Hz Theta-Burst DLPFC TMS</td>
                    <td className="p-5 text-center text-text-surface-muted">A La Carte</td>
                    <td className="p-5 text-center text-text-surface-muted">A La Carte</td>
                    <td className="p-5 text-center text-champagne-gold font-bold bg-surface-midnight/50">
                      Included Protocol Series
                    </td>
                  </tr>

                  {/* Category 4: Enclave Security */}
                  <tr className="bg-canvas-obsidian/50 font-mono text-[10px] uppercase text-vitality-sage">
                    <td colSpan={4} className="p-3 px-5 font-semibold tracking-wider">
                      Zero-ePHI Architecture &amp; Records
                    </td>
                  </tr>
                  <tr>
                    <td className="p-5 font-mono text-text-surface">eClinicalWorks Diagnostic Vault</td>
                    <td className="p-5 text-center text-vitality-sage">Included</td>
                    <td className="p-5 text-center text-vitality-sage">Included</td>
                    <td className="p-5 text-center text-champagne-gold font-semibold bg-surface-midnight/50">
                      Included + Dedicated Concierge
                    </td>
                  </tr>
                  <tr>
                    <td className="p-5 font-mono text-text-surface">Private Executive Suite Reservations</td>
                    <td className="p-5 text-center text-text-surface-muted">&mdash;</td>
                    <td className="p-5 text-center text-text-surface-muted">Subject to Availability</td>
                    <td className="p-5 text-center text-champagne-gold font-bold bg-surface-midnight/50">
                      Guaranteed Priority Booking
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="p-10 md:p-14 rounded-2xl bg-gradient-to-r from-surface-midnight via-canvas-obsidian to-surface-midnight border border-[#D4AF37]/40 shadow-[0_25px_60px_rgba(0,0,0,0.8)] text-center space-y-6 max-w-4xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-champagne-gold">
            <span className="w-2 h-2 rounded-full bg-champagne-gold animate-ping" />
            <span>Physician-Led Consultation Intake</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl text-text-surface max-w-xl mx-auto leading-tight">
            Initiate Your 45-Minute Diagnostic Baseline
          </h2>

          <p className="font-body text-sm sm:text-base text-text-surface-variant max-w-2xl mx-auto leading-relaxed">
            Every prospective member commences with an exhaustive quantitative baseline consultation 
            conducted directly by Lead Neurologist Dr. David Andreas Runheim, MD.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setIsBookingOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(212,175,55,0.35)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] btn-luxury-shimmer"
            >
              Schedule Initial Assessment &rarr;
            </button>
            <Link
              href="/assessment"
              className="w-full sm:w-auto px-6 py-4 rounded-full bg-surface-midnight hover:bg-canvas-obsidian text-text-surface border border-border-midnight hover:border-champagne-gold font-mono text-xs uppercase tracking-wider transition-colors"
            >
              Take Pre-Screening Assessment
            </Link>
          </div>
        </section>
      </main>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      <Footer />
    </div>
  );
}

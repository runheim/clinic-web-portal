"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import { Footer } from "@/components/Footer";
import { BookingModal } from "@/components/marketing/BookingModal";

export default function GovernanceCharterPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface selection:bg-champagne-gold selection:text-text-on-gold flex flex-col">
      <TopNavBar />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 lg:px-10 py-16 space-y-20">
        {/* Editorial Header */}
        <section className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-vitality-sage px-3.5 py-1.5 rounded-full bg-surface-midnight border border-vitality-sage/30 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-vitality-sage animate-pulse" />
            <span>Practice Transparency &bull; HIPAA BAA &bull; SOC2 Type II</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-text-surface font-normal leading-tight">
            Patient Governance &amp; Zero-ePHI Transparency Charter
          </h1>

          <p className="font-body text-base sm:text-lg text-text-surface-variant leading-relaxed">
            Cognitive Edge Clinic operates under uncompromising clinical ethics, mathematical biochemical safety gates, 
            and a strict Zero-ePHI architectural perimeter. Here we publish our clinical governance protocols, 
            data isolation guarantees, and patient safety covenants.
          </p>

          {/* Quick Anchor Navigation */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 font-mono text-xs text-text-surface-variant">
            <a href="#quarantine" className="px-3 py-1.5 rounded-full bg-surface-midnight border border-border-midnight hover:border-champagne-gold hover:text-champagne-gold transition-all">
              01 &bull; Zero-ePHI Quarantine
            </a>
            <a href="#spruce" className="px-3 py-1.5 rounded-full bg-surface-midnight border border-border-midnight hover:border-champagne-gold hover:text-champagne-gold transition-all">
              02 &bull; Spruce BAA Security
            </a>
            <a href="#financial" className="px-3 py-1.5 rounded-full bg-surface-midnight border border-border-midnight hover:border-champagne-gold hover:text-champagne-gold transition-all">
              03 &bull; Financial &amp; Deposit
            </a>
            <a href="#safety" className="px-3 py-1.5 rounded-full bg-surface-midnight border border-border-midnight hover:border-champagne-gold hover:text-champagne-gold transition-all">
              04 &bull; Clinical Safety Gates
            </a>
          </div>
        </section>

        {/* =========================================================================
            PILLAR 1: Zero-ePHI Isolation Quarantine
           ========================================================================= */}
        <section id="quarantine" className="scroll-mt-28 space-y-6">
          <div className="rounded-2xl p-8 lg:p-12 bg-surface-midnight border border-[#D4AF37]/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-vitality-sage/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-midnight pb-6">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-widest text-vitality-sage font-semibold">
                  Section 01 &bull; Architectural Perimeter
                </span>
                <h2 className="font-display text-2xl sm:text-3xl text-text-surface">
                  The Zero-ePHI Isolation Quarantine
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-canvas-obsidian border border-vitality-sage/30 text-xs font-mono text-vitality-sage">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Stateless Web Perimeter Enforced</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
              <div className="space-y-4 font-body text-sm text-text-surface-variant leading-relaxed">
                <p>
                  At Cognitive Edge Clinic, we believe electronic Protected Health Information (ePHI) 
                  should never transit or reside upon web hosting infrastructure, third-party edge nodes, 
                  or ephemeral marketing databases.
                </p>
                <p>
                  Our public web portal operates as a purely stateless presentation layer. 
                  Every piece of medical documentation, diagnostic lab telemetry (e.g., HoloTC, MMA, TDP levels), 
                  and longitudinal clinical progress chart is quarantined strictly inside our certified 
                  <strong> eClinicalWorks (eCW) healow</strong> electronic health record cloud enclave.
                </p>
                <div className="p-4 rounded-xl bg-canvas-obsidian border border-border-midnight font-mono text-xs space-y-2 text-text-surface">
                  <div className="text-champagne-gold font-semibold uppercase tracking-wider">
                    Infrastructure Isolation Rules:
                  </div>
                  <ul className="space-y-1.5 text-text-surface-variant">
                    <li>&bull; Zero clinical data or PHI cached in web server RAM or local storage.</li>
                    <li>&bull; All diagnostic lab values rendered via authenticated direct eCW SSO redirection.</li>
                    <li>&bull; Intake assessment logic executes client-side without storing personal identifiers.</li>
                    <li>&bull; Cal.com scheduling transmits only stateless booking metadata under signed webhooks.</li>
                  </ul>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-canvas-obsidian border border-[#D4AF37]/20 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="font-mono text-xs uppercase tracking-wider text-champagne-gold font-semibold">
                    Cryptographic Enclave Verification
                  </div>
                  <div className="space-y-3 font-mono text-xs text-text-surface-muted">
                    <div className="flex justify-between border-b border-border-midnight pb-2">
                      <span>EHR Provider:</span>
                      <span className="text-text-surface">eClinicalWorks healow Cloud</span>
                    </div>
                    <div className="flex justify-between border-b border-border-midnight pb-2">
                      <span>Encryption at Rest:</span>
                      <span className="text-text-surface">AES-256 GCM Hardware-Protected</span>
                    </div>
                    <div className="flex justify-between border-b border-border-midnight pb-2">
                      <span>Encryption in Transit:</span>
                      <span className="text-text-surface">TLS 1.3 / FIPS 140-2 Validated</span>
                    </div>
                    <div className="flex justify-between border-b border-border-midnight pb-2">
                      <span>Compliance Standard:</span>
                      <span className="text-vitality-sage">HIPAA Security Rule &bull; SOC2 Type II</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="https://mycwXX.eclinicalworks.com/portal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-surface-midnight hover:bg-canvas-obsidian text-champagne-gold border border-border-gold-subtle hover:border-champagne-gold font-mono text-xs uppercase tracking-wider transition-all"
                  >
                    <span>Launch eCW healow Patient Records</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            PILLAR 2: Spruce Health Communications & BAA Protection
           ========================================================================= */}
        <section id="spruce" className="scroll-mt-28 space-y-6">
          <div className="rounded-2xl p-8 lg:p-12 bg-surface-midnight border border-[#D4AF37]/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-midnight pb-6">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-widest text-champagne-gold font-semibold">
                  Section 02 &bull; Clinical Communications
                </span>
                <h2 className="font-display text-2xl sm:text-3xl text-text-surface">
                  Encrypted Communications via Spruce Health
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-canvas-obsidian border border-[#D4AF37]/30 text-xs font-mono text-champagne-gold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>HIPAA Business Associate Agreement (BAA) Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-8">
              <div className="p-6 rounded-xl bg-canvas-obsidian border border-border-midnight space-y-3">
                <div className="font-mono text-xs text-vitality-sage font-semibold uppercase tracking-wider">
                  01 &bull; End-to-End Secure SMS &amp; Chat
                </div>
                <h3 className="font-display text-lg text-text-surface">
                  Encrypted Patient App Channel
                </h3>
                <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                  All digital messaging between patients and clinical staff transits through the dedicated Spruce Health iOS/Android 
                  application under end-to-end TLS 1.3 cryptographic tunnels, safeguarding all clinical queries, 
                  prescription refill inquiries, and symptoms.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-canvas-obsidian border border-border-midnight space-y-3">
                <div className="font-mono text-xs text-champagne-gold font-semibold uppercase tracking-wider">
                  02 &bull; Asynchronous Tele-Triage
                </div>
                <h3 className="font-display text-lg text-text-surface">
                  Nursing Care Desk Routing
                </h3>
                <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                  Incoming clinical inquiries are triaged within 2 to 4 business hours by our specialized longevity nursing team. 
                  Biochemical inquiries, supplement reaction audits, and lab scheduling questions are addressed with 
                  structured protocol checklists.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-canvas-obsidian border border-[#D4AF37]/40 shadow-inner space-y-3">
                <div className="font-mono text-xs text-champagne-gold font-semibold uppercase tracking-wider">
                  03 &bull; VIP Direct Hotline
                </div>
                <h3 className="font-display text-lg text-text-surface">
                  Dedicated Cellular Link
                </h3>
                <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                  Concierge VIP members receive direct, unthrottled tele-routing to Dr. David Andreas Runheim&apos;s 
                  private Spruce line with a guaranteed under-15-minute response window for acute clinical 
                  and stoichiometric adjustments.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            PILLAR 3: Appointment & Financial Protocols
           ========================================================================= */}
        <section id="financial" className="scroll-mt-28 space-y-6">
          <div className="rounded-2xl p-8 lg:p-12 bg-surface-midnight border border-[#D4AF37]/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-midnight pb-6">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-widest text-vitality-sage font-semibold">
                  Section 03 &bull; Clinical Commitment &amp; Honoraria
                </span>
                <h2 className="font-display text-2xl sm:text-3xl text-text-surface">
                  Appointment &amp; Financial Protocols
                </h2>
              </div>
              <div className="font-mono text-xs text-champagne-gold">
                Transparent Fee-For-Service &bull; Private Pay
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-body text-sm text-text-surface-variant leading-relaxed">
              <div className="space-y-4">
                <h3 className="font-display text-xl text-text-surface flex items-center gap-2">
                  <span className="text-champagne-gold font-mono text-base">&bull;</span>
                  <span>The $1,000 Diagnostic Deposit Guarantee</span>
                </h3>
                <p>
                  To secure an initial comprehensive neuro-metabolic intake or clinical initiation block, 
                  a non-refundable deposit of <strong>$1,000 USD</strong> is required at booking. 
                  This deposit directly funds physician pre-charting, baseline laboratory requisition preparation, 
                  and the reservation of an unhurried 90-minute face-to-face clinical encounter.
                </p>
                <p>
                  The full deposit amount is credited directly toward your selected membership tier or clinical protocol fee 
                  upon encounter completion.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-display text-xl text-text-surface flex items-center gap-2">
                  <span className="text-champagne-gold font-mono text-base">&bull;</span>
                  <span>48-Hour Cancellation &amp; Rescheduling Policy</span>
                </h3>
                <p>
                  Our practice deliberately restricts patient volume to a maximum of four clinical consultations daily. 
                  Late cancellations deprive prospective patients on our waitlist of access to timely medical intervention.
                </p>
                <p>
                  Appointments rescheduled or cancelled with less than <strong>48 hours business notice</strong> will forfeit the 
                  $1,000 deposit. In emergency medical circumstances, rescheduling exceptions may be granted at the clinical director&apos;s discretion.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-canvas-obsidian border border-border-midnight font-mono text-xs space-y-3">
              <div className="text-text-surface font-semibold uppercase tracking-wider">
                Insurance Disclaimers &amp; Superbill Notice:
              </div>
              <p className="text-text-surface-variant leading-relaxed">
                Cognitive Edge Clinic is an out-of-network private longevity practice. We do not participate in Medicare, 
                Medicaid, or commercial HMO/PPO plans. Upon request, itemized Superbills with ICD-10 diagnostic codes 
                and CPT procedural codes will be provided through your eClinicalWorks healow portal for individual insurance submission.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            PILLAR 4: Clinical Safety & Contraindications Philosophy
           ========================================================================= */}
        <section id="safety" className="scroll-mt-28 space-y-6">
          <div className="rounded-2xl p-8 lg:p-12 bg-surface-midnight border border-[#D4AF37]/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-midnight pb-6">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-widest text-champagne-gold font-semibold">
                  Section 04 &bull; Clinical Safety Governance
                </span>
                <h2 className="font-display text-2xl sm:text-3xl text-text-surface">
                  Clinical Safety &amp; Contraindications Philosophy
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/30 border border-red-500/40 text-xs font-mono text-red-300">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Zero-Tolerance Contraindication Locks</span>
              </div>
            </div>

            <p className="font-body text-sm text-text-surface-variant leading-relaxed">
              We reject indiscriminate biohacking trends in favor of strict, evidence-based biochemical guardrails. 
              Our practice enforces immutable protocol locks when biological or historical contraindications are identified:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gate 1: NAD+ Oncology Lock */}
              <div className="p-6 rounded-xl bg-canvas-obsidian border border-border-midnight space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-red-400 font-semibold">
                    Biochemical Lock 01
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-red-950/50 text-red-300 border border-red-800/40">
                    MANDATORY EXCLUSION
                  </span>
                </div>
                <h3 className="font-display text-lg text-text-surface">
                  NAD+ &amp; Precursor Oncology Lock
                </h3>
                <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                  NAD+ infusions and high-dose NMN/NR precursors accelerate cellular salvage pathways (NAMPT/NMNAT). 
                  In the presence of active malignancy or within 5 years of treated oncological pathology, NAD+ upregulation 
                  is strictly prohibited to avoid theoretical acceleration of rapidly dividing tumor cell bioenergetics.
                </p>
              </div>

              {/* Gate 2: Vitamin B6 Neuropathy Ceiling */}
              <div className="p-6 rounded-xl bg-canvas-obsidian border border-border-midnight space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-champagne-gold font-semibold">
                    Biochemical Lock 02
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#121826] text-champagne-gold border border-[#D4AF37]/30">
                    &lt; 20 mg/day CEILING
                  </span>
                </div>
                <h3 className="font-display text-lg text-text-surface">
                  Vitamin B6 Pyridoxine Neuropathy Ceiling
                </h3>
                <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                  Commercial supplements frequently include toxic pyridoxine hydrochloride exceeding 100 mg/day, 
                  inducing paradoxical dorsal root ganglion peripheral sensory neuropathy. 
                  Our formulations mandate active Pyridoxal-5-Phosphate (P5P) capped strictly under 20 mg daily with continuous plasma monitoring.
                </p>
              </div>

              {/* Gate 3: TMS Ferromagnetic Screening */}
              <div className="p-6 rounded-xl bg-canvas-obsidian border border-border-midnight space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-vitality-sage font-semibold">
                    Biochemical Lock 03
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-vitality-sage/10 text-vitality-sage border border-vitality-sage/30">
                    SAFETY SCREEN REQUIRED
                  </span>
                </div>
                <h3 className="font-display text-lg text-text-surface">
                  10 Hz DLPFC TMS Ferromagnetic Gate
                </h3>
                <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                  Transcranial Magnetic Stimulation utilizes rapid alternating magnetic fields capable of heating or displacing 
                  ferromagnetic materials. Patients with intracranial clips, cochlear implants, cardiac pacemakers, 
                  or unmanaged seizure disorders are disqualified from high-frequency cortical stimulation.
                </p>
              </div>

              {/* Gate 4: Anticoagulant PT/INR Co-Administration */}
              <div className="p-6 rounded-xl bg-canvas-obsidian border border-border-midnight space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-text-surface font-semibold">
                    Biochemical Lock 04
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#121826] text-text-surface-variant border border-border-midnight">
                    LAB TITRATION
                  </span>
                </div>
                <h3 className="font-display text-lg text-text-surface">
                  Antithrombotic &amp; Omega Titration Gate
                </h3>
                <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                  High-dose EPA/DHA omega-3 fatty acid regimens, ginkgo co-factors, and peptide vascular protocols 
                  influence platelet aggregation. Patients taking warfarin, direct oral anticoagulants (DOACs), 
                  or dual antiplatelet therapy undergo mandatory PT/INR and baseline coagulation factor audits.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="rounded-2xl p-10 bg-gradient-to-br from-[#121826] to-[#0B0F19] border border-[#D4AF37]/30 text-center space-y-6">
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl text-text-surface">
              Begin With Complete Regulatory &amp; Clinical Confidence
            </h2>
            <p className="font-body text-sm text-text-surface-variant leading-relaxed">
              Explore our comprehensive membership tiers or schedule a preliminary clinical intake 
              consultation under our Zero-ePHI architecture.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => setIsBookingOpen(true)}
              className="px-8 py-3.5 rounded-full bg-champagne-gold hover:bg-gold-glow text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)]"
            >
              Initiate Clinical Intake
            </button>
            <Link
              href="/membership"
              className="px-8 py-3.5 rounded-full bg-surface-midnight hover:bg-canvas-obsidian text-text-surface border border-border-gold-subtle hover:border-champagne-gold font-mono text-xs uppercase tracking-wider transition-all"
            >
              View Membership Suite
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      {/* Cal.com Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookingModal } from "@/components/marketing/BookingModal";

export default function BiographiesPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const careTeam = [
    {
      name: "Astrid Lindholm, RN, BSN",
      role: "Clinical Triage Director & Neuro-Nurse Specialist",
      focus: "Intra-protocol biomarker monitoring, intravenous bioenergetics titration, and autonomic testing oversight.",
      credential: "Former Lead Critical Care Specialist & Certified Clinical Neuro-Vascular Nurse",
    },
    {
      name: "Marcus Vance, MS",
      role: "Lead Bio-Telemetry & Data Coordinator",
      focus: "Continuous quantitative EEG artifact removal, spectral power mapping, and stoichiometric modeling.",
      credential: "MS in Computational Neurobiology & Electrophysiological Signal Synthesis",
    },
    {
      name: "Elena Rostova",
      role: "Concierge Administrative & Membership Director",
      focus: "Zero-ePHI member onboarding, eClinicalWorks portal provisioning, and private surgical suite scheduling.",
      credential: "Over a decade managing high-acuity concierge specialty practices",
    },
  ];

  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface selection:bg-champagne-gold selection:text-text-on-gold flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full h-[81px] bg-canvas-obsidian/90 backdrop-blur-md border-b border-border-gold-subtle">
        <div className="max-w-[1280px] mx-auto h-full px-6 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display text-lg text-champagne-gold font-semibold">
              COGNITIVE EDGE CLINIC
            </Link>
            <span className="text-xs font-mono text-text-surface-muted">/</span>
            <span className="font-mono text-xs text-text-surface-variant uppercase tracking-widest">
              Clinical Leadership
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/services"
              className="font-mono text-xs text-text-surface-variant hover:text-champagne-gold uppercase tracking-wider transition-colors"
            >
              Services
            </Link>
            {/* Action CTA: Button launching Cal.com Initial Assessment modal */}
            <button
              onClick={() => setIsBookingOpen(true)}
              className="px-5 py-2.5 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            >
              Launch Cal.com Assessment
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 lg:px-10 py-16 space-y-20">
        {/* Editorial Profile Deck matching Figma Frame [50:1124] */}
        <section className="space-y-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-champagne-gold">
              <span className="w-1.5 h-1.5 rounded-full bg-champagne-gold animate-pulse" />
              <span>Medical Director &amp; Lead Neurologist</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-text-surface font-normal">
              Dr. David Andreas Runheim, MD
            </h1>
            <p className="font-mono text-sm text-vitality-sage">
              Board-Certified Neurologist &bull; Neuro-Metabolic Resuscitation Specialist
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Editorial Portrait Container (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-surface-midnight border border-[#D4AF37]/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col justify-end p-8">
                {/* Artistic background gradient */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-canvas-obsidian via-surface-midnight to-surface-container"
                  style={{
                    backgroundImage:
                      "radial-gradient(ellipse at 50% 20%, rgba(212,175,55,0.15), transparent 70%), linear-gradient(to bottom, #121826, #0b0f19)",
                  }}
                />

                {/* Silhouette / Monogram */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10 font-display text-[140px] text-champagne-gold select-none pointer-events-none">
                  DAR
                </div>

                <div className="relative z-10 space-y-2">
                  <div className="font-display text-2xl text-text-surface">
                    David Andreas Runheim, MD
                  </div>
                  <div className="font-mono text-xs text-champagne-gold uppercase tracking-wider">
                    Fellowship Trained &bull; Uppsala University, Sweden
                  </div>
                  <div className="pt-2 border-t border-border-midnight/60 font-mono text-[11px] text-text-surface-muted">
                    Clinical Practice: Winston-Salem Diagnostic Suite
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-midnight border border-border-midnight text-xs font-mono space-y-1.5 text-text-surface-muted">
                <div>Medical License: Active Full Licensure</div>
                <div>Board Certification: American Board of Psychiatry &amp; Neurology</div>
                <div>Sub-specialty: Neuromuscular Physiology &amp; Single-Fiber EMG</div>
              </div>
            </div>

            {/* Editorial Credentials & Biography (7 cols) */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-4 font-body text-base text-text-surface-variant leading-relaxed">
                <p>
                  Dr. David Andreas Runheim, MD is a board-certified neurologist dedicated to transcending reactive neurological medicine. His clinical philosophy centers on restoring the narrow stoichiometric corridors required for optimal neural bioenergetics, mitochondrial respiration, and blood-brain barrier vascular integrity.
                </p>
                <p>
                  Dr. Runheim completed his advanced clinical fellowship in neuromuscular physiology and single-fiber electromyography (SFEMG) at <strong className="text-text-surface font-semibold">Uppsala University Hospital in Sweden</strong> under the direct mentorship of <strong className="text-text-surface font-semibold">Professor Erik Stålberg</strong>, the world-renowned pioneer who invented single-fiber EMG. This rigorous training honed Dr. Runheim’s diagnostic acumen in micro-electrophysiology and microscopic neuromuscular jitter, establishing his foundational conviction that biological latency begins long before structural disease manifests.
                </p>
                <p>
                  With extensive leadership in advanced functional neuroimaging, quantitative EEG spectral mapping, and blood-brain barrier hemodynamics, Dr. Runheim orchestrates multi-modal interventions—combining stereotactic DLPFC neuromodulation, near-infrared photobiomodulation, active coenzyme saturation, and neuro-regenerative peptide kinetics. His protocols eliminate biological friction in entrepreneurs, executives, and elite operators facing intense cognitive demands.
                </p>
              </div>

              {/* Focus Areas Callout Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-surface-midnight border border-border-midnight space-y-2">
                  <div className="font-mono text-xs text-champagne-gold uppercase tracking-wider">
                    Fellowship &amp; Pedigree
                  </div>
                  <h3 className="font-display text-lg text-text-surface">
                    Uppsala University (Erik Stålberg)
                  </h3>
                  <p className="font-body text-xs text-text-surface-variant">
                    Single-fiber electromyography, neuromuscular transmission stability, and pre-clinical synaptic latency detection.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-surface-midnight border border-border-midnight space-y-2">
                  <div className="font-mono text-xs text-champagne-gold uppercase tracking-wider">
                    Core Specialization
                  </div>
                  <h3 className="font-display text-lg text-text-surface">
                    Neuro-Metabolic Resuscitation
                  </h3>
                  <p className="font-body text-xs text-text-surface-variant">
                    Blood-brain barrier vascular integrity, intracellular NAD+ kinetics (40–100 &mu;M), and stoichiometric nutrient balance.
                  </p>
                </div>
              </div>

              {/* In-Biography Action CTA */}
              <div className="pt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(true)}
                  className="px-8 py-3.5 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]"
                >
                  Launch Initial Assessment with Dr. Runheim &rarr;
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Care Team Deck */}
        <section className="space-y-8 pt-12 border-t border-border-midnight">
          <div className="space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-champagne-gold">
              Multi-Disciplinary Clinical Support
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-text-surface font-normal">
              Specialized Care Team Deck
            </h2>
            <p className="font-body text-sm text-text-surface-variant max-w-2xl">
              Every protocol is executed in tandem with dedicated clinical care coordinators, clinical triage staff, and concierge desk administrators operating under strict Zero-ePHI protocols.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {careTeam.map((member, i) => (
              <div
                key={i}
                className="p-8 rounded-xl bg-surface-midnight border border-border-midnight flex flex-col justify-between space-y-6 hover:border-border-gold-subtle transition-colors"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-full bg-canvas-obsidian border border-border-gold-subtle flex items-center justify-center font-mono text-xs text-champagne-gold font-semibold">
                    0{i + 1}
                  </div>
                  <h3 className="font-display text-xl text-text-surface">
                    {member.name}
                  </h3>
                  <div className="font-mono text-xs text-vitality-sage font-medium">
                    {member.role}
                  </div>
                  <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                    {member.focus}
                  </p>
                </div>

                <div className="pt-4 border-t border-border-midnight text-[11px] font-mono text-text-surface-muted">
                  {member.credential}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Card Launching Initial Assessment Modal */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-surface-midnight via-canvas-obsidian to-surface-midnight border border-border-gold-accent text-center space-y-4">
            <h3 className="font-display text-2xl text-text-surface">
              Begin Clinical Protocol Onboarding
            </h3>
            <p className="font-body text-sm text-text-surface-variant max-w-xl mx-auto">
              Our clinical care coordinators and triage team review all diagnostic inputs prior to your 45-minute private consultation.
            </p>
            <div>
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="px-8 py-3.5 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]"
              >
                Launch Cal.com Initial Assessment Modal &rarr;
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-border-gold-subtle bg-surface-midnight py-8 px-6 lg:px-10 text-center font-mono text-xs text-text-surface-muted">
        &copy; 2026 COGNITIVE EDGE CLINIC &bull; ERIK STÅLBERG FELLOWSHIP ALUMNI &bull; BOARD-CERTIFIED NEUROLOGY
      </footer>
    </div>
  );
}

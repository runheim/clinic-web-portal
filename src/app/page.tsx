"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { BookingModal } from "@/components/marketing/BookingModal";

export default function Home() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const [expandedPillar, setExpandedPillar] = useState<number | null>(null);

  const pillars = [
    {
      num: "01",
      title: "Precision Neuromodulation & BDNF",
      desc: "Targeted magnetic pulses to recalibrate neural circuitry, enhancing plasticity and resolving functional latency in prefrontal networks.",
      tag: "TMS / Neurogenesis",
      scientificDetail: "Target Frequency: 10 Hz Theta-Burst • Cortical Target: Left DLPFC • Epigenetic Primer: Ca-AKG (1000mg) • Upregulates BDNF and resolves functional prefrontal latency within 18 sessions.",
    },
    {
      num: "02",
      title: "Endocrine & BHRT Optimization",
      desc: "Dual & tri-agonist metabolic balancing and sex-calibrated hormone kinetics to resolve biological friction and optimize systemic stamina.",
      tag: "Metabolic Endocrinology",
      scientificDetail: "Target Biomarkers: Fasting Insulin < 4.0 uIU/mL, HOMA-IR < 1.0 • Receptor Targets: GLP-1R & GIPR arcuate nucleus signaling • Prevents sarcopenia via essential amino acid kinetic pairing.",
    },
    {
      num: "03",
      title: "Stoichiometric Cellular Saturation",
      desc: "One-carbon metabolism resuscitation, bypassing enzyme hysteresis via active coenzymes (5-MTHF, Methyl-B12, P-5-P) and intracellular NAD+ restoration.",
      tag: "Bioenergetics",
      scientificDetail: "Intracellular NAD+ corridor: 40–100 μM • RBC Magnesium > 6.0 mg/dL • Direct provision of coenzyme-ready donors bypassing MTHFR / MTRR polymorphic bottlenecks.",
    },
    {
      num: "04",
      title: "HIFEM Autonomic Remodeling",
      desc: "High-intensity focused electromagnetic therapy to fortify pelvic floor architecture, intimately linked to vagal tone and parasympathetic recovery.",
      tag: "Autonomic Stability",
      scientificDetail: "Supramaximal contractions: 11,200 per 28-min protocol • Magnetic Field: 2.5 Tesla • Re-anchors visceral vagal tone and baroreflex sensitivity (rMSSD > 55 ms).",
    },
    {
      num: "05",
      title: "Cerebral Photobiomodulation",
      desc: "Transcranial application of near-infrared light targeting cytochrome C oxidase, accelerating ATP synthesis and cortical vascular hemodynamics.",
      tag: "Mitochondrial Optics",
      scientificDetail: "Dual Wavelength: 810nm & 1064nm pulsed at 40 Hz Gamma • Optical penetration directly activates Cytochrome c Oxidase Unit IV, clearing beta-amyloid synaptic debris.",
    },
    {
      num: "06",
      title: "Regenerative Peptide Kinetics",
      desc: "Physician-calibrated peptide protocols (Epitalon, BPC-157, GHK-Cu) targeting cellular senescence mitigation, telomere defense, and tissue repair.",
      tag: "Longevity Vectors",
      scientificDetail: "Epitalon resets pineal melatonin nadir (>15 ng/mL) • BPC-157 accelerates blood-brain barrier tight junction restoration (Zonulin < 38 ng/mL) • Cyclical 8-week pulses.",
    },
  ];

  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface flex flex-col selection:bg-champagne-gold selection:text-text-on-gold">
      {/* 
        1. Navigation: TopNavBar Component [4:2603] (H: 81px)
      */}
      <TopNavBar onOpenBooking={() => setIsBookingOpen(true)} />

      {/* 
        2. Hero Section: Hero Section [4:2640] (MinH: 921px)
      */}
      <HeroSection onOpenBooking={() => setIsBookingOpen(true)} />

      {/* 
        3. Treatment Pillars Grid [4:2712] (Service/Protocol Cards)
      */}
      <section id="modalities" className="py-28 px-6 lg:px-10 max-w-[1280px] mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-champagne-gold">
            <span className="w-1.5 h-1.5 rounded-full bg-champagne-gold" />
            <span>Clinical Modalities &amp; Therapeutic Protocols</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-text-surface">
            Physiological Foundations of Cognitive Performance
          </h2>
          <p className="font-body text-base text-text-surface-variant">
            Our proprietary protocols target root-cause cellular mechanics, restoring the delicate stoichiometric corridors necessary for elite cognitive longevity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((p, i) => (
            <div
              key={i}
              data-testid={`pillar-card-${i}`}
              onClick={() => setExpandedPillar(expandedPillar === i ? null : i)}
              className="group p-8 rounded-xl bg-surface-midnight border border-border-midnight hover:border-border-gold-accent transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between cursor-pointer select-none"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs text-champagne-gold tracking-widest">{p.num}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded bg-canvas-obsidian border border-border-midnight text-text-surface-muted group-hover:text-champagne-gold transition-colors">
                    {p.tag}
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl text-text-surface mb-3 group-hover:text-champagne-gold-light transition-colors">
                  {p.title}
                </h3>
                <p className="font-body text-sm leading-relaxed text-text-surface-variant">
                  {p.desc}
                </p>

                {/* Progressive Disclosure Section: Expands within 300ms */}
                <div
                  data-testid={`pillar-details-${i}`}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedPillar === i ? "max-h-48 opacity-100 mt-4 pt-4 border-t border-border-midnight" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="p-3 rounded bg-canvas-obsidian/80 border border-border-gold-subtle text-xs font-mono text-vitality-sage space-y-1">
                    <div className="text-[10px] text-champagne-gold uppercase tracking-wider font-semibold">
                      Scientific Telemetry &bull; Progressive Disclosure
                    </div>
                    <p className="leading-relaxed text-text-surface-variant">
                      {p.scientificDetail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border-midnight/80 flex items-center justify-between">
                <span className="font-mono text-xs text-champagne-gold hover:text-champagne-gold-light tracking-wider uppercase inline-flex items-center gap-1">
                  <span>{expandedPillar === i ? "Hide Telemetry" : "Expand Scientific Details"}</span>
                  <span>{expandedPillar === i ? "&uarr;" : "&rarr;"}</span>
                </span>
                <span className="text-[10px] font-mono text-text-surface-muted">Click Card</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 
        4. Scientific Paradigm Split Section [4:2663]
      */}
      <section id="philosophy" className="py-24 border-y border-border-gold-subtle bg-surface-midnight/50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="font-mono text-xs uppercase tracking-widest text-vitality-sage">
              Scientific Paradigm &bull; The New Standard
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-text-surface leading-tight">
              Moving Beyond Reactive Pathology to Predictive Biomolecular Architecture
            </h2>
            <p className="font-body text-base text-text-surface-variant leading-relaxed">
              Standard clinical diagnostics operate within wide reference ranges designed only to detect acute disease. We establish your narrow biological corridors—optimizing substrate availability, neural signaling efficiency, and deep restorative sleep architecture.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-lg bg-canvas-obsidian border border-border-midnight">
                <div className="font-display text-2xl text-champagne-gold mb-1">40–100 &mu;M</div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-text-surface-muted">Target Intracellular NAD+</div>
              </div>
              <div className="p-4 rounded-lg bg-canvas-obsidian border border-border-midnight">
                <div className="font-display text-2xl text-champagne-gold mb-1">&lt; 0.5%</div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-text-surface-muted">Allowable Enzymatic Hysteresis</div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-xl bg-canvas-obsidian border border-border-gold-subtle space-y-6">
            <h3 className="font-display text-xl text-text-surface">
              Precision Diagnostic Corridor
            </h3>
            <ul className="space-y-4 text-sm font-body text-text-surface-variant">
              <li className="flex items-start gap-3">
                <span className="text-champagne-gold font-mono">&#10003;</span>
                <span>Direct coenzyme-ready methylation donors bypassing MTHFR / MTRR polymorphic bottlenecks.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-champagne-gold font-mono">&#10003;</span>
                <span>Continuous multi-spectral autonomic tone tracking &amp; cortical connectivity mapping.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-champagne-gold font-mono">&#10003;</span>
                <span>Non-invasive HIFEM neuro-visceral reinforcement restoring vagal reserve.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 
        5. Scheduling CTA: Intake Invitation [4:2699]
      */}
      <section id="intake" className="py-28 px-6 lg:px-10 text-center max-w-3xl mx-auto w-full">
        <div className="space-y-4 mb-8">
          <div className="font-mono text-xs uppercase tracking-widest text-champagne-gold">
            Confidential Clinical Intake
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-text-surface">
            Apply for Diagnostic Consultation
          </h2>
          <p className="font-body text-base text-text-surface-variant">
            Corridors are strictly limited to ensure uncompromising stoichiometric precision and continuous physician monitoring.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsBookingOpen(true);
          }}
          className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
        >
          <input
            type="email"
            required
            placeholder="ENTER CLINICAL COMMUNICATION EMAIL"
            className="flex-1 px-5 py-3.5 rounded-full bg-surface-midnight border border-border-midnight text-text-surface font-mono text-xs placeholder:text-text-surface-muted/60 focus:outline-none focus:border-champagne-gold"
          />
          <button
            type="submit"
            className="px-8 py-3.5 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]"
          >
            Apply for Consultation
          </button>
        </form>
      </section>

      {/* 
        6. Footer Component [4:2773]
      */}
      <footer className="mt-auto border-t border-border-gold-subtle bg-surface-midnight/80 py-12 px-6 lg:px-10">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
            <span className="font-display text-base tracking-widest text-champagne-gold">
              COGNITIVE EDGE CLINIC
            </span>
            <span className="font-mono text-[10px] text-text-surface-muted tracking-wider mt-1">
              &copy; 2026 COGNITIVE EDGE CLINICAL GROUP &bull; ALL RIGHTS RESERVED
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-[11px] uppercase tracking-wider text-text-surface-variant">
            <Link href="#philosophy" className="hover:text-champagne-gold transition-colors">
              Ethical Guidelines
            </Link>
            <Link href="/vault" className="hover:text-champagne-gold transition-colors">
              Client Portal
            </Link>
            <span className="text-text-surface-muted">&bull;</span>
            <span className="text-text-surface-muted">HIPAA Compliant</span>
            <span className="text-text-surface-muted">SOC2 Type II</span>
          </div>
        </div>
      </footer>

      {/* 
        Cal.com Booking Modal Bridge [4:6747]
      */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}

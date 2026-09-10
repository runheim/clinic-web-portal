"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { servicesData } from "@/data/servicesData";
import { BookingModal } from "@/components/marketing/BookingModal";
import { ModalityArtwork } from "@/components/visualizations/ModalityVisualizations";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ServiceDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const targetSlug = resolvedParams.slug === "neuromodulation" ? "tms-neuromodulation" : resolvedParams.slug;
  const service = servicesData.find((s) => s.slug === targetSlug);

  if (!service) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface selection:bg-champagne-gold selection:text-text-on-gold flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full h-[81px] bg-canvas-obsidian/90 backdrop-blur-md border-b border-border-gold-subtle">
        <div className="max-w-[1280px] mx-auto h-full px-6 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display text-lg text-champagne-gold font-semibold">
              COGNITIVE EDGE
            </Link>
            <span className="text-xs font-mono text-text-surface-muted">/</span>
            <Link href="/services" className="font-mono text-xs text-text-surface-variant hover:text-champagne-gold uppercase tracking-wider">
              Services
            </Link>
            <span className="text-xs font-mono text-text-surface-muted">/</span>
            <span className="font-mono text-xs text-text-surface-muted truncate max-w-[200px] sm:max-w-none">
              {service.title.split(" ")[0]}...
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsBookingOpen(true)}
              className="px-5 py-2.5 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] btn-luxury-shimmer"
            >
              Book Evaluation
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 lg:px-10 py-12 space-y-12">
        {/* Title & Header with Bespoke Scientific Blueprint */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-border-midnight pb-10">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-champagne-gold">
              <span className="w-2 h-2 rounded-full bg-vitality-sage" />
              <span>{service.tagline}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-text-surface leading-tight font-normal">
              {service.title}
            </h1>
            <p className="font-mono text-sm text-vitality-sage">
              {service.subtitle}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-text-surface-muted">
              <span className="px-3 py-1 rounded bg-surface-midnight border border-border-midnight text-champagne-gold">
                Cadence: {service.clinicalCadence.frequency}
              </span>
              <span className="px-3 py-1 rounded bg-surface-midnight border border-border-midnight text-text-surface-variant">
                Session: {service.clinicalCadence.duration}
              </span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-border-gold-accent shadow-[0_10px_35px_rgba(0,0,0,0.7)] bg-surface-midnight">
              <ModalityArtwork slug={service.slug} className="w-full h-full" variant="hero" />
            </div>
          </div>
        </div>

        {/* Executive Abstract Section */}
        <div className="bg-surface-midnight border border-border-midnight rounded-xl p-8 space-y-4 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
          <h2 className="font-display text-2xl text-text-surface">
            Executive Abstract &amp; Mechanistic Rationale
          </h2>
          <p className="font-body text-base text-text-surface-variant leading-relaxed">
            {service.abstract}
          </p>
        </div>

        {/* Molecular Target Mechanisms Table */}
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-champagne-gold">
              Stoichiometric Specificity
            </span>
            <h2 className="font-display text-2xl sm:text-3xl text-text-surface">
              Molecular Target Mechanisms
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {service.molecularTargets.map((target, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-surface-midnight/80 border border-border-midnight space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg text-champagne-gold-light">
                    {target.name}
                  </h3>
                  <span className="font-mono text-[10px] uppercase text-text-surface-muted px-2 py-0.5 rounded bg-canvas-obsidian border border-border-midnight">
                    Target 0{i + 1}
                  </span>
                </div>
                <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                  {target.mechanism}
                </p>
                {target.biomarkerRange && (
                  <div className="pt-2 border-t border-border-midnight/60 font-mono text-[11px] text-vitality-sage">
                    <span className="text-text-surface-muted">Corridor: </span>
                    <span>{target.biomarkerRange}</span>
                  </div>
                )}
                {target.coFactors && (
                  <div className="font-mono text-[10px] text-text-surface-muted">
                    <span>Cofactors: </span>
                    <span className="text-text-surface-variant">{target.coFactors.join(" &bull; ")}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Cadence & Protocol Architecture */}
        <div className="p-8 rounded-xl bg-canvas-obsidian border border-border-gold-subtle space-y-6">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-champagne-gold">
              Treatment Protocol Architecture
            </span>
            <h2 className="font-display text-2xl text-text-surface">
              Clinical Cadence &amp; Telemetry Corridor
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-lg bg-surface-midnight border border-border-midnight space-y-1">
              <span className="text-text-surface-muted uppercase text-[10px]">Frequency</span>
              <div className="text-text-surface font-semibold">{service.clinicalCadence.frequency}</div>
            </div>
            <div className="p-4 rounded-lg bg-surface-midnight border border-border-midnight space-y-1">
              <span className="text-text-surface-muted uppercase text-[10px]">Session Duration</span>
              <div className="text-text-surface font-semibold">{service.clinicalCadence.duration}</div>
            </div>
            <div className="p-4 rounded-lg bg-surface-midnight border border-border-midnight space-y-1">
              <span className="text-text-surface-muted uppercase text-[10px]">Delivery Corridor</span>
              <div className="text-text-surface font-semibold">{service.clinicalCadence.deliveryMethod}</div>
            </div>
            <div className="p-4 rounded-lg bg-surface-midnight border border-border-midnight space-y-1">
              <span className="text-text-surface-muted uppercase text-[10px]">Telemetry Oversight</span>
              <div className="text-vitality-sage font-semibold">{service.clinicalCadence.monitoringCorridor}</div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            TASK 4: High-Contrast Safety Contraindications Panel
            Locks NAD+ on oncological history, caps B6/P5P at <20mg/day, monitors PT/INR, etc.
           ========================================================================= */}
        <div className="p-8 rounded-xl bg-surface-midnight border-2 border-red-900/70 shadow-[0_10px_35px_rgba(150,0,0,0.2)] space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 font-bold text-sm">
              !
            </div>
            <div>
              <h2 className="font-display text-xl text-text-surface">
                High-Contrast Safety Contraindications Panel
              </h2>
              <p className="font-mono text-xs text-red-300/80">
                {service.contraindicationsGate.summary}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {service.contraindicationsGate.rules.map((rule, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-canvas-obsidian border border-red-950/70 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-red-300">
                    {rule.condition}
                  </span>
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-red-950 text-red-400 font-bold border border-red-800/40">
                    {rule.action}
                  </span>
                </div>
                <p className="font-body text-xs text-text-surface-variant">
                  {rule.rationale}
                </p>
              </div>
            ))}
          </div>

          <p className="text-[11px] font-mono text-text-surface-muted italic">
            * All protocol candidates undergo physician-led biochemical validation and contraindication clearance before intervention deployment.
          </p>
        </div>

        {/* Inline Cal.com Booking CTA */}
        <div className="p-8 rounded-xl bg-gradient-to-r from-surface-midnight via-canvas-obsidian to-surface-midnight border border-border-gold-accent text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="font-display text-2xl sm:text-3xl text-text-surface">
              Begin Clinical Protocol Evaluation
            </h3>
            <p className="font-body text-sm text-text-surface-variant">
              Reserve your 45-minute neuro-diagnostic consultation with Lead Neurologist Dr. David Andreas Runheim.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsBookingOpen(true)}
            className="px-8 py-3.5 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(212,175,55,0.3)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Open Cal.com Reservation &rarr;
          </button>
        </div>
      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-border-gold-subtle bg-surface-midnight py-8 px-6 lg:px-10 text-center font-mono text-xs text-text-surface-muted">
        &copy; 2026 COGNITIVE EDGE CLINIC &bull; RIGOROUS SAFETY CORRIDORS
      </footer>
    </div>
  );
}

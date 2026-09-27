"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CLINICAL_SERVICES, ClinicalService } from "@/data/clinicalServices";
import { ModalityArtwork } from "@/components/visualizations/ModalityVisualizations";

export default function ServicesPage() {
  const [activeModalService, setActiveModalService] = useState<ClinicalService | null>(null);
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({
    tms: true,
    "dementia-prevention": true,
    peptides: true,
    "hormone-optimization": true,
    emsella: true,
    glp1: true,
    photobiomodulation: true,
    infusions: true,
    "nad-bdnf": true,
  });

  const toggleExpanded = (id: string) => {
    setExpandedServices((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface selection:bg-champagne-gold selection:text-text-on-gold flex flex-col font-body">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 w-full h-[81px] bg-canvas-obsidian/90 backdrop-blur-md border-b border-border-gold-subtle">
        <div className="max-w-[1280px] mx-auto h-full px-6 lg:px-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="font-display text-lg tracking-wider text-champagne-gold font-semibold group-hover:text-champagne-gold-light transition-colors">
              COGNITIVE EDGE CLINIC
            </span>
            <span className="text-xs font-mono text-text-surface-muted">/</span>
            <span className="font-mono text-xs text-text-surface-variant uppercase tracking-widest">
              Clinical Modalities
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/vault"
              className="font-mono text-xs uppercase tracking-wider text-text-surface-variant hover:text-champagne-gold transition-colors"
            >
              Member Portal
            </Link>
            <Link
              href="/consultation"
              className="px-4 py-2 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all btn-luxury-shimmer"
            >
              Schedule Consultation
            </Link>
          </div>
        </div>
      </header>

      {/* Main Catalog Header */}
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 lg:px-10 py-16">
        <div className="max-w-4xl mx-auto mb-16 text-center space-y-4">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-champagne-gold px-3.5 py-1.5 rounded-full bg-surface-midnight border border-border-gold-subtle">
            <span className="w-1.5 h-1.5 rounded-full bg-champagne-gold animate-pulse" />
            <span>● ADVANCED CLINICAL MODALITIES</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl text-text-surface font-normal leading-[1.15]">
            Engineered Protocols for Cognitive Longevity &amp; Cellular Vitality
          </h1>
          <p className="font-body text-base sm:text-lg text-text-surface-variant max-w-2xl mx-auto leading-relaxed">
            A unified clinical spectrum bridging targeted neuromodulation, advanced cellular biochemistry, and whole-body metabolic restoration.
          </p>
        </div>

        {/* 9 Clinical Modalities Interactive Stack */}
        <div className="flex flex-col gap-12">
          {CLINICAL_SERVICES.map((service) => {
            const isExpanded = !!expandedServices[service.id];

            return (
              <article
                key={service.id}
                id={service.id}
                className="scroll-mt-28 p-8 sm:p-10 rounded-2xl bg-surface-midnight/80 border border-border-midnight hover:border-champagne-gold/50 transition-all duration-300 shadow-xl hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)] space-y-8"
              >
                {/* Visual Header & Metadata */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-border-midnight pb-6">
                  {/* Schematic Thumbnail */}
                  <div className="lg:col-span-5 w-full h-52 sm:h-56 rounded-xl overflow-hidden border border-border-midnight/90 bg-[#070B12] shadow-inner">
                    <ModalityArtwork slug={service.id} className="w-full h-full" />
                  </div>

                  {/* Summary & Identity */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[#D4AF37] font-mono text-sm tracking-widest font-bold">
                        {service.number}
                      </span>
                      <span className="text-slate-600 font-mono text-xs">/</span>
                      <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-[#070B12] border border-[#D4AF37]/30 text-champagne-gold font-semibold">
                        {service.sessionBadge}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-canvas-obsidian border border-border-midnight text-[#D4AF37]">
                        {service.badge}
                      </span>
                    </div>

                    <h2 className="font-display text-2xl sm:text-3xl text-text-surface font-normal">
                      {service.title}
                    </h2>

                    <p className="font-mono text-xs text-vitality-sage">
                      {service.focus}
                    </p>

                    <p className="font-body text-slate-300 text-sm sm:text-base leading-relaxed">
                      {service.shortSummary}
                    </p>

                    {/* Action Bar */}
                    <div className="pt-2 flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setActiveModalService(service)}
                        className="font-mono text-xs uppercase tracking-wider text-text-on-gold bg-champagne-gold hover:bg-champagne-gold-light py-2.5 px-4 rounded-full font-bold inline-flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(212,175,55,0.25)] cursor-pointer"
                      >
                        <span>INSPECT PROTOCOL</span>
                        <span>→</span>
                      </button>

                      <Link
                        href={`/services/${service.id}`}
                        className="font-mono text-xs uppercase tracking-wider text-slate-300 hover:text-champagne-gold inline-flex items-center gap-1.5 py-2.5 px-4 rounded-full bg-canvas-obsidian border border-border-midnight hover:border-champagne-gold/40 transition-all"
                        title={`View dedicated ${service.title} clinical protocol dossier`}
                      >
                        <span>Full Dossier</span>
                        <span>↗</span>
                      </Link>

                      <Link
                        href="/consultation"
                        className="font-mono text-xs uppercase tracking-wider text-[#D4AF37] hover:text-[#E6C65C] inline-flex items-center gap-1.5 py-2.5 px-4 rounded-full bg-canvas-obsidian border border-border-midnight hover:border-champagne-gold/40 transition-all"
                      >
                        <span>Consultation Pathway</span>
                        <span>→</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => toggleExpanded(service.id)}
                        className="font-mono text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {isExpanded ? "Collapse Details ↑" : "Show Full Science ↓"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Scientific Overview */}
                <div className="space-y-4">
                  <p className="font-body text-slate-300 text-sm sm:text-base leading-relaxed">
                    {service.expandedOverview}
                  </p>
                </div>

                {/* Technical Dossier: Mechanisms & Indications */}
                <div
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-border-midnight/70 transition-all ${
                    isExpanded ? "block" : "hidden sm:grid"
                  }`}
                >
                  {/* Physiological & Molecular Mechanisms */}
                  <div className="lg:col-span-7 space-y-3">
                    <h3 className="font-mono text-xs uppercase tracking-wider text-[#D4AF37] font-semibold flex items-center gap-2">
                      <span>✦</span>
                      <span>Physiological &amp; Molecular Mechanisms</span>
                    </h3>
                    <ul className="space-y-2.5 list-none pt-1">
                      {service.clinicalMechanisms.map((mech, mIdx) => (
                        <li key={mIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                          <span className="text-[#D4AF37] mt-0.5 shrink-0 text-xs">◆</span>
                          <span className="leading-relaxed">{mech}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Target Indications & Optimization Goals */}
                  <div className="lg:col-span-5 space-y-3">
                    <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-2">
                      <span>◎</span>
                      <span>Target Indications &amp; Optimization Goals</span>
                    </h3>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {service.targetIndications.map((ind, iIdx) => (
                        <span
                          key={iIdx}
                          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full font-body"
                        >
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* CTA Anchor Banner at Page Bottom */}
        <div className="mt-16 p-8 sm:p-12 rounded-2xl bg-gradient-to-b from-surface-midnight to-canvas-obsidian border border-border-gold-subtle text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-champagne-gold">
              <span>✦</span>
              <span>Physician-Directed Care</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl text-text-surface font-normal">
              Begin Your Clinical Longevity Evaluation
            </h2>
            <p className="font-body text-sm sm:text-base text-text-surface-variant leading-relaxed">
              Schedule a consultation with our clinical coordinator to construct your personalized neuro-cellular protocol.
            </p>
          </div>
          <div>
            <Link
              href="/consultation"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(212,175,55,0.3)] btn-luxury-shimmer"
            >
              <span>Schedule a Free Consultation</span>
              <span className="text-sm">→</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Scientific Inspection Drawer Modal */}
      {activeModalService && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-protocol-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
        >
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0C121E] border border-border-gold-subtle p-6 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.9)] space-y-6">
            <div className="flex items-center justify-between border-b border-border-midnight pb-4">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-sm font-bold text-champagne-gold">
                  {activeModalService.number}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-[#070B12] border border-[#D4AF37]/30 text-champagne-gold">
                  {activeModalService.sessionBadge}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-canvas-obsidian border border-border-midnight text-[#D4AF37]">
                  {activeModalService.badge}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalService(null)}
                className="w-8 h-8 rounded-full bg-[#070B12] border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm cursor-pointer"
                aria-label="Close Inspection Drawer"
              >
                ✕
              </button>
            </div>

            <div className="w-full h-52 sm:h-64 rounded-xl overflow-hidden border border-border-midnight bg-[#070B12]">
              <ModalityArtwork slug={activeModalService.id} className="w-full h-full" />
            </div>

            <div className="space-y-2">
              <h2 id="modal-protocol-title" className="font-display text-2xl sm:text-3xl text-white">
                {activeModalService.title}
              </h2>
              <p className="font-mono text-xs text-vitality-sage">
                {activeModalService.focus}
              </p>
            </div>

            <p className="font-body text-slate-300 text-sm leading-relaxed">
              {activeModalService.expandedOverview}
            </p>

            <div className="space-y-3 pt-2 border-t border-border-midnight">
              <h3 className="font-mono text-xs uppercase tracking-wider text-[#D4AF37] font-semibold">
                ✦ Physiological &amp; Molecular Mechanisms
              </h3>
              <ul className="space-y-2 list-none">
                {activeModalService.clinicalMechanisms.map((mech, mIdx) => (
                  <li key={mIdx} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-champagne-gold mt-0.5">◆</span>
                    <span>{mech}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 pt-2 border-t border-border-midnight">
              <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 font-semibold">
                ◎ Target Indications &amp; Optimization Goals
              </h3>
              <div className="flex flex-wrap gap-2">
                {activeModalService.targetIndications.map((ind, iIdx) => (
                  <span
                    key={iIdx}
                    className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full font-body"
                  >
                    {ind}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-border-midnight">
              <button
                type="button"
                onClick={() => setActiveModalService(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-700 text-slate-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
              <Link
                href="/consultation"
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] text-center btn-luxury-shimmer"
              >
                <span>Consultation Pathway</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border-gold-subtle bg-surface-midnight py-8 px-6 lg:px-10 text-center font-mono text-xs text-text-surface-muted">
        &copy; 2026 COGNITIVE EDGE CLINIC &bull; PHYSICIAN-DIRECTED PROTOCOLS &bull; STRICT CONTRAINDICATION SCREENING
      </footer>
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { servicesData } from "@/data/servicesData";
import { ModalityArtwork } from "@/components/visualizations/ModalityVisualizations";

export const metadata = {
  title: "Clinical Services & Modalities — Cognitive Edge Clinic",
  description:
    "Explore our 7 physician-guided clinical modalities targeting mitochondrial bioenergetics, prefrontal neuroplasticity, and stoichiometric longevity corridors.",
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface selection:bg-champagne-gold selection:text-text-on-gold flex flex-col">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 w-full h-[81px] bg-canvas-obsidian/90 backdrop-blur-md border-b border-border-gold-subtle">
        <div className="max-w-[1280px] mx-auto h-full px-6 lg:px-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="font-display text-lg tracking-wider text-champagne-gold font-semibold">
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
              Client Portal
            </Link>
            <Link
              href="/#intake"
              className="px-4 py-2 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all btn-luxury-shimmer"
            >
              Apply for Intake
            </Link>
          </div>
        </div>
      </header>

      {/* Main Catalog Header */}
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 lg:px-10 py-16">
        <div className="max-w-3xl mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-champagne-gold">
            <span className="w-1.5 h-1.5 rounded-full bg-champagne-gold animate-pulse" />
            <span>Physician-Guided Therapeutic Corridors</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-text-surface font-normal">
            Precision Clinical Modalities
          </h1>
          <p className="font-body text-base sm:text-lg text-text-surface-variant leading-relaxed">
            Every intervention is calibrated to longitudinal biomarker baselines, active coenzyme kinetics, and strict safety gates. Select a modality to examine molecular mechanisms and contraindication gates.
          </p>
        </div>

        {/* 7 Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesData.map((service, index) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group p-7 rounded-xl bg-surface-midnight border border-border-midnight hover:border-border-gold-accent transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between overflow-hidden"
            >
              <div className="space-y-4">
                {/* Bespoke Scientific Vector Art Thumbnail */}
                <div className="w-full h-44 rounded-lg overflow-hidden border border-border-midnight/80 group-hover:border-border-gold-subtle transition-colors duration-300 shadow-inner">
                  <ModalityArtwork slug={service.slug} className="w-full h-full" />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-xs text-champagne-gold font-bold tracking-widest">
                    0{index + 1}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded bg-canvas-obsidian border border-border-midnight text-text-surface-muted group-hover:text-champagne-gold transition-colors">
                    {service.clinicalCadence.frequency.split(" ")[0]} Sessions
                  </span>
                </div>

                <h2 className="font-display text-xl sm:text-2xl text-text-surface group-hover:text-champagne-gold-light transition-colors leading-snug">
                  {service.title}
                </h2>

                <p className="font-mono text-xs text-vitality-sage">
                  {service.subtitle}
                </p>

                <p className="font-body text-sm text-text-surface-variant line-clamp-3 leading-relaxed">
                  {service.abstract}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-border-midnight flex items-center justify-between font-mono text-xs text-champagne-gold group-hover:text-champagne-gold-light">
                <span className="uppercase tracking-wider">Inspect Protocol</span>
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-gold-subtle bg-surface-midnight py-8 px-6 lg:px-10 text-center font-mono text-xs text-text-surface-muted">
        &copy; 2026 COGNITIVE EDGE CLINIC &bull; PHYSICIAN-DIRECTED PROTOCOLS &bull; STRICT CONTRAINDICATION SCREENING
      </footer>
    </div>
  );
}

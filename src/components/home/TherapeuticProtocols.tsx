"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CLINICAL_SERVICES } from "@/data/clinicalServices";

export function TherapeuticProtocols() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <section id="modalities" className="py-28 px-6 lg:px-10 max-w-[1280px] mx-auto w-full">
      <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-champagne-gold">
          <span className="w-1.5 h-1.5 rounded-full bg-champagne-gold" />
          <span>● CLINICAL MODALITIES &amp; THERAPEUTIC PROTOCOLS</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-text-surface">
          Physiological Foundations of Cognitive Performance
        </h2>
        <p className="font-body text-base text-text-surface-variant">
          Physician-engineered protocols targeting root-cause cellular vitality, neural circuit plasticity, and systemic longevity across every stage of life.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CLINICAL_SERVICES.map((service, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <div
              key={service.id}
              data-testid={`pillar-card-${index}`}
              className="group bg-[#0C121E]/60 border border-slate-800/80 hover:border-[#D4AF37]/50 rounded-xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:shadow-black/50 hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-champagne-gold tracking-widest font-semibold">
                    {service.number}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded bg-[#0B0F19] border border-border-midnight text-text-surface-muted group-hover:text-champagne-gold transition-colors">
                    {service.badge}
                  </span>
                </div>

                <Link href={`/services#${service.id}`} className="block group-hover:text-champagne-gold-light transition-colors">
                  <h3 className="font-display text-xl sm:text-2xl text-text-surface leading-snug">
                    {service.title}
                  </h3>
                </Link>

                <p className="font-body text-sm leading-relaxed text-text-surface-variant">
                  {service.shortSummary}
                </p>

                {/* Progressive Disclosure Section */}
                <div
                  id={`pillar-details-${index}`}
                  data-testid={`pillar-details-${index}`}
                  role="region"
                  aria-label={`${service.title} scientific telemetry`}
                  className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isExpanded ? "max-h-60 opacity-100 mt-4 pt-4 border-t border-border-midnight" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="p-3.5 rounded-lg bg-[#0B0F19] border border-border-gold-subtle text-xs font-mono space-y-2">
                    <div className="text-[10px] text-champagne-gold uppercase tracking-wider font-semibold">
                      Molecular &amp; Neural Mechanisms
                    </div>
                    <ul className="space-y-1 text-text-surface-variant list-none">
                      {service.clinicalMechanisms.map((mech, mIdx) => (
                        <li key={mIdx} className="flex items-start gap-1.5">
                          <span className="text-champagne-gold text-[10px] mt-0.5">◆</span>
                          <span className="leading-relaxed">{mech}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Telemetry Toggle Button */}
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="font-mono text-[11px] text-slate-400 hover:text-champagne-gold transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{isExpanded ? "Collapse Telemetry" : "Scientific Telemetry"}</span>
                  <span className="text-xs">{isExpanded ? "↑" : "↓"}</span>
                </button>
              </div>

              {/* Card Footer with Semantic JSX Arrow and Routing */}
              <Link
                href={`/services#${service.id}`}
                className="mt-6 pt-4 border-t border-slate-800/80 block"
              >
                <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-[#D4AF37]/80 group-hover:text-[#D4AF37] transition-colors">
                  <span>Explore Clinical Protocol</span>
                  <span className="text-base transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default TherapeuticProtocols;

"use client";

import React from "react";

export interface InPortalService {
  name: string;
  category: string;
  detail: string;
  coverage: string;
}

export const IN_PORTAL_SERVICES: InPortalService[] = [
  {
    name: "Deep TMS (Neuroplasticity, Mood, Executive Performance & Insomnia)",
    category: "Targeted Neuromodulation",
    detail: "10 Hz Theta-Burst DLPFC recalibration paired with Ca-AKG epigenetic priming.",
    coverage: "Eligible for commercial health insurance coverage with private protocol tiers.",
  },
  {
    name: "Expanded Dementia & MCI Therapies (including Alzheimer's anti-amyloid navigation)",
    category: "Neuro-Cognitive Trajectory",
    detail: "Longitudinal blood-brain barrier monitoring, p-Tau217 tracking, and emerging anti-amyloid clinical coordination.",
    coverage: "Physician clinical consultations and diagnostic evaluations billable to insurance.",
  },
  {
    name: "Testosterone Pellet Implantation & Endocrine BHRT",
    category: "Precision Endocrinology",
    detail: "Subcutaneous bioidentical hormone pellet kinetics and androgen receptor balancing.",
    coverage: "Evaluation and comprehensive laboratory panels billable to insurance.",
  },
  {
    name: "Clinical Intravenous (IV) Infusion & Micronutrient Therapy",
    category: "Cellular Bioenergetics",
    detail: "Targeted stoichiometric coenzyme formulas, high-potency glutathione, and peripheral nerve infusions.",
    coverage: "Physician consultation insurance eligible; compound infusion fees apply.",
  },
  {
    name: "BTL Emsella Pelvic Floor & Autonomic Vagal Restoration",
    category: "HIFEM Autonomic Remodeling",
    detail: "2.5 Tesla supramaximal pelvic diaphragm remodeling restoring vagal reserve and parasympathetic braking.",
    coverage: "Specialized in-clinic neuromodulation protocol series.",
  },
  {
    name: "Regenerative & Anti-Aging Peptides (Epitalon, BPC-157, GHK-Cu)",
    category: "Cellular Bioregulators",
    detail: "Subcutaneous cyclical bioregulators targeting pineal melatonin nadir, vascular tight junctions, and cellular repair.",
    coverage: "Physician oversight and compounding pharmacy coordination.",
  },
  {
    name: "Dual & Tri-Agonist GLP-1 Weight Management",
    category: "Metabolic Medicine",
    detail: "Next-generation incretin receptor therapy paired with essential amino acid kinetic pacing to prevent sarcopenia.",
    coverage: "Initial physician intake and metabolic laboratory work billable to insurance.",
  },
  {
    name: "Red Light Therapy & Transcranial Photobiomodulation",
    category: "Mitochondrial Optics",
    detail: "Dual-wavelength (810nm / 1064nm) pulsed near-infrared light targeting Cytochrome c Oxidase Unit IV.",
    coverage: "Integrated restorative clinical protocol.",
  },
  {
    name: "Bespoke Vitamin, Peripheral Nerve & Mitochondrial Formulations",
    category: "Neuro-Mitochondrial",
    detail: "Active coenzyme forms (5-MTHF, Methyl-B12, P-5-P) bypassing MTHFR and transsulfuration bottlenecks.",
    coverage: "Personalized pharmaceutical compounding oversight.",
  },
  {
    name: "Mitochondrial, NAD+ & BDNF Amplification Protocols",
    category: "Intracellular Resuscitation",
    detail: "Direct replenishment of intracellular NAD+ corridors (40–100 μM) and TrkB neurogenesis activation.",
    coverage: "Physician-monitored stoichiometric protocol series.",
  },
];

export function ClinicalServicesProtocols() {
  return (
    <section className="bg-[#121826] border border-[#D4AF37]/20 rounded-xl p-8 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Hybrid Insurance & Fee Model Statement Banner */}
      <div className="p-5 rounded-xl bg-[#0B0F19] border border-[#D4AF37]/40 space-y-2 shadow-inner">
        <div className="font-mono text-xs uppercase tracking-widest text-[#D4AF37] font-semibold flex items-center gap-2">
          <span>✦</span>
          <span>Billing &amp; Insurance Notice</span>
        </div>
        <p className="font-body text-xs sm:text-sm text-slate-200 leading-relaxed">
          We utilize a hybrid payment model. Clients may choose to utilize their commercial health insurance for physician clinic appointments, diagnostic evaluations, and eligible laboratory assessments, alongside private-tier wellness and restorative protocols.
        </p>
      </div>

      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            <span>Clinical Services &amp; Protocols</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-white">
            Comprehensive Clinical Modality Catalog
          </h2>
        </div>
        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider hidden sm:block">
          Physician Directed
        </span>
      </div>

      {/* Comprehensive In-Portal Service Menu Expansion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {IN_PORTAL_SERVICES.map((service, index) => (
          <div
            key={index}
            className="p-5 rounded-lg bg-[#0B0F19] border border-slate-800 hover:border-[#D4AF37]/40 transition-colors space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider">
                <span>{service.category}</span>
                <span className="text-slate-500">
                  {index + 1 < 10 ? `0${index + 1}` : index + 1}
                </span>
              </div>
              <h3 className="font-display text-base text-white leading-snug">
                {service.name}
              </h3>
              <p className="font-body text-xs text-slate-400 leading-relaxed">
                {service.detail}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 font-mono text-[10.5px] text-vitality-sage">
              {service.coverage}
            </div>
          </div>
        ))}
      </div>

      {/* eClinicalWorks External Gateway Bridge */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-body text-xs text-slate-400">
          Certified medical encounter notes, pathology panels, and formal medical charts reside in our certified records enclave.
        </p>
        <a
          href="https://mycwXX.eclinicalworks.com/portal"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 py-3 px-5 rounded-lg bg-[#0B0F19] hover:bg-slate-900 border border-slate-700 hover:border-[#D4AF37] text-slate-200 font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
        >
          <span>Launch eClinicalWorks Patient Portal</span>
          <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </section>
  );
}

export default ClinicalServicesProtocols;

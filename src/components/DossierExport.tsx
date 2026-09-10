"use client";

import React from "react";

export function DossierExport() {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <>
      {/* Interactive Trigger Button */}
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-surface-midnight hover:bg-canvas-obsidian border border-[#D4AF37]/50 hover:border-champagne-gold text-champagne-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-inner hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]"
      >
        <svg className="w-4 h-4 text-champagne-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
        <span>Download Clinical Protocol Dossier (PDF / Print)</span>
      </button>

      {/* 
        =============================================================================
        EDITORIAL CLINICAL DOSSIER PRINT CANVAS
        Hidden on screen (@media screen { display: none }), rendered only on print.
        Formatted specifically for US Letter & A4 output.
        =============================================================================
      */}
      <div className="dossier-print-container hidden print:block text-black bg-white">
        <style>{`
          @media print {
            @page {
              size: letter;
              margin: 18mm 16mm;
            }
            body {
              background: #ffffff !important;
              color: #111827 !important;
              font-family: var(--font-eb-garamond), Georgia, serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* Hide all screen chrome */
            header,
            footer,
            nav,
            aside,
            button,
            .no-print {
              display: none !important;
            }
            .dossier-print-container {
              display: block !important;
              width: 100% !important;
            }
            .page-break {
              page-break-after: always !important;
              break-after: page !important;
            }
            .avoid-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        `}</style>

        {/* =========================================================================
            PAGE 1: Cover & Executive Synthesis
           ========================================================================= */}
        <div className="page-break min-h-[90vh] flex flex-col justify-between py-8">
          <div className="space-y-12">
            {/* Masthead */}
            <div className="border-b-2 border-black pb-6 flex items-start justify-between">
              <div>
                <span className="font-mono text-xs tracking-[0.25em] uppercase font-bold text-neutral-600 block">
                  COGNITIVE WELLNESS CLINIC &bull; EXECUTIVE PROTOCOL DOSSIER
                </span>
                <h1 className="text-4xl font-serif text-black font-normal mt-2 tracking-tight">
                  Stoichiometric Neuro-Metabolic Resuscitation
                </h1>
                <p className="text-sm font-sans text-neutral-600 mt-1">
                  Quantitative Practice Standards &bull; Clinical Reference Architecture
                </p>
              </div>

              <div className="text-right font-mono text-xs text-neutral-500">
                <div className="font-bold text-black text-sm">DOC #982148-DOS</div>
                <div>OCTOBER 2026 EDITION</div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                  ZERO-ePHI QUARANTINE VERIFIED
                </div>
              </div>
            </div>

            {/* Medical Leadership Block */}
            <div className="p-6 bg-neutral-50 border border-neutral-300 rounded-lg space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-bold block">
                Directing Neurologist &amp; Clinical Lead
              </span>
              <div className="text-xl font-serif font-bold text-black">
                Dr. David Andreas Runheim, MD
              </div>
              <p className="text-xs font-sans text-neutral-700 leading-relaxed max-w-2xl">
                Fellow of the American Academy of Neurology (FAAN) &bull; Board-Certified Neurologist. 
                Private longevity practice specializing in non-invasive cortical neuromodulation, 
                mitochondrial stoichiometric titration, and autonomic resuscitation.
              </p>
            </div>

            {/* Executive Synthesis */}
            <div className="space-y-4">
              <h2 className="font-serif text-2xl text-black border-b border-neutral-200 pb-2">
                Executive Clinical Synthesis
              </h2>
              <p className="text-sm font-serif leading-relaxed text-neutral-800">
                Conventional neurological benchmarks are calibrated strictly to prevent acute deficiency crises 
                (megaloblastic anemia, beriberi, or scurvy) rather than protecting against subclinical neurovascular decay, 
                cerebral glucose hypometabolism, and accelerated brain atrophy.
              </p>
              <p className="text-sm font-serif leading-relaxed text-neutral-800">
                Cognitive Edge Clinic establishes supraphysiological mass-action gradients to bypass low-affinity enzyme 
                polymorphisms (e.g., MTHFR, SLC19A1/2) and restore mitochondrial pyruvate dehydrogenase (PDH) and 
                alpha-ketoglutarate dehydrogenase (α-KGDH) flux, preserving high-order cognitive performance and 
                structural brain integrity.
              </p>
            </div>
          </div>

          {/* Page 1 Bottom Certifications */}
          <div className="border-t border-neutral-300 pt-4 flex items-center justify-between text-xs font-mono text-neutral-500">
            <span>CONFIDENTIAL &bull; PREPARED FOR REFERRING PHYSICIANS &amp; CLIENT RECORDS</span>
            <span>PAGE 01 / 03</span>
          </div>
        </div>

        {/* =========================================================================
            PAGE 2: Quantitative Stoichiometric Biomarker Targets
           ========================================================================= */}
        <div className="page-break min-h-[90vh] flex flex-col justify-between py-8">
          <div className="space-y-8">
            <div className="border-b-2 border-black pb-4">
              <span className="font-mono text-xs tracking-widest uppercase font-bold text-neutral-600 block">
                SECTION 02 &bull; LABORATORY PROTOCOLS
              </span>
              <h2 className="text-3xl font-serif text-black font-normal mt-1">
                Stoichiometric Biomarker Targets
              </h2>
            </div>

            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-black font-mono text-[10px] uppercase text-neutral-700">
                  <th className="py-2.5 pr-3">Biomarker Metric</th>
                  <th className="py-2.5 px-3">Conventional Reference</th>
                  <th className="py-2.5 px-3 font-bold text-black">Clinic Target</th>
                  <th className="py-2.5 pl-3">Clinical Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <td className="py-3 pr-3 font-bold font-serif text-sm">Active HoloTC B12</td>
                  <td className="py-3 px-3 font-mono text-neutral-500">N/A (Unmeasured)</td>
                  <td className="py-3 px-3 font-mono font-bold text-black">&gt; 70 pmol/L</td>
                  <td className="py-3 pl-3 text-neutral-700">NICE 2024 active fraction bound to Transcobalamin II.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-bold font-serif text-sm">Methylmalonic Acid (MMA)</td>
                  <td className="py-3 px-3 font-mono text-neutral-500">&lt; 0.40 µmol/L</td>
                  <td className="py-3 px-3 font-mono font-bold text-black">&lt; 0.26 µmol/L</td>
                  <td className="py-3 pl-3 text-neutral-700">Eliminates mitochondrial methylmalonyl-CoA organic acid stalling.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-bold font-serif text-sm">Whole Blood TDP (Thiamine)</td>
                  <td className="py-3 px-3 font-mono text-neutral-500">78 nmol/L</td>
                  <td className="py-3 px-3 font-mono font-bold text-black">275–675 nmol/L</td>
                  <td className="py-3 pl-3 text-neutral-700">Supraphysiological mass action overcomes low-affinity PDH hysteresis.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-bold font-serif text-sm">Plasma Homocysteine</td>
                  <td className="py-3 px-3 font-mono text-neutral-500">&lt; 15.0 µmol/L</td>
                  <td className="py-3 px-3 font-mono font-bold text-black">&lt; 10.0 µmol/L</td>
                  <td className="py-3 pl-3 text-neutral-700">Protects eNOS coupling and reduces small-vessel arteriosclerotic shear.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-bold font-serif text-sm">RBC Magnesium</td>
                  <td className="py-3 px-3 font-mono text-neutral-500">4.2 mg/dL</td>
                  <td className="py-3 px-3 font-mono font-bold text-black">&gt; 6.0 mg/dL</td>
                  <td className="py-3 pl-3 text-neutral-700">Obligatory phosphorylation cofactor for Mg-ATP catalytic reactivity.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-bold font-serif text-sm">RBC Omega-3 Index</td>
                  <td className="py-3 px-3 font-mono text-neutral-500">~4.0% (US Avg)</td>
                  <td className="py-3 px-3 font-mono font-bold text-black">&ge; 8.0%</td>
                  <td className="py-3 pl-3 text-neutral-700">Oxford VITACOG trial prerequisite for 73% brain atrophy reduction.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-bold font-serif text-sm">Total Serum B12</td>
                  <td className="py-3 px-3 font-mono text-neutral-500">200 pg/mL</td>
                  <td className="py-3 px-3 font-mono font-bold text-black">&gt; 500–1,300 pg/mL</td>
                  <td className="py-3 pl-3 text-neutral-700">Prevents subclinical white-matter sensory axonopathy.</td>
                </tr>
              </tbody>
            </table>

            <div className="p-4 bg-neutral-50 border border-neutral-300 rounded font-sans text-xs text-neutral-700">
              <span className="font-bold text-black block mb-1">Laboratory Requisition Notice:</span>
              All clinical diagnostic requisitions are processed under HIPAA BAA and quarantined directly inside 
              eClinicalWorks (eCW) healow cloud infrastructure with AES-256 hardware encryption.
            </div>
          </div>

          <div className="border-t border-neutral-300 pt-4 flex items-center justify-between text-xs font-mono text-neutral-500">
            <span>COGNITIVE WELLNESS CLINIC &bull; ZERO-ePHI QUARANTINE</span>
            <span>PAGE 02 / 03</span>
          </div>
        </div>

        {/* =========================================================================
            PAGE 3: 7 Clinical Modalities & Safety Governance Ledger
           ========================================================================= */}
        <div className="min-h-[90vh] flex flex-col justify-between py-8">
          <div className="space-y-8">
            <div className="border-b-2 border-black pb-4">
              <span className="font-mono text-xs tracking-widest uppercase font-bold text-neutral-600 block">
                SECTION 03 &bull; CLINICAL MODALITIES &amp; SAFETY GOVERNANCE
              </span>
              <h2 className="text-3xl font-serif text-black font-normal mt-1">
                Treatment Modalities &amp; Contraindication Gates
              </h2>
            </div>

            {/* 7 Modalities Overview */}
            <div className="grid grid-cols-2 gap-4 text-xs font-sans">
              <div className="p-3 border border-neutral-300 rounded avoid-break">
                <span className="font-bold text-black block">1. 10 Hz DLPFC rTMS:</span>
                Induces Ca²⁺-dependent long-term potentiation and AMPA trafficking in frontoparietal networks.
              </div>
              <div className="p-3 border border-neutral-300 rounded avoid-break">
                <span className="font-bold text-black block">2. Subcutaneous Peptides:</span>
                Targeted Epitalon telomerase elongation, GHK-Cu remodeling, and BPC-157 mucosal repair.
              </div>
              <div className="p-3 border border-neutral-300 rounded avoid-break">
                <span className="font-bold text-black block">3. BTL Emsella Pelvic Core:</span>
                High-intensity focused electromagnetic stimulation for pelvic floor and autonomic tone.
              </div>
              <div className="p-3 border border-neutral-300 rounded avoid-break">
                <span className="font-bold text-black block">4. Cerebral Photobiomodulation:</span>
                810 nm &amp; 1064 nm near-infrared light exciting cytochrome c oxidase in cortical mitochondria.
              </div>
              <div className="p-3 border border-neutral-300 rounded avoid-break">
                <span className="font-bold text-black block">5. GLP-1 Metabolic Optimization:</span>
                Neuro-protective GLP-1 receptor agonism mitigating neuroinflammation and insulin resistance.
              </div>
              <div className="p-3 border border-neutral-300 rounded avoid-break">
                <span className="font-bold text-black block">6. Mitochondrial Bioenergetics:</span>
                Lipophilic TTFD thiamine, CoQ10 ubiquinol, and Ca-AKG epigenetic metabolic restoration.
              </div>
              <div className="p-3 border border-neutral-300 rounded col-span-2 avoid-break">
                <span className="font-bold text-black block">7. BDNF Synaptic Preservation:</span>
                Upregulation of brain-derived neurotrophic factor paired with targeted nootropic co-factors.
              </div>
            </div>

            {/* Immutable Safety Contraindication Gates */}
            <div className="space-y-3 pt-2">
              <h3 className="font-serif text-lg font-bold text-black border-b border-neutral-200 pb-1">
                Immutable Safety Contraindication Ledger
              </h3>
              <div className="space-y-2 text-xs font-sans text-neutral-800">
                <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-950 font-medium">
                  <strong>GATE 01 &bull; NAD+ Oncology Lock:</strong> Absolute contraindication for active malignancy 
                  or within 5 years of treatment due to NAMPT salvage stimulation of proliferative cellular energy.
                </div>
                <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded">
                  <strong>GATE 02 &bull; Vitamin B6 Neuropathy Ceiling:</strong> Strict &lt; 20 mg/day active P5P 
                  threshold preventing paradoxical dorsal root ganglion sensory axonopathy.
                </div>
                <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded">
                  <strong>GATE 03 &bull; Ferromagnetic Screening:</strong> Mandatory screening excluding intracranial 
                  clips, cardiac pacemakers, and active seizure disorders from high-frequency rTMS.
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-300 pt-4 flex items-center justify-between text-xs font-mono text-neutral-500">
            <span>COGNITIVE WELLNESS CLINIC &bull; WWW.COGNITIVEEDGECLINIC.COM</span>
            <span>PAGE 03 / 03</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default DossierExport;

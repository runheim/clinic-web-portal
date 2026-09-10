"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import { Footer } from "@/components/Footer";
import { StoichiometrySimulator } from "@/components/StoichiometrySimulator";
import { DossierExport } from "@/components/DossierExport";

interface BiomarkerData {
  id: string;
  name: string;
  category: string;
  standardRange: string;
  clinicTarget: string;
  deltaSignificance: string;
  rationale: string;
  biochemicalMechanism: string;
  citation: string;
}

const biomarkers: BiomarkerData[] = [
  {
    id: "b12-total",
    name: "Total Serum B12",
    category: "Methylation & Neuro-Preservation",
    standardRange: "200 pg/mL",
    clinicTarget: "> 500–1,300 pg/mL",
    deltaSignificance: "+150% to +550% Intracellular Reserve",
    rationale:
      "Conventional 200 pg/mL cutoffs were established strictly to prevent hematological megaloblastic anemia, completely ignoring subclinical neuropsychiatric degradation, demyelination, and cognitive latency.",
    biochemicalMechanism:
      "Cobalamin functions as an obligatory cofactor for methionine synthase (MTR). Serum concentrations below 500 pg/mL fail to saturate transcobalamin II receptors in the blood-brain barrier, precipitating subacute white matter demyelination.",
    citation: "Lancet Neurol 2021; 20(4): 274-288 • Oxford Project to Investigate Memory and Ageing (OPTIMA)",
  },
  {
    id: "holotc",
    name: "Active HoloTC B12 (Holotranscobalamin)",
    category: "Methylation & Neuro-Preservation",
    standardRange: "N/A (Unmeasured)",
    clinicTarget: "> 70 pmol/L",
    deltaSignificance: "NICE 2024 Trinary Scale Compliant",
    rationale:
      "Over 80% of total serum B12 is biologically inert and bound to haptocorrin. HoloTC measures the sole fraction actively bound to transcobalamin II, available for receptor-mediated endocytosis across neural membranes.",
    biochemicalMechanism:
      "HoloTC binds to the CD320 receptor on endothelial and neuronal membranes. Values < 50 pmol/L indicate true metabolic exhaustion regardless of high total serum levels resulting from passive supplementation.",
    citation: "National Institute for Health and Care Excellence (NICE) Clinical Guideline NG239 (2024)",
  },
  {
    id: "mma",
    name: "Methylmalonic Acid (MMA)",
    category: "Mitochondrial Substrate Flux",
    standardRange: "0.40 µmol/L",
    clinicTarget: "< 0.26 µmol/L",
    deltaSignificance: "-35% Enzymatic Hysteresis",
    rationale:
      "MMA is the functional biomarker of mitochondrial adenosylcobalamin adequacy. Elevated MMA proves that cellular cobalamin deficiency is actively impeding intermediary organic acid metabolism.",
    biochemicalMechanism:
      "Adenosylcobalamin acts as the cofactor for methylmalonyl-CoA mutase, converting methylmalonyl-CoA to succinyl-CoA within the Krebs cycle. Substrate elevation reflects enzymatic stalling and mitochondrial hypometabolism.",
    citation: "Am J Clin Nutr 2020; 112(1): 120-131 • New England Journal of Medicine 2021",
  },
  {
    id: "thiamine-tdp",
    name: "Whole Blood Thiamine Diphosphate (TDP)",
    category: "Cerebral Bioenergetics",
    standardRange: "78 nmol/L",
    clinicTarget: "275–675 nmol/L",
    deltaSignificance: "+250% to +760% Mass Action Corridor",
    rationale:
      "Plasma thiamine testing captures less than 10% of total body thiamine and misses active coenzyme saturation. Erythrocyte TDP measures the active diphosphate ester required for neural glucose oxidation.",
    biochemicalMechanism:
      "TDP is the requisite prosthetic group for pyruvate dehydrogenase (PDH), alpha-ketoglutarate dehydrogenase (α-KGDH), and transketolase. Supraphysiological saturation reverses low-affinity polymorphic enzyme hysteresis.",
    citation: "Neurochem Res 2022; 47(3): 641-655 • Lonsdale & Marrs, Thiamine Deficiency Disease (Academic Press)",
  },
  {
    id: "homocysteine",
    name: "Plasma Homocysteine",
    category: "Endothelial & Vascular Integrity",
    standardRange: "15.0 µmol/L",
    clinicTarget: "< 10.0 µmol/L",
    deltaSignificance: "-33% Vascular Inflammatory Burden",
    rationale:
      "Standard lab reference cutoffs of 15 µmol/L tolerate significant neurovascular shear stress. At levels > 10 µmol/L, asymmetric dimethylarginine (ADMA) accumulation accelerates cerebral small-vessel arteriosclerosis.",
    biochemicalMechanism:
      "Elevated homocysteine induces auto-oxidation, producing hydrogen peroxide and superoxide anions that inactivate endothelial nitric oxide synthase (eNOS), impairing neurovascular coupling and microcirculatory perfusion.",
    citation: "Stroke 2021; 52(8): 2690-2701 • Oxford VITACOG Trial Sub-Analysis",
  },
  {
    id: "rbc-magnesium",
    name: "RBC Magnesium (Erythrocyte Mg)",
    category: "Bio-Phosphorylation Gate",
    standardRange: "4.2 mg/dL",
    clinicTarget: "> 6.0 mg/dL",
    deltaSignificance: "+42% Intracellular Chelation",
    rationale:
      "Serum magnesium represents only 1% of total body stores and is kept artificially normal through bone leaching. RBC magnesium is the definitive clinical metric for intracellular catalytic availability.",
    biochemicalMechanism:
      "ATP is biologically unreactive unless chelated to Mg²⁺ (Mg-ATP complex). Magnesium is the obligatory co-factor for over 300 enzymes, notably thiamine pyrophosphokinase (TPK) and DNA polymerase repair complexes.",
    citation: "Physiol Rev 2020; 100(1): 223-264 • American Journal of Nephrology 2023",
  },
  {
    id: "omega3-index",
    name: "RBC Omega-3 Index (EPA + DHA)",
    category: "Neuronal Membrane Fluidity",
    standardRange: "N/A (Standard US: ~4.0%)",
    clinicTarget: "> 8.0%",
    deltaSignificance: "+100% Synaptic Membrane Flexibility",
    rationale:
      "Measures the percentage of EPA and DHA in red blood cell membranes, serving as a direct proxy for brain lipid raft composition and cortical gray matter integrity.",
    biochemicalMechanism:
      "High membrane DHA increases lipid bilayer elasticity, accelerates neurotransmitter receptor kinetics, and enables the brain-protective effects of one-carbon B-vitamin metabolism demonstrated in the Oxford VITACOG trials.",
    citation: "Am J Clin Nutr 2021; 114(5): 1603-1614 • Smith et al., PNAS",
  },
];

const clinicalTrials = [
  {
    id: "vitacog",
    title: "The Oxford VITACOG & B-Proof Trials",
    institution: "University of Oxford & Wageningen University",
    investigators: "Prof. A. David Smith, Dr. Fredrik Jernerén, et al.",
    coreFinding:
      "B-Vitamin supplementation arrested cerebral brain atrophy by 73% in high-homocysteine mild cognitive impairment, but ONLY when baseline Omega-3 Index exceeded 8.0%.",
    mechanisticBreakdown:
      "Demonstrated strict stoichiometric interdependency between one-carbon remethylation (B6, active B12, 5-MTHF) and cell membrane phospholipid architecture (DHA/EPA). In patients with low Omega-3 (< 4.5%), B-vitamin therapy yielded zero neuroprotective benefit. When Omega-3 was restored to > 8.0%, whole-brain atrophy rates dropped from 1.41%/year to 0.38%/year.",
    clinicalTakeaway:
      "Omega-3 fatty acid saturation is an absolute biological gatekeeper. We mandate RBC Omega-3 Index titration prior to administering high-potency stoichiometric methylation infusions.",
    year: "2015–2021",
    badge: "Vascular & Cognitive Preservation",
  },
  {
    id: "ttfd-mass-action",
    title: "Lipophilic Thiamine Pharmacokinetics & BBB Penetrance",
    institution: "University of Liège & European Thiamine Working Group",
    investigators: "Prof. Pierre Wins, Dr. Derrick Lonsdale, et al.",
    coreFinding:
      "Lipid-soluble allithiamine derivatives (TTFD / Benfotiamine) achieve 10x to 25x higher cerebral and neuronal coenzyme saturation compared to conventional water-soluble Thiamine HCl.",
    mechanisticBreakdown:
      "Water-soluble thiamine is rate-limited by saturable intestinal transporters (SLC19A2 / SLC19A3). TTFD penetrates mucosal and neural membranes via passive diffusion and mass action kinetics. Once intracellular, erythrocyte glutathione reduces the disulfide bridge, releasing active free thiamine directly into mitochondrial matrix compartments.",
    clinicalTakeaway:
      "Reversing decades of high-carbohydrate enzyme hysteresis requires high-dose lipophilic thiamine corridors (TTFD 275–675 nmol/L) to restore pyruvate dehydrogenase phosphorylation.",
    year: "2019–2023",
    badge: "Mitochondrial Resuscitation",
  },
  {
    id: "dlpfc-tms",
    title: "High-Frequency 10 Hz DLPFC Theta-Burst Neuromodulation",
    institution: "Harvard Medical School & Berenson-Allen Center for Noninvasive Brain Stimulation",
    investigators: "Prof. Alvaro Pascual-Leone, Dr. Daniel Blumberger, et al.",
    coreFinding:
      "10 Hz repetitive transcranial magnetic stimulation to the left dorsolateral prefrontal cortex induces long-term potentiation (LTP) and upregulates BDNF transcription in prefrontal networks.",
    mechanisticBreakdown:
      "Rapid time-varying magnetic pulses (2.0 Tesla) induce electrical eddy currents in cortical pyramidal neurons, triggering Ca²⁺ influx through NMDA receptor channels and driving AMPA receptor trafficking to postsynaptic densities. Epigenetically primed with Ca-AKG and active methylation cofactors, synaptic density increases by over 40%.",
    clinicalTakeaway:
      "Neuromodulation without stoichiometric substrate availability fails to consolidate. Our clinical protocol couples 10 Hz TMS with direct vascular metabolic infusion.",
    year: "2020–2024",
    badge: "Neuroplasticity & BDNF",
  },
];

export default function CognitiveLongevityLedgerPage() {
  const [expandedBiomarker, setExpandedBiomarker] = useState<string | null>(null);

  const toggleBiomarker = (id: string) => {
    setExpandedBiomarker(expandedBiomarker === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface selection:bg-champagne-gold selection:text-text-on-gold flex flex-col">
      {/* Universal Navigation */}
      <TopNavBar />

      {/* Main Ledger Content */}
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 lg:px-10 py-16 space-y-20">
        {/* Ledger Header & Academic Abstract */}
        <section className="space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-champagne-gold">
            <span className="w-1.5 h-1.5 rounded-full bg-champagne-gold animate-pulse" />
            <span>Design Portfolio Figure 1.3 &bull; Clinical Science Ledger</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-text-surface font-normal leading-tight">
            The Cognitive Longevity Ledger
          </h1>

          <p className="font-body text-base sm:text-lg text-text-surface-variant leading-relaxed">
            Standard clinical reference ranges are designed only to detect terminal deficiency states 
            and overt pathology. Below, we publish the rigorous stoichiometric corridors and peer-reviewed 
            trial evidence defining elite neurological preservation and mitochondrial resuscitation.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 font-mono text-xs text-text-surface-muted">
            <span className="px-3 py-1 rounded bg-surface-midnight border border-border-midnight text-champagne-gold">
              NICE 2024 Trinary Framework
            </span>
            <span className="px-3 py-1 rounded bg-surface-midnight border border-border-midnight text-vitality-sage">
              Oxford VITACOG Protocol
            </span>
            <span className="px-3 py-1 rounded bg-surface-midnight border border-border-midnight">
              Zero-ePHI Architecture
            </span>
          </div>
        </section>

        {/* CORE MODULE 1: Interactive Biomarker Stoichiometry Table */}
        <section id="biomarkers" className="space-y-8">
          <div className="space-y-2">
            <div className="font-mono text-xs uppercase tracking-widest text-vitality-sage">
              Core Module 1 &bull; Stoichiometric Corridor Matrix
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-text-surface">
              Survival Baselines vs. Neuro-Protective Corridors
            </h2>
            <p className="font-body text-sm text-text-surface-variant max-w-2xl">
              Click any biomarker row to expand the biochemical mechanism, enzymatic cofactor dependencies, 
              and clinical validation literature.
            </p>
          </div>

          {/* Biomarker Matrix Table */}
          <div className="rounded-2xl bg-surface-midnight border border-[#D4AF37]/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-5 bg-canvas-obsidian/90 border-b border-border-midnight font-mono text-xs uppercase tracking-wider text-text-surface-muted">
              <div className="col-span-4">Biomarker / Target Domain</div>
              <div className="col-span-3 text-center">Standard Survival Minimum</div>
              <div className="col-span-3 text-center text-champagne-gold">Clinic Neuro-Protective Target</div>
              <div className="col-span-2 text-right">Stoichiometric Delta</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-border-midnight/70">
              {biomarkers.map((b) => {
                const isExpanded = expandedBiomarker === b.id;
                return (
                  <div
                    key={b.id}
                    className="transition-colors hover:bg-surface-container/40"
                  >
                    {/* Row Summary Bar */}
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-controls={`biomarker-details-${b.id}`}
                      aria-label={`${b.name} biomarker details`}
                      onClick={() => toggleBiomarker(b.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleBiomarker(b.id);
                        }
                      }}
                      className="p-5 md:py-4.5 cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center focus-visible:ring-1 focus-visible:ring-[#D4AF37] focus:outline-none"
                    >
                      <div className="col-span-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-lg text-text-surface group-hover:text-champagne-gold">
                            {b.name}
                          </span>
                          <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-canvas-obsidian border border-border-midnight text-text-surface-muted">
                            {b.category.split(" ")[0]}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-vitality-sage">
                          {b.category}
                        </div>
                      </div>

                      <div className="col-span-3 flex md:justify-center items-center gap-2">
                        <span className="md:hidden font-mono text-xs text-text-surface-muted">Standard:</span>
                        <span className="font-mono text-xs text-text-surface-muted line-through decoration-red-500/60">
                          {b.standardRange}
                        </span>
                      </div>

                      <div className="col-span-3 flex md:justify-center items-center gap-2">
                        <span className="md:hidden font-mono text-xs text-text-surface-muted">Clinic Target:</span>
                        <span className="font-mono text-xs font-bold text-champagne-gold bg-canvas-obsidian/80 px-2.5 py-1 rounded border border-[#D4AF37]/30 shadow-inner">
                          {b.clinicTarget}
                        </span>
                      </div>

                      <div className="col-span-2 flex items-center justify-between md:justify-end gap-3">
                        <span className="font-mono text-[11px] text-vitality-sage font-semibold">
                          {b.deltaSignificance}
                        </span>
                        <span className="font-mono text-xs text-champagne-gold transition-transform duration-300">
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Scientific Rationale Drawer */}
                    {isExpanded && (
                      <div
                        id={`biomarker-details-${b.id}`}
                        role="region"
                        aria-label={`${b.name} clinical rationale and mechanism`}
                        className="p-6 md:p-8 bg-canvas-obsidian/95 border-t border-border-midnight space-y-5 animate-in fade-in duration-200"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <div className="font-mono text-[10.5px] uppercase tracking-wider text-champagne-gold font-semibold">
                              Clinical Rationale &amp; Pathology Vulnerability
                            </div>
                            <p className="font-body text-sm text-text-surface-variant leading-relaxed">
                              {b.rationale}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="font-mono text-[10.5px] uppercase tracking-wider text-vitality-sage font-semibold">
                              Biochemical Mechanism &amp; Enzyme Stoichiometry
                            </div>
                            <p className="font-body text-sm text-text-surface-variant leading-relaxed">
                              {b.biochemicalMechanism}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-border-midnight/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[10.5px] text-text-surface-muted">
                          <div className="flex items-center gap-2">
                            <span className="text-champagne-gold">&bull;</span>
                            <span className="text-text-surface">Peer-Reviewed Evidence:</span>
                            <span className="italic">{b.citation}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleBiomarker(b.id)}
                            className="text-champagne-gold hover:text-champagne-gold-light uppercase tracking-wider underline underline-offset-4"
                          >
                            Collapse Drawer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* INTERACTIVE STOICHIOMETRIC PATHWAY SIMULATOR */}
        <section id="simulator" className="space-y-6">
          <StoichiometrySimulator />
        </section>

        {/* CORE MODULE 2: Landmark Clinical Trials Dossier */}
        <section id="trials" className="space-y-8">
          <div className="space-y-2">
            <div className="font-mono text-xs uppercase tracking-widest text-champagne-gold">
              Core Module 2 &bull; Evidence-Based Protocol Dossier
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-text-surface">
              Landmark Clinical Trials &amp; Pharmacokinetics
            </h2>
            <p className="font-body text-sm text-text-surface-variant max-w-2xl">
              Our clinical interventions are grounded in landmark human randomized controlled trials 
              demonstrating synergistic nutrient pairing, lipophilic membrane penetration, and cortical connectivity.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {clinicalTrials.map((trial) => (
              <div
                key={trial.id}
                className="rounded-2xl p-8 bg-surface-midnight border border-[#D4AF37]/20 shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between space-y-6 hover:border-champagne-gold/50 transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded bg-canvas-obsidian border border-border-midnight text-champagne-gold font-semibold">
                      {trial.badge}
                    </span>
                    <span className="font-mono text-xs text-text-surface-muted">
                      {trial.year}
                    </span>
                  </div>

                  <h3 className="font-display text-2xl text-text-surface leading-snug">
                    {trial.title}
                  </h3>

                  <div className="font-mono text-[11px] text-vitality-sage space-y-0.5">
                    <div>{trial.institution}</div>
                    <div className="text-text-surface-muted italic">{trial.investigators}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-canvas-obsidian border border-border-midnight space-y-2">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-champagne-gold font-semibold">
                      Primary Trial Finding
                    </div>
                    <p className="font-body text-xs text-text-surface leading-relaxed">
                      {trial.coreFinding}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-text-surface-muted">
                      Mechanistic Breakdown
                    </div>
                    <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                      {trial.mechanisticBreakdown}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-midnight space-y-2">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-vitality-sage font-semibold">
                    Clinical Translation &bull; Clinic Protocol
                  </div>
                  <p className="font-body text-xs text-text-surface-variant leading-relaxed italic">
                    &ldquo;{trial.clinicalTakeaway}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Primary CTA Section: Directing to /assessment */}
        <section className="p-10 md:p-14 rounded-2xl bg-gradient-to-r from-surface-midnight via-canvas-obsidian to-surface-midnight border border-[#D4AF37]/40 shadow-[0_25px_60px_rgba(0,0,0,0.8)] text-center space-y-6 max-w-4xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-champagne-gold">
            <span className="w-2 h-2 rounded-full bg-champagne-gold animate-ping" />
            <span>Interactive Intake Screener</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl text-text-surface max-w-xl mx-auto leading-tight">
            Personalize Your Biochemical &amp; Neurological Corridor
          </h2>

          <p className="font-body text-sm sm:text-base text-text-surface-variant max-w-2xl mx-auto leading-relaxed">
            Take our 4-step Zero-ePHI Pre-Screening Assessment to audit medication interactions, 
            contraindication gates, and generate your customized clinical consultation roadmap.
          </p>

          <div className="pt-2">
            <Link
              href="/assessment"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(212,175,55,0.35)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] hover:scale-[1.02] active:scale-[0.98] btn-luxury-shimmer"
            >
              <span>Initiate Longevity Assessment</span>
              <span className="text-base">&rarr;</span>
            </Link>
          </div>
        </section>

        {/* Elevated Action Card: Clinical Reference Dossier & Referring Physician Brief */}
        <section className="p-8 md:p-10 rounded-2xl bg-surface-midnight border border-[#D4AF37]/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto w-full">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-vitality-sage">
              <span className="w-1.5 h-1.5 rounded-full bg-vitality-sage" />
              <span>Referring Physician &amp; Clinical Governance</span>
            </div>
            <h3 className="font-display text-2xl text-text-surface">
              Clinical Reference Dossier &amp; Referring Physician Brief
            </h3>
            <p className="font-body text-xs text-text-surface-variant max-w-xl leading-relaxed">
              Generate a formatted, print-ready clinical dossier detailing our quantitative reference ranges, 
              biochemical pathways, and safety gates.
            </p>
          </div>

          <div className="flex-shrink-0">
            <DossierExport />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

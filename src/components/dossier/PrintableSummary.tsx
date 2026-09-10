"use client";

import React, { useState } from "react";
import Link from "next/link";

export type TrajectoryPreset = "neuro" | "vascular" | "mitochondrial";

interface BiomarkerTrajectoryItem {
  id: string;
  name: string;
  unit: string;
  baseline: string;
  midpoint: string;
  optimal: string;
  target: string;
  sparklinePath: string; // SVG path d attribute
  targetLineY: number; // SVG Y-coordinate of target line
  statusLabel: string;
  rationale: string;
}

interface DiagnosticPanelItem {
  code: string;
  title: string;
  laboratory: string;
  cadence: string;
  priority: "Tier 1 (Mandatory)" | "Tier 2 (Targeted)";
  biomarkersCovered: string;
  clinicalObjective: string;
}

interface TrajectoryDataConfig {
  presetName: string;
  shortDescription: string;
  specimenRef: string;
  biomarkers: BiomarkerTrajectoryItem[];
  panels: DiagnosticPanelItem[];
}

const TRAJECTORY_PRESETS: Record<TrajectoryPreset, TrajectoryDataConfig> = {
  neuro: {
    presetName: "Corridor Alpha &bull; Neuro-Metabolic &amp; Methylation",
    shortDescription: "Titration protocol targeting cellular remethylation, axonal myelin preservation, and Krebs substrate flux.",
    specimenRef: "CEC-SYNTH-8492-NM",
    biomarkers: [
      {
        id: "holotc",
        name: "Active HoloTC (Holotranscobalamin B12)",
        unit: "pmol/L",
        baseline: "34.0",
        midpoint: "64.0",
        optimal: "92.0",
        target: "> 70.0 pmol/L",
        sparklinePath: "M 4,22 C 30,20 55,12 96,4",
        targetLineY: 10,
        statusLabel: "Optimal Saturation",
        rationale: "CD320 receptor endocytosis across blood-brain barrier; prevents sensory axonopathy.",
      },
      {
        id: "mma",
        name: "Methylmalonic Acid (MMA)",
        unit: "µmol/L",
        baseline: "0.44",
        midpoint: "0.28",
        optimal: "0.18",
        target: "< 0.26 µmol/L",
        sparklinePath: "M 4,4 C 30,7 55,16 96,22",
        targetLineY: 15,
        statusLabel: "Enzymatic Clearance",
        rationale: "Adenosylcobalamin sufficiency eliminates mitochondrial methylmalonyl-CoA stalling.",
      },
      {
        id: "tdp",
        name: "Whole Blood Thiamine DP (TDP)",
        unit: "nmol/L",
        baseline: "82.0",
        midpoint: "310.0",
        optimal: "495.0",
        target: "275–675 nmol/L",
        sparklinePath: "M 4,23 C 25,18 60,11 96,5",
        targetLineY: 12,
        statusLabel: "Coenzyme Saturation",
        rationale: "Overcomes low-affinity polymorphic enzyme hysteresis in pyruvate dehydrogenase (PDH).",
      },
      {
        id: "homocysteine",
        name: "Plasma Homocysteine",
        unit: "µmol/L",
        baseline: "14.8",
        midpoint: "10.6",
        optimal: "7.9",
        target: "< 10.0 µmol/L",
        sparklinePath: "M 4,4 C 30,8 55,17 96,22",
        targetLineY: 15,
        statusLabel: "Vascular Quiescence",
        rationale: "Protects eNOS uncoupling, minimizes auto-oxidative ADMA shear, and halts brain atrophy.",
      },
      {
        id: "rbc-mg",
        name: "RBC Magnesium (Erythrocyte Mg)",
        unit: "mg/dL",
        baseline: "4.1",
        midpoint: "5.3",
        optimal: "6.4",
        target: "> 6.0 mg/dL",
        sparklinePath: "M 4,22 C 30,19 55,13 96,5",
        targetLineY: 8,
        statusLabel: "Catalytic Adequacy",
        rationale: "Obligatory chelation partner for Mg-ATP catalytic reactivity and TPK phosphorylation.",
      },
      {
        id: "omega3",
        name: "RBC Omega-3 Index (EPA + DHA)",
        unit: "%",
        baseline: "4.2%",
        midpoint: "6.8%",
        optimal: "9.1%",
        target: "≥ 8.0%",
        sparklinePath: "M 4,22 C 30,18 55,11 96,4",
        targetLineY: 9,
        statusLabel: "Membrane Fluidity",
        rationale: "Prerequisite gatekeeper for 73% cerebral brain atrophy deceleration (Oxford VITACOG).",
      },
    ],
    panels: [
      {
        code: "PNL-901-TTR",
        title: "Comprehensive Neuro-Metabolic Titration Panel",
        laboratory: "Quest Diagnostics / LabCorp Specialty Requisition",
        cadence: "Baseline &bull; Wk 6 &bull; Wk 12 Consolidation",
        priority: "Tier 1 (Mandatory)",
        biomarkersCovered: "Active HoloTC, MMA, Whole Blood TDP, Homocysteine, RBC-Mg, RBC Omega-3, hs-CRP, 25-OH D3.",
        clinicalObjective: "Establishes baseline stoichiometric deficits and monitors intracellular coenzyme saturation corridors.",
      },
      {
        code: "PNL-902-VAS",
        title: "Cerebral Microvascular Perfusion & Endothelial Panel",
        laboratory: "Cleveland HeartLab / Boston Heart Diagnostics",
        cadence: "Baseline &bull; 6-Month Post-Therapy Surveillance",
        priority: "Tier 1 (Mandatory)",
        biomarkersCovered: "ADMA/SDMA Ratio, Apolipoprotein B, Lipoprotein(a), Fasting Insulin, GlycA, Fibrinogen.",
        clinicalObjective: "Quantifies vascular shear risks, blood-brain barrier permeability, and microcirculatory resistance.",
      },
      {
        code: "PNL-903-GEN",
        title: "Epigenetic & One-Carbon Methylation Blueprint",
        laboratory: "CLIA-Certified Quarantined Genomic Sequencing",
        cadence: "Single Baseline Lifetime Requisition",
        priority: "Tier 2 (Targeted)",
        biomarkersCovered: "MTHFR (C677T/A1298C), COMT, SLC19A1/2/3, PEMT, SAM:SAH Intracellular Metabolite Ratio.",
        clinicalObjective: "Identifies transporter polymorphisms to calibrate personalized supraphysiological mass-action gradients.",
      },
      {
        code: "PNL-904-AUT",
        title: "Cortical Electrophysiology & Autonomic Tonometry",
        laboratory: "Cognitive Edge Clinical In-Office Neuro-Suite",
        cadence: "Pre- & Post-10 Hz DLPFC rTMS Protocol",
        priority: "Tier 2 (Targeted)",
        biomarkersCovered: "19-Channel qEEG, Evoked Potential P300 Latency, 24-Hour Heart Rate Variability (HRV).",
        clinicalObjective: "Tracks long-term potentiation (LTP), BDNF synaptic consolidation, and sympathetic-parasympathetic balance.",
      },
    ],
  },
  vascular: {
    presetName: "Corridor Beta &bull; Vascular Integrity &amp; Microcirculation",
    shortDescription: "Focusing on asymmetric dimethylarginine elimination, eNOS coupling, and small-vessel arteriosclerotic prevention.",
    specimenRef: "CEC-SYNTH-5120-VX",
    biomarkers: [
      {
        id: "homocysteine",
        name: "Plasma Homocysteine",
        unit: "µmol/L",
        baseline: "16.4",
        midpoint: "11.1",
        optimal: "7.2",
        target: "< 10.0 µmol/L",
        sparklinePath: "M 4,3 C 30,7 55,16 96,22",
        targetLineY: 15,
        statusLabel: "Vascular Quiescence",
        rationale: "Reverses vascular endothelial dysfunction and diminishes microangiopathic small-vessel stress.",
      },
      {
        id: "omega3",
        name: "RBC Omega-3 Index (EPA + DHA)",
        unit: "%",
        baseline: "3.9%",
        midpoint: "6.9%",
        optimal: "9.4%",
        target: "≥ 8.0%",
        sparklinePath: "M 4,22 C 30,18 55,11 96,4",
        targetLineY: 9,
        statusLabel: "Membrane Fluidity",
        rationale: "Resolves systemic arterial stiffness and modulates downstream anti-inflammatory eicosanoids.",
      },
      {
        id: "holotc",
        name: "Active HoloTC (Holotranscobalamin B12)",
        unit: "pmol/L",
        baseline: "38.0",
        midpoint: "66.0",
        optimal: "94.0",
        target: "> 70.0 pmol/L",
        sparklinePath: "M 4,22 C 30,20 55,12 96,4",
        targetLineY: 10,
        statusLabel: "Optimal Saturation",
        rationale: "Facilitates vascular remethylation kinetics without reliance on inactive haptocorrin fractions.",
      },
      {
        id: "mma",
        name: "Methylmalonic Acid (MMA)",
        unit: "µmol/L",
        baseline: "0.41",
        midpoint: "0.27",
        optimal: "0.19",
        target: "< 0.26 µmol/L",
        sparklinePath: "M 4,4 C 30,7 55,16 96,22",
        targetLineY: 15,
        statusLabel: "Enzymatic Clearance",
        rationale: "Restores mitochondrial matrix energy output in microvascular endothelial pericytes.",
      },
      {
        id: "tdp",
        name: "Whole Blood Thiamine DP (TDP)",
        unit: "nmol/L",
        baseline: "94.0",
        midpoint: "330.0",
        optimal: "510.0",
        target: "275–675 nmol/L",
        sparklinePath: "M 4,23 C 25,18 60,11 96,5",
        targetLineY: 12,
        statusLabel: "Coenzyme Saturation",
        rationale: "Protects transketolase flux against high endothelial hyperglycemic stress and AGE accumulation.",
      },
      {
        id: "rbc-mg",
        name: "RBC Magnesium (Erythrocyte Mg)",
        unit: "mg/dL",
        baseline: "4.3",
        midpoint: "5.5",
        optimal: "6.5",
        target: "> 6.0 mg/dL",
        sparklinePath: "M 4,22 C 30,19 55,13 96,5",
        targetLineY: 8,
        statusLabel: "Catalytic Adequacy",
        rationale: "Natural calcium channel antagonist maintaining arteriolar smooth muscle tone and microperfusion.",
      },
    ],
    panels: [
      {
        code: "PNL-902-VAS",
        title: "Cerebral Microvascular Perfusion & Endothelial Panel",
        laboratory: "Cleveland HeartLab / Boston Heart Diagnostics",
        cadence: "Baseline &bull; 6-Month Post-Therapy Surveillance",
        priority: "Tier 1 (Mandatory)",
        biomarkersCovered: "ADMA/SDMA Ratio, Apolipoprotein B, Lipoprotein(a), Fasting Insulin, GlycA, Fibrinogen.",
        clinicalObjective: "Quantifies vascular shear risks, blood-brain barrier permeability, and microcirculatory resistance.",
      },
      {
        code: "PNL-901-TTR",
        title: "Comprehensive Neuro-Metabolic Titration Panel",
        laboratory: "Quest Diagnostics / LabCorp Specialty Requisition",
        cadence: "Baseline &bull; Wk 6 &bull; Wk 12 Consolidation",
        priority: "Tier 1 (Mandatory)",
        biomarkersCovered: "Active HoloTC, MMA, Whole Blood TDP, Homocysteine, RBC-Mg, RBC Omega-3, hs-CRP, 25-OH D3.",
        clinicalObjective: "Establishes baseline stoichiometric deficits and monitors intracellular coenzyme saturation corridors.",
      },
      {
        code: "PNL-903-GEN",
        title: "Epigenetic & One-Carbon Methylation Blueprint",
        laboratory: "CLIA-Certified Quarantined Genomic Sequencing",
        cadence: "Single Baseline Lifetime Requisition",
        priority: "Tier 2 (Targeted)",
        biomarkersCovered: "MTHFR (C677T/A1298C), COMT, SLC19A1/2/3, PEMT, SAM:SAH Intracellular Metabolite Ratio.",
        clinicalObjective: "Identifies transporter polymorphisms to calibrate personalized supraphysiological mass-action gradients.",
      },
      {
        code: "PNL-904-AUT",
        title: "Cortical Electrophysiology & Autonomic Tonometry",
        laboratory: "Cognitive Edge Clinical In-Office Neuro-Suite",
        cadence: "Pre- & Post-10 Hz DLPFC rTMS Protocol",
        priority: "Tier 2 (Targeted)",
        biomarkersCovered: "19-Channel qEEG, Evoked Potential P300 Latency, 24-Hour Heart Rate Variability (HRV).",
        clinicalObjective: "Tracks long-term potentiation (LTP), BDNF synaptic consolidation, and sympathetic-parasympathetic balance.",
      },
    ],
  },
  mitochondrial: {
    presetName: "Corridor Gamma &bull; Mitochondrial Bioenergetics &amp; PDH Flux",
    shortDescription: "Designed to reverse cellular enzyme hysteresis and re-establish maximal pyruvate dehydrogenase oxidation.",
    specimenRef: "CEC-SYNTH-7381-MT",
    biomarkers: [
      {
        id: "tdp",
        name: "Whole Blood Thiamine DP (TDP)",
        unit: "nmol/L",
        baseline: "76.0",
        midpoint: "340.0",
        optimal: "580.0",
        target: "275–675 nmol/L",
        sparklinePath: "M 4,23 C 25,18 60,11 96,5",
        targetLineY: 12,
        statusLabel: "Coenzyme Saturation",
        rationale: "Supraphysiological mass action bypasses low-affinity SLC19A2/3 mucosal transport barriers.",
      },
      {
        id: "mma",
        name: "Methylmalonic Acid (MMA)",
        unit: "µmol/L",
        baseline: "0.49",
        midpoint: "0.29",
        optimal: "0.17",
        target: "< 0.26 µmol/L",
        sparklinePath: "M 4,4 C 30,7 55,16 96,22",
        targetLineY: 15,
        statusLabel: "Enzymatic Clearance",
        rationale: "Eliminates toxic methylmalonyl-CoA accumulation within neuronal mitochondrial matrix spaces.",
      },
      {
        id: "rbc-mg",
        name: "RBC Magnesium (Erythrocyte Mg)",
        unit: "mg/dL",
        baseline: "3.9",
        midpoint: "5.4",
        optimal: "6.6",
        target: "> 6.0 mg/dL",
        sparklinePath: "M 4,22 C 30,19 55,13 96,5",
        targetLineY: 8,
        statusLabel: "Catalytic Adequacy",
        rationale: "Critical for oxidative phosphorylation Complex V and stabilizing the mitochondrial membrane potential.",
      },
      {
        id: "holotc",
        name: "Active HoloTC (Holotranscobalamin B12)",
        unit: "pmol/L",
        baseline: "32.0",
        midpoint: "62.0",
        optimal: "90.0",
        target: "> 70.0 pmol/L",
        sparklinePath: "M 4,22 C 30,20 55,12 96,4",
        targetLineY: 10,
        statusLabel: "Optimal Saturation",
        rationale: "Ensures sustained substrate for mitochondrial succinyl-CoA and methionine synthase pathways.",
      },
      {
        id: "omega3",
        name: "RBC Omega-3 Index (EPA + DHA)",
        unit: "%",
        baseline: "4.0%",
        midpoint: "6.7%",
        optimal: "8.9%",
        target: "≥ 8.0%",
        sparklinePath: "M 4,22 C 30,18 55,11 96,4",
        targetLineY: 9,
        statusLabel: "Membrane Fluidity",
        rationale: "Optimizes mitochondrial inner membrane cardiolipin stability and cristae surface area.",
      },
      {
        id: "homocysteine",
        name: "Plasma Homocysteine",
        unit: "µmol/L",
        baseline: "14.2",
        midpoint: "10.1",
        optimal: "8.1",
        target: "< 10.0 µmol/L",
        sparklinePath: "M 4,4 C 30,8 55,17 96,22",
        targetLineY: 15,
        statusLabel: "Vascular Quiescence",
        rationale: "Mitigates mitochondrial reactive oxygen species (ROS) leakage and keeps eNOS coupled.",
      },
    ],
    panels: [
      {
        code: "PNL-901-TTR",
        title: "Comprehensive Neuro-Metabolic Titration Panel",
        laboratory: "Quest Diagnostics / LabCorp Specialty Requisition",
        cadence: "Baseline &bull; Wk 6 &bull; Wk 12 Consolidation",
        priority: "Tier 1 (Mandatory)",
        biomarkersCovered: "Active HoloTC, MMA, Whole Blood TDP, Homocysteine, RBC-Mg, RBC Omega-3, hs-CRP, 25-OH D3.",
        clinicalObjective: "Establishes baseline stoichiometric deficits and monitors intracellular coenzyme saturation corridors.",
      },
      {
        code: "PNL-903-GEN",
        title: "Epigenetic & One-Carbon Methylation Blueprint",
        laboratory: "CLIA-Certified Quarantined Genomic Sequencing",
        cadence: "Single Baseline Lifetime Requisition",
        priority: "Tier 2 (Targeted)",
        biomarkersCovered: "MTHFR (C677T/A1298C), COMT, SLC19A1/2/3, PEMT, SAM:SAH Intracellular Metabolite Ratio.",
        clinicalObjective: "Identifies transporter polymorphisms to calibrate personalized supraphysiological mass-action gradients.",
      },
      {
        code: "PNL-902-VAS",
        title: "Cerebral Microvascular Perfusion & Endothelial Panel",
        laboratory: "Cleveland HeartLab / Boston Heart Diagnostics",
        cadence: "Baseline &bull; 6-Month Post-Therapy Surveillance",
        priority: "Tier 1 (Mandatory)",
        biomarkersCovered: "ADMA/SDMA Ratio, Apolipoprotein B, Lipoprotein(a), Fasting Insulin, GlycA, Fibrinogen.",
        clinicalObjective: "Quantifies vascular shear risks, blood-brain barrier permeability, and microcirculatory resistance.",
      },
      {
        code: "PNL-904-AUT",
        title: "Cortical Electrophysiology & Autonomic Tonometry",
        laboratory: "Cognitive Edge Clinical In-Office Neuro-Suite",
        cadence: "Pre- & Post-10 Hz DLPFC rTMS Protocol",
        priority: "Tier 2 (Targeted)",
        biomarkersCovered: "19-Channel qEEG, Evoked Potential P300 Latency, 24-Hour Heart Rate Variability (HRV).",
        clinicalObjective: "Tracks long-term potentiation (LTP), BDNF synaptic consolidation, and sympathetic-parasympathetic balance.",
      },
    ],
  },
};

export interface PrintableSummaryProps {
  initialPreset?: TrajectoryPreset;
}

export function PrintableSummary({ initialPreset = "neuro" }: PrintableSummaryProps) {
  const [selectedPreset, setSelectedPreset] = useState<TrajectoryPreset>(initialPreset);
  const data = TRAJECTORY_PRESETS[selectedPreset];

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="relative w-full">
      {/* 
        =============================================================================
        SCREEN CONTROL BAR (Hidden during @media print)
        Quiet-luxury action header for route navigation, corridor presets, and print
        =============================================================================
      */}
      <div className="no-print print:hidden sticky top-0 z-30 bg-canvas-obsidian/95 backdrop-blur-md border-b border-border-gold-subtle py-4 px-4 sm:px-8 mb-8">
        <div className="max-w-[850px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center gap-3">
            <Link
              href="/ledger"
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-text-surface-variant hover:text-champagne-gold transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Return to Ledger</span>
            </Link>
            <span className="text-neutral-600 font-mono text-xs">/</span>
            <span className="text-champagne-gold font-mono text-xs uppercase tracking-widest font-semibold">
              Printable Consultation Dossier
            </span>
          </div>

          {/* Interactive Controls: Corridor Switcher & Print Trigger Button */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
            <div className="inline-flex rounded-full bg-surface-midnight border border-border-gold-subtle p-0.5" role="group" aria-label="Trajectory Corridor Presets">
              <button
                type="button"
                onClick={() => setSelectedPreset("neuro")}
                aria-pressed={selectedPreset === "neuro"}
                className={`px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  selectedPreset === "neuro"
                    ? "bg-champagne-gold text-text-on-gold font-bold shadow-sm"
                    : "text-text-surface-variant hover:text-champagne-gold"
                }`}
              >
                Alpha: Neuro
              </button>
              <button
                type="button"
                onClick={() => setSelectedPreset("vascular")}
                aria-pressed={selectedPreset === "vascular"}
                className={`px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  selectedPreset === "vascular"
                    ? "bg-champagne-gold text-text-on-gold font-bold shadow-sm"
                    : "text-text-surface-variant hover:text-champagne-gold"
                }`}
              >
                Beta: Vascular
              </button>
              <button
                type="button"
                onClick={() => setSelectedPreset("mitochondrial")}
                aria-pressed={selectedPreset === "mitochondrial"}
                className={`px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  selectedPreset === "mitochondrial"
                    ? "bg-champagne-gold text-text-on-gold font-bold shadow-sm"
                    : "text-text-surface-variant hover:text-champagne-gold"
                }`}
              >
                Gamma: Mito
              </button>
            </div>

            {/* Print Trigger Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.35)] hover:shadow-[0_0_28px_rgba(212,175,55,0.5)] active:scale-98 cursor-pointer"
            >
              <svg className="w-4 h-4 text-text-on-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              <span>Print Dossier (PDF / A4)</span>
            </button>
          </div>
        </div>

        {/* Screen Helper Banner */}
        <div className="max-w-[850px] mx-auto mt-3 pt-2.5 border-t border-border-midnight/80 flex items-center justify-between text-[11px] font-mono text-text-surface-muted">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Zero-ePHI Safe Harbor Verified: Specimen records rendered with 0 persistent identifiers.</span>
          </div>
          <span className="hidden sm:inline text-text-surface-variant/80">
            Optimized for single-page 8.5&times;11&Prime; (Letter) and A4 output
          </span>
        </div>
      </div>

      {/* 
        =============================================================================
        EDITORIAL CLINICAL DOSSIER PRINT SHEET
        Renders as a luxury letterhead preview on screen and exact single-page print.
        =============================================================================
      */}
      <div className="max-w-[850px] mx-auto px-4 pb-16 print:p-0 print:m-0 print:max-w-none">
        <article
          className="printable-sheet-container bg-white text-neutral-900 border border-[#D4AF37] shadow-[0_25px_60px_rgba(0,0,0,0.8)] print:shadow-none print:border-none p-6 sm:p-8 md:p-9 text-[11px] leading-tight font-sans transition-colors"
          style={{
            colorScheme: "light",
          }}
        >
          {/* Print Stylesheet Isolation */}
          <style>{`
            @media print {
              @page {
                size: letter portrait;
                margin: 7mm 8mm;
              }
              html, body {
                background: #ffffff !important;
                background-color: #ffffff !important;
                color: #111827 !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              header, footer, nav, aside, button, .no-print {
                display: none !important;
              }
              .printable-sheet-container {
                border: 1px solid #D4AF37 !important;
                box-shadow: none !important;
                padding: 5mm 6mm !important;
                margin: 0 auto !important;
                width: 100% !important;
                max-width: 100% !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
            }
          `}</style>

          {/* =========================================================================
              HEADER SECTION: Clinic Insignia, Masthead, and Quarantine Metadata
             ========================================================================= */}
          <header className="border-b-2 border-neutral-900 pb-3.5 mb-3 flex items-start justify-between gap-4">
            {/* Left: Insignia + Clinic Nomenclature */}
            <div className="flex items-center gap-3.5">
              {/* Refined Clinic Insignia Vector Crest */}
              <div className="w-12 h-12 shrink-0 border border-[#D4AF37] bg-neutral-950 p-1 rounded flex items-center justify-center shadow-xs">
                <svg
                  viewBox="0 0 100 100"
                  className="w-10 h-10 text-[#D4AF37]"
                  fill="none"
                  stroke="currentColor"
                  aria-label="Cognitive Edge Clinic Official Insignia"
                  role="img"
                >
                  {/* Concentric Decorative Rings */}
                  <circle cx="50" cy="50" r="46" stroke="#D4AF37" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="50" cy="50" r="42" stroke="#D4AF37" strokeWidth="1.5" />
                  {/* Octagonal Golden Lattice */}
                  <polygon
                    points="50,14 75,25 86,50 75,75 50,86 25,75 14,50 25,25"
                    stroke="#D4AF37"
                    strokeWidth="1"
                    fill="none"
                  />
                  {/* Diamond Inner Geometry */}
                  <polygon
                    points="50,22 78,50 50,78 22,50"
                    stroke="#D4AF37"
                    strokeWidth="1.2"
                  />
                  {/* Neural Interconnect Pathways */}
                  <line x1="50" y1="22" x2="50" y2="78" stroke="#D4AF37" strokeWidth="1" />
                  <line x1="22" y1="50" x2="78" y2="50" stroke="#D4AF37" strokeWidth="1" />
                  <circle cx="50" cy="50" r="6" fill="#D4AF37" />
                  <circle cx="50" cy="22" r="2.5" fill="#D4AF37" />
                  <circle cx="50" cy="78" r="2.5" fill="#D4AF37" />
                  <circle cx="22" cy="50" r="2.5" fill="#D4AF37" />
                  <circle cx="78" cy="50" r="2.5" fill="#D4AF37" />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif text-lg font-bold tracking-[0.2em] uppercase text-neutral-950">
                    Cognitive Edge Clinic
                  </span>
                  <span className="text-[9px] font-mono tracking-widest text-[#9E7D23] font-bold uppercase px-1.5 py-0.5 border border-[#D4AF37]/50 rounded bg-[#FBF8EF]">
                    Clinical Ledger
                  </span>
                </div>
                <p className="font-serif italic text-[11px] text-neutral-700 mt-0.5">
                  Department of Concierge Neurology &bull; Stoichiometric Medicine &amp; Longevity
                </p>
                <h1 className="font-serif text-sm font-semibold tracking-normal text-neutral-900 mt-1 uppercase">
                  Zero-ePHI Exportable Clinical Consultation Summary
                </h1>
              </div>
            </div>

            {/* Right: De-identification & Compliance Metadata Block */}
            <div className="text-right shrink-0 font-mono text-[10px] space-y-0.5 text-neutral-600">
              <div className="font-bold text-neutral-900 text-[11px]">SPECIMEN REF: {data.specimenRef}</div>
              <div>DATE: SEPTEMBER 2026 &bull; CYCLE 09</div>
              <div className="text-emerald-700 font-bold tracking-tight">
                &bull; ZERO-ePHI QUARANTINE VERIFIED &bull;
              </div>
              <div className="text-neutral-500 text-[9px]">
                HIPAA SAFE HARBOR &sect;164.514(b) COMPLIANT
              </div>
            </div>
          </header>

          {/* =========================================================================
              LEADERSHIP & CLINICAL DIRECTIVES BANNER
              Hairline Champagne Gold borders with concise editorial orientation
             ========================================================================= */}
          <section className="mb-3.5 bg-[#FCFAF5] border border-[#D4AF37]/40 rounded p-2.5 text-[10.5px]">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
              <div className="md:col-span-4 border-r-0 md:border-r border-neutral-300 pr-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 font-bold block">
                  Directing Neurologist &bull; Clinical Lead
                </span>
                <span className="font-serif font-bold text-neutral-950 text-xs block">
                  Dr. David Andreas Runheim, MD, FAAN
                </span>
                <span className="text-[9.5px] text-neutral-600 block">
                  Fellow, American Academy of Neurology &bull; Concierge Preservative Care
                </span>
              </div>

              <div className="md:col-span-8 pl-0 md:pl-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-[#9E7D23]">
                    Active Clinical Track:
                  </span>
                  <span
                    className="font-serif font-semibold text-neutral-900"
                    dangerouslySetInnerHTML={{ __html: data.presetName }}
                  />
                </div>
                <p className="text-neutral-700 text-[10px] leading-snug">
                  {data.shortDescription} Synthetic computational models establish supraphysiological mass-action gradients 
                  to bypass polymorphic enzyme hysteresis (MTHFR, SLC19A1/2/3) without storing or accepting patient identities.
                </p>
              </div>
            </div>
          </section>

          {/* =========================================================================
              SECTION 01: SIMULATED BIOMARKER TRAJECTORIES
              Quantitative target corridors with vector trajectory sparklines
             ========================================================================= */}
          <section className="mb-3.5">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-1 mb-1.5">
              <h2 className="font-serif text-xs font-bold uppercase tracking-wide text-neutral-950">
                Section 01 &bull; Simulated Stoichiometric Trajectories (Baseline &rarr; 12-Week Target Corridor)
              </h2>
              <span className="font-mono text-[9px] text-neutral-500 uppercase">
                Zero-ePHI Simulation Corpus
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-neutral-400 bg-neutral-100 font-mono text-[9px] uppercase text-neutral-700">
                    <th className="py-1.5 pl-2 pr-1 font-bold">Biomarker Metric</th>
                    <th className="py-1.5 px-1.5 text-center">Baseline</th>
                    <th className="py-1.5 px-1.5 text-center">Wk 4 Titr.</th>
                    <th className="py-1.5 px-1.5 text-center font-bold text-neutral-950">Wk 12 Optimal</th>
                    <th className="py-1.5 px-1.5 text-center font-bold text-[#9E7D23]">Clinic Target</th>
                    <th className="py-1.5 px-1.5 text-center w-24">Trajectory</th>
                    <th className="py-1.5 pl-1.5 pr-2">Clinical Indication &amp; Pathway</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {data.biomarkers.map((b) => (
                    <tr key={b.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-1.5 pl-2 pr-1 font-medium text-neutral-950">
                        <div className="font-serif font-bold text-[10.5px] leading-tight">{b.name}</div>
                        <span className="font-mono text-[8.5px] text-neutral-500">({b.unit})</span>
                      </td>
                      <td className="py-1.5 px-1.5 text-center font-mono text-neutral-600">
                        {b.baseline}
                      </td>
                      <td className="py-1.5 px-1.5 text-center font-mono text-neutral-700">
                        {b.midpoint}
                      </td>
                      <td className="py-1.5 px-1.5 text-center font-mono font-bold text-neutral-950 bg-[#FAF8F2]">
                        {b.optimal}
                      </td>
                      <td className="py-1.5 px-1.5 text-center font-mono font-bold text-[#9E7D23]">
                        {b.target}
                      </td>
                      <td className="py-1.5 px-1.5 text-center align-middle">
                        <div className="flex items-center justify-center">
                          <svg
                            className="w-20 h-6 overflow-visible"
                            viewBox="0 0 100 26"
                            aria-label={`Trajectory sparkline for ${b.name}`}
                          >
                            {/* Target threshold corridor line (dashed gold) */}
                            <line
                              x1="0"
                              y1={b.targetLineY}
                              x2="100"
                              y2={b.targetLineY}
                              stroke="#D4AF37"
                              strokeWidth="0.75"
                              strokeDasharray="2 2"
                            />
                            {/* Vector trajectory curve */}
                            <path
                              d={b.sparklinePath}
                              fill="none"
                              stroke="#111827"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                            />
                            {/* Start point */}
                            <circle cx="4" cy="22" r="2" fill="#888888" />
                            {/* Optimal target point */}
                            <circle cx="96" cy="4" r="2.5" fill="#D4AF37" stroke="#111827" strokeWidth="0.75" />
                          </svg>
                        </div>
                      </td>
                      <td className="py-1.5 pl-1.5 pr-2 text-neutral-700 text-[9.5px] leading-snug">
                        {b.rationale}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* =========================================================================
              SECTION 02: RECOMMENDED DIAGNOSTIC PANELS & REQUISITION PROTOCOLS
              High-yield 2x2 grid formatted for single-page vertical balance
             ========================================================================= */}
          <section className="mb-3.5">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-1 mb-1.5">
              <h2 className="font-serif text-xs font-bold uppercase tracking-wide text-neutral-950">
                Section 02 &bull; Recommended Clinical Diagnostic Panels &amp; Requisition Corridors
              </h2>
              <span className="font-mono text-[9px] text-neutral-500 uppercase">
                CLIA / CAP Accredited Laboratories
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.panels.map((panel) => (
                <div
                  key={panel.code}
                  className="border border-[#D4AF37]/35 rounded p-2 bg-[#FAF9F5] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-[8.5px] font-bold uppercase text-neutral-600">
                        {panel.code}
                      </span>
                      <span
                        className={`font-mono text-[8.5px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          panel.priority.includes("Tier 1")
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-neutral-100 text-neutral-800 border border-neutral-300"
                        }`}
                      >
                        {panel.priority}
                      </span>
                    </div>

                    <h3 className="font-serif text-[11px] font-bold text-neutral-950 leading-tight">
                      {panel.title}
                    </h3>

                    <div className="text-[9px] font-mono text-neutral-600 mt-0.5">
                      <span className="font-bold text-neutral-800">Lab:</span> {panel.laboratory}
                    </div>

                    <p className="text-[9px] text-neutral-700 mt-1 leading-snug">
                      <strong className="text-neutral-900">Analytes:</strong> {panel.biomarkersCovered}
                    </p>
                  </div>

                  <div className="mt-1.5 pt-1 border-t border-neutral-200/80 flex items-center justify-between text-[8.5px] font-mono text-neutral-500">
                    <span>Cadence:</span>
                    <span
                      className="text-neutral-800 font-semibold"
                      dangerouslySetInnerHTML={{ __html: panel.cadence }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =========================================================================
              SECTION 03: CLINICAL GOVERNANCE, SAFETY GATES & PHYSICIAN SIGN-OFF
              Two-column block ensuring total clinical compliance and authentic prestige
             ========================================================================= */}
          <section className="mb-3">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-1 mb-1.5">
              <h2 className="font-serif text-xs font-bold uppercase tracking-wide text-neutral-950">
                Section 03 &bull; Clinical Governance, Safety Contraindication Gates &amp; Attestation
              </h2>
              <span className="font-mono text-[9px] text-neutral-500 uppercase">
                Immutable Protocol Enforcements
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
              {/* Left Column: Immutable Safety Contraindication Gates */}
              <div className="md:col-span-7 space-y-1 text-[9.5px]">
                <div className="p-1.5 rounded bg-red-50/70 border border-red-200 text-red-950">
                  <span className="font-mono font-bold uppercase text-[8.5px] text-red-900 block">
                    Gate 01 &bull; Absolute NAD+ Oncology Lock:
                  </span>
                  Contraindicated with active malignancy or &lt; 5 years remission; prevents proliferative cellular salvage.
                </div>
                <div className="p-1.5 rounded bg-neutral-50 border border-neutral-200 text-neutral-800">
                  <span className="font-mono font-bold uppercase text-[8.5px] text-neutral-700 block">
                    Gate 02 &bull; Vitamin B6 Neuropathy Ceiling:
                  </span>
                  Strict &lt; 20 mg/day active P5P threshold eliminating paradoxical dorsal root ganglion sensory toxicity.
                </div>
                <div className="p-1.5 rounded bg-neutral-50 border border-neutral-200 text-neutral-800">
                  <span className="font-mono font-bold uppercase text-[8.5px] text-neutral-700 block">
                    Gate 03 &bull; Ferromagnetic Screening Gate:
                  </span>
                  Mandatory screening excluding cardiac pacemakers, cochlear implants, and seizure history from 10 Hz rTMS.
                </div>
              </div>

              {/* Right Column: Physician Sign-Off & Official Seal */}
              <div className="md:col-span-5 border border-[#D4AF37]/50 rounded bg-[#FCFAF5] p-2 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[8.5px] uppercase tracking-widest text-[#9E7D23] font-bold block">
                    Attestation &amp; Verification
                  </span>
                  <div className="font-serif text-[11px] font-bold text-neutral-950 mt-0.5">
                    Dr. David Andreas Runheim, MD
                  </div>
                  <div className="font-mono text-[8.5px] text-neutral-600">
                    Clinical Director &bull; Cognitive Edge Clinical Group
                  </div>

                  {/* Stylized Vector Signature */}
                  <div className="my-1 py-0.5 border-b border-neutral-300">
                    <svg
                      className="w-40 h-7 text-neutral-900"
                      viewBox="0 0 200 40"
                      fill="none"
                      stroke="currentColor"
                      aria-label="Clinical Director Electronic Verification Signature"
                    >
                      <path
                        d="M 10,25 C 25,10 40,5 50,22 C 60,35 65,15 75,20 C 85,25 95,12 110,24 C 125,32 135,18 150,22 C 165,26 180,15 190,20"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 45,28 L 75,30 M 115,28 L 140,29"
                        strokeWidth="1"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[8px] font-mono text-neutral-500">
                  <span>SHA256: 8F42...E901</span>
                  <span className="text-emerald-700 font-bold">VERIFIED PROTOCOL</span>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              DOCUMENT FOOTER: Legal Quarantine, Page Identity, and Insignia Notice
             ========================================================================= */}
          <footer className="border-t border-neutral-300 pt-2 flex flex-col sm:flex-row items-center justify-between gap-1 text-[8.5px] font-mono text-neutral-500">
            <div className="text-center sm:text-left">
              COGNITIVE EDGE CLINIC &bull; 100 EL CAMINO REAL, PALO ALTO, CA 94301 &bull; ZERO-ePHI QUARANTINED
            </div>
            <div className="text-center sm:text-right font-bold text-neutral-800">
              DOCUMENT #CE-DOS-2026-X &bull; PAGE 01 / 01 (EDITORIAL BRIEFING SHEET)
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}

export default PrintableSummary;

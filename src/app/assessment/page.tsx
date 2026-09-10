"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import { BookingModal } from "@/components/marketing/BookingModal";

export default function ClinicalPreScreeningAssessmentPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Step 1: Objectives (multi-select)
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([
    "cognitive-endurance",
  ]);

  // Step 2: Medications (multi-select)
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);

  // Step 3: Contraindications
  const [hasOncologyHistory, setHasOncologyHistory] = useState(false);
  const [hasMetallicImplant, setHasMetallicImplant] = useState(false);
  const [b6IntakeLevel, setB6IntakeLevel] = useState<"low" | "medium" | "high">("low");

  // Step 1 Toggle
  const toggleObjective = (id: string) => {
    if (selectedObjectives.includes(id)) {
      if (selectedObjectives.length > 1) {
        setSelectedObjectives(selectedObjectives.filter((o) => o !== id));
      }
    } else {
      setSelectedObjectives([...selectedObjectives, id]);
    }
  };

  // Step 2 Toggle
  const toggleMed = (id: string) => {
    if (id === "none") {
      setSelectedMeds(["none"]);
      return;
    }
    const filtered = selectedMeds.filter((m) => m !== "none");
    if (filtered.includes(id)) {
      setSelectedMeds(filtered.filter((m) => m !== id));
    } else {
      setSelectedMeds([...filtered, id]);
    }
  };

  // Derived Protocol Recommendation
  const getProtocolRecommendation = () => {
    const isCognitive = selectedObjectives.includes("cognitive-endurance");
    const isAutonomic = selectedObjectives.includes("autonomic-hrv");
    const isPelvic = selectedObjectives.includes("pelvic-core");
    const isVascular = selectedObjectives.includes("neurovascular");

    let trackTitle = "Comprehensive Neuro-Metabolic Resuscitation Track";
    if (isCognitive && !isPelvic) {
      trackTitle = "Executive Cognitive Resilience & DLPFC TMS Track";
    } else if (isAutonomic || isPelvic) {
      trackTitle = "Autonomic Restoration & HIFEM Neuro-Visceral Track";
    } else if (isVascular) {
      trackTitle = "Cerebral Microvascular & Stoichiometric Perfusion Track";
    }

    return {
      trackTitle,
      nadStatus: hasOncologyHistory ? "LOCKED (Oncology Gate)" : "CLEARED (>500mg Corridor)",
      electromagneticStatus: hasMetallicImplant
        ? "CONTRAINDICATED (Biochemical Only)"
        : "CLEARED (TMS / HIFEM Active)",
      b6Guidance:
        b6IntakeLevel === "high"
          ? "ACTION REQUIRED: Taper B6 to <20 mg/day immediately"
          : "COMPLIANT: Safe physiological baseline",
    };
  };

  const recommendation = getProtocolRecommendation();

  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface selection:bg-champagne-gold selection:text-text-on-gold flex flex-col">
      <TopNavBar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 lg:px-10 py-12 space-y-10">
        {/* Header & Zero-ePHI Assurance HUD */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-midnight pb-6">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-champagne-gold">
                <span className="w-2 h-2 rounded-full bg-vitality-sage animate-pulse" />
                <span>Pre-Consultation Clinical Intake Screener</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl text-text-surface font-normal mt-1">
                Personalized Longevity Pathway Screener
              </h1>
            </div>

            {/* Zero-ePHI Quarantine Badge */}
            <div className="px-3.5 py-1.5 rounded-lg bg-surface-midnight border border-vitality-sage/40 flex items-center gap-2 text-xs font-mono text-vitality-sage self-start sm:self-auto shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-vitality-sage animate-ping" />
              <span>Zero-ePHI &bull; Ephemeral Client State</span>
            </div>
          </div>

          {/* Multi-Step Progress Tracker */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {[
              { step: 1, label: "1. Objectives" },
              { step: 2, label: "2. Medications" },
              { step: 3, label: "3. Safety Gates" },
              { step: 4, label: "4. Protocol Plan" },
            ].map((s) => (
              <div
                key={s.step}
                onClick={() => {
                  if (s.step < currentStep) setCurrentStep(s.step);
                }}
                className={`py-2 px-3 rounded-lg border text-center font-mono text-xs transition-all cursor-pointer ${
                  currentStep === s.step
                    ? "bg-surface-midnight border-champagne-gold text-champagne-gold font-bold shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                    : currentStep > s.step
                    ? "bg-canvas-obsidian border-vitality-sage/40 text-vitality-sage"
                    : "bg-canvas-obsidian border-border-midnight text-text-surface-muted opacity-50"
                }`}
              >
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* =========================================================================
            STEP 1: Primary Longevity Objectives
           ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-widest text-vitality-sage">
                Step 1 of 4 &bull; Clinical Prioritization
              </span>
              <h2 className="font-display text-2xl sm:text-3xl text-text-surface">
                Select Your Primary Longevity &amp; Performance Objectives
              </h2>
              <p className="font-body text-sm text-text-surface-variant">
                Select one or more biological domains you seek to optimize. Our clinical architecture 
                will calibrate stoichiometric cofactors to your selections.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  id: "cognitive-endurance",
                  title: "Executive Cognitive Endurance",
                  desc: "Sustained prefrontal clarity, resolving afternoon brain fog, and mitochondrial energy optimization.",
                  domain: "DLPFC & ATP Synthesis",
                },
                {
                  id: "autonomic-hrv",
                  title: "Autonomic Regulation & Deep Sleep",
                  desc: "Vagal tone fortification, sympathetic recalibration, and deep restorative slow-wave sleep expansion.",
                  domain: "Vagal Tone (rMSSD > 55ms)",
                },
                {
                  id: "neurovascular",
                  title: "Neurovascular & Endothelial Health",
                  desc: "Blood-brain barrier tight junction repair, nitric oxide bioavailability, and homocysteine clearance.",
                  domain: "Cerebral Perfusion & eNOS",
                },
                {
                  id: "pelvic-core",
                  title: "Postural & Pelvic Core Stability",
                  desc: "Non-invasive HIFEM pelvic floor reinforcement intimately coupled with visceral autonomic tone.",
                  domain: "BTL Emsella 2.5 Tesla",
                },
              ].map((obj) => {
                const isSelected = selectedObjectives.includes(obj.id);
                return (
                  <div
                    key={obj.id}
                    onClick={() => toggleObjective(obj.id)}
                    className={`p-6 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? "bg-surface-midnight border-champagne-gold shadow-[0_0_25px_rgba(212,175,55,0.2)] ring-1 ring-champagne-gold/30"
                        : "bg-surface-midnight/60 border-border-midnight hover:border-border-gold-subtle hover:bg-surface-midnight"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-canvas-obsidian border border-border-midnight text-champagne-gold">
                          {obj.domain}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                            isSelected
                              ? "bg-champagne-gold border-champagne-gold text-text-on-gold font-bold"
                              : "border-border-midnight bg-canvas-obsidian"
                          }`}
                        >
                          {isSelected && "✓"}
                        </div>
                      </div>
                      <h3 className="font-display text-xl text-text-surface">
                        {obj.title}
                      </h3>
                      <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                        {obj.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-8 py-3.5 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] btn-luxury-shimmer"
              >
                Proceed to Medication Screening &rarr;
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: Iatrogenic & Medication Screening
           ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-widest text-vitality-sage">
                Step 2 of 4 &bull; Pharmacological Interaction Audit
              </span>
              <h2 className="font-display text-2xl sm:text-3xl text-text-surface">
                Iatrogenic &amp; Prescription Regimen Screening
              </h2>
              <p className="font-body text-sm text-text-surface-variant">
                Certain first-line pharmaceuticals induce profound, subclinical micronutrient malabsorption. 
                Identify any ongoing therapies to reveal targeted stoichiometric countermeasures.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  id: "metformin",
                  name: "Metformin (Glucophage / Extended Release)",
                  impact:
                    "Interferes with calcium-dependent ileal membrane binding, reducing active HoloTC B12 levels by 20–30% within 12–24 months.",
                  advisory:
                    "Clinical Mandate: Requires baseline HoloTC & Methylmalonic Acid (MMA) panels to rule out occult neuropathy masquerading as diabetic peripheral neuropathy.",
                },
                {
                  id: "ppi",
                  name: "Chronic Proton Pump Inhibitors (Omeprazole, Pantoprazole) / H2 Blockers",
                  impact:
                    "Gastric achlorhydria prevents acid-pepsin dissociation of cobalamin from dietary proteins, severely degrading intestinal absorption.",
                  advisory:
                    "Clinical Mandate: Bypasses gastrointestinal hysteresis through high-concentration sublingual or stoichiometric parenteral cobalamin infusions.",
                },
                {
                  id: "anticoagulant",
                  name: "Anticoagulants / DOACs (Apixaban, Rivaroxaban, Warfarin)",
                  impact:
                    "Affects prothrombin time and coagulation cascade balance; interacts with high-dose lipid and Vitamin K administration.",
                  advisory:
                    "Clinical Safety Gate: High-dose Omega-3 fatty acids (>3,000 mg/day) must be physician-calibrated with routine PT/INR monitoring.",
                },
                {
                  id: "statins",
                  name: "HMG-CoA Reductase Inhibitors (Statins)",
                  impact:
                    "Inhibits mevalonate pathway, depleting endogenous CoQ10 synthesis and potentially precipitating mitochondrial myopathy.",
                  advisory:
                    "Clinical Recommendation: Pair with 200–400 mg liposomal Ubiquinol to restore electron transport chain Complex I/II shuttle capacity.",
                },
                {
                  id: "none",
                  name: "None of the above medications",
                  impact: "No documented pharmacological absorption barriers.",
                  advisory: "Standard neuro-metabolic saturation corridors apply.",
                },
              ].map((med) => {
                const isSelected = selectedMeds.includes(med.id);
                return (
                  <div
                    key={med.id}
                    onClick={() => toggleMed(med.id)}
                    className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer space-y-3 ${
                      isSelected
                        ? "bg-surface-midnight border-champagne-gold shadow-[0_0_20px_rgba(212,175,55,0.15)]"
                        : "bg-surface-midnight/60 border-border-midnight hover:border-border-gold-subtle"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                            isSelected
                              ? "bg-champagne-gold border-champagne-gold text-text-on-gold font-bold"
                              : "border-border-midnight bg-canvas-obsidian"
                          }`}
                        >
                          {isSelected && "✓"}
                        </div>
                        <span className="font-display text-lg text-text-surface">
                          {med.name}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-text-surface-muted uppercase">
                        {isSelected ? "Selected" : "Click to select"}
                      </span>
                    </div>

                    <p className="font-body text-xs text-text-surface-variant pl-7">
                      {med.impact}
                    </p>

                    {/* High-Contrast Clinical Advisory Drawer when selected */}
                    {isSelected && med.id !== "none" && (
                      <div className="ml-7 p-3 rounded-lg bg-canvas-obsidian border border-vitality-sage/40 text-xs font-mono text-vitality-sage space-y-1 animate-in fade-in duration-200">
                        <div className="text-[10px] uppercase tracking-wider text-champagne-gold font-semibold">
                          Diagnostic Advisory &bull; Pharmacological Protocol
                        </div>
                        <p className="leading-relaxed text-text-surface">
                          {med.advisory}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="font-mono text-xs uppercase tracking-wider text-text-surface-muted hover:text-text-surface"
              >
                &larr; Back to Objectives
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-8 py-3.5 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] btn-luxury-shimmer"
              >
                Proceed to Contraindication Gates &rarr;
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: Mandatory Clinical Contraindications Gate
           ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-widest text-champagne-gold font-semibold">
                Step 3 of 4 &bull; Clinical Safety &amp; Toxicological Gates
              </span>
              <h2 className="font-display text-2xl sm:text-3xl text-text-surface">
                Mandatory Contraindication Screening
              </h2>
              <p className="font-body text-sm text-text-surface-variant">
                Our clinic enforces non-negotiable safety corridors. Active malignancy, unmonitored B6 supplementation, 
                and ferromagnetic materials trigger specific clinical safeguards.
              </p>
            </div>

            <div className="space-y-6">
              {/* Oncology Gate */}
              <div
                onClick={() => setHasOncologyHistory(!hasOncologyHistory)}
                className={`p-6 rounded-xl border transition-all cursor-pointer space-y-3 ${
                  hasOncologyHistory
                    ? "bg-surface-midnight border-red-800 shadow-[0_0_25px_rgba(220,38,38,0.2)]"
                    : "bg-surface-midnight/70 border-border-midnight hover:border-border-gold-subtle"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${
                        hasOncologyHistory
                          ? "bg-red-600 border-red-600 text-white font-bold"
                          : "border-border-midnight bg-canvas-obsidian"
                      }`}
                    >
                      {hasOncologyHistory && "!"}
                    </div>
                    <span className="font-display text-xl text-text-surface">
                      Active or Historical Oncological Condition
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded ${
                      hasOncologyHistory
                        ? "bg-red-950 text-red-400 border border-red-800"
                        : "text-text-surface-muted"
                    }`}
                  >
                    {hasOncologyHistory ? "NAD+ Locked" : "Safety Audit"}
                  </span>
                </div>

                <p className="font-body text-xs text-text-surface-variant pl-8 leading-relaxed">
                  Screening for active solid tumors or historical hematological malignancies.
                </p>

                {hasOncologyHistory && (
                  <div className="ml-8 p-4 rounded-lg bg-red-950/60 border border-red-800 text-xs font-mono text-red-200 space-y-1.5 animate-in fade-in duration-200">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-red-300">
                      SAFETY HARD-LOCK TRIGGERED
                    </div>
                    <p className="leading-relaxed">
                      NAD+ precursor infusions (NMN, NR, NAD+) are strictly contra-indicated during active 
                      oncological management due to theorized cellular proliferation energetics. 
                      Candidate requires written clearance from treating oncologist before metabolic therapy.
                    </p>
                  </div>
                )}
              </div>

              {/* B6 Toxicity Audit */}
              <div className="p-6 rounded-xl bg-surface-midnight border border-border-midnight space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl text-text-surface">
                      Supplement Audit: Daily Vitamin B6 (Pyridoxine) Intake
                    </h3>
                    <span className="font-mono text-[10px] uppercase text-champagne-gold">
                      Neuropathy Ceiling: &lt; 20 mg/day
                    </span>
                  </div>
                  <p className="font-body text-xs text-text-surface-variant">
                    Over-the-counter nootropics and energy formulas routinely megadose Pyridoxine HCl at 50–100 mg/day, 
                    inducing toxic dorsal root ganglion sensory axonopathy.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "low", label: "Low / Optimal (< 15 mg)", status: "Safe Physiological Range" },
                    { id: "medium", label: "Borderline (15–20 mg)", status: "Upper Physiological Limit" },
                    { id: "high", label: "High (> 20 mg/day)", status: "Toxic Ganglionopathy Risk" },
                  ].map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setB6IntakeLevel(level.id as "low" | "medium" | "high")}
                      className={`p-3 rounded-lg border font-mono text-xs text-left transition-all ${
                        b6IntakeLevel === level.id
                          ? level.id === "high"
                            ? "bg-red-950/60 border-red-600 text-red-300"
                            : "bg-canvas-obsidian border-champagne-gold text-champagne-gold font-bold shadow-inner"
                          : "bg-canvas-obsidian/60 border-border-midnight text-text-surface-muted hover:text-text-surface"
                      }`}
                    >
                      <div className="font-semibold">{level.label}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">{level.status}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Metallic Implants / Pacemaker screen */}
              <div
                onClick={() => setHasMetallicImplant(!hasMetallicImplant)}
                className={`p-6 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  hasMetallicImplant
                    ? "bg-surface-midnight border-champagne-gold/60"
                    : "bg-surface-midnight/70 border-border-midnight hover:border-border-gold-subtle"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                        hasMetallicImplant
                          ? "bg-champagne-gold border-champagne-gold text-text-on-gold font-bold"
                          : "border-border-midnight bg-canvas-obsidian"
                      }`}
                    >
                      {hasMetallicImplant && "✓"}
                    </div>
                    <span className="font-display text-lg text-text-surface">
                      Ferromagnetic Implants, Pacemaker, or Aneurysm Clips
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase text-text-surface-muted">
                    Electromagnetic Screen
                  </span>
                </div>
                <p className="font-body text-xs text-text-surface-variant pl-7 leading-relaxed">
                  Direct electromagnetic modalities (10 Hz TMS, BTL Emsella) require absence of intracranial ferromagnetics.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="font-mono text-xs uppercase tracking-wider text-text-surface-muted hover:text-text-surface"
              >
                &larr; Back to Medications
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-8 py-3.5 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] btn-luxury-shimmer"
              >
                Generate Tailored Protocol &rarr;
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 4: Personalized Protocol Recommendation & Cal.com Booking
           ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-widest text-champagne-gold font-semibold">
                Step 4 of 4 &bull; Clinical Consultation Blueprint
              </span>
              <h2 className="font-display text-2xl sm:text-3xl text-text-surface">
                Your Tailored Neuro-Metabolic Protocol Plan
              </h2>
              <p className="font-body text-sm text-text-surface-variant">
                Based on your physiological objectives and medication screening, Dr. Runheim’s clinical team 
                has architected your personalized diagnostic roadmap.
              </p>
            </div>

            {/* Protocol Dossier Card */}
            <div className="p-8 rounded-2xl bg-surface-midnight border border-[#D4AF37]/30 shadow-[0_25px_60px_rgba(0,0,0,0.85)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-midnight pb-6">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-vitality-sage font-semibold">
                    Recommended Clinical Pathway
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl text-champagne-gold">
                    {recommendation.trackTitle}
                  </h3>
                </div>
                <div className="px-3.5 py-1.5 rounded-full bg-canvas-obsidian border border-[#D4AF37]/30 text-xs font-mono text-champagne-gold self-start sm:self-auto">
                  Event Template #982148
                </div>
              </div>

              {/* Protocol Gates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-canvas-obsidian border border-border-midnight space-y-1">
                  <span className="text-[10px] uppercase text-text-surface-muted block">
                    NAD+ Precursor Status
                  </span>
                  <span
                    className={`font-semibold block ${
                      hasOncologyHistory ? "text-red-400" : "text-vitality-sage"
                    }`}
                  >
                    {recommendation.nadStatus}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-canvas-obsidian border border-border-midnight space-y-1">
                  <span className="text-[10px] uppercase text-text-surface-muted block">
                    Electromagnetic Modality
                  </span>
                  <span
                    className={`font-semibold block ${
                      hasMetallicImplant ? "text-yellow-400" : "text-vitality-sage"
                    }`}
                  >
                    {recommendation.electromagneticStatus}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-canvas-obsidian border border-border-midnight space-y-1">
                  <span className="text-[10px] uppercase text-text-surface-muted block">
                    B6 Toxicological Safety
                  </span>
                  <span
                    className={`font-semibold block ${
                      b6IntakeLevel === "high" ? "text-red-400" : "text-vitality-sage"
                    }`}
                  >
                    {recommendation.b6Guidance}
                  </span>
                </div>
              </div>

              {/* Customized Clinical Actions Breakdown */}
              <div className="space-y-3 pt-2">
                <h4 className="font-mono text-xs uppercase tracking-wider text-text-surface-muted">
                  Consultation Focus &bull; Required Baseline Panels:
                </h4>
                <ul className="space-y-2 font-body text-xs text-text-surface-variant">
                  <li className="flex items-start gap-2.5">
                    <span className="text-champagne-gold font-mono">&bull;</span>
                    <span>
                      <strong>NICE 2024 HoloTC &amp; MMA Quantification:</strong> Bypassing conventional serum total B12 false positives to establish true transcobalamin receptor saturation.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-champagne-gold font-mono">&bull;</span>
                    <span>
                      <strong>Erythrocyte Thiamine Diphosphate (TDP) Corridor:</strong> Restoring intracellular pyruvate dehydrogenase and transketolase saturation to 275–675 nmol/L.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-champagne-gold font-mono">&bull;</span>
                    <span>
                      <strong>RBC Omega-3 Index Optimization (&gt; 8.0%):</strong> Prerequisite cellular membrane fluidity ensuring VITACOG trial cognitive protection consolidation.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Cal.com Assessment Booking Launch Trigger */}
              <div className="pt-6 border-t border-border-midnight flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left space-y-1">
                  <div className="font-display text-lg text-text-surface">
                    Schedule Physician Neuro-Diagnostic Consultation
                  </div>
                  <p className="font-mono text-[11px] text-text-surface-muted">
                    Comprehensive 45-minute baseline mapping with Lead Neurologist Dr. David Andreas Runheim, MD.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBookingOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(212,175,55,0.35)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] flex items-center justify-center gap-2 btn-luxury-shimmer whitespace-nowrap"
                >
                  <span>Open Cal.com Reservation Modal</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="font-mono text-xs uppercase tracking-wider text-text-surface-muted hover:text-text-surface"
              >
                &larr; Adjust Safety Screen
              </button>
              <Link
                href="/ledger"
                className="font-mono text-xs text-champagne-gold hover:text-champagne-gold-light uppercase tracking-wider"
              >
                Review Biomarker Stoichiometry Ledger &rarr;
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Official Cal.com Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      <footer className="border-t border-border-gold-subtle bg-surface-midnight py-6 px-6 text-center font-mono text-xs text-text-surface-muted mt-auto">
        &copy; 2026 COGNITIVE EDGE CLINICAL GROUP &bull; ZERO-ePHI PROTOCOL &bull; ALL PRE-SCREEN RESPONSES HELD IN EPHEMERAL CLIENT STATE
      </footer>
    </div>
  );
}

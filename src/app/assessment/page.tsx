"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import { BookingModal } from "@/components/marketing/BookingModal";

export interface PathwayObjective {
  id: string;
  title: string;
  domain: string;
  desc: string;
  fullName: string;
}

export const PATHWAY_OBJECTIVES: PathwayObjective[] = [
  {
    id: "cognitive-endurance",
    title: "Executive Cognitive Endurance",
    domain: "DLPFC & ATP Synthesis",
    desc: "Sustained prefrontal clarity, resolving afternoon brain fog, and mitochondrial energy optimization.",
    fullName: "Executive Cognitive Endurance (DLPFC & ATP Synthesis)",
  },
  {
    id: "autonomic-hrv",
    title: "Autonomic Regulation & Deep Sleep",
    domain: "Vagal Tone (rMSSD > 55ms)",
    desc: "Vagal tone fortification, sympathetic recalibration, and deep restorative slow-wave sleep expansion.",
    fullName: "Autonomic Regulation & Deep Sleep (Vagal Tone (rMSSD > 55ms))",
  },
  {
    id: "neurovascular",
    title: "Neurovascular & Endothelial Health",
    domain: "Cerebral Perfusion & eNOS",
    desc: "Blood-brain barrier tight junction repair, nitric oxide bioavailability, and homocysteine clearance.",
    fullName: "Neurovascular & Endothelial Health (Cerebral Perfusion & eNOS)",
  },
  {
    id: "pelvic-core",
    title: "Postural & Pelvic Core Stability",
    domain: "BTL Emsella 2.5 Tesla",
    desc: "Non-invasive HIFEM pelvic floor reinforcement intimately coupled with visceral autonomic tone.",
    fullName: "Postural & Pelvic Core Stability (BTL Emsella 2.5 Tesla)",
  },
];

export default function ClinicalPreScreeningAssessmentPage() {
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([
    "cognitive-endurance",
  ]);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState<{
    recipient: string;
    message: string;
    summary?: {
      assessmentId: string;
      timestamp: string;
      selectedObjectives?: string[];
    };
  } | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Toggle objective selection (multi-select)
  const toggleObjective = (id: string) => {
    if (selectedObjectives.includes(id)) {
      if (selectedObjectives.length > 1) {
        setSelectedObjectives(selectedObjectives.filter((o) => o !== id));
      }
    } else {
      setSelectedObjectives([...selectedObjectives, id]);
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || selectedObjectives.length === 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const selectedNames = selectedObjectives.map(
        (id) => PATHWAY_OBJECTIVES.find((o) => o.id === id)?.fullName || id
      );

      const response = await fetch("/api/assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          selectedObjectives: selectedNames,
          targetRecipient: "andreas.runheim@gmail.com",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Unable to transmit pathway objectives. Please try again.");
      }

      const data = await response.json();
      setSubmissionData(data);
      setIsSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error transmitting objectives.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSubmissionData(null);
    setEmail("");
    setSelectedObjectives(["cognitive-endurance"]);
    setSubmitError(null);
  };

  const selectedObjectiveObjects = PATHWAY_OBJECTIVES.filter((obj) =>
    selectedObjectives.includes(obj.id)
  );

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
        </div>

        {/* Confirmation View upon successful submission */}
        {isSubmitted ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="p-8 rounded-2xl bg-surface-midnight border border-champagne-gold/40 shadow-[0_25px_60px_rgba(0,0,0,0.85)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-midnight pb-6">
                <div>
                  <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-vitality-sage font-semibold">
                    <span className="w-2 h-2 rounded-full bg-vitality-sage" />
                    <span>Clinical Transmission Confirmed</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl text-champagne-gold mt-1">
                    Longevity Pathway Objectives Dispatched
                  </h2>
                </div>
                <div className="px-3.5 py-1.5 rounded-full bg-canvas-obsidian border border-[#D4AF37]/30 text-xs font-mono text-champagne-gold self-start sm:self-auto">
                  {submissionData?.summary?.assessmentId
                    ? `#${submissionData.summary.assessmentId.slice(0, 8).toUpperCase()}`
                    : "#PATHWAY-RECEIVED"}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-canvas-obsidian border border-vitality-sage/30 text-xs font-mono text-vitality-sage leading-relaxed space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-champagne-gold font-semibold">
                  Transmission Notice
                </div>
                <p>
                  Objectives received and dispatched to{" "}
                  <strong className="text-text-surface underline decoration-champagne-gold">
                    {submissionData?.recipient || "andreas.runheim@gmail.com"}
                  </strong>
                  . Our clinical concierge will review your selections prior to consultation.
                </p>
              </div>

              {/* Chosen Objectives Summary */}
              <div className="space-y-3">
                <div className="font-mono text-xs uppercase tracking-wider text-text-surface-muted">
                  Chosen Objectives Summary:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedObjectiveObjects.map((obj) => (
                    <div
                      key={obj.id}
                      className="p-4 rounded-xl bg-canvas-obsidian border border-champagne-gold/30 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-surface-midnight text-champagne-gold border border-border-midnight">
                          {obj.domain}
                        </span>
                        <span className="text-vitality-sage text-xs font-bold">✓ Selected</span>
                      </div>
                      <h3 className="font-display text-base text-text-surface font-semibold">
                        {obj.title}
                      </h3>
                      <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                        {obj.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking & Consultation Action Corridor */}
              <div className="pt-6 border-t border-border-midnight flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left space-y-1">
                  <div className="font-display text-lg text-text-surface">
                    Schedule Physician Neuro-Diagnostic Consultation
                  </div>
                  <p className="font-mono text-[11px] text-text-surface-muted">
                    Cal.com baseline roadmap consultation with Lead Neurologist Dr. David Andreas Runheim, MD.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsBookingOpen(true)}
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(212,175,55,0.35)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] flex items-center justify-center gap-2 btn-luxury-shimmer whitespace-nowrap"
                  >
                    <span>Book Clinical Consultation</span>
                    <span>&rarr;</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full sm:w-auto px-6 py-4 rounded-full bg-canvas-obsidian hover:bg-surface-midnight text-text-surface-variant hover:text-text-surface border border-border-midnight font-mono text-xs uppercase tracking-wider transition-all"
                  >
                    Reset &amp; Modify Objectives
                  </button>
                </div>
              </div>

              {/* Direct Concierge Line */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-text-surface-muted gap-1">
                <span>Immediate clinical coordination or urgent concierge inquiry?</span>
                <a
                  href="mailto:andreas.runheim@gmail.com"
                  className="text-champagne-gold hover:underline flex items-center gap-1"
                >
                  <span>Concierge Email: andreas.runheim@gmail.com</span>
                  &rarr;
                </a>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="font-mono text-xs uppercase tracking-wider text-text-surface-muted hover:text-text-surface"
              >
                &larr; Configure Another Pathway
              </button>
              <Link
                href="/ledger"
                className="font-mono text-xs text-champagne-gold hover:text-champagne-gold-light uppercase tracking-wider"
              >
                Review Biomarker Stoichiometry Ledger &rarr;
              </Link>
            </div>
          </div>
        ) : (
          /* Streamlined Personalized Longevity Pathway Flow */
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-widest text-vitality-sage">
                Clinical Prioritization &bull; Pathway Customization
              </span>
              <h2 className="font-display text-2xl sm:text-3xl text-text-surface">
                Select Your Primary Longevity &amp; Performance Objectives
              </h2>
              <p className="font-body text-sm text-text-surface-variant">
                Select one or more biological domains you seek to optimize. Our clinical architecture 
                will calibrate stoichiometric cofactors and protocols directly to your selections.
              </p>
            </div>

            {/* 4 Core Objectives Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PATHWAY_OBJECTIVES.map((obj) => {
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

            {/* Form Section: Directly below the objectives */}
            <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-surface-midnight border border-border-midnight space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="clinical-email"
                  className="block font-mono text-xs uppercase tracking-wider text-champagne-gold"
                >
                  Clinical Communication Email
                </label>
                <input
                  id="clinical-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  className="w-full px-4 py-3.5 rounded-xl bg-canvas-obsidian border border-border-midnight text-text-surface placeholder:text-text-surface-muted/50 font-mono text-sm focus:outline-none focus:border-champagne-gold focus:ring-1 focus:ring-champagne-gold transition-all"
                />
              </div>

              {/* Concierge Transmission Indicator */}
              <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-canvas-obsidian border border-vitality-sage/30 text-xs font-mono text-vitality-sage">
                <span className="w-2 h-2 rounded-full bg-vitality-sage animate-pulse shrink-0" />
                <span>
                  Your priority objectives will be transmitted directly to our clinical concierge at andreas.runheim@gmail.com.
                </span>
              </div>

              {submitError && (
                <div className="p-3.5 rounded-lg bg-red-950/60 border border-red-800 text-xs font-mono text-red-300">
                  {submitError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="text-xs font-mono text-text-surface-muted">
                  {selectedObjectives.length} {selectedObjectives.length === 1 ? "objective" : "objectives"} selected
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || selectedObjectives.length === 0}
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-champagne-gold hover:bg-champagne-gold-light disabled:opacity-50 disabled:cursor-not-allowed text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] flex items-center justify-center gap-2 btn-luxury-shimmer"
                >
                  <span>
                    {isSubmitting ? "Transmitting Objectives..." : "Transmit Objectives & Request Pathway →"}
                  </span>
                </button>
              </div>
            </form>
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

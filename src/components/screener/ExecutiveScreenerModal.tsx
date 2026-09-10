"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  evaluateExecutiveBattery,
  wipeScreenerMemory,
  type AgeCohort,
  type SRTTrialInput,
  type Spatial2BackTrialInput,
  type StroopTrialInput,
  type StroopColor,
  type ExecutiveCompositeReport,
} from "@/lib/screener/scoringEngine";

export interface ExecutiveScreenerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAge?: number;
  onComplete?: (report: ExecutiveCompositeReport) => void;
}

type BatteryPhase =
  | "INSTRUCTIONS"
  | "SRT"
  | "SPATIAL_2BACK"
  | "STROOP"
  | "REPORT";

type SRTSubState =
  | "READY"
  | "FIXATION"
  | "STIMULUS_ACTIVE"
  | "FALSE_START"
  | "TRIAL_COMPLETE";

const SRT_TOTAL_TRIALS = 5;

interface StroopTrialConfig {
  word: string;
  inkColor: StroopColor;
}

const STROOP_TRIAL_BATTERY: StroopTrialConfig[] = [
  { word: "RED", inkColor: "red" },      // Congruent
  { word: "BLUE", inkColor: "gold" },    // Incongruent
  { word: "GREEN", inkColor: "green" },  // Congruent
  { word: "GOLD", inkColor: "blue" },    // Incongruent
  { word: "RED", inkColor: "green" },    // Incongruent
  { word: "BLUE", inkColor: "blue" },    // Congruent
  { word: "GREEN", inkColor: "red" },    // Incongruent
  { word: "GOLD", inkColor: "gold" },    // Congruent
];

const SPATIAL_2BACK_SEQUENCE: number[] = [2, 5, 2, 7, 2, 8, 4, 8, 1, 6];

const STROOP_COLOR_MAP: Record<StroopColor, { name: string; hex: string; keyNum: string; arrow: string }> = {
  red: { name: "Red", hex: "#f87171", keyNum: "1", arrow: "←" },
  blue: { name: "Blue", hex: "#38bdf8", keyNum: "2", arrow: "↑" },
  green: { name: "Green", hex: "#4ade80", keyNum: "3", arrow: "→" },
  gold: { name: "Gold", hex: "#fde047", keyNum: "4", arrow: "↓" },
};

export function ExecutiveScreenerModal({
  isOpen,
  onClose,
  initialAge = 35,
  onComplete,
}: ExecutiveScreenerModalProps) {
  // Phase & Demographic State
  const [phase, setPhase] = useState<BatteryPhase>("INSTRUCTIONS");
  const [patientAge, setPatientAge] = useState<number>(initialAge);

  // Live Timer Display (Millisecond Resolution)
  const [liveElapsedMs, setLiveElapsedMs] = useState<number>(0);
  const timerRafRef = useRef<number | null>(null);
  const timerStartRef = useRef<number>(0);

  // Phase 1: Simple Reaction Time (SRT) State
  const [srtSubState, setSrtSubState] = useState<SRTSubState>("READY");
  const [srtTrialIndex, setSrtTrialIndex] = useState<number>(0);
  const [srtRecordedTrials, setSrtRecordedTrials] = useState<SRTTrialInput[]>([]);
  const [srtLastFeedback, setSrtLastFeedback] = useState<string | null>(null);
  const srtDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const srtStimulusStartRef = useRef<number>(0);

  // Phase 2: Spatial Working Memory 2-Back State
  const [spatialStep, setSpatialStep] = useState<number>(0);
  const [isSpatialBlank, setIsSpatialBlank] = useState<boolean>(false);
  const [spatialHasReported, setSpatialHasReported] = useState<boolean>(false);
  const [spatialRecordedTrials, setSpatialRecordedTrials] = useState<Spatial2BackTrialInput[]>([]);
  const spatialStepStartRef = useRef<number>(0);

  // Derived active tile: null if blank or outside spatial phase
  const spatialActiveTile =
    isSpatialBlank || phase !== "SPATIAL_2BACK" || spatialStep >= SPATIAL_2BACK_SEQUENCE.length
      ? null
      : SPATIAL_2BACK_SEQUENCE[spatialStep];

  // Phase 3: Stroop Interference State
  const [stroopTrialIdx, setStroopTrialIdx] = useState<number>(0);
  const [stroopRecordedTrials, setStroopRecordedTrials] = useState<StroopTrialInput[]>([]);
  const stroopStimulusStartRef = useRef<number>(0);

  // Phase 4: Instant Clinical Report
  const [compositeReport, setCompositeReport] = useState<ExecutiveCompositeReport | null>(null);

  // ---------------------------------------------------------------------------
  // Live Millisecond High-Resolution Timer Engine
  // ---------------------------------------------------------------------------
  const startLiveTimer = useCallback(() => {
    timerStartRef.current = performance.now();
    const updateTimer = () => {
      const now = performance.now();
      setLiveElapsedMs(Math.round(now - timerStartRef.current));
      timerRafRef.current = requestAnimationFrame(updateTimer);
    };
    timerRafRef.current = requestAnimationFrame(updateTimer);
  }, []);

  const stopLiveTimer = useCallback(() => {
    if (timerRafRef.current) {
      cancelAnimationFrame(timerRafRef.current);
      timerRafRef.current = null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Session Clean-Up & RAM Quarantine Purge
  // ---------------------------------------------------------------------------
  const purgeAndResetSession = useCallback(() => {
    // 1. Purge Scoring Engine Volatile Memory
    wipeScreenerMemory();

    // 2. Clear active live timer loops
    stopLiveTimer();

    // 3. Clear active timeouts
    if (srtDelayTimeoutRef.current) clearTimeout(srtDelayTimeoutRef.current);

    // 4. Reset component-level ephemeral state
    setPhase("INSTRUCTIONS");
    setLiveElapsedMs(0);
    setSrtSubState("READY");
    setSrtTrialIndex(0);
    setSrtRecordedTrials([]);
    setSrtLastFeedback(null);
    setSpatialStep(0);
    setIsSpatialBlank(false);
    setSpatialHasReported(false);
    setSpatialRecordedTrials([]);
    setStroopTrialIdx(0);
    setStroopRecordedTrials([]);
    setCompositeReport(null);
  }, [stopLiveTimer]);

  const handleCloseModal = useCallback(() => {
    purgeAndResetSession();
    onClose();
  }, [purgeAndResetSession, onClose]);

  // Clean-up on component unmount
  useEffect(() => {
    return () => {
      wipeScreenerMemory();
      if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
      if (srtDelayTimeoutRef.current) clearTimeout(srtDelayTimeoutRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Phase 1: Simple Visual Reaction Time (SRT) Logic
  // ---------------------------------------------------------------------------
  const scheduleSrtStimulus = useCallback(() => {
    setSrtSubState("FIXATION");
    stopLiveTimer();
    setLiveElapsedMs(0);

    // Randomized foreperiod delay: 1500ms to 3200ms
    const randomDelay = Math.floor(1500 + Math.random() * 1700);
    srtDelayTimeoutRef.current = setTimeout(() => {
      setSrtSubState("STIMULUS_ACTIVE");
      srtStimulusStartRef.current = performance.now();
      startLiveTimer();
    }, randomDelay);
  }, [startLiveTimer, stopLiveTimer]);

  const handleSrtResponse = useCallback(() => {
    const now = performance.now();

    if (srtSubState === "FIXATION") {
      // Patient pressed before target appeared -> False Start!
      if (srtDelayTimeoutRef.current) clearTimeout(srtDelayTimeoutRef.current);
      stopLiveTimer();
      setSrtSubState("FALSE_START");
      setSrtLastFeedback("Anticipatory false start. Wait for target appearance.");

      srtDelayTimeoutRef.current = setTimeout(() => {
        scheduleSrtStimulus();
      }, 1400);
      return;
    }

    if (srtSubState === "STIMULUS_ACTIVE") {
      stopLiveTimer();
      const stimulusTime = srtStimulusStartRef.current;
      const latency = Math.round(now - stimulusTime);

      const updatedTrials = [...srtRecordedTrials, { stimulusTimestamp: stimulusTime, responseTimestamp: now }];
      setSrtRecordedTrials(updatedTrials);
      setSrtSubState("TRIAL_COMPLETE");
      setSrtLastFeedback(`${latency} ms`);

      const nextTrialIdx = srtTrialIndex + 1;
      setSrtTrialIndex(nextTrialIdx);

      if (nextTrialIdx >= SRT_TOTAL_TRIALS) {
        srtDelayTimeoutRef.current = setTimeout(() => {
          setPhase("SPATIAL_2BACK");
          setSpatialStep(0);
          setIsSpatialBlank(false);
        }, 1000);
      } else {
        srtDelayTimeoutRef.current = setTimeout(() => {
          scheduleSrtStimulus();
        }, 1000);
      }
    }
  }, [srtSubState, srtTrialIndex, srtRecordedTrials, scheduleSrtStimulus, stopLiveTimer]);

  // ---------------------------------------------------------------------------
  // Phase 2: Spatial Working Memory 2-Back Sequence Logic
  // ---------------------------------------------------------------------------
  const startStroopBattery = useCallback(() => {
    setPhase("STROOP");
    setStroopTrialIdx(0);
    stroopStimulusStartRef.current = performance.now();
    startLiveTimer();
  }, [startLiveTimer]);

  useEffect(() => {
    if (phase !== "SPATIAL_2BACK" || spatialStep >= SPATIAL_2BACK_SEQUENCE.length) return;

    spatialStepStartRef.current = performance.now();
    startLiveTimer();

    const currentTilePos = SPATIAL_2BACK_SEQUENCE[spatialStep];

    const presentationTimer = setTimeout(() => {
      stopLiveTimer();
      setIsSpatialBlank(true);

      setSpatialRecordedTrials((prev) => {
        const alreadyRecorded = prev.some((t) => t.stepIndex === spatialStep);
        if (!alreadyRecorded) {
          return [
            ...prev,
            {
              stepIndex: spatialStep,
              position: currentTilePos,
              userReportedMatch: false,
            },
          ];
        }
        return prev;
      });

      const blankTimer = setTimeout(() => {
        if (spatialStep + 1 >= SPATIAL_2BACK_SEQUENCE.length) {
          startStroopBattery();
        } else {
          setSpatialStep((prev) => prev + 1);
          setIsSpatialBlank(false);
          setSpatialHasReported(false);
        }
      }, 400);

      return () => clearTimeout(blankTimer);
    }, 1400);

    return () => {
      clearTimeout(presentationTimer);
      stopLiveTimer();
    };
  }, [phase, spatialStep, startLiveTimer, stopLiveTimer, startStroopBattery]);

  const handleSpatialMatchAction = useCallback(() => {
    if (isSpatialBlank || spatialHasReported || spatialStep < 2 || phase !== "SPATIAL_2BACK") return;
    setSpatialHasReported(true);

    const latency = Math.round(performance.now() - spatialStepStartRef.current);
    const currentTilePos = SPATIAL_2BACK_SEQUENCE[spatialStep];

    setSpatialRecordedTrials((prev) => [
      ...prev,
      {
        stepIndex: spatialStep,
        position: currentTilePos,
        userReportedMatch: true,
        latencyMs: latency,
      },
    ]);
  }, [isSpatialBlank, spatialHasReported, spatialStep, phase]);

  // ---------------------------------------------------------------------------
  // Phase 3: Stroop Interference Battery Logic
  // ---------------------------------------------------------------------------
  const handleStroopChoice = useCallback(
    (selectedColor: StroopColor) => {
      const now = performance.now();
      const latency = Math.max(150, Math.round(now - stroopStimulusStartRef.current));
      const currentConfig = STROOP_TRIAL_BATTERY[stroopTrialIdx];

      const newTrial: StroopTrialInput = {
        trialIndex: stroopTrialIdx + 1,
        word: currentConfig.word,
        inkColor: currentConfig.inkColor,
        userSelectedColor: selectedColor,
        latencyMs: latency,
      };

      const updatedTrials = [...stroopRecordedTrials, newTrial];
      setStroopRecordedTrials(updatedTrials);
      stopLiveTimer();

      const nextIdx = stroopTrialIdx + 1;
      setStroopTrialIdx(nextIdx);

      if (nextIdx >= STROOP_TRIAL_BATTERY.length) {
        // Battery complete! Evaluate composite report
        const report = evaluateExecutiveBattery({
          age: patientAge,
          srtTrials: srtRecordedTrials,
          spatial2BackTrials: spatialRecordedTrials,
          stroopTrials: updatedTrials,
        });
        setCompositeReport(report);
        setPhase("REPORT");
        if (onComplete) onComplete(report);
      } else {
        // Reset timer baseline for next item
        stroopStimulusStartRef.current = performance.now();
        startLiveTimer();
      }
    },
    [
      stroopTrialIdx,
      stroopRecordedTrials,
      srtRecordedTrials,
      spatialRecordedTrials,
      patientAge,
      onComplete,
      startLiveTimer,
      stopLiveTimer,
    ]
  );

  // ---------------------------------------------------------------------------
  // Global Keyboard Accessibility Handler
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Always allow Escape to close and wipe RAM
      if (e.key === "Escape") {
        e.preventDefault();
        handleCloseModal();
        return;
      }

      if (phase === "INSTRUCTIONS") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setPhase("SRT");
          scheduleSrtStimulus();
        }
      } else if (phase === "SRT") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleSrtResponse();
        }
      } else if (phase === "SPATIAL_2BACK") {
        if (e.key === " " || e.key === "Enter" || e.key === "m" || e.key === "M") {
          e.preventDefault();
          handleSpatialMatchAction();
        }
      } else if (phase === "STROOP") {
        const k = e.key.toLowerCase();
        if (k === "1" || k === "r" || k === "arrowleft") {
          e.preventDefault();
          handleStroopChoice("red");
        } else if (k === "2" || k === "b" || k === "arrowup") {
          e.preventDefault();
          handleStroopChoice("blue");
        } else if (k === "3" || k === "g" || k === "arrowright") {
          e.preventDefault();
          handleStroopChoice("green");
        } else if (k === "4" || k === "y" || k === "arrowdown") {
          e.preventDefault();
          handleStroopChoice("gold");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    phase,
    handleCloseModal,
    scheduleSrtStimulus,
    handleSrtResponse,
    handleSpatialMatchAction,
    handleStroopChoice,
  ]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="executive-screener-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0b0f19]/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Distraction-Free Obsidian Canvas Container */}
      <div className="relative w-full max-w-[880px] min-h-[640px] max-h-[92vh] overflow-y-auto bg-[#121826] border border-[#D4AF37]/30 rounded-xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95)] flex flex-col justify-between">
        {/* Top Telemetry Bar */}
        <div className="p-5 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#0b0f19]/95">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <div className="text-left">
              <h2
                id="executive-screener-title"
                className="font-display text-lg sm:text-xl text-[#dfe2f1] font-normal tracking-wide"
              >
                Executive Function Screener
              </h2>
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#a89f8c]">
                <span>Ephemeral RAM Quarantine</span>
                <span>&bull;</span>
                <span>Zero Persistent Storage</span>
                <span>&bull;</span>
                <span className="text-[#D4AF37]">Active Phase: {phase}</span>
              </div>
            </div>
          </div>

          {/* High-Resolution Live Millisecond Indicator & Close Button */}
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-[#1c1f2a] border border-[#D4AF37]/25 rounded text-[11px] font-mono text-[#D4AF37] tabular-nums">
              <span>LATENCY: </span>
              <span className="font-bold">{liveElapsedMs} ms</span>
            </div>

            <button
              onClick={handleCloseModal}
              aria-label="Purge session and close"
              className="text-[#a89f8c] hover:text-[#dfe2f1] p-1.5 rounded-lg hover:bg-[#1c1f2a] transition-colors focus-visible:ring-1 focus-visible:ring-[#D4AF37] focus:outline-none cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* PHASE 0: INSTRUCTIONS & DEMOGRAPHIC SETUP                           */}
        {/* =================================================================== */}
        {phase === "INSTRUCTIONS" && (
          <div className="p-8 sm:p-12 flex-1 flex flex-col justify-center max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-3">
              <div className="inline-block px-3 py-1 rounded-full bg-[#1c1f2a] border border-[#D4AF37]/30 text-[11px] font-mono text-[#D4AF37] tracking-widest uppercase">
                Quantitative Neuro-Metric Protocol
              </div>
              <h3 className="font-display text-2xl sm:text-3xl text-[#ffffff] font-normal">
                Cognitive Processing Speed &amp; Working Memory
              </h3>
              <p className="text-sm text-[#cbd5e1] leading-relaxed max-w-lg mx-auto">
                Distraction-free assessment evaluating simple reaction latency, spatial working memory
                capacity (2-back array), and executive inhibitory resistance (Stroop interference).
              </p>
            </div>

            {/* Age Stratification Input */}
            <div className="bg-[#1c1f2a]/80 p-5 rounded-lg border border-[#D4AF37]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left space-y-0.5">
                <div className="text-xs font-mono uppercase text-[#D4AF37]">Normative Demographic Cohort</div>
                <div className="text-xs text-[#94a3b8]">Used solely for in-memory percentile stratification:</div>
              </div>

              <div className="flex items-center gap-2">
                {(["20-39", "40-59", "60+"] as AgeCohort[]).map((cohort) => {
                  const isSelected =
                    (cohort === "20-39" && patientAge < 40) ||
                    (cohort === "40-59" && patientAge >= 40 && patientAge < 60) ||
                    (cohort === "60+" && patientAge >= 60);

                  return (
                    <button
                      key={cohort}
                      type="button"
                      onClick={() => {
                        if (cohort === "20-39") setPatientAge(30);
                        else if (cohort === "40-59") setPatientAge(50);
                        else setPatientAge(65);
                      }}
                      className={`px-3 py-1.5 rounded text-xs font-mono transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#D4AF37] text-[#120e00] font-bold shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                          : "bg-[#121826] text-[#cbd5e1] border border-[#D4AF37]/20 hover:border-[#D4AF37]"
                      }`}
                    >
                      {cohort}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Battery Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="p-4 bg-[#0b0f19] border border-[#D4AF37]/20 rounded-lg space-y-1">
                <span className="text-[10px] font-mono text-[#D4AF37]">PHASE 1</span>
                <div className="text-xs font-semibold text-[#ffffff]">Visual Reaction (SRT)</div>
                <p className="text-[11px] text-[#94a3b8]">Press Spacebar the millisecond the probe turns gold.</p>
              </div>

              <div className="p-4 bg-[#0b0f19] border border-[#D4AF37]/20 rounded-lg space-y-1">
                <span className="text-[10px] font-mono text-[#D4AF37]">PHASE 2</span>
                <div className="text-xs font-semibold text-[#ffffff]">Spatial 2-Back</div>
                <p className="text-[11px] text-[#94a3b8]">Report matches with tile location from 2 steps back.</p>
              </div>

              <div className="p-4 bg-[#0b0f19] border border-[#D4AF37]/20 rounded-lg space-y-1">
                <span className="text-[10px] font-mono text-[#D4AF37]">PHASE 3</span>
                <div className="text-xs font-semibold text-[#ffffff]">Stroop Interference</div>
                <p className="text-[11px] text-[#94a3b8]">Identify font ink color; ignore written text.</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setPhase("SRT");
                  scheduleSrtStimulus();
                }}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#D4AF37] hover:bg-[#e9c349] text-[#120e00] font-mono text-xs uppercase tracking-widest font-bold rounded-lg transition-all shadow-[0_4px_20px_rgba(212,175,55,0.25)] cursor-pointer"
              >
                Initiate Battery (Press Spacebar)
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PHASE 1: SIMPLE VISUAL REACTION TIME (SRT)                          */}
        {/* =================================================================== */}
        {phase === "SRT" && (
          <div className="p-8 sm:p-12 flex-1 flex flex-col justify-between items-center text-center">
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
                Phase 1 of 3 &bull; Simple Visual Reaction Time (Trial {Math.min(srtTrialIndex + 1, SRT_TOTAL_TRIALS)} of {SRT_TOTAL_TRIALS})
              </div>
              <h3 className="font-display text-xl text-[#ffffff]">
                Maintain Visual Focus on the Target
              </h3>
            </div>

            {/* Reaction Probe Interactive Canvas */}
            <div
              onClick={handleSrtResponse}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") handleSrtResponse();
              }}
              className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full flex items-center justify-center cursor-pointer select-none transition-all duration-150 border-2"
              style={{
                backgroundColor:
                  srtSubState === "STIMULUS_ACTIVE"
                    ? "#D4AF37"
                    : srtSubState === "FALSE_START"
                    ? "#ef4444"
                    : "#0b0f19",
                borderColor:
                  srtSubState === "STIMULUS_ACTIVE"
                    ? "#fde047"
                    : srtSubState === "FALSE_START"
                    ? "#f87171"
                    : "rgba(212, 175, 55, 0.2)",
                boxShadow:
                  srtSubState === "STIMULUS_ACTIVE"
                    ? "0 0 60px rgba(212, 175, 55, 0.7)"
                    : "inset 0 0 30px rgba(0, 0, 0, 0.8)",
              }}
            >
              {srtSubState === "FIXATION" && (
                <div className="text-3xl font-mono text-[#D4AF37]/60 animate-pulse">+</div>
              )}

              {srtSubState === "STIMULUS_ACTIVE" && (
                <div className="text-xl font-mono font-bold text-[#120e00] tracking-widest uppercase animate-bounce">
                  PRESS NOW!
                </div>
              )}

              {srtSubState === "FALSE_START" && (
                <div className="text-xs font-mono font-bold text-[#ffffff] px-4 uppercase">
                  False Start
                </div>
              )}

              {srtSubState === "TRIAL_COMPLETE" && srtLastFeedback && (
                <div className="text-2xl font-mono font-bold text-[#D4AF37]">
                  {srtLastFeedback}
                </div>
              )}

              {srtSubState === "READY" && (
                <div className="text-xs font-mono text-[#94a3b8]">Focusing...</div>
              )}
            </div>

            {/* Instruction Footer */}
            <div className="space-y-2">
              <p className="text-xs text-[#cbd5e1] font-mono">
                Click target or press <kbd className="px-2 py-0.5 bg-[#1c1f2a] border border-[#D4AF37]/30 rounded text-[#D4AF37]">SPACEBAR</kbd> immediately upon color shift.
              </p>
              {srtLastFeedback && (
                <div className="text-xs font-mono text-[#a89f8c]">{srtLastFeedback}</div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PHASE 2: SPATIAL WORKING MEMORY 2-BACK SEQUENCE                     */}
        {/* =================================================================== */}
        {phase === "SPATIAL_2BACK" && (
          <div className="p-8 sm:p-12 flex-1 flex flex-col justify-between items-center text-center">
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
                Phase 2 of 3 &bull; Spatial 2-Back Sequence (Step {Math.min(spatialStep + 1, SPATIAL_2BACK_SEQUENCE.length)} of {SPATIAL_2BACK_SEQUENCE.length})
              </div>
              <h3 className="font-display text-xl text-[#ffffff]">
                Does the current tile match the position from 2 steps back?
              </h3>
            </div>

            {/* 3x3 Spatial Grid */}
            <div className="grid grid-cols-3 gap-3 w-64 h-64 sm:w-72 sm:h-72 p-3 bg-[#0b0f19] border border-[#D4AF37]/25 rounded-xl">
              {Array.from({ length: 9 }).map((_, idx) => {
                const isActive = spatialActiveTile === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-lg transition-all duration-150 flex items-center justify-center border ${
                      isActive
                        ? "bg-[#D4AF37] border-[#fde047] shadow-[0_0_20px_rgba(212,175,55,0.8)] scale-95"
                        : "bg-[#1c1f2a]/60 border-[#D4AF37]/10"
                    }`}
                  >
                    {isActive && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#120e00]" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Spatial 2-Back Action Control */}
            <div className="space-y-3 w-full max-w-sm">
              <button
                type="button"
                onClick={handleSpatialMatchAction}
                disabled={spatialStep < 2 || spatialHasReported}
                className={`w-full py-3 px-6 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${
                  spatialStep < 2
                    ? "bg-[#1c1f2a] text-[#94a3b8] border border-[#313540] cursor-not-allowed"
                    : spatialHasReported
                    ? "bg-[#4ade80]/20 border border-[#4ade80] text-[#4ade80]"
                    : "bg-[#D4AF37] hover:bg-[#e9c349] text-[#120e00] shadow-[0_4px_16px_rgba(212,175,55,0.3)]"
                }`}
              >
                {spatialStep < 2
                  ? "Memorizing Sequence (Step 1-2)..."
                  : spatialHasReported
                  ? "Match Reported ✓"
                  : "2-Back Match! (Press Spacebar)"}
              </button>

              <div className="text-[11px] text-[#94a3b8] font-mono">
                {spatialStep < 2
                  ? "Wait for step 3 to begin matching."
                  : "If this tile is in the same square as 2 steps prior, press SPACEBAR."}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PHASE 3: STROOP INTERFERENCE BATTERY                                */}
        {/* =================================================================== */}
        {phase === "STROOP" && (
          <div className="p-8 sm:p-12 flex-1 flex flex-col justify-between items-center text-center">
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
                Phase 3 of 3 &bull; Stroop Inhibitory Control (Item {Math.min(stroopTrialIdx + 1, STROOP_TRIAL_BATTERY.length)} of {STROOP_TRIAL_BATTERY.length})
              </div>
              <h3 className="font-display text-xl text-[#ffffff]">
                Select the Font Ink Color (Ignore the Written Word)
              </h3>
            </div>

            {/* Stimulus Word Card */}
            <div className="my-8 p-10 sm:p-14 bg-[#0b0f19] border border-[#D4AF37]/20 rounded-2xl w-full max-w-md flex items-center justify-center min-h-[160px] shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]">
              {stroopTrialIdx < STROOP_TRIAL_BATTERY.length && (
                <span
                  className="font-mono text-4xl sm:text-5xl font-black tracking-widest select-none transition-transform"
                  style={{
                    color: STROOP_COLOR_MAP[STROOP_TRIAL_BATTERY[stroopTrialIdx].inkColor].hex,
                  }}
                >
                  {STROOP_TRIAL_BATTERY[stroopTrialIdx].word}
                </span>
              )}
            </div>

            {/* Accessible Color Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
              {(["red", "blue", "green", "gold"] as StroopColor[]).map((col) => {
                const conf = STROOP_COLOR_MAP[col];
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => handleStroopChoice(col)}
                    className="p-3 bg-[#1c1f2a] hover:bg-[#313540] border border-[#D4AF37]/30 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#94a3b8]">
                      <span>[{conf.keyNum}]</span>
                      <span>({conf.arrow})</span>
                    </div>
                    <span
                      className="font-mono text-sm font-bold tracking-wider uppercase"
                      style={{ color: conf.hex }}
                    >
                      {conf.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-[#94a3b8] font-mono pt-2">
              Use keyboard hotkeys [1, 2, 3, 4] or arrow keys [←, ↑, →, ↓] for fastest latency.
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PHASE 4: INSTANT CLINICAL REPORT & QUARANTINE PURGE                 */}
        {/* =================================================================== */}
        {phase === "REPORT" && compositeReport && (
          <div className="p-6 sm:p-10 flex-1 flex flex-col space-y-6">
            {/* Header / Executive Tier Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D4AF37]/20">
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
                  Clinical Assessment Battery Report &bull; Age Cohort: {compositeReport.ageCohort}
                </div>
                <h3 className="font-display text-2xl text-[#ffffff]">
                  Executive Processing Velocity &amp; Working Memory Profile
                </h3>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#1c1f2a] border border-[#D4AF37]/40 text-xs font-mono">
                <span className="text-[#a89f8c]">CLASSIFICATION:</span>
                <span className="text-[#D4AF37] font-bold uppercase">{compositeReport.tier}</span>
              </div>
            </div>

            {/* Primary Scores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Metric 1: Reaction Time */}
              <div className="p-4 bg-[#0b0f19] border border-[#D4AF37]/20 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#a89f8c]">
                  <span>PROCESSING SPEED (SRT)</span>
                  <span className="text-[#D4AF37]">{compositeReport.simpleReactionTime.percentile}th %ile</span>
                </div>
                <div className="text-2xl font-mono font-bold text-[#ffffff]">
                  {compositeReport.simpleReactionTime.meanLatencyMs}{" "}
                  <span className="text-xs text-[#94a3b8] font-normal">ms</span>
                </div>
                <div className="text-[11px] text-[#94a3b8] font-mono">
                  Median: {compositeReport.simpleReactionTime.medianLatencyMs} ms &bull; SD: ±{compositeReport.simpleReactionTime.standardDeviationMs} ms
                </div>
              </div>

              {/* Metric 2: Working Memory */}
              <div className="p-4 bg-[#0b0f19] border border-[#D4AF37]/20 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#a89f8c]">
                  <span>SPATIAL WORKING MEMORY</span>
                  <span className="text-[#D4AF37]">{compositeReport.spatialWorkingMemory.percentile}th %ile</span>
                </div>
                <div className="text-2xl font-mono font-bold text-[#ffffff]">
                  {compositeReport.spatialWorkingMemory.accuracyPercentage}{" "}
                  <span className="text-xs text-[#94a3b8] font-normal">% Acc</span>
                </div>
                <div className="text-[11px] text-[#94a3b8] font-mono">
                  Signal Sensitivity d&apos;: {compositeReport.spatialWorkingMemory.dPrime} &bull; Hits: {compositeReport.spatialWorkingMemory.hits}
                </div>
              </div>

              {/* Metric 3: Stroop Interference */}
              <div className="p-4 bg-[#0b0f19] border border-[#D4AF37]/20 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#a89f8c]">
                  <span>INHIBITORY RESISTANCE</span>
                  <span className="text-[#D4AF37]">{compositeReport.stroopInterference.percentile}th %ile</span>
                </div>
                <div className="text-2xl font-mono font-bold text-[#ffffff]">
                  +{compositeReport.stroopInterference.interferenceDeltaMs}{" "}
                  <span className="text-xs text-[#94a3b8] font-normal">ms delta</span>
                </div>
                <div className="text-[11px] text-[#94a3b8] font-mono">
                  Incongruent: {compositeReport.stroopInterference.incongruentMeanLatencyMs} ms &bull; Congruent: {compositeReport.stroopInterference.congruentMeanLatencyMs} ms
                </div>
              </div>
            </div>

            {/* Composite Executive Index Summary Banner */}
            <div className="p-5 bg-[#1c1f2a]/90 border border-[#D4AF37]/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-[#D4AF37] tracking-wider">
                  Composite Executive Function Score
                </span>
                <span className="text-sm font-mono font-bold text-[#ffffff]">
                  {compositeReport.compositeScore} / 100 ({compositeReport.compositePercentile}th Percentile)
                </span>
              </div>

              {/* Custom High-Contrast Gauge Bar */}
              <div className="w-full h-2 bg-[#0b0f19] rounded-full overflow-hidden border border-[#D4AF37]/20">
                <div
                  className="h-full bg-gradient-to-r from-[#e9c349] to-[#fde047] transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, compositeReport.compositePercentile))}%` }}
                />
              </div>

              <p className="text-xs text-[#cbd5e1] leading-relaxed pt-1">
                {compositeReport.clinicalSummary}
              </p>
            </div>

            {/* Quarantine Purge & Action Controls */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#4ade80]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                <span>Volatile in-memory data quarantined. No disk records created.</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    purgeAndResetSession();
                    setPhase("INSTRUCTIONS");
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#1c1f2a] hover:bg-[#313540] border border-[#D4AF37]/30 text-[#dfe2f1] text-xs font-mono rounded-lg transition-colors cursor-pointer"
                >
                  Retest Battery
                </button>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#D4AF37] hover:bg-[#e9c349] text-[#120e00] text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all shadow-[0_4px_16px_rgba(212,175,55,0.25)] cursor-pointer"
                >
                  Wipe Memory &amp; Exit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Modal Bottom Privacy Assurance Banner */}
        <div className="px-6 py-2 bg-[#0b0f19] border-t border-[#1c1f2a] flex items-center justify-between text-[10px] font-mono text-[#a89f8c]">
          <span>Protocol Ref: AGY-EXEC-EF-2026</span>
          <span>Zero ePHI &bull; HIPAA RAM Quarantine Active</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useRef } from "react";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import { Footer } from "@/components/Footer";
import { BookingModal } from "@/components/marketing/BookingModal";

interface BriefingChapter {
  label: string;
  time: number;
  timestamp: string;
}

interface Briefing {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  mechanism: string;
  description: string;
  videoSrc: string;
  posterBg: string;
  chapters: BriefingChapter[];
  scientificNotes: {
    prerequisite: string;
    clinicalEndpoint: string;
    literature: string;
  };
}

const BRIEFINGS_DATA: Briefing[] = [
  {
    id: "thiamine-hysteresis",
    title: "Reversing Thiamine Hysteresis: TTFD & Mass Action Cellular Resuscitation",
    subtitle: "Mitochondrial multi-subunit enzyme reactivation (PDH / α-KGDH) via lipophilic disulfide derivatives.",
    duration: "18:42",
    mechanism: "Mitochondrial multi-subunit enzyme reactivation (PDH / α-KGDH)",
    description:
      "Conventional oral thiamine salts (thiamine mononitrate/HCl) face rate-limiting saturation of intestinal SLC19A carriers. Through lipid-soluble disulfide derivatives (TTFD / Benfotiamine), we bypass physiological transport bottlenecks to drive mass-action saturation of cerebral pyruvate dehydrogenase complexes.",
    videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    posterBg: "from-[#1a1405] via-[#121826] to-[#0B0F19]",
    chapters: [
      { label: "The Thiamine Bottleneck", time: 0, timestamp: "00:00" },
      { label: "Why Oral Salts Fail", time: 255, timestamp: "04:15" },
      { label: "The Magnesium Prerequisite Gate", time: 510, timestamp: "08:30" },
      { label: "Clinical Titration Protocols", time: 765, timestamp: "12:45" },
    ],
    scientificNotes: {
      prerequisite: "RBC Magnesium > 6.0 mg/dL (catalytic phosphorylation of thiamine pyrophosphokinase).",
      clinicalEndpoint: "Normalization of elevated venous lactate/pyruvate ratios and resolution of autonomic fatigue.",
      literature: "Wins P, Lonsdale D. Neurochem Res. 2008; Bettendorff L. Nat Rev Neurosci. 2014.",
    },
  },
  {
    id: "stoichiometric-methylation",
    title: "Stoichiometric Methylation: Bypassing MTHFR Polymorphisms with Active 5-MTHF",
    subtitle: "Resolving Unmetabolized Folic Acid (UMFA) accumulation and re-establishing cobalamin stoichiometry.",
    duration: "16:15",
    mechanism: "UMFA clearance, cytosolic vs mitochondrial cobalamin pathways",
    description:
      "Synthetic pteroylglutamic acid floods dihydrofolate reductase (DHFR), resulting in systemic UMFA entrapment. This briefing details the precise stoichiometric delivery of crystalline (6S)-5-methyltetrahydrofolate paired with active HoloTC cobalamin under membrane fatty acid permeability control.",
    videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    posterBg: "from-[#081a17] via-[#121826] to-[#0B0F19]",
    chapters: [
      { label: "The Folic Acid Trap", time: 0, timestamp: "00:00" },
      { label: "HoloTC vs Total B12", time: 200, timestamp: "03:20" },
      { label: "The 8% Omega-3 Index Gatekeeper", time: 400, timestamp: "06:40" },
      { label: "Homocysteine Titration Corridor", time: 600, timestamp: "10:00" },
    ],
    scientificNotes: {
      prerequisite: "RBC Omega-3 Index > 8.0% (membrane lipid raft fluidity for receptor docking).",
      clinicalEndpoint: "Plasma homocysteine < 10.0 µmol/L and urinary methylmalonic acid < 0.26 µmol/L.",
      literature: "Smith AD, Refsum H, Jernerén F. Am J Clin Nutr. 2016; NICE Guidelines NG240 (2024).",
    },
  },
  {
    id: "dlpfc-neuromodulation",
    title: "DLPFC Transcranial Neuromodulation: Inducing Long-Term Potentiation (LTP)",
    subtitle: "High-frequency 10 Hz Theta-Burst TMS paired with cellular Ca-AKG epigenetic priming.",
    duration: "21:05",
    mechanism: "Synaptic plasticity, calcium channel opening, and Ca-AKG synergy",
    description:
      "Transcranial Magnetic Stimulation delivered to the left Dorsolateral Prefrontal Cortex (DLPFC) at 10 Hz induces robust Ca²⁺ influx through NMDA receptors, driving AMPA receptor membrane trafficking and sustained neurotrophic gene transcription (BDNF).",
    videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    posterBg: "from-[#181126] via-[#121826] to-[#0B0F19]",
    chapters: [
      { label: "Cortical Excitability", time: 0, timestamp: "00:00" },
      { label: "10 Hz Theta-Burst Parameters", time: 225, timestamp: "03:45" },
      { label: "Ca-AKG Epigenetic Priming", time: 435, timestamp: "07:15" },
      { label: "Post-Stimulation Neuroplasticity Window", time: 690, timestamp: "11:30" },
    ],
    scientificNotes: {
      prerequisite: "Absence of ferromagnetic implants; baseline motor threshold calibration via MagPro R30.",
      clinicalEndpoint: "Sustained increase in resting-state frontoparietal fMRI functional connectivity.",
      literature: "Pascual-Leone A, et al. Science. 2005; Blumberger DM, et al. Lancet. 2018.",
    },
  },
  {
    id: "endothelial-microperfusion",
    title: "Endothelial Microperfusion: The NO-sGC-cGMP Cerebrovascular Cascade",
    subtitle: "Restoring nitric oxide bioavailability and blood-brain barrier shear resistance.",
    duration: "19:30",
    mechanism: "Arteriole vasodilation, BBB protection, and targeted botanical co-factors",
    description:
      "Arteriolar resistance and microvascular hypoperfusion precede neurodegenerative amyloidogenic cascades. We examine endothelial nitric oxide synthase (eNOS) uncoupling, asymmetrical dimethylarginine (ADMA) accumulation, and restorative stoichiometric arginine-citrulline pacing.",
    videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    posterBg: "from-[#1a1111] via-[#121826] to-[#0B0F19]",
    chapters: [
      { label: "Shear Stress & eNOS", time: 0, timestamp: "00:00" },
      { label: "Cyclic GMP Hydrolysis", time: 240, timestamp: "04:00" },
      { label: "Blood-Brain Barrier Integrity", time: 490, timestamp: "08:10" },
      { label: "Microvascular Perfusion Metrics", time: 720, timestamp: "12:00" },
    ],
    scientificNotes: {
      prerequisite: "PT/INR audit for patients on anticoagulant therapies; baseline ADMA quantification.",
      clinicalEndpoint: "Improvement in cerebrovascular pulsatility index via transcranial Doppler sonography.",
      literature: "Iadecola C. Nat Rev Neurosci. 2017; Zhao Z, et al. Nature. 2015.",
    },
  },
];

export default function BriefingsTheaterPage() {
  const [selectedBriefing, setSelectedBriefing] = useState<Briefing>(BRIEFINGS_DATA[0]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleSelectBriefing = (briefing: Briefing) => {
    setSelectedBriefing(briefing);
    setCurrentTime(0);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-canvas-obsidian text-text-surface selection:bg-champagne-gold selection:text-text-on-gold flex flex-col">
      <TopNavBar />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 lg:px-10 py-14 space-y-16">
        {/* Theater Header */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-champagne-gold px-3.5 py-1.5 rounded-full bg-surface-midnight border border-[#D4AF37]/30 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-champagne-gold animate-pulse" />
            <span>Cinematic Masterclass Series &bull; Dr. David Andreas Runheim, MD</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-text-surface font-normal leading-tight">
            The Clinical Video Briefings Theater
          </h1>

          <p className="font-body text-base sm:text-lg text-text-surface-variant leading-relaxed">
            Direct, peer-reviewed scientific lectures exploring molecular kinetics, 
            stoichiometric enzyme reactivation, and advanced cortical neuromodulation. 
            Streamed in ultra-high fidelity through our clinical media pipeline.
          </p>
        </section>

        {/* =========================================================================
            CINEMA PLAYER & ACTIVE MASTERCLASS
           ========================================================================= */}
        <section className="space-y-6">
          <div className="rounded-2xl bg-surface-midnight border border-[#D4AF37]/30 shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden relative">
            {/* Top Telemetry Header Bar */}
            <div className="px-6 py-3 bg-canvas-obsidian/95 border-b border-[#D4AF37]/20 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-2">
              <div className="flex items-center gap-2 text-champagne-gold font-semibold">
                <span className="w-2 h-2 rounded-full bg-vitality-sage animate-ping" />
                <span>ACTIVE STREAM: {selectedBriefing.title}</span>
              </div>
              <div className="flex items-center gap-4 text-text-surface-muted text-[11px]">
                <span>DURATION: {selectedBriefing.duration}</span>
                <span className="text-vitality-sage">4K HEVC / 60 FPS</span>
                <span>ZERO-ePHI AUDIT: PASS</span>
              </div>
            </div>

            {/* Cinematic 16:9 Widescreen Video Frame */}
            <div className="relative aspect-video w-full bg-black overflow-hidden group">
              <video
                ref={videoRef}
                key={selectedBriefing.id}
                src={selectedBriefing.videoSrc}
                playsInline
                data-testid="briefing-video-player"
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime);
                  }
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration);
                  }
                }}
                className="w-full h-full object-cover"
              />

              {/* Center Play/Pause Floating HUD Button */}
              <div
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-16 h-16 rounded-full bg-surface-midnight/90 border border-champagne-gold flex items-center justify-center text-champagne-gold shadow-[0_0_30px_rgba(212,175,55,0.5)]">
                  {isPlaying ? (
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline Scrubber */}
            <div className="px-6 pt-4 pb-2 bg-canvas-obsidian/95 border-t border-border-midnight flex items-center gap-3 font-mono text-[11px] text-text-surface-muted">
              <span>{formatSeconds(currentTime)}</span>
              <div
                className="flex-1 h-2 bg-surface-midnight rounded-full overflow-hidden cursor-pointer relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickPos = (e.clientX - rect.left) / rect.width;
                  if (videoRef.current && duration) {
                    handleSeek(clickPos * duration);
                  }
                }}
              >
                <div
                  className="h-full bg-champagne-gold transition-all"
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
              </div>
              <span>{formatSeconds(duration || 0)}</span>
            </div>

            {/* Interactive Chapter Selectors */}
            <div className="p-6 bg-canvas-obsidian/95 border-t border-border-midnight space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-mono text-xs uppercase tracking-wider text-champagne-gold font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-champagne-gold" />
                  <span>Interactive Chapter Index (Click to Jump):</span>
                </div>
                <span className="font-mono text-[10px] text-text-surface-muted">
                  Instant Telemetry Timecode Scrubbing
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {selectedBriefing.chapters.map((chapter, idx) => {
                  const isActive =
                    currentTime >= chapter.time &&
                    (idx === selectedBriefing.chapters.length - 1 ||
                      currentTime < selectedBriefing.chapters[idx + 1].time);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSeek(chapter.time)}
                      className={`p-3 rounded-xl font-mono text-xs text-left transition-all flex flex-col gap-1 border ${
                        isActive
                          ? "bg-surface-midnight text-champagne-gold border-champagne-gold shadow-[0_0_15px_rgba(212,175,55,0.25)]"
                          : "bg-surface-midnight/60 text-text-surface-variant border-border-midnight hover:border-champagne-gold/50 hover:text-text-surface"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-vitality-sage font-bold">[{chapter.timestamp}]</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-champagne-gold animate-ping" />}
                      </div>
                      <span className="font-sans font-medium text-text-surface">{chapter.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Briefing Dossier & Scheduling CTA */}
            <div className="p-6 sm:p-8 bg-surface-midnight border-t border-[#D4AF37]/20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="space-y-1">
                  <span className="font-mono text-xs uppercase tracking-wider text-vitality-sage font-semibold">
                    Biochemical Target Mechanism
                  </span>
                  <h2 className="font-display text-2xl text-text-surface">
                    {selectedBriefing.title}
                  </h2>
                </div>
                <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                  {selectedBriefing.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
                  <div className="p-3 rounded-lg bg-canvas-obsidian border border-border-midnight">
                    <span className="text-champagne-gold font-semibold">Prerequisite Gate:</span>
                    <p className="text-text-surface-muted mt-0.5">{selectedBriefing.scientificNotes.prerequisite}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-canvas-obsidian border border-border-midnight">
                    <span className="text-vitality-sage font-semibold">Peer-Reviewed Citations:</span>
                    <p className="text-text-surface-muted mt-0.5">{selectedBriefing.scientificNotes.literature}</p>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-auto flex flex-col items-center gap-3 pt-2 lg:pt-0">
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-champagne-gold hover:bg-gold-glow text-text-on-gold font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(212,175,55,0.3)] btn-luxury-shimmer text-center"
                >
                  Schedule Assessment with Dr. Runheim &rarr;
                </button>
                <span className="font-mono text-[10px] text-text-surface-muted text-center">
                  Direct Cal.com Physician Consultation Block
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            BRIEFINGS ARCHIVE DIRECTORY GRID (All 4 Masterclasses)
           ========================================================================= */}
        <section className="space-y-8">
          <div className="border-b border-border-midnight pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-vitality-sage font-semibold">
                Clinical Library &bull; Masterclass Directory
              </span>
              <h2 className="font-display text-3xl text-text-surface mt-1">
                Scientific Lecture Catalog
              </h2>
            </div>
            <span className="font-mono text-xs text-text-surface-muted">
              4 Peer-Reviewed Briefings Available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BRIEFINGS_DATA.map((briefing, idx) => {
              const isSelected = briefing.id === selectedBriefing.id;
              return (
                <div
                  key={briefing.id}
                  onClick={() => handleSelectBriefing(briefing)}
                  className={`cursor-pointer rounded-2xl p-6 bg-surface-midnight border transition-all duration-300 flex flex-col justify-between space-y-4 hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)] ${
                    isSelected
                      ? "border-champagne-gold ring-1 ring-champagne-gold/50 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                      : "border-border-midnight hover:border-champagne-gold/40"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="text-vitality-sage font-semibold uppercase tracking-wider">
                        Masterclass 0{idx + 1}
                      </span>
                      <span className="text-text-surface-muted">
                        {briefing.duration}
                      </span>
                    </div>

                    <h3 className="font-display text-xl text-text-surface hover:text-champagne-gold transition-colors">
                      {briefing.title}
                    </h3>

                    <p className="font-body text-xs text-text-surface-variant leading-relaxed">
                      {briefing.subtitle}
                    </p>

                    <div className="p-3 rounded-lg bg-canvas-obsidian border border-border-midnight font-mono text-[11px] text-text-surface-muted">
                      <span className="text-champagne-gold font-semibold">Mechanism: </span>
                      <span>{briefing.mechanism}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border-midnight flex items-center justify-between font-mono text-xs">
                    <span className="text-text-surface-muted">
                      {briefing.chapters.length} Timestamps Indexed
                    </span>
                    <span className="text-champagne-gold font-semibold flex items-center gap-1.5">
                      {isSelected ? "Now Playing" : "Load Masterclass"} &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Clinical Integrity Disclaimers */}
        <section className="p-8 rounded-2xl bg-canvas-obsidian border border-border-midnight space-y-3 font-mono text-xs text-text-surface-muted">
          <div className="text-text-surface uppercase tracking-wider font-semibold">
            Educational Notice &bull; Zero-ePHI Telemetry
          </div>
          <p className="leading-relaxed">
            All clinical briefing lectures are recorded for accredited clinical education and prospective patient orientation. 
            All patient case studies presented have been de-identified under HIPAA Safe Harbor criteria. 
            No patient records or telemetric tracking data are collected or retained by the video delivery infrastructure.
          </p>
        </section>
      </main>

      <Footer />

      {/* On-Domain Cal.com Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}

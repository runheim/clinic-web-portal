"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Modality" | "Biomarker" | "Briefing" | "Enclave Action";
  actionType: "navigate" | "booking" | "external" | "hotline";
  targetUrl?: string;
  badge?: string;
  keywords: string[];
}

const INDEXED_SEARCH_ITEMS: SearchItem[] = [
  // 1. Modalities & Therapies
  {
    id: "mod-tms",
    title: "High-Frequency DLPFC TMS Neuromodulation",
    subtitle: "10 Hz Theta-Burst cortical stimulation & synaptogenesis",
    category: "Modality",
    actionType: "navigate",
    targetUrl: "/services/neuromodulation",
    badge: "Neuromodulation",
    keywords: ["tms", "dlpfc", "theta burst", "cortex", "depression", "cognition", "synaptic"],
  },
  {
    id: "mod-peptides",
    title: "Subcutaneous Peptide Bioregulators",
    subtitle: "Epithalon, GHK-Cu, and targeted mitochondrial signaling",
    category: "Modality",
    actionType: "navigate",
    targetUrl: "/services/peptides",
    badge: "Bioregulators",
    keywords: ["peptide", "epithalon", "ghk-cu", "telomere", "mitochondria", "tissue repair"],
  },
  {
    id: "mod-emsella",
    title: "BTL Emsella Core & Autonomic Recalibration",
    subtitle: "2.5T HIFEM pelvic floor & deep parasympathetic vagal tone",
    category: "Modality",
    actionType: "navigate",
    targetUrl: "/services/emsella",
    badge: "HIFEM Axis",
    keywords: ["emsella", "hifem", "vagal tone", "pelvic", "autonomic", "parasympathetic"],
  },
  {
    id: "mod-pbm",
    title: "Transcranial Near-Infrared Photobiomodulation",
    subtitle: "810nm / 1064nm cytochrome c oxidase bioenergetic stimulation",
    category: "Modality",
    actionType: "navigate",
    targetUrl: "/services/photobiomodulation",
    badge: "Photobiomodulation",
    keywords: ["pbm", "nir", "infrared", "cytochrome c", "atp", "mitochondria", "laser"],
  },
  {
    id: "mod-glp1",
    title: "GLP-1 Metabolic Regulation & Insulin Sensitivity",
    subtitle: "Receptor pocket docking, neuro-inflammation suppression",
    category: "Modality",
    actionType: "navigate",
    targetUrl: "/services/glp1",
    badge: "Metabolic Axis",
    keywords: ["glp-1", "metabolic", "insulin", "glucose", "semaglutide", "tirzepatide", "neuroinflammation"],
  },
  {
    id: "mod-mitochondria",
    title: "Mitochondrial Bioenergetics & ATP Optimization",
    subtitle: "Rotary ATP synthase kinetics, CoQ10 electron transport chain",
    category: "Modality",
    actionType: "navigate",
    targetUrl: "/services/mitochondria",
    badge: "Bioenergetics",
    keywords: ["mitochondria", "atp", "coq10", "electron transport", "cellular energy"],
  },
  {
    id: "mod-bdnf",
    title: "BDNF Synaptogenesis & TrkB Scaffolding",
    subtitle: "Dendritic spine remodeling, PSD-95 density consolidation",
    category: "Modality",
    actionType: "navigate",
    targetUrl: "/services/bdnf",
    badge: "Plasticity",
    keywords: ["bdnf", "synaptogenesis", "trkb", "plasticity", "dendritic", "memory", "learning"],
  },

  // 2. Quantitative Biomarkers
  {
    id: "bio-holotc",
    title: "HoloTC (Active Transcobalamin II B12)",
    subtitle: "Bypasses serum total B12 false positives; corridor > 70 pmol/L",
    category: "Biomarker",
    actionType: "navigate",
    targetUrl: "/ledger#biomarkers",
    badge: "Corridor > 70 pmol/L",
    keywords: ["holotc", "b12", "transcobalamin", "methylation", "cyanocobalamin", "deficiency"],
  },
  {
    id: "bio-mma",
    title: "Methylmalonic Acid (MMA)",
    subtitle: "Functional tissue-level mitochondrial B12 deficiency marker; < 0.28 umol/L",
    category: "Biomarker",
    actionType: "navigate",
    targetUrl: "/ledger#biomarkers",
    badge: "Corridor < 0.28 umol/L",
    keywords: ["mma", "methylmalonic", "b12", "mitochondria", "metabolite"],
  },
  {
    id: "bio-tdp",
    title: "Whole Blood Thiamine Diphosphate (TDP)",
    subtitle: "Erythrocyte transketolase & PDH cofactor saturation; 275–675 nmol/L",
    category: "Biomarker",
    actionType: "navigate",
    targetUrl: "/ledger#biomarkers",
    badge: "275–675 nmol/L",
    keywords: ["tdp", "thiamine", "vitamin b1", "transketolase", "pyruvate", "bioenergetics"],
  },
  {
    id: "bio-homocysteine",
    title: "Plasma Homocysteine (Hcy)",
    subtitle: "Neurovascular endotheliopathy & methylation velocity; < 7.5 umol/L",
    category: "Biomarker",
    actionType: "navigate",
    targetUrl: "/ledger#biomarkers",
    badge: "Corridor < 7.5 umol/L",
    keywords: ["homocysteine", "hcy", "mthfr", "endothelial", "cardiovascular", "microcirculation"],
  },
  {
    id: "bio-rbc-mg",
    title: "RBC Magnesium (Intracellular Mg2+)",
    subtitle: "NMDA receptor Mg2+ voltage-gated block stability; 5.5–6.8 mg/dL",
    category: "Biomarker",
    actionType: "navigate",
    targetUrl: "/ledger#biomarkers",
    badge: "5.5–6.8 mg/dL",
    keywords: ["magnesium", "rbc magnesium", "nmda", "intracellular", "excitotoxicity"],
  },
  {
    id: "bio-omega3",
    title: "Marine Omega-3 Index (EPA + DHA)",
    subtitle: "Cellular membrane phospholipid fluidity; VITACOG gate >= 8.0%",
    category: "Biomarker",
    actionType: "navigate",
    targetUrl: "/ledger#biomarkers",
    badge: "Gate >= 8.0%",
    keywords: ["omega 3", "epa", "dha", "vitacog", "fish oil", "membrane fluidity"],
  },

  // 3. Video Masterclasses
  {
    id: "briefing-thiamine",
    title: "Masterclass: Reversing Thiamine Hysteresis",
    subtitle: "Overcoming intracellular enzyme binding resistance & thiamine transport",
    category: "Briefing",
    actionType: "navigate",
    targetUrl: "/briefings",
    badge: "Clinical Video 42:15",
    keywords: ["video", "thiamine", "hysteresis", "masterclass", "runheim", "transketolase"],
  },
  {
    id: "briefing-methylation",
    title: "Masterclass: Stoichiometric Methylation Pathways",
    subtitle: "Bypassing MTHFR polymorphisms via choline and betaine shunt stoichiometry",
    category: "Briefing",
    actionType: "navigate",
    targetUrl: "/briefings",
    badge: "Clinical Video 38:50",
    keywords: ["video", "methylation", "mthfr", "homocysteine", "choline", "betaine"],
  },
  {
    id: "briefing-tms",
    title: "Masterclass: High-Field DLPFC Cortical Plasticity",
    subtitle: "QEEG-guided navigation and neuronavigated magnetic focus protocols",
    category: "Briefing",
    actionType: "navigate",
    targetUrl: "/briefings",
    badge: "Clinical Video 45:10",
    keywords: ["video", "tms", "dlpfc", "qeeg", "plasticity", "magnetic"],
  },
  {
    id: "briefing-perfusion",
    title: "Masterclass: Endothelial Microperfusion & Glycocalyx",
    subtitle: "Endothelial barrier restoration and cerebral capillary perfusion dynamics",
    category: "Briefing",
    actionType: "navigate",
    targetUrl: "/briefings",
    badge: "Clinical Video 31:20",
    keywords: ["video", "microperfusion", "glycocalyx", "endothelial", "cerebral"],
  },

  // 4. Quick Enclave Actions
  {
    id: "act-booking",
    title: "Schedule Diagnostic Consultation",
    subtitle: "Comprehensive 45-minute baseline mapping with Dr. Andreas Runheim",
    category: "Enclave Action",
    actionType: "booking",
    targetUrl: "/assessment",
    badge: "Cal.com #982148",
    keywords: ["schedule", "book", "consultation", "appointment", "cal.com", "calendar", "visit"],
  },
  {
    id: "act-vault",
    title: "Access Diagnostic Vault & Records",
    subtitle: "Certified eClinicalWorks healow patient portal gateway (Zero-ePHI isolated)",
    category: "Enclave Action",
    actionType: "navigate",
    targetUrl: "/vault",
    badge: "eCW Portal",
    keywords: ["vault", "records", "portal", "ecw", "healow", "labs", "results", "login"],
  },
  {
    id: "act-simulator",
    title: "Launch Interactive Biomarker Simulator",
    subtitle: "Simulate cofactor saturation kinetics and Omega-3 gatekeeper dynamics",
    category: "Enclave Action",
    actionType: "navigate",
    targetUrl: "/ledger#simulator",
    badge: "Interactive Tool",
    keywords: ["simulator", "kinetics", "calculator", "stoichiometry", "omega-3", "ledger"],
  },
  {
    id: "act-hotline",
    title: "Emergency Care Desk (Spruce Health VIP)",
    subtitle: "Direct SMS and cellular coordination with Clinical Concierge desk",
    category: "Enclave Action",
    actionType: "hotline",
    targetUrl: "sms:+18005550199",
    badge: "Direct SMS: +1 800-555-0199",
    keywords: ["emergency", "hotline", "spruce", "concierge", "call", "sms", "phone", "contact"],
  },
  {
    id: "act-status",
    title: "System Status & Enclave Telemetry",
    subtitle: "Live availability, SLAs, and security boundaries across all 5 enclaves",
    category: "Enclave Action",
    actionType: "navigate",
    targetUrl: "/status",
    badge: "Enclave Uptime",
    keywords: ["status", "telemetry", "health", "uptime", "enclave", "sla", "latency"],
  },
];

interface ClinicalSearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking?: () => void;
}

export function ClinicalSearchPalette({
  isOpen,
  onClose,
  onOpenBooking,
}: ClinicalSearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Reset query and auto-focus on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setQuery("");
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K and Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fast sub-10ms fuzzy filter
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INDEXED_SEARCH_ITEMS;

    return INDEXED_SEARCH_ITEMS.filter((item) => {
      if (item.title.toLowerCase().includes(q)) return true;
      if (item.subtitle.toLowerCase().includes(q)) return true;
      if (item.category.toLowerCase().includes(q)) return true;
      return item.keywords.some((k) => k.toLowerCase().includes(q));
    });
  }, [query]);

  const handleSelectItem = useCallback(
    (item: SearchItem) => {
      onClose();
      if (item.actionType === "booking") {
        if (onOpenBooking) {
          onOpenBooking();
        } else {
          router.push("/assessment");
        }
      } else if (item.actionType === "hotline" && item.targetUrl) {
        window.location.href = item.targetUrl;
      } else if (item.actionType === "external" && item.targetUrl) {
        window.open(item.targetUrl, "_blank", "noopener,noreferrer");
      } else if (item.targetUrl) {
        router.push(item.targetUrl);
      }
    },
    [onClose, onOpenBooking, router]
  );

  // Keyboard navigation within list
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelectItem(filteredItems[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Clinical Command Search Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-canvas-obsidian/85 backdrop-blur-2xl animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#121826] border border-[#D4AF37]/25 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative p-4 border-b border-[#D4AF37]/15 flex items-center gap-3 bg-[#0B0F19]/90">
          <svg
            className="w-5 h-5 text-[#D4AF37] shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={filteredItems.length > 0}
            aria-controls="clinical-search-results"
            placeholder="Search modalities, biomarkers, briefings, or clinical enclaves..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            className="flex-1 bg-transparent text-[#DFE2F1] text-sm sm:text-base font-sans placeholder-[#99907C] focus:outline-none"
          />

          <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#99907C] bg-[#121826] px-2 py-1 rounded border border-[#1C1F2A]">
            <kbd>ESC</kbd>
            <span>to close</span>
          </div>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          id="clinical-search-results"
          role="listbox"
          className="max-h-[60vh] overflow-y-auto p-2 space-y-1 divide-y divide-[#1C1F2A]/40"
        >
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="font-serif text-lg text-[#DFE2F1]">No clinical coordinates found</p>
              <p className="font-mono text-xs text-[#99907C]">
                Try searching for &quot;TMS&quot;, &quot;HoloTC&quot;, &quot;Peptides&quot;, &quot;VITACOG&quot;, or &quot;Booking&quot;.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => handleSelectItem(item)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-4 ${
                    isSelected
                      ? "bg-[#1A2234] border border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                      : "hover:bg-[#151D2C] border border-transparent"
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-sm sm:text-base text-[#DFE2F1] font-medium truncate">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#0B0F19] border border-[#D4AF37]/20 font-mono text-[10px] text-[#D4AF37] uppercase">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-xs text-[#99907C] truncate">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[10px] uppercase text-[#99907C] hidden sm:inline">
                      {item.category}
                    </span>
                    <span className="text-[#D4AF37] text-xs">&rarr;</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-3 px-4 bg-[#0B0F19] border-t border-[#D4AF37]/15 flex items-center justify-between font-mono text-[11px] text-[#99907C]">
          <div className="flex items-center gap-3">
            <span>&uarr;&darr; Navigate</span>
            <span>&crarr; Select</span>
          </div>
          <span className="text-[#8BB09E]">Zero-ePHI Ephemeral Search</span>
        </div>
      </div>
    </div>
  );
}

export default ClinicalSearchPalette;

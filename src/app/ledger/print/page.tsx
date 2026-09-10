import type { Metadata } from "next";
import { PrintableSummary } from "@/components/dossier/PrintableSummary";

export const metadata: Metadata = {
  title: "Clinical Consultation Summary | Zero-ePHI Clinical Dossier",
  description:
    "Single-page print-optimized clinical consultation briefing sheet detailing simulated biomarker trajectories, quantitative stoichiometric corridors, and recommended diagnostic panels. HIPAA Safe Harbor §164.514(b) Zero-ePHI compliant.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Clinical Consultation Summary — Cognitive Edge Clinic",
    description:
      "Exportable, print-ready physiological trajectory briefing sheet and diagnostic requisition protocols.",
    type: "website",
  },
};

export default function LedgerPrintPage() {
  return (
    <main
      id="main-content"
      role="main"
      aria-label="Zero-ePHI Clinical Consultation Dossier"
      className="min-h-screen bg-canvas-obsidian text-text-surface print:bg-white print:text-black py-4 sm:py-8 print:py-0 print:px-0"
    >
      {/* Accessible skip link for keyboard navigation */}
      <a
        href="#dossier-article"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-champagne-gold text-text-on-gold font-mono text-xs font-bold uppercase rounded shadow-lg"
      >
        Skip to Printable Briefing Sheet
      </a>

      <div id="dossier-article" tabIndex={-1} className="focus:outline-none">
        <PrintableSummary />
      </div>
    </main>
  );
}

import React from "react";
import { renderToString } from "react-dom/server";
import { StoichiometrySimulator } from "@/components/StoichiometrySimulator";
import { DossierExport } from "@/components/DossierExport";

describe("Phase 9: Biomarker Simulator & Editorial Clinical Dossier Unit Suite", () => {
  describe("StoichiometrySimulator", () => {
    test("Test Case 1: Renders with baseline stoichiometric parameters without crashing", () => {
      const html = renderToString(React.createElement(StoichiometrySimulator));

      expect(html).toContain("Enzyme Hysteresis");
      expect(html).toContain("Membrane Gate Simulator");
      expect(html).toContain("Cerebral Pyruvate Dehydrogenase (PDH) Saturation Curve");
      expect(html).toContain("Oral Thiamine HCl");
      expect(html).toContain("Lipophilic TTFD");
      expect(html).toContain("Marine Omega-3 Index");

      // Default baseline is TTFD with 8.5% Omega-3 Index -> Stoichiometric Saturation Active
      expect(html).toContain("Stoichiometric Saturation Active");
    });

    test("Test Case 2: Contains reactive SVG canvas elements for saturation kinetics", () => {
      const html = renderToString(React.createElement(StoichiometrySimulator));

      expect(html).toContain("<svg");
      expect(html).toContain("line");
      expect(html).toContain("path");
      expect(html).toContain("circle");
      expect(html).toContain("SATURATION");
    });
  });

  describe("DossierExport", () => {
    test("Test Case 3: Mounts and renders 3-page luxury printable clinical dossier without SSR errors", () => {
      const html = renderToString(React.createElement(DossierExport));

      // Trigger button
      expect(html).toContain("Download Clinical Protocol Dossier (PDF / Print)");

      // Page 1: Masthead & Leadership
      expect(html).toContain("COGNITIVE WELLNESS CLINIC");
      expect(html).toContain("EXECUTIVE PROTOCOL DOSSIER");
      expect(html).toContain("Dr. David Andreas Runheim, MD");
      expect(html).toContain("ZERO-ePHI QUARANTINE VERIFIED");

      // Page 2: Stoichiometric Biomarker Target Matrix
      expect(html).toContain("Stoichiometric Biomarker Targets");
      expect(html).toContain("Active HoloTC B12");
      expect(html).toContain("Methylmalonic Acid (MMA)");
      expect(html).toContain("Whole Blood TDP (Thiamine)");
      expect(html).toContain("Plasma Homocysteine");
      expect(html).toContain("RBC Magnesium");
      expect(html).toContain("RBC Omega-3 Index");

      // Page 3: 7 Clinical Modalities & Safety Governance Ledger
      expect(html).toContain("Treatment Modalities &amp; Contraindication Gates");
      expect(html).toContain("10 Hz DLPFC rTMS");
      expect(html).toContain("Subcutaneous Peptides");
      expect(html).toContain("BTL Emsella Pelvic Core");
      expect(html).toContain("Cerebral Photobiomodulation");
      expect(html).toContain("GLP-1 Metabolic Optimization");
      expect(html).toContain("Mitochondrial Bioenergetics");
      expect(html).toContain("BDNF Synaptic Preservation");

      // Immutable Safety Contraindications
      expect(html).toContain("NAD+ Oncology Lock");
      expect(html).toContain("Vitamin B6 Neuropathy Ceiling");
      expect(html).toContain("Ferromagnetic Screening");
    });

    test("Test Case 4: Enforces print-only CSS isolation rules", () => {
      const html = renderToString(React.createElement(DossierExport));

      expect(html).toContain("dossier-print-container");
      expect(html).toContain("@media print");
      expect(html).toContain("page-break");
    });
  });
});

import React from "react";
import { renderToString } from "react-dom/server";
import Home from "@/app/page";
import { HeroSection } from "@/components/marketing/HeroSection";

describe("Subagents 2 & 3 Verification Suite: Hero & Modalities Overhaul", () => {
  describe("Subagent 2: Hero Section & Landing Page De-Duplication", () => {
    let heroHtml: string;
    let homeHtml: string;

    beforeAll(() => {
      heroHtml = renderToString(React.createElement(HeroSection));
      homeHtml = renderToString(React.createElement(Home));
    });

    test("Hero section displays updated Eyebrow Badge", () => {
      expect(heroHtml).toContain("ADVANCED NEURO-CELLULAR &amp; METABOLIC LONGEVITY");
    });

    test("Hero section renders updated H1 Headline", () => {
      expect(heroHtml).toContain("Peak Cognitive Performance. Systemic Cellular Vitality.");
    });

    test("Hero section renders updated Supporting Body Copy", () => {
      expect(heroHtml).toContain(
        "Integrating clinical neuromodulation, cellular peptide therapy, and precision metabolic medicine. We engineer personalized protocols to sharpen cognitive performance, restore physical vitality, and protect your neurological future across every decade of life."
      );
    });

    test("Hero section renders twin CTAs targeting /services and /consultation", () => {
      expect(heroHtml).toContain('href="/services"');
      expect(heroHtml).toContain("Explore Clinical Protocols");

      expect(heroHtml).toContain('href="/consultation"');
      expect(heroHtml).toMatch(/schedule a free consultation/i);
    });

    test("Homepage strictly excludes the deprecated #intake section and form", () => {
      expect(homeHtml).not.toContain('id="intake"');
      expect(homeHtml).not.toContain("Apply for Diagnostic Consultation");
      expect(homeHtml).not.toContain("ENTER CLINICAL COMMUNICATION EMAIL");
    });
  });

  describe("Subagent 3: Clinical Modalities & Scientific Protocols Overhaul", () => {
    let homeHtml: string;

    beforeAll(() => {
      homeHtml = renderToString(React.createElement(Home));
    });

    test("renders updated Section Subheadline", () => {
      expect(homeHtml).toContain(
        "Physician-engineered protocols targeting root-cause cellular vitality, neural circuit plasticity, and systemic longevity across every stage of life."
      );
    });

    test("renders all 9 specialized clinical modality cards", () => {
      for (let i = 0; i < 9; i++) {
        expect(homeHtml).toContain(`data-testid="pillar-card-${i}"`);
        expect(homeHtml).toContain(`data-testid="pillar-details-${i}"`);
      }

      expect(homeHtml).toContain("Deep Transcranial Magnetic Stimulation (TMS)");
      expect(homeHtml).toContain("Dementia Prevention &amp; Expanded Cognitive Trajectory");
      expect(homeHtml).toContain("Cellular Regeneration &amp; Anti-Aging Peptides");
      expect(homeHtml).toContain("Sexual Wellness &amp; Advanced Hormone Optimization");
      expect(homeHtml).toContain("Pelvic Floor, Truncal Core &amp; Vagal Remodeling (BTL Emsella)");
      expect(homeHtml).toContain("Multi-Action GLP-1 Metabolic Medicine");
      expect(homeHtml).toContain("Red Light Therapy &amp; Cerebral Photobiomodulation");
      expect(homeHtml).toContain("Bespoke Micronutrient &amp; Neuro-Mitochondrial Infusions");
      expect(homeHtml).toContain("Intracellular NAD+, BDNF &amp; Coenzyme Amplification");
    });
  });
});

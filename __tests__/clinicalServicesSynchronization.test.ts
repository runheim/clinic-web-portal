import React from "react";
import { renderToString } from "react-dom/server";
import { CLINICAL_SERVICES } from "@/data/clinicalServices";
import ServicesPage from "@/app/services/page";
import Home from "@/app/page";
import { TherapeuticProtocols } from "@/components/home/TherapeuticProtocols";
import { TopNavBar } from "@/components/navigation/TopNavBar";

describe("Clinical Modalities Synchronization & /services Redesign Suite", () => {
  describe("Subagent 1: Centralized Clinical Data Store (CLINICAL_SERVICES)", () => {
    test("exports exactly 9 clinical modalities with strictly typed properties", () => {
      expect(CLINICAL_SERVICES).toHaveLength(9);

      const expectedIds = [
        "tms",
        "dementia-prevention",
        "peptides",
        "hormone-optimization",
        "emsella",
        "glp1",
        "photobiomodulation",
        "infusions",
        "nad-bdnf",
      ];

      CLINICAL_SERVICES.forEach((svc, index) => {
        expect(svc.id).toBe(expectedIds[index]);
        expect(svc.number).toBe(`0${index + 1}`);
        expect(svc.badge).toBeTruthy();
        expect(svc.title).toBeTruthy();
        expect(svc.shortSummary.length).toBeGreaterThan(20);
        expect(svc.expandedOverview.length).toBeGreaterThan(50);
        expect(svc.clinicalMechanisms.length).toBeGreaterThanOrEqual(3);
        expect(svc.targetIndications.length).toBeGreaterThanOrEqual(4);
      });
    });

    test("contains accurate clinical taxonomy badges", () => {
      const badges = CLINICAL_SERVICES.map((s) => s.badge);
      expect(badges).toEqual([
        "NEUROMODULATION",
        "NEURO-LONGEVITY",
        "PEPTIDE BIOREGULATORS",
        "ENDOCRINE & BHRT",
        "HIFEM & VAGAL TONE",
        "METABOLIC MEDICINE",
        "MITOCHONDRIAL OPTICS",
        "TARGETED INFUSIONS",
        "COENZYME SATURATION",
      ]);
    });
  });

  describe("Subagent 2: Dedicated Services Page Redesign (/services)", () => {
    let servicesHtml: string;

    beforeAll(() => {
      servicesHtml = renderToString(React.createElement(ServicesPage));
    });

    test("renders redesigned Hero section with required eyebrow, headline, and subheader", () => {
      expect(servicesHtml).toContain("ADVANCED CLINICAL MODALITIES");
      expect(servicesHtml).toContain(
        "Engineered Protocols for Cognitive Longevity &amp; Cellular Vitality"
      );
      expect(servicesHtml).toContain(
        "A unified clinical spectrum bridging targeted neuromodulation, advanced cellular biochemistry, and whole-body metabolic restoration."
      );
    });

    test("renders all 9 modality sections with anchor IDs and structured sub-sections", () => {
      CLINICAL_SERVICES.forEach((svc) => {
        expect(servicesHtml).toContain(`id="${svc.id}"`);
        expect(servicesHtml).toContain(svc.title.replace(/&/g, "&amp;"));
        expect(servicesHtml).toContain(svc.badge.replace(/&/g, "&amp;"));
        expect(servicesHtml).toContain(svc.number);
      });

      expect(servicesHtml).toContain("Physiological &amp; Molecular Mechanisms");
      expect(servicesHtml).toContain("Target Indications &amp; Optimization Goals");
    });

    test("renders bottom consultation CTA banner linking to /consultation", () => {
      expect(servicesHtml).toContain("Begin Your Clinical Longevity Evaluation");
      expect(servicesHtml).toContain(
        "Schedule a consultation with our clinical coordinator to construct your personalized neuro-cellular protocol."
      );
      expect(servicesHtml).toContain('href="/consultation"');
      expect(servicesHtml).toContain("Schedule a Free Consultation");
    });
  });

  describe("Subagent 3: Landing Page Grid Synchronization & Entity Bug Fix", () => {
    let homeHtml: string;
    let protocolsHtml: string;

    beforeAll(() => {
      homeHtml = renderToString(React.createElement(Home));
      protocolsHtml = renderToString(React.createElement(TherapeuticProtocols));
    });

    test("TherapeuticProtocols maps all 9 modalities to /services anchors", () => {
      CLINICAL_SERVICES.forEach((svc, index) => {
        expect(protocolsHtml).toContain(`data-testid="pillar-card-${index}"`);
        expect(protocolsHtml).toContain(`data-testid="pillar-details-${index}"`);
        expect(protocolsHtml).toContain(`href="/services#${svc.id}"`);
        expect(protocolsHtml).toContain(svc.title.replace(/&/g, "&amp;"));
      });
    });

    test("eliminates unescaped &RARR; or &rarr; literal string bug on cards", () => {
      // Must contain semantic "Explore Clinical Protocol" and arrow "→"
      expect(protocolsHtml).toContain("Explore Clinical Protocol");
      expect(protocolsHtml).toContain("→");

      // Must NOT contain literal unescaped entity strings on cards
      expect(protocolsHtml).not.toContain("&amp;RARR;");
      expect(protocolsHtml).not.toContain("&amp;rarr;");
      expect(homeHtml).not.toContain("&amp;RARR;");
      expect(homeHtml).not.toContain("&amp;rarr;");
    });

    test("renders responsive grid classes: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", () => {
      expect(protocolsHtml).toContain(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      );
    });
  });

  describe("Subagent 4: Header & Navigation Verification", () => {
    let navHtml: string;

    beforeAll(() => {
      navHtml = renderToString(React.createElement(TopNavBar));
    });

    test("Top banner contains clean link routing to /services", () => {
      expect(navHtml).toContain('href="/services"');
      expect(navHtml).toContain("Services");
    });

    test("Consolidated Member Portal link is present and routes to /vault", () => {
      expect(navHtml).toContain('href="/vault"');
      expect(navHtml).toContain("Member Portal");
    });

    test("Deprecated Assessment button remains strictly absent", () => {
      expect(navHtml).not.toContain('href="/assessment"');
      expect(navHtml).not.toContain("Assessment →");
      expect(navHtml).not.toContain("Initiate Assessment →");
    });
  });
});

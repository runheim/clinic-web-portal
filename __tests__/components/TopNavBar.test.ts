import React from "react";
import { renderToString } from "react-dom/server";
import { TopNavBar } from "@/components/navigation/TopNavBar";

describe("TopNavBar Component — Streamlined Navigation & Spacing Suite", () => {
  let renderedHtml: string;

  beforeAll(() => {
    renderedHtml = renderToString(React.createElement(TopNavBar));
  });

  describe("Brand Identity Zone", () => {
    test("renders the Cognitive Edge Clinic brand identity", () => {
      expect(renderedHtml).toContain("Cognitive Edge");
      expect(renderedHtml).toContain("Clinic");
      expect(renderedHtml).toContain('href="/"');
    });
  });

  describe("Primary Desktop Navigation Zone", () => {
    test("renders all 5 core primary navigation links with valid routes", () => {
      expect(renderedHtml).toContain('href="/services"');
      expect(renderedHtml).toContain("Services");

      expect(renderedHtml).toContain('href="/ledger"');
      expect(renderedHtml).toContain("Ledger");

      expect(renderedHtml).toContain('href="/briefings"');
      expect(renderedHtml).toContain("Briefings");

      expect(renderedHtml).toContain('href="/membership"');
      expect(renderedHtml).toContain("Membership");

      expect(renderedHtml).toContain('href="/biographies"');
      expect(renderedHtml).toContain("Biographies");
    });

    test("strictly excludes the deprecated 'Diagnostic Vault' navigation link", () => {
      expect(renderedHtml).not.toContain("Diagnostic Vault");
      expect(renderedHtml).not.toContain("https://mycwXX.eclinicalworks.com/portal");
    });
  });

  describe("Right Actions & Portal Access Zone", () => {
    test("renders consolidated Member Portal link and strictly excludes separate Member Login and Assessment pill", () => {
      expect(renderedHtml).toContain('href="/vault"');
      expect(renderedHtml).toContain("Member Portal");

      expect(renderedHtml).not.toContain('href="/login"');
      expect(renderedHtml).not.toContain("Member Login");

      expect(renderedHtml).not.toContain('href="/assessment"');
      expect(renderedHtml).not.toContain("Assessment");
    });

    test("strictly excludes the Command-K Search trigger and keyboard shortcut", () => {
      expect(renderedHtml).not.toContain("Search ⌘K");
      expect(renderedHtml).not.toContain("⌘K");
      expect(renderedHtml).not.toContain('aria-label="Search clinical modalities, biomarkers, briefings, and actions (Cmd+K)"');
      expect(renderedHtml).not.toContain("Clinical Command Search Palette");
    });
  });

  describe("Mobile Drawer Navigation & Responsiveness", () => {
    test("renders mobile menu container and controls with accessible ARIA tags", () => {
      expect(renderedHtml).toContain('id="mobile-menu"');
      expect(renderedHtml).toContain('aria-controls="mobile-menu"');
      expect(renderedHtml).toContain("Member Portal");
      expect(renderedHtml).not.toContain("Initiate Assessment →");
    });

    test("mobile drawer strictly excludes Diagnostic Vault and search triggers", () => {
      // Diagnostic Vault link must not exist in mobile drawer either
      expect(renderedHtml).not.toContain("Diagnostic Vault");
      expect(renderedHtml).not.toContain("Quick search clinical modalities");
    });
  });
});

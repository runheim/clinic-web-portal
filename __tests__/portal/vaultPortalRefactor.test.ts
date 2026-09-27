import React from "react";
import { renderToString } from "react-dom/server";
import VaultPage, { inPortalServices, VaultInner } from "@/app/vault/page";
import ConsultationPage from "@/app/consultation/page";

describe("Subagent 4 & 5 Verification Suite: Consultation & Vault Portal Refactor", () => {
  describe("Subagent 4: Consultation Route & Channel Directives", () => {
    let consultationHtml: string;

    beforeAll(() => {
      consultationHtml = renderToString(React.createElement(ConsultationPage));
    });

    test("renders header 'Schedule a Free Consultation' and subheader", () => {
      expect(consultationHtml).toContain("Schedule a Free Consultation");
      expect(consultationHtml).toContain(
        "Connect directly with our clinical coordinator to begin your neuro-cellular and longevity evaluation."
      );
    });

    test("renders Option A: Spruce SMS with correct phone number and prefilled body", () => {
      expect(consultationHtml).toContain("sms:+17433330880?&amp;body=Schedule%20free%20consultation%20with%20our%20clinic%20coordinator");
      expect(consultationHtml).toContain("Text Clinic Coordinator via Spruce");
    });

    test("renders Option B: Direct intake email with coordinator subject line", () => {
      expect(consultationHtml).toContain("mailto:andreas.runheim@gmail.com?subject=Free%20Consultation%20Inquiry%20-%20Cognitive%20Edge%20Clinic");
      expect(consultationHtml).toContain("Email Cognitive Edge Clinic");
    });

    test("renders embedded membership navigation banner linking to /membership", () => {
      expect(consultationHtml).toContain(
        "Evaluating ongoing clinical care? Explore our membership tiers and concierge programs."
      );
      expect(consultationHtml).toContain('href="/membership"');
      expect(consultationHtml).toContain("View Membership Options");
    });
  });

  describe("Subagent 5: Client Portal Architecture & Hybrid Billing Engine", () => {
    test("inPortalServices array exports all 10 specialized modalities with complete coverage context", () => {
      expect(inPortalServices).toHaveLength(10);

      const serviceNames = inPortalServices.map((s) => s.name);
      expect(serviceNames).toContain(
        "Deep TMS (Neuroplasticity, Mood, Executive Performance & Insomnia)"
      );
      expect(serviceNames).toContain(
        "Expanded Dementia & MCI Therapies (including Alzheimer's anti-amyloid navigation)"
      );
      expect(serviceNames).toContain(
        "Testosterone Pellet Implantation & Endocrine BHRT"
      );
      expect(serviceNames).toContain(
        "Clinical Intravenous (IV) Infusion & Micronutrient Therapy"
      );
      expect(serviceNames).toContain(
        "BTL Emsella Pelvic Floor & Autonomic Vagal Restoration"
      );
      expect(serviceNames).toContain(
        "Regenerative & Anti-Aging Peptides (Epitalon, BPC-157, GHK-Cu)"
      );
      expect(serviceNames).toContain(
        "Dual & Tri-Agonist GLP-1 Weight Management"
      );
      expect(serviceNames).toContain(
        "Red Light Therapy & Transcranial Photobiomodulation"
      );
      expect(serviceNames).toContain(
        "Bespoke Vitamin, Peripheral Nerve & Mitochondrial Formulations"
      );
      expect(serviceNames).toContain(
        "Mitochondrial, NAD+ & BDNF Amplification Protocols"
      );
    });

    test("renders Vault Page fallback wrapper cleanly in SSR without exceptions", () => {
      const vaultHtml = renderToString(React.createElement(VaultPage));
      expect(vaultHtml).toBeDefined();
    });

    test("unauthenticated portal presents only Email and Password fields without WebAuthn or public registration", () => {
      const unauthHtml = renderToString(
        React.createElement(VaultInner, { initialAuthenticated: false })
      );
      expect(unauthHtml).toContain('type="email"');
      expect(unauthHtml).toContain('type="password"');
      expect(unauthHtml).toContain("Sign In to Portal");
      expect(unauthHtml).toContain("Spruce SMS (+1 743-333-0880)");
      // Confirm absence of WebAuthn or registration links
      expect(unauthHtml).not.toContain("Biometric");
      expect(unauthHtml).not.toContain("Passkey");
      expect(unauthHtml).not.toContain("Create Account");
      expect(unauthHtml).not.toContain("Register");
    });

    test("authenticated portal hierarchy: Communication Hub and Concierge Engine appear before Clinical Services & Protocols", () => {
      const authHtml = renderToString(
        React.createElement(VaultInner, {
          initialAuthenticated: true,
          initialEmail: "admin@cognitiveedgeclinic.com",
        })
      );

      const commHubIndex = authHtml.indexOf("Communication Hub");
      const conciergeEngineIndex = authHtml.indexOf("Concierge Engine");
      const clinicalServicesIndex = authHtml.indexOf("Clinical Services &amp; Protocols");
      const billingTransparencyIndex = authHtml.indexOf("Billing &amp; Coverage Transparency");

      expect(commHubIndex).toBeGreaterThan(-1);
      expect(conciergeEngineIndex).toBeGreaterThan(-1);
      expect(clinicalServicesIndex).toBeGreaterThan(-1);
      expect(billingTransparencyIndex).toBeGreaterThan(-1);

      // Verify Communication Hub and Concierge Engine appear first in DOM hierarchy
      expect(commHubIndex).toBeLessThan(clinicalServicesIndex);
      expect(conciergeEngineIndex).toBeLessThan(clinicalServicesIndex);
      expect(billingTransparencyIndex).toBeGreaterThan(conciergeEngineIndex);
    });
  });
});

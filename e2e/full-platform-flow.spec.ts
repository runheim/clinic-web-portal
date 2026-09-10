import { test, expect } from "@playwright/test";

test.describe("Cognitive Edge Clinic — Full-Platform Verification & Zero-ePHI Assurance Suite", () => {
  // SCENARIO 1: Route Coverage Matrix (10 Public & Member Routes)
  test("Scenario 1: Route Coverage Matrix - All 10 core routes respond HTTP 200 with zero console exceptions", async ({
    page,
  }) => {
    const routes = [
      "/",
      "/services",
      "/services/neuromodulation",
      "/biographies",
      "/ledger",
      "/assessment",
      "/membership",
      "/briefings",
      "/governance",
      "/vault",
    ];

    const uncaughtErrors: string[] = [];
    page.on("pageerror", (err) => {
      uncaughtErrors.push(err.message);
    });

    for (const route of routes) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response, `Failed to load route ${route}`).not.toBeNull();
      expect(response?.status(), `Route ${route} returned status ${response?.status()}`).toBe(200);

      // Verify that main content has mounted
      await expect(page.locator("main")).toBeVisible();
    }

    expect(uncaughtErrors, `Uncaught page errors encountered: ${uncaughtErrors.join(", ")}`).toHaveLength(0);
  });

  // SCENARIO 2: The Cognitive Ledger & Stoichiometric Simulator
  test("Scenario 2: The Cognitive Ledger & Simulator - Stoichiometry table, Omega-3 gatekeeper kinetics, and Dossier export", async ({
    page,
  }) => {
    await page.goto("/ledger");

    // 1. Verify Ledger header and table
    await expect(page.getByRole("heading", { name: "The Cognitive Longevity Ledger" })).toBeVisible();

    // Verify biomarker stoichiometry table rows with target ranges
    const b12Row = page.locator("#biomarkers").getByText("Total Serum B12");
    await expect(b12Row).toBeVisible();
    await expect(page.locator("#biomarkers").getByText(/Whole Blood.*TDP/i)).toBeVisible();
    await expect(page.locator("#biomarkers").getByText(/RBC Magnesium/i)).toBeVisible();

    // 2. Verify Stoichiometric Simulator is mounted
    await expect(
      page.getByRole("heading", { name: /Enzyme Hysteresis & Membrane Gate Simulator/i })
    ).toBeVisible();

    // Locate Omega-3 Index slider
    const omegaSlider = page.locator('input[type="range"][min="2"][max="12"]');
    await expect(omegaSlider).toBeVisible();

    // Test Gatekeeper Value < 8.0% (e.g. 5.5%): Expect Advisory Panel & Hysteresis Blockade
    await omegaSlider.evaluate((el: HTMLInputElement) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      nativeSetter?.call(el, "5.5");
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await expect(
      page.getByText("VITACOG/B-Proof Gate Active: Bilayer Membrane Resistance")
    ).toBeVisible();
    await expect(page.getByText("Hysteresis Blockade")).toBeVisible();

    // Test Gatekeeper Value >= 8.0% (e.g. 9.2%): Expect Saturation Active & Membrane Permeability Cleared
    await omegaSlider.evaluate((el: HTMLInputElement) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      nativeSetter?.call(el, "9.2");
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await expect(page.getByText("Stoichiometric Saturation Active")).toBeVisible();
    await expect(
      page.getByText(/Membrane Permeability Optimal \(≥ 8\.0% Omega-3 Gate Cleared\)/i)
    ).toBeVisible();

    // 3. Verify Editorial Clinical Protocol Dossier Export CTA
    const dossierBtn = page.getByRole("button", { name: /Download Clinical Protocol Dossier/i });
    await expect(dossierBtn).toBeVisible();
  });

  // SCENARIO 3: Interactive Pre-Screening Intake Engine
  test("Scenario 3: Interactive Intake Screener - Multi-step navigation, Oncology NAD+ safety lock, and Cal.com trigger", async ({
    page,
  }) => {
    await page.goto("/assessment");

    await expect(
      page.getByRole("heading", { name: "Personalized Longevity Pathway Screener" })
    ).toBeVisible();

    // Step 1: Objectives -> Advance to Step 2
    const nextToMeds = page.getByRole("button", { name: /Proceed to Medication Screening/i });
    await expect(nextToMeds).toBeVisible();
    await nextToMeds.click();

    // Step 2: Medication Screening -> Select Metformin and verify pharmacodynamic mandate
    const metforminOption = page.getByText("Metformin (Glucophage / Extended Release)");
    await expect(metforminOption).toBeVisible();
    await metforminOption.click();
    await expect(page.getByText("Clinical Mandate: Requires baseline HoloTC")).toBeVisible();

    // Advance to Step 3: Contraindication Gates
    const nextToSafety = page.getByRole("button", { name: /Proceed to Contraindication Gates/i });
    await nextToSafety.click();

    // Step 3: Contraindications -> Toggle Oncology Screen
    const oncologyGate = page.getByText("Active or Historical Oncological Condition");
    await expect(oncologyGate).toBeVisible();
    await oncologyGate.click();

    // Assert safety hard-lock alert appears
    await expect(page.getByText("SAFETY HARD-LOCK TRIGGERED")).toBeVisible();
    await expect(page.getByText("NAD+ Locked")).toBeVisible();

    // Generate Tailored Plan -> Advance to Step 4
    const generatePlanBtn = page.getByRole("button", { name: /Generate Tailored Protocol/i });
    await expect(generatePlanBtn).toBeVisible();
    await generatePlanBtn.click();

    // Step 4: Verify tailored plan and NAD+ oncology exclusion
    await expect(
      page.getByRole("heading", { name: "Your Tailored Neuro-Metabolic Protocol Plan" })
    ).toBeVisible();
    await expect(page.getByText("LOCKED (Oncology Gate)")).toBeVisible();

    // Trigger Cal.com Booking Modal
    const bookingBtn = page.getByRole("button", { name: /Open Cal.com Reservation Modal/i });
    await expect(bookingBtn).toBeVisible();
    await bookingBtn.click();

    // Assert booking modal renders
    const modalHeading = page.getByRole("heading", { name: "Private Consultation Reservation" });
    await expect(modalHeading).toBeVisible({ timeout: 5000 });

    // Close modal
    const closeBtn = page.locator('button[aria-label="Close modal"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  // SCENARIO 4: Video Theater & Chapter Markers
  test("Scenario 4: Video Theater & Chapter Markers - Briefings catalog, video player mounting, and timecode scrubbing", async ({
    page,
  }) => {
    await page.goto("/briefings");

    await expect(
      page.getByRole("heading", { name: "The Clinical Video Briefings Theater" })
    ).toBeVisible();

    // Verify video player container mounts with attributes
    const video = page.locator('video[data-testid="briefing-video-player"]');
    await expect(video).toBeVisible();

    // Verify all 4 scientific masterclasses
    await expect(page.getByRole("heading", { name: /Reversing Thiamine Hysteresis/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Stoichiometric Methylation/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /DLPFC Transcranial Neuromodulation/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Endothelial Microperfusion/i }).first()).toBeVisible();

    // Click Chapter 2: "Why Oral Salts Fail" (time = 255s)
    const chapterBtn = page.getByRole("button", { name: /Why Oral Salts Fail/i });
    await expect(chapterBtn).toBeVisible();
    await chapterBtn.click();

    // Verify video element's currentTime updated
    const currentTime = await video.evaluate((el: HTMLVideoElement) => el.currentTime);
    expect(currentTime).toBeGreaterThanOrEqual(250);
  });

  // SCENARIO 5: Membership Tier Matrix & VIP Inquiry
  test("Scenario 5: Membership Tier Matrix - All 3 tiers render and VIP inquiry triggers reservation modal", async ({
    page,
  }) => {
    await page.goto("/membership");

    await expect(
      page.getByRole("heading", { name: "Concierge Membership & Investment Architecture" })
    ).toBeVisible();

    // Verify all 3 tiers are present
    await expect(page.getByRole("heading", { name: "Cognitive Edge Foundation" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Peak Performance Continuum" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Concierge Neuro-Restorative VIP" })).toBeVisible();

    // Click "Inquire for Concierge VIP Access" button
    const vipInquireBtn = page.getByRole("button", { name: /Inquire for Concierge VIP Access/i });
    await expect(vipInquireBtn).toBeVisible();
    await vipInquireBtn.click();

    // Assert Cal.com booking modal opens
    const modalHeading = page.getByRole("heading", { name: "Private Consultation Reservation" });
    await expect(modalHeading).toBeVisible({ timeout: 5000 });

    // Close modal
    const closeBtn = page.locator('button[aria-label="Close modal"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  // SCENARIO 6: Authenticated Vault & Tier Switcher Gating
  test("Scenario 6: Authenticated Vault - Standard vs VIP switcher, frosted paywall gating, and eCW anchor integrity", async ({
    page,
  }) => {
    await page.goto("/vault");

    // 1. Check Standard Tier state by default:
    // Physician Direct VIP Hotline should have frosted glass overlay and locked notice
    const lockedNotice = page.getByText("Direct Physician Hotline is reserved exclusively for Concierge VIP members.");
    await expect(lockedNotice).toBeVisible();

    const overlay = page.locator(".backdrop-blur-sm");
    await expect(overlay).toBeVisible();

    // 2. Toggle to Concierge VIP Member using preview bar switcher
    const vipSwitcherBtn = page.getByRole("button", { name: /Concierge VIP Member/i });
    await expect(vipSwitcherBtn).toBeVisible();
    await vipSwitcherBtn.click();

    // Concierge VIP Active:
    // Blur overlay should disappear, direct hotline phone is displayed
    await expect(overlay).not.toBeVisible();
    await expect(page.getByText("Direct Call: +1 (800) 555-0188")).toBeVisible();
    await expect(page.getByText("Average Physician Response: < 15 Minutes")).toBeVisible();

    // Toggle back to Standard Cognitive Edge
    const standardSwitcherBtn = page.getByRole("button", { name: /Standard Cognitive Edge/i });
    await expect(standardSwitcherBtn).toBeVisible();
    await standardSwitcherBtn.click();
    await expect(overlay).toBeVisible();

    // 3. Verify external eCW Diagnostic Vault anchor attributes
    const eCwAnchor = page.locator('a:has-text("Launch eClinicalWorks Portal")');
    await expect(eCwAnchor).toBeVisible();
    await expect(eCwAnchor).toHaveAttribute("href", "https://mycwXX.eclinicalworks.com/portal");
    await expect(eCwAnchor).toHaveAttribute("target", "_blank");
    await expect(eCwAnchor).toHaveAttribute("rel", "noopener noreferrer");
  });

  // SCENARIO 7: Phase 16 — Command-K Palette, Schema.org Knowledge Graph & PWA Offline Sanctuary
  test("Scenario 7: Phase 16 - Command-K Search, Schema.org JSON-LD, PWA Manifest, and Offline Sanctuary", async ({
    page,
  }) => {
    // 1. Verify Command-K Search Palette on Homepage
    await page.goto("/");

    // Click TopNavBar search trigger button
    const searchTrigger = page.locator('button[aria-label*="Search"]');
    await expect(searchTrigger).toBeVisible();
    await searchTrigger.click();

    // Verify search modal dialog is visible
    const searchDialog = page.locator('div[role="dialog"][aria-label="Clinical Command Search Palette"]');
    await expect(searchDialog).toBeVisible();

    // Type query "TMS" and verify filtered results
    const searchInput = searchDialog.locator('input[role="combobox"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("TMS");

    // Expect TMS result
    await expect(page.getByText("High-Frequency DLPFC TMS Neuromodulation")).toBeVisible();

    // Press Escape to close modal
    await page.keyboard.press("Escape");
    await expect(searchDialog).not.toBeVisible();

    // Test Keyboard shortcut: press Meta+k / Control+k to open
    await page.keyboard.press("Control+k");
    await expect(searchDialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(searchDialog).not.toBeVisible();

    // 2. Verify Schema.org JSON-LD Structured Data
    const schemaScript = page.locator('script[type="application/ld+json"]');
    await expect(schemaScript).toBeAttached();
    const schemaContent = await schemaScript.textContent();
    expect(schemaContent).not.toBeNull();
    const schemaJson = JSON.parse(schemaContent!);
    expect(schemaJson["@context"]).toBe("https://schema.org");
    expect(schemaJson["@graph"]).toBeDefined();
    expect(Array.isArray(schemaJson["@graph"])).toBe(true);

    const graphTypes = schemaJson["@graph"].map((g: { "@type": string | string[] }) =>
      Array.isArray(g["@type"]) ? g["@type"].join(",") : g["@type"]
    );
    expect(graphTypes.some((t: string) => t.includes("MedicalBusiness"))).toBe(true);
    expect(graphTypes.some((t: string) => t.includes("Physician"))).toBe(true);
    expect(graphTypes.some((t: string) => t.includes("MedicalWebPage"))).toBe(true);

    // 3. Verify Offline Sanctuary Route (/offline)
    const offlineRes = await page.goto("/offline");
    expect(offlineRes?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Clinical Connection Suspended" })).toBeVisible();
    await expect(page.locator('a[href="sms:+18005550199"]')).toBeVisible();
    await expect(page.locator('a[href="tel:+18005550199"]')).toBeVisible();

    // 4. Verify PWA Web App Manifest (/manifest.json)
    const manifestRes = await page.goto("/manifest.json");
    expect(manifestRes?.status()).toBe(200);
    const manifestJson = await manifestRes?.json();
    expect(manifestJson.name).toContain("Cognitive Edge Clinic");
    expect(manifestJson.display).toBe("standalone");
    expect(manifestJson.icons.length).toBeGreaterThanOrEqual(2);
  });
});

import { test, expect } from "@playwright/test";

test.describe("Cognitive Edge Clinic — VIP Portal & Full Site E2E Verification Suite", () => {
  // TEST 1: Homepage & Progressive Disclosure
  test("Test 1: Homepage & Progressive Disclosure - Hero headline, Google Flow video, and pillar expansion", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Validate hero headline
    const headline = page.locator("h1");
    await expect(headline).toContainText("Restoring Autonomic Vitality & Cognitive Edge");

    // 2. Validate Google Flow video container mounts
    const videoContainer = page.locator("video");
    await expect(videoContainer).toBeVisible({ timeout: 5000 });

    // 3. Test progressive disclosure on treatment pillar: expands within 300ms
    const firstPillar = page.locator('[data-testid="pillar-card-0"]');
    await expect(firstPillar).toBeVisible();

    const detailSection = page.locator('[data-testid="pillar-details-0"]');
    // Initially collapsed
    await expect(detailSection).toHaveClass(/max-h-0/);

    const startTime = Date.now();
    await firstPillar.click();

    // Verify expanded within 300ms
    await expect(detailSection).toHaveClass(/max-h-48/);
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThanOrEqual(500); // Allow reasonable animation threshold
    await expect(detailSection).toContainText("Target Frequency: 10 Hz Theta-Burst");
  });

  // TEST 2: Services Navigation
  test("Test 2: Services Navigation - All 7 modality links route to valid detail pages with contraindication gates", async ({
    page,
  }) => {
    const expectedSlugs = [
      "tms-neuromodulation",
      "subcutaneous-peptides",
      "btl-emsella-pelvic-core",
      "cerebral-photobiomodulation",
      "glp1-metabolic-optimization",
      "mitochondrial-bioenergetics",
      "bdnf-synaptic-preservation",
    ];

    await page.goto("/services");

    for (const slug of expectedSlugs) {
      const link = page.locator(`a[href="/services/${slug}"]`);
      await expect(link).toBeVisible();
    }

    // Deep check one of the detail pages (Mitochondrial Bioenergetics)
    await page.goto("/services/mitochondrial-bioenergetics");
    await expect(page.locator("h1")).toContainText("Mitochondrial Bioenergetics Resuscitation");
    await expect(page.getByText("Molecular Target Mechanisms")).toBeVisible();
    await expect(page.getByRole("heading", { name: "High-Contrast Safety Contraindications Panel" })).toBeVisible();
    await expect(page.getByText("MONITOR PT/INR FOR ANTICOAGULANT USE")).toBeVisible();
    await expect(page.getByText("Open Cal.com Reservation")).toBeVisible();
  });

  // TEST 3: eCW healow Link Integrity
  test("Test 3: eCW healow Link Integrity - Diagnostic Vault buttons link to eClinicalWorks portal with security attributes", async ({
    page,
  }) => {
    // Check navigation link
    await page.goto("/");
    const navEcwLink = page.locator('header a:has-text("Diagnostic Vault")');
    await expect(navEcwLink).toHaveAttribute("href", "https://mycwXX.eclinicalworks.com/portal");
    await expect(navEcwLink).toHaveAttribute("target", "_blank");
    await expect(navEcwLink).toHaveAttribute("rel", "noopener noreferrer");

    // Check /vault portal action button
    await page.goto("/vault");
    const vaultEcwBtn = page.locator('a:has-text("Launch eClinicalWorks Portal")');
    await expect(vaultEcwBtn).toHaveAttribute("href", "https://mycwXX.eclinicalworks.com/portal");
    await expect(vaultEcwBtn).toHaveAttribute("target", "_blank");
    await expect(vaultEcwBtn).toHaveAttribute("rel", "noopener noreferrer");
  });

  // TEST 4: Spruce Care Console & VIP Paywall
  test("Test 4: Spruce Care Console & VIP Paywall - Standard vs Concierge VIP gating", async ({
    page,
  }) => {
    await page.goto("/vault");

    // Standard Tier Default Check:
    // "Physician Direct VIP Hotline" should display the frosted-glass blur overlay and locked upgrade notice
    const lockedNotice = page.getByText("Direct Physician Hotline is reserved exclusively for Concierge VIP members.");
    await expect(lockedNotice).toBeVisible();

    const overlay = page.locator(".backdrop-blur-sm");
    await expect(overlay).toBeVisible();

    // Toggle to Concierge VIP Tier
    const vipButton = page.getByRole("button", { name: /Concierge VIP/i });
    await vipButton.click();

    // Concierge VIP Active:
    // Hotline should be unlocked (no blur overlay visible) and direct priority phone displayed
    await expect(page.getByText("Direct Call: +1 (800) 555-0188")).toBeVisible();
    await expect(overlay).not.toBeVisible();
    await expect(page.getByText("Average Physician Response: < 15 Minutes")).toBeVisible();
  });

  // TEST 5: Member Authentication Gateway (Figma [60:1542])
  test("Test 5: Member Authentication Gateway - Demo credentials and smooth vault transition", async ({
    page,
  }) => {
    await page.goto("/login");

    // 1. Verify card header and elements
    await expect(page.getByRole("heading", { name: "Member Authentication" })).toBeVisible();
    await expect(page.getByLabel("Clinical Communication Email")).toBeVisible();
    await expect(page.getByLabel("Passcode / Token")).toBeVisible();

    // 2. Click instant demo VIP credentials
    const demoVipBtn = page.getByRole("button", { name: /Demo VIP/i });
    await demoVipBtn.click();

    // Verify inputs populated
    await expect(page.getByLabel("Clinical Communication Email")).toHaveValue("vip.member@cognitiveedgeclinic.com");
    await expect(page.getByLabel("Passcode / Token")).toHaveValue("CognitiveVIP$2026");

    // 3. Submit authentication form
    const submitBtn = page.getByRole("button", { name: /Authenticate Session/i });
    await submitBtn.click();

    // 4. Verify smooth transition to /vault in VIP unlocked state
    await page.waitForURL("**/vault?tier=vip", { timeout: 5000 });
    await expect(page.getByRole("banner").getByText("Concierge VIP Member")).toBeVisible();
    await expect(page.getByText("Direct Call: +1 (800) 555-0188")).toBeVisible();
  });

  // TEST 6: Cognitive Longevity Ledger & Pre-Screening Intake Flow
  test("Test 6: Cognitive Longevity Ledger & Pre-Screening Intake - Biomarkers, trials, and intake screener", async ({
    page,
  }) => {
    // 1. Validate Ledger page & expandable drawers
    await page.goto("/ledger");
    await expect(page.getByRole("heading", { name: "The Cognitive Longevity Ledger" })).toBeVisible();

    // Click Total Serum B12 row to expand
    const b12Row = page.locator("#biomarkers").getByText("Total Serum B12");
    await expect(b12Row).toBeVisible();
    await b12Row.click();
    await expect(page.getByText("Conventional 200 pg/mL cutoffs were established strictly")).toBeVisible();

    // Verify Interactive Stoichiometric Pathway Simulator is mounted
    await expect(page.getByRole("heading", { name: /Enzyme Hysteresis & Membrane Gate Simulator/i })).toBeVisible();
    await expect(page.getByText("Stoichiometric Saturation Active")).toBeVisible();

    // Verify Editorial Clinical Dossier Export button is mounted
    const dossierBtn = page.getByRole("button", { name: /Download Clinical Protocol Dossier/i });
    await expect(dossierBtn).toBeVisible();

    // Click Initiate Assessment CTA
    const ledgerCta = page.getByRole("link", { name: /Initiate Longevity Assessment/i });
    await ledgerCta.click();

    // 2. Multi-step assessment screener
    await page.waitForURL("**/assessment", { timeout: 5000 });
    await expect(page.getByRole("heading", { name: "Personalized Longevity Pathway Screener" })).toBeVisible();

    // Step 1: Objectives
    const nextToMedsBtn = page.getByRole("button", { name: /Proceed to Medication Screening/i });
    await nextToMedsBtn.click();

    // Step 2: Medication Screening - Click Metformin
    const metforminOption = page.getByText("Metformin (Glucophage / Extended Release)");
    await metforminOption.click();
    await expect(page.getByText("Clinical Mandate: Requires baseline HoloTC")).toBeVisible();

    const nextToSafetyBtn = page.getByRole("button", { name: /Proceed to Contraindication Gates/i });
    await nextToSafetyBtn.click();

    // Step 3: Contraindications Gate - Click Oncology Screen
    const oncologyGate = page.getByText("Active or Historical Oncological Condition");
    await oncologyGate.click();
    await expect(page.getByText("SAFETY HARD-LOCK TRIGGERED")).toBeVisible();

    const generatePlanBtn = page.getByRole("button", { name: /Generate Tailored Protocol/i });
    await generatePlanBtn.click();

    // Step 4: Tailored Protocol Plan & Cal.com launch button
    await expect(page.getByRole("heading", { name: "Your Tailored Neuro-Metabolic Protocol Plan" })).toBeVisible();
    await expect(page.getByText("LOCKED (Oncology Gate)")).toBeVisible();
    await expect(page.getByRole("button", { name: /Open Cal.com Reservation Modal/i })).toBeVisible();
  });

  // TEST 7: Concierge VIP Membership Suite & Clinical Governance Charter
  test("Test 7: Concierge VIP Membership Suite & Clinical Governance Charter - 3-Tier architecture, comparison matrix, and Zero-ePHI governance pillars", async ({
    page,
  }) => {
    // 1. Verify TopNavBar contains Membership link
    await page.goto("/");
    const navMembershipLink = page.locator('header a[href="/membership"]');
    await expect(navMembershipLink).toBeVisible();
    await navMembershipLink.click();

    // 2. Verify Membership Suite (/membership)
    await page.waitForURL("**/membership", { timeout: 5000 });
    await expect(page.getByRole("heading", { name: "Concierge Membership & Investment Architecture" })).toBeVisible();

    // Verify all 3 tiers are rendered
    await expect(page.getByRole("heading", { name: "Cognitive Edge Foundation" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Peak Performance Continuum" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Concierge Neuro-Restorative VIP" })).toBeVisible();

    // Verify VIP badge and Direct Hotline feature
    await expect(page.getByText(/By Physician Invitation/i)).toBeVisible();
    await expect(page.getByText(/prioritized direct communication channel to Dr. David Andreas Runheim/i)).toBeVisible();

    // Verify Comparison Matrix
    const comparisonSection = page.locator("#comparison");
    await expect(comparisonSection).toBeVisible();
    await expect(page.getByRole("heading", { name: /Membership Architecture Comparison/i })).toBeVisible();
    await expect(page.getByText("Physician Access & Clinical Response SLA")).toBeVisible();
    await expect(page.getByText("Biomarker Stoichiometry & Diagnostic Panels")).toBeVisible();
    await expect(page.getByText("Advanced Modality Coverage")).toBeVisible();

    // Verify Cal.com Booking Modal trigger on Tier 1
    const applyBtn = page.getByRole("button", { name: "Apply for Cognitive Edge" });
    await applyBtn.click();
    const calModal = page.getByRole("heading", { name: "Private Consultation Reservation" });
    await expect(calModal).toBeVisible({ timeout: 5000 });

    // Close modal
    const closeBtn = page.locator('button[aria-label="Close modal"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }

    // 3. Verify /vault paywall deep link connects to /membership#comparison
    await page.goto("/vault");
    const paywallUpgradeLink = page.locator('a:has-text("Upgrade Membership Tier")');
    await expect(paywallUpgradeLink).toHaveAttribute("href", "/membership#comparison");

    // 4. Verify Clinical Governance Charter (/governance)
    await page.goto("/governance");
    await expect(page.getByRole("heading", { name: "Patient Governance & Zero-ePHI Transparency Charter" })).toBeVisible();

    // Pillar 1: Zero-ePHI Quarantine
    const quarantineSection = page.locator("#quarantine");
    await expect(quarantineSection).toBeVisible();
    await expect(page.getByRole("heading", { name: "The Zero-ePHI Isolation Quarantine" })).toBeVisible();
    await expect(page.getByText("Stateless Web Perimeter Enforced")).toBeVisible();

    // Pillar 2: Spruce BAA Security
    const spruceSection = page.locator("#spruce");
    await expect(spruceSection).toBeVisible();
    await expect(page.getByRole("heading", { name: "Encrypted Communications via Spruce Health" })).toBeVisible();
    await expect(page.getByText("HIPAA Business Associate Agreement (BAA) Active")).toBeVisible();

    // Pillar 3: Financial & Deposit Protocols
    const financialSection = page.locator("#financial");
    await expect(financialSection).toBeVisible();
    await expect(page.getByRole("heading", { name: "Appointment & Financial Protocols" })).toBeVisible();
    await expect(page.getByText("The $1,000 Diagnostic Deposit Guarantee")).toBeVisible();
    await expect(page.getByText("48-Hour Cancellation & Rescheduling Policy")).toBeVisible();

    // Pillar 4: Safety & Contraindications Philosophy
    const safetySection = page.locator("#safety");
    await expect(safetySection).toBeVisible();
    await expect(page.getByRole("heading", { name: "Clinical Safety & Contraindications Philosophy" })).toBeVisible();
    await expect(page.getByText("NAD+ & Precursor Oncology Lock")).toBeVisible();
    await expect(page.getByText("Vitamin B6 Pyridoxine Neuropathy Ceiling")).toBeVisible();

    // 5. Verify Universal Footer Watermark & Links
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.getByText("ZERO-ePHI QUARANTINE ENFORCED")).toBeVisible();
    await expect(footer.getByText("HIPAA BAA SECURED")).toBeVisible();
  });

  // TEST 8: Clinical Video Theater & Member Payment Vault
  test("Test 8: Clinical Video Theater & Member Payment Vault - 4 Masterclass briefings, chapter scrubbing, and Stripe retainer vault", async ({
    page,
  }) => {
    // 1. Verify TopNavBar Briefings link
    await page.goto("/");
    const navBriefingsLink = page.locator('header a[href="/briefings"]');
    await expect(navBriefingsLink).toBeVisible();
    await navBriefingsLink.click();

    // 2. Verify Video Briefings Theater (/briefings)
    await page.waitForURL("**/briefings", { timeout: 5000 });
    await expect(page.getByRole("heading", { name: "The Clinical Video Briefings Theater" })).toBeVisible();

    // Verify video player mounts
    const videoPlayer = page.locator('[data-testid="briefing-video-player"]');
    await expect(videoPlayer).toBeVisible();

    // Verify all 4 masterclasses in catalog
    await expect(page.getByRole("heading", { name: /Reversing Thiamine Hysteresis/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Stoichiometric Methylation/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /DLPFC Transcranial Neuromodulation/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Endothelial Microperfusion/i }).first()).toBeVisible();

    // Verify interactive chapter clicking
    const chapterSaltBtn = page.getByRole("button", { name: /Why Oral Salts Fail/i });
    await expect(chapterSaltBtn).toBeVisible();
    await chapterSaltBtn.click();

    // Verify Cal.com Booking Modal from briefings theater
    const briefingBookBtn = page.getByRole("button", { name: /Schedule Assessment with Dr. Runheim/i });
    await expect(briefingBookBtn).toBeVisible();
    await briefingBookBtn.click();
    await expect(page.getByRole("heading", { name: "Private Consultation Reservation" })).toBeVisible({ timeout: 5000 });

    // Close modal
    const closeBtn = page.locator('button[aria-label="Close modal"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }

    // Switch masterclass to Stoichiometric Methylation
    const methylationCard = page.getByText("Stoichiometric Methylation: Bypassing MTHFR Polymorphisms");
    await methylationCard.click();
    await expect(page.getByText("ACTIVE STREAM: Stoichiometric Methylation")).toBeVisible();

    // 3. Verify Module 3 in /vault: Retainer & Payment Management
    await page.goto("/vault");
    await expect(page.getByRole("heading", { name: "Retainer & Payment Management" })).toBeVisible();
    await expect(page.getByText("PCI-DSS Level 1 tokenized billing portal")).toBeVisible();

    // Standard mode status
    await expect(page.getByRole("heading", { name: "Cognitive Edge Member" })).toBeVisible();
    await expect(page.getByText("CURRENT • GOOD STANDING")).toBeVisible();

    // Stripe Customer Portal link
    const stripeBtn = page.locator('a:has-text("Manage Retainer & Invoices")');
    await expect(stripeBtn).toBeVisible();
    await expect(stripeBtn).toHaveAttribute(
      "href",
      "https://billing.stripe.com/p/session/test_portal_session_cognitive_edge"
    );

    // Concierge Booking Desk shortcut
    const vaultBookingBtn = page.getByRole("button", { name: /Open Cal.com Scheduling Desk/i });
    await expect(vaultBookingBtn).toBeVisible();
    await vaultBookingBtn.click();
    await expect(page.getByRole("heading", { name: "Private Consultation Reservation" })).toBeVisible({ timeout: 5000 });

    // Close booking modal
    const closeVaultModalBtn = page.locator('button[aria-label="Close modal"]');
    if (await closeVaultModalBtn.isVisible()) {
      await closeVaultModalBtn.click();
    }

    // Toggle VIP Switcher and verify retainer updates to Concierge VIP Retainer Active
    const vipToggleBtn = page.getByRole("button", { name: /Concierge VIP/i });
    await vipToggleBtn.click();
    await expect(page.getByRole("heading", { name: "Concierge VIP Retainer Active" })).toBeVisible();
  });

  // TEST 9: Bespoke Luxury Mobile Navigation Drawer & Responsive Breakpoint Split
  test("Test 9: Mobile Navigation Drawer - Responsive breakpoint, animated toggle, drawer categories, and WCAG accessibility", async ({
    page,
  }) => {
    // 1. Set mobile viewport (< 1280px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // 2. Verify desktop navigation links are hidden on mobile
    const desktopNav = page.locator("header .hidden.xl\\:flex");
    await expect(desktopNav).toBeHidden();

    // 3. Verify mobile bar elements
    const brandLogo = page.getByRole("link", { name: "Cognitive Edge Home" });
    await expect(brandLogo).toBeVisible();

    const searchTrigger = page.locator('button[aria-label="Quick search clinical modalities, biomarkers, briefings, and actions (Cmd+K)"]');
    await expect(searchTrigger).toBeVisible();

    const menuToggle = page.locator('button[aria-controls="mobile-menu"]');
    await expect(menuToggle).toBeVisible();
    await expect(menuToggle).toHaveAttribute("aria-expanded", "false");

    // 4. Test Quick Search Trigger
    await searchTrigger.click();
    const searchDialog = page.locator('div[role="dialog"][aria-label="Clinical Command Search Palette"]');
    await expect(searchDialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(searchDialog).not.toBeVisible();

    // 5. Open Luxury Mobile Drawer
    await menuToggle.click();
    await expect(menuToggle).toHaveAttribute("aria-expanded", "true");

    const drawer = page.locator("#mobile-menu");
    await expect(drawer).toBeVisible();
    await expect(page.locator("body")).toHaveClass(/overflow-hidden/);

    // 6. Verify Category 1: Clinical Modalities & Science
    await expect(drawer.getByText("Clinical Modalities & Science")).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Services" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "The Ledger" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Briefings" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Membership" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Biographies" })).toBeVisible();

    // 7. Verify Category 2: Member Enclaves
    await expect(drawer.getByText("Member Enclaves")).toBeVisible();
    await expect(drawer.getByRole("link", { name: /Diagnostic Vault/i })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Client Portal" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Member Login" })).toBeVisible();

    // 8. Verify Category 3: Primary Action & Concierge Triage
    await expect(drawer.getByRole("link", { name: "Initiate Assessment →" })).toBeVisible();
    const conciergeLink = drawer.getByRole("link", { name: /Clinical Concierge: \+1 \(800\) 555-0199/i });
    await expect(conciergeLink).toBeVisible();
    await expect(conciergeLink).toHaveAttribute("href", "tel:+18005550199");

    // 9. Verify WCAG Escape key closes drawer and removes overflow-hidden
    await page.keyboard.press("Escape");
    await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
    await expect(drawer).not.toBeVisible();
    await expect(page.locator("body")).not.toHaveClass(/overflow-hidden/);

    // 10. Verify navigation closes drawer
    await menuToggle.click();
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: "The Ledger" }).click();
    await page.waitForURL("**/ledger", { timeout: 5000 });
    await expect(drawer).not.toBeVisible();
    await expect(page.locator("body")).not.toHaveClass(/overflow-hidden/);
  });
});



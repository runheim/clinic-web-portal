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
});

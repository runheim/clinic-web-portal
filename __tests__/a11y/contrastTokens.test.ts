import React from "react";
import { renderToString } from "react-dom/server";
import {
  calculateContrastRatio,
  calculateRelativeLuminance,
  hexToRgb,
  isWCAG_AA_LargeText,
  isWCAG_AA_NormalText,
  isWCAG_AAA_LargeText,
  isWCAG_AAA_NormalText,
  normalizeHex,
  validateContrast,
  AAA_VERIFIED_TOKEN_PAIRS,
  GOLD_PALETTE,
  MONOCHROME_PALETTE,
  OBSIDIAN_PALETTE,
  SLATE_PALETTE,
  HIGH_CONTRAST_CSS_OVERRIDES,
  WCAG_THRESHOLDS,
} from "@/lib/a11y/contrastTokens";
import {
  AccessibilityControls,
  applyPreferencesToDOM,
  DEFAULT_A11Y_PREFERENCES,
  SESSION_STORAGE_KEY,
  AccessibilityPreferences,
} from "@/components/a11y/AccessibilityControls";

describe("WCAG 2.1 AAA Accessibility Suite — Contrast Tokens & Math Engine", () => {
  describe("Hex Normalization & Color Decomposition", () => {
    it("normalizes 6-digit hex values with or without leading hash", () => {
      expect(normalizeHex("#ffffff")).toBe("ffffff");
      expect(normalizeHex("FFFFFF")).toBe("ffffff");
      expect(normalizeHex("#0b0f19")).toBe("0b0f19");
      expect(normalizeHex("0b0f19")).toBe("0b0f19");
    });

    it("expands 3-digit shorthand hex values correctly", () => {
      expect(normalizeHex("#fff")).toBe("ffffff");
      expect(normalizeHex("000")).toBe("000000");
      expect(normalizeHex("#f0a")).toBe("ff00aa");
    });

    it("throws an error for invalid hex length or format", () => {
      expect(() => normalizeHex("invalid")).toThrow();
      expect(() => normalizeHex("#12")).toThrow();
      expect(() => normalizeHex("#12345")).toThrow();
    });

    it("decomposes hex to accurate RGB integer components [0-255]", () => {
      expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb("#0b0f19")).toEqual({ r: 11, g: 15, b: 25 });
      expect(hexToRgb("#d4af37")).toEqual({ r: 212, g: 175, b: 55 });
    });
  });

  describe("Relative Luminance Calculation (WCAG 2.1)", () => {
    it("evaluates pure black #000000 relative luminance to 0.0", () => {
      expect(calculateRelativeLuminance("#000000")).toBeCloseTo(0.0, 4);
    });

    it("evaluates pure white #ffffff relative luminance to 1.0", () => {
      expect(calculateRelativeLuminance("#ffffff")).toBeCloseTo(1.0, 4);
    });

    it("calculates expected relative luminance for obsidian canvas #0b0f19", () => {
      const lum = calculateRelativeLuminance(OBSIDIAN_PALETTE.canvas);
      expect(lum).toBeGreaterThan(0.003);
      expect(lum).toBeLessThan(0.008);
    });
  });

  describe("Contrast Ratio Algorithm", () => {
    it("calculates maximum 21.00:1 ratio for pure white against pure black", () => {
      const ratioWhiteBlack = calculateContrastRatio("#ffffff", "#000000");
      const ratioBlackWhite = calculateContrastRatio("#000000", "#ffffff");
      expect(ratioWhiteBlack).toBe(21.0);
      expect(ratioBlackWhite).toBe(21.0);
    });

    it("calculates baseline 1.00:1 ratio for identical colors", () => {
      expect(calculateContrastRatio("#0b0f19", "#0b0f19")).toBe(1.0);
      expect(calculateContrastRatio("#d4af37", "#d4af37")).toBe(1.0);
    });

    it("is strictly commutative: order of arguments does not affect result", () => {
      const ratio1 = calculateContrastRatio(GOLD_PALETTE.champagneGoldAAA, OBSIDIAN_PALETTE.canvas);
      const ratio2 = calculateContrastRatio(OBSIDIAN_PALETTE.canvas, GOLD_PALETTE.champagneGoldAAA);
      expect(ratio1).toBe(ratio2);
    });
  });

  describe("WCAG 2.1 AAA & AA Validation Helpers", () => {
    it("validates Level AAA normal text threshold (>= 7.0:1)", () => {
      expect(isWCAG_AAA_NormalText("#ffffff", "#000000")).toBe(true);
      expect(isWCAG_AAA_NormalText(GOLD_PALETTE.brightGoldAAA, OBSIDIAN_PALETTE.canvas)).toBe(true);
      expect(isWCAG_AAA_NormalText("#555555", "#000000")).toBe(false);
    });

    it("validates Level AAA large text threshold (>= 4.5:1)", () => {
      expect(isWCAG_AAA_LargeText("#ffffff", "#000000")).toBe(true);
      expect(isWCAG_AAA_LargeText(GOLD_PALETTE.champagneGoldAAA, OBSIDIAN_PALETTE.canvas)).toBe(true);
    });

    it("validates Level AA thresholds (>= 4.5:1 normal, >= 3.0:1 large)", () => {
      expect(isWCAG_AA_NormalText(GOLD_PALETTE.champagneGoldAAA, OBSIDIAN_PALETTE.canvas)).toBe(true);
      expect(isWCAG_AA_LargeText(GOLD_PALETTE.champagneGoldAAA, OBSIDIAN_PALETTE.canvas)).toBe(true);
    });

    it("returns structured validation summary via validateContrast()", () => {
      const report = validateContrast(GOLD_PALETTE.brightGoldAAA, OBSIDIAN_PALETTE.canvas);
      expect(report.ratio).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.AAA_NORMAL_TEXT);
      expect(report.passesAAANormal).toBe(true);
      expect(report.passesAAALarge).toBe(true);
      expect(report.passesAANormal).toBe(true);
      expect(report.passesAALarge).toBe(true);
      expect(report.foreground).toBe(GOLD_PALETTE.brightGoldAAA);
      expect(report.background).toBe(OBSIDIAN_PALETTE.canvas);
    });
  });

  describe("WCAG 2.1 AAA Verified Hue Palettes & Token Pairs", () => {
    it("contains verified tokens for all four required hues: gold, slate, obsidian, and monochrome", () => {
      const hues = new Set(AAA_VERIFIED_TOKEN_PAIRS.map((t) => t.hue));
      expect(hues.has("gold")).toBe(true);
      expect(hues.has("slate")).toBe(true);
      expect(hues.has("obsidian")).toBe(true);
      expect(hues.has("monochrome")).toBe(true);
    });

    it("ensures EVERY verified token pair in AAA_VERIFIED_TOKEN_PAIRS passes WCAG 2.1 AAA criteria", () => {
      for (const pair of AAA_VERIFIED_TOKEN_PAIRS) {
        const computedRatio = calculateContrastRatio(pair.foreground, pair.background);
        if (pair.targetTier === "AAA_NORMAL") {
          expect(computedRatio).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.AAA_NORMAL_TEXT);
        } else {
          expect(computedRatio).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.AAA_LARGE_TEXT);
        }
      }
    });

    it("validates Gold Hue AAA compliance on obsidian backgrounds", () => {
      expect(calculateContrastRatio(GOLD_PALETTE.brightGoldAAA, OBSIDIAN_PALETTE.canvas)).toBeGreaterThanOrEqual(7.0);
      expect(calculateContrastRatio(GOLD_PALETTE.lightGoldAAA, OBSIDIAN_PALETTE.canvas)).toBeGreaterThanOrEqual(7.0);
      expect(calculateContrastRatio(GOLD_PALETTE.brandGoldAAA, OBSIDIAN_PALETTE.canvas)).toBeGreaterThanOrEqual(7.0);
      expect(calculateContrastRatio(GOLD_PALETTE.champagneGoldAAA, OBSIDIAN_PALETTE.canvas)).toBeGreaterThanOrEqual(7.0);
      expect(calculateContrastRatio(GOLD_PALETTE.champagneGoldAAA, OBSIDIAN_PALETTE.container)).toBeGreaterThanOrEqual(7.0);
      expect(calculateContrastRatio(GOLD_PALETTE.darkOnGoldAAA, GOLD_PALETTE.champagneGoldAAA)).toBeGreaterThanOrEqual(7.0);
    });

    it("validates Slate Hue AAA compliance on obsidian and light backgrounds", () => {
      expect(calculateContrastRatio(SLATE_PALETTE.pureWhiteAAA, OBSIDIAN_PALETTE.canvas)).toBeGreaterThanOrEqual(14.0);
      expect(calculateContrastRatio(SLATE_PALETTE.slateSurfaceAAA, OBSIDIAN_PALETTE.canvas)).toBeGreaterThanOrEqual(7.0);
      expect(calculateContrastRatio(SLATE_PALETTE.slate100AAA, OBSIDIAN_PALETTE.canvas)).toBeGreaterThanOrEqual(7.0);
      expect(calculateContrastRatio(SLATE_PALETTE.slate200AAA, OBSIDIAN_PALETTE.canvas)).toBeGreaterThanOrEqual(7.0);
      expect(calculateContrastRatio(SLATE_PALETTE.slate400AAA, OBSIDIAN_PALETTE.canvas)).toBeGreaterThanOrEqual(7.0);
      expect(calculateContrastRatio(SLATE_PALETTE.slateDarkTextAAA, SLATE_PALETTE.pureWhiteAAA)).toBeGreaterThanOrEqual(7.0);
    });

    it("validates Monochrome Hue AAA max contrast (>= 19:1)", () => {
      expect(calculateContrastRatio(MONOCHROME_PALETTE.pureWhite, MONOCHROME_PALETTE.pureBlack)).toBe(21.0);
      expect(
        calculateContrastRatio(MONOCHROME_PALETTE.highContrastFocusYellow, MONOCHROME_PALETTE.pureBlack)
      ).toBeGreaterThanOrEqual(19.0);
    });
  });

  describe("High Contrast CSS Overrides Dictionary", () => {
    it("defines high-contrast dark theme variables with AAA compliant values", () => {
      const darkOverrides = HIGH_CONTRAST_CSS_OVERRIDES["monochrome-dark"];
      expect(darkOverrides["--background"]).toBe("#000000");
      expect(darkOverrides["--foreground"]).toBe("#ffffff");
      expect(darkOverrides["--color-canvas-obsidian"]).toBe("#000000");

      const fgBgRatio = calculateContrastRatio(
        darkOverrides["--foreground"],
        darkOverrides["--background"]
      );
      expect(fgBgRatio).toBe(21.0);
    });

    it("defines high-contrast light theme variables with AAA compliant values", () => {
      const lightOverrides = HIGH_CONTRAST_CSS_OVERRIDES["monochrome-light"];
      expect(lightOverrides["--background"]).toBe("#ffffff");
      expect(lightOverrides["--foreground"]).toBe("#000000");

      const fgBgRatio = calculateContrastRatio(
        lightOverrides["--foreground"],
        lightOverrides["--background"]
      );
      expect(fgBgRatio).toBe(21.0);
    });
  });

  describe("AccessibilityControls Component & DOM Overrides Engine", () => {
    it("renders floating trigger in SSR without hydration errors", () => {
      const html = renderToString(React.createElement(AccessibilityControls));
      expect(html).toContain("aria-label=\"Clinical Accessibility Controls");
      expect(html).toContain("aria-haspopup=\"dialog\"");
      expect(html).toContain("aria-expanded=\"false\"");
      expect(html).toContain("A11Y");
    });

    it("exposes default preferences adhering to zero-ePHI specifications", () => {
      expect(DEFAULT_A11Y_PREFERENCES).toEqual({
        fontScale: "100%",
        reduceMotion: false,
        contrastMode: "default",
      });
      expect(SESSION_STORAGE_KEY).toBe("clinical_a11y_session_prefs");
    });

    it("applies font scaling CSS variable overrides to documentElement", () => {
      const properties: Record<string, string> = {};
      const attributes: Record<string, string> = {};

      const mockElement = {
        style: {
          fontSize: "",
          setProperty: (k: string, v: string) => {
            properties[k] = v;
          },
          removeProperty: (k: string) => {
            delete properties[k];
          },
        },
        setAttribute: (k: string, v: string) => {
          attributes[k] = v;
        },
        removeAttribute: (k: string) => {
          delete attributes[k];
        },
      };

      const mockDocument = {
        documentElement: mockElement,
        getElementById: () => null,
        head: { appendChild: () => {} },
      };

      // Mock global document
      const originalDoc = (global as unknown as { document?: unknown }).document;
      (global as unknown as { document: unknown }).document = mockDocument;

      try {
        // Test 115% scaling
        const prefs115: AccessibilityPreferences = {
          fontScale: "115%",
          reduceMotion: false,
          contrastMode: "default",
        };
        applyPreferencesToDOM(prefs115);
        expect(mockElement.style.fontSize).toBe("115%");
        expect(properties["--a11y-font-scale"]).toBe("1.15");

        // Test 130% scaling
        const prefs130: AccessibilityPreferences = {
          fontScale: "130%",
          reduceMotion: false,
          contrastMode: "default",
        };
        applyPreferencesToDOM(prefs130);
        expect(mockElement.style.fontSize).toBe("130%");
        expect(properties["--a11y-font-scale"]).toBe("1.3");

        // Test 100% reset
        applyPreferencesToDOM(DEFAULT_A11Y_PREFERENCES);
        expect(mockElement.style.fontSize).toBe("");
        expect(properties["--a11y-font-scale"]).toBeUndefined();

        // Test Ultra-High Contrast Dark Mode
        const prefsDark: AccessibilityPreferences = {
          fontScale: "100%",
          reduceMotion: false,
          contrastMode: "monochrome-dark",
        };
        applyPreferencesToDOM(prefsDark);
        expect(attributes["data-a11y-contrast"]).toBe("dark");
        expect(properties["--background"]).toBe("#000000");
        expect(properties["--foreground"]).toBe("#ffffff");

        // Test Ultra-High Contrast Light Mode
        const prefsLight: AccessibilityPreferences = {
          fontScale: "100%",
          reduceMotion: false,
          contrastMode: "monochrome-light",
        };
        applyPreferencesToDOM(prefsLight);
        expect(attributes["data-a11y-contrast"]).toBe("light");
        expect(properties["--background"]).toBe("#ffffff");
        expect(properties["--foreground"]).toBe("#000000");
      } finally {
        (global as unknown as { document: unknown }).document = originalDoc;
      }
    });
  });
});

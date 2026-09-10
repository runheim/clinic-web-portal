import {
  getDictionary,
  interpolate,
  isValidLocale,
  LOCALES,
  DEFAULT_LOCALE,
} from "../dictionary";
import { en } from "@/locales/en";
import { sv } from "@/locales/sv";
import { deCH } from "@/locales/de-CH";
import type { Locale, Dictionary } from "../types";

/**
 * Helper function to recursively collect all property path keys of an object.
 */
function getAllPropertyPaths(
  obj: Record<string, unknown>,
  prefix = ""
): string[] {
  let paths: string[] = [];

  for (const key of Object.keys(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      paths = paths.concat(
        getAllPropertyPaths(value as Record<string, unknown>, currentPath)
      );
    } else {
      paths.push(currentPath);
    }
  }

  return paths.sort();
}

/**
 * Helper function to retrieve a nested property by dot path.
 */
function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

describe("Zero-Client-Bundle Private Client Localization (i18n Enclave)", () => {
  describe("Structural & Key Parity Across All Locales", () => {
    const enPaths = getAllPropertyPaths(en as unknown as Record<string, unknown>);
    const svPaths = getAllPropertyPaths(sv as unknown as Record<string, unknown>);
    const dePaths = getAllPropertyPaths(deCH as unknown as Record<string, unknown>);

    it("has identical total key counts in en, sv, and de-CH", () => {
      expect(enPaths.length).toBeGreaterThan(50);
      expect(svPaths.length).toBe(enPaths.length);
      expect(dePaths.length).toBe(enPaths.length);
    });

    it("verifies every key in English (en) exists in Swedish (sv)", () => {
      const missingInSv = enPaths.filter((p) => !svPaths.includes(p));
      expect(missingInSv).toEqual([]);
    });

    it("verifies every key in Swedish (sv) exists in English (en)", () => {
      const missingInEn = svPaths.filter((p) => !enPaths.includes(p));
      expect(missingInEn).toEqual([]);
    });

    it("verifies every key in English (en) exists in Swiss German (de-CH)", () => {
      const missingInDe = enPaths.filter((p) => !dePaths.includes(p));
      expect(missingInDe).toEqual([]);
    });

    it("verifies every key in Swiss German (de-CH) exists in English (en)", () => {
      const missingInEn = dePaths.filter((p) => !enPaths.includes(p));
      expect(missingInEn).toEqual([]);
    });

    it("contains zero empty, null, or undefined strings across all dictionaries", () => {
      const dictionaries: Record<Locale, Dictionary> = {
        en,
        sv,
        "de-CH": deCH,
      };

      for (const [, dict] of Object.entries(dictionaries)) {
        const dictRecord = dict as unknown as Record<string, unknown>;
        for (const path of enPaths) {
          const val = getNestedValue(dictRecord, path);

          if (Array.isArray(val)) {
            expect(val.length).toBeGreaterThan(0);
            for (const item of val) {
              expect(typeof item).toBe("string");
              expect((item as string).trim().length).toBeGreaterThan(0);
            }
          } else {
            expect(typeof val).toBe("string");
            expect((val as string).trim().length).toBeGreaterThan(0);
          }
        }
      }
    });

    it("ensures array lengths match exactly across all locales (e.g. fee tier highlights)", () => {
      const arrayPaths = enPaths.filter((path) => {
        const val = getNestedValue(en as unknown as Record<string, unknown>, path);
        return Array.isArray(val);
      });

      expect(arrayPaths.length).toBeGreaterThan(0);

      for (const path of arrayPaths) {
        const enArr = getNestedValue(en as unknown as Record<string, unknown>, path) as unknown[];
        const svArr = getNestedValue(sv as unknown as Record<string, unknown>, path) as unknown[];
        const deArr = getNestedValue(deCH as unknown as Record<string, unknown>, path) as unknown[];

        expect(svArr.length).toBe(enArr.length);
        expect(deArr.length).toBe(enArr.length);
      }
    });
  });

  describe("Locale Validator & Dictionary Resolver", () => {
    it("recognizes all defined supported locales", () => {
      expect(LOCALES).toEqual(["en", "sv", "de-CH"]);
      expect(DEFAULT_LOCALE).toBe("en");
      expect(isValidLocale("en")).toBe(true);
      expect(isValidLocale("sv")).toBe(true);
      expect(isValidLocale("de-CH")).toBe(true);
    });

    it("rejects invalid, malformed, or unsupported locales", () => {
      expect(isValidLocale("")).toBe(false);
      expect(isValidLocale("fr")).toBe(false);
      expect(isValidLocale("es")).toBe(false);
      expect(isValidLocale("de")).toBe(false);
      expect(isValidLocale("en-US")).toBe(false);
      expect(isValidLocale("sv-SE")).toBe(false);
      expect(isValidLocale("de_CH")).toBe(false);
      expect(isValidLocale("EN")).toBe(false);
    });

    it("resolves the exact requested dictionary for valid locales", () => {
      const enDict = getDictionary("en");
      expect(enDict.meta.locale).toBe("en");
      expect(enDict.meta.language).toBe("English");

      const svDict = getDictionary("sv");
      expect(svDict.meta.locale).toBe("sv");
      expect(svDict.meta.language).toBe("Svenska");

      const deDict = getDictionary("de-CH");
      expect(deDict.meta.locale).toBe("de-CH");
      expect(deDict.meta.language).toBe("Deutsch (Schweiz)");
    });

    it("falls back safely to default locale (en) for unrecognized locales at runtime", () => {
      const fallbackDict = getDictionary("non-existent-locale" as Locale);
      expect(fallbackDict.meta.locale).toBe("en");
      expect(fallbackDict.navigation.brandName).toBe("Cognitive Edge Clinic");
    });
  });

  describe("String Interpolation Engine", () => {
    it("replaces a single token correctly", () => {
      const template = "Welcome, {name}!";
      const result = interpolate(template, { name: "Dr. Runheim" });
      expect(result).toBe("Welcome, Dr. Runheim!");
    });

    it("replaces multiple tokens in one template", () => {
      const template = "Consultation dispatch for {name} has been routed to the queue under {tier}.";
      const result = interpolate(template, {
        name: "Karl Lindqvist",
        tier: "VIP Exekutivt Protokoll",
      });
      expect(result).toBe(
        "Consultation dispatch for Karl Lindqvist has been routed to the queue under VIP Exekutivt Protokoll."
      );
    });

    it("handles numeric parameters correctly", () => {
      const template = "Deposit authorization: ${amount} USD ({minutes} minutes).";
      const result = interpolate(template, { amount: 2500, minutes: 60 });
      expect(result).toBe("Deposit authorization: $2500 USD (60 minutes).");
    });

    it("replaces repeated tokens across the template", () => {
      const template = "{val} and {val} again";
      const result = interpolate(template, { val: "Alpha" });
      expect(result).toBe("Alpha and Alpha again");
    });

    it("preserves unprovided placeholders safely without corrupting string", () => {
      const template = "Provided: {present}, Missing: {absent}";
      const result = interpolate(template, { present: "Yes" });
      expect(result).toBe("Provided: Yes, Missing: {absent}");
    });

    it("returns empty string when given empty template", () => {
      expect(interpolate("", { name: "test" })).toBe("");
    });

    it("returns unmodified template when params map is empty", () => {
      const template = "No parameters here.";
      expect(interpolate(template, {})).toBe("No parameters here.");
    });
  });

  describe("Medical Modalities Clinical Coverage", () => {
    const modalitiesList = [
      "tmsNeuromodulation",
      "subcutaneousPeptides",
      "btlEmsella",
      "cerebralPhotobiomodulation",
      "glp1MetabolicOptimization",
      "mitochondrialBioenergetics",
      "bdnfSynapticPreservation",
    ] as const;

    it("covers all 7 primary clinical modalities in all 3 locales", () => {
      for (const loc of LOCALES) {
        const dict = getDictionary(loc);
        for (const modKey of modalitiesList) {
          const mod = dict.modalities[modKey];
          expect(mod).toBeDefined();
          expect(mod.title.length).toBeGreaterThan(0);
          expect(mod.subtitle.length).toBeGreaterThan(0);
          expect(mod.tagline.length).toBeGreaterThan(0);
          expect(mod.abstract.length).toBeGreaterThan(20);
          expect(mod.clinicalCadence.length).toBeGreaterThan(0);
          expect(mod.deliveryMethod.length).toBeGreaterThan(0);
        }
      }
    });

    it("validates specific clinical terminology per modality", () => {
      const enDict = getDictionary("en");
      expect(enDict.modalities.tmsNeuromodulation.title).toContain("TMS Neuromodulation");
      expect(enDict.modalities.subcutaneousPeptides.abstract).toContain("Epitalon");
      expect(enDict.modalities.mitochondrialBioenergetics.subtitle).toContain("Ubiquinol");

      const svDict = getDictionary("sv");
      expect(svDict.modalities.tmsNeuromodulation.title).toBe("TMS-Neuromodulering");
      expect(svDict.modalities.btlEmsella.title).toContain("BTL Emsella Bäckencentrumstabilisering");

      const deDict = getDictionary("de-CH");
      expect(deDict.modalities.cerebralPhotobiomodulation.title).toBe("Zerebrale Photobiomodulation");
      expect(deDict.modalities.bdnfSynapticPreservation.title).toContain("BDNF-Amplifikation");
    });
  });

  describe("Fee Schedules & Appointment Tiers", () => {
    const tierKeys = ["clinicalEvaluation", "vipExecutive", "conciergeProtocol"] as const;

    it("verifies all three appointment tiers are present with valid pricing and codes", () => {
      for (const loc of LOCALES) {
        const dict = getDictionary(loc);
        for (const tierKey of tierKeys) {
          const tier = dict.feeTiers[tierKey];
          expect(tier).toBeDefined();
          expect(tier.code).toMatch(/^EV-(982148|982149|982150)$/);
          expect(tier.title.length).toBeGreaterThan(0);
          expect(tier.subtitle.length).toBeGreaterThan(0);
          expect(tier.duration.length).toBeGreaterThan(0);
          expect(tier.deposit.length).toBeGreaterThan(0);
          expect(tier.description.length).toBeGreaterThan(0);
          expect(tier.highlights.length).toBe(3);
          expect(tier.badgeText.length).toBeGreaterThan(0);
        }
      }
    });

    it("verifies deposit and cancellation legal policies", () => {
      for (const loc of LOCALES) {
        const dict = getDictionary(loc);
        expect(dict.feeTiers.depositPolicy.length).toBeGreaterThan(20);
        expect(dict.feeTiers.cancellationPolicy).toContain("48");
        expect(dict.feeTiers.superbillNotice.length).toBeGreaterThan(20);
      }
    });
  });

  describe("Clinical Disclaimers & Safety Gates", () => {
    const gateKeys = [
      "nadOncologyLock",
      "b6NeuropathyCeiling",
      "tmsFerromagneticLock",
      "anticoagulantAuditing",
    ] as const;

    it("verifies all four mandatory clinical safety gates", () => {
      for (const loc of LOCALES) {
        const dict = getDictionary(loc);
        for (const gateKey of gateKeys) {
          const gate = dict.disclaimers.gates[gateKey];
          expect(gate).toBeDefined();
          expect(gate.title.length).toBeGreaterThan(0);
          expect(gate.condition.length).toBeGreaterThan(0);
          expect(gate.action.length).toBeGreaterThan(0);
          expect(gate.rationale.length).toBeGreaterThan(0);
        }
      }
    });

    it("verifies regulatory disclaimers and out-of-network notices", () => {
      for (const loc of LOCALES) {
        const dict = getDictionary(loc);
        expect(dict.disclaimers.educationalNotice.length).toBeGreaterThan(30);
        expect(dict.disclaimers.safeHarborNotice.length).toBeGreaterThan(30);
        expect(dict.disclaimers.outOfNetworkNotice.length).toBeGreaterThan(30);
        expect(dict.disclaimers.fdaDisclaimerNotice.length).toBeGreaterThan(30);
      }
    });
  });

  describe("Triage Concierge & Hotlines", () => {
    it("verifies concierge tele-desk fields, windows, and confirmation", () => {
      for (const loc of LOCALES) {
        const dict = getDictionary(loc);
        expect(dict.triage.drawerTitle.length).toBeGreaterThan(0);
        expect(dict.triage.hotlineNumber).toBe("+1 (800) 555-0199");
        expect(dict.triage.fields.fullName.length).toBeGreaterThan(0);
        expect(dict.triage.fields.email.length).toBeGreaterThan(0);
        expect(dict.triage.windows.morning.length).toBeGreaterThan(0);
        expect(dict.triage.windows.afternoon.length).toBeGreaterThan(0);
        expect(dict.triage.windows.evening.length).toBeGreaterThan(0);
        expect(dict.triage.windows.urgent.length).toBeGreaterThan(0);
        expect(dict.triage.confirmation.descriptionTemplate).toContain("{name}");
        expect(dict.triage.confirmation.descriptionTemplate).toContain("{tier}");
      }
    });
  });

  describe("Zero-ePHI Guarantees", () => {
    it("verifies zero-ePHI badges, banners, and attestation notices", () => {
      for (const loc of LOCALES) {
        const dict = getDictionary(loc);
        expect(dict.zeroEphi.badge.length).toBeGreaterThan(0);
        expect(dict.zeroEphi.banner.length).toBeGreaterThan(0);
        expect(dict.zeroEphi.quarantineDescription.length).toBeGreaterThan(30);
        expect(dict.zeroEphi.ephemeralStateNotice.length).toBeGreaterThan(30);
        expect(dict.zeroEphi.hipaaAttestation.length).toBeGreaterThan(20);
        expect(dict.zeroEphi.soc2Attestation.length).toBeGreaterThan(20);
        expect(dict.zeroEphi.auditStatusPass.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Dialect & Orthography Authenticity", () => {
    it("strictly verifies Swiss German (de-CH) contains ZERO 'ß' characters across every string", () => {
      const dePaths = getAllPropertyPaths(deCH as unknown as Record<string, unknown>);
      const deRecord = deCH as unknown as Record<string, unknown>;

      const violations: { path: string; value: string }[] = [];

      for (const path of dePaths) {
        const val = getNestedValue(deRecord, path);
        if (typeof val === "string" && val.includes("ß")) {
          violations.push({ path, value: val });
        } else if (Array.isArray(val)) {
          for (const item of val) {
            if (typeof item === "string" && item.includes("ß")) {
              violations.push({ path, value: item });
            }
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it("verifies Swiss German uses high-prestige private clinic & banking terminology", () => {
      expect(deCH.meta.clinicalDialect).toContain("Schweizer");
      expect(deCH.navigation.brandTagline).toContain("Schweizerische Präzisions-Longevity");
      expect(deCH.navigation.diagnosticVault).toBe("Diagnostik-Tresor");
      expect(deCH.ui.buttons.close).toBe("Schliessen"); // Standard Swiss 'ss'
      expect(deCH.feeTiers.conciergeProtocol.description).toContain("Schweizer Privatbanken-Standard");
      expect(deCH.feeTiers.depositPolicy.toLowerCase()).toContain("depot");
      expect(deCH.modalities.cerebralPhotobiomodulation.tagline).toContain("Gefäss"); // Swiss 'ss'
    });

    it("verifies Swedish (sv) uses authentic Uppsala / Karolinska longevity research terminology", () => {
      expect(sv.meta.clinicalDialect).toContain("Skandinaviskt Longevity-Forskningsnav");
      expect(sv.navigation.brandTagline).toContain("Neurometabolisk Resuscitation");
      expect(sv.navigation.services).toBe("Kliniska Modaliteter");
      expect(sv.modalities.tmsNeuromodulation.tagline).toContain("kortikal excitabilitet");
      expect(sv.feeTiers.clinicalEvaluation.title).toBe("Privat Konsultationsreservation");
      expect(sv.zeroEphi.banner).toBe("NOLL-ePHI-KARANTÄN TILLÄMPAS");
    });
  });
});

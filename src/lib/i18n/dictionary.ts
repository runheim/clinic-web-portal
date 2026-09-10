import { en } from "@/locales/en";
import { sv } from "@/locales/sv";
import { deCH } from "@/locales/de-CH";
import type {
  Dictionary,
  Locale,
  ModalityEntry,
  FeeTierEntry,
  SafetyGateEntry,
} from "./types";

export type {
  Dictionary,
  Locale,
  ModalityEntry,
  FeeTierEntry,
  SafetyGateEntry,
};

/**
 * Immutable catalog of supported clinical localization locales.
 */
export const LOCALES = ["en", "sv", "de-CH"] as const;

/**
 * Fallback locale adhering to North American longevity clinic baseline.
 */
export const DEFAULT_LOCALE: Locale = "en";

/**
 * Static dictionary map enabling zero-runtime overhead and zero client bundle leaks.
 */
const DICTIONARIES: Record<Locale, Dictionary> = {
  en,
  sv,
  "de-CH": deCH,
};

/**
 * Type guard verifying if an arbitrary string conforms to a supported Locale.
 *
 * @param locale Candidate locale string (e.g. 'en', 'sv', 'de-CH')
 * @returns true if valid Locale, false otherwise
 */
export function isValidLocale(locale: string): locale is Locale {
  return (LOCALES as readonly string[]).includes(locale);
}

/**
 * Server-side zero-dependency dictionary resolver.
 * Resolves the localized static dictionary for a given locale with safe fallback to 'en'.
 *
 * @param locale Valid Locale identifier
 * @returns Fully typed Dictionary matching the requested locale
 */
export function getDictionary(locale: Locale): Dictionary {
  if (isValidLocale(locale)) {
    return DICTIONARIES[locale];
  }
  return DICTIONARIES[DEFAULT_LOCALE];
}

/**
 * Lightweight zero-dependency string interpolator.
 * Safely replaces template parameter tokens `{key}` with values from `params`.
 *
 * Example:
 *   interpolate("Consultation dispatch for {name} under {tier}.", { name: "Richard", tier: "VIP" })
 *   => "Consultation dispatch for Richard under VIP."
 *
 * @param template String containing `{paramName}` placeholders
 * @param params Key-value map of substitutions (string | number)
 * @returns Interpolated string with replaced tokens
 */
export function interpolate(
  template: string,
  params: Record<string, string | number>
): string {
  if (!template || !params) {
    return template ?? "";
  }
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = params[key];
      return value !== undefined && value !== null ? String(value) : "";
    }
    return match;
  });
}

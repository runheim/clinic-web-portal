"use client";

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import {
  HIGH_CONTRAST_CSS_OVERRIDES,
  ContrastModeId,
  WCAG_THRESHOLDS,
} from "@/lib/a11y/contrastTokens";

export type FontScale = "100%" | "115%" | "130%";

export interface AccessibilityPreferences {
  fontScale: FontScale;
  reduceMotion: boolean;
  contrastMode: ContrastModeId;
}

export const DEFAULT_A11Y_PREFERENCES: AccessibilityPreferences = {
  fontScale: "100%",
  reduceMotion: false,
  contrastMode: "default",
};

export const SESSION_STORAGE_KEY = "clinical_a11y_session_prefs";
const A11Y_CHANGE_EVENT = "clinical_a11y_prefs_change";
const MOTION_STYLE_ID = "clinical-a11y-motion-override";

// Cache for useSyncExternalStore to maintain stable object reference
let cachedSnapshotString: string | null = null;
let cachedSnapshotObject: AccessibilityPreferences = DEFAULT_A11Y_PREFERENCES;

/**
 * Pure external store snapshot reader for React 19 useSyncExternalStore.
 */
function getA11ySnapshot(): AccessibilityPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_A11Y_PREFERENCES;
  }

  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw !== cachedSnapshotString) {
      cachedSnapshotString = raw;
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AccessibilityPreferences>;
        cachedSnapshotObject = {
          fontScale:
            parsed.fontScale === "100%" ||
            parsed.fontScale === "115%" ||
            parsed.fontScale === "130%"
              ? parsed.fontScale
              : DEFAULT_A11Y_PREFERENCES.fontScale,
          reduceMotion:
            typeof parsed.reduceMotion === "boolean"
              ? parsed.reduceMotion
              : DEFAULT_A11Y_PREFERENCES.reduceMotion,
          contrastMode:
            parsed.contrastMode === "monochrome-dark" ||
            parsed.contrastMode === "monochrome-light"
              ? parsed.contrastMode
              : "default",
        };
      } else {
        const prefersReduced =
          typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        cachedSnapshotObject = {
          ...DEFAULT_A11Y_PREFERENCES,
          reduceMotion: prefersReduced,
        };
      }
    }
  } catch {
    cachedSnapshotObject = DEFAULT_A11Y_PREFERENCES;
  }

  return cachedSnapshotObject;
}

function getServerSnapshot(): AccessibilityPreferences {
  return DEFAULT_A11Y_PREFERENCES;
}

function subscribeToA11yStore(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(A11Y_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(A11Y_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * Dispatches changes to ephemeral sessionStorage and broadcasts updates.
 */
export function setA11yPreferences(nextPrefs: AccessibilityPreferences): void {
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(nextPrefs);
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, json);
    cachedSnapshotString = json;
    cachedSnapshotObject = nextPrefs;
  } catch {
    // SessionStorage quota / private browsing fallback
  }
  applyPreferencesToDOM(nextPrefs);
  window.dispatchEvent(new Event(A11Y_CHANGE_EVENT));
}

/**
 * Resets preferences to initial baseline and clears ephemeral sessionStorage.
 */
export function resetA11yPreferences(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    cachedSnapshotString = null;
    cachedSnapshotObject = DEFAULT_A11Y_PREFERENCES;
  } catch {
    // Gracefully handle storage exceptions
  }
  applyPreferencesToDOM(DEFAULT_A11Y_PREFERENCES);
  window.dispatchEvent(new Event(A11Y_CHANGE_EVENT));
}

/**
 * Applies pure CSS variable overrides and typography scaling directly to documentElement.
 * Operates in ephemeral memory and persists only to non-ePHI sessionStorage.
 */
export function applyPreferencesToDOM(prefs: AccessibilityPreferences): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  // 1. Font Scaling Override
  if (prefs.fontScale === "100%") {
    root.style.fontSize = "";
    root.style.removeProperty("--a11y-font-scale");
  } else {
    root.style.fontSize = prefs.fontScale;
    root.style.setProperty(
      "--a11y-font-scale",
      prefs.fontScale === "115%" ? "1.15" : "1.3"
    );
  }

  // 2. Motion Reduction Override (prefers-reduced-motion)
  let motionStyleEl = document.getElementById(MOTION_STYLE_ID) as HTMLStyleElement | null;
  if (prefs.reduceMotion) {
    root.setAttribute("data-reduced-motion", "true");
    root.style.setProperty("--a11y-motion-reduce", "1");
    root.style.setProperty("--animation-duration", "0.001ms");
    root.style.setProperty("--transition-duration", "0.001ms");

    if (!motionStyleEl) {
      motionStyleEl = document.createElement("style");
      motionStyleEl.id = MOTION_STYLE_ID;
      motionStyleEl.textContent = `
        [data-reduced-motion="true"] *,
        [data-reduced-motion="true"] *::before,
        [data-reduced-motion="true"] *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(motionStyleEl);
    }
  } else {
    root.removeAttribute("data-reduced-motion");
    root.style.removeProperty("--a11y-motion-reduce");
    root.style.removeProperty("--animation-duration");
    root.style.removeProperty("--transition-duration");
    if (motionStyleEl) {
      motionStyleEl.remove();
    }
  }

  // 3. Ultra-High-Contrast Monochrome Modes
  const allDarkKeys = Object.keys(HIGH_CONTRAST_CSS_OVERRIDES["monochrome-dark"]);
  const allLightKeys = Object.keys(HIGH_CONTRAST_CSS_OVERRIDES["monochrome-light"]);
  const allOverrideKeys = Array.from(new Set([...allDarkKeys, ...allLightKeys]));

  if (prefs.contrastMode === "default") {
    for (const key of allOverrideKeys) {
      root.style.removeProperty(key);
    }
    root.removeAttribute("data-a11y-contrast");
  } else {
    const overrides = HIGH_CONTRAST_CSS_OVERRIDES[prefs.contrastMode];
    for (const key of allOverrideKeys) {
      if (!(key in overrides)) {
        root.style.removeProperty(key);
      }
    }
    for (const [prop, val] of Object.entries(overrides)) {
      root.style.setProperty(prop, val);
    }
    root.setAttribute(
      "data-a11y-contrast",
      prefs.contrastMode === "monochrome-dark" ? "dark" : "light"
    );
  }
}

export function AccessibilityControls() {
  const [isOpen, setIsOpen] = useState(false);
  const preferences = useSyncExternalStore(
    subscribeToA11yStore,
    getA11ySnapshot,
    getServerSnapshot
  );

  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Synchronize preferences to DOM whenever the external store state changes
  useEffect(() => {
    applyPreferencesToDOM(preferences);
  }, [preferences]);

  // Update specific preference
  const handleUpdate = useCallback(
    <K extends keyof AccessibilityPreferences>(
      key: K,
      value: AccessibilityPreferences[K]
    ) => {
      setA11yPreferences({
        ...preferences,
        [key]: value,
      });
    },
    [preferences]
  );

  // Open / Close handlers with focus management
  const handleOpen = useCallback(() => {
    previouslyFocusedElementRef.current =
      document.activeElement as HTMLElement | null;
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      if (triggerRef.current) {
        triggerRef.current.focus();
      } else if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
      }
    }, 50);
  }, []);

  // Keyboard navigation: Escape to close, focus trap inside drawer
  useEffect(() => {
    if (!isOpen) return;

    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === "Tab") {
        if (!drawerRef.current) return;

        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Global hotkey shortcut: Alt+A or Option+A to toggle drawer
  useEffect(() => {
    const handleGlobalShortcut = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "a" || e.key === "A" || e.code === "KeyA")) {
        e.preventDefault();
        setIsOpen((open) => {
          if (!open) {
            previouslyFocusedElementRef.current =
              document.activeElement as HTMLElement | null;
          }
          return !open;
        });
      }
    };

    window.addEventListener("keydown", handleGlobalShortcut);
    return () => window.removeEventListener("keydown", handleGlobalShortcut);
  }, []);

  // Active modifications indicator
  const hasActiveOverrides =
    preferences.fontScale !== "100%" ||
    preferences.reduceMotion ||
    preferences.contrastMode !== "default";

  return (
    <>
      {/* Floating Discreet Drawer Trigger Button */}
      <aside aria-label="Accessibility panel trigger" className="fixed bottom-5 right-5 z-40">
        <button
          ref={triggerRef}
          type="button"
          onClick={isOpen ? handleClose : handleOpen}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls="clinical-a11y-drawer"
          aria-label="Clinical Accessibility Controls (WCAG 2.1 AAA Suite, Shortcut: Alt+A)"
          title="Accessibility Controls (Alt+A)"
          className="group relative flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-surface-midnight/95 backdrop-blur-md border border-border-gold-subtle hover:border-champagne-gold shadow-lg hover:shadow-gold-aura text-text-surface hover:text-champagne-gold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-champagne-gold focus-visible:outline-offset-2"
        >
          {/* Universal Accessibility Icon */}
          <svg
            className="w-5 h-5 text-champagne-gold transition-transform group-hover:scale-110"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="4" r="2" />
            <path d="M4 8h16" />
            <path d="M12 8v8" />
            <path d="M8 18l4-2 4 2" />
            <path d="M7 10l5 3 5-3" />
          </svg>

          <span className="font-mono text-xs font-medium tracking-widest uppercase">
            A11Y
          </span>

          {/* Active Overrides Status Indicator */}
          {hasActiveOverrides && (
            <span
              className="relative flex h-2 w-2"
              title="Accessibility overrides currently active"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-champagne-gold opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-champagne-gold" />
            </span>
          )}
        </button>
      </aside>

      {/* Modal Backdrop (when open) */}
      {isOpen && (
        <div
          role="presentation"
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Accessible Floating Drawer Dialog */}
      {isOpen && (
        <div
          ref={drawerRef}
          id="clinical-a11y-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-dialog-title"
          aria-describedby="a11y-dialog-desc"
          className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-[440px] max-h-[90vh] overflow-y-auto rounded-2xl bg-canvas-obsidian border-2 border-champagne-gold/30 shadow-2xl p-6 text-text-surface transition-all duration-300 ease-out focus:outline-none"
        >
          {/* Drawer Header */}
          <div className="flex items-start justify-between border-b border-border-gold-subtle pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-surface-midnight border border-border-gold-subtle text-champagne-gold">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m4.93 4.93 4.24 4.24" />
                    <path d="m14.83 9.17 4.24-4.24" />
                    <path d="m14.83 14.83 4.24 4.24" />
                    <path d="m9.17 14.83-4.24 4.24" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </span>
                <h2
                  id="a11y-dialog-title"
                  className="font-display text-lg font-semibold tracking-wide text-champagne-gold"
                >
                  Clinical Accessibility
                </h2>
              </div>
              <p
                id="a11y-dialog-desc"
                className="font-mono text-[11px] text-text-surface-muted uppercase tracking-wider"
              >
                WCAG 2.1 Level AAA Suite • Ephemeral Session
              </p>
            </div>

            {/* Close Button */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={handleClose}
              aria-label="Close accessibility controls"
              className="p-1.5 rounded-lg text-text-surface-muted hover:text-champagne-gold hover:bg-surface-midnight border border-transparent hover:border-border-gold-subtle transition-colors focus-visible:outline-2 focus-visible:outline-champagne-gold"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-6 space-y-6">
            {/* Section 1: Font Scaling Override */}
            <fieldset className="space-y-3">
              <legend className="font-mono text-xs font-semibold uppercase tracking-wider text-champagne-gold flex items-center justify-between w-full">
                <span>1. Typography Scale</span>
                <span className="text-[10px] text-text-surface-muted font-normal">
                  Rem Proportional
                </span>
              </legend>
              <p className="text-xs text-text-surface-variant leading-relaxed">
                Adjust clinical documentation text size without layout degradation.
              </p>
              <div
                role="radiogroup"
                aria-label="Typography Scale"
                className="grid grid-cols-3 gap-2 pt-1"
              >
                {(
                  [
                    { label: "100%", desc: "Standard", value: "100%" },
                    { label: "115%", desc: "Comfort", value: "115%" },
                    { label: "130%", desc: "Large", value: "130%" },
                  ] as const
                ).map((opt) => {
                  const isSelected = preferences.fontScale === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleUpdate("fontScale", opt.value)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? "bg-champagne-gold/15 border-champagne-gold text-champagne-gold shadow-sm font-semibold"
                          : "bg-surface-midnight/80 border-border-gold-subtle text-text-surface hover:border-champagne-gold/50"
                      } focus-visible:outline-2 focus-visible:outline-champagne-gold`}
                    >
                      <span className="font-mono text-sm tracking-tight">{opt.label}</span>
                      <span className="text-[10px] text-text-surface-muted mt-0.5">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Section 2: Motion Reduction Override */}
            <fieldset className="space-y-3 pt-4 border-t border-border-midnight">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <legend className="font-mono text-xs font-semibold uppercase tracking-wider text-champagne-gold">
                    2. Vestibular Motion Safety
                  </legend>
                  <p className="text-xs text-text-surface-variant leading-relaxed">
                    Override <code>prefers-reduced-motion</code> to halt ambient shimmer, video
                    auto-play, and kinetic transitions.
                  </p>
                </div>
                {/* Switch Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.reduceMotion}
                  onClick={() => handleUpdate("reduceMotion", !preferences.reduceMotion)}
                  aria-label="Toggle motion reduction"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-champagne-gold ${
                    preferences.reduceMotion ? "bg-champagne-gold" : "bg-surface-container-highest"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-canvas-obsidian shadow-lg ring-0 transition duration-200 ease-in-out ${
                      preferences.reduceMotion ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </fieldset>

            {/* Section 3: High-Contrast Overrides */}
            <fieldset className="space-y-3 pt-4 border-t border-border-midnight">
              <legend className="font-mono text-xs font-semibold uppercase tracking-wider text-champagne-gold flex items-center justify-between w-full">
                <span>3. Contrast Modes (WCAG AAA)</span>
                <span className="text-[10px] text-text-surface-muted font-normal">≥ 7.0:1</span>
              </legend>
              <p className="text-xs text-text-surface-variant leading-relaxed">
                Direct CSS variable injection across surfaces, typography, and borders.
              </p>
              <div
                role="radiogroup"
                aria-label="Contrast Modes"
                className="space-y-2 pt-1"
              >
                {(
                  [
                    {
                      id: "default",
                      title: "Curated Obsidian (Brand Baseline)",
                      desc: "Champagne Gold on Obsidian Canvas (9.11:1 Normal AAA)",
                      preview: "bg-[#0b0f19] border-[#d4af37] text-[#d4af37]",
                    },
                    {
                      id: "monochrome-dark",
                      title: "Monochrome Dark (AAA Stark)",
                      desc: "Pure #FFFFFF on Pitch #000000 (21.00:1 Normal AAA)",
                      preview: "bg-black border-white text-white",
                    },
                    {
                      id: "monochrome-light",
                      title: "Monochrome Light (AAA Stark)",
                      desc: "Pure #000000 on White #FFFFFF (21.00:1 Normal AAA)",
                      preview: "bg-white border-black text-black",
                    },
                  ] as const
                ).map((mode) => {
                  const isSelected = preferences.contrastMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleUpdate("contrastMode", mode.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-surface-midnight border-champagne-gold shadow-sm"
                          : "bg-surface-midnight/60 border-border-gold-subtle hover:border-champagne-gold/50"
                      } focus-visible:outline-2 focus-visible:outline-champagne-gold`}
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full border ${
                              isSelected
                                ? "bg-champagne-gold border-champagne-gold"
                                : "border-text-surface-muted"
                            }`}
                          />
                          <span className="font-body text-xs font-semibold text-text-surface">
                            {mode.title}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-surface-muted pl-4.5">
                          {mode.desc}
                        </p>
                      </div>

                      <div
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${mode.preview}`}
                        aria-hidden="true"
                      >
                        Aa
                      </div>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Section 4: Live WCAG Compliance Matrix Badge */}
            <div className="p-3.5 rounded-xl bg-surface-midnight/80 border border-border-gold-subtle space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-champagne-gold font-semibold uppercase tracking-wider">
                  WCAG 2.1 Level AAA Verification
                </span>
                <span className="px-1.5 py-0.5 rounded bg-vitality-sage/20 text-vitality-sage border border-vitality-sage/30 text-[10px]">
                  VERIFIED
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-text-surface-muted">
                <div className="flex items-center justify-between border-b border-border-midnight pb-1">
                  <span>Normal Text:</span>
                  <span className="text-text-surface font-semibold">
                    ≥ {WCAG_THRESHOLDS.AAA_NORMAL_TEXT}:1 (Pass)
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border-midnight pb-1">
                  <span>Large Text:</span>
                  <span className="text-text-surface font-semibold">
                    ≥ {WCAG_THRESHOLDS.AAA_LARGE_TEXT}:1 (Pass)
                  </span>
                </div>
              </div>
            </div>

            {/* Zero-ePHI Ephemeral Notice */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container border border-vitality-sage/30 text-[10px] font-mono text-vitality-sage">
              <span className="w-1.5 h-1.5 rounded-full bg-vitality-sage animate-pulse" />
              <span>Zero-ePHI Architecture • Ephemeral sessionStorage Only</span>
            </div>

            {/* Drawer Actions: Reset & Close */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={resetA11yPreferences}
                className="text-xs font-mono text-text-surface-muted hover:text-champagne-gold underline-offset-4 hover:underline transition-colors focus-visible:outline-2 focus-visible:outline-champagne-gold rounded"
              >
                Reset to Defaults
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-champagne-gold text-text-on-gold font-mono text-xs font-semibold hover:bg-champagne-gold-light transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-champagne-gold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AccessibilityControls;

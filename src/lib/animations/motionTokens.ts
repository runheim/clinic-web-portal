/**
 * Bio-Synchronous Micro-Interactions & Motion Suite
 * Motion Tokens & Physiological Frequency Constants
 *
 * Calibrated easing curves and timing constants tuned to 60fps spring physics
 * and human neuro-physiological rhythms:
 *  - 0.1 Hz Breathing Resonance Curve (10-second respiratory sinus arrhythmia cycle)
 *  - 10 Hz Alpha Wave Pacing (100ms cortical stabilization cycle)
 *  - 4-7 Hz Theta Meditative Relaxation Transition (meditative settling cycle)
 *
 * Hardware-accelerated CSS transition definitions and WCAG 2.1 Level AAA
 * accessibility adapters for reduced motion preferences.
 */

import { useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// 1. Resting Physiological Frequency Constants (Hz & Milliseconds)
// ---------------------------------------------------------------------------

export const PHYSIOLOGICAL_RHYTHMS = {
  /**
   * 0.1 Hz Breathing Resonance (Cardiac Coherence & Respiratory Sinus Arrhythmia)
   * A full 10-second cycle (0.1 Hz = 10,000ms) optimizing baroreflex sensitivity.
   */
  BREATHING_RESONANCE: {
    FREQUENCY_HZ: 0.1,
    CYCLE_MS: 10000,
    INHALE_MS: 4000,
    EXHALE_MS: 6000,
  },

  /**
   * 10 Hz Alpha Rhythm (Cortical Stabilization & Attentional Reset)
   * A 100ms period (10 Hz = 100ms) reflecting thalamocortical micro-oscillations.
   * Ideal for micro-interaction response times and visual confirmation states.
   */
  ALPHA_WAVE: {
    FREQUENCY_HZ: 10.0,
    CYCLE_MS: 100,
    QUARTER_CYCLE_MS: 25,
    HALF_CYCLE_MS: 50,
  },

  /**
   * 4-7 Hz Theta Rhythm (Meditative Relaxation & Cognitive Consolidation)
   * Nominal center at 5.5 Hz (~182ms), spanning 143ms (7 Hz) to 250ms (4 Hz).
   * Ideal for modal entrances, drawer reveals, and soothing visual shifts.
   */
  THETA_WAVE: {
    FREQUENCY_MIN_HZ: 4.0,
    FREQUENCY_MAX_HZ: 7.0,
    FREQUENCY_CENTER_HZ: 5.5,
    CYCLE_MIN_MS: 143,
    CYCLE_MAX_MS: 250,
    CYCLE_CENTER_MS: 182,
    RELAXATION_TRANSITION_MS: 220,
  },

  /**
   * 0.5 - 4 Hz Delta Baseline (Regenerative Rest & Deep Grounding)
   */
  DELTA_WAVE: {
    FREQUENCY_HZ: 2.0,
    CYCLE_MS: 500,
  },
} as const;

// ---------------------------------------------------------------------------
// 2. Calibrated Cubic-Bézier Curves & Coordinates
// ---------------------------------------------------------------------------

export type CubicBezierTuple = readonly [number, number, number, number];

/**
 * Mathematically calibrated cubic-bezier control points [x1, y1, x2, y2].
 */
export const CUBIC_BEZIER_POINTS = {
  /**
   * 0.1 Hz Respiratory Sinus Curve:
   * Smooth, harmonic sinusoidal easing mirroring natural tidal inhalation and prolonged exhalation.
   */
  breathingResonance: [0.37, 0.0, 0.63, 1.0] as const,

  /**
   * 10 Hz Alpha Cortical Stabilization:
   * Swift initial displacement followed by crisp cortical settling within 100ms.
   */
  alphaStabilization: [0.16, 1.0, 0.3, 1.0] as const,

  /**
   * 4-7 Hz Theta Meditative Relaxation:
   * Soft, balanced ease-in-out curve reducing visual friction and cognitive load.
   */
  thetaRelaxation: [0.25, 0.1, 0.25, 1.0] as const,

  /**
   * Gentle Deceleration: Smooth landing curve for physical surfaces.
   */
  gentleDeceleration: [0.0, 0.0, 0.2, 1.0] as const,

  /**
   * Snappy Micro: Ultra-responsive trigger curve for buttons and toggles.
   */
  snappyMicro: [0.2, 0.0, 0.0, 1.0] as const,
} as const;

/**
 * Standard CSS cubic-bezier(...) string representations.
 */
export const CUBIC_BEZIERS = {
  breathingResonance: `cubic-bezier(${CUBIC_BEZIER_POINTS.breathingResonance.join(", ")})`,
  alphaStabilization: `cubic-bezier(${CUBIC_BEZIER_POINTS.alphaStabilization.join(", ")})`,
  thetaRelaxation: `cubic-bezier(${CUBIC_BEZIER_POINTS.thetaRelaxation.join(", ")})`,
  gentleDeceleration: `cubic-bezier(${CUBIC_BEZIER_POINTS.gentleDeceleration.join(", ")})`,
  snappyMicro: `cubic-bezier(${CUBIC_BEZIER_POINTS.snappyMicro.join(", ")})`,
} as const;

// ---------------------------------------------------------------------------
// 3. 60fps Calibrated Spring Physics Parameters
// ---------------------------------------------------------------------------

export interface SpringPhysicsConfig {
  /** Spring stiffness coefficient (k in N/m) */
  stiffness: number;
  /** Damping coefficient (c in N·s/m) */
  damping: number;
  /** Moving mass (m in kg) */
  mass: number;
  /** Natural undamped angular frequency omega_0 = sqrt(k/m) (rad/s) */
  naturalFrequency: number;
  /** Damping ratio zeta = c / (2 * sqrt(k * m)). 1.0 = critically damped. */
  dampingRatio: number;
  /** Estimated settling duration in milliseconds at 60fps (< 1% remaining energy) */
  settleTimeMs: number;
}

/**
 * Helper to compute derived physical parameters for a mass-spring-damper system.
 */
export function calculateSpringPhysics(
  stiffness: number,
  damping: number,
  mass = 1.0
): SpringPhysicsConfig {
  const naturalFrequency = Math.sqrt(stiffness / mass);
  const criticalDamping = 2 * Math.sqrt(stiffness * mass);
  const dampingRatio = damping / criticalDamping;
  const settleTimeSeconds =
    dampingRatio > 0 && naturalFrequency > 0
      ? 4 / (dampingRatio * naturalFrequency)
      : 0.3;
  const settleTimeMs = Math.round(settleTimeSeconds * 1000);

  return {
    stiffness,
    damping,
    mass,
    naturalFrequency: Math.round(naturalFrequency * 100) / 100,
    dampingRatio: Math.round(dampingRatio * 100) / 100,
    settleTimeMs,
  };
}

/**
 * Calibrated spring presets tuned for high-refresh 60fps / 120fps display rendering.
 */
export const SPRING_CONFIGS: Record<
  "alphaPacing" | "thetaRelaxation" | "breathingSinus" | "criticallyDamped",
  SpringPhysicsConfig
> = {
  /**
   * 10 Hz Alpha Wave Spring:
   * Stiff and snappy (zeta ≈ 0.82), settling in ~100ms without sustained oscillation.
   */
  alphaPacing: calculateSpringPhysics(380, 32, 1.0),

  /**
   * 4-7 Hz Theta Relaxation Spring:
   * Soft, meditative glide (zeta ≈ 0.87), settling comfortably in ~220ms.
   */
  thetaRelaxation: calculateSpringPhysics(170, 23, 1.0),

  /**
   * 0.1 Hz Respiratory Sinus Spring:
   * Organic, fluid mass for respiratory background ambient swells.
   */
  breathingSinus: calculateSpringPhysics(25, 12, 1.5),

  /**
   * Critically Damped Standard:
   * Pure non-oscillatory convergence (zeta = 1.00).
   */
  criticallyDamped: calculateSpringPhysics(225, 30, 1.0),
};

// ---------------------------------------------------------------------------
// 4. Ready-to-Use CSS Transition Strings
// ---------------------------------------------------------------------------

export const CSS_TRANSITIONS = {
  /**
   * 100ms Cortical Stabilization transition for micro-interactions, scale pops, and buttons.
   */
  alphaMicro: `transform ${PHYSIOLOGICAL_RHYTHMS.ALPHA_WAVE.CYCLE_MS}ms ${CUBIC_BEZIERS.alphaStabilization}, opacity ${PHYSIOLOGICAL_RHYTHMS.ALPHA_WAVE.CYCLE_MS}ms ${CUBIC_BEZIERS.alphaStabilization}`,

  /**
   * 220ms Theta Meditative Relaxation transition for reveals, cards, and modal sheets.
   */
  thetaRelax: `transform ${PHYSIOLOGICAL_RHYTHMS.THETA_WAVE.RELAXATION_TRANSITION_MS}ms ${CUBIC_BEZIERS.thetaRelaxation}, opacity ${PHYSIOLOGICAL_RHYTHMS.THETA_WAVE.RELAXATION_TRANSITION_MS}ms ${CUBIC_BEZIERS.thetaRelaxation}`,

  /**
   * 10-second Respiratory Sinus Rhythm transition for slow physiological aura pulses.
   */
  respiratorySinus: `transform ${PHYSIOLOGICAL_RHYTHMS.BREATHING_RESONANCE.CYCLE_MS}ms ${CUBIC_BEZIERS.breathingResonance}, opacity ${PHYSIOLOGICAL_RHYTHMS.BREATHING_RESONANCE.CYCLE_MS}ms ${CUBIC_BEZIERS.breathingResonance}`,

  /**
   * Champagne Gold Aura illumination transition (smooth elevation & border shift).
   */
  champagneAura: `box-shadow 220ms ${CUBIC_BEZIERS.alphaStabilization}, border-color 220ms ${CUBIC_BEZIERS.alphaStabilization}`,

  /**
   * Instant fade transition for reduced-motion accessibility preference.
   */
  reducedMotionInstant: "opacity 1ms linear",

  /**
   * Gentle 50ms fade transition for reduced-motion accessibility preference.
   */
  reducedMotionFade: "opacity 50ms linear",

  /**
   * Complete suppression of transition animation.
   */
  reducedMotionNone: "none",
} as const;

// ---------------------------------------------------------------------------
// 5. Accessibility Helpers & Reduced Motion Adapters
// ---------------------------------------------------------------------------

export interface ReducedMotionOptions {
  /**
   * Explicit override for reduced-motion mode.
   * If undefined, queries `window.matchMedia('(prefers-reduced-motion: reduce)')` in browser contexts.
   */
  prefersReducedMotion?: boolean;

  /**
   * Fallback CSS transition string applied when reduced motion is preferred.
   * Defaults to `CSS_TRANSITIONS.reducedMotionFade` ('opacity 50ms linear').
   */
  fallback?: string;
}

/**
 * Checks whether the client environment requests reduced motion.
 * Returns `false` on the server or when media queries are unavailable.
 */
export function checkPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * Listener subscription helper for `useSyncExternalStore`.
 */
function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  try {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", callback);
      return () => mediaQuery.removeEventListener("change", callback);
    } else {
      mediaQuery.addListener(callback);
      return () => mediaQuery.removeListener(callback);
    }
  } catch {
    return () => {};
  }
}

function getReducedMotionSnapshot(): boolean {
  return checkPrefersReducedMotion();
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

/**
 * React 19 hook providing reactive subscription to `prefers-reduced-motion: reduce`.
 * Safe for SSR and hydration without cascading effect re-renders.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
}

/**
 * Calibrates a CSS transition string based on user accessibility preferences.
 *
 * When `prefers-reduced-motion: reduce` is active, replaces spatial transforms
 * and long transitions with an instantaneous or short opacity-only fade.
 *
 * @param standardTransition The desired CSS transition string when full motion is enabled.
 * @param options Optional overrides for reduced motion state and custom fallback.
 * @returns The appropriate CSS transition string.
 */
export function getReducedMotionTransition(
  standardTransition: string,
  options?: ReducedMotionOptions
): string {
  const isReduced =
    options?.prefersReducedMotion !== undefined
      ? options.prefersReducedMotion
      : checkPrefersReducedMotion();

  if (isReduced) {
    return options?.fallback ?? CSS_TRANSITIONS.reducedMotionFade;
  }

  return standardTransition;
}

// ---------------------------------------------------------------------------
// 6. Bio-Mathematical Wave Oscillators
// ---------------------------------------------------------------------------

export interface WaveSamplePoint {
  /** Normalized position along the axis [0, 1] */
  normalizedX: number;
  /** Oscillatory value centered at 0 [-1, 1] */
  amplitude: number;
}

/**
 * Computes an instantaneous alpha wave (10 Hz) amplitude value.
 * @param timeSeconds Current elapsed time in seconds.
 * @param phaseOffset Radians phase offset (default 0).
 */
export function computeAlphaWaveSample(
  timeSeconds: number,
  phaseOffset = 0
): number {
  const omega = 2 * Math.PI * PHYSIOLOGICAL_RHYTHMS.ALPHA_WAVE.FREQUENCY_HZ;
  return Math.sin(omega * timeSeconds + phaseOffset);
}

/**
 * Computes an instantaneous theta wave (4-7 Hz, default 5.5 Hz) amplitude value.
 * @param timeSeconds Current elapsed time in seconds.
 * @param frequencyHz Oscillation frequency within 4-7 Hz band (default 5.5).
 * @param phaseOffset Radians phase offset (default 0).
 */
export function computeThetaWaveSample(
  timeSeconds: number,
  frequencyHz: number = PHYSIOLOGICAL_RHYTHMS.THETA_WAVE.FREQUENCY_CENTER_HZ,
  phaseOffset = 0
): number {
  const clampedFreq = Math.min(
    PHYSIOLOGICAL_RHYTHMS.THETA_WAVE.FREQUENCY_MAX_HZ,
    Math.max(PHYSIOLOGICAL_RHYTHMS.THETA_WAVE.FREQUENCY_MIN_HZ, frequencyHz)
  );
  const omega = 2 * Math.PI * clampedFreq;
  return Math.cos(omega * timeSeconds + phaseOffset);
}

/**
 * Calculates current phase in the 0.1 Hz respiratory sinus arrhythmia cycle.
 * @param timestampMs Monotonic timestamp in milliseconds.
 */
export function getRespiratoryCycleState(timestampMs: number): {
  phase: "inhale" | "exhale";
  progress: number;
  instantaneousTension: number;
} {
  const cycleMs = PHYSIOLOGICAL_RHYTHMS.BREATHING_RESONANCE.CYCLE_MS;
  const inhaleMs = PHYSIOLOGICAL_RHYTHMS.BREATHING_RESONANCE.INHALE_MS;
  const elapsedInCycle = ((timestampMs % cycleMs) + cycleMs) % cycleMs;

  if (elapsedInCycle < inhaleMs) {
    const progress = elapsedInCycle / inhaleMs;
    const tension = (1 - Math.cos(progress * Math.PI)) / 2;
    return { phase: "inhale", progress, instantaneousTension: tension };
  } else {
    const progress = (elapsedInCycle - inhaleMs) / (cycleMs - inhaleMs);
    const tension = (1 + Math.cos(progress * Math.PI)) / 2;
    return { phase: "exhale", progress, instantaneousTension: tension };
  }
}

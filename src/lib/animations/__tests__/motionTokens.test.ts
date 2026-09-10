/**
 * Unit Tests for Bio-Synchronous Micro-Interactions & Motion Suite
 * Validates physiological frequency pacing, spring dynamics, and accessibility helpers.
 */

import {
  PHYSIOLOGICAL_RHYTHMS,
  CUBIC_BEZIER_POINTS,
  CUBIC_BEZIERS,
  SPRING_CONFIGS,
  CSS_TRANSITIONS,
  calculateSpringPhysics,
  getReducedMotionTransition,
  checkPrefersReducedMotion,
  computeAlphaWaveSample,
  computeThetaWaveSample,
  getRespiratoryCycleState,
} from "../motionTokens";

describe("Bio-Synchronous Motion Tokens & Physiological Frequencies", () => {
  describe("1. Physiological Frequency Constants", () => {
    test("0.1 Hz Breathing Resonance matches 10-second respiratory sinus cycle", () => {
      expect(PHYSIOLOGICAL_RHYTHMS.BREATHING_RESONANCE.FREQUENCY_HZ).toBe(0.1);
      expect(PHYSIOLOGICAL_RHYTHMS.BREATHING_RESONANCE.CYCLE_MS).toBe(10000);
      expect(PHYSIOLOGICAL_RHYTHMS.BREATHING_RESONANCE.INHALE_MS).toBe(4000);
      expect(PHYSIOLOGICAL_RHYTHMS.BREATHING_RESONANCE.EXHALE_MS).toBe(6000);
      expect(
        PHYSIOLOGICAL_RHYTHMS.BREATHING_RESONANCE.INHALE_MS +
          PHYSIOLOGICAL_RHYTHMS.BREATHING_RESONANCE.EXHALE_MS
      ).toBe(10000);
    });

    test("10 Hz Alpha Wave matches 100ms cortical stabilization cycle", () => {
      expect(PHYSIOLOGICAL_RHYTHMS.ALPHA_WAVE.FREQUENCY_HZ).toBe(10.0);
      expect(PHYSIOLOGICAL_RHYTHMS.ALPHA_WAVE.CYCLE_MS).toBe(100);
      expect(PHYSIOLOGICAL_RHYTHMS.ALPHA_WAVE.HALF_CYCLE_MS).toBe(50);
      expect(PHYSIOLOGICAL_RHYTHMS.ALPHA_WAVE.QUARTER_CYCLE_MS).toBe(25);
    });

    test("4-7 Hz Theta Rhythm matches meditative relaxation transitions", () => {
      expect(PHYSIOLOGICAL_RHYTHMS.THETA_WAVE.FREQUENCY_MIN_HZ).toBe(4.0);
      expect(PHYSIOLOGICAL_RHYTHMS.THETA_WAVE.FREQUENCY_MAX_HZ).toBe(7.0);
      expect(PHYSIOLOGICAL_RHYTHMS.THETA_WAVE.FREQUENCY_CENTER_HZ).toBe(5.5);
      expect(PHYSIOLOGICAL_RHYTHMS.THETA_WAVE.CYCLE_MIN_MS).toBe(143);
      expect(PHYSIOLOGICAL_RHYTHMS.THETA_WAVE.CYCLE_MAX_MS).toBe(250);
      expect(PHYSIOLOGICAL_RHYTHMS.THETA_WAVE.RELAXATION_TRANSITION_MS).toBe(220);
    });
  });

  describe("2. Calibrated Cubic-Bezier Curves", () => {
    test("Bezier control points have 4 coordinates in valid [0, 1] range for X", () => {
      Object.entries(CUBIC_BEZIER_POINTS).forEach(([, coords]) => {
        expect(coords).toHaveLength(4);
        expect(coords[0]).toBeGreaterThanOrEqual(0);
        expect(coords[0]).toBeLessThanOrEqual(1);
        expect(coords[2]).toBeGreaterThanOrEqual(0);
        expect(coords[2]).toBeLessThanOrEqual(1);
      });
    });

    test("CSS cubic-bezier strings are properly formatted", () => {
      expect(CUBIC_BEZIERS.breathingResonance).toBe(
        "cubic-bezier(0.37, 0, 0.63, 1)"
      );
      expect(CUBIC_BEZIERS.alphaStabilization).toBe(
        "cubic-bezier(0.16, 1, 0.3, 1)"
      );
      expect(CUBIC_BEZIERS.thetaRelaxation).toBe(
        "cubic-bezier(0.25, 0.1, 0.25, 1)"
      );
    });
  });

  describe("3. 60fps Calibrated Spring Physics Parameters", () => {
    test("calculateSpringPhysics correctly derives natural frequency and damping ratio", () => {
      const spring = calculateSpringPhysics(100, 20, 1.0);
      expect(spring.stiffness).toBe(100);
      expect(spring.damping).toBe(20);
      expect(spring.mass).toBe(1.0);
      // omega_0 = sqrt(100 / 1) = 10
      expect(spring.naturalFrequency).toBe(10);
      // critical damping = 2 * sqrt(100 * 1) = 20
      // dampingRatio = 20 / 20 = 1.0 (critically damped)
      expect(spring.dampingRatio).toBe(1.0);
    });

    test("Alpha Wave Spring is calibrated for rapid cortical settling (~100ms)", () => {
      const alpha = SPRING_CONFIGS.alphaPacing;
      expect(alpha.stiffness).toBe(380);
      expect(alpha.dampingRatio).toBeGreaterThan(0.75);
      expect(alpha.dampingRatio).toBeLessThan(1.0); // Responsive underdamping
      expect(alpha.settleTimeMs).toBeLessThanOrEqual(300);
    });

    test("Theta Wave Spring is calibrated for smooth meditative relaxation (~220ms)", () => {
      const theta = SPRING_CONFIGS.thetaRelaxation;
      expect(theta.stiffness).toBe(170);
      expect(theta.dampingRatio).toBeGreaterThan(0.8);
      expect(theta.settleTimeMs).toBeGreaterThan(200);
    });

    test("Critically damped preset has zeta equal to 1.0", () => {
      expect(SPRING_CONFIGS.criticallyDamped.dampingRatio).toBe(1.0);
    });
  });

  describe("4. CSS Transitions and Reduced Motion Adapters", () => {
    test("Transitions contain expected durations and cubic-bezier tokens", () => {
      expect(CSS_TRANSITIONS.alphaMicro).toContain("100ms");
      expect(CSS_TRANSITIONS.alphaMicro).toContain("cubic-bezier(0.16, 1, 0.3, 1)");

      expect(CSS_TRANSITIONS.thetaRelax).toContain("220ms");
      expect(CSS_TRANSITIONS.thetaRelax).toContain("cubic-bezier(0.25, 0.1, 0.25, 1)");

      expect(CSS_TRANSITIONS.respiratorySinus).toContain("10000ms");
    });

    test("getReducedMotionTransition returns standard transition when motion is enabled", () => {
      const standard = CSS_TRANSITIONS.alphaMicro;
      const result = getReducedMotionTransition(standard, {
        prefersReducedMotion: false,
      });
      expect(result).toBe(standard);
    });

    test("getReducedMotionTransition returns fallback transition when reduced motion is preferred", () => {
      const standard = CSS_TRANSITIONS.alphaMicro;
      const result = getReducedMotionTransition(standard, {
        prefersReducedMotion: true,
      });
      expect(result).toBe(CSS_TRANSITIONS.reducedMotionFade);
    });

    test("getReducedMotionTransition respects custom fallback", () => {
      const result = getReducedMotionTransition("transform 200ms ease", {
        prefersReducedMotion: true,
        fallback: "none",
      });
      expect(result).toBe("none");
    });

    test("checkPrefersReducedMotion returns false in Node.js / non-browser test environment", () => {
      expect(checkPrefersReducedMotion()).toBe(false);
    });
  });

  describe("5. Bio-Mathematical Wave Oscillators", () => {
    test("computeAlphaWaveSample produces bounded harmonic values in [-1, 1]", () => {
      for (let t = 0; t <= 1.0; t += 0.05) {
        const val = computeAlphaWaveSample(t);
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      }
    });

    test("computeThetaWaveSample produces cosine oscillation within 4-7 Hz band", () => {
      for (let t = 0; t <= 1.0; t += 0.05) {
        const val = computeThetaWaveSample(t, 6.0);
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      }
    });

    test("getRespiratoryCycleState tracks 10s inhalation and exhalation rhythm", () => {
      const atStart = getRespiratoryCycleState(0);
      expect(atStart.phase).toBe("inhale");
      expect(atStart.progress).toBe(0);

      const midInhale = getRespiratoryCycleState(2000);
      expect(midInhale.phase).toBe("inhale");
      expect(midInhale.progress).toBeCloseTo(0.5);

      const atPeak = getRespiratoryCycleState(4000);
      expect(atPeak.phase).toBe("exhale");
      expect(atPeak.progress).toBe(0);

      const midExhale = getRespiratoryCycleState(7000);
      expect(midExhale.phase).toBe("exhale");
      expect(midExhale.progress).toBeCloseTo(0.5);
    });
  });
});

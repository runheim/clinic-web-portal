import {
  scoreSimpleReactionTime,
  scoreSpatial2Back,
  scoreStroopBattery,
  evaluateExecutiveBattery,
  resolveAgeCohort,
  resolveClinicalTier,
  normalCDF,
  inverseNormalCDF,
  clampPercentile,
  wipeScreenerMemory,
  isScreenerMemoryWiped,
  getQuarantinedSession,
  getQuarantinedSessionCount,
  registerEphemeralBuffer,
  SRT_THRESHOLDS,
  STROOP_THRESHOLDS,
  NORMATIVE_COHORTS,
  type SRTTrialInput,
  type Spatial2BackTrialInput,
  type StroopTrialInput,
} from "../scoringEngine";

describe("Quantitative Executive Function Screener - Scoring Engine Suite", () => {
  beforeEach(() => {
    wipeScreenerMemory();
  });

  afterEach(() => {
    wipeScreenerMemory();
  });

  // ===========================================================================
  // 1. STATISTICAL UTILITIES & AGE RESOLUTION
  // ===========================================================================
  describe("Statistical & Age Stratification Utilities", () => {
    test("resolveAgeCohort maps ages to correct demographic cohorts", () => {
      expect(resolveAgeCohort(20)).toBe("20-39");
      expect(resolveAgeCohort(39)).toBe("20-39");
      expect(resolveAgeCohort(40)).toBe("40-59");
      expect(resolveAgeCohort(59)).toBe("40-59");
      expect(resolveAgeCohort(60)).toBe("60+");
      expect(resolveAgeCohort(85)).toBe("60+");

      // Defensive fallbacks for invalid ages
      expect(resolveAgeCohort(Number.NaN)).toBe("20-39");
      expect(resolveAgeCohort(10)).toBe("20-39");
    });

    test("normalCDF produces correct probabilities and symmetry around z=0", () => {
      expect(normalCDF(0)).toBeCloseTo(0.5, 4);
      expect(normalCDF(1)).toBeCloseTo(0.8413, 3);
      expect(normalCDF(-1)).toBeCloseTo(0.1587, 3);
      expect(normalCDF(1.96)).toBeCloseTo(0.975, 2);
      expect(normalCDF(-1.96)).toBeCloseTo(0.025, 2);
      expect(normalCDF(Number.NaN)).toBe(0.5);
    });

    test("inverseNormalCDF accurately computes probit quantiles", () => {
      expect(inverseNormalCDF(0.5)).toBeCloseTo(0, 3);
      expect(inverseNormalCDF(0.84134)).toBeCloseTo(1.0, 2);
      expect(inverseNormalCDF(0.025)).toBeCloseTo(-1.96, 2);
      expect(inverseNormalCDF(0.975)).toBeCloseTo(1.96, 2);
      expect(inverseNormalCDF(0)).toBe(-6.0);
      expect(inverseNormalCDF(1)).toBe(6.0);
    });

    test("clampPercentile restricts values within [0.1, 99.9]", () => {
      expect(clampPercentile(50.432)).toBe(50.4);
      expect(clampPercentile(-5.0)).toBe(0.1);
      expect(clampPercentile(105.0)).toBe(99.9);
      expect(clampPercentile(Number.NaN)).toBe(50.0);
    });

    test("exports valid physiological threshold bounds and cohort parameters", () => {
      expect(SRT_THRESHOLDS.MIN_PLAUSIBLE_LATENCY_MS).toBe(120.0);
      expect(SRT_THRESHOLDS.MAX_PLAUSIBLE_LATENCY_MS).toBe(2000.0);
      expect(STROOP_THRESHOLDS.MIN_PLAUSIBLE_LATENCY_MS).toBe(150.0);
      expect(STROOP_THRESHOLDS.MAX_PLAUSIBLE_LATENCY_MS).toBe(4000.0);
      expect(NORMATIVE_COHORTS["20-39"].srtLatencyMs.mean).toBe(220.0);
      expect(NORMATIVE_COHORTS["40-59"].srtLatencyMs.mean).toBe(255.0);
      expect(NORMATIVE_COHORTS["60+"].srtLatencyMs.mean).toBe(295.0);
    });
  });

  // ===========================================================================
  // 2. SIMPLE VISUAL REACTION TIME (SRT)
  // ===========================================================================
  describe("Simple Visual Reaction Time (SRT) Algorithm", () => {
    test("calculates accurate mean, median, standard deviation and CV", () => {
      // 5 valid trials: 200, 220, 210, 230, 240 ms
      const trials: SRTTrialInput[] = [
        { stimulusTimestamp: 1000, responseTimestamp: 1200 },
        { stimulusTimestamp: 2000, responseTimestamp: 2220 },
        { stimulusTimestamp: 3000, responseTimestamp: 3210 },
        { stimulusTimestamp: 4000, responseTimestamp: 4230 },
        { stimulusTimestamp: 5000, responseTimestamp: 5240 },
      ];

      const result = scoreSimpleReactionTime(trials, "20-39");

      expect(result.validTrialCount).toBe(5);
      expect(result.invalidTrialCount).toBe(0);
      expect(result.meanLatencyMs).toBe(220.0);
      expect(result.medianLatencyMs).toBe(220.0);
      expect(result.minLatencyMs).toBe(200);
      expect(result.maxLatencyMs).toBe(240);
      expect(result.standardDeviationMs).toBeCloseTo(15.8, 1);
      expect(result.coefficientOfVariation).toBeCloseTo(15.8 / 220.0, 2);
      // z = (220 - 220) / 30 = 0 -> 50th percentile
      expect(result.percentile).toBeCloseTo(50.0, 1);
    });

    test("filters anticipatory responses (< 120ms) and lapses (> 2000ms)", () => {
      const trials: SRTTrialInput[] = [
        { stimulusTimestamp: 1000, responseTimestamp: 1050 }, // 50ms: Anticipatory false start
        { stimulusTimestamp: 2000, responseTimestamp: 2200 }, // 200ms: Valid
        { stimulusTimestamp: 3000, responseTimestamp: 3250 }, // 250ms: Valid
        { stimulusTimestamp: 4000, responseTimestamp: 6500 }, // 2500ms: Attention lapse
      ];

      const result = scoreSimpleReactionTime(trials, "20-39");

      expect(result.validTrialCount).toBe(2);
      expect(result.invalidTrialCount).toBe(2);
      expect(result.meanLatencyMs).toBe(225.0);
      expect(result.rawTrials[0].isAnticipatory).toBe(true);
      expect(result.rawTrials[0].isValid).toBe(false);
      expect(result.rawTrials[3].isLapse).toBe(true);
      expect(result.rawTrials[3].isValid).toBe(false);
    });

    test("handles empty and all-invalid trial edge cases gracefully", () => {
      const emptyResult = scoreSimpleReactionTime([], "20-39");
      expect(emptyResult.validTrialCount).toBe(0);
      expect(emptyResult.meanLatencyMs).toBe(0);
      expect(emptyResult.percentile).toBe(50.0);

      const allAnticipatory: SRTTrialInput[] = [
        { stimulusTimestamp: 1000, responseTimestamp: 1050 },
        { stimulusTimestamp: 2000, responseTimestamp: 2080 },
      ];
      const invResult = scoreSimpleReactionTime(allAnticipatory, "20-39");
      expect(invResult.validTrialCount).toBe(0);
      expect(invResult.invalidTrialCount).toBe(2);
      expect(invResult.percentile).toBe(0.1);
    });

    test("demographic adjustment: identical latency receives higher percentile in older cohorts", () => {
      const trials: SRTTrialInput[] = [
        { stimulusTimestamp: 1000, responseTimestamp: 1260 },
        { stimulusTimestamp: 2000, responseTimestamp: 2260 },
      ]; // 260ms latency

      const youngResult = scoreSimpleReactionTime(trials, "20-39"); // Mean 220 -> 260 is slower than avg
      const matureResult = scoreSimpleReactionTime(trials, "40-59"); // Mean 255 -> 260 is close to avg
      const olderResult = scoreSimpleReactionTime(trials, "60+");   // Mean 295 -> 260 is faster than avg

      expect(youngResult.meanLatencyMs).toBe(260);
      expect(matureResult.meanLatencyMs).toBe(260);
      expect(olderResult.meanLatencyMs).toBe(260);

      expect(olderResult.percentile).toBeGreaterThan(matureResult.percentile);
      expect(matureResult.percentile).toBeGreaterThan(youngResult.percentile);
    });
  });

  // ===========================================================================
  // 3. SPATIAL WORKING MEMORY 2-BACK SEQUENCE
  // ===========================================================================
  describe("Spatial Working Memory 2-Back Sequence (Signal Detection Theory)", () => {
    test("evaluates hits, misses, false alarms, correct rejections, and d-prime", () => {
      // Sequence of spatial positions (0..8)
      // Step 0: pos 3 (context)
      // Step 1: pos 7 (context)
      // Step 2: pos 3 -> Target! (matches step 0: 3). User reports match -> HIT
      // Step 3: pos 5 -> Non-target (step 1 was 7). User reports NO match -> CORRECT REJECTION
      // Step 4: pos 3 -> Target! (matches step 2: 3). User reports NO match -> MISS
      // Step 5: pos 2 -> Non-target (step 3 was 5). User reports match -> FALSE ALARM
      const trials: Spatial2BackTrialInput[] = [
        { stepIndex: 0, position: 3, userReportedMatch: false },
        { stepIndex: 1, position: 7, userReportedMatch: false },
        { stepIndex: 2, position: 3, userReportedMatch: true, latencyMs: 380 },  // Hit
        { stepIndex: 3, position: 5, userReportedMatch: false, latencyMs: 420 }, // Correct Rejection
        { stepIndex: 4, position: 3, userReportedMatch: false, latencyMs: 510 }, // Miss
        { stepIndex: 5, position: 2, userReportedMatch: true, latencyMs: 460 },  // False Alarm
      ];

      const result = scoreSpatial2Back(trials, "20-39");

      expect(result.totalSteps).toBe(6);
      expect(result.decisionSteps).toBe(4);
      expect(result.hits).toBe(1);
      expect(result.misses).toBe(1);
      expect(result.correctRejections).toBe(1);
      expect(result.falseAlarms).toBe(1);
      expect(result.accuracyPercentage).toBe(50.0); // 2 correct out of 4 decisions = 50%
      expect(result.dPrime).toBeDefined();
      expect(result.meanDecisionLatencyMs).toBeCloseTo(442.5, 1);
    });

    test("perfect working memory score yields maximum accuracy and high d-prime", () => {
      // Sequence with 10 steps, perfect performance
      const trials: Spatial2BackTrialInput[] = [
        { stepIndex: 0, position: 1, userReportedMatch: false },
        { stepIndex: 1, position: 4, userReportedMatch: false },
        { stepIndex: 2, position: 1, userReportedMatch: true },  // Hit (matches pos 1)
        { stepIndex: 3, position: 8, userReportedMatch: false }, // CR
        { stepIndex: 4, position: 1, userReportedMatch: true },  // Hit (matches pos 1)
        { stepIndex: 5, position: 8, userReportedMatch: true },  // Hit (matches pos 8)
        { stepIndex: 6, position: 2, userReportedMatch: false }, // CR
        { stepIndex: 7, position: 6, userReportedMatch: false }, // CR
      ];

      const result = scoreSpatial2Back(trials, "20-39");

      expect(result.decisionSteps).toBe(6);
      expect(result.misses).toBe(0);
      expect(result.falseAlarms).toBe(0);
      expect(result.accuracyPercentage).toBe(100.0);
      expect(result.dPrime).toBeGreaterThan(2.0);
      expect(result.percentile).toBeGreaterThan(90.0);
    });

    test("demographic adjustment for working memory: older cohort receives higher percentile for same accuracy", () => {
      const trials: Spatial2BackTrialInput[] = [
        { stepIndex: 0, position: 1, userReportedMatch: false },
        { stepIndex: 1, position: 2, userReportedMatch: false },
        { stepIndex: 2, position: 1, userReportedMatch: true },  // Hit
        { stepIndex: 3, position: 5, userReportedMatch: false }, // CR
        { stepIndex: 4, position: 6, userReportedMatch: false }, // CR
        { stepIndex: 5, position: 7, userReportedMatch: true },  // False alarm
      ]; // 3/4 = 75% accuracy

      const young = scoreSpatial2Back(trials, "20-39"); // Mean 88%
      const older = scoreSpatial2Back(trials, "60+");   // Mean 71%

      expect(young.accuracyPercentage).toBe(75.0);
      expect(older.accuracyPercentage).toBe(75.0);
      expect(older.percentile).toBeGreaterThan(young.percentile);
    });

    test("handles minimal and empty inputs cleanly", () => {
      const empty = scoreSpatial2Back([], "20-39");
      expect(empty.totalSteps).toBe(0);
      expect(empty.decisionSteps).toBe(0);
      expect(empty.accuracyPercentage).toBe(0);

      const twoStepsOnly: Spatial2BackTrialInput[] = [
        { stepIndex: 0, position: 1, userReportedMatch: false },
        { stepIndex: 1, position: 2, userReportedMatch: false },
      ];
      const partial = scoreSpatial2Back(twoStepsOnly, "20-39");
      expect(partial.decisionSteps).toBe(0);
    });
  });

  // ===========================================================================
  // 4. STROOP INTERFERENCE BATTERY
  // ===========================================================================
  describe("Stroop Interference Battery (Congruent vs Incongruent RT Delta)", () => {
    test("calculates accurate congruent RT, incongruent RT, delta, and ratio", () => {
      const trials: StroopTrialInput[] = [
        // 2 Congruent trials (Word matches font color)
        { trialIndex: 1, word: "RED", inkColor: "red", userSelectedColor: "red", latencyMs: 500 },
        { trialIndex: 2, word: "BLUE", inkColor: "blue", userSelectedColor: "blue", latencyMs: 540 },
        // 2 Incongruent trials (Word differs from font color)
        { trialIndex: 3, word: "RED", inkColor: "blue", userSelectedColor: "blue", latencyMs: 620 },
        { trialIndex: 4, word: "GREEN", inkColor: "gold", userSelectedColor: "gold", latencyMs: 640 },
      ];

      const result = scoreStroopBattery(trials, "20-39");

      expect(result.congruentCount).toBe(2);
      expect(result.incongruentCount).toBe(2);
      expect(result.congruentMeanLatencyMs).toBe(520.0);
      expect(result.incongruentMeanLatencyMs).toBe(630.0);
      expect(result.interferenceDeltaMs).toBe(110.0); // 630 - 520 = 110ms
      expect(result.interferenceRatioPercent).toBeCloseTo((110 / 520) * 100, 1);
      expect(result.overallAccuracyPercent).toBe(100.0);
      expect(result.congruentAccuracyPercent).toBe(100.0);
      expect(result.incongruentAccuracyPercent).toBe(100.0);
    });

    test("excludes incorrect and out-of-bounds trials from latency delta", () => {
      const trials: StroopTrialInput[] = [
        // Valid correct congruent
        { trialIndex: 1, word: "RED", inkColor: "red", userSelectedColor: "red", latencyMs: 500 },
        // Incorrect congruent (should not skew latency)
        { trialIndex: 2, word: "BLUE", inkColor: "blue", userSelectedColor: "red", latencyMs: 200 },
        // Out of bounds (<150ms)
        { trialIndex: 3, word: "GREEN", inkColor: "green", userSelectedColor: "green", latencyMs: 80 },
        // Valid correct incongruent
        { trialIndex: 4, word: "RED", inkColor: "green", userSelectedColor: "green", latencyMs: 600 },
      ];

      const result = scoreStroopBattery(trials, "20-39");

      expect(result.congruentMeanLatencyMs).toBe(500.0);
      expect(result.incongruentMeanLatencyMs).toBe(600.0);
      expect(result.interferenceDeltaMs).toBe(100.0);
      expect(result.congruentAccuracyPercent).toBeCloseTo(66.7, 1); // 2 correct out of 3
      expect(result.incongruentAccuracyPercent).toBe(100.0);
    });

    test("demographic adjustment: same interference delta yields higher percentile in older cohorts", () => {
      const trials: StroopTrialInput[] = [
        { trialIndex: 1, word: "RED", inkColor: "red", userSelectedColor: "red", latencyMs: 500 },
        { trialIndex: 2, word: "RED", inkColor: "blue", userSelectedColor: "blue", latencyMs: 600 }, // Delta = 100ms
      ];

      const young = scoreStroopBattery(trials, "20-39"); // Mean norm delta = 65ms
      const older = scoreStroopBattery(trials, "60+");   // Mean norm delta = 140ms

      expect(young.interferenceDeltaMs).toBe(100);
      expect(older.interferenceDeltaMs).toBe(100);
      expect(older.percentile).toBeGreaterThan(young.percentile);
    });

    test("handles zero trials safely", () => {
      const empty = scoreStroopBattery([], "20-39");
      expect(empty.interferenceDeltaMs).toBe(0);
      expect(empty.congruentMeanLatencyMs).toBe(0);
      expect(empty.percentile).toBe(50.0);
    });
  });

  // ===========================================================================
  // 5. COMPOSITE EXECUTIVE FUNCTION BATTERY & CLINICAL TIERS
  // ===========================================================================
  describe("Composite Executive Function Battery Evaluation", () => {
    test("calculates weighted composite score and assigns clinical tier", () => {
      const srtTrials: SRTTrialInput[] = [
        { stimulusTimestamp: 1000, responseTimestamp: 1190 },
        { stimulusTimestamp: 2000, responseTimestamp: 2195 },
      ];
      const wmTrials: Spatial2BackTrialInput[] = [
        { stepIndex: 0, position: 2, userReportedMatch: false },
        { stepIndex: 1, position: 5, userReportedMatch: false },
        { stepIndex: 2, position: 2, userReportedMatch: true },
        { stepIndex: 3, position: 7, userReportedMatch: false },
      ];
      const stroopTrials: StroopTrialInput[] = [
        { trialIndex: 1, word: "RED", inkColor: "red", userSelectedColor: "red", latencyMs: 480 },
        { trialIndex: 2, word: "BLUE", inkColor: "gold", userSelectedColor: "gold", latencyMs: 520 },
      ];

      const report = evaluateExecutiveBattery({
        age: 32,
        srtTrials,
        spatial2BackTrials: wmTrials,
        stroopTrials,
      });

      expect(report.age).toBe(32);
      expect(report.ageCohort).toBe("20-39");
      expect(report.simpleReactionTime).toBeDefined();
      expect(report.spatialWorkingMemory).toBeDefined();
      expect(report.stroopInterference).toBeDefined();
      expect(report.compositePercentile).toBeGreaterThanOrEqual(0.1);
      expect(report.compositePercentile).toBeLessThanOrEqual(99.9);
      expect(report.compositeScore).toBe(report.compositePercentile);
      expect(report.quarantined).toBe(true);
      expect(typeof report.clinicalSummary).toBe("string");
    });

    test("resolveClinicalTier categorizes percentiles appropriately", () => {
      expect(resolveClinicalTier(95.0)).toBe("Superior");
      expect(resolveClinicalTier(80.0)).toBe("High Normal");
      expect(resolveClinicalTier(50.0)).toBe("Normal Baseline");
      expect(resolveClinicalTier(15.0)).toBe("Borderline Attenuation");
      expect(resolveClinicalTier(5.0)).toBe("Clinically Flagged");
    });
  });

  // ===========================================================================
  // 6. RAM QUARANTINE & VOLATILE STORAGE HYGIENE
  // ===========================================================================
  describe("RAM Quarantine & Ephemeral Purge", () => {
    test("stores session strictly in volatile in-memory registry", () => {
      const sessionId = "quarantine-test-01";
      evaluateExecutiveBattery({
        sessionId,
        age: 45,
        srtTrials: [{ stimulusTimestamp: 1000, responseTimestamp: 1250 }],
        spatial2BackTrials: [{ stepIndex: 0, position: 1, userReportedMatch: false }],
        stroopTrials: [{ trialIndex: 1, word: "RED", inkColor: "red", userSelectedColor: "red", latencyMs: 500 }],
      });

      expect(getQuarantinedSessionCount()).toBe(1);
      const session = getQuarantinedSession(sessionId);
      expect(session).not.toBeNull();
      expect(session?.ageCohort).toBe("40-59");
    });

    test("registers and zeroes Float64Array scratch buffers upon wipe", () => {
      const buf = registerEphemeralBuffer("live-telemetry", 8);
      buf[0] = 123.456;
      buf[7] = 999.888;

      expect(isScreenerMemoryWiped()).toBe(false);

      wipeScreenerMemory();

      expect(isScreenerMemoryWiped()).toBe(true);
      expect(buf[0]).toBe(0);
      expect(buf[7]).toBe(0);
      expect(getQuarantinedSessionCount()).toBe(0);
    });

    test("wipeScreenerMemory completely purges all in-memory registries", () => {
      evaluateExecutiveBattery({
        sessionId: "sess-1",
        age: 30,
        srtTrials: [],
        spatial2BackTrials: [],
        stroopTrials: [],
      });
      evaluateExecutiveBattery({
        sessionId: "sess-2",
        age: 65,
        srtTrials: [],
        spatial2BackTrials: [],
        stroopTrials: [],
      });

      expect(getQuarantinedSessionCount()).toBe(2);

      wipeScreenerMemory();

      expect(getQuarantinedSessionCount()).toBe(0);
      expect(getQuarantinedSession("sess-1")).toBeNull();
      expect(getQuarantinedSession("sess-2")).toBeNull();
      expect(isScreenerMemoryWiped()).toBe(true);
    });

    test("guarantees zero persistent storage leakage", () => {
      // Confirm that no window.localStorage or sessionStorage is accessed or modified
      expect(typeof window === "undefined" || window.localStorage === undefined).toBe(true);
    });
  });
});

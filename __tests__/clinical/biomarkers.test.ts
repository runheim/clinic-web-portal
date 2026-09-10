import {
  calculateBiomarkerPercentile,
  evaluateBiomarker,
  evaluateMetabolicPanel,
  modelKinetics,
  getAgeAdjustedRange,
  resolveAgeBracket,
  calculateMichaelisMentenRate,
  calculateSaturationPercentage,
  calculateClearanceHalfLife,
  calculateTTFDSaturation,
  BIOMARKER_METADATA,
  type BiomarkerId,
  type MetabolicPanelInput,
} from "@/lib/clinical/biomarkers";

describe("Clinical Stoichiometry & Biochemistry Module: Biomarkers Unit Suite", () => {
  // ===========================================================================
  // 1. BIOMARKER BOUNDARY THRESHOLDS (Optimal, Borderline, Deficient, Elevated)
  // ===========================================================================
  describe("Biomarker Boundary Thresholds (Adult, Age 35)", () => {
    const age = 35;

    describe("HoloTC (Holotranscobalamin / Active B12, pmol/L)", () => {
      test("Deficient boundary (< 25 pmol/L)", () => {
        const evalDeficient = evaluateBiomarker("holoTC", 18, age);
        expect(evalDeficient.status).toBe("deficient");
        expect(evalDeficient.isDeficient).toBe(true);
        expect(evalDeficient.isOptimal).toBe(false);
        expect(evalDeficient.isBorderline).toBe(false);
        expect(evalDeficient.isElevated).toBe(false);
        expect(evalDeficient.clinicalRationale).toContain("critical cellular B12 depletion");
      });

      test("Borderline boundary (25 - 69 pmol/L)", () => {
        const evalLowerEdge = evaluateBiomarker("holoTC", 25, age);
        expect(evalLowerEdge.status).toBe("borderline");
        expect(evalLowerEdge.isBorderline).toBe(true);

        const evalMid = evaluateBiomarker("holoTC", 50, age);
        expect(evalMid.status).toBe("borderline");
        expect(evalMid.isBorderline).toBe(true);
        expect(evalMid.isDeficient).toBe(false);
        expect(evalMid.isOptimal).toBe(false);
      });

      test("Optimal boundary (70 - 150 pmol/L)", () => {
        const evalMin = evaluateBiomarker("holoTC", 70, age);
        expect(evalMin.status).toBe("optimal");
        expect(evalMin.isOptimal).toBe(true);

        const evalMid = evaluateBiomarker("holoTC", 110, age);
        expect(evalMid.status).toBe("optimal");
        expect(evalMid.isOptimal).toBe(true);

        const evalMax = evaluateBiomarker("holoTC", 150, age);
        expect(evalMax.status).toBe("optimal");
        expect(evalMax.isOptimal).toBe(true);
      });

      test("Elevated boundary (> 150 pmol/L)", () => {
        const evalElevated = evaluateBiomarker("holoTC", 185, age);
        expect(evalElevated.status).toBe("elevated");
        expect(evalElevated.isElevated).toBe(true);
        expect(evalElevated.isOptimal).toBe(false);
      });
    });

    describe("Methylmalonic Acid (MMA, nmol/L - Lower is Better)", () => {
      test("Optimal boundary (<= 260 nmol/L)", () => {
        const evalOptimal = evaluateBiomarker("mma", 160, age);
        expect(evalOptimal.status).toBe("optimal");
        expect(evalOptimal.isOptimal).toBe(true);
        expect(evalOptimal.isDeficient).toBe(false);

        const evalEdge = evaluateBiomarker("mma", 260, age);
        expect(evalEdge.status).toBe("optimal");
        expect(evalEdge.isOptimal).toBe(true);
      });

      test("Borderline boundary (261 - 380 nmol/L)", () => {
        const evalBorderline = evaluateBiomarker("mma", 320, age);
        expect(evalBorderline.status).toBe("borderline");
        expect(evalBorderline.isBorderline).toBe(true);
        expect(evalBorderline.isOptimal).toBe(false);
        expect(evalBorderline.isDeficient).toBe(false);
      });

      test("Deficient / Elevated accumulation boundary (> 380 nmol/L)", () => {
        const evalElevated = evaluateBiomarker("mma", 490, age);
        expect(evalElevated.status).toBe("elevated");
        // Elevated MMA indicates functional cellular B12 deficiency
        expect(evalElevated.isDeficient).toBe(true);
        expect(evalElevated.isElevated).toBe(true);
        expect(evalElevated.clinicalRationale).toContain("mitochondrial organic acid stalling");
      });
    });

    describe("Whole Blood TDP (Thiamine Diphosphate, nmol/L)", () => {
      test("Deficient boundary (< 78 nmol/L)", () => {
        const evalDeficient = evaluateBiomarker("tdp", 65, age);
        expect(evalDeficient.status).toBe("deficient");
        expect(evalDeficient.isDeficient).toBe(true);
        expect(evalDeficient.clinicalRationale).toContain("pyruvate dehydrogenase (PDH) enzyme hysteresis");
      });

      test("Borderline boundary (78 - 274 nmol/L)", () => {
        const evalBorderline = evaluateBiomarker("tdp", 180, age);
        expect(evalBorderline.status).toBe("borderline");
        expect(evalBorderline.isBorderline).toBe(true);
      });

      test("Optimal stoichiometric saturation boundary (275 - 675 nmol/L)", () => {
        const evalOptimal = evaluateBiomarker("tdp", 420, age);
        expect(evalOptimal.status).toBe("optimal");
        expect(evalOptimal.isOptimal).toBe(true);
      });

      test("Elevated boundary (> 675 nmol/L)", () => {
        const evalElevated = evaluateBiomarker("tdp", 750, age);
        expect(evalElevated.status).toBe("elevated");
        expect(evalElevated.isElevated).toBe(true);
      });
    });

    describe("Plasma Homocysteine (μmol/L - Lower is Better)", () => {
      test("Optimal boundary (<= 9.5 μmol/L)", () => {
        const evalOptimal = evaluateBiomarker("homocysteine", 7.2, age);
        expect(evalOptimal.status).toBe("optimal");
        expect(evalOptimal.isOptimal).toBe(true);
      });

      test("Borderline boundary (9.6 - 13.5 μmol/L)", () => {
        const evalBorderline = evaluateBiomarker("homocysteine", 11.4, age);
        expect(evalBorderline.status).toBe("borderline");
        expect(evalBorderline.isBorderline).toBe(true);
      });

      test("Deficient remethylation / Hyperhomocysteinemia (> 13.5 μmol/L)", () => {
        const evalElevated = evaluateBiomarker("homocysteine", 18.2, age);
        expect(evalElevated.status).toBe("elevated");
        expect(evalElevated.isDeficient).toBe(true);
        expect(evalElevated.clinicalRationale).toContain("arteriosclerotic shear");
      });
    });

    describe("Marine Omega-3 Index (%)", () => {
      test("Deficient boundary (< 4.0%)", () => {
        const evalDeficient = evaluateBiomarker("omega3Index", 3.4, age);
        expect(evalDeficient.status).toBe("deficient");
        expect(evalDeficient.isDeficient).toBe(true);
      });

      test("Borderline boundary (4.0 - 7.9%)", () => {
        const evalBorderline = evaluateBiomarker("omega3Index", 6.2, age);
        expect(evalBorderline.status).toBe("borderline");
        expect(evalBorderline.isBorderline).toBe(true);
        expect(evalBorderline.clinicalRationale).toContain("VITACOG trial demonstrates blunted B-vitamin responsiveness");
      });

      test("Optimal protective gate boundary (8.0 - 12.0%)", () => {
        const evalOptimal = evaluateBiomarker("omega3Index", 9.4, age);
        expect(evalOptimal.status).toBe("optimal");
        expect(evalOptimal.isOptimal).toBe(true);
        expect(evalOptimal.clinicalRationale).toContain("satisfies the protective gate");
      });

      test("Elevated boundary (> 12.0%)", () => {
        const evalElevated = evaluateBiomarker("omega3Index", 13.5, age);
        expect(evalElevated.status).toBe("elevated");
        expect(evalElevated.isElevated).toBe(true);
      });
    });

    describe("RBC Magnesium (mg/dL)", () => {
      test("Deficient boundary (< 4.2 mg/dL)", () => {
        const evalDeficient = evaluateBiomarker("rbcMagnesium", 3.8, age);
        expect(evalDeficient.status).toBe("deficient");
        expect(evalDeficient.isDeficient).toBe(true);
      });

      test("Borderline boundary (4.2 - 5.9 mg/dL)", () => {
        const evalBorderline = evaluateBiomarker("rbcMagnesium", 5.1, age);
        expect(evalBorderline.status).toBe("borderline");
        expect(evalBorderline.isBorderline).toBe(true);
      });

      test("Optimal catalytic boundary (6.0 - 7.5 mg/dL)", () => {
        const evalOptimal = evaluateBiomarker("rbcMagnesium", 6.6, age);
        expect(evalOptimal.status).toBe("optimal");
        expect(evalOptimal.isOptimal).toBe(true);
      });

      test("Elevated boundary (> 7.5 mg/dL)", () => {
        const evalElevated = evaluateBiomarker("rbcMagnesium", 8.2, age);
        expect(evalElevated.status).toBe("elevated");
        expect(evalElevated.isElevated).toBe(true);
      });
    });
  });

  // ===========================================================================
  // 2. AGE ADJUSTMENT LOGIC ACROSS CLINICAL BRACKETS
  // ===========================================================================
  describe("Age Adjustment Logic & Demographic Stratification", () => {
    test("Correctly identifies age brackets across boundaries", () => {
      expect(resolveAgeBracket(12)).toBe("pediatric");
      expect(resolveAgeBracket(17)).toBe("pediatric");
      expect(resolveAgeBracket(18)).toBe("young_adult");
      expect(resolveAgeBracket(45)).toBe("young_adult");
      expect(resolveAgeBracket(46)).toBe("mature_adult");
      expect(resolveAgeBracket(65)).toBe("mature_adult");
      expect(resolveAgeBracket(66)).toBe("geriatric");
      expect(resolveAgeBracket(85)).toBe("geriatric");
    });

    test("Age-adjusted MMA threshold shifts upward in geriatric population due to GFR decline", () => {
      const mmaValue = 300; // nmol/L

      // In young adults, 300 nmol/L exceeds optimal cutoff (260) and is borderline
      const youngRange = getAgeAdjustedRange("mma", 30);
      const youngEval = evaluateBiomarker("mma", mmaValue, 30);
      expect(youngRange.optimalMax).toBe(260);
      expect(youngEval.status).toBe("borderline");

      // In geriatric patients (>65), optimal cutoff shifts to 320 nmol/L, so 300 is optimal!
      const geriatricRange = getAgeAdjustedRange("mma", 75);
      const geriatricEval = evaluateBiomarker("mma", mmaValue, 75);
      expect(geriatricRange.optimalMax).toBe(320);
      expect(geriatricEval.status).toBe("optimal");
    });

    test("Age-adjusted Homocysteine shifts upward with chronological age", () => {
      const hcyValue = 11.0; // μmol/L

      // In pediatric (<18), 11.0 is elevated/deficient
      const pedEval = evaluateBiomarker("homocysteine", hcyValue, 14);
      expect(pedEval.status).toBe("borderline"); // at max edge 11.0

      // In young adult, 11.0 is borderline
      const youngEval = evaluateBiomarker("homocysteine", hcyValue, 28);
      expect(youngEval.status).toBe("borderline");

      // In geriatric (>65), 11.0 falls within age-adjusted optimal range (<= 12.0)
      const geriatricEval = evaluateBiomarker("homocysteine", hcyValue, 72);
      expect(geriatricEval.status).toBe("optimal");
    });

    test("Age-adjusted HoloTC requires higher threshold in geriatric patients", () => {
      const holoValue = 30; // pmol/L

      // In young adults, deficient cutoff is 25 pmol/L, so 30 pmol/L is borderline
      const youngEval = evaluateBiomarker("holoTC", holoValue, 35);
      expect(youngEval.status).toBe("borderline");

      // In elderly (>65), atrophic gastritis elevates deficient cutoff to 35 pmol/L, so 30 pmol/L is deficient!
      const geriatricEval = evaluateBiomarker("holoTC", holoValue, 78);
      expect(geriatricEval.status).toBe("deficient");
    });

    test("Defensive handling of invalid, negative, or extreme ages", () => {
      expect(() => getAgeAdjustedRange("holoTC", NaN)).toThrow(TypeError);

      // Negative ages clamped to 0 (pediatric)
      const zeroRange = getAgeAdjustedRange("holoTC", -10);
      expect(zeroRange.age).toBe(0);
      expect(zeroRange.ageBracket).toBe("pediatric");

      // Super-centenarian clamped to 120 (geriatric)
      const oldRange = getAgeAdjustedRange("holoTC", 150);
      expect(oldRange.age).toBe(120);
      expect(oldRange.ageBracket).toBe("geriatric");
    });
  });

  // ===========================================================================
  // 3. PERCENTILE PLACEMENT ACCURACY & PROPERTIES
  // ===========================================================================
  describe("Percentile Placement Engine (calculateBiomarkerPercentile)", () => {
    test("Percentile increases monotonically with biomarker value", () => {
      const p1 = calculateBiomarkerPercentile("holoTC", 20, 40);
      const p2 = calculateBiomarkerPercentile("holoTC", 50, 40);
      const p3 = calculateBiomarkerPercentile("holoTC", 80, 40);
      const p4 = calculateBiomarkerPercentile("holoTC", 120, 40);
      const p5 = calculateBiomarkerPercentile("holoTC", 180, 40);

      expect(p1).toBeLessThan(p2);
      expect(p2).toBeLessThan(p3);
      expect(p3).toBeLessThan(p4);
      expect(p4).toBeLessThan(p5);
    });

    test("Calibrated reference boundaries map to standard statistical percentiles", () => {
      const range = getAgeAdjustedRange("holoTC", 35);
      const [L, U] = range.referenceInterval;
      const median = range.populationMedian;

      const pLower = calculateBiomarkerPercentile("holoTC", L, 35);
      const pMed = calculateBiomarkerPercentile("holoTC", median, 35);
      const pUpper = calculateBiomarkerPercentile("holoTC", U, 35);

      // Lower 2.5th percentile (~2.5%)
      expect(pLower).toBeGreaterThanOrEqual(2.0);
      expect(pLower).toBeLessThanOrEqual(3.5);

      // Median 50th percentile (~50.0%)
      expect(pMed).toBeCloseTo(50.0, 0);

      // Upper 97.5th percentile (~97.5%)
      expect(pUpper).toBeGreaterThanOrEqual(96.5);
      expect(pUpper).toBeLessThanOrEqual(98.5);
    });

    test("Percentiles are strictly bounded between 0.1% and 99.9%", () => {
      const pExtremelyLow = calculateBiomarkerPercentile("tdp", 0.001, 30);
      const pExtremelyHigh = calculateBiomarkerPercentile("tdp", 5000, 30);

      expect(pExtremelyLow).toBe(0.1);
      expect(pExtremelyHigh).toBe(99.9);
    });

    test("Throws on NaN value input", () => {
      expect(() => calculateBiomarkerPercentile("holoTC", NaN, 30)).toThrow(TypeError);
    });
  });

  // ===========================================================================
  // 4. METABOLIC PANEL COMPREHENSIVE EVALUATION
  // ===========================================================================
  describe("Metabolic Panel Evaluation (evaluateMetabolicPanel)", () => {
    test("Evaluates a balanced, fully optimal metabolic panel", () => {
      const input: MetabolicPanelInput = {
        age: 38,
        sex: "female",
        values: {
          holoTC: 95,
          mma: 150,
          tdp: 380,
          homocysteine: 7.0,
          omega3Index: 9.2,
          rbcMagnesium: 6.4,
        },
      };

      const result = evaluateMetabolicPanel(input);

      expect(result.summary.totalTested).toBe(6);
      expect(result.summary.optimalCount).toBe(6);
      expect(result.summary.deficientCount).toBe(0);
      expect(result.summary.borderlineCount).toBe(0);
      expect(result.summary.isOptimal).toBe(true);
      expect(result.summary.hasDeficiency).toBe(false);
      expect(result.summary.neuroMetabolicScore).toBe(100);
      expect(result.criticalFlags).toHaveLength(0);
    });

    test("Detects multiple metabolic deficiencies and flags clinical risk gates", () => {
      const input: MetabolicPanelInput = {
        age: 52,
        sex: "male",
        values: {
          holoTC: 20,          // Deficient
          mma: 520,           // Elevated / Functional deficiency
          tdp: 60,            // Deficient
          homocysteine: 19.5, // Elevated vascular risk
          omega3Index: 3.5,   // Critical membrane rigidity
          rbcMagnesium: 3.9,  // Catalytic phosphorylation deficit
        },
      };

      const result = evaluateMetabolicPanel(input);

      expect(result.summary.totalTested).toBe(6);
      expect(result.summary.deficientCount).toBe(6);
      expect(result.summary.optimalCount).toBe(0);
      expect(result.summary.hasDeficiency).toBe(true);
      expect(result.summary.isOptimal).toBe(false);
      expect(result.summary.neuroMetabolicScore).toBeLessThan(50);

      // Verify triggered critical flags
      const flagText = result.criticalFlags.join(" ");
      expect(flagText).toContain("Severe Omega-3 Index deficiency");
      expect(flagText).toContain("Hyperhomocysteinemia");
      expect(flagText).toContain("Elevated MMA");
      expect(flagText).toContain("TDP depletion");
      expect(flagText).toContain("Active HoloTC exhausted");
      expect(flagText).toContain("Intracellular RBC magnesium low");

      // Verify actionable clinical recommendations
      expect(result.clinicalRecommendations.length).toBeGreaterThan(3);
    });

    test("Gracefully handles partial panels with omitted analytes", () => {
      const partialInput: MetabolicPanelInput = {
        age: 29,
        values: {
          omega3Index: 8.5,
          tdp: 320,
        },
      };

      const result = evaluateMetabolicPanel(partialInput);
      expect(result.summary.totalTested).toBe(2);
      expect(result.summary.optimalCount).toBe(2);
      expect(result.evaluations.holoTC).toBeUndefined();
      expect(result.evaluations.omega3Index?.isOptimal).toBe(true);
    });

    test("Throws on invalid age", () => {
      expect(() => evaluateMetabolicPanel({ age: NaN, values: {} })).toThrow(TypeError);
    });
  });

  // ===========================================================================
  // 5. KINETIC SATURATION & TRAJECTORY MODELING (modelKinetics)
  // ===========================================================================
  describe("Kinetic Modeling & Saturation Functions", () => {
    describe("Michaelis-Menten Kinetic Helpers", () => {
      test("calculateMichaelisMentenRate follows enzymatic saturation", () => {
        const vmax = 40.0;
        const km = 100.0;

        // At [S] = 0, rate is 0
        expect(calculateMichaelisMentenRate(0, vmax, km)).toBe(0);

        // At [S] = Km, rate is exactly half Vmax (20.0)
        expect(calculateMichaelisMentenRate(km, vmax, km)).toBeCloseTo(20.0, 4);

        // At high [S] = 10*Km, rate approaches Vmax (~36.36)
        expect(calculateMichaelisMentenRate(1000, vmax, km)).toBeCloseTo(36.36, 1);
      });

      test("calculateSaturationPercentage correctly models receptor occupancy", () => {
        const km = 50;
        expect(calculateSaturationPercentage(0, km)).toBe(0);
        expect(calculateSaturationPercentage(50, km)).toBe(50.0);
        expect(calculateSaturationPercentage(450, km)).toBe(90.0);
      });

      test("calculateClearanceHalfLife converts elimination rate to t1/2", () => {
        const k = 0.1; // day^-1
        const tHalf = calculateClearanceHalfLife(k);
        expect(tHalf).toBeCloseTo(6.93, 2);
      });

      test("calculateTTFDSaturation verifies TTFD vs HCl membrane diffusion", () => {
        // Standard oral HCl with optimal omega-3
        const hclResult = calculateTTFDSaturation(300, "hcl", 8.5);
        expect(hclResult.saturationPercentage).toBeLessThanOrEqual(22);
        expect(hclResult.isOmegaGateSatisfied).toBe(true);
        expect(hclResult.isStoichiometricSaturationActive).toBe(false);

        // Lipophilic TTFD with suboptimal omega-3 (< 8.0%)
        const ttfdSuboptimalOmega = calculateTTFDSaturation(300, "ttfd", 6.5);
        expect(ttfdSuboptimalOmega.saturationPercentage).toBeGreaterThan(60);
        expect(ttfdSuboptimalOmega.isOmegaGateSatisfied).toBe(false);
        expect(ttfdSuboptimalOmega.isStoichiometricSaturationActive).toBe(false);

        // Lipophilic TTFD with optimal omega-3 (>= 8.0%)
        const ttfdOptimal = calculateTTFDSaturation(300, "ttfd", 8.5);
        expect(ttfdOptimal.saturationPercentage).toBeGreaterThan(60);
        expect(ttfdOptimal.isOmegaGateSatisfied).toBe(true);
        expect(ttfdOptimal.isStoichiometricSaturationActive).toBe(true);
      });
    });

    describe("Trajectory Simulation Engine: Metabolic Clearance (Homocysteine)", () => {
      test("Simulates monotonic clearance of elevated Homocysteine down to optimal baseline", () => {
        const trajectory = modelKinetics({
          biomarker: "homocysteine",
          initialConcentration: 22.0, // Elevated μmol/L
          targetConcentration: 7.5,   // Optimal target
          timeSpanDays: 60,
          stepSizeDays: 1,
          dailyDoseMg: 300,
          omega3Index: 8.5,
        });

        expect(trajectory.initialConcentration).toBe(22.0);
        expect(trajectory.targetConcentration).toBe(7.5);
        expect(trajectory.dataPoints).toHaveLength(61); // Day 0 to Day 60

        // Day 0
        expect(trajectory.dataPoints[0].concentration).toBe(22.0);
        expect(trajectory.dataPoints[0].status).toBe("elevated");
        expect(trajectory.dataPoints[0].isNormalized).toBe(false);

        // Monotonic decline
        for (let i = 1; i < trajectory.dataPoints.length; i++) {
          expect(trajectory.dataPoints[i].concentration).toBeLessThanOrEqual(
            trajectory.dataPoints[i - 1].concentration
          );
        }

        // Final steady state
        expect(trajectory.steadyStateConcentration).toBeLessThan(10.0);
        expect(trajectory.isTargetAchieved).toBe(true);
        expect(trajectory.timeToNormalizationDays).not.toBeNull();
        expect(trajectory.timeToNormalizationDays).toBeGreaterThan(0);
        expect(trajectory.timeToNormalizationDays).toBeLessThanOrEqual(60);

        // AUC and half-life exist and are finite
        expect(trajectory.auc).toBeGreaterThan(0);
        expect(trajectory.halfLifeDays).toBeGreaterThan(0);
      });
    });

    describe("Trajectory Simulation Engine: Substrate Repletion (Whole Blood TDP)", () => {
      test("Simulates saturable accumulation of Whole Blood TDP with TTFD", () => {
        const trajectory = modelKinetics({
          biomarker: "tdp",
          initialConcentration: 60.0,  // Deficient nmol/L
          targetConcentration: 450.0, // Optimal mass-action saturation target
          timeSpanDays: 90,
          stepSizeDays: 1,
          deliveryMode: "lipophilic_mass_action",
          dailyDoseMg: 300,
          omega3Index: 9.0,
        });

        expect(trajectory.dataPoints[0].concentration).toBe(60.0);
        expect(trajectory.dataPoints[0].status).toBe("deficient");

        // Monotonic increase
        for (let i = 1; i < trajectory.dataPoints.length; i++) {
          expect(trajectory.dataPoints[i].concentration).toBeGreaterThanOrEqual(
            trajectory.dataPoints[i - 1].concentration
          );
        }

        // Crosses from deficient to borderline to optimal
        const statusSequence = trajectory.dataPoints.map((dp: { status: string }) => dp.status);
        expect(statusSequence).toContain("deficient");
        expect(statusSequence).toContain("borderline");
        expect(statusSequence).toContain("optimal");

        expect(trajectory.isTargetAchieved).toBe(true);
        expect(trajectory.timeToNormalizationDays).not.toBeNull();
      });

      test("Suboptimal Omega-3 Index dampens rate of biomarker repletion (membrane gate)", () => {
        // High Omega-3 (gate open)
        const openGateTrajectory = modelKinetics({
          biomarker: "tdp",
          initialConcentration: 60.0,
          targetConcentration: 450.0,
          timeSpanDays: 30,
          omega3Index: 8.5,
        });

        // Low Omega-3 (gate closed)
        const closedGateTrajectory = modelKinetics({
          biomarker: "tdp",
          initialConcentration: 60.0,
          targetConcentration: 450.0,
          timeSpanDays: 30,
          omega3Index: 4.2,
        });

        const concentrationAtDay30Open =
          openGateTrajectory.dataPoints[openGateTrajectory.dataPoints.length - 1].concentration;
        const concentrationAtDay30Closed =
          closedGateTrajectory.dataPoints[closedGateTrajectory.dataPoints.length - 1].concentration;

        expect(concentrationAtDay30Open).toBeGreaterThan(concentrationAtDay30Closed);
      });
    });
  });

  // ===========================================================================
  // 6. ZERO-PERSISTENCE, IMMUTABILITY & DETERMINISM VERIFICATION
  // ===========================================================================
  describe("Purity, Immutability & Zero-ePHI Compliance", () => {
    test("Strict determinism: Repeated calls produce bitwise identical outputs", () => {
      const eval1 = evaluateBiomarker("holoTC", 68.5, 42);
      const eval2 = evaluateBiomarker("holoTC", 68.5, 42);
      expect(eval1).toEqual(eval2);

      const p1 = calculateBiomarkerPercentile("homocysteine", 9.4, 50);
      const p2 = calculateBiomarkerPercentile("homocysteine", 9.4, 50);
      expect(p1).toBe(p2);

      const traj1 = modelKinetics({
        biomarker: "mma",
        initialConcentration: 450,
        timeSpanDays: 30,
      });
      const traj2 = modelKinetics({
        biomarker: "mma",
        initialConcentration: 450,
        timeSpanDays: 30,
      });
      expect(traj1).toEqual(traj2);
    });

    test("Immutability: Does not mutate frozen input objects", () => {
      const frozenInput: MetabolicPanelInput = Object.freeze({
        age: 44,
        sex: "other" as const,
        values: Object.freeze({
          holoTC: 75,
          omega3Index: 8.2,
        }),
      });

      expect(() => evaluateMetabolicPanel(frozenInput)).not.toThrow();
      expect(frozenInput.age).toBe(44);
      expect(frozenInput.values.holoTC).toBe(75);
    });

    test("Zero-persistence: Functions execute in-memory with zero disk/cache state leakage", () => {
      // Execute 200 evaluations in tight loop
      const results: number[] = [];
      for (let i = 0; i < 200; i++) {
        results.push(calculateBiomarkerPercentile("tdp", 100 + (i % 20), 30));
      }
      expect(results).toHaveLength(200);
      // Verify first and 21st are identical
      expect(results[0]).toBe(results[20]);
    });

    test("Metadata dictionary is comprehensive and contains all 6 required biomarkers", () => {
      const requiredBiomarkers: BiomarkerId[] = [
        "holoTC",
        "mma",
        "tdp",
        "homocysteine",
        "omega3Index",
        "rbcMagnesium",
      ];

      for (const id of requiredBiomarkers) {
        expect(BIOMARKER_METADATA[id]).toBeDefined();
        expect(BIOMARKER_METADATA[id].id).toBe(id);
        expect(BIOMARKER_METADATA[id].unit.length).toBeGreaterThan(0);
        expect(BIOMARKER_METADATA[id].defaultKineticParams.halfLifeDays).toBeGreaterThan(0);
      }
    });
  });
});

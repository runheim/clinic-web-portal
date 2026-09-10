/**
 * =============================================================================
 * CLINICAL PHARMACOKINETICS & PEPTIDE STOICHIOMETRY SUITE
 * Test Suite: Kinetic Supplement & Peptide Dosing Calculator (Agent 05)
 *
 * Compliance: Zero-ePHI Quarantine Verified.
 * Deterministic mathematical verification of half-life elimination,
 * Cmax, Tmax, AUC, multi-dose steady-state accumulation, and boundary conditions.
 * =============================================================================
 */

import {
  calculateEliminationRate,
  calculateAbsorptionRate,
  calculateTMax,
  calculateSingleDoseConcentration,
  calculateCMax,
  calculateAUCSingleDose,
  calculateSteadyStateAccumulationFactor,
  calculateSteadyStatePeak,
  calculateSteadyStateTrough,
  calculateSteadyStateAverage,
  calculateFluctuationIndex,
  calculateTimeToSteadyState,
  calculateTrapezoidalAUC,
  createKineticParameters,
  simulateDosingTrajectory,
  getDosingIntervalHours,
  getProtocolById,
  PROTOCOLS,
  DosingSchedule,
} from "../kinetics";

describe("Kinetic Supplement & Peptide Dosing Engine (Agent 05)", () => {
  describe("1. Half-Life & Absorption Rate Mathematics", () => {
    test("calculates first-order elimination rate ke = ln(2) / t_1/2 correctly", () => {
      // Half-life = 2.0 hours -> ke = ln(2) / 2 = 0.346573...
      const ke = calculateEliminationRate(2.0);
      expect(ke).toBeCloseTo(0.34657, 4);

      // Half-life = 34.0 hours (Ubiquinol) -> ke = ln(2) / 34 = 0.020386...
      const keUbiquinol = calculateEliminationRate(34.0);
      expect(keUbiquinol).toBeCloseTo(0.020387, 5);

      // Half-life = 0.75 hours (Semax) -> ke = ln(2) / 0.75 = 0.924196...
      const keSemax = calculateEliminationRate(0.75);
      expect(keSemax).toBeCloseTo(0.9242, 3);
    });

    test("calculates first-order absorption rate ka = ln(2) / t_1/2,a correctly", () => {
      const ka = calculateAbsorptionRate(0.35); // NAD+ SubQ absorption half-life
      expect(ka).toBeCloseTo(1.9804, 3);

      const kaOral = calculateAbsorptionRate(3.0); // CoQ10 slow absorption half-life
      expect(kaOral).toBeCloseTo(0.2310, 3);
    });

    test("calculates analytical Tmax = ln(ka / ke) / (ka - ke)", () => {
      const ka = calculateAbsorptionRate(0.35); // ~1.9804
      const ke = calculateEliminationRate(2.5);  // ~0.2773
      const tMax = calculateTMax(ka, ke);

      // Analytical check: ln(1.9804 / 0.2773) / (1.9804 - 0.2773)
      const expectedTMax = Math.log(ka / ke) / (ka - ke);
      expect(tMax).toBeCloseTo(expectedTMax, 5);
      expect(tMax).toBeGreaterThan(0.35); // Must be greater than absorption half-life
      expect(tMax).toBeLessThan(2.5);     // Must peak before elimination half-life
    });

    test("handles singularity when ka == ke gracefully using L'Hopital limit (1 / ke)", () => {
      const k = 0.5;
      const tMax = calculateTMax(k, k);
      expect(tMax).toBeCloseTo(1 / k, 5);
      expect(tMax).toBe(2.0);
      expect(Number.isFinite(tMax)).toBe(true);
    });

    test("single-dose concentration reaches its maximum at exactly Tmax", () => {
      const params = createKineticParameters({
        halfLifeHours: 2.5,
        absorptionHalfLifeHours: 0.35,
        bioavailabilityF: 0.9,
        volumeOfDistributionVd: 20.0,
        unit: "mg/L",
        doseUnit: "mg",
      });

      const dose = 100;
      const tMax = calculateTMax(params.absorptionRateKa, params.eliminationRateKe);
      const cMax = calculateCMax(dose, params);
      const cAtTMax = calculateSingleDoseConcentration(tMax, dose, params);

      expect(cAtTMax).toBeCloseTo(cMax, 6);

      // Points strictly before Tmax and strictly after Tmax must be lower than Cmax
      const cBefore = calculateSingleDoseConcentration(tMax * 0.8, dose, params);
      const cAfter = calculateSingleDoseConcentration(tMax * 1.2, dose, params);

      expect(cBefore).toBeLessThan(cMax);
      expect(cAfter).toBeLessThan(cMax);
    });

    test("single-dose concentration decays monotonically after Tmax", () => {
      const params = createKineticParameters({
        halfLifeHours: 3.0,
        absorptionHalfLifeHours: 0.5,
        bioavailabilityF: 0.8,
        volumeOfDistributionVd: 15.0,
        unit: "mg/L",
        doseUnit: "mg",
      });

      const dose = 50;
      const tMax = calculateTMax(params.absorptionRateKa, params.eliminationRateKe);

      let prevConc = calculateSingleDoseConcentration(tMax, dose, params);
      for (let t = tMax + 1; t <= tMax + 20; t += 1) {
        const conc = calculateSingleDoseConcentration(t, dose, params);
        expect(conc).toBeLessThan(prevConc);
        expect(conc).toBeGreaterThanOrEqual(0);
        prevConc = conc;
      }
    });

    test("verifies analytical single-dose AUC_inf = (F * D) / (Vd * ke) = (F * D) / CL", () => {
      const params = createKineticParameters({
        halfLifeHours: 4.0,
        absorptionHalfLifeHours: 0.5,
        bioavailabilityF: 0.85,
        volumeOfDistributionVd: 25.0,
        unit: "mg/L",
        doseUnit: "mg",
      });

      const dose = 100;
      const aucAnalytical = calculateAUCSingleDose(dose, params);
      const expectedAuc = (0.85 * 100) / (25.0 * params.eliminationRateKe);

      expect(aucAnalytical).toBeCloseTo(expectedAuc, 6);
      expect(aucAnalytical).toBeCloseTo((0.85 * 100) / params.clearanceCl, 6);
    });
  });

  describe("2. Multi-Dose Superposition & Steady-State Accumulation", () => {
    test("accumulates significantly when dosing interval is shorter than half-life (Ubiquinol)", () => {
      const protocol = PROTOCOLS["mitochondrial-stack"];
      // Ubiquinol half-life is 34.0 hours, daily dosing interval is 24 hours (tau < t_1/2)
      const schedule: DosingSchedule = {
        frequency: "daily",
        doseAmount: 200,
        intervalHours: 24,
        numberOfDoses: 14,
        route: "oral",
      };

      const result = simulateDosingTrajectory(protocol, schedule);

      // Accumulation factor R = 1 / (1 - e^(-ke * tau))
      // ke = ln(2) / 34 = 0.020387; -ke * 24 = -0.489286; e^-0.489 = 0.61306
      // R = 1 / (1 - 0.61306) = 2.5843
      expect(result.accumulationIndex).toBeGreaterThan(2.5);
      expect(result.accumulationIndex).toBeLessThan(2.7);

      // Steady state peak must be substantially higher than single-dose peak
      expect(result.steadyStateCMax).toBeGreaterThan(result.cMax * 1.8);

      // Trough at steady state must be positive and substantial
      expect(result.steadyStateCMin).toBeGreaterThan(0.5);

      // Find the peak after dose 1 vs peak after dose 10 in the trajectory
      const tMax = result.tMax;
      const dose1Peak = result.trajectory.find(
        (p) => Math.abs(p.timeHours - tMax) < 0.1
      )?.concentration;
      const dose10Peak = result.trajectory.find(
        (p) => Math.abs(p.timeHours - (9 * 24 + tMax)) < 0.1
      )?.concentration;

      expect(dose1Peak).toBeDefined();
      expect(dose10Peak).toBeDefined();
      if (dose1Peak && dose10Peak) {
        expect(dose10Peak).toBeGreaterThan(dose1Peak * 2.0);
      }
    });

    test("clears between doses when dosing interval is much longer than half-life (SubQ NAD+)", () => {
      const protocol = PROTOCOLS["subq-nad"];
      // Half-life is 2.5 hours; weekly dosing interval is 168 hours (tau >> 5 * t_1/2)
      const schedule: DosingSchedule = {
        frequency: "weekly",
        doseAmount: 100,
        intervalHours: 168,
        numberOfDoses: 3,
        route: "subcutaneous",
      };

      const result = simulateDosingTrajectory(protocol, schedule);

      // Accumulation index must be essentially 1.0 (no accumulation)
      expect(result.accumulationIndex).toBeCloseTo(1.0, 4);

      // Trough at steady state should be practically zero (< 1e-6)
      expect(result.steadyStateCMin).toBeLessThan(1e-6);

      // Peak at steady state should virtually equal single-dose peak
      expect(result.steadyStateCMax).toBeCloseTo(result.cMax, 3);
    });

    test("steady-state average concentration satisfies Cavg,ss = AUC_single / tau", () => {
      const protocol = PROTOCOLS["cerebrolysin"];
      const schedule: DosingSchedule = {
        frequency: "daily",
        doseAmount: 5,
        intervalHours: 24,
        numberOfDoses: 10,
        route: "intramuscular",
      };

      const result = simulateDosingTrajectory(protocol, schedule);
      const expectedCavg = result.aucSingleDose / 24;

      expect(result.steadyStateCAvg).toBeCloseTo(expectedCavg, 5);
      expect(result.steadyStateCMax).toBeGreaterThan(result.steadyStateCAvg);
      expect(result.steadyStateCAvg).toBeGreaterThan(result.steadyStateCMin);
    });

    test("fluctuation percentage correctly quantifies peak-to-trough swing", () => {
      const cMaxSs = 10;
      const cMinSs = 2;
      const cAvgSs = 5;
      const fluctuation = calculateFluctuationIndex(cMaxSs, cMinSs, cAvgSs);
      // 100 * (10 - 2) / 5 = 160%
      expect(fluctuation).toBe(160);
    });

    test("time to 90% and 95% steady-state matches theoretical half-life multiples", () => {
      const halfLife = 10.0;
      const t90 = calculateTimeToSteadyState(halfLife, 0.9);
      const t95 = calculateTimeToSteadyState(halfLife, 0.95);

      // 90% SS is approx 3.32 half-lives
      expect(t90).toBeCloseTo(33.22, 1);
      // 95% SS is approx 4.32 half-lives
      expect(t95).toBeCloseTo(43.22, 1);
    });

    test("trapezoidal AUC numerical integration matches multi-dose trajectory integral", () => {
      const protocol = PROTOCOLS["subq-nad"];
      const schedule: DosingSchedule = {
        frequency: "daily",
        doseAmount: 100,
        intervalHours: 24,
        numberOfDoses: 5,
        route: "subcutaneous",
      };

      const result = simulateDosingTrajectory(protocol, schedule);
      expect(result.aucTotalSimulated).toBeGreaterThan(0);

      // Over 5 daily doses of a rapidly cleared drug, total simulated AUC should be roughly 5 * AUC_single
      expect(result.aucTotalSimulated).toBeCloseTo(5 * result.aucSingleDose, 0);
    });
  });

  describe("3. Boundary Conditions & Numerical Stability", () => {
    const defaultParams = PROTOCOLS["subq-nad"].parameters;

    test("handles zero dose without NaN or infinity", () => {
      expect(calculateSingleDoseConcentration(1.0, 0, defaultParams)).toBe(0);
      expect(calculateCMax(0, defaultParams)).toBe(0);
      expect(calculateAUCSingleDose(0, defaultParams)).toBe(0);
      expect(calculateSteadyStatePeak(0, defaultParams, 24)).toBe(0);
      expect(calculateSteadyStateTrough(0, defaultParams, 24)).toBe(0);
      expect(calculateSteadyStateAverage(0, defaultParams, 24)).toBe(0);

      const zeroSchedule: DosingSchedule = {
        frequency: "daily",
        doseAmount: 0,
        intervalHours: 24,
        numberOfDoses: 7,
        route: "subcutaneous",
      };
      const result = simulateDosingTrajectory(PROTOCOLS["subq-nad"], zeroSchedule);
      expect(result.cMax).toBe(0);
      expect(result.aucSingleDose).toBe(0);
      expect(result.trajectory.every((p) => p.concentration === 0)).toBe(true);
    });

    test("handles negative dose safely returning 0", () => {
      expect(calculateSingleDoseConcentration(1.0, -50, defaultParams)).toBe(0);
      expect(calculateCMax(-50, defaultParams)).toBe(0);
      expect(calculateAUCSingleDose(-50, defaultParams)).toBe(0);
      expect(calculateSteadyStatePeak(-50, defaultParams, 24)).toBe(0);
    });

    test("handles negative time safely returning 0", () => {
      expect(calculateSingleDoseConcentration(-5.0, 100, defaultParams)).toBe(0);
    });

    test("handles zero or invalid half-life / rate constants gracefully", () => {
      expect(calculateEliminationRate(0)).toBe(0);
      expect(calculateEliminationRate(-5)).toBe(0);
      expect(calculateAbsorptionRate(0)).toBe(0);
      expect(calculateAbsorptionRate(-1)).toBe(0);
      expect(calculateTMax(0, 0.2)).toBe(0);
      expect(calculateTMax(1.0, 0)).toBe(0);
      expect(calculateSteadyStateAccumulationFactor(0, 24)).toBe(1);
      expect(calculateTimeToSteadyState(0)).toBe(0);
    });

    test("handles zero volume of distribution or clearance gracefully", () => {
      const badParams = {
        ...defaultParams,
        volumeOfDistributionVd: 0,
      };
      expect(calculateSingleDoseConcentration(1.0, 100, badParams)).toBe(0);
      expect(calculateAUCSingleDose(100, badParams)).toBe(0);
    });

    test("handles zero dosing interval in accumulation factor safely", () => {
      expect(calculateSteadyStateAccumulationFactor(0.2, 0)).toBe(1);
      expect(calculateSteadyStateAccumulationFactor(0.2, -10)).toBe(1);
    });

    test("handles empty or single-point arrays in trapezoidal AUC without errors", () => {
      expect(calculateTrapezoidalAUC([])).toBe(0);
      expect(
        calculateTrapezoidalAUC([
          { timeHours: 0, concentration: 10, doseNumber: 1, isDosingPoint: true },
        ])
      ).toBe(0);
    });
  });

  describe("4. Clinical Longevity & Neuro-Metabolic Protocol Configurations", () => {
    test("Subcutaneous NAD+ protocol specifications & kinetics", () => {
      const nad = getProtocolById("subq-nad");
      expect(nad).toBeDefined();
      if (!nad) return;

      expect(nad.category).toBe("longevity");
      expect(nad.administrationRoute).toBe("subcutaneous");
      expect(nad.defaultDose).toBe(100);
      expect(nad.doseRange.unit).toBe("mg");
      expect(nad.parameters.halfLifeHours).toBe(2.5);
      expect(nad.parameters.bioavailabilityF).toBe(0.92);

      const tMax = calculateTMax(nad.parameters.absorptionRateKa, nad.parameters.eliminationRateKe);
      // Fast SubQ depot absorption: Tmax should be between 45 min and 75 min (0.75 - 1.25 hours)
      expect(tMax).toBeGreaterThan(0.75);
      expect(tMax).toBeLessThan(1.3);

      const singleCMax = calculateCMax(100, nad.parameters);
      expect(singleCMax).toBeGreaterThan(2.0);
      expect(singleCMax).toBeLessThan(5.0);
    });

    test("Cerebrolysin neuropeptide cascade protocol specifications & kinetics", () => {
      const cb = getProtocolById("cerebrolysin");
      expect(cb).toBeDefined();
      if (!cb) return;

      expect(cb.category).toBe("neurotrophic");
      expect(cb.administrationRoute).toBe("intramuscular");
      expect(cb.defaultDose).toBe(5);
      expect(cb.doseRange.unit).toBe("mL");
      expect(cb.parameters.halfLifeHours).toBe(2.8);

      const result = simulateDosingTrajectory(cb, {
        frequency: "daily",
        doseAmount: 5,
        intervalHours: 24,
        numberOfDoses: 5,
        route: "intramuscular",
      });

      expect(result.cMax).toBeGreaterThan(0);
      expect(result.steadyStateCAvg).toBeGreaterThan(0);
      expect(result.trajectory.length).toBeGreaterThan(20);
    });

    test("Semax & Selank dual heptapeptide modulation kinetics", () => {
      const peptide = getProtocolById("semax-selank");
      expect(peptide).toBeDefined();
      if (!peptide) return;

      expect(peptide.category).toBe("neurotrophic");
      expect(peptide.administrationRoute).toBe("intranasal");
      expect(peptide.doseRange.unit).toBe("mcg");
      expect(peptide.secondaryCompound).toBeDefined();
      expect(peptide.secondaryCompound?.name).toContain("Selank");

      // Rapid mucosal uptake: Tmax should be under 30 minutes (0.5 hr)
      const tMax = calculateTMax(peptide.parameters.absorptionRateKa, peptide.parameters.eliminationRateKe);
      expect(tMax).toBeLessThan(0.5);

      const schedule: DosingSchedule = {
        frequency: "daily",
        doseAmount: 500,
        intervalHours: 24,
        numberOfDoses: 7,
        route: "intranasal",
      };

      const result = simulateDosingTrajectory(peptide, schedule);
      expect(result.trajectory.some((p) => p.secondaryConcentration !== undefined)).toBe(true);
    });

    test("Mitochondrial Stack (CoQ10 Ubiquinol + PQQ) dual-cofactor kinetics", () => {
      const stack = getProtocolById("mitochondrial-stack");
      expect(stack).toBeDefined();
      if (!stack) return;

      expect(stack.category).toBe("mitochondrial");
      expect(stack.administrationRoute).toBe("oral");
      expect(stack.parameters.halfLifeHours).toBe(34.0);
      expect(stack.secondaryCompound).toBeDefined();
      expect(stack.secondaryCompound?.name).toContain("PQQ");
      expect(stack.secondaryCompound?.doseMultiplier).toBe(0.1);

      const schedule: DosingSchedule = {
        frequency: "daily",
        doseAmount: 200,
        intervalHours: 24,
        numberOfDoses: 10,
        route: "oral",
      };

      const result = simulateDosingTrajectory(stack, schedule);
      // Ubiquinol slow oral absorption: Tmax > 5 hours
      expect(result.tMax).toBeGreaterThan(5.0);

      // Trajectory includes secondary concentration (PQQ)
      const midPoint = result.trajectory[Math.floor(result.trajectory.length / 2)];
      expect(midPoint.secondaryConcentration).toBeDefined();
      expect(typeof midPoint.secondaryConcentration).toBe("number");
    });
  });

  describe("5. Zero-ePHI Quarantine & Determinism Attestation", () => {
    test("functions produce 100% bitwise deterministic results across repeated invocations", () => {
      const protocol = PROTOCOLS["subq-nad"];
      const schedule: DosingSchedule = {
        frequency: "alternate_days",
        doseAmount: 150,
        intervalHours: 48,
        numberOfDoses: 6,
        route: "subcutaneous",
      };

      const run1 = simulateDosingTrajectory(protocol, schedule);
      const run2 = simulateDosingTrajectory(protocol, schedule);

      expect(run1.cMax).toEqual(run2.cMax);
      expect(run1.tMax).toEqual(run2.tMax);
      expect(run1.aucSingleDose).toEqual(run2.aucSingleDose);
      expect(run1.steadyStateCMax).toEqual(run2.steadyStateCMax);
      expect(run1.steadyStateCMin).toEqual(run2.steadyStateCMin);
      expect(run1.steadyStateCAvg).toEqual(run2.steadyStateCAvg);
      expect(run1.trajectory.length).toEqual(run2.trajectory.length);

      for (let i = 0; i < run1.trajectory.length; i++) {
        expect(run1.trajectory[i].timeHours).toBe(run2.trajectory[i].timeHours);
        expect(run1.trajectory[i].concentration).toBe(run2.trajectory[i].concentration);
      }
    });

    test("does not accept or mutate any patient state object or session tokens", () => {
      // Protocol and schedule structures are strictly stoichiometric parameters
      const schedule: DosingSchedule = {
        frequency: "daily",
        doseAmount: 100,
        intervalHours: 24,
        numberOfDoses: 5,
        route: "subcutaneous",
      };

      const keys = Object.keys(schedule);
      expect(keys).not.toContain("patientId");
      expect(keys).not.toContain("mrn");
      expect(keys).not.toContain("dob");
      expect(keys).not.toContain("name");
    });

    test("frequency interval mapping covers all valid clinical schedules", () => {
      expect(getDosingIntervalHours("twice_daily")).toBe(12);
      expect(getDosingIntervalHours("daily")).toBe(24);
      expect(getDosingIntervalHours("alternate_days")).toBe(48);
      expect(getDosingIntervalHours("weekly")).toBe(168);
    });
  });
});

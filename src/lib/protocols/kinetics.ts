/**
 * =============================================================================
 * CLINICAL PHARMACOKINETICS & PEPTIDE STOICHIOMETRY ENGINE
 * Module: Longevity Peptides & Neuro-Metabolic Cofactor Kinetics
 *
 * Compliance: Zero-ePHI Quarantine Verified.
 * Execution: 100% deterministic pure mathematical calculation engine.
 * No patient identifiers, session state, or clinical records stored.
 * =============================================================================
 */

export type ProtocolId =
  | "subq-nad"
  | "cerebrolysin"
  | "semax-selank"
  | "mitochondrial-stack";

export type DosingFrequency =
  | "daily"
  | "alternate_days"
  | "weekly"
  | "twice_daily";

export type AdministrationRoute =
  | "subcutaneous"
  | "intramuscular"
  | "intranasal"
  | "oral";

export interface KineticParameters {
  /** First-order absorption rate constant ka (hr^-1) */
  absorptionRateKa: number;
  /** First-order elimination rate constant ke (hr^-1) */
  eliminationRateKe: number;
  /** Elimination half-life t_1/2,e (hours) */
  halfLifeHours: number;
  /** Absorption half-life t_1/2,a (hours) */
  absorptionHalfLifeHours: number;
  /** Bioavailability fraction F (0.0 - 1.0) */
  bioavailabilityF: number;
  /** Apparent volume of distribution Vd (Liters) */
  volumeOfDistributionVd: number;
  /** Total systemic clearance CL = Vd * ke (L/hr) */
  clearanceCl: number;
  /** Output concentration unit label */
  unit: string;
  /** Dosing mass/volume unit label */
  doseUnit: string;
}

export interface SecondaryCompoundConfig {
  name: string;
  ratio: string;
  mechanism: string;
  doseMultiplier: number;
  parameters: KineticParameters;
}

export interface PeptideProtocol {
  id: ProtocolId;
  name: string;
  subtitle: string;
  category: "longevity" | "neurotrophic" | "metabolic" | "mitochondrial";
  description: string;
  molecularTarget: string;
  administrationRoute: AdministrationRoute;
  defaultDose: number;
  doseRange: {
    min: number;
    max: number;
    step: number;
    unit: string;
  };
  defaultFrequency: DosingFrequency;
  parameters: KineticParameters;
  secondaryCompound?: SecondaryCompoundConfig;
  clinicalNotes: string;
  therapeuticTargetRange: {
    min: number;
    max: number;
    unit: string;
  };
}

export interface DosingSchedule {
  frequency: DosingFrequency;
  doseAmount: number;
  intervalHours: number;
  numberOfDoses: number;
  route: AdministrationRoute;
}

export interface ConcentrationDataPoint {
  timeHours: number;
  concentration: number;
  secondaryConcentration?: number;
  doseNumber: number;
  isDosingPoint: boolean;
}

export interface KineticModelResult {
  protocolId: ProtocolId;
  schedule: DosingSchedule;
  /** Time to peak single-dose concentration (hours) */
  tMax: number;
  /** Peak plasma concentration of single dose (units/L) */
  cMax: number;
  /** Analytical AUC from 0 to infinity for a single dose */
  aucSingleDose: number;
  /** Analytical AUC over one dosing interval tau at steady state */
  aucSteadyStateInterval: number;
  /** Cumulative trapezoidal AUC over the entire simulation duration */
  aucTotalSimulated: number;
  /** Peak plasma concentration at steady state */
  steadyStateCMax: number;
  /** Trough plasma concentration at steady state */
  steadyStateCMin: number;
  /** Average steady-state plasma concentration (AUC_tau / tau) */
  steadyStateCAvg: number;
  /** Accumulation index R = 1 / (1 - e^(-ke * tau)) */
  accumulationIndex: number;
  /** Peak-to-trough fluctuation percentage: 100 * (Cmax_ss - Cmin_ss) / Cavg_ss */
  fluctuationPercentage: number;
  /** Time to achieve 90% steady state accumulation (hours = 3.32 * t_1/2) */
  timeToSteadyState90: number;
  /** Time to achieve 95% steady state accumulation (hours = 4.32 * t_1/2) */
  timeToSteadyState95: number;
  /** Simulated concentration trajectory data points */
  trajectory: ConcentrationDataPoint[];
}

/**
 * Maps standard dosing frequencies to interval hours.
 */
export function getDosingIntervalHours(frequency: DosingFrequency): number {
  switch (frequency) {
    case "twice_daily":
      return 12;
    case "daily":
      return 24;
    case "alternate_days":
      return 48;
    case "weekly":
      return 168;
    default:
      return 24;
  }
}

/**
 * Calculates elimination rate constant ke from half-life.
 * ke = ln(2) / t_1/2
 */
export function calculateEliminationRate(halfLifeHours: number): number {
  if (halfLifeHours <= 0 || !Number.isFinite(halfLifeHours)) {
    return 0;
  }
  return Math.LN2 / halfLifeHours;
}

/**
 * Calculates absorption rate constant ka from absorption half-life.
 * ka = ln(2) / t_1/2,a
 */
export function calculateAbsorptionRate(absorptionHalfLifeHours: number): number {
  if (absorptionHalfLifeHours <= 0 || !Number.isFinite(absorptionHalfLifeHours)) {
    return 0;
  }
  return Math.LN2 / absorptionHalfLifeHours;
}

/**
 * Calculates time-to-peak plasma concentration (Tmax).
 * Tmax = ln(ka / ke) / (ka - ke)
 * Handles singularity when ka == ke via L'Hopital's rule: limit = 1 / ke.
 */
export function calculateTMax(ka: number, ke: number): number {
  if (ka <= 0 || ke <= 0 || !Number.isFinite(ka) || !Number.isFinite(ke)) {
    return 0;
  }
  const delta = ka - ke;
  if (Math.abs(delta) < 1e-7) {
    return 1 / ke;
  }
  if (ka <= ke) {
    // Flip-flop pharmacokinetics or equal: preserve mathematical domain
    const ratio = ka / ke;
    return ratio > 0 ? Math.max(0, Math.log(ratio) / delta) : 0;
  }
  return Math.max(0, Math.log(ka / ke) / delta);
}

/**
 * Computes plasma concentration at time t after a single extravascular dose.
 * C(t) = [F * D * ka / (Vd * (ka - ke))] * [e^(-ke * t) - e^(-ka * t)]
 * With singularity protection when ka == ke.
 */
export function calculateSingleDoseConcentration(
  timeHours: number,
  dose: number,
  params: KineticParameters
): number {
  if (timeHours < 0 || dose <= 0 || !Number.isFinite(timeHours) || !Number.isFinite(dose)) {
    return 0;
  }
  const { bioavailabilityF, volumeOfDistributionVd, absorptionRateKa: ka, eliminationRateKe: ke } = params;

  if (volumeOfDistributionVd <= 0 || ka <= 0 || ke <= 0) {
    return 0;
  }

  const delta = ka - ke;

  if (Math.abs(delta) < 1e-7) {
    // Singularity resolution: C(t) = (F * D * ke * t / Vd) * e^(-ke * t)
    const conc = ((bioavailabilityF * dose * ke * timeHours) / volumeOfDistributionVd) * Math.exp(-ke * timeHours);
    return Math.max(0, conc);
  }

  const coefficient = (bioavailabilityF * dose * ka) / (volumeOfDistributionVd * delta);
  const diffExp = Math.exp(-ke * timeHours) - Math.exp(-ka * timeHours);
  const conc = coefficient * diffExp;

  return Math.max(0, conc);
}

/**
 * Calculates peak plasma concentration (Cmax) of a single dose.
 */
export function calculateCMax(dose: number, params: KineticParameters): number {
  if (dose <= 0 || !Number.isFinite(dose)) {
    return 0;
  }
  const tMax = calculateTMax(params.absorptionRateKa, params.eliminationRateKe);
  return calculateSingleDoseConcentration(tMax, dose, params);
}

/**
 * Calculates Area Under the Curve from 0 to infinity for a single dose.
 * AUC_inf = (F * D) / (Vd * ke) = (F * D) / CL
 */
export function calculateAUCSingleDose(dose: number, params: KineticParameters): number {
  if (dose <= 0 || !Number.isFinite(dose)) {
    return 0;
  }
  const { bioavailabilityF, volumeOfDistributionVd, eliminationRateKe } = params;
  if (volumeOfDistributionVd <= 0 || eliminationRateKe <= 0) {
    return 0;
  }
  return (bioavailabilityF * dose) / (volumeOfDistributionVd * eliminationRateKe);
}

/**
 * Calculates steady-state accumulation factor R.
 * R = 1 / (1 - e^(-ke * tau))
 */
export function calculateSteadyStateAccumulationFactor(
  eliminationRateKe: number,
  intervalHours: number
): number {
  if (eliminationRateKe <= 0 || intervalHours <= 0 || !Number.isFinite(eliminationRateKe) || !Number.isFinite(intervalHours)) {
    return 1;
  }
  const exponent = -eliminationRateKe * intervalHours;
  if (exponent < -50) {
    // Exponential is zero; no accumulation from prior doses
    return 1;
  }
  const denominator = 1 - Math.exp(exponent);
  if (denominator <= 1e-12) {
    return 1;
  }
  const r = 1 / denominator;
  return Math.max(1, Number.isFinite(r) ? r : 1);
}

/**
 * Calculates steady-state peak plasma concentration (Cmax,ss).
 * Evaluated at steady-state Tmax,ss:
 * Tmax,ss = ln[ (ka * (1 - e^(-ke * tau))) / (ke * (1 - e^(-ka * tau))) ] / (ka - ke)
 */
export function calculateSteadyStatePeak(
  dose: number,
  params: KineticParameters,
  intervalHours: number
): number {
  if (dose <= 0 || intervalHours <= 0 || !Number.isFinite(dose) || !Number.isFinite(intervalHours)) {
    return 0;
  }
  const { absorptionRateKa: ka, eliminationRateKe: ke, bioavailabilityF: f, volumeOfDistributionVd: vd } = params;
  if (vd <= 0 || ka <= 0 || ke <= 0) {
    return 0;
  }

  const expKeTau = Math.exp(-ke * intervalHours);
  const expKaTau = Math.exp(-ka * intervalHours);

  const denomKe = Math.max(1e-12, 1 - expKeTau);
  const denomKa = Math.max(1e-12, 1 - expKaTau);

  const delta = ka - ke;
  let tMaxSs: number;

  if (Math.abs(delta) < 1e-7) {
    tMaxSs = 1 / ke;
  } else {
    const numeratorRatio = (ka * denomKe) / (ke * denomKa);
    tMaxSs = numeratorRatio > 0 ? Math.max(0, Math.log(numeratorRatio) / delta) : calculateTMax(ka, ke);
  }

  // Evaluate Css(tMaxSs)
  if (Math.abs(delta) < 1e-7) {
    const single = calculateSingleDoseConcentration(tMaxSs, dose, params);
    const r = calculateSteadyStateAccumulationFactor(ke, intervalHours);
    return single * r;
  }

  const coefficient = (f * dose * ka) / (vd * delta);
  const val = coefficient * (Math.exp(-ke * tMaxSs) / denomKe - Math.exp(-ka * tMaxSs) / denomKa);

  return Math.max(0, val);
}

/**
 * Calculates steady-state trough concentration (Cmin,ss) just prior to next dose.
 * Cmin,ss = Css(tau)
 */
export function calculateSteadyStateTrough(
  dose: number,
  params: KineticParameters,
  intervalHours: number
): number {
  if (dose <= 0 || intervalHours <= 0 || !Number.isFinite(dose) || !Number.isFinite(intervalHours)) {
    return 0;
  }
  const { absorptionRateKa: ka, eliminationRateKe: ke, bioavailabilityF: f, volumeOfDistributionVd: vd } = params;
  if (vd <= 0 || ka <= 0 || ke <= 0) {
    return 0;
  }

  const expKeTau = Math.exp(-ke * intervalHours);
  const expKaTau = Math.exp(-ka * intervalHours);

  const denomKe = Math.max(1e-12, 1 - expKeTau);
  const denomKa = Math.max(1e-12, 1 - expKaTau);

  const delta = ka - ke;
  if (Math.abs(delta) < 1e-7) {
    const conc = ((f * dose * ke * intervalHours) / (vd * denomKe)) * expKeTau;
    return Math.max(0, conc);
  }

  const coefficient = (f * dose * ka) / (vd * delta);
  const val = coefficient * (expKeTau / denomKe - expKaTau / denomKa);

  return Math.max(0, val);
}

/**
 * Calculates steady-state average plasma concentration (Cavg,ss).
 * Cavg,ss = AUC_tau / tau = (F * D) / (Vd * ke * tau) = (F * D) / (CL * tau)
 */
export function calculateSteadyStateAverage(
  dose: number,
  params: KineticParameters,
  intervalHours: number
): number {
  if (dose <= 0 || intervalHours <= 0 || !Number.isFinite(dose) || !Number.isFinite(intervalHours)) {
    return 0;
  }
  const { bioavailabilityF, volumeOfDistributionVd, eliminationRateKe } = params;
  if (volumeOfDistributionVd <= 0 || eliminationRateKe <= 0) {
    return 0;
  }
  const cl = volumeOfDistributionVd * eliminationRateKe;
  return (bioavailabilityF * dose) / (cl * intervalHours);
}

/**
 * Calculates peak-to-trough fluctuation index:
 * %PTF = 100 * (Cmax,ss - Cmin,ss) / Cavg,ss
 */
export function calculateFluctuationIndex(
  cMaxSs: number,
  cMinSs: number,
  cAvgSs: number
): number {
  if (cAvgSs <= 0 || !Number.isFinite(cAvgSs) || cMaxSs < cMinSs) {
    return 0;
  }
  return Math.max(0, (100 * (cMaxSs - cMinSs)) / cAvgSs);
}

/**
 * Calculates time required to reach a specific fraction of steady-state accumulation.
 * Default 90% (3.32 half-lives) or 95% (4.32 half-lives).
 */
export function calculateTimeToSteadyState(
  halfLifeHours: number,
  fraction: number = 0.90
): number {
  if (halfLifeHours <= 0 || fraction <= 0 || fraction >= 1 || !Number.isFinite(halfLifeHours)) {
    return 0;
  }
  const numHalfLives = -Math.log(1 - fraction) / Math.LN2;
  return Math.max(0, numHalfLives * halfLifeHours);
}

/**
 * Numerical integration using standard trapezoidal rule over simulated trajectory.
 */
export function calculateTrapezoidalAUC(points: ConcentrationDataPoint[]): number {
  if (!points || points.length < 2) {
    return 0;
  }
  let totalAuc = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dt = p2.timeHours - p1.timeHours;
    if (dt > 0) {
      const avgConc = (p1.concentration + p2.concentration) / 2;
      totalAuc += avgConc * dt;
    }
  }
  return Math.max(0, totalAuc);
}

/**
 * Helper to build kinetic parameters with consistency guarantees.
 */
export function createKineticParameters(input: {
  halfLifeHours: number;
  absorptionHalfLifeHours: number;
  bioavailabilityF: number;
  volumeOfDistributionVd: number;
  unit: string;
  doseUnit: string;
}): KineticParameters {
  const ke = calculateEliminationRate(input.halfLifeHours);
  const ka = calculateAbsorptionRate(input.absorptionHalfLifeHours);
  const cl = input.volumeOfDistributionVd * ke;

  return {
    absorptionRateKa: ka,
    eliminationRateKe: ke,
    halfLifeHours: input.halfLifeHours,
    absorptionHalfLifeHours: input.absorptionHalfLifeHours,
    bioavailabilityF: input.bioavailabilityF,
    volumeOfDistributionVd: input.volumeOfDistributionVd,
    clearanceCl: cl,
    unit: input.unit,
    doseUnit: input.doseUnit,
  };
}

/**
 * PRE-CONFIGURED CLINICAL LONGEVITY & NEURO-METABOLIC PROTOCOLS
 */
export const PROTOCOLS: Record<ProtocolId, PeptideProtocol> = {
  "subq-nad": {
    id: "subq-nad",
    name: "Subcutaneous NAD+",
    subtitle: "Sirtuin Activator & Nicotinamide Salvage Recycling",
    category: "longevity",
    description:
      "Rapid subcutaneous depot administration of pure oxidized beta-nicotinamide adenine dinucleotide. Rapidly elevates plasma NAD+ pool before enzymatic hydrolysis into nicotinamide (NAM) and NMN via CD38/CD73/CD157, initiating continuous cellular recycling via NAMPT salvage.",
    molecularTarget: "SIRT1-7, PARP1, CD38 salvage pathway, mitochondrial complex I (NADH dehydrogenase)",
    administrationRoute: "subcutaneous",
    defaultDose: 100,
    doseRange: {
      min: 25,
      max: 500,
      step: 25,
      unit: "mg",
    },
    defaultFrequency: "alternate_days",
    parameters: createKineticParameters({
      halfLifeHours: 2.5,
      absorptionHalfLifeHours: 0.35,
      bioavailabilityF: 0.92,
      volumeOfDistributionVd: 20.0,
      unit: "mg/L",
      doseUnit: "mg",
    }),
    clinicalNotes:
      "Subcutaneous depot avoids severe adenosine-mediated gastrointestinal and vascular flushing common with rapid intravenous infusions. Plasma peak occurs within 50-70 minutes.",
    therapeuticTargetRange: {
      min: 1.5,
      max: 5.0,
      unit: "mg/L",
    },
  },

  cerebrolysin: {
    id: "cerebrolysin",
    name: "Cerebrolysin",
    subtitle: "Neuropeptide Trophic Cascade & Neurogenesis Complex",
    category: "neurotrophic",
    description:
      "Purified porcine brain neuropeptides and free amino acids exhibiting trophic activity mimicking nerve growth factor (NGF), brain-derived neurotrophic factor (BDNF), glial cell line-derived neurotrophic factor (GDNF), and ciliary neurotrophic factor (CNTF).",
    molecularTarget: "TrkB, TrkA, RET, CNTFR-alpha receptor phosphorylation, PI3K/Akt/GSK3-beta pathway",
    administrationRoute: "intramuscular",
    defaultDose: 5,
    doseRange: {
      min: 2,
      max: 20,
      step: 1,
      unit: "mL",
    },
    defaultFrequency: "daily",
    parameters: createKineticParameters({
      halfLifeHours: 2.8,
      absorptionHalfLifeHours: 0.6,
      bioavailabilityF: 0.85,
      volumeOfDistributionVd: 15.0,
      unit: "mg/L",
      doseUnit: "mL",
    }),
    clinicalNotes:
      "Dosed by volume (1 mL standardized to approx. 215.2 mg peptide concentrate). Rapid systemic distribution leads to downstream prolonged neuroplasticity lasting hours beyond plasma peptide clearance.",
    therapeuticTargetRange: {
      min: 20.0,
      max: 80.0,
      unit: "mg/L",
    },
  },

  "semax-selank": {
    id: "semax-selank",
    name: "Semax & Selank Heptapeptides",
    subtitle: "Melanocortin Receptor & Enkephalinergic Modulation",
    category: "neurotrophic",
    description:
      "Dual synthetic peptide bioregulator regimen: Semax (ACTH(4-10) heptapeptide analogue) enhances central BDNF gene expression, dopaminergic neurotransmission, and TrkB signaling; Selank (Tuftsin analogue) inhibits enkephalin-degrading enzymes and balances GABAergic tone.",
    molecularTarget: "MC4R, TrkB/BDNF mRNA transcription, carboxypeptidase/enkephalinase inhibition, GABA-A",
    administrationRoute: "intranasal",
    defaultDose: 500,
    doseRange: {
      min: 100,
      max: 2000,
      step: 50,
      unit: "mcg",
    },
    defaultFrequency: "daily",
    parameters: createKineticParameters({
      halfLifeHours: 0.75,
      absorptionHalfLifeHours: 0.15,
      bioavailabilityF: 0.75,
      volumeOfDistributionVd: 12.0,
      unit: "mcg/L",
      doseUnit: "mcg",
    }),
    secondaryCompound: {
      name: "Selank Co-Heptapeptide",
      ratio: "1:1",
      mechanism: "Tuftsin-like allosteric GABAergic modulation with enkephalin protection",
      doseMultiplier: 1.0,
      parameters: createKineticParameters({
        halfLifeHours: 0.9,
        absorptionHalfLifeHours: 0.18,
        bioavailabilityF: 0.72,
        volumeOfDistributionVd: 14.0,
        unit: "mcg/L",
        doseUnit: "mcg",
      }),
    },
    clinicalNotes:
      "Rapid mucosal penetration yields central nervous system entry within 15-20 minutes. Although plasma elimination is rapid (< 1 hr), target gene expression and receptor modulation persist for over 24 hours.",
    therapeuticTargetRange: {
      min: 10.0,
      max: 45.0,
      unit: "mcg/L",
    },
  },

  "mitochondrial-stack": {
    id: "mitochondrial-stack",
    name: "Mitochondrial Stack (CoQ10 + PQQ)",
    subtitle: "Ubiquinol Electron Shuttle & PGC-1alpha Biogenesis",
    category: "mitochondrial",
    description:
      "Synergistic dual-cofactor formulation: Highly bioavailable reduced Coenzyme Q10 (Ubiquinol) restores inner mitochondrial membrane electron transport efficiency; Pyrroloquinoline Quinone (PQQ) stimulates CREB/PGC-1alpha-mediated mitochondrial biogenesis.",
    molecularTarget: "Complex I/III Q-pool redox cycling, PGC-1alpha, NRF-1/2, SIRT3, mitochondrial DNA replication",
    administrationRoute: "oral",
    defaultDose: 200,
    doseRange: {
      min: 50,
      max: 600,
      step: 25,
      unit: "mg",
    },
    defaultFrequency: "daily",
    parameters: createKineticParameters({
      halfLifeHours: 34.0,
      absorptionHalfLifeHours: 3.0,
      bioavailabilityF: 0.35,
      volumeOfDistributionVd: 50.0,
      unit: "mg/L",
      doseUnit: "mg",
    }),
    secondaryCompound: {
      name: "Pyrroloquinoline Quinone (PQQ)",
      ratio: "10:1 (20 mg PQQ per 200 mg Ubiquinol)",
      mechanism: "Continuous catalytic redox cycling & PGC-1alpha promoter activation",
      doseMultiplier: 0.1,
      parameters: createKineticParameters({
        halfLifeHours: 4.0,
        absorptionHalfLifeHours: 0.5,
        bioavailabilityF: 0.50,
        volumeOfDistributionVd: 25.0,
        unit: "mg/L",
        doseUnit: "mg",
      }),
    },
    clinicalNotes:
      "Due to Ubiquinol's prolonged 34-hour half-life, significant plasma accumulation occurs with daily administration, reaching steady-state accumulation factor R approx. 2.5 - 2.8 after 5-7 days.",
    therapeuticTargetRange: {
      min: 2.0,
      max: 4.5,
      unit: "mg/L",
    },
  },
};

/**
 * Returns protocol configuration by ID.
 */
export function getProtocolById(id: ProtocolId): PeptideProtocol | undefined {
  return PROTOCOLS[id];
}

/**
 * Simulates multi-dose steady-state accumulation trajectory.
 * Pure deterministic function under Zero-ePHI compliance.
 *
 * Uses linear superposition:
 * C(t) = sum_{i=0, t >= t_i}^{N-1} C_single(t - t_i)
 */
export function simulateDosingTrajectory(
  protocol: PeptideProtocol,
  schedule: DosingSchedule,
  totalHoursOverride?: number,
  timeStepHoursOverride?: number
): KineticModelResult {
  const { doseAmount, intervalHours, numberOfDoses } = schedule;
  const safeInterval = Math.max(1, intervalHours);
  const safeDoses = Math.max(1, Math.min(60, numberOfDoses));
  const safeDoseAmount = Math.max(0, doseAmount);

  // Total duration: simulated through all doses plus 3.5 half-lives post last dose
  const defaultTotalHours =
    (safeDoses - 1) * safeInterval +
    Math.max(safeInterval, protocol.parameters.halfLifeHours * 3.5);
  const totalHours = Math.max(safeInterval, totalHoursOverride ?? defaultTotalHours);

  const primaryTMax = calculateTMax(
    protocol.parameters.absorptionRateKa,
    protocol.parameters.eliminationRateKe
  );

  // Create adaptive time mesh
  const timeSet = new Set<number>();
  timeSet.add(0);

  // Add all scheduled dose injection times and critical kinetic points
  for (let d = 0; d < safeDoses; d++) {
    const doseTime = d * safeInterval;
    if (doseTime <= totalHours) {
      timeSet.add(doseTime);
      timeSet.add(doseTime + 0.05);
      const peakTime = doseTime + primaryTMax;
      if (peakTime <= totalHours) {
        timeSet.add(peakTime);
      }
      if (doseTime + primaryTMax * 0.5 <= totalHours) {
        timeSet.add(doseTime + primaryTMax * 0.5);
      }
    }
  }

  // Base uniform step size
  const maxStep =
    timeStepHoursOverride ??
    Math.max(
      0.1,
      Math.min(1.0, safeInterval / 32, protocol.parameters.halfLifeHours / 10)
    );

  for (let t = 0; t <= totalHours; t += maxStep) {
    timeSet.add(Number(t.toFixed(4)));
  }
  timeSet.add(Number(totalHours.toFixed(4)));

  // Sort time points monotonically
  const sortedTimes = Array.from(timeSet).sort((a, b) => a - b);

  // Prepare dose times array
  const doseTimes: number[] = [];
  for (let d = 0; d < safeDoses; d++) {
    doseTimes.push(d * safeInterval);
  }

  const trajectory: ConcentrationDataPoint[] = [];

  // Superposition calculation
  for (const t of sortedTimes) {
    let primaryConc = 0;
    let secondaryConc = 0;
    let currentDoseNumber = 0;

    for (let d = 0; d < doseTimes.length; d++) {
      const td = doseTimes[d];
      if (t >= td) {
        currentDoseNumber = d + 1;
        const deltaT = t - td;
        primaryConc += calculateSingleDoseConcentration(
          deltaT,
          safeDoseAmount,
          protocol.parameters
        );

        if (protocol.secondaryCompound) {
          const secDose = safeDoseAmount * protocol.secondaryCompound.doseMultiplier;
          secondaryConc += calculateSingleDoseConcentration(
            deltaT,
            secDose,
            protocol.secondaryCompound.parameters
          );
        }
      }
    }

    const isDosingPoint = doseTimes.some((dt) => Math.abs(dt - t) < 1e-4);

    const point: ConcentrationDataPoint = {
      timeHours: Number(t.toFixed(2)),
      concentration: Number(primaryConc.toFixed(4)),
      doseNumber: currentDoseNumber,
      isDosingPoint,
    };

    if (protocol.secondaryCompound) {
      point.secondaryConcentration = Number(secondaryConc.toFixed(4));
    }

    trajectory.push(point);
  }

  // Steady-state analytics
  const tMax = calculateTMax(
    protocol.parameters.absorptionRateKa,
    protocol.parameters.eliminationRateKe
  );
  const cMax = calculateCMax(safeDoseAmount, protocol.parameters);
  const aucSingleDose = calculateAUCSingleDose(safeDoseAmount, protocol.parameters);
  const accumulationIndex = calculateSteadyStateAccumulationFactor(
    protocol.parameters.eliminationRateKe,
    safeInterval
  );
  const steadyStateCMax = calculateSteadyStatePeak(
    safeDoseAmount,
    protocol.parameters,
    safeInterval
  );
  const steadyStateCMin = calculateSteadyStateTrough(
    safeDoseAmount,
    protocol.parameters,
    safeInterval
  );
  const steadyStateCAvg = calculateSteadyStateAverage(
    safeDoseAmount,
    protocol.parameters,
    safeInterval
  );
  const fluctuationPercentage = calculateFluctuationIndex(
    steadyStateCMax,
    steadyStateCMin,
    steadyStateCAvg
  );
  const timeToSteadyState90 = calculateTimeToSteadyState(
    protocol.parameters.halfLifeHours,
    0.9
  );
  const timeToSteadyState95 = calculateTimeToSteadyState(
    protocol.parameters.halfLifeHours,
    0.95
  );
  const aucTotalSimulated = calculateTrapezoidalAUC(trajectory);

  return {
    protocolId: protocol.id,
    schedule,
    tMax,
    cMax,
    aucSingleDose,
    aucSteadyStateInterval: aucSingleDose,
    aucTotalSimulated,
    steadyStateCMax,
    steadyStateCMin,
    steadyStateCAvg,
    accumulationIndex,
    fluctuationPercentage,
    timeToSteadyState90,
    timeToSteadyState95,
    trajectory,
  };
}

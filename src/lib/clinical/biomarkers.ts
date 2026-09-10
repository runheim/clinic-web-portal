/**
 * =============================================================================
 * CLINICAL STOICHIOMETRY & BIOCHEMISTRY ENGINE
 * Module: Biomarker Reference Ranges, Age Adjustments & Kinetic Modeling
 * 
 * Compliance: Zero-ePHI Quarantine Verified.
 * Execution: Pure in-memory calculation engine (100% deterministic, zero side-effects).
 * =============================================================================
 */

export type BiomarkerId =
  | "holoTC"
  | "mma"
  | "tdp"
  | "homocysteine"
  | "omega3Index"
  | "rbcMagnesium";

export type BiomarkerStatus = "deficient" | "borderline" | "optimal" | "elevated";

export type ClinicalDirection = "higher_is_better" | "lower_is_better";

export type DistributionType = "normal" | "log_normal";

export type AgeBracket = "pediatric" | "young_adult" | "mature_adult" | "geriatric";

export interface AgeAdjustedRange {
  biomarker: BiomarkerId;
  age: number;
  ageBracket: AgeBracket;
  unit: string;
  clinicalDirection: ClinicalDirection;
  distribution: DistributionType;
  deficientMax: number;
  borderlineMin: number;
  borderlineMax: number;
  optimalMin: number;
  optimalMax: number;
  elevatedMin: number;
  referenceInterval: [number, number]; // [2.5th percentile, 97.5th percentile]
  populationMedian: number;           // 50th percentile
}

export interface BiomarkerMetadata {
  id: BiomarkerId;
  commonName: string;
  systematicName: string;
  unit: string;
  clinicalDirection: ClinicalDirection;
  distribution: DistributionType;
  clinicalRole: string;
  defaultKineticParams: {
    vmax: number;
    km: number;
    halfLifeDays: number;
  };
}

export interface BiomarkerEvaluation {
  id: BiomarkerId;
  name: string;
  value: number;
  unit: string;
  age: number;
  ageBracket: AgeBracket;
  status: BiomarkerStatus;
  percentile: number;
  referenceRange: AgeAdjustedRange;
  isDeficient: boolean;
  isBorderline: boolean;
  isOptimal: boolean;
  isElevated: boolean;
  clinicalRationale: string;
}

export interface MetabolicPanelInput {
  age: number;
  sex?: "male" | "female" | "other";
  values: Partial<Record<BiomarkerId, number>>;
}

export interface MetabolicPanelEvaluation {
  age: number;
  sex?: "male" | "female" | "other";
  evaluations: Partial<Record<BiomarkerId, BiomarkerEvaluation>>;
  summary: {
    totalTested: number;
    deficientCount: number;
    borderlineCount: number;
    optimalCount: number;
    elevatedCount: number;
    neuroMetabolicScore: number; // 0 - 100
    isOptimal: boolean;
    hasDeficiency: boolean;
  };
  criticalFlags: string[];
  clinicalRecommendations: string[];
}

export interface KineticModelOptions {
  biomarker: BiomarkerId;
  initialConcentration: number;
  targetConcentration?: number;
  timeSpanDays?: number;
  stepSizeDays?: number;
  vmax?: number;
  km?: number;
  deliveryMode?: "oral_standard" | "lipophilic_mass_action";
  dailyDoseMg?: number;
  omega3Index?: number;
  age?: number;
}

export interface KineticDataPoint {
  day: number;
  concentration: number;
  rateOfChange: number; // dC/dt (units/day)
  percentile: number;
  status: BiomarkerStatus;
  isNormalized: boolean;
}

export interface KineticTrajectory {
  biomarker: BiomarkerId;
  initialConcentration: number;
  targetConcentration: number;
  timeSpanDays: number;
  stepSizeDays: number;
  dataPoints: KineticDataPoint[];
  timeToNormalizationDays: number | null;
  halfLifeDays: number;
  steadyStateConcentration: number;
  auc: number;
  isTargetAchieved: boolean;
  saturationPercentage: number;
}

// =============================================================================
// STATIC BIOMARKER METADATA
// =============================================================================

export const BIOMARKER_METADATA: Record<BiomarkerId, BiomarkerMetadata> = {
  holoTC: {
    id: "holoTC",
    commonName: "Active HoloTC B12",
    systematicName: "Holotranscobalamin (Transcobalamin II bound cobalamin)",
    unit: "pmol/L",
    clinicalDirection: "higher_is_better",
    distribution: "log_normal",
    clinicalRole: "Biologically active fraction of B12 available for direct cellular endocytosis.",
    defaultKineticParams: {
      vmax: 12.0,
      km: 45.0,
      halfLifeDays: 5.5,
    },
  },
  mma: {
    id: "mma",
    commonName: "Methylmalonic Acid (MMA)",
    systematicName: "Methylmalonic Acid",
    unit: "nmol/L",
    clinicalDirection: "lower_is_better",
    distribution: "log_normal",
    clinicalRole: "Functional biochemical marker of mitochondrial methylmalonyl-CoA mutase activity.",
    defaultKineticParams: {
      vmax: 35.0,
      km: 240.0,
      halfLifeDays: 8.0,
    },
  },
  tdp: {
    id: "tdp",
    commonName: "Whole Blood TDP (Thiamine)",
    systematicName: "Thiamine Diphosphate (Thiamine Pyrophosphate, TPP)",
    unit: "nmol/L",
    clinicalDirection: "higher_is_better",
    distribution: "log_normal",
    clinicalRole: "Essential cofactor for pyruvate dehydrogenase (PDH) and alpha-ketoglutarate dehydrogenase.",
    defaultKineticParams: {
      vmax: 45.0,
      km: 220.0,
      halfLifeDays: 14.0,
    },
  },
  homocysteine: {
    id: "homocysteine",
    commonName: "Plasma Homocysteine",
    systematicName: "Total Plasma Homocysteine (tHcy)",
    unit: "μmol/L",
    clinicalDirection: "lower_is_better",
    distribution: "log_normal",
    clinicalRole: "Vascular endothelial shear stress and methionine/folate remethylation efficiency marker.",
    defaultKineticParams: {
      vmax: 2.8,
      km: 11.5,
      halfLifeDays: 4.5,
    },
  },
  omega3Index: {
    id: "omega3Index",
    commonName: "Marine Omega-3 Index",
    systematicName: "Erythrocyte Membrane EPA + DHA Composition",
    unit: "%",
    clinicalDirection: "higher_is_better",
    distribution: "normal",
    clinicalRole: "Neuronal membrane lipid bilayer fluidity and VITACOG brain atrophy deceleration gate.",
    defaultKineticParams: {
      vmax: 0.18,
      km: 7.0,
      halfLifeDays: 42.0, // Reflects erythrocyte membrane lipid replacement lifespan
    },
  },
  rbcMagnesium: {
    id: "rbcMagnesium",
    commonName: "RBC Magnesium",
    systematicName: "Erythrocyte Intracellular Magnesium",
    unit: "mg/dL",
    clinicalDirection: "higher_is_better",
    distribution: "normal",
    clinicalRole: "Obligatory catalytic cofactor for ATP hydrolysis, phosphorylation, and DNA repair.",
    defaultKineticParams: {
      vmax: 0.22,
      km: 5.5,
      halfLifeDays: 21.0,
    },
  },
};

// =============================================================================
// AGE ADJUSTMENT LOGIC & REFERENCE RANGES
// =============================================================================

export function resolveAgeBracket(age: number): AgeBracket {
  if (age < 18) return "pediatric";
  if (age <= 45) return "young_adult";
  if (age <= 65) return "mature_adult";
  return "geriatric";
}

interface RawRangeConfig {
  deficientMax: number;
  borderlineMin: number;
  borderlineMax: number;
  optimalMin: number;
  optimalMax: number;
  elevatedMin: number;
  referenceInterval: [number, number];
  populationMedian: number;
}

const AGE_RANGE_DEFINITIONS: Record<BiomarkerId, Record<AgeBracket, RawRangeConfig>> = {
  holoTC: {
    pediatric: {
      deficientMax: 30,
      borderlineMin: 30,
      borderlineMax: 65,
      optimalMin: 65,
      optimalMax: 160,
      elevatedMin: 160,
      referenceInterval: [30, 160],
      populationMedian: 85,
    },
    young_adult: {
      deficientMax: 25,
      borderlineMin: 25,
      borderlineMax: 70,
      optimalMin: 70,
      optimalMax: 150,
      elevatedMin: 150,
      referenceInterval: [25, 150],
      populationMedian: 80,
    },
    mature_adult: {
      deficientMax: 25,
      borderlineMin: 25,
      borderlineMax: 70,
      optimalMin: 70,
      optimalMax: 150,
      elevatedMin: 150,
      referenceInterval: [25, 150],
      populationMedian: 75,
    },
    geriatric: {
      // In elderly, atrophic gastritis and intrinsic factor decline elevate deficient boundary
      deficientMax: 35,
      borderlineMin: 35,
      borderlineMax: 75,
      optimalMin: 75,
      optimalMax: 160,
      elevatedMin: 160,
      referenceInterval: [35, 160],
      populationMedian: 75,
    },
  },
  mma: {
    pediatric: {
      deficientMax: 320,
      borderlineMin: 220,
      borderlineMax: 320,
      optimalMin: 70,
      optimalMax: 220,
      elevatedMin: 320,
      referenceInterval: [70, 320],
      populationMedian: 140,
    },
    young_adult: {
      deficientMax: 380,
      borderlineMin: 260,
      borderlineMax: 380,
      optimalMin: 80,
      optimalMax: 260,
      elevatedMin: 380,
      referenceInterval: [80, 380],
      populationMedian: 170,
    },
    mature_adult: {
      deficientMax: 400,
      borderlineMin: 280,
      borderlineMax: 400,
      optimalMin: 85,
      optimalMax: 280,
      elevatedMin: 400,
      referenceInterval: [85, 400],
      populationMedian: 190,
    },
    geriatric: {
      // GFR decline with age increases normal serum MMA retention
      deficientMax: 460,
      borderlineMin: 320,
      borderlineMax: 460,
      optimalMin: 90,
      optimalMax: 320,
      elevatedMin: 460,
      referenceInterval: [90, 460],
      populationMedian: 230,
    },
  },
  tdp: {
    pediatric: {
      deficientMax: 90,
      borderlineMin: 90,
      borderlineMax: 250,
      optimalMin: 250,
      optimalMax: 650,
      elevatedMin: 650,
      referenceInterval: [90, 650],
      populationMedian: 300,
    },
    young_adult: {
      deficientMax: 78,
      borderlineMin: 78,
      borderlineMax: 275,
      optimalMin: 275,
      optimalMax: 675,
      elevatedMin: 675,
      referenceInterval: [78, 675],
      populationMedian: 350,
    },
    mature_adult: {
      deficientMax: 78,
      borderlineMin: 78,
      borderlineMax: 275,
      optimalMin: 275,
      optimalMax: 675,
      elevatedMin: 675,
      referenceInterval: [78, 675],
      populationMedian: 350,
    },
    geriatric: {
      deficientMax: 85,
      borderlineMin: 85,
      borderlineMax: 275,
      optimalMin: 275,
      optimalMax: 675,
      elevatedMin: 675,
      referenceInterval: [85, 675],
      populationMedian: 320,
    },
  },
  homocysteine: {
    pediatric: {
      deficientMax: 11.0,
      borderlineMin: 8.0,
      borderlineMax: 11.0,
      optimalMin: 4.0,
      optimalMax: 8.0,
      elevatedMin: 11.0,
      referenceInterval: [4.0, 11.0],
      populationMedian: 6.5,
    },
    young_adult: {
      deficientMax: 13.5,
      borderlineMin: 9.5,
      borderlineMax: 13.5,
      optimalMin: 5.0,
      optimalMax: 9.5,
      elevatedMin: 13.5,
      referenceInterval: [5.0, 13.5],
      populationMedian: 7.8,
    },
    mature_adult: {
      deficientMax: 15.0,
      borderlineMin: 10.0,
      borderlineMax: 15.0,
      optimalMin: 5.0,
      optimalMax: 10.0,
      elevatedMin: 15.0,
      referenceInterval: [5.0, 15.0],
      populationMedian: 8.8,
    },
    geriatric: {
      // Natural ~1 μmol/L rise per decade in older adults
      deficientMax: 16.5,
      borderlineMin: 12.0,
      borderlineMax: 16.5,
      optimalMin: 5.5,
      optimalMax: 12.0,
      elevatedMin: 16.5,
      referenceInterval: [5.5, 16.5],
      populationMedian: 10.2,
    },
  },
  omega3Index: {
    pediatric: {
      deficientMax: 4.0,
      borderlineMin: 4.0,
      borderlineMax: 7.5,
      optimalMin: 7.5,
      optimalMax: 12.0,
      elevatedMin: 12.0,
      referenceInterval: [4.0, 12.0],
      populationMedian: 6.5,
    },
    young_adult: {
      deficientMax: 4.0,
      borderlineMin: 4.0,
      borderlineMax: 8.0,
      optimalMin: 8.0,
      optimalMax: 12.0,
      elevatedMin: 12.0,
      referenceInterval: [4.0, 12.0],
      populationMedian: 6.0,
    },
    mature_adult: {
      deficientMax: 4.0,
      borderlineMin: 4.0,
      borderlineMax: 8.0,
      optimalMin: 8.0,
      optimalMax: 12.0,
      elevatedMin: 12.0,
      referenceInterval: [4.0, 12.0],
      populationMedian: 6.2,
    },
    geriatric: {
      deficientMax: 4.5,
      borderlineMin: 4.5,
      borderlineMax: 8.5,
      optimalMin: 8.5,
      optimalMax: 12.5,
      elevatedMin: 12.5,
      referenceInterval: [4.5, 12.5],
      populationMedian: 6.8,
    },
  },
  rbcMagnesium: {
    pediatric: {
      deficientMax: 4.0,
      borderlineMin: 4.0,
      borderlineMax: 5.8,
      optimalMin: 5.8,
      optimalMax: 7.5,
      elevatedMin: 7.5,
      referenceInterval: [4.0, 7.5],
      populationMedian: 5.5,
    },
    young_adult: {
      deficientMax: 4.2,
      borderlineMin: 4.2,
      borderlineMax: 6.0,
      optimalMin: 6.0,
      optimalMax: 7.5,
      elevatedMin: 7.5,
      referenceInterval: [4.2, 7.5],
      populationMedian: 5.4,
    },
    mature_adult: {
      deficientMax: 4.2,
      borderlineMin: 4.2,
      borderlineMax: 6.0,
      optimalMin: 6.0,
      optimalMax: 7.5,
      elevatedMin: 7.5,
      referenceInterval: [4.2, 7.5],
      populationMedian: 5.3,
    },
    geriatric: {
      deficientMax: 4.4,
      borderlineMin: 4.4,
      borderlineMax: 6.2,
      optimalMin: 6.2,
      optimalMax: 7.8,
      elevatedMin: 7.8,
      referenceInterval: [4.4, 7.8],
      populationMedian: 5.2,
    },
  },
};

export function getAgeAdjustedRange(biomarker: BiomarkerId, age: number): AgeAdjustedRange {
  if (Number.isNaN(age)) {
    throw new TypeError("Age must be a valid number");
  }
  const sanitizedAge = Math.max(0, Math.min(120, age));
  const ageBracket = resolveAgeBracket(sanitizedAge);
  const meta = BIOMARKER_METADATA[biomarker];
  if (!meta) {
    throw new Error(`Unknown biomarker identifier: ${String(biomarker)}`);
  }
  const raw = AGE_RANGE_DEFINITIONS[biomarker][ageBracket];

  return {
    biomarker,
    age: sanitizedAge,
    ageBracket,
    unit: meta.unit,
    clinicalDirection: meta.clinicalDirection,
    distribution: meta.distribution,
    deficientMax: raw.deficientMax,
    borderlineMin: raw.borderlineMin,
    borderlineMax: raw.borderlineMax,
    optimalMin: raw.optimalMin,
    optimalMax: raw.optimalMax,
    elevatedMin: raw.elevatedMin,
    referenceInterval: raw.referenceInterval,
    populationMedian: raw.populationMedian,
  };
}

// =============================================================================
// MATHEMATICAL STATISTICAL FUNCTIONS (CDF & PERCENTILE)
// =============================================================================

/**
 * Abramowitz and Stegun 7.1.26 polynomial approximation of Error Function erf(x).
 * Maximum absolute error < 1.5e-7.
 */
export function erf(x: number): number {
  if (x === 0) return 0;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);

  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const t = 1.0 / (1.0 + p * absX);
  const polynomial = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t;
  const y = 1.0 - polynomial * Math.exp(-absX * absX);

  return sign * y;
}

/**
 * Standard Normal Cumulative Distribution Function Phi(z).
 */
export function standardNormalCdf(z: number): number {
  return 0.5 * (1.0 + erf(z / Math.SQRT2));
}

/**
 * Calculates continuous percentile placement against age-adjusted reference ranges.
 * Anchored so that:
 * - Lower reference interval (2.5th percentile) => ~2.5%
 * - Median (50th percentile) => ~50.0%
 * - Upper reference interval (97.5th percentile) => ~97.5%
 * Pure deterministic in-memory calculation.
 */
export function calculateBiomarkerPercentile(
  biomarker: BiomarkerId,
  value: number,
  age: number
): number {
  if (Number.isNaN(value)) {
    throw new TypeError("Biomarker value must be a valid number");
  }
  const range = getAgeAdjustedRange(biomarker, age);
  const [L, U] = range.referenceInterval;
  const median = range.populationMedian;
  const sanitizedValue = Math.max(0, value);

  let z: number;
  const Z_2_5 = 1.95996; // 97.5% two-tailed quantile

  if (range.distribution === "log_normal") {
    // Avoid ln(0)
    const safeVal = Math.max(sanitizedValue, 0.0001);
    const lnVal = Math.log(safeVal);
    const lnMed = Math.log(median);

    if (safeVal <= median) {
      const lnL = Math.log(L);
      const sigmaLower = Math.max(0.001, (lnMed - lnL) / Z_2_5);
      z = (lnVal - lnMed) / sigmaLower;
    } else {
      const lnU = Math.log(U);
      const sigmaUpper = Math.max(0.001, (lnU - lnMed) / Z_2_5);
      z = (lnVal - lnMed) / sigmaUpper;
    }
  } else {
    // Normal distribution
    if (sanitizedValue <= median) {
      const sigmaLower = Math.max(0.001, (median - L) / Z_2_5);
      z = (sanitizedValue - median) / sigmaLower;
    } else {
      const sigmaUpper = Math.max(0.001, (U - median) / Z_2_5);
      z = (sanitizedValue - median) / sigmaUpper;
    }
  }

  const rawPercentile = standardNormalCdf(z) * 100.0;
  // Bound strictly between 0.1 and 99.9
  const clamped = Math.max(0.1, Math.min(99.9, rawPercentile));
  return Number(clamped.toFixed(1));
}

// =============================================================================
// BIOMARKER EVALUATION
// =============================================================================

function generateClinicalRationale(
  id: BiomarkerId,
  status: BiomarkerStatus,
  value: number,
  unit: string
): string {
  switch (id) {
    case "holoTC":
      if (status === "deficient") {
        return `Active HoloTC of ${value} ${unit} indicates critical cellular B12 depletion. Immediate methylcobalamin or hydroxocobalamin titration indicated.`;
      }
      if (status === "borderline") {
        return `Active HoloTC of ${value} ${unit} is borderline; transcobalamin II saturation is sub-maximal for high metabolic demands.`;
      }
      if (status === "optimal") {
        return `Active HoloTC of ${value} ${unit} clears the high-affinity cellular uptake threshold, supporting robust remethylation.`;
      }
      return `Active HoloTC of ${value} ${unit} is elevated, indicating saturated transcobalamin binding or recent parenteric repletion.`;

    case "mma":
      if (status === "optimal") {
        return `Methylmalonic acid ${value} ${unit} confirms normal mitochondrial methylmalonyl-CoA mutase flux without organic acid stalling.`;
      }
      if (status === "borderline") {
        return `Methylmalonic acid ${value} ${unit} reflects early subclinical tissue B12 insufficiency or minor renal clearance deceleration.`;
      }
      return `Methylmalonic acid ${value} ${unit} is elevated, diagnostic of mitochondrial organic acid stalling and functional B12 deficiency.`;

    case "tdp":
      if (status === "deficient") {
        return `Whole blood TDP of ${value} ${unit} is deficient. Critical risk of cerebral pyruvate dehydrogenase (PDH) enzyme hysteresis.`;
      }
      if (status === "borderline") {
        return `Whole blood TDP of ${value} ${unit} is within standard reference but below mass-action neuro-protective threshold (275-675 nmol/L).`;
      }
      if (status === "optimal") {
        return `Whole blood TDP of ${value} ${unit} achieves mass-action saturation, bypassing low-affinity enzyme polymorphisms.`;
      }
      return `Whole blood TDP of ${value} ${unit} indicates supraphysiological circulating thiamine ester levels.`;

    case "homocysteine":
      if (status === "optimal") {
        return `Plasma homocysteine ${value} ${unit} indicates unimpeded vascular remethylation and transsulfuration, protecting endothelial eNOS.`;
      }
      if (status === "borderline") {
        return `Plasma homocysteine ${value} ${unit} exhibits mild accumulation, signifying borderline B-vitamin cofactor availability.`;
      }
      return `Plasma homocysteine ${value} ${unit} is elevated (hyperhomocysteinemia), accelerating small-vessel arteriosclerotic shear.`;

    case "omega3Index":
      if (status === "deficient") {
        return `Omega-3 Index ${value}${unit} is severely deficient (<4.0%), compromising neuronal membrane fluidity and lipid raft signaling.`;
      }
      if (status === "borderline") {
        return `Omega-3 Index ${value}${unit} is suboptimal (4.0-7.9%). VITACOG trial demonstrates blunted B-vitamin responsiveness below 8.0%.`;
      }
      if (status === "optimal") {
        return `Omega-3 Index ${value}${unit} satisfies the protective gate (≥8.0%), enabling optimal neuronal membrane permeability.`;
      }
      return `Omega-3 Index ${value}${unit} is highly elevated (>12.0%), providing maximum membrane fluidity with low inflammatory eicosanoids.`;

    case "rbcMagnesium":
      if (status === "deficient") {
        return `RBC magnesium ${value} ${unit} indicates intracellular magnesium depletion, limiting Mg-ATP catalytic phosphorylation.`;
      }
      if (status === "borderline") {
        return `RBC magnesium ${value} ${unit} is borderline; intracellular enzyme cofactors are operating at sub-peak velocities.`;
      }
      if (status === "optimal") {
        return `RBC magnesium ${value} ${unit} supports stable ATP-chelation, mitochondrial respiration, and NMDA receptor gating.`;
      }
      return `RBC magnesium ${value} ${unit} is elevated above typical physiological limits.`;
  }
}

export function evaluateBiomarker(
  biomarker: BiomarkerId,
  value: number,
  age: number
): BiomarkerEvaluation {
  const range = getAgeAdjustedRange(biomarker, age);
  const meta = BIOMARKER_METADATA[biomarker];
  const percentile = calculateBiomarkerPercentile(biomarker, value, age);

  let status: BiomarkerStatus;

  if (range.clinicalDirection === "higher_is_better") {
    if (value < range.deficientMax) {
      status = "deficient";
    } else if (value < range.optimalMin) {
      status = "borderline";
    } else if (value <= range.optimalMax) {
      status = "optimal";
    } else {
      status = "elevated";
    }
  } else {
    // lower_is_better (e.g. MMA, Homocysteine)
    if (value <= range.optimalMax) {
      status = "optimal";
    } else if (value <= range.borderlineMax) {
      status = "borderline";
    } else {
      status = "elevated";
    }
  }

  const isDeficient =
    range.clinicalDirection === "higher_is_better"
      ? status === "deficient"
      : status === "elevated"; // High MMA / Homocysteine = functional deficiency

  const isBorderline = status === "borderline";
  const isOptimal = status === "optimal";
  const isElevated = status === "elevated";

  return {
    id: biomarker,
    name: meta.commonName,
    value,
    unit: meta.unit,
    age: range.age,
    ageBracket: range.ageBracket,
    status,
    percentile,
    referenceRange: range,
    isDeficient,
    isBorderline,
    isOptimal,
    isElevated,
    clinicalRationale: generateClinicalRationale(biomarker, status, value, meta.unit),
  };
}

// =============================================================================
// METABOLIC PANEL EVALUATION
// =============================================================================

export function evaluateMetabolicPanel(input: MetabolicPanelInput): MetabolicPanelEvaluation {
  if (typeof input.age !== "number" || Number.isNaN(input.age)) {
    throw new TypeError("MetabolicPanelInput must contain a valid numeric age");
  }

  const evaluations: Partial<Record<BiomarkerId, BiomarkerEvaluation>> = {};
  const criticalFlags: string[] = [];
  const clinicalRecommendations: string[] = [];

  let deficientCount = 0;
  let borderlineCount = 0;
  let optimalCount = 0;
  let elevatedCount = 0;
  let scoreSum = 0;
  let totalTested = 0;

  const entries = Object.entries(input.values) as [BiomarkerId, number | undefined][];

  for (const [id, val] of entries) {
    if (typeof val === "number" && !Number.isNaN(val)) {
      const evaluation = evaluateBiomarker(id, val, input.age);
      evaluations[id] = evaluation;
      totalTested += 1;

      if (evaluation.isDeficient) {
        deficientCount += 1;
        scoreSum += 20;
      } else if (evaluation.isBorderline) {
        borderlineCount += 1;
        scoreSum += 60;
      } else if (evaluation.isOptimal) {
        optimalCount += 1;
        scoreSum += 100;
      } else {
        elevatedCount += 1;
        scoreSum += 50;
      }

      // Flag checks
      if (id === "omega3Index" && val < 8.0) {
        criticalFlags.push(
          val < 4.0
            ? "CRITICAL: Severe Omega-3 Index deficiency (<4.0%) imposes severe membrane rigidity."
            : "VITACOG GATE: Omega-3 Index below 8.0% blunts B-vitamin brain atrophy preservation."
        );
        clinicalRecommendations.push(
          "Titrate high-purity marine EPA/DHA (2,000–3,000 mg/day) to clear the 8.0% membrane gate."
        );
      }

      if (id === "homocysteine" && val > 15.0) {
        criticalFlags.push(
          `VASCULAR RISK: Hyperhomocysteinemia (${val} μmol/L) accelerates vascular endothelial damage.`
        );
        clinicalRecommendations.push(
          "Initiate synergistic remethylation protocol with 5-MTHF, methylcobalamin, and TMG."
        );
      }

      if (id === "mma" && val > 400) {
        criticalFlags.push(
          `MITOCHONDRIAL STALL: Elevated MMA (${val} nmol/L) confirms intracellular B12 deficiency.`
        );
        clinicalRecommendations.push(
          "Administer high-dose parenteral or sublingual adenosyl/methylcobalamin to restore mutase flux."
        );
      }

      if (id === "tdp" && val < 78) {
        criticalFlags.push(
          `ENZYME HYSTERESIS: TDP depletion (${val} nmol/L) paralyzes pyruvate dehydrogenase complexes.`
        );
        clinicalRecommendations.push(
          "Initiate lipophilic TTFD thiamine (300 mg/day) to achieve mass-action cellular penetration."
        );
      }

      if (id === "holoTC" && val < 25) {
        criticalFlags.push(
          `CELLULAR STARVATION: Active HoloTC exhausted (<25 pmol/L); transcobalamin delivery stalled.`
        );
      }

      if (id === "rbcMagnesium" && val < 4.2) {
        criticalFlags.push(
          `CATALYTIC DEFICIT: Intracellular RBC magnesium low (${val} mg/dL); Mg-ATP reactivity impaired.`
        );
        clinicalRecommendations.push(
          "Supplement highly bioavailable magnesium glycinate or threonate (400 mg elemental Mg/day)."
        );
      }
    }
  }

  const neuroMetabolicScore = totalTested > 0 ? Math.round(scoreSum / totalTested) : 0;
  const isOptimal = totalTested > 0 && deficientCount === 0 && borderlineCount === 0;
  const hasDeficiency = deficientCount > 0;

  return {
    age: input.age,
    sex: input.sex,
    evaluations,
    summary: {
      totalTested,
      deficientCount,
      borderlineCount,
      optimalCount,
      elevatedCount,
      neuroMetabolicScore,
      isOptimal,
      hasDeficiency,
    },
    criticalFlags,
    clinicalRecommendations,
  };
}

// =============================================================================
// KINETIC SATURATION MODELING
// =============================================================================

/**
 * Calculates instantaneous enzyme reaction velocity via Michaelis-Menten kinetics.
 * v = (Vmax * [S]) / (Km + [S])
 */
export function calculateMichaelisMentenRate(
  concentration: number,
  vmax: number,
  km: number
): number {
  if (concentration <= 0 || vmax <= 0 || km <= 0) return 0;
  return (vmax * concentration) / (km + concentration);
}

/**
 * Computes fractional saturation percentage: [S] / (Km + [S]) * 100
 */
export function calculateSaturationPercentage(concentration: number, km: number): number {
  if (concentration <= 0 || km <= 0) return 0;
  const fraction = concentration / (km + concentration);
  return Number((fraction * 100).toFixed(1));
}

/**
 * Computes elimination half-life from rate constant k: t_1/2 = ln(2) / k
 */
export function calculateClearanceHalfLife(rateConstant: number): number {
  if (rateConstant <= 0) return 0;
  return Number((Math.LN2 / rateConstant).toFixed(2));
}

/**
 * Lipophilic TTFD vs Water-Soluble HCl saturation kinetics calculator.
 * Directly integrates the clinical Stoichiometry Simulator model.
 */
export function calculateTTFDSaturation(
  doseMg: number,
  deliveryMode: "hcl" | "ttfd",
  omega3Index: number
): {
  saturationPercentage: number;
  isOmegaGateSatisfied: boolean;
  isStoichiometricSaturationActive: boolean;
} {
  const safeDose = Math.max(0, Math.min(1200, doseMg));
  const isOmegaGateSatisfied = omega3Index >= 8.0;

  // Oral HCl saturates active SLC19A transporters around 18-22%
  // TTFD diffuses passively through lipid membranes reaching up to 98%
  const saturationPercentage =
    deliveryMode === "hcl"
      ? Math.min(22, Math.round((safeDose / 600) * 20 + 8))
      : Math.min(98, Math.round(40 + (safeDose / 600) * 55));

  const isStoichiometricSaturationActive = deliveryMode === "ttfd" && isOmegaGateSatisfied;

  return {
    saturationPercentage,
    isOmegaGateSatisfied,
    isStoichiometricSaturationActive,
  };
}

/**
 * Simulates biomarker normalization and kinetic clearance/repletion over time.
 * Pure deterministic in-memory calculation engine using Runge-Kutta (RK4) integration.
 */
export function modelKinetics(options: KineticModelOptions): KineticTrajectory {
  const {
    biomarker,
    initialConcentration,
    timeSpanDays = 90,
    stepSizeDays = 1,
    deliveryMode = "lipophilic_mass_action",
    dailyDoseMg = 300,
    omega3Index = 8.5,
    age = 40,
  } = options;

  const meta = BIOMARKER_METADATA[biomarker];
  const range = getAgeAdjustedRange(biomarker, age);

  // Determine target concentration
  let targetConcentration: number;
  if (typeof options.targetConcentration === "number") {
    targetConcentration = options.targetConcentration;
  } else if (meta.clinicalDirection === "lower_is_better") {
    // Normalization toward mid-optimal
    targetConcentration = (range.optimalMin + range.optimalMax) / 2;
  } else {
    // Repletion toward target
    targetConcentration = range.optimalMin + (range.optimalMax - range.optimalMin) * 0.4;
  }

  const vmax = options.vmax ?? meta.defaultKineticParams.vmax;
  const km = options.km ?? meta.defaultKineticParams.km;

  // Membrane gate modifier (Oxford VITACOG trial effect)
  const isOmegaGateCleared = omega3Index >= 8.0;
  const membraneEfficiency = isOmegaGateCleared ? 1.0 : 0.55;

  // Delivery mode modifier (TTFD passive diffusion vs HCl carrier saturation)
  const deliveryEfficiency = deliveryMode === "lipophilic_mass_action" ? 1.0 : 0.35;

  // Dose scaling factor
  const doseFactor = Math.min(2.0, Math.max(0.2, dailyDoseMg / 300));
  const effectiveVmax = vmax * membraneEfficiency * deliveryEfficiency * doseFactor;

  const isClearance = initialConcentration > targetConcentration;
  const totalSteps = Math.max(1, Math.round(timeSpanDays / stepSizeDays));
  const internalDt = Math.min(0.1, stepSizeDays / 5);

  const dataPoints: KineticDataPoint[] = [];

  let currentConcentration = initialConcentration;
  let timeToNormalizationDays: number | null = null;
  let halfLifeConcentrationPassed = false;
  let halfLifeDays = meta.defaultKineticParams.halfLifeDays;

  const halfConcentrationDelta = Math.abs(initialConcentration - targetConcentration) / 2;
  const halfTargetValue = isClearance
    ? initialConcentration - halfConcentrationDelta
    : initialConcentration + halfTargetValueDelta(initialConcentration, halfConcentrationDelta);

  function halfTargetValueDelta(init: number, delta: number): number {
    return delta;
  }

  // Check day 0 status
  const initialEval = evaluateBiomarker(biomarker, initialConcentration, age);
  if (initialEval.isOptimal) {
    timeToNormalizationDays = 0;
  }

  dataPoints.push({
    day: 0,
    concentration: Number(initialConcentration.toFixed(2)),
    rateOfChange: 0,
    percentile: initialEval.percentile,
    status: initialEval.status,
    isNormalized: initialEval.isOptimal,
  });

  // Derivative function dC/dt
  const computeDerivative = (c: number): number => {
    if (isClearance) {
      // Clearance of accumulated metabolite toward target
      const excess = Math.max(0, c - targetConcentration);
      if (excess <= 0.0001) return 0;
      const rate = (effectiveVmax * excess) / (km + excess);
      return -rate;
    } else {
      // Repletion of deficient cofactor toward target
      const deficit = Math.max(0, targetConcentration - c);
      if (deficit <= 0.0001) return 0;
      const rate = (effectiveVmax * deficit) / (km + deficit);
      return rate;
    }
  };

  let simulatedTime = 0;

  for (let step = 1; step <= totalSteps; step++) {
    const nextTargetTime = step * stepSizeDays;

    while (simulatedTime < nextTargetTime - 1e-9) {
      const dt = Math.min(internalDt, nextTargetTime - simulatedTime);

      // Runge-Kutta 4th Order
      const k1 = computeDerivative(currentConcentration);
      const k2 = computeDerivative(currentConcentration + 0.5 * dt * k1);
      const k3 = computeDerivative(currentConcentration + 0.5 * dt * k2);
      const k4 = computeDerivative(currentConcentration + dt * k3);

      const dC = (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      currentConcentration += dC;

      // Prevent overshoot beyond target
      if (isClearance && currentConcentration < targetConcentration) {
        currentConcentration = targetConcentration;
      } else if (!isClearance && currentConcentration > targetConcentration) {
        currentConcentration = targetConcentration;
      }

      simulatedTime += dt;

      // Detect half-life crossing
      if (!halfLifeConcentrationPassed) {
        if (
          (isClearance && currentConcentration <= halfTargetValue) ||
          (!isClearance && currentConcentration >= halfTargetValue)
        ) {
          halfLifeDays = Number(simulatedTime.toFixed(1));
          halfLifeConcentrationPassed = true;
        }
      }
    }

    const currentEval = evaluateBiomarker(biomarker, currentConcentration, age);

    if (timeToNormalizationDays === null && currentEval.isOptimal) {
      timeToNormalizationDays = Number(nextTargetTime.toFixed(1));
    }

    const instantaneousRate = computeDerivative(currentConcentration);

    dataPoints.push({
      day: nextTargetTime,
      concentration: Number(currentConcentration.toFixed(2)),
      rateOfChange: Number(instantaneousRate.toFixed(3)),
      percentile: currentEval.percentile,
      status: currentEval.status,
      isNormalized: currentEval.isOptimal,
    });
  }

  // Calculate Trapezoidal AUC (Area Under Curve)
  let auc = 0;
  for (let i = 0; i < dataPoints.length - 1; i++) {
    const dt = dataPoints[i + 1].day - dataPoints[i].day;
    auc += 0.5 * (dataPoints[i].concentration + dataPoints[i + 1].concentration) * dt;
  }

  const finalConcentration = dataPoints[dataPoints.length - 1].concentration;
  const finalEval = evaluateBiomarker(biomarker, finalConcentration, age);
  const saturationPercentage = calculateSaturationPercentage(finalConcentration, km);

  return {
    biomarker,
    initialConcentration,
    targetConcentration: Number(targetConcentration.toFixed(2)),
    timeSpanDays,
    stepSizeDays,
    dataPoints,
    timeToNormalizationDays,
    halfLifeDays,
    steadyStateConcentration: finalConcentration,
    auc: Number(auc.toFixed(1)),
    isTargetAchieved: finalEval.isOptimal,
    saturationPercentage,
  };
}

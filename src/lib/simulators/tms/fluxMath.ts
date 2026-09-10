/**
 * @file fluxMath.ts
 * @description Electromagnetic field calculations for figure-8 (butterfly) Transcranial
 * Magnetic Stimulation (TMS) coils targeting the Left Dorsolateral Prefrontal Cortex (DLPFC).
 *
 * Implements Biot-Savart approximations for magnetic flux density B (Tesla), induced
 * electric field E (V/m), tissue conductivity current density J (A/m^2), cortical depth
 * attenuation profiles (0 to 30 mm), focal hotspot beam divergence, neuronal depolarization
 * threshold depths, and coil rotation angle field distortion.
 */

export type TissueLayerId =
  | "scalp"
  | "skull"
  | "csf"
  | "gray_matter"
  | "white_matter";

export interface TissueLayerInfo {
  readonly id: TissueLayerId;
  readonly name: string;
  readonly anatomicalRegion: string;
  readonly startDepthMm: number;
  readonly endDepthMm: number;
  readonly conductivitySpm: number; // Siemens per meter (S/m)
  readonly relativePermittivity: number;
  readonly colorHex: string;
  readonly description: string;
}

/**
 * Standard 5-layer cranial tissue model for Left DLPFC (Brodmann Area 9/46).
 * Depths and electrical conductivities based on standard human head models (SimNIBS / Gabriel et al.).
 */
export const TISSUE_LAYERS: readonly TissueLayerInfo[] = [
  {
    id: "scalp",
    name: "Scalp",
    anatomicalRegion: "Cutaneous & Subcutaneous GALEA",
    startDepthMm: 0,
    endDepthMm: 4,
    conductivitySpm: 0.33,
    relativePermittivity: 1.0e4,
    colorHex: "#f5d0a9",
    description: "Epidermis, dermis, and epicranial aponeurosis",
  },
  {
    id: "skull",
    name: "Skull",
    anatomicalRegion: "Cranium (Cortical & Diploe Bone)",
    startDepthMm: 4,
    endDepthMm: 9,
    conductivitySpm: 0.008,
    relativePermittivity: 1.2e2,
    colorHex: "#e0d6c3",
    description: "Compact outer/inner tables and cancellous diploe",
  },
  {
    id: "csf",
    name: "Cerebrospinal Fluid",
    anatomicalRegion: "Subarachnoid Space (CSF)",
    startDepthMm: 9,
    endDepthMm: 12,
    conductivitySpm: 1.79,
    relativePermittivity: 1.09e2,
    colorHex: "#4fc3f7",
    description: "High-conductivity ionic fluid buffer surrounding cerebral gyri",
  },
  {
    id: "gray_matter",
    name: "Gray Matter",
    anatomicalRegion: "Left DLPFC (Brodmann Area 9/46)",
    startDepthMm: 12,
    endDepthMm: 22,
    conductivitySpm: 0.35,
    relativePermittivity: 3.8e4,
    colorHex: "#ba68c8",
    description: "Cerebral cortex targeting DLPFC pyramidal neuron soma & dendrites",
  },
  {
    id: "white_matter",
    name: "White Matter",
    anatomicalRegion: "Subcortical Axonal Projections",
    startDepthMm: 22,
    endDepthMm: 30,
    conductivitySpm: 0.14,
    relativePermittivity: 1.5e4,
    colorHex: "#90caf9",
    description: "Myelinated axon fiber tracts communicating with limbic structures",
  },
] as const;

export interface TmsSimulationParams {
  /** Effective radius of each coil wing in mm (default: 35 mm for 70mm double coil) */
  coilRadiusMm: number;
  /** Peak magnetic flux density B at coil surface at 100% MT in Tesla (default: 2.0 T) */
  peakSurfaceBTesla: number;
  /** Peak induced electric field E at coil surface at 100% MT in V/m (default: 180.0 V/m) */
  peakSurfaceEVpm: number;
  /** Neuronal depolarization threshold in V/m (default: 60.0 V/m for cortical pyramidal cells) */
  depolarizationThresholdVpm: number;
  /** Baseline focal hotspot diameter at surface in mm (default: 16.0 mm) */
  surfaceHotspotDiameterMm: number;
  /** Optimal coil orientation angle relative to sagittal midline in degrees (default: 45.0 deg) */
  optimalCoilAngleDeg: number;
  /** Tissue attenuation coefficient per mm (default: 0.018 mm^-1) */
  tissueAttenuationPerMm: number;
}

export const DEFAULT_TMS_PARAMS: Readonly<TmsSimulationParams> = {
  coilRadiusMm: 35.0,
  peakSurfaceBTesla: 2.0,
  peakSurfaceEVpm: 180.0,
  depolarizationThresholdVpm: 60.0,
  surfaceHotspotDiameterMm: 16.0,
  optimalCoilAngleDeg: 45.0,
  tissueAttenuationPerMm: 0.018,
};

export interface CoilAngleDistortionResult {
  /** Deviation from optimal 45° orientation in degrees (|angle - 45|) */
  angularDeviationDeg: number;
  /** Effective field coupling efficiency factor (0.0 to 1.0) */
  efficiencyFactor: number;
  /** Field distortion fraction (0.0 = perfect alignment, 1.0 = orthogonal) */
  distortionFactor: number;
  /** Percentage loss in effective neuronal depolarization coupling */
  percentageLoss: number;
}

export interface TmsFluxPoint {
  /** Cortical depth in millimeters (0 to 30 mm) */
  depthMm: number;
  /** Magnetic flux density B in Tesla (Biot-Savart model) */
  magneticFluxB: number;
  /** Alias for magneticFluxB in Tesla */
  bFieldTesla: number;
  /** Induced electric field E in V/m (Faraday-Maxwell model) */
  inducedElectricFieldE: number;
  /** Alias for inducedElectricFieldE in V/m */
  eFieldVpm: number;
  /** Current density J = sigma * E in A/m^2 */
  currentDensityJ: number;
  /** Associated cranial tissue layer info */
  tissueLayer: TissueLayerInfo;
  /** Whether the induced electric field exceeds neuronal depolarization threshold */
  isDepolarized: boolean;
  /** The depolarization threshold reference value used (V/m) */
  depolarizationThresholdVpm: number;
  /** Focal hotspot diameter (FWHM) at this depth in mm */
  focalHotspotDiameterMm: number;
  /** Alias for focalHotspotDiameterMm in mm */
  focalSpotDiameterMm: number;
  /** Normalized field decay factor relative to surface (0.0 to 1.0) */
  decayFactor: number;
  /** Field attenuation percentage relative to surface peak (0% to 100%) */
  attenuationPercent: number;
}

export interface Vector2D {
  x: number;
  z: number;
  magnitude: number;
  angleRad: number;
}

export interface TmsVectorGridPoint {
  xMm: number;
  depthMm: number;
  bVector: Vector2D;
  eMagnitudeVpm: number;
  currentDensityJ: number;
  tissueLayer: TissueLayerInfo;
  isDepolarized: boolean;
}

/**
 * Resolves the cranial tissue layer for a given depth in millimeters.
 *
 * @param depthMm Depth from scalp surface in mm (>= 0).
 * @returns The matching TissueLayerInfo object.
 */
export function getTissueLayer(depthMm: number): TissueLayerInfo {
  const clamped = Math.max(0, depthMm);
  for (const layer of TISSUE_LAYERS) {
    if (clamped >= layer.startDepthMm && clamped < layer.endDepthMm) {
      return layer;
    }
  }
  // Return the deepest layer if depth exceeds known layers (white matter)
  return TISSUE_LAYERS[TISSUE_LAYERS.length - 1];
}

/**
 * Computes coil angle field distortion and neuronal coupling efficiency
 * relative to the optimal 45° orientation targeting the Left DLPFC.
 *
 * Clinical justification: Left DLPFC stimulation with figure-8 coils achieves
 * optimal induced current perpendicular to the precentral gyrus when oriented
 * at 45° to the sagittal midline. Deviations reduce the cosine projection
 * across cortical pyramidal columns.
 *
 * @param coilAngleDeg Coil orientation angle in degrees (typically 0° to 90°).
 * @param optimalAngleDeg Optimal orientation in degrees (default 45°).
 * @returns CoilAngleDistortionResult containing efficiency and distortion metrics.
 */
export function calculateCoilAngleDistortion(
  coilAngleDeg: number,
  optimalAngleDeg: number = DEFAULT_TMS_PARAMS.optimalCoilAngleDeg
): CoilAngleDistortionResult {
  const deviation = Math.abs(coilAngleDeg - optimalAngleDeg);
  const rad = (deviation * Math.PI) / 180;
  // Cosine projection of the induced vector onto the pyramidal cell somatodendritic axis
  const efficiency = Math.max(0, Math.cos(rad));
  const distortion = 1 - efficiency;
  const percentageLoss = distortion * 100;

  return {
    angularDeviationDeg: deviation,
    efficiencyFactor: efficiency,
    distortionFactor: distortion,
    percentageLoss,
  };
}

/**
 * Computes the focal hotspot diameter (Full Width at Half Maximum, FWHM)
 * of the figure-8 coil induced electric field as a function of depth.
 *
 * Hotspot expands as the electromagnetic beam diverges through tissue.
 *
 * @param depthMm Depth from scalp surface in mm.
 * @param params Optional simulation parameters.
 * @returns Focal hotspot diameter in mm.
 */
export function calculateHotspotDiameter(
  depthMm: number,
  params: TmsSimulationParams = DEFAULT_TMS_PARAMS
): number {
  const z = Math.max(0, depthMm);
  const R = params.coilRadiusMm;
  const D0 = params.surfaceHotspotDiameterMm;
  // Beam divergence: geometric expansion + tissue scatter
  const geometricSpread = Math.sqrt(1 + Math.pow(z / R, 2));
  const linearScatter = 0.45 * z;
  return D0 * geometricSpread + linearScatter;
}

/**
 * Calculates electromagnetic flux density B, induced electric field E,
 * and current density J at a specific depth for a given TMS intensity percentage.
 *
 * Uses Biot-Savart circular double-loop approximation with exponential volume
 * conductor tissue attenuation.
 *
 * @param depthMm Depth in millimeters (0 to 30 mm).
 * @param intensityPercent Machine output / motor threshold percentage (e.g. 80 to 120).
 * @param options Optional parameter overrides or coil angle.
 * @returns TmsFluxPoint with comprehensive dosimetry calculations.
 */
export function calculateFluxAtDepth(
  depthMm: number,
  intensityPercent: number,
  options?: {
    coilAngleDeg?: number;
    params?: Partial<TmsSimulationParams>;
  }
): TmsFluxPoint {
  const z = Math.max(0, depthMm);
  const config: TmsSimulationParams = {
    ...DEFAULT_TMS_PARAMS,
    ...options?.params,
  };

  const angleDeg = options?.coilAngleDeg ?? config.optimalCoilAngleDeg;
  const angleMetrics = calculateCoilAngleDistortion(angleDeg, config.optimalCoilAngleDeg);

  const intensityScale = Math.max(0, intensityPercent) / 100;
  const R = config.coilRadiusMm;

  // Biot-Savart on-axis loop decay factor: (R^2 / (R^2 + z^2))^(3/2)
  const rSquared = R * R;
  const zSquared = z * z;
  const biotSavartFactor = Math.pow(rSquared / (rSquared + zSquared), 1.5);

  // Tissue absorption / boundary dissipation
  const tissueDissipation = Math.exp(-config.tissueAttenuationPerMm * z);

  // Combined decay factor relative to surface peak
  const decayFactor = biotSavartFactor * tissueDissipation;

  // Magnetic flux density B (Tesla): Magnetic permeability of biological tissue ~ mu_0,
  // so tissue conductivity boundary effects do not significantly attenuate B compared to E.
  const magneticFluxB = config.peakSurfaceBTesla * intensityScale * biotSavartFactor;

  // Induced electric field E (V/m): Faraday-Maxwell induction scaled by angle coupling and tissue dissipation
  const inducedElectricFieldE =
    config.peakSurfaceEVpm *
    intensityScale *
    decayFactor *
    angleMetrics.efficiencyFactor;

  const tissue = getTissueLayer(z);

  // Ohm's law in volume conductor: J = sigma * E (A/m^2)
  const currentDensityJ = tissue.conductivitySpm * inducedElectricFieldE;

  const isDepolarized = inducedElectricFieldE >= config.depolarizationThresholdVpm;
  const hotspotDiameter = calculateHotspotDiameter(z, config);
  const attenuationPercent = Math.max(0, Math.min(100, (1 - decayFactor) * 100));

  return {
    depthMm: z,
    magneticFluxB,
    bFieldTesla: magneticFluxB,
    inducedElectricFieldE,
    eFieldVpm: inducedElectricFieldE,
    currentDensityJ,
    tissueLayer: tissue,
    isDepolarized,
    depolarizationThresholdVpm: config.depolarizationThresholdVpm,
    focalHotspotDiameterMm: hotspotDiameter,
    focalSpotDiameterMm: hotspotDiameter,
    decayFactor,
    attenuationPercent,
  };
}

/**
 * Generates a discrete depth profile of TMS flux points across cortical depths.
 *
 * @param intensityPercent Motor threshold percentage (e.g., 80% to 120%).
 * @param maxDepthMm Maximum depth to profile in mm (default: 30 mm).
 * @param options Additional options including step size in mm and coil angle.
 * @returns Array of TmsFluxPoint items from 0 mm to maxDepthMm.
 */
export function generateDepthProfile(
  intensityPercent: number,
  maxDepthMm: number = 30,
  options?: {
    stepMm?: number;
    coilAngleDeg?: number;
    params?: Partial<TmsSimulationParams>;
  }
): TmsFluxPoint[] {
  const step = options?.stepMm && options.stepMm > 0 ? options.stepMm : 1;
  const maxZ = Math.max(1, maxDepthMm);
  const points: TmsFluxPoint[] = [];

  for (let z = 0; z <= maxZ + 1e-6; z += step) {
    const roundedZ = Math.round(z * 100) / 100;
    points.push(
      calculateFluxAtDepth(roundedZ, intensityPercent, {
        coilAngleDeg: options?.coilAngleDeg,
        params: options?.params,
      })
    );
  }

  return points;
}

/**
 * Computes the maximum cortical depth (in mm) at which the induced electric field
 * exceeds the neuronal depolarization threshold for the given intensity.
 *
 * Uses high-precision bisection over the interval [0, 80 mm].
 *
 * @param intensityPercent TMS intensity percent (e.g. 100 for 100% MT).
 * @param thresholdVpm Custom threshold in V/m (default 60 V/m).
 * @param coilAngleDeg Coil angle in degrees (default 45°).
 * @param params Optional parameter overrides.
 * @returns Depth in mm (0.0 if even surface field is sub-threshold).
 */
export function calculateThresholdDepolarizationDepth(
  intensityPercent: number,
  thresholdVpm: number = DEFAULT_TMS_PARAMS.depolarizationThresholdVpm,
  coilAngleDeg: number = DEFAULT_TMS_PARAMS.optimalCoilAngleDeg,
  params?: Partial<TmsSimulationParams>
): number {
  const config = { ...DEFAULT_TMS_PARAMS, ...params, depolarizationThresholdVpm: thresholdVpm };
  const surfacePoint = calculateFluxAtDepth(0, intensityPercent, {
    coilAngleDeg,
    params: config,
  });

  if (surfacePoint.inducedElectricFieldE < thresholdVpm) {
    return 0;
  }

  let low = 0;
  let high = 80;
  const toleranceMm = 0.01;

  // Check if 80 mm is still above threshold
  const deepPoint = calculateFluxAtDepth(high, intensityPercent, {
    coilAngleDeg,
    params: config,
  });
  if (deepPoint.inducedElectricFieldE >= thresholdVpm) {
    return high;
  }

  while (high - low > toleranceMm) {
    const mid = (low + high) / 2;
    const pt = calculateFluxAtDepth(mid, intensityPercent, {
      coilAngleDeg,
      params: config,
    });
    if (pt.inducedElectricFieldE >= thresholdVpm) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.round(((low + high) / 2) * 100) / 100;
}

/**
 * Computes a 2D grid vector field in the lateral (x) and depth (z) coronal plane
 * beneath the figure-8 coil for HTML5 canvas rendering.
 *
 * @param widthMm Lateral span in mm (e.g. 80 for -40 mm to +40 mm).
 * @param depthMm Depth span in mm (e.g. 30 for 0 to 30 mm).
 * @param stepMm Grid step in mm (e.g. 2 mm).
 * @param intensityPercent Intensity percentage (80% to 120%).
 * @param coilAngleDeg Coil angle (default 45°).
 * @returns 2D array of TmsVectorGridPoint items.
 */
export function calculateVectorField2D(
  widthMm: number = 80,
  depthMm: number = 30,
  stepMm: number = 2.5,
  intensityPercent: number = 100,
  coilAngleDeg: number = DEFAULT_TMS_PARAMS.optimalCoilAngleDeg
): TmsVectorGridPoint[][] {
  const halfWidth = widthMm / 2;
  const grid: TmsVectorGridPoint[][] = [];
  const R = DEFAULT_TMS_PARAMS.coilRadiusMm;
  const mu0Over2Pi = 2e-7; // permeability factor
  const baseCurrentI = 5000 * (intensityPercent / 100);

  for (let z = 0; z <= depthMm; z += stepMm) {
    const row: TmsVectorGridPoint[] = [];
    const fluxPoint = calculateFluxAtDepth(z, intensityPercent, { coilAngleDeg });

    for (let x = -halfWidth; x <= halfWidth; x += stepMm) {
      // 2D Biot-Savart approximation for 3 parallel junction lines:
      // Center junction at x=0 with current +2I
      // Left outer wing at x=-2R with current -I
      // Right outer wing at x=+2R with current -I
      const r0Sq = x * x + (z + 2) * (z + 2); // small 2mm offset for coil casing
      const r1Sq = (x + 2 * R) * (x + 2 * R) + (z + 2) * (z + 2);
      const r2Sq = (x - 2 * R) * (x - 2 * R) + (z + 2) * (z + 2);

      // Bx is proportional to -z/r^2 from +2I, +z/r^2 from -I
      const bx0 = (-mu0Over2Pi * (2 * baseCurrentI) * (z + 2)) / r0Sq;
      const bz0 = (mu0Over2Pi * (2 * baseCurrentI) * x) / r0Sq;

      const bx1 = (mu0Over2Pi * baseCurrentI * (z + 2)) / r1Sq;
      const bz1 = (-mu0Over2Pi * baseCurrentI * (x + 2 * R)) / r1Sq;

      const bx2 = (mu0Over2Pi * baseCurrentI * (z + 2)) / r2Sq;
      const bz2 = (-mu0Over2Pi * baseCurrentI * (x - 2 * R)) / r2Sq;

      const bx = bx0 + bx1 + bx2;
      const bz = bz0 + bz1 + bz2;
      const bMag = Math.sqrt(bx * bx + bz * bz) * 1e3; // scale to Tesla magnitude
      const angle = Math.atan2(bz, bx);

      // Lateral Gaussian beam decay for induced electric field
      const sigmaX = fluxPoint.focalHotspotDiameterMm / 2.355;
      const lateralDecay = Math.exp(-(x * x) / (2 * sigmaX * sigmaX));
      const eLocal = fluxPoint.inducedElectricFieldE * lateralDecay;
      const jLocal = fluxPoint.tissueLayer.conductivitySpm * eLocal;
      const isDepol = eLocal >= DEFAULT_TMS_PARAMS.depolarizationThresholdVpm;

      row.push({
        xMm: x,
        depthMm: z,
        bVector: {
          x: bx,
          z: bz,
          magnitude: bMag,
          angleRad: angle,
        },
        eMagnitudeVpm: eLocal,
        currentDensityJ: jLocal,
        tissueLayer: fluxPoint.tissueLayer,
        isDepolarized: isDepol,
      });
    }
    grid.push(row);
  }

  return grid;
}

import {
  TISSUE_LAYERS,
  DEFAULT_TMS_PARAMS,
  getTissueLayer,
  calculateCoilAngleDistortion,
  calculateHotspotDiameter,
  calculateFluxAtDepth,
  generateDepthProfile,
  calculateThresholdDepolarizationDepth,
  calculateVectorField2D,
} from "../fluxMath";

describe("TMS Electromagnetic Flux & DLPFC Penetration Model (Agent 08)", () => {
  describe("Cranial Tissue Layer Stratification", () => {
    test("defines all five anatomical cranial layers across 0 to 30 mm", () => {
      expect(TISSUE_LAYERS).toHaveLength(5);
      const layerIds = TISSUE_LAYERS.map((l) => l.id);
      expect(layerIds).toEqual([
        "scalp",
        "skull",
        "csf",
        "gray_matter",
        "white_matter",
      ]);
    });

    test("enforces contiguous, non-overlapping boundary depths", () => {
      expect(TISSUE_LAYERS[0].startDepthMm).toBe(0);
      for (let i = 0; i < TISSUE_LAYERS.length - 1; i++) {
        expect(TISSUE_LAYERS[i].endDepthMm).toBe(TISSUE_LAYERS[i + 1].startDepthMm);
      }
      expect(TISSUE_LAYERS[TISSUE_LAYERS.length - 1].endDepthMm).toBe(30);
    });

    test("correctly resolves tissue layers for given depths", () => {
      expect(getTissueLayer(0).id).toBe("scalp");
      expect(getTissueLayer(2).id).toBe("scalp");
      expect(getTissueLayer(4).id).toBe("skull");
      expect(getTissueLayer(7.5).id).toBe("skull");
      expect(getTissueLayer(9).id).toBe("csf");
      expect(getTissueLayer(11.9).id).toBe("csf");
      expect(getTissueLayer(12).id).toBe("gray_matter");
      expect(getTissueLayer(18).id).toBe("gray_matter");
      expect(getTissueLayer(22).id).toBe("white_matter");
      expect(getTissueLayer(29.5).id).toBe("white_matter");
    });

    test("handles boundary edge cases and out-of-bounds depths gracefully", () => {
      // Negative depth clamps to surface (scalp)
      expect(getTissueLayer(-5).id).toBe("scalp");
      // Depths exceeding 30 mm resolve to white matter
      expect(getTissueLayer(45).id).toBe("white_matter");
    });

    test("reflects physiological tissue conductivities (CSF peak and skull barrier)", () => {
      const scalp = getTissueLayer(2);
      const skull = getTissueLayer(6);
      const csf = getTissueLayer(10.5);
      const grayMatter = getTissueLayer(15);
      const whiteMatter = getTissueLayer(25);

      expect(scalp.conductivitySpm).toBeCloseTo(0.33, 2);
      expect(csf.conductivitySpm).toBeGreaterThan(grayMatter.conductivitySpm);
      expect(grayMatter.conductivitySpm).toBeGreaterThan(whiteMatter.conductivitySpm);
      expect(whiteMatter.conductivitySpm).toBeGreaterThan(skull.conductivitySpm);
      expect(skull.conductivitySpm).toBeLessThan(0.05); // High resistivity of bone
      expect(csf.conductivitySpm).toBeCloseTo(1.79, 2); // Highly conductive CSF
    });
  });

  describe("Biot-Savart Electromagnetic Field Calculations (calculateFluxAtDepth)", () => {
    test("calculates expected surface baseline at 100% intensity and optimal 45° angle", () => {
      const surface = calculateFluxAtDepth(0, 100);

      expect(surface.depthMm).toBe(0);
      expect(surface.magneticFluxB).toBeCloseTo(2.0, 2);
      expect(surface.bFieldTesla).toBe(surface.magneticFluxB);
      expect(surface.inducedElectricFieldE).toBeCloseTo(180.0, 1);
      expect(surface.eFieldVpm).toBe(surface.inducedElectricFieldE);
      expect(surface.decayFactor).toBeCloseTo(1.0, 3);
      expect(surface.attenuationPercent).toBeCloseTo(0.0, 2);
      expect(surface.isDepolarized).toBe(true);
      expect(surface.tissueLayer.id).toBe("scalp");
      expect(surface.currentDensityJ).toBeCloseTo(0.33 * 180.0, 1);
    });

    test("exhibits strictly monotonic decay with depth", () => {
      const depths = [0, 5, 10, 15, 20, 25, 30];
      const fluxPoints = depths.map((d) => calculateFluxAtDepth(d, 100));

      for (let i = 0; i < fluxPoints.length - 1; i++) {
        expect(fluxPoints[i].magneticFluxB).toBeGreaterThan(fluxPoints[i + 1].magneticFluxB);
        expect(fluxPoints[i].inducedElectricFieldE).toBeGreaterThan(
          fluxPoints[i + 1].inducedElectricFieldE
        );
        expect(fluxPoints[i].decayFactor).toBeGreaterThan(fluxPoints[i + 1].decayFactor);
        expect(fluxPoints[i].attenuationPercent).toBeLessThan(
          fluxPoints[i + 1].attenuationPercent
        );
      }
    });

    test("scales linearly with stimulation intensity percentage (80% to 120% MT)", () => {
      const depth = 15; // Cortical DLPFC depth
      const flux80 = calculateFluxAtDepth(depth, 80);
      const flux100 = calculateFluxAtDepth(depth, 100);
      const flux120 = calculateFluxAtDepth(depth, 120);

      expect(flux80.magneticFluxB).toBeCloseTo(flux100.magneticFluxB * 0.8, 4);
      expect(flux120.magneticFluxB).toBeCloseTo(flux100.magneticFluxB * 1.2, 4);

      expect(flux80.inducedElectricFieldE).toBeCloseTo(
        flux100.inducedElectricFieldE * 0.8,
        4
      );
      expect(flux120.inducedElectricFieldE).toBeCloseTo(
        flux100.inducedElectricFieldE * 1.2,
        4
      );

      expect(flux80.currentDensityJ).toBeCloseTo(flux100.currentDensityJ * 0.8, 4);
      expect(flux120.currentDensityJ).toBeCloseTo(flux100.currentDensityJ * 1.2, 4);
    });

    test("computes correct current density J = sigma * E across differing tissue layers", () => {
      const skullPoint = calculateFluxAtDepth(6, 100);
      const csfPoint = calculateFluxAtDepth(10.5, 100);

      // Even though E decreases with depth, CSF conductivity is ~220x higher than skull,
      // resulting in a significant current density jump in CSF
      expect(skullPoint.tissueLayer.id).toBe("skull");
      expect(csfPoint.tissueLayer.id).toBe("csf");
      expect(csfPoint.currentDensityJ).toBeGreaterThan(skullPoint.currentDensityJ * 50);
    });

    test("zero intensity produces zero fields", () => {
      const point = calculateFluxAtDepth(10, 0);
      expect(point.magneticFluxB).toBe(0);
      expect(point.inducedElectricFieldE).toBe(0);
      expect(point.currentDensityJ).toBe(0);
      expect(point.isDepolarized).toBe(false);
    });
  });

  describe("Depth Profile Generation (generateDepthProfile)", () => {
    test("generates expected sequence from 0 to 30 mm with step 1 mm", () => {
      const profile = generateDepthProfile(100, 30, { stepMm: 1 });
      expect(profile).toHaveLength(31);
      expect(profile[0].depthMm).toBe(0);
      expect(profile[30].depthMm).toBe(30);

      // Check monotonicity of profile
      for (let i = 0; i < profile.length - 1; i++) {
        expect(profile[i].depthMm).toBeLessThan(profile[i + 1].depthMm);
        expect(profile[i].inducedElectricFieldE).toBeGreaterThan(
          profile[i + 1].inducedElectricFieldE
        );
      }
    });

    test("supports custom step sizes and maximum depths", () => {
      const profile = generateDepthProfile(110, 20, { stepMm: 5 });
      expect(profile).toHaveLength(5); // 0, 5, 10, 15, 20
      expect(profile[profile.length - 1].depthMm).toBe(20);
    });

    test("default maxDepthMm is 30 mm", () => {
      const profile = generateDepthProfile(100);
      expect(profile[profile.length - 1].depthMm).toBe(30);
    });
  });

  describe("Focal Hotspot Divergence & Beam Diameter", () => {
    test("surface hotspot matches baseline diameter of 16 mm", () => {
      const d0 = calculateHotspotDiameter(0);
      expect(d0).toBeCloseTo(DEFAULT_TMS_PARAMS.surfaceHotspotDiameterMm, 2);
    });

    test("hotspot diameter expands monotonically with depth", () => {
      const d0 = calculateHotspotDiameter(0);
      const d10 = calculateHotspotDiameter(10);
      const d20 = calculateHotspotDiameter(20);
      const d30 = calculateHotspotDiameter(30);

      expect(d10).toBeGreaterThan(d0);
      expect(d20).toBeGreaterThan(d10);
      expect(d30).toBeGreaterThan(d20);
    });

    test("matches cortical DLPFC hotspot expectations (12-20 mm depth)", () => {
      const corticalDiameter = calculateHotspotDiameter(15);
      // For a 70mm butterfly coil at 15mm depth, FWHM hotspot is ~22-26mm
      expect(corticalDiameter).toBeGreaterThan(20);
      expect(corticalDiameter).toBeLessThan(30);
    });
  });

  describe("Threshold Neuronal Depolarization Depth", () => {
    test("higher stimulation intensity penetrates deeper for neuronal depolarization", () => {
      const depth80 = calculateThresholdDepolarizationDepth(80);
      const depth100 = calculateThresholdDepolarizationDepth(100);
      const depth120 = calculateThresholdDepolarizationDepth(120);

      expect(depth80).toBeGreaterThan(0);
      expect(depth100).toBeGreaterThan(depth80);
      expect(depth120).toBeGreaterThan(depth100);
    });

    test("at 100% MT, depolarization reaches target DLPFC gray matter depth", () => {
      const depolDepth = calculateThresholdDepolarizationDepth(100);
      // DLPFC gray matter is 12 mm to 22 mm deep
      expect(depolDepth).toBeGreaterThanOrEqual(12);
      expect(depolDepth).toBeLessThanOrEqual(30);

      // Verify that at (depolDepth - 0.5), E >= 60 V/m
      const pointAbove = calculateFluxAtDepth(depolDepth - 0.5, 100);
      expect(pointAbove.isDepolarized).toBe(true);

      // Verify that at (depolDepth + 0.5), E < 60 V/m
      const pointBelow = calculateFluxAtDepth(depolDepth + 0.5, 100);
      expect(pointBelow.isDepolarized).toBe(false);
    });

    test("sub-threshold intensity returns depth of 0", () => {
      // 10% MT cannot produce 60 V/m even at surface
      const depolDepth = calculateThresholdDepolarizationDepth(10);
      expect(depolDepth).toBe(0);
    });
  });

  describe("Coil Angle Field Distortion & Left DLPFC Alignment", () => {
    test("optimal 45° orientation achieves 100% efficiency and 0% distortion", () => {
      const result = calculateCoilAngleDistortion(45);
      expect(result.angularDeviationDeg).toBe(0);
      expect(result.efficiencyFactor).toBeCloseTo(1.0, 4);
      expect(result.distortionFactor).toBeCloseTo(0.0, 4);
      expect(result.percentageLoss).toBeCloseTo(0.0, 2);
    });

    test("symmetric deviation yields identical distortion", () => {
      const devPlus = calculateCoilAngleDistortion(60); // +15 deg
      const devMinus = calculateCoilAngleDistortion(30); // -15 deg

      expect(devPlus.angularDeviationDeg).toBe(15);
      expect(devMinus.angularDeviationDeg).toBe(15);
      expect(devPlus.efficiencyFactor).toBeCloseTo(devMinus.efficiencyFactor, 4);
      expect(devPlus.percentageLoss).toBeCloseTo(devMinus.percentageLoss, 2);
    });

    test("orthogonal alignment (90° deviation) results in complete field loss", () => {
      const result = calculateCoilAngleDistortion(135); // 45 + 90
      expect(result.angularDeviationDeg).toBe(90);
      expect(result.efficiencyFactor).toBeCloseTo(0.0, 4);
      expect(result.distortionFactor).toBeCloseTo(1.0, 4);
      expect(result.percentageLoss).toBeCloseTo(100.0, 2);
    });

    test("calculateFluxAtDepth incorporates coil angle attenuation", () => {
      const optimalFlux = calculateFluxAtDepth(15, 100, { coilAngleDeg: 45 });
      const misalignedFlux = calculateFluxAtDepth(15, 100, { coilAngleDeg: 0 }); // 45 deg off

      expect(optimalFlux.inducedElectricFieldE).toBeGreaterThan(
        misalignedFlux.inducedElectricFieldE
      );
      expect(misalignedFlux.inducedElectricFieldE).toBeCloseTo(
        optimalFlux.inducedElectricFieldE * Math.cos(Math.PI / 4),
        2
      );
    });
  });

  describe("2D Vector Field Grid Calculations (calculateVectorField2D)", () => {
    test("generates expected grid dimensions", () => {
      const width = 80; // -40 to +40 mm
      const depth = 30; // 0 to 30 mm
      const step = 5;
      const grid = calculateVectorField2D(width, depth, step, 100, 45);

      const expectedRows = Math.floor(depth / step) + 1; // 7 rows: 0, 5, 10, 15, 20, 25, 30
      const expectedCols = Math.floor(width / step) + 1; // 17 cols: -40 to +40

      expect(grid.length).toBe(expectedRows);
      expect(grid[0].length).toBe(expectedCols);
    });

    test("electric field exhibits lateral symmetry across x = 0", () => {
      const grid = calculateVectorField2D(60, 20, 5, 100, 45);
      // Row at z = 10 mm
      const row10 = grid.find((r) => r[0].depthMm === 10);
      expect(row10).toBeDefined();

      if (row10) {
        // Find x = -15 and x = +15
        const ptNeg15 = row10.find((p) => Math.abs(p.xMm - -15) < 0.1);
        const ptPos15 = row10.find((p) => Math.abs(p.xMm - 15) < 0.1);

        expect(ptNeg15).toBeDefined();
        expect(ptPos15).toBeDefined();

        if (ptNeg15 && ptPos15) {
          expect(ptNeg15.eMagnitudeVpm).toBeCloseTo(ptPos15.eMagnitudeVpm, 2);
          expect(ptNeg15.currentDensityJ).toBeCloseTo(ptPos15.currentDensityJ, 2);
        }
      }
    });

    test("central axis (x = 0) exhibits maximum induced electric field at any depth", () => {
      const grid = calculateVectorField2D(40, 20, 5, 100, 45);
      const row15 = grid.find((r) => r[0].depthMm === 15);
      expect(row15).toBeDefined();

      if (row15) {
        const centerPt = row15.find((p) => Math.abs(p.xMm) < 0.1);
        expect(centerPt).toBeDefined();

        if (centerPt) {
          for (const pt of row15) {
            expect(centerPt.eMagnitudeVpm).toBeGreaterThanOrEqual(pt.eMagnitudeVpm);
          }
        }
      }
    });
  });
});

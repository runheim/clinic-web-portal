"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useId,
} from "react";
import {
  TISSUE_LAYERS,
  DEFAULT_TMS_PARAMS,
  calculateFluxAtDepth,
  generateDepthProfile,
  calculateThresholdDepolarizationDepth,
  calculateCoilAngleDistortion,
  calculateHotspotDiameter,
  TmsFluxPoint,
  TissueLayerInfo,
} from "@/lib/simulators/tms/fluxMath";

interface Particle {
  x: number;
  z: number;
  originWing: "left" | "right";
  speed: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
}

export interface TmsFluxCanvasProps {
  /** Initial intensity percentage of motor threshold (80% to 120%, default 100) */
  initialIntensity?: number;
  /** Initial coil angle in degrees relative to midline (default 45° optimal DLPFC) */
  initialCoilAngle?: number;
  /** Optional custom class name */
  className?: string;
  /** Callback fired when dosimetric parameters update */
  onDosimetryChange?: (summary: {
    intensityPercent: number;
    coilAngleDeg: number;
    thresholdDepthMm: number;
    corticalEFieldVpm: number;
    isDlpfcDepolarized: boolean;
  }) => void;
}

export const TmsFluxCanvas: React.FC<TmsFluxCanvasProps> = ({
  initialIntensity = 100,
  initialCoilAngle = 45,
  className = "",
  onDosimetryChange,
}) => {
  // Unique IDs for accessibility
  const intensityInputId = useId();
  const angleInputId = useId();
  const descriptionId = useId();
  const tableSummaryId = useId();

  // Interactive state
  const [intensity, setIntensity] = useState<number>(() =>
    Math.min(120, Math.max(80, initialIntensity))
  );
  const [coilAngle, setCoilAngle] = useState<number>(() =>
    Math.min(90, Math.max(0, initialCoilAngle))
  );
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showIsolines, setShowIsolines] = useState<boolean>(true);
  const [showHotspotBeam, setShowHotspotBeam] = useState<boolean>(true);
  const [showDataTable, setShowDataTable] = useState<boolean>(false);

  // Probe / Cursor inspection state
  const [hoveredProbe, setHoveredProbe] = useState<{
    xMm: number;
    depthMm: number;
    canvasX: number;
    canvasY: number;
    tooltipX: number;
    tooltipY: number;
    flux: TmsFluxPoint;
  } | null>(null);

  // Canvas DOM and animation refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  // Computed dosimetry values
  const thresholdDepthMm = useMemo(
    () => calculateThresholdDepolarizationDepth(intensity, 60, coilAngle),
    [intensity, coilAngle]
  );

  const angleDistortion = useMemo(
    () => calculateCoilAngleDistortion(coilAngle, DEFAULT_TMS_PARAMS.optimalCoilAngleDeg),
    [coilAngle]
  );

  const surfaceFlux = useMemo(
    () => calculateFluxAtDepth(0, intensity, { coilAngleDeg: coilAngle }),
    [intensity, coilAngle]
  );

  const corticalFluxDlpfc = useMemo(
    () => calculateFluxAtDepth(15, intensity, { coilAngleDeg: coilAngle }),
    [intensity, coilAngle]
  );

  const depthProfile = useMemo(
    () => generateDepthProfile(intensity, 30, { stepMm: 1, coilAngleDeg: coilAngle }),
    [intensity, coilAngle]
  );

  // Notify parent callback when parameters change
  useEffect(() => {
    onDosimetryChange?.({
      intensityPercent: intensity,
      coilAngleDeg: coilAngle,
      thresholdDepthMm,
      corticalEFieldVpm: corticalFluxDlpfc.inducedElectricFieldE,
      isDlpfcDepolarized: corticalFluxDlpfc.isDepolarized,
    });
  }, [
    intensity,
    coilAngle,
    thresholdDepthMm,
    corticalFluxDlpfc.inducedElectricFieldE,
    corticalFluxDlpfc.isDepolarized,
    onDosimetryChange,
  ]);

  // Initialize particle stream for flux animation
  const initParticles = useCallback((count: number = 60) => {
    const list: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const isLeft = Math.random() > 0.5;
      list.push({
        x: (isLeft ? -1 : 1) * (10 + Math.random() * 25),
        z: Math.random() * 30,
        originWing: isLeft ? "left" : "right",
        speed: 0.15 + Math.random() * 0.35,
        life: Math.random() * 120,
        maxLife: 90 + Math.random() * 60,
        size: 1.2 + Math.random() * 1.6,
        opacity: 0.2 + Math.random() * 0.6,
      });
    }
    particlesRef.current = list;
  }, []);

  useEffect(() => {
    initParticles(75);
  }, [initParticles]);

  // Main 60fps Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    // Viewport and coordinate transformations
    // Coordinate space: x from -45 mm to +45 mm (lateral span: 90 mm)
    // Depth z from -6 mm (coil head above scalp) to 32 mm
    const render = (time: number) => {
      if (!isRunning) return;

      const dt = lastTimeRef.current ? Math.min(64, time - lastTimeRef.current) : 16;
      lastTimeRef.current = time;

      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      // Coordinate mapping constants
      const padLeft = 65;
      const padRight = 55;
      const padTop = 50;
      const padBottom = 40;

      const plotW = width - padLeft - padRight;
      const plotH = height - padTop - padBottom;

      const minX = -42;
      const maxX = 42;
      const spanX = maxX - minX;

      const minZ = 0;
      const maxZ = 30;
      const spanZ = maxZ - minZ;

      const mmToPxX = (xMm: number) => padLeft + ((xMm - minX) / spanX) * plotW;
      const mmToPxZ = (zMm: number) => padTop + ((zMm - minZ) / spanZ) * plotH;

      // 1. Clear with Deep Obsidian background
      ctx.fillStyle = "#0b0f19";
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Subtle Radial Vignette
      const vignette = ctx.createRadialGradient(
        padLeft + plotW / 2,
        padTop + 20,
        10,
        padLeft + plotW / 2,
        padTop + plotH / 2,
        Math.max(plotW, plotH)
      );
      vignette.addColorStop(0, "rgba(212, 175, 55, 0.05)");
      vignette.addColorStop(0.5, "rgba(18, 24, 38, 0.6)");
      vignette.addColorStop(1, "rgba(11, 15, 25, 0.95)");
      ctx.fillStyle = vignette;
      ctx.fillRect(padLeft, padTop, plotW, plotH);

      // 3. Render Tissue Layer Bands
      TISSUE_LAYERS.forEach((layer: TissueLayerInfo) => {
        const topY = mmToPxZ(layer.startDepthMm);
        const bottomY = mmToPxZ(layer.endDepthMm);
        const layerH = bottomY - topY;

        // Subtle background tint for each tissue layer
        ctx.fillStyle =
          layer.id === "gray_matter"
            ? "rgba(186, 104, 200, 0.09)" // DLPFC Gray Matter highlight
            : layer.id === "csf"
            ? "rgba(79, 195, 247, 0.08)" // CSF conductive channel
            : layer.id === "skull"
            ? "rgba(224, 214, 195, 0.03)" // High-resistance bone
            : layer.id === "scalp"
            ? "rgba(245, 208, 169, 0.05)" // Scalp
            : "rgba(144, 202, 249, 0.04)"; // White Matter

        ctx.fillRect(padLeft, topY, plotW, layerH);

        // Layer boundary line (hairline)
        ctx.strokeStyle = "rgba(212, 175, 55, 0.18)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padLeft, bottomY);
        ctx.lineTo(padLeft + plotW, bottomY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Layer Label on left gutter
        ctx.font = "10px ui-monospace, SFMono-Regular, monospace";
        ctx.fillStyle = "rgba(223, 226, 241, 0.75)";
        ctx.textAlign = "right";
        ctx.fillText(`${layer.startDepthMm}mm`, padLeft - 10, topY + 12);

        // Layer name badge
        ctx.font = "bold 9px system-ui, sans-serif";
        ctx.fillStyle =
          layer.id === "gray_matter" ? "#f2ca50" : "rgba(208, 197, 175, 0.75)";
        ctx.textAlign = "left";
        ctx.fillText(
          `${layer.name.toUpperCase()} (σ=${layer.conductivitySpm} S/m)`,
          padLeft + 8,
          topY + 14
        );
      });

      // 4. Depolarized Cortical Zone Golden Radiance (Left DLPFC)
      if (thresholdDepthMm > 12) {
        const dlpfcTopY = mmToPxZ(12);
        const depolBottomY = mmToPxZ(Math.min(22, thresholdDepthMm));
        const depolH = Math.max(2, depolBottomY - dlpfcTopY);

        const depolGlow = ctx.createLinearGradient(
          padLeft + plotW / 2,
          dlpfcTopY,
          padLeft + plotW / 2,
          depolBottomY
        );
        depolGlow.addColorStop(0, "rgba(242, 202, 80, 0.22)");
        depolGlow.addColorStop(0.7, "rgba(212, 175, 55, 0.12)");
        depolGlow.addColorStop(1, "rgba(212, 175, 55, 0.02)");

        ctx.fillStyle = depolGlow;
        ctx.fillRect(padLeft, dlpfcTopY, plotW, depolH);
      }

      // 5. Focal Hotspot Divergence Beam Profile
      if (showHotspotBeam) {
        ctx.save();
        ctx.beginPath();
        const leftHotspotPath: [number, number][] = [];
        const rightHotspotPath: [number, number][] = [];

        for (let z = 0; z <= 30; z += 1) {
          const dia = calculateHotspotDiameter(z, DEFAULT_TMS_PARAMS);
          const rad = dia / 2;
          leftHotspotPath.push([mmToPxX(-rad), mmToPxZ(z)]);
          rightHotspotPath.push([mmToPxX(rad), mmToPxZ(z)]);
        }

        ctx.moveTo(leftHotspotPath[0][0], leftHotspotPath[0][1]);
        for (const pt of leftHotspotPath) {
          ctx.lineTo(pt[0], pt[1]);
        }
        for (let i = rightHotspotPath.length - 1; i >= 0; i--) {
          ctx.lineTo(rightHotspotPath[i][0], rightHotspotPath[i][1]);
        }
        ctx.closePath();

        const beamGradient = ctx.createLinearGradient(
          padLeft + plotW / 2,
          padTop,
          padLeft + plotW / 2,
          padTop + plotH
        );
        beamGradient.addColorStop(0, "rgba(212, 175, 55, 0.15)");
        beamGradient.addColorStop(0.5, "rgba(212, 175, 55, 0.06)");
        beamGradient.addColorStop(1, "rgba(212, 175, 55, 0.01)");
        ctx.fillStyle = beamGradient;
        ctx.fill();

        // Beam envelope dashed lines
        ctx.strokeStyle = "rgba(242, 202, 80, 0.45)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);

        ctx.beginPath();
        leftHotspotPath.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt[0], pt[1]);
          else ctx.lineTo(pt[0], pt[1]);
        });
        ctx.stroke();

        ctx.beginPath();
        rightHotspotPath.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt[0], pt[1]);
          else ctx.lineTo(pt[0], pt[1]);
        });
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // 6. Champagne Gold Intensity Isolines
      if (showIsolines) {
        ctx.save();
        // Target E-field contour thresholds: 150, 120, 90, 60 (Threshold), 30 V/m
        const targetContours = [
          { eVal: 150, label: "150 V/m", isThresh: false, alpha: 0.35 },
          { eVal: 120, label: "120 V/m", isThresh: false, alpha: 0.5 },
          { eVal: 90, label: "90 V/m", isThresh: false, alpha: 0.65 },
          {
            eVal: 60,
            label: "60 V/m (Threshold)",
            isThresh: true,
            alpha: 0.95,
          },
          { eVal: 30, label: "30 V/m", isThresh: false, alpha: 0.3 },
        ];

        targetContours.forEach((contour) => {
          // Find depth on axis x=0 where E(z) = eVal
          // If surface E is lower than eVal, contour doesn't exist
          if (surfaceFlux.inducedElectricFieldE < contour.eVal) return;

          // Trace contour across x coordinates
          const contourPoints: [number, number][] = [];
          const testXSteps = 40;

          for (let i = -testXSteps; i <= testXSteps; i++) {
            const x = (i / testXSteps) * 35; // lateral extent

            // Binary search depth z where E(x, z) matches contour.eVal
            let lowZ = 0;
            let highZ = 30;
            let matchedZ: number | null = null;

            for (let iter = 0; iter < 16; iter++) {
              const midZ = (lowZ + highZ) / 2;
              const flux = calculateFluxAtDepth(midZ, intensity, { coilAngleDeg: coilAngle });
              const dia = flux.focalHotspotDiameterMm;
              const sigmaX = dia / 2.355;
              const eAtPoint = flux.inducedElectricFieldE * Math.exp(-(x * x) / (2 * sigmaX * sigmaX));

              if (Math.abs(eAtPoint - contour.eVal) < 0.5) {
                matchedZ = midZ;
                break;
              }
              if (eAtPoint > contour.eVal) {
                lowZ = midZ;
              } else {
                highZ = midZ;
              }
            }

            if (matchedZ !== null && matchedZ <= 30 && matchedZ >= 0) {
              contourPoints.push([mmToPxX(x), mmToPxZ(matchedZ)]);
            }
          }

          if (contourPoints.length > 2) {
            ctx.beginPath();
            contourPoints.forEach((pt, idx) => {
              if (idx === 0) ctx.moveTo(pt[0], pt[1]);
              else ctx.lineTo(pt[0], pt[1]);
            });

            if (contour.isThresh) {
              // Prominent golden glowing contour for neuronal threshold
              ctx.strokeStyle = "#f2ca50";
              ctx.lineWidth = 2.2;
              ctx.shadowColor = "#e9c349";
              ctx.shadowBlur = 9;
              ctx.stroke();
              ctx.shadowBlur = 0;

              // Label on apex of threshold contour
              const apex = contourPoints[Math.floor(contourPoints.length / 2)];
              if (apex) {
                ctx.font = "bold 10px ui-monospace, monospace";
                ctx.fillStyle = "#f2ca50";
                ctx.textAlign = "center";
                ctx.fillText(`⚡ ${contour.label}`, apex[0], apex[1] + 13);
              }
            } else {
              ctx.strokeStyle = `rgba(212, 175, 55, ${contour.alpha})`;
              ctx.lineWidth = 1.1;
              ctx.setLineDash([5, 4]);
              ctx.stroke();
              ctx.setLineDash([]);

              // Minor contour label
              const apex = contourPoints[Math.floor(contourPoints.length / 2)];
              if (apex && apex[1] < padTop + plotH - 10) {
                ctx.font = "9px ui-monospace, monospace";
                ctx.fillStyle = `rgba(212, 175, 55, ${contour.alpha + 0.15})`;
                ctx.textAlign = "center";
                ctx.fillText(contour.label, apex[0], apex[1] + 11);
              }
            }
          }
        });
        ctx.restore();
      }

      // 7. Dynamic Vector Field Arrows & Streamlines
      if (showVectors) {
        ctx.save();
        const arrowStepX = 7;
        const arrowStepZ = 4;

        for (let x = -35; x <= 35; x += arrowStepX) {
          for (let z = 2; z <= 28; z += arrowStepZ) {
            const px = mmToPxX(x);
            const pz = mmToPxZ(z);

            // Biot-Savart vector approximation
            const R = DEFAULT_TMS_PARAMS.coilRadiusMm;
            const r0Sq = x * x + (z + 2) * (z + 2);
            const r1Sq = (x + 2 * R) * (x + 2 * R) + (z + 2) * (z + 2);
            const r2Sq = (x - 2 * R) * (x - 2 * R) + (z + 2) * (z + 2);

            const scaleI = intensity / 100;
            const bx =
              scaleI *
              ((-2 * (z + 2)) / r0Sq + (z + 2) / r1Sq + (z + 2) / r2Sq);
            const bz =
              scaleI *
              ((2 * x) / r0Sq - (x + 2 * R) / r1Sq - (x - 2 * R) / r2Sq);

            const bMag = Math.sqrt(bx * bx + bz * bz);
            if (bMag < 0.0001) continue;

            const angle = Math.atan2(bz, bx);
            const arrowLen = Math.min(14, Math.max(4, bMag * 850));

            // Color and alpha based on field strength and tissue layer
            const fluxPt = calculateFluxAtDepth(z, intensity, { coilAngleDeg: coilAngle });
            const alpha = Math.min(
              0.8,
              Math.max(0.18, fluxPt.decayFactor * 0.9 * (1 - Math.abs(x) / 50))
            );

            ctx.strokeStyle = fluxPt.isDepolarized
              ? `rgba(242, 202, 80, ${alpha})`
              : `rgba(168, 159, 140, ${alpha * 0.7})`;
            ctx.fillStyle = ctx.strokeStyle;
            ctx.lineWidth = fluxPt.isDepolarized ? 1.4 : 1.0;

            const endX = px + Math.cos(angle) * arrowLen;
            const endZ = pz + Math.sin(angle) * arrowLen;

            // Line segment
            ctx.beginPath();
            ctx.moveTo(px, pz);
            ctx.lineTo(endX, endZ);
            ctx.stroke();

            // Arrow head
            const headAngle = Math.PI / 6;
            const headLen = Math.min(4, arrowLen * 0.4);
            ctx.beginPath();
            ctx.moveTo(endX, endZ);
            ctx.lineTo(
              endX - headLen * Math.cos(angle - headAngle),
              endZ - headLen * Math.sin(angle - headAngle)
            );
            ctx.lineTo(
              endX - headLen * Math.cos(angle + headAngle),
              endZ - headLen * Math.sin(angle + headAngle)
            );
            ctx.closePath();
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 8. Animated Flux Stream Particles (60fps dynamic flow)
      if (!isPaused) {
        ctx.save();
        const particles = particlesRef.current;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.life += (dt / 16.6) * p.speed;

          // Physics progression: particles sweep in toward central junction and downward
          const sideFactor = p.originWing === "left" ? -1 : 1;
          p.x += -sideFactor * (0.18 * (intensity / 100)) * (dt / 16.6);
          p.z += 0.22 * (intensity / 100) * (dt / 16.6);

          // Reset particle if expired or out of bounds
          if (p.life >= p.maxLife || p.z > 30 || Math.abs(p.x) < 0.5) {
            p.x = sideFactor * (12 + Math.random() * 24);
            p.z = Math.random() * 6;
            p.life = 0;
            p.maxLife = 80 + Math.random() * 60;
          }

          const px = mmToPxX(p.x);
          const pz = mmToPxZ(p.z);
          const fluxAtP = calculateFluxAtDepth(p.z, intensity, { coilAngleDeg: coilAngle });
          const fade = Math.sin((p.life / p.maxLife) * Math.PI);
          const currentAlpha = Math.min(0.9, p.opacity * fade * fluxAtP.decayFactor);

          ctx.fillStyle = fluxAtP.isDepolarized
            ? `rgba(242, 202, 80, ${currentAlpha})`
            : `rgba(212, 175, 55, ${currentAlpha * 0.6})`;

          ctx.beginPath();
          ctx.arc(px, pz, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 9. Depolarization Horizon Beacon Line
      if (thresholdDepthMm > 0 && thresholdDepthMm <= 30) {
        const horizonY = mmToPxZ(thresholdDepthMm);
        ctx.save();
        ctx.strokeStyle = "#e9c349";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([6, 3]);
        ctx.shadowColor = "#f2ca50";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(padLeft, horizonY);
        ctx.lineTo(padLeft + plotW, horizonY);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);

        // Horizon badge tag
        ctx.font = "bold 9px ui-monospace, monospace";
        ctx.fillStyle = "#0b0f19";
        const tagText = ` DEPTH HORIZON: ${thresholdDepthMm.toFixed(1)}mm `;
        const tagW = ctx.measureText(tagText).width + 8;
        ctx.fillStyle = "#d4af37";
        ctx.fillRect(padLeft + plotW - tagW - 4, horizonY - 14, tagW, 13);
        ctx.fillStyle = "#0b0f19";
        ctx.fillText(tagText, padLeft + plotW - tagW, horizonY - 4);
        ctx.restore();
      }

      // 10. TMS Figure-8 Butterfly Coil Schematic at Top
      ctx.save();
      const coilY = mmToPxZ(0);
      const coilCenterX = mmToPxX(0);
      const wingRadiusPx = Math.abs(mmToPxX(18) - coilCenterX);

      // Scalp contact plate line
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(coilCenterX - wingRadiusPx * 1.8, coilY);
      ctx.lineTo(coilCenterX + wingRadiusPx * 1.8, coilY);
      ctx.stroke();

      // Left Coil Loop
      ctx.fillStyle = "rgba(18, 24, 38, 0.85)";
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(coilCenterX - wingRadiusPx * 0.9, coilY - 14, wingRadiusPx * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right Coil Loop
      ctx.beginPath();
      ctx.arc(coilCenterX + wingRadiusPx * 0.9, coilY - 14, wingRadiusPx * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Junction Focus Indicator
      ctx.fillStyle = "#f2ca50";
      ctx.shadowColor = "#f2ca50";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(coilCenterX, coilY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Header Labels on Canvas
      ctx.font = "bold 11px ui-monospace, monospace";
      ctx.fillStyle = "#d4af37";
      ctx.textAlign = "left";
      ctx.fillText(
        `FIGURE-8 TMS COIL • B₀=${surfaceFlux.bFieldTesla.toFixed(2)}T • E₀=${surfaceFlux.eFieldVpm.toFixed(0)} V/m`,
        padLeft,
        padTop - 25
      );

      ctx.font = "9px ui-monospace, monospace";
      ctx.fillStyle = "rgba(208, 197, 175, 0.75)";
      ctx.textAlign = "right";
      ctx.fillText(
        `TARGET: Left DLPFC (BA 9/46) • ${coilAngle}° PA Alignment`,
        padLeft + plotW,
        padTop - 25
      );

      ctx.restore();

      // 11. Interactive Hover Probe Cursor & HUD
      if (hoveredProbe) {
        ctx.save();
        const hx = hoveredProbe.canvasX;
        const hz = hoveredProbe.canvasY;

        // Crosshairs
        ctx.strokeStyle = "rgba(242, 202, 80, 0.7)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(padLeft, hz);
        ctx.lineTo(padLeft + plotW, hz);
        ctx.moveTo(hx, padTop);
        ctx.lineTo(hx, padTop + plotH);
        ctx.stroke();
        ctx.setLineDash([]);

        // Reticle circle
        ctx.fillStyle = "#f2ca50";
        ctx.beginPath();
        ctx.arc(hx, hz, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [
    intensity,
    coilAngle,
    isPaused,
    showVectors,
    showIsolines,
    showHotspotBeam,
    thresholdDepthMm,
    surfaceFlux,
    hoveredProbe,
  ]);

  // High-DPI canvas resizing via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const displayW = Math.max(300, Math.floor(rect.width));
      const displayH = Math.max(420, Math.floor(rect.height));

      canvas.width = Math.floor(displayW * dpr);
      canvas.height = Math.floor(displayH * dpr);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    const observer = new ResizeObserver(() => {
      resize();
    });

    observer.observe(container);
    resize();

    return () => {
      observer.disconnect();
    };
  }, []);

  // Handle pointer hover on canvas
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const padLeft = 65;
    const padRight = 55;
    const padTop = 50;
    const padBottom = 40;

    const plotW = rect.width - padLeft - padRight;
    const plotH = rect.height - padTop - padBottom;

    if (
      clientX >= padLeft &&
      clientX <= padLeft + plotW &&
      clientY >= padTop &&
      clientY <= padTop + plotH
    ) {
      const minX = -42;
      const maxX = 42;
      const spanX = maxX - minX;
      const xMm = minX + ((clientX - padLeft) / plotW) * spanX;

      const minZ = 0;
      const maxZ = 30;
      const spanZ = maxZ - minZ;
      const depthMm = minZ + ((clientY - padTop) / plotH) * spanZ;

      const flux = calculateFluxAtDepth(depthMm, intensity, { coilAngleDeg: coilAngle });

      const tooltipX = Math.min(
        rect.width - 190,
        Math.max(10, clientX + 12)
      );
      const tooltipY = Math.min(
        rect.height - 140,
        Math.max(10, clientY - 70)
      );

      setHoveredProbe({
        xMm: Math.round(xMm * 10) / 10,
        depthMm: Math.round(depthMm * 10) / 10,
        canvasX: clientX,
        canvasY: clientY,
        tooltipX,
        tooltipY,
        flux,
      });
    } else {
      setHoveredProbe(null);
    }
  };

  const handlePointerLeave = () => {
    setHoveredProbe(null);
  };

  return (
    <div
      role="region"
      aria-label="TMS Magnetic Flux & DLPFC Vector Penetration Simulator"
      className={`relative w-full rounded-xl border border-[rgba(212,175,55,0.25)] bg-[#0b0f19] p-4 text-[#dfe2f1] shadow-2xl transition-all md:p-6 ${className}`}
    >
      {/* Header Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(212,175,55,0.15)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37]" />
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-[#d4af37]">
              TMS Figure-8 Magnetic Flux & Cortical Vector Engine
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-[#a89f8c]">
            Left Dorsolateral Prefrontal Cortex (DLPFC BA 9/46) • Biot-Savart Penetration Model
          </p>
        </div>

        {/* Live Dosimetry Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
              corticalFluxDlpfc.isDepolarized
                ? "border-[rgba(242,202,80,0.5)] bg-[rgba(242,202,80,0.12)] text-[#f2ca50]"
                : "border-[rgba(212,175,55,0.2)] bg-[rgba(18,24,38,0.7)] text-[#a89f8c]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                corticalFluxDlpfc.isDepolarized ? "bg-[#f2ca50]" : "bg-[#a89f8c]"
              }`}
            />
            DLPFC: {corticalFluxDlpfc.isDepolarized ? "DEPOLARIZED" : "SUB-THRESHOLD"}
          </span>

          <span className="rounded-full border border-[rgba(212,175,55,0.25)] bg-[rgba(18,24,38,0.6)] px-2.5 py-1 font-mono text-xs text-[#dfe2f1]">
            Horizon: <strong className="text-[#d4af37]">{thresholdDepthMm.toFixed(1)} mm</strong>
          </span>
        </div>
      </div>

      {/* Accessible Dynamic Description for Screen Readers */}
      <div id={descriptionId} className="sr-only" aria-live="polite">
        Transcranial Magnetic Stimulation field penetration simulation. Intensity set to{" "}
        {intensity}% motor threshold. Coil angle set to {coilAngle} degrees. Maximum
        neuronal depolarization depth reaches {thresholdDepthMm.toFixed(1)} millimeters. Left
        DLPFC gray matter target induced electric field is{" "}
        {corticalFluxDlpfc.inducedElectricFieldE.toFixed(1)} volts per meter, which is{" "}
        {corticalFluxDlpfc.isDepolarized
          ? "above the 60 V/m activation threshold"
          : "sub-threshold"}.
      </div>

      {/* Canvas Visualization Container */}
      <div
        ref={containerRef}
        className="relative h-[440px] w-full overflow-hidden rounded-lg border border-[rgba(212,175,55,0.18)] bg-[#0b0f19] shadow-inner sm:h-[500px]"
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`TMS magnetic flux visualization at ${intensity}% motor threshold penetrating brain tissue layers to depth of ${thresholdDepthMm.toFixed(1)} mm`}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="h-full w-full cursor-crosshair touch-none"
        />

        {/* Floating Luxury Probe HUD */}
        {hoveredProbe && (
          <div
            className="pointer-events-none absolute z-20 rounded-md border border-[rgba(212,175,55,0.4)] bg-[rgba(11,15,25,0.92)] p-2.5 text-xs text-[#dfe2f1] shadow-2xl backdrop-blur-md"
            style={{
              left: hoveredProbe.tooltipX,
              top: hoveredProbe.tooltipY,
            }}
          >
            <div className="flex items-center justify-between border-b border-[rgba(212,175,55,0.2)] pb-1 font-mono text-[11px] font-bold text-[#d4af37]">
              <span>Depth: {hoveredProbe.depthMm.toFixed(1)} mm</span>
              <span>X: {hoveredProbe.xMm.toFixed(1)} mm</span>
            </div>
            <div className="mt-1.5 space-y-0.5 text-[11px]">
              <p className="text-[#a89f8c]">
                Layer: <strong className="text-[#dfe2f1]">{hoveredProbe.flux.tissueLayer.name}</strong>
              </p>
              <p className="text-[#a89f8c]">
                Flux B: <strong className="text-[#f2ca50]">{hoveredProbe.flux.bFieldTesla.toFixed(3)} T</strong>
              </p>
              <p className="text-[#a89f8c]">
                Field E: <strong className="text-[#f2ca50]">{hoveredProbe.flux.inducedElectricFieldE.toFixed(1)} V/m</strong>
              </p>
              <p className="text-[#a89f8c]">
                Current J: <strong className="text-[#dfe2f1]">{hoveredProbe.flux.currentDensityJ.toFixed(2)} A/m²</strong>
              </p>
              <p className="pt-0.5">
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    hoveredProbe.flux.isDepolarized
                      ? "bg-[rgba(242,202,80,0.25)] text-[#f2ca50]"
                      : "bg-[rgba(168,159,140,0.15)] text-[#a89f8c]"
                  }`}
                >
                  {hoveredProbe.flux.isDepolarized ? "DEPOLARIZED (ACTIVE)" : "SUB-THRESHOLD"}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Controls & Dosimetry Bar */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Controls: Sliders */}
        <div className="space-y-4 lg:col-span-7">
          {/* Stimulation Intensity Slider */}
          <div className="rounded-lg border border-[rgba(212,175,55,0.15)] bg-[rgba(18,24,38,0.5)] p-3.5">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor={intensityInputId}
                className="font-medium text-[#dfe2f1]"
              >
                Stimulation Intensity (% Motor Threshold)
              </label>
              <span className="font-mono text-sm font-bold text-[#d4af37]">
                {intensity}% MT
              </span>
            </div>

            <input
              id={intensityInputId}
              type="range"
              min={80}
              max={120}
              step={1}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              aria-label="Stimulation intensity percentage of motor threshold"
              aria-valuemin={80}
              aria-valuemax={120}
              aria-valuenow={intensity}
              aria-valuetext={`${intensity} percent motor threshold`}
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-[rgba(49,53,64,0.8)] accent-[#d4af37] focus:outline-none"
            />

            {/* Presets */}
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#a89f8c]">
              <button
                type="button"
                onClick={() => setIntensity(80)}
                className={`rounded px-1.5 py-0.5 hover:text-[#d4af37] ${
                  intensity === 80 ? "bg-[rgba(212,175,55,0.15)] text-[#d4af37]" : ""
                }`}
              >
                80% (Focal)
              </button>
              <button
                type="button"
                onClick={() => setIntensity(100)}
                className={`rounded px-1.5 py-0.5 hover:text-[#d4af37] ${
                  intensity === 100 ? "bg-[rgba(212,175,55,0.15)] text-[#d4af37]" : ""
                }`}
              >
                100% (Standard)
              </button>
              <button
                type="button"
                onClick={() => setIntensity(110)}
                className={`rounded px-1.5 py-0.5 hover:text-[#d4af37] ${
                  intensity === 110 ? "bg-[rgba(212,175,55,0.15)] text-[#d4af37]" : ""
                }`}
              >
                110% (Clinical rTMS)
              </button>
              <button
                type="button"
                onClick={() => setIntensity(120)}
                className={`rounded px-1.5 py-0.5 hover:text-[#d4af37] ${
                  intensity === 120 ? "bg-[rgba(212,175,55,0.15)] text-[#d4af37]" : ""
                }`}
              >
                120% (High Deep)
              </button>
            </div>
          </div>

          {/* Coil Orientation Angle Slider */}
          <div className="rounded-lg border border-[rgba(212,175,55,0.15)] bg-[rgba(18,24,38,0.5)] p-3.5">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor={angleInputId}
                className="font-medium text-[#dfe2f1]"
              >
                Coil Orientation Angle (Sagittal Alignment)
              </label>
              <span className="font-mono text-sm font-bold text-[#d4af37]">
                {coilAngle}° {coilAngle === 45 ? "★ (Optimal DLPFC)" : ""}
              </span>
            </div>

            <input
              id={angleInputId}
              type="range"
              min={0}
              max={90}
              step={5}
              value={coilAngle}
              onChange={(e) => setCoilAngle(Number(e.target.value))}
              aria-label="Coil orientation angle in degrees relative to sagittal midline"
              aria-valuemin={0}
              aria-valuemax={90}
              aria-valuenow={coilAngle}
              aria-valuetext={`${coilAngle} degrees`}
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-[rgba(49,53,64,0.8)] accent-[#d4af37] focus:outline-none"
            />

            <div className="mt-2 flex items-center justify-between text-[11px] text-[#a89f8c]">
              <span>Coupling Efficiency: {(angleDistortion.efficiencyFactor * 100).toFixed(0)}%</span>
              <span>Field Distortion: {angleDistortion.percentageLoss.toFixed(1)}%</span>
              <button
                type="button"
                onClick={() => setCoilAngle(45)}
                className="rounded text-[#d4af37] underline underline-offset-2 hover:text-[#f2ca50]"
              >
                Reset 45°
              </button>
            </div>
          </div>

          {/* Layer and Canvas Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              aria-pressed={isPaused}
              className="inline-flex items-center gap-1 rounded border border-[rgba(212,175,55,0.25)] bg-[rgba(18,24,38,0.7)] px-3 py-1.5 text-xs text-[#dfe2f1] hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              {isPaused ? "▶ Resume Flow" : "⏸ Pause Flow"}
            </button>

            <button
              type="button"
              onClick={() => setShowVectors((prev) => !prev)}
              aria-pressed={showVectors}
              className={`inline-flex items-center gap-1 rounded border px-3 py-1.5 text-xs transition-colors ${
                showVectors
                  ? "border-[#d4af37] bg-[rgba(212,175,55,0.15)] text-[#d4af37]"
                  : "border-[rgba(212,175,55,0.25)] bg-[rgba(18,24,38,0.7)] text-[#a89f8c]"
              }`}
            >
              Vectors
            </button>

            <button
              type="button"
              onClick={() => setShowIsolines((prev) => !prev)}
              aria-pressed={showIsolines}
              className={`inline-flex items-center gap-1 rounded border px-3 py-1.5 text-xs transition-colors ${
                showIsolines
                  ? "border-[#d4af37] bg-[rgba(212,175,55,0.15)] text-[#d4af37]"
                  : "border-[rgba(212,175,55,0.25)] bg-[rgba(18,24,38,0.7)] text-[#a89f8c]"
              }`}
            >
              Isolines
            </button>

            <button
              type="button"
              onClick={() => setShowHotspotBeam((prev) => !prev)}
              aria-pressed={showHotspotBeam}
              className={`inline-flex items-center gap-1 rounded border px-3 py-1.5 text-xs transition-colors ${
                showHotspotBeam
                  ? "border-[#d4af37] bg-[rgba(212,175,55,0.15)] text-[#d4af37]"
                  : "border-[rgba(212,175,55,0.25)] bg-[rgba(18,24,38,0.7)] text-[#a89f8c]"
              }`}
            >
              Hotspot Beam
            </button>

            <button
              type="button"
              onClick={() => setShowDataTable((prev) => !prev)}
              aria-expanded={showDataTable}
              className="ml-auto inline-flex items-center gap-1 text-xs text-[#d4af37] underline underline-offset-2 hover:text-[#f2ca50]"
            >
              {showDataTable ? "Hide Data Table" : "View Data Table Fallback"}
            </button>
          </div>
        </div>

        {/* Right Dosimetry Telemetry Card */}
        <div className="rounded-lg border border-[rgba(212,175,55,0.2)] bg-[rgba(18,24,38,0.6)] p-4 lg:col-span-5">
          <h3 className="border-b border-[rgba(212,175,55,0.15)] pb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#d4af37]">
            Dosimetric Specifications
          </h3>

          <dl className="mt-3 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-[#a89f8c]">Surface Flux Density (B₀):</dt>
              <dd className="font-mono font-medium text-[#dfe2f1]">
                {surfaceFlux.bFieldTesla.toFixed(2)} Tesla
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-[#a89f8c]">Surface Induced Field (E₀):</dt>
              <dd className="font-mono font-medium text-[#dfe2f1]">
                {surfaceFlux.eFieldVpm.toFixed(1)} V/m
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-[#a89f8c]">DLPFC Cortical Field (z=15mm):</dt>
              <dd className="font-mono font-bold text-[#f2ca50]">
                {corticalFluxDlpfc.inducedElectricFieldE.toFixed(1)} V/m
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-[#a89f8c]">Depolarization Horizon (E≥60):</dt>
              <dd className="font-mono font-bold text-[#d4af37]">
                {thresholdDepthMm.toFixed(1)} mm
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-[#a89f8c]">Hotspot FWHM at DLPFC:</dt>
              <dd className="font-mono font-medium text-[#dfe2f1]">
                {corticalFluxDlpfc.focalHotspotDiameterMm.toFixed(1)} mm
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-[#a89f8c]">Target Anatomical Layer:</dt>
              <dd className="font-medium text-[#dfe2f1]">
                Gray Matter (BA 9/46)
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-[#a89f8c]">Neuronal Activation State:</dt>
              <dd>
                <span
                  className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                    corticalFluxDlpfc.isDepolarized
                      ? "bg-[rgba(242,202,80,0.25)] text-[#f2ca50]"
                      : "bg-[rgba(168,159,140,0.15)] text-[#a89f8c]"
                  }`}
                >
                  {corticalFluxDlpfc.isDepolarized
                    ? "EFFECTIVE DEPOLARIZATION"
                    : "SUB-THRESHOLD STIMULATION"}
                </span>
              </dd>
            </div>
          </dl>

          <div className="mt-4 rounded border border-[rgba(212,175,55,0.15)] bg-[rgba(11,15,25,0.7)] p-2.5 text-[11px] text-[#a89f8c]">
            <p>
              Targeting Left DLPFC at 45° angle maximizes induced posterior-anterior (PA)
              current across pyramidal cell soma columns in the middle frontal gyrus.
            </p>
          </div>
        </div>
      </div>

      {/* Accessible Data Table Fallback */}
      <div
        className={`mt-6 transition-all ${
          showDataTable ? "block" : "sr-only"
        }`}
      >
        <div className="overflow-x-auto rounded-lg border border-[rgba(212,175,55,0.2)] bg-[rgba(18,24,38,0.8)] p-3">
          <h4
            id={tableSummaryId}
            className="mb-2 font-mono text-xs font-bold uppercase text-[#d4af37]"
          >
            Tabular Dosimetry Depth Profile (0 mm to 30 mm)
          </h4>
          <table
            aria-describedby={tableSummaryId}
            className="w-full text-left text-xs"
          >
            <thead>
              <tr className="border-b border-[rgba(212,175,55,0.2)] text-[11px] text-[#a89f8c]">
                <th scope="col" className="p-2">Depth (mm)</th>
                <th scope="col" className="p-2">Tissue Layer</th>
                <th scope="col" className="p-2">Conductivity (S/m)</th>
                <th scope="col" className="p-2">B-Field (T)</th>
                <th scope="col" className="p-2">E-Field (V/m)</th>
                <th scope="col" className="p-2">Current J (A/m²)</th>
                <th scope="col" className="p-2">Hotspot Ø (mm)</th>
                <th scope="col" className="p-2">Depolarized</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(212,175,55,0.1)] font-mono text-[11px]">
              {depthProfile
                .filter((_, idx) => idx % 2 === 0) // sample every 2mm for compact view
                .map((pt) => (
                  <tr
                    key={pt.depthMm}
                    className={
                      pt.depthMm >= 12 && pt.depthMm <= 22
                        ? "bg-[rgba(186,104,200,0.06)] text-[#f2ca50]"
                        : "text-[#dfe2f1]"
                    }
                  >
                    <td className="p-2 font-bold">{pt.depthMm}</td>
                    <td className="p-2 font-sans">{pt.tissueLayer.name}</td>
                    <td className="p-2">{pt.tissueLayer.conductivitySpm}</td>
                    <td className="p-2">{pt.bFieldTesla.toFixed(3)}</td>
                    <td className="p-2">{pt.inducedElectricFieldE.toFixed(1)}</td>
                    <td className="p-2">{pt.currentDensityJ.toFixed(2)}</td>
                    <td className="p-2">{pt.focalHotspotDiameterMm.toFixed(1)}</td>
                    <td className="p-2">
                      <span
                        className={
                          pt.isDepolarized
                            ? "font-bold text-[#f2ca50]"
                            : "text-[#a89f8c]"
                        }
                      >
                        {pt.isDepolarized ? "YES" : "NO"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TmsFluxCanvas;

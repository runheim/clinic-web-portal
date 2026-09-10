"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useId,
  useCallback,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import {
  PHYSIOLOGICAL_RHYTHMS,
  usePrefersReducedMotion,
} from "../../lib/animations/motionTokens";

export type WaveformMode = "dual" | "alpha" | "theta" | "composite";

export interface NeuroWaveformProps {
  /** Additional CSS classes applied to the container */
  className?: string;
  /** Responsive or fixed width for the container. Defaults to '100%'. */
  width?: number | string;
  /** Responsive or fixed height for the container. Defaults to '160px'. */
  height?: number | string;
  /** Internal SVG viewBox width. Defaults to 1000. */
  viewBoxWidth?: number;
  /** Internal SVG viewBox height. Defaults to 200. */
  viewBoxHeight?: number;
  /**
   * Waveform rendering mode:
   *  - 'dual': Renders distinct Alpha (10Hz) and Theta (5.5Hz) traces with composite illumination.
   *  - 'composite': Renders a unified bio-synchronous wave where Theta modulates the Alpha rhythm.
   *  - 'alpha': Isolated 10Hz cortical stabilization rhythm.
   *  - 'theta': Isolated 4-7Hz meditative relaxation rhythm.
   * Defaults to 'dual'.
   */
  mode?: WaveformMode;
  /** Primary waveform stroke thickness in SVG units. Defaults to 2. */
  strokeWidth?: number;
  /** If true, displays soft Champagne Gold atmospheric glow underneath the wave. Defaults to true. */
  showGlow?: boolean;
  /** If true, displays subtle clinical reference horizon and grid markers. Defaults to true. */
  showGrid?: boolean;
  /** If true, renders subtle frequency HUD indicators in the corner. Defaults to false. */
  showMetricsHUD?: boolean;
  /** Calibrated Alpha rhythm frequency in Hz. Defaults to 10.0 Hz. */
  alphaFrequencyHz?: number;
  /** Calibrated Theta rhythm frequency in Hz. Defaults to 5.5 Hz. */
  thetaFrequencyHz?: number;
  /** Manual override to pause animation execution. */
  isPaused?: boolean;
  /** Accessible label for screen readers. */
  ariaLabel?: string;
  /** Additional inline styling for the container */
  style?: CSSProperties;
}

/**
 * Subscribes to browser tab visibility changes via useSyncExternalStore.
 */
function subscribeDocumentVisibility(callback: () => void): () => void {
  if (typeof document === "undefined") {
    return () => {};
  }
  document.addEventListener("visibilitychange", callback);
  return () => {
    document.removeEventListener("visibilitychange", callback);
  };
}

function getDocumentVisibilitySnapshot(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
}

function getDocumentVisibilityServerSnapshot(): boolean {
  return true;
}

function useDocumentVisibility(): boolean {
  return useSyncExternalStore(
    subscribeDocumentVisibility,
    getDocumentVisibilitySnapshot,
    getDocumentVisibilityServerSnapshot
  );
}

/**
 * Hardware-accelerated SVG sine/cosine waveform animation depicting
 * Alpha (10 Hz cortical stabilization) and Theta (4-7 Hz meditative relaxation)
 * rhythms with Champagne Gold gradients.
 *
 * Performance & Accessibility Architecture:
 *  - 60fps GPU acceleration using direct SVG path ref manipulation (0 React re-renders during RAF loop).
 *  - Automatically pauses when scrolled offscreen via IntersectionObserver (0 CPU/GPU waste).
 *  - Automatically pauses when browser tab is inactive via Visibility API.
 *  - Automatically respects `prefers-reduced-motion: reduce` by freezing animation into a serene static baseline.
 */
export function NeuroWaveform({
  className = "",
  width = "100%",
  height = "160px",
  viewBoxWidth = 1000,
  viewBoxHeight = 200,
  mode = "dual",
  strokeWidth = 2,
  showGlow = true,
  showGrid = true,
  showMetricsHUD = false,
  alphaFrequencyHz = PHYSIOLOGICAL_RHYTHMS.ALPHA_WAVE.FREQUENCY_HZ,
  thetaFrequencyHz = PHYSIOLOGICAL_RHYTHMS.THETA_WAVE.FREQUENCY_CENTER_HZ,
  isPaused = false,
  ariaLabel = "Bio-synchronous neural waveform animation showing alpha and theta frequency oscillations",
  style,
}: NeuroWaveformProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const compositePathRef = useRef<SVGPathElement | null>(null);
  const compositeFillRef = useRef<SVGPathElement | null>(null);
  const alphaPathRef = useRef<SVGPathElement | null>(null);
  const thetaPathRef = useRef<SVGPathElement | null>(null);

  const [isInViewport, setIsInViewport] = useState<boolean>(true);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isDocumentVisible = useDocumentVisibility();

  // Unique SVG element IDs to allow multiple waveform instances without ID collisions
  const uniqueId = useId().replace(/[:]/g, "-");
  const strokeGradientId = `neuro-gold-stroke-${uniqueId}`;
  const fillGradientId = `neuro-gold-fill-${uniqueId}`;
  const alphaStrokeId = `neuro-alpha-stroke-${uniqueId}`;
  const thetaStrokeId = `neuro-theta-stroke-${uniqueId}`;
  const glowFilterId = `neuro-glow-filter-${uniqueId}`;

  // Performance: IntersectionObserver for graceful offscreen pausing
  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      {
        threshold: 0.05,
        rootMargin: "50px",
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Wave computation helper for generating SVG path coordinates
  const generatePaths = useCallback(
    (timeSeconds: number) => {
      const centerY = viewBoxHeight / 2;
      const sampleCount = 96;
      const stepX = viewBoxWidth / (sampleCount - 1);

      // Biological amplitudes in SVG pixels
      const thetaAmp = viewBoxHeight * 0.22;
      const alphaAmp = viewBoxHeight * 0.12;

      // Spatial wave numbers across the viewport
      const alphaSpatialCycles = 7.5;
      const thetaSpatialCycles = 2.2;

      // Temporal speeds (radians/sec) calibrated to rhythm ratios
      const alphaSpeed = 2 * Math.PI * (alphaFrequencyHz * 0.18);
      const thetaSpeed = 2 * Math.PI * (thetaFrequencyHz * 0.18);

      const compositePoints: [number, number][] = [];
      const alphaPoints: [number, number][] = [];
      const thetaPoints: [number, number][] = [];

      for (let i = 0; i < sampleCount; i++) {
        const x = i * stepX;
        const normalizedX = x / viewBoxWidth;

        // Window envelope to smoothly taper edges (Hanning-like taper on extremities)
        const edgeWindow = Math.sin(normalizedX * Math.PI);
        const windowFactor = 0.35 + 0.65 * Math.pow(edgeWindow, 0.7);

        // Alpha wave: high-frequency cortical ripple
        const alphaAngle =
          2 * Math.PI * alphaSpatialCycles * normalizedX - alphaSpeed * timeSeconds;
        const rawAlpha = Math.sin(alphaAngle) * alphaAmp * windowFactor;

        // Theta wave: meditative harmonic swell
        const thetaAngle =
          2 * Math.PI * thetaSpatialCycles * normalizedX - thetaSpeed * timeSeconds;
        const rawTheta = Math.cos(thetaAngle) * thetaAmp * windowFactor;

        // Bio-Synchronous Modulation: Theta rhythm modulates the amplitude envelope of Alpha
        const thetaModulator = 0.5 + 0.5 * Math.cos(thetaAngle * 0.5);
        const modulatedAlpha = rawAlpha * (0.6 + 0.4 * thetaModulator);

        const compositeY = centerY + rawTheta + modulatedAlpha;
        const alphaY = centerY + rawAlpha;
        const thetaY = centerY + rawTheta;

        compositePoints.push([x, compositeY]);
        alphaPoints.push([x, alphaY]);
        thetaPoints.push([x, thetaY]);
      }

      // Convert points array to SVG path 'd' string
      const pointsToPath = (pts: [number, number][]): string => {
        if (pts.length === 0) return "";
        let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
        for (let i = 1; i < pts.length; i++) {
          d += ` L ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`;
        }
        return d;
      };

      const compLineD = pointsToPath(compositePoints);
      const compFillD =
        compLineD +
        ` L ${viewBoxWidth} ${viewBoxHeight} L 0 ${viewBoxHeight} Z`;
      const alphaLineD = pointsToPath(alphaPoints);
      const thetaLineD = pointsToPath(thetaPoints);

      return {
        compLineD,
        compFillD,
        alphaLineD,
        thetaLineD,
      };
    },
    [viewBoxHeight, viewBoxWidth, alphaFrequencyHz, thetaFrequencyHz]
  );

  // Animation loop: 60fps / 120fps hardware-accelerated RAF with zero React overhead
  useEffect(() => {
    // Check pause conditions
    const shouldAnimate =
      !isPaused &&
      !prefersReducedMotion &&
      isInViewport &&
      isDocumentVisible;

    if (!shouldAnimate) {
      // Render static balanced baseline wave when paused or reduced-motion is requested
      const staticPaths = generatePaths(0);
      if (compositePathRef.current) {
        compositePathRef.current.setAttribute("d", staticPaths.compLineD);
      }
      if (compositeFillRef.current) {
        compositeFillRef.current.setAttribute("d", staticPaths.compFillD);
      }
      if (alphaPathRef.current) {
        alphaPathRef.current.setAttribute("d", staticPaths.alphaLineD);
      }
      if (thetaPathRef.current) {
        thetaPathRef.current.setAttribute("d", staticPaths.thetaLineD);
      }
      return;
    }

    let animationFrameId: number;
    let startTime: number | null = null;

    const tick = (now: number) => {
      if (startTime === null) {
        startTime = now;
      }
      const elapsedSeconds = (now - startTime) / 1000;
      const paths = generatePaths(elapsedSeconds);

      // Directly update DOM SVG path attributes without React re-render
      if (compositePathRef.current) {
        compositePathRef.current.setAttribute("d", paths.compLineD);
      }
      if (compositeFillRef.current) {
        compositeFillRef.current.setAttribute("d", paths.compFillD);
      }
      if (alphaPathRef.current) {
        alphaPathRef.current.setAttribute("d", paths.alphaLineD);
      }
      if (thetaPathRef.current) {
        thetaPathRef.current.setAttribute("d", paths.thetaLineD);
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isPaused,
    prefersReducedMotion,
    isInViewport,
    isDocumentVisible,
    generatePaths,
  ]);

  const centerY = viewBoxHeight / 2;

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      className={`relative select-none overflow-hidden ${className}`}
      style={{
        width,
        height,
        transform: "translateZ(0)", // Promotes container to dedicated GPU layer
        ...style,
      }}
    >
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="none"
        className="w-full h-full block overflow-visible"
        aria-hidden="true"
      >
        <defs>
          {/* Primary Champagne Gold Stroke Gradient */}
          <linearGradient
            id={strokeGradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0.25" />
            <stop offset="20%" stopColor="#d4af37" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#facc15" stopOpacity="1.0" />
            <stop offset="80%" stopColor="#e9c349" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0.25" />
          </linearGradient>

          {/* Under-Wave Atmospheric Gold Fill Gradient */}
          <linearGradient
            id={fillGradientId}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0.22" />
            <stop offset="40%" stopColor="#d4af37" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0b0f19" stopOpacity="0.0" />
          </linearGradient>

          {/* Alpha (10Hz) Distinct Stroke Gradient */}
          <linearGradient
            id={alphaStrokeId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#fde047" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#fde047" stopOpacity="0.2" />
          </linearGradient>

          {/* Theta (5.5Hz) Distinct Stroke Gradient */}
          <linearGradient
            id={thetaStrokeId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#d4af37" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0.15" />
          </linearGradient>

          {/* Soft Luminescence Filter */}
          <filter
            id={glowFilterId}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Clinical Grid & Horizon Reference */}
        {showGrid && (
          <g opacity="0.4">
            {/* Center Equilibrium Horizon */}
            <line
              x1="0"
              y1={centerY}
              x2={viewBoxWidth}
              y2={centerY}
              stroke="#d4af37"
              strokeWidth="0.75"
              strokeDasharray="4 6"
              strokeOpacity="0.25"
            />
            {/* Top Boundary Guard */}
            <line
              x1="0"
              y1={centerY - viewBoxHeight * 0.35}
              x2={viewBoxWidth}
              y2={centerY - viewBoxHeight * 0.35}
              stroke="#313540"
              strokeWidth="0.5"
              strokeOpacity="0.4"
            />
            {/* Bottom Boundary Guard */}
            <line
              x1="0"
              y1={centerY + viewBoxHeight * 0.35}
              x2={viewBoxWidth}
              y2={centerY + viewBoxHeight * 0.35}
              stroke="#313540"
              strokeWidth="0.5"
              strokeOpacity="0.4"
            />
          </g>
        )}

        {/* 1. Atmospheric Ambient Fill under composite curve */}
        {showGlow && (mode === "dual" || mode === "composite") && (
          <path
            ref={compositeFillRef}
            fill={`url(#${fillGradientId})`}
            stroke="none"
          />
        )}

        {/* 2. Theta Wave Layer (Meditative Undulation) */}
        {(mode === "dual" || mode === "theta") && (
          <path
            ref={thetaPathRef}
            fill="none"
            stroke={`url(#${thetaStrokeId})`}
            strokeWidth={mode === "theta" ? strokeWidth : 1.25}
            strokeDasharray={mode === "dual" ? "2 3" : undefined}
            opacity={mode === "dual" ? 0.7 : 1.0}
          />
        )}

        {/* 3. Alpha Wave Layer (Cortical 10Hz Ripple) */}
        {(mode === "dual" || mode === "alpha") && (
          <path
            ref={alphaPathRef}
            fill="none"
            stroke={`url(#${alphaStrokeId})`}
            strokeWidth={mode === "alpha" ? strokeWidth : 1}
            opacity={mode === "dual" ? 0.6 : 1.0}
          />
        )}

        {/* 4. Primary Bio-Synchronous Composite Waveform */}
        {(mode === "dual" || mode === "composite") && (
          <path
            ref={compositePathRef}
            fill="none"
            stroke={`url(#${strokeGradientId})`}
            strokeWidth={strokeWidth}
            filter={showGlow ? `url(#${glowFilterId})` : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {/* Clinical Frequency HUD Overlay */}
      {showMetricsHUD && (
        <div className="absolute bottom-2 right-3 flex items-center gap-3 text-[10px] font-mono tracking-wider uppercase pointer-events-none select-none">
          <div className="flex items-center gap-1.5 text-[#facc15]/80 bg-[#0b0f19]/80 px-2 py-0.5 rounded border border-[#d4af37]/20 backdrop-blur-xs">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#facc15] animate-pulse" />
            <span>{alphaFrequencyHz.toFixed(1)} Hz Alpha</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#d4af37]/70 bg-[#0b0f19]/80 px-2 py-0.5 rounded border border-[#d4af37]/15 backdrop-blur-xs">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
            <span>{thetaFrequencyHz.toFixed(1)} Hz Theta</span>
          </div>
          {prefersReducedMotion && (
            <div className="text-[9px] text-[#dfe2f1]/60 bg-[#1c1f2a]/90 px-1.5 py-0.5 rounded border border-[#313540]">
              Reduced Motion Active
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NeuroWaveform;

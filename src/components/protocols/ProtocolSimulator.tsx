"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  PROTOCOLS,
  ProtocolId,
  DosingFrequency,
  DosingSchedule,
  getDosingIntervalHours,
  simulateDosingTrajectory,
  KineticModelResult,
  ConcentrationDataPoint,
} from "@/lib/protocols/kinetics";

const PROTOCOL_OPTIONS: { id: ProtocolId; label: string; badge: string }[] = [
  { id: "subq-nad", label: "SubQ NAD+", badge: "Longevity / Sirtuin" },
  { id: "cerebrolysin", label: "Cerebrolysin", badge: "Neurotrophic / BDNF" },
  { id: "semax-selank", label: "Semax & Selank", badge: "Heptapeptide Duo" },
  { id: "mitochondrial-stack", label: "Mitochondrial Stack", badge: "Ubiquinol + PQQ" },
];

const FREQUENCY_OPTIONS: { id: DosingFrequency; label: string; interval: number; desc: string }[] = [
  { id: "twice_daily", label: "Twice Daily", interval: 12, desc: "q12h" },
  { id: "daily", label: "Daily", interval: 24, desc: "q24h" },
  { id: "alternate_days", label: "Alt. Days", interval: 48, desc: "q48h" },
  { id: "weekly", label: "Weekly", interval: 168, desc: "q168h" },
];

const DURATION_DAYS_OPTIONS = [7, 14, 21, 28];

export function ProtocolSimulator() {
  const [selectedProtocolId, setSelectedProtocolId] = useState<ProtocolId>("subq-nad");
  const protocol = PROTOCOLS[selectedProtocolId];

  const [doseAmount, setDoseAmount] = useState<number>(protocol.defaultDose);
  const [frequency, setFrequency] = useState<DosingFrequency>(protocol.defaultFrequency);
  const [simulationDays, setSimulationDays] = useState<number>(14);

  // Hover state for interactive SVG exploration
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Handle protocol change: reset dose to protocol default
  const handleSelectProtocol = (id: ProtocolId) => {
    setSelectedProtocolId(id);
    const newProt = PROTOCOLS[id];
    setDoseAmount(newProt.defaultDose);
    setFrequency(newProt.defaultFrequency);
    setHoverIndex(null);
  };

  // Compute schedule and kinetic simulation trajectory
  const simulationResult: KineticModelResult = useMemo(() => {
    const intervalHours = getDosingIntervalHours(frequency);
    const totalSimHours = simulationDays * 24;
    const numberOfDoses = Math.max(1, Math.floor(totalSimHours / intervalHours));

    const schedule: DosingSchedule = {
      frequency,
      doseAmount,
      intervalHours,
      numberOfDoses,
      route: protocol.administrationRoute,
    };

    return simulateDosingTrajectory(protocol, schedule, totalSimHours);
  }, [protocol, doseAmount, frequency, simulationDays]);

  const { trajectory } = simulationResult;

  // SVG Chart Geometry Constants
  const SVG_WIDTH = 920;
  const SVG_HEIGHT = 340;
  const PADDING = { top: 28, right: 36, bottom: 44, left: 64 };

  const plotWidth = SVG_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;

  // Determine scaling
  const maxSimTime = Math.max(1, trajectory[trajectory.length - 1]?.timeHours ?? 1);
  const rawMaxPrimaryConc = Math.max(...trajectory.map((p) => p.concentration), 0.001);
  const rawMaxSecondaryConc = protocol.secondaryCompound
    ? Math.max(...trajectory.map((p) => p.secondaryConcentration ?? 0), 0)
    : 0;

  const targetMax = protocol.therapeuticTargetRange.max;
  const maxSimConc = Math.max(rawMaxPrimaryConc, rawMaxSecondaryConc, targetMax * 1.15) * 1.08;

  // Transform functions
  const getX = useCallback(
    (timeHours: number) => {
      return PADDING.left + (timeHours / maxSimTime) * plotWidth;
    },
    [maxSimTime, plotWidth, PADDING.left]
  );

  const getY = useCallback(
    (conc: number) => {
      const clamped = Math.max(0, Math.min(conc, maxSimConc));
      return PADDING.top + plotHeight - (clamped / maxSimConc) * plotHeight;
    },
    [maxSimConc, plotHeight, PADDING.top]
  );

  // Generate SVG Path for primary curve
  const primaryPathD = useMemo(() => {
    if (trajectory.length === 0) return "";
    return trajectory.reduce((acc, pt, idx) => {
      const x = getX(pt.timeHours);
      const y = getY(pt.concentration);
      return idx === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : `${acc} L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }, "");
  }, [trajectory, getX, getY]);

  // Primary area fill path
  const primaryAreaD = useMemo(() => {
    if (trajectory.length === 0) return "";
    const startX = getX(trajectory[0].timeHours);
    const endX = getX(trajectory[trajectory.length - 1].timeHours);
    const baselineY = getY(0);
    return `${primaryPathD} L ${endX.toFixed(2)} ${baselineY.toFixed(2)} L ${startX.toFixed(2)} ${baselineY.toFixed(2)} Z`;
  }, [primaryPathD, trajectory, getX, getY]);

  // Secondary curve path if applicable
  const secondaryPathD = useMemo(() => {
    if (!protocol.secondaryCompound || trajectory.length === 0) return "";
    return trajectory.reduce((acc, pt, idx) => {
      const x = getX(pt.timeHours);
      const y = getY(pt.secondaryConcentration ?? 0);
      return idx === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : `${acc} L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }, "");
  }, [protocol.secondaryCompound, trajectory, getX, getY]);

  // Therapeutic corridor rectangle
  const therapeuticTopY = getY(protocol.therapeuticTargetRange.max);
  const therapeuticBottomY = getY(protocol.therapeuticTargetRange.min);
  const therapeuticHeight = Math.max(0, therapeuticBottomY - therapeuticTopY);

  // Steady state Cavg line
  const ssCAvgY = getY(simulationResult.steadyStateCAvg);

  // Time ticks (days)
  const timeTicks = useMemo(() => {
    const ticks: { hours: number; label: string }[] = [];
    const stepDays = simulationDays <= 7 ? 1 : simulationDays <= 14 ? 2 : 4;
    for (let day = 0; day <= simulationDays; day += stepDays) {
      const h = day * 24;
      ticks.push({ hours: h, label: `D${day}` });
    }
    return ticks;
  }, [simulationDays]);

  // Concentration Y ticks
  const concTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = maxSimConc / 4;
    for (let i = 0; i <= 4; i++) {
      ticks.push(Number((i * step).toFixed(2)));
    }
    return ticks;
  }, [maxSimConc]);

  // Dose administration injection marker positions
  const doseMarkers = useMemo(() => {
    const interval = getDosingIntervalHours(frequency);
    const totalSimHours = simulationDays * 24;
    const markers: { hours: number; doseNum: number }[] = [];
    let d = 0;
    while (d * interval < totalSimHours) {
      markers.push({ hours: d * interval, doseNum: d + 1 });
      d++;
    }
    return markers;
  }, [frequency, simulationDays]);

  // Mouse / Touch crosshair handling
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || trajectory.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * SVG_WIDTH;

    if (svgX < PADDING.left || svgX > SVG_WIDTH - PADDING.right) {
      setHoverIndex(null);
      return;
    }

    const hoverTime = ((svgX - PADDING.left) / plotWidth) * maxSimTime;

    // Find closest trajectory point
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < trajectory.length; i++) {
      const diff = Math.abs(trajectory[i].timeHours - hoverTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    setHoverIndex(closestIdx);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  const hoveredPoint: ConcentrationDataPoint | null =
    hoverIndex !== null && trajectory[hoverIndex] ? trajectory[hoverIndex] : null;

  return (
    <section
      className="w-full bg-[#0b0f19] border border-[rgba(212,175,55,0.22)] rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl text-[#dfe2f1]"
      aria-label="Kinetic Supplement & Peptide Dosing Calculator"
    >
      {/* HEADER WITH LUXURY METRICS TITLE & ZERO-EPHI BADGES */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[rgba(212,175,55,0.15)]">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-pulse shadow-[0_0_8px_#d4af37]" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#d4af37]">
              Stoichiometric Pharmacokinetic Engine
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif tracking-tight text-white mt-1">
            Kinetic Protocol Simulator
          </h2>
          <p className="text-sm text-[#a89f8c] mt-0.5">
            Nonlinear 1-Compartment Depot Modeling & Multi-Dose Steady-State Trajectories
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#121826] border border-[#4e6b5e] text-[#4e6b5e]">
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Zero-ePHI Quarantine Verified
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono text-[#d4af37] bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.25)]">
            Pure Deterministic
          </span>
        </div>
      </div>

      {/* PROTOCOL SELECTOR CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
        {PROTOCOL_OPTIONS.map((opt) => {
          const isActive = opt.id === selectedProtocolId;
          const protConfig = PROTOCOLS[opt.id];
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectProtocol(opt.id)}
              className={`text-left p-3.5 rounded-xl transition-all duration-200 border relative ${
                isActive
                  ? "bg-[#121826] border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.18)]"
                  : "bg-[#0f1422] border-[rgba(212,175,55,0.12)] hover:border-[rgba(212,175,55,0.35)] hover:bg-[#121826]/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#a89f8c]">
                  {opt.badge}
                </span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] shadow-[0_0_6px_#d4af37]" />
                )}
              </div>
              <p className="text-base font-semibold text-white mt-1">{opt.label}</p>
              <p className="text-xs text-[#a89f8c] line-clamp-1 mt-0.5">
                Route: {protConfig.administrationRoute} • t½: {protConfig.parameters.halfLifeHours}h
              </p>
            </button>
          );
        })}
      </div>

      {/* INTERACTIVE CONTROLS BAR: DOSING & FREQUENCY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6 p-4 rounded-xl bg-[#121826] border border-[rgba(212,175,55,0.18)]">
        {/* DOSE TITRATION SLIDER */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="dose-slider" className="text-xs font-mono uppercase tracking-wider text-[#d4af37]">
              Titration Dose ({protocol.doseRange.unit})
            </label>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-white tabular-nums">
                {doseAmount}
              </span>
              <span className="text-xs text-[#a89f8c]">{protocol.doseRange.unit}</span>
            </div>
          </div>
          <input
            id="dose-slider"
            type="range"
            min={protocol.doseRange.min}
            max={protocol.doseRange.max}
            step={protocol.doseRange.step}
            value={doseAmount}
            onChange={(e) => setDoseAmount(Number(e.target.value))}
            className="w-full accent-[#d4af37] bg-[#1c1f2a] h-2 rounded-lg cursor-pointer"
            aria-label={`Titration dose in ${protocol.doseRange.unit}`}
          />
          <div className="flex justify-between text-[11px] font-mono text-[#a89f8c] mt-1.5">
            <span>Min: {protocol.doseRange.min} {protocol.doseRange.unit}</span>
            <button
              type="button"
              onClick={() => setDoseAmount(protocol.defaultDose)}
              className="text-[#d4af37] hover:underline cursor-pointer"
            >
              Reset Default ({protocol.defaultDose})
            </button>
            <span>Max: {protocol.doseRange.max} {protocol.doseRange.unit}</span>
          </div>
        </div>

        {/* FREQUENCY SEGMENTED BUTTONS */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <label className="text-xs font-mono uppercase tracking-wider text-[#d4af37] mb-2">
            Dosing Frequency
          </label>
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#0b0f19] rounded-lg border border-[rgba(212,175,55,0.12)]">
            {FREQUENCY_OPTIONS.map((opt) => {
              const isFreqActive = frequency === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFrequency(opt.id)}
                  className={`py-1.5 text-xs font-mono font-medium rounded transition-all ${
                    isFreqActive
                      ? "bg-[#d4af37] text-[#0b0f19] font-bold shadow-md"
                      : "text-[#dfe2f1] hover:text-[#f2ca50] hover:bg-[#1c1f2a]"
                  }`}
                  aria-pressed={isFreqActive}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#a89f8c] mt-1.5">
            <span>Interval: {getDosingIntervalHours(frequency)}h</span>
            <span>Total Doses: {simulationResult.schedule.numberOfDoses}</span>
          </div>
        </div>

        {/* SIMULATION TIMEFRAME */}
        <div className="lg:col-span-3 flex flex-col justify-between">
          <label className="text-xs font-mono uppercase tracking-wider text-[#d4af37] mb-2">
            Simulation Window
          </label>
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#0b0f19] rounded-lg border border-[rgba(212,175,55,0.12)]">
            {DURATION_DAYS_OPTIONS.map((days) => {
              const isDaysActive = simulationDays === days;
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => setSimulationDays(days)}
                  className={`py-1.5 text-xs font-mono font-medium rounded transition-all ${
                    isDaysActive
                      ? "bg-[#4e6b5e] text-white font-bold"
                      : "text-[#dfe2f1] hover:text-[#d4af37] hover:bg-[#1c1f2a]"
                  }`}
                  aria-pressed={isDaysActive}
                >
                  {days}d
                </button>
              );
            })}
          </div>
          <div className="text-right text-[11px] font-mono text-[#a89f8c] mt-1.5">
            {simulationDays * 24} hours continuous
          </div>
        </div>
      </div>

      {/* SVG PLASMA CONCENTRATION CURVE (ZERO LAYOUT SHIFT CANVAS) */}
      <div className="mt-6 p-4 rounded-xl bg-[#0e1320] border border-[rgba(212,175,55,0.2)] relative">
        <div className="flex items-center justify-between pb-2 text-xs font-mono text-[#a89f8c]">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-[#f2ca50] rounded-sm" />
              <strong className="text-white">{protocol.name}</strong> ({protocol.parameters.unit})
            </span>
            {protocol.secondaryCompound && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#38bdf8] rounded-sm" />
                <strong className="text-[#38bdf8]">{protocol.secondaryCompound.name}</strong>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-[#d4af37]" />
              <span>Steady-State Average (Cavg,ss)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-[#4e6b5e]/25 border border-[#4e6b5e]/40 rounded-xs" />
              <span>Therapeutic Range ({protocol.therapeuticTargetRange.min} - {protocol.therapeuticTargetRange.max})</span>
            </span>
          </div>
          <span className="hidden sm:inline-block">Hover / Touch to Inspect Kinetics</span>
        </div>

        {/* FIXED ASPECT RATIO SVG CONTAINER TO GUARANTEE ZERO LAYOUT SHIFT */}
        <div className="w-full relative h-[320px] sm:h-[360px] select-none">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            preserveAspectRatio="none"
            className="w-full h-full cursor-crosshair"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            role="img"
            aria-label={`${protocol.name} multi-dose plasma concentration time curve`}
          >
            <defs>
              {/* Primary Gold Glow & Fill */}
              <linearGradient id="goldCurveFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4af37" stopOpacity="0.40" />
                <stop offset="45%" stopColor="#d4af37" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#d4af37" stopOpacity="0.0" />
              </linearGradient>

              {/* Secondary Compound Fill */}
              <linearGradient id="secondaryFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.30" />
                <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>

              {/* Drop Shadow Glow */}
              <filter id="goldGlow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#f2ca50" floodOpacity="0.6" />
              </filter>
            </defs>

            {/* Coordinate Grid Background */}
            <g stroke="rgba(212, 175, 55, 0.08)" strokeDasharray="3 3">
              {concTicks.map((val) => {
                const y = getY(val);
                return (
                  <line
                    key={`grid-y-${val}`}
                    x1={PADDING.left}
                    y1={y}
                    x2={SVG_WIDTH - PADDING.right}
                    y2={y}
                  />
                );
              })}
              {timeTicks.map((t) => {
                const x = getX(t.hours);
                return (
                  <line
                    key={`grid-x-${t.hours}`}
                    x1={x}
                    y1={PADDING.top}
                    x2={x}
                    y2={PADDING.top + plotHeight}
                  />
                );
              })}
            </g>

            {/* Therapeutic Target Range Zone */}
            <rect
              x={PADDING.left}
              y={therapeuticTopY}
              width={plotWidth}
              height={therapeuticHeight}
              fill="#4e6b5e"
              fillOpacity="0.12"
              stroke="#4e6b5e"
              strokeOpacity="0.3"
              strokeDasharray="2 2"
            />

            {/* Secondary Compound Curve (if active) */}
            {protocol.secondaryCompound && secondaryPathD && (
              <path
                d={secondaryPathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.0"
                opacity="0.85"
              />
            )}

            {/* Primary Area Fill */}
            {primaryAreaD && <path d={primaryAreaD} fill="url(#goldCurveFill)" />}

            {/* Steady-State Average (Cavg,ss) Guideline */}
            <line
              x1={PADDING.left}
              y1={ssCAvgY}
              x2={SVG_WIDTH - PADDING.right}
              y2={ssCAvgY}
              stroke="#d4af37"
              strokeWidth="1.5"
              strokeDasharray="5 4"
              opacity="0.75"
            />

            {/* Primary Concentration Curve */}
            {primaryPathD && (
              <path
                d={primaryPathD}
                fill="none"
                stroke="#f2ca50"
                strokeWidth="2.5"
                filter="url(#goldGlow)"
              />
            )}

            {/* Dose Administration Event Markers (Bottom Axis) */}
            {doseMarkers.map((marker) => {
              const x = getX(marker.hours);
              const y = getY(0);
              return (
                <g key={`dose-${marker.doseNum}`}>
                  <line
                    x1={x}
                    y1={y - 8}
                    x2={x}
                    y2={y + 4}
                    stroke="#d4af37"
                    strokeWidth="1.5"
                  />
                  <polygon
                    points={`${x},${y - 12} ${x + 3},${y - 8} ${x},${y - 4} ${x - 3},${y - 8}`}
                    fill="#f2ca50"
                  />
                </g>
              );
            })}

            {/* Axes Lines */}
            <line
              x1={PADDING.left}
              y1={PADDING.top + plotHeight}
              x2={SVG_WIDTH - PADDING.right}
              y2={PADDING.top + plotHeight}
              stroke="rgba(212, 175, 55, 0.3)"
              strokeWidth="1.5"
            />
            <line
              x1={PADDING.left}
              y1={PADDING.top}
              x2={PADDING.left}
              y2={PADDING.top + plotHeight}
              stroke="rgba(212, 175, 55, 0.3)"
              strokeWidth="1.5"
            />

            {/* X-Axis Tick Labels (Time in Days) */}
            {timeTicks.map((t) => {
              const x = getX(t.hours);
              return (
                <text
                  key={`lbl-x-${t.hours}`}
                  x={x}
                  y={SVG_HEIGHT - 12}
                  fill="#a89f8c"
                  fontSize="11"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {t.label}
                </text>
              );
            })}

            {/* Y-Axis Tick Labels (Concentration) */}
            {concTicks.map((val) => {
              const y = getY(val);
              return (
                <text
                  key={`lbl-y-${val}`}
                  x={PADDING.left - 8}
                  y={y + 4}
                  fill="#a89f8c"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {val.toFixed(1)}
                </text>
              );
            })}

            {/* Interactive Crosshair & Cursor HUD */}
            {hoveredPoint && (
              <g>
                <line
                  x1={getX(hoveredPoint.timeHours)}
                  y1={PADDING.top}
                  x2={getX(hoveredPoint.timeHours)}
                  y2={PADDING.top + plotHeight}
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.8"
                />
                <circle
                  cx={getX(hoveredPoint.timeHours)}
                  cy={getY(hoveredPoint.concentration)}
                  r="5"
                  fill="#f2ca50"
                  stroke="#0b0f19"
                  strokeWidth="2"
                  filter="url(#goldGlow)"
                />
                {hoveredPoint.secondaryConcentration !== undefined && (
                  <circle
                    cx={getX(hoveredPoint.timeHours)}
                    cy={getY(hoveredPoint.secondaryConcentration)}
                    r="4"
                    fill="#38bdf8"
                    stroke="#0b0f19"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            )}
          </svg>

          {/* FLOATING HOVER TOOLTIP CARD */}
          {hoveredPoint && (
            <div
              className="absolute top-2 right-2 bg-[#121826]/95 border border-[#d4af37]/60 rounded-lg p-3 shadow-xl backdrop-blur-md pointer-events-none min-w-[210px] text-xs font-mono"
            >
              <div className="flex items-center justify-between text-[#d4af37] border-b border-[rgba(212,175,55,0.2)] pb-1 mb-1.5 font-semibold">
                <span>T = {hoveredPoint.timeHours}h</span>
                <span>Day {(hoveredPoint.timeHours / 24).toFixed(1)}</span>
              </div>
              <div className="flex justify-between py-0.5 text-white">
                <span className="text-[#a89f8c]">Primary Conc:</span>
                <span className="font-bold text-[#f2ca50] tabular-nums">
                  {hoveredPoint.concentration} {protocol.parameters.unit}
                </span>
              </div>
              {hoveredPoint.secondaryConcentration !== undefined && (
                <div className="flex justify-between py-0.5 text-white">
                  <span className="text-[#a89f8c]">Secondary:</span>
                  <span className="font-bold text-[#38bdf8] tabular-nums">
                    {hoveredPoint.secondaryConcentration} {protocol.parameters.unit}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-0.5 text-[#a89f8c]">
                <span>Active Cycle:</span>
                <span className="text-white">Dose #{hoveredPoint.doseNumber}</span>
              </div>
              <div className="flex justify-between py-0.5 text-[#a89f8c]">
                <span>% of Steady Cmax:</span>
                <span className="text-white tabular-nums">
                  {simulationResult.steadyStateCMax > 0
                    ? ((hoveredPoint.concentration / simulationResult.steadyStateCMax) * 100).toFixed(1)
                    : "0.0"}
                  %
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REAL-TIME KINETIC METRICS HUD (ZERO LAYOUT SHIFT GRID) */}
      <div className="mt-6">
        <h3 className="text-xs font-mono uppercase tracking-widest text-[#d4af37] mb-3">
          Pharmacokinetic Metrics & Steady-State HUD
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Cmax (Single) */}
          <div className="bg-[#121826] border border-[rgba(212,175,55,0.18)] rounded-xl p-3 flex flex-col justify-between min-h-[90px]">
            <span className="text-[11px] font-mono text-[#a89f8c] uppercase">Cmax (Single Dose)</span>
            <p className="text-lg font-bold font-mono text-white tabular-nums">
              {simulationResult.cMax.toFixed(2)}
              <span className="text-xs font-normal text-[#a89f8c] ml-1">{protocol.parameters.unit}</span>
            </p>
            <span className="text-[10px] text-[#a89f8c]">Peak single-dose spike</span>
          </div>

          {/* Tmax */}
          <div className="bg-[#121826] border border-[rgba(212,175,55,0.18)] rounded-xl p-3 flex flex-col justify-between min-h-[90px]">
            <span className="text-[11px] font-mono text-[#a89f8c] uppercase">Tmax (Time to Peak)</span>
            <p className="text-lg font-bold font-mono text-[#f2ca50] tabular-nums">
              {simulationResult.tMax.toFixed(2)}
              <span className="text-xs font-normal text-[#a89f8c] ml-1">hours</span>
            </p>
            <span className="text-[10px] text-[#a89f8c]">
              {(simulationResult.tMax * 60).toFixed(0)} min post depot
            </span>
          </div>

          {/* Cmax,ss */}
          <div className="bg-[#121826] border border-[rgba(212,175,55,0.18)] rounded-xl p-3 flex flex-col justify-between min-h-[90px]">
            <span className="text-[11px] font-mono text-[#a89f8c] uppercase">Cmax,ss (Steady Peak)</span>
            <p className="text-lg font-bold font-mono text-white tabular-nums">
              {simulationResult.steadyStateCMax.toFixed(2)}
              <span className="text-xs font-normal text-[#a89f8c] ml-1">{protocol.parameters.unit}</span>
            </p>
            <span className="text-[10px] text-[#a89f8c]">Max plateau amplitude</span>
          </div>

          {/* Cmin,ss (Trough) */}
          <div className="bg-[#121826] border border-[rgba(212,175,55,0.18)] rounded-xl p-3 flex flex-col justify-between min-h-[90px]">
            <span className="text-[11px] font-mono text-[#a89f8c] uppercase">Cmin,ss (Trough)</span>
            <p className="text-lg font-bold font-mono text-white tabular-nums">
              {simulationResult.steadyStateCMin.toFixed(2)}
              <span className="text-xs font-normal text-[#a89f8c] ml-1">{protocol.parameters.unit}</span>
            </p>
            <span className="text-[10px] text-[#a89f8c]">Residual before dose</span>
          </div>

          {/* Accumulation Index R */}
          <div className="bg-[#121826] border border-[rgba(212,175,55,0.18)] rounded-xl p-3 flex flex-col justify-between min-h-[90px]">
            <span className="text-[11px] font-mono text-[#a89f8c] uppercase">Accumulation Index (R)</span>
            <p className="text-lg font-bold font-mono text-[#d4af37] tabular-nums">
              {simulationResult.accumulationIndex.toFixed(2)}x
            </p>
            <span className="text-[10px] text-[#a89f8c]">1 / (1 - e^-ke*tau)</span>
          </div>

          {/* Time to 90% SS */}
          <div className="bg-[#121826] border border-[rgba(212,175,55,0.18)] rounded-xl p-3 flex flex-col justify-between min-h-[90px]">
            <span className="text-[11px] font-mono text-[#a89f8c] uppercase">90% Steady State</span>
            <p className="text-lg font-bold font-mono text-white tabular-nums">
              {simulationResult.timeToSteadyState90.toFixed(1)}
              <span className="text-xs font-normal text-[#a89f8c] ml-1">h</span>
            </p>
            <span className="text-[10px] text-[#a89f8c]">
              {(simulationResult.timeToSteadyState90 / 24).toFixed(1)} days wash-in
            </span>
          </div>
        </div>
      </div>

      {/* PROTOCOL BIOCHEMISTRY & PHARMACODYNAMICS NOTE */}
      <div className="mt-6 p-4 sm:p-5 rounded-xl bg-[#121826]/70 border border-[rgba(212,175,55,0.15)] flex flex-col md:flex-row items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.3)] flex items-center justify-center shrink-0 text-[#d4af37]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-semibold text-white">
              {protocol.name} • {protocol.subtitle}
            </h4>
            <span className="text-xs font-mono text-[#d4af37]">
              Target: {protocol.molecularTarget}
            </span>
          </div>
          <p className="text-xs text-[#a89f8c] mt-1.5 leading-relaxed">
            {protocol.description}
          </p>
          <div className="mt-2 text-xs text-[#dfe2f1]/80 border-t border-[rgba(212,175,55,0.1)] pt-2 flex items-center gap-2">
            <span className="text-[#d4af37] font-semibold">Clinical Stoichiometry Rationale:</span>
            <span>{protocol.clinicalNotes}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
export default ProtocolSimulator;

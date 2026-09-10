"use client";

import React, { useState } from "react";

export function StoichiometrySimulator() {
  const [deliveryMode, setDeliveryMode] = useState<"hcl" | "ttfd">("ttfd");
  const [doseMg, setDoseMg] = useState<number>(300);
  const [omega3Index, setOmega3Index] = useState<number>(8.5);

  // Compute enzyme saturation percentage
  // Oral HCl reaches a plateau around 18-22% due to SLC19A1/2 intestinal transport saturation
  // TTFD diffuses passively through lipid bilayers, achieving 80-98% saturation via mass action
  const saturationPercentage =
    deliveryMode === "hcl"
      ? Math.min(22, Math.round((doseMg / 600) * 20 + 8))
      : Math.min(98, Math.round(40 + (doseMg / 600) * 55));

  const isOmegaGateSatisfied = omega3Index >= 8.0;
  const isStoichiometricSaturationActive = deliveryMode === "ttfd" && isOmegaGateSatisfied;

  // SVG Coordinates for Saturation Curve (width 500, height 220)
  // X axis: 0 to 600 mg
  // Y axis: 0 to 100% saturation (inverted in SVG)
  const currentX = 50 + (doseMg / 600) * 420;
  const currentY = 190 - (saturationPercentage / 100) * 150;

  return (
    <div
      role="region"
      aria-label="Interactive Stoichiometric Pathway Simulator"
      className="rounded-2xl p-6 sm:p-8 bg-[#121826] border border-[#D4AF37]/30 shadow-[0_20px_60px_rgba(0,0,0,0.7)] space-y-8 relative overflow-hidden"
    >
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-champagne-gold/5 blur-3xl pointer-events-none rounded-full" />

      {/* Simulator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-midnight pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-canvas-obsidian border border-[#D4AF37]/30 text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
            <span className="w-1.5 h-1.5 rounded-full bg-vitality-sage animate-ping" />
            <span>Interactive Stoichiometric Pathway Engine &bull; Ephemeral Simulation</span>
          </div>
          <h3 className="font-display text-2xl sm:text-3xl text-text-surface">
            Enzyme Hysteresis &amp; Membrane Gate Simulator
          </h3>
          <p className="font-body text-xs text-text-surface-variant max-w-2xl leading-relaxed">
            Model the mass-action kinetics of lipophilic thiamine derivatives (TTFD) vs conventional salts 
            and observe the rate-limiting neuronal membrane fluidity gate established by the Oxford VITACOG trials.
          </p>
        </div>

        {/* Real-time Status Badge */}
        <div className="flex items-center">
          <div
            className={`px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider border flex items-center gap-2 transition-all duration-300 ${
              isStoichiometricSaturationActive
                ? "bg-[#4E6B5E]/20 text-vitality-sage border-vitality-sage/50 shadow-[0_0_20px_rgba(78,107,94,0.3)]"
                : "bg-red-950/30 text-red-300 border-red-500/40"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isStoichiometricSaturationActive ? "bg-vitality-sage animate-pulse" : "bg-red-400"
              }`}
            />
            <span className="font-bold">
              {isStoichiometricSaturationActive
                ? "Stoichiometric Saturation Active"
                : "Hysteresis Blockade"}
            </span>
          </div>
        </div>
      </div>

      {/* Simulation Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Sliders & Toggles */}
        <div className="lg:col-span-5 space-y-6">
          {/* Control 1: Delivery Mode Toggle */}
          <div className="space-y-3 p-4 rounded-xl bg-canvas-obsidian border border-border-midnight">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-champagne-gold uppercase tracking-wider font-semibold">
                01 &bull; Thiamine Molecule Kinetics:
              </span>
              <span className="text-text-surface-muted text-[10px]">
                {deliveryMode === "ttfd" ? "Lipophilic Disulfide" : "Water-Soluble Salt"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setDeliveryMode("hcl")}
                aria-pressed={deliveryMode === "hcl"}
                className={`py-2.5 px-3 rounded-lg border transition-all text-center focus-visible:ring-1 focus-visible:ring-[#D4AF37] focus:outline-none ${
                  deliveryMode === "hcl"
                    ? "bg-surface-midnight text-champagne-gold border-champagne-gold shadow-inner font-bold"
                    : "bg-canvas-obsidian text-text-surface-muted border-border-midnight hover:text-text-surface"
                }`}
              >
                Oral Thiamine HCl
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMode("ttfd")}
                aria-pressed={deliveryMode === "ttfd"}
                className={`py-2.5 px-3 rounded-lg border transition-all text-center focus-visible:ring-1 focus-visible:ring-[#D4AF37] focus:outline-none ${
                  deliveryMode === "ttfd"
                    ? "bg-surface-midnight text-champagne-gold border-champagne-gold shadow-inner font-bold"
                    : "bg-canvas-obsidian text-text-surface-muted border-border-midnight hover:text-text-surface"
                }`}
              >
                Lipophilic TTFD
              </button>
            </div>
            <p className="font-body text-[11px] text-text-surface-muted leading-relaxed">
              {deliveryMode === "hcl"
                ? "Saturates SLC19A intestinal active transport carriers at low dosages, causing flat systemic tissue levels."
                : "Lipid-soluble thiamine tetrahydrofurfuryl disulfide passively crosses blood-brain barrier and cell membranes."}
            </p>
          </div>

          {/* Control 2: Daily Dosage Slider */}
          <div className="space-y-2 p-4 rounded-xl bg-canvas-obsidian border border-border-midnight font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-text-surface uppercase tracking-wider font-medium">
                02 &bull; Active Dosage:
              </span>
              <span className="text-champagne-gold font-bold text-sm bg-surface-midnight px-2 py-0.5 rounded border border-[#D4AF37]/30">
                {doseMg} mg / day
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={600}
              step={25}
              value={doseMg}
              aria-label="Active Thiamine Daily Dosage (mg/day)"
              aria-valuenow={doseMg}
              aria-valuemin={50}
              aria-valuemax={600}
              aria-valuetext={`${doseMg} milligrams per day`}
              onChange={(e) => setDoseMg(Number(e.target.value))}
              className="w-full accent-champagne-gold cursor-pointer focus-visible:ring-1 focus-visible:ring-[#D4AF37] focus:outline-none rounded"
            />
            <div className="flex justify-between text-[10px] text-text-surface-muted">
              <span>50 mg (RDA Minimum)</span>
              <span>300 mg</span>
              <span>600 mg (Mass-Action Target)</span>
            </div>
          </div>

          {/* Control 3: Marine Omega-3 Index Slider */}
          <div className="space-y-2 p-4 rounded-xl bg-canvas-obsidian border border-border-midnight font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-text-surface uppercase tracking-wider font-medium">
                03 &bull; Marine Omega-3 Index:
              </span>
              <span
                className={`font-bold text-sm px-2 py-0.5 rounded border ${
                  isOmegaGateSatisfied
                    ? "text-vitality-sage bg-surface-midnight border-vitality-sage/40"
                    : "text-red-300 bg-red-950/40 border-red-500/30"
                }`}
              >
                {omega3Index.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min={2.0}
              max={12.0}
              step={0.1}
              value={omega3Index}
              aria-label="Marine Omega-3 Index Percentage"
              aria-valuenow={omega3Index}
              aria-valuemin={2.0}
              aria-valuemax={12.0}
              aria-valuetext={`${omega3Index.toFixed(1)} percent`}
              onChange={(e) => setOmega3Index(Number(e.target.value))}
              className="w-full accent-vitality-sage cursor-pointer focus-visible:ring-1 focus-visible:ring-[#D4AF37] focus:outline-none rounded"
            />
            <div className="flex justify-between text-[10px] text-text-surface-muted">
              <span className="text-red-400">&lt; 4.0% (Deficient)</span>
              <span className="text-amber-300">4.0%–7.9% (Suboptimal)</span>
              <span className="text-vitality-sage">&ge; 8.0% (Protective Gate)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Reactive Kinetic Graph & Biological Readouts */}
        <div className="lg:col-span-7 space-y-6">
          {/* Reactive SVG Graph */}
          <div className="p-5 rounded-xl bg-canvas-obsidian border border-border-midnight space-y-4">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-champagne-gold uppercase tracking-wider font-semibold">
                Cerebral Pyruvate Dehydrogenase (PDH) Saturation Curve
              </span>
              <span className="text-text-surface-muted text-[11px]">
                Enzyme Velocity vs Substrate Dose
              </span>
            </div>

            <div
              role="img"
              aria-label="Cerebral Pyruvate Dehydrogenase PDH Saturation Curve Graph"
              className="relative w-full aspect-[500/220] bg-[#0E131F] rounded-lg border border-border-midnight/80 p-2 overflow-hidden"
            >
              <span className="sr-only">
                Reactive saturation kinetics graph: showing {saturationPercentage}% saturation for{" "}
                {deliveryMode === "ttfd" ? "Lipophilic TTFD" : "Oral Thiamine HCl"} at {doseMg}mg/day with Omega-3
                Index of {omega3Index.toFixed(1)}%.
              </span>
              <svg viewBox="0 0 500 220" aria-hidden="true" className="w-full h-full overflow-visible">
                {/* Grid Lines */}
                <line x1="50" y1="40" x2="470" y2="40" stroke="#1F2839" strokeDasharray="3 3" />
                <line x1="50" y1="90" x2="470" y2="90" stroke="#1F2839" strokeDasharray="3 3" />
                <line x1="50" y1="140" x2="470" y2="140" stroke="#1F2839" strokeDasharray="3 3" />
                <line x1="50" y1="190" x2="470" y2="190" stroke="#333E52" strokeWidth="1.5" />
                <line x1="50" y1="40" x2="50" y2="190" stroke="#333E52" strokeWidth="1.5" />

                {/* Axis Labels */}
                <text x="40" y="45" fill="#6B7280" fontSize="10" fontFamily="monospace" textAnchor="end">
                  100%
                </text>
                <text x="40" y="115" fill="#6B7280" fontSize="10" fontFamily="monospace" textAnchor="end">
                  50%
                </text>
                <text x="40" y="193" fill="#6B7280" fontSize="10" fontFamily="monospace" textAnchor="end">
                  0%
                </text>
                <text x="50" y="210" fill="#6B7280" fontSize="10" fontFamily="monospace">
                  0 mg
                </text>
                <text x="250" y="210" fill="#6B7280" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  300 mg
                </text>
                <text x="470" y="210" fill="#6B7280" fontSize="10" fontFamily="monospace" textAnchor="end">
                  600 mg
                </text>

                {/* 75% Neuro-Protective Saturation Threshold Line */}
                <line
                  x1="50"
                  y1={190 - 0.75 * 150}
                  x2="470"
                  y2={190 - 0.75 * 150}
                  stroke="#4E6B5E"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x="465"
                  y={190 - 0.75 * 150 - 5}
                  fill="#4E6B5E"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  Clinical Target (75% Saturation)
                </text>

                {/* Oral Thiamine HCl Plateau Curve */}
                <path
                  d="M 50 180 Q 120 155 470 155"
                  fill="none"
                  stroke={deliveryMode === "hcl" ? "#D4AF37" : "#3E495D"}
                  strokeWidth={deliveryMode === "hcl" ? "3" : "1.5"}
                  strokeDasharray={deliveryMode === "hcl" ? "none" : "2 2"}
                />

                {/* Lipophilic TTFD Steep Mass Action Curve */}
                <path
                  d="M 50 180 C 150 160, 220 70, 470 45"
                  fill="none"
                  stroke={deliveryMode === "ttfd" ? "#D4AF37" : "#3E495D"}
                  strokeWidth={deliveryMode === "ttfd" ? "3" : "1.5"}
                  strokeDasharray={deliveryMode === "ttfd" ? "none" : "2 2"}
                />

                {/* Active Operating Point Marker */}
                <circle
                  cx={currentX}
                  cy={currentY}
                  r="6"
                  fill="#D4AF37"
                  stroke="#0B0F19"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />
                <circle
                  cx={currentX}
                  cy={currentY}
                  r="12"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="1"
                  opacity="0.5"
                  className="animate-ping"
                />

                {/* Callout Marker Text */}
                <text
                  x={Math.min(440, Math.max(70, currentX))}
                  y={Math.max(25, currentY - 14)}
                  fill="#F6F7FB"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {saturationPercentage}% SATURATION
                </text>
              </svg>
            </div>

            {/* Readout Metadata Bar */}
            <div className="grid grid-cols-3 gap-3 font-mono text-[11px] pt-1">
              <div className="p-2.5 rounded bg-surface-midnight border border-border-midnight text-center">
                <span className="text-text-surface-muted block text-[10px]">Active Molecule:</span>
                <span className="text-champagne-gold font-bold">
                  {deliveryMode === "ttfd" ? "Lipophilic TTFD" : "Oral Thiamine HCl"}
                </span>
              </div>
              <div className="p-2.5 rounded bg-surface-midnight border border-border-midnight text-center">
                <span className="text-text-surface-muted block text-[10px]">Cerebral Penetration:</span>
                <span className="text-text-surface font-bold">
                  {deliveryMode === "ttfd" ? "High (Passive Diffusion)" : "Low (Carrier Saturated)"}
                </span>
              </div>
              <div className="p-2.5 rounded bg-surface-midnight border border-border-midnight text-center">
                <span className="text-text-surface-muted block text-[10px]">PDH Saturation:</span>
                <span
                  className={`font-bold ${
                    saturationPercentage >= 75 ? "text-vitality-sage" : "text-text-surface-muted"
                  }`}
                >
                  {saturationPercentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Clinical Advisory Panel for Omega-3 Index Gatekeeper */}
          {!isOmegaGateSatisfied ? (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 font-mono text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>VITACOG/B-Proof Gate Active: Bilayer Membrane Resistance</span>
              </div>
              <p className="text-text-surface-variant font-body text-xs leading-relaxed">
                VITACOG/B-Proof Gate Active: B-vitamin methylation cofactor remethylation is statistically blunted 
                due to rigid neuronal lipid bilayers. The Oxford OPTIMA trials proved that elevated B-vitamin saturation 
                slows brain atrophy by 73% <em>only</em> when baseline Omega-3 Index is elevated above &ge; 8.0%.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#4E6B5E]/15 border border-vitality-sage/40 font-mono text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-vitality-sage font-bold uppercase tracking-wider">
                <svg className="w-4 h-4 text-vitality-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Membrane Permeability Optimal (&ge; 8.0% Omega-3 Gate Cleared)</span>
              </div>
              <p className="text-text-surface-variant font-body text-xs leading-relaxed">
                Neuronal membrane lipid rafts possess high fluid flexibility. Mass-action cofactors (HoloTC, active 5-MTHF, 
                and lipophilic TDP) freely permeate receptor domains to support uninhibited mitochondrial phosphorylation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StoichiometrySimulator;

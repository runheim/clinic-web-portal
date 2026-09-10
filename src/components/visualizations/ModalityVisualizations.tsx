"use client";

import React from "react";

interface VisualizationProps {
  className?: string;
  variant?: "card" | "hero";
}

/**
 * 1. TMS Neuromodulation:
 * Neural synapse vector with magnetic field flux lines (#D4AF37),
 * synaptic cleft, vesicle fusion, and dendritic spine depolarization vectors.
 */
export function TMSVisualization({ className = "" }: VisualizationProps) {
  return (
    <div
      role="img"
      aria-label="Transcranial Magnetic Stimulation Synaptic Depolarization Diagram"
      className={`relative overflow-hidden rounded-lg bg-canvas-obsidian/90 border border-border-gold-subtle ${className}`}
    >
      <span className="sr-only">
        Scientific blueprint showing 10 Hz Theta-Burst TMS coil delivering a 2.0 Tesla magnetic flux vector through the dorsolateral prefrontal cortex. Depicts presynaptic vesicle fusion, calcium ion influx through receptor channels, and dendritic spine depolarization driving BDNF long-term potentiation.
      </span>
      <svg
        viewBox="0 0 400 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="w-full h-full object-contain select-none"
      >
        <defs>
          <radialGradient id="tmsGlow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0B0F19" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="fluxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F2CA50" />
            <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4E6B5E" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Ambient Backlight */}
        <rect width="400" height="240" fill="url(#tmsGlow)" />

        {/* Grid Coordinates Background */}
        <g stroke="#D4AF37" strokeOpacity="0.07" strokeWidth="0.5" strokeDasharray="3 3">
          <line x1="40" y1="0" x2="40" y2="240" />
          <line x1="120" y1="0" x2="120" y2="240" />
          <line x1="200" y1="0" x2="200" y2="240" />
          <line x1="280" y1="0" x2="280" y2="240" />
          <line x1="360" y1="0" x2="360" y2="240" />
          <line x1="0" y1="60" x2="400" y2="60" />
          <line x1="0" y1="120" x2="400" y2="120" />
          <line x1="0" y1="180" x2="400" y2="180" />
        </g>

        {/* External Magnetic Coil Outline (Top) */}
        <g opacity="0.85">
          <ellipse cx="200" cy="28" rx="70" ry="14" stroke="#D4AF37" strokeWidth="1.5" fill="#121826" />
          <ellipse cx="200" cy="34" rx="55" ry="10" stroke="#F2CA50" strokeWidth="1" strokeDasharray="4 2" />
          <text x="200" y="22" fill="#D4AF37" fontSize="8" fontFamily="monospace" textAnchor="middle" letterSpacing="2">
            10 HZ THETA-BURST COIL (2.0T)
          </text>
        </g>

        {/* Magnetic Flux Vector Arcs (DLPFC penetrating lines) */}
        <g stroke="url(#fluxGrad)" strokeWidth="1.2" opacity="0.75">
          <path d="M 150 35 C 130 75, 110 115, 140 160" strokeDasharray="4 3" />
          <path d="M 175 40 C 160 80, 155 120, 175 165" />
          <path d="M 200 42 C 200 85, 200 125, 200 168" strokeWidth="1.8" />
          <path d="M 225 40 C 240 80, 245 120, 225 165" />
          <path d="M 250 35 C 270 75, 290 115, 260 160" strokeDasharray="4 3" />
        </g>

        {/* Presynaptic Terminal Bouton (Axon) */}
        <path
          d="M 160 80 C 170 120, 150 145, 170 152 C 185 155, 215 155, 230 152 C 250 145, 230 120, 240 80"
          stroke="#DFE2F1"
          strokeWidth="1.5"
          fill="#121826"
          fillOpacity="0.8"
        />

        {/* Synaptic Vesicles with Neurotransmitter */}
        <circle cx="185" cy="120" r="5" stroke="#D4AF37" strokeWidth="1" fill="#0B0F19" />
        <circle cx="215" cy="122" r="5" stroke="#D4AF37" strokeWidth="1" fill="#0B0F19" />
        <circle cx="195" cy="135" r="4.5" stroke="#F2CA50" strokeWidth="1" fill="#D4AF37" fillOpacity="0.4" />
        <circle cx="205" cy="146" r="3.5" stroke="#F2CA50" strokeWidth="1.2" fill="#F2CA50" />

        {/* Synaptic Cleft (20nm corridor) */}
        <line x1="165" y1="162" x2="235" y2="162" stroke="#4E6B5E" strokeWidth="1" strokeDasharray="2 2" />

        {/* Postsynaptic Dendritic Spine Membrane */}
        <path
          d="M 140 195 C 165 170, 235 170, 260 195"
          stroke="#DFE2F1"
          strokeWidth="2"
          fill="#121826"
          fillOpacity="0.9"
        />

        {/* Depolarization Ion Channels / Receptor Gates */}
        <rect x="175" y="169" width="10" height="4" rx="1" fill="#D4AF37" />
        <rect x="195" y="169" width="10" height="4" rx="1" fill="#F2CA50" />
        <rect x="215" y="169" width="10" height="4" rx="1" fill="#D4AF37" />

        {/* Ca2+ / Na+ Influx Arrow Vectors */}
        <path d="M 200 174 L 200 192 M 197 188 L 200 192 L 203 188" stroke="#4E6B5E" strokeWidth="1.5" />

        {/* Telemetry Labels */}
        <text x="25" y="32" fill="#D4AF37" fontSize="9" fontFamily="monospace" fontWeight="600">
          FIG 1.1 // TMS FLUX
        </text>
        <text x="25" y="44" fill="#99907C" fontSize="7.5" fontFamily="monospace">
          DLPFC SYNAPSE • 10 HZ
        </text>
        <text x="375" y="215" fill="#4E6B5E" fontSize="8" fontFamily="monospace" textAnchor="end">
          BDNF / LTP INDUCTION &bull; &Delta;V = +45mV
        </text>
      </svg>
    </div>
  );
}

/**
 * 2. Subcutaneous Peptides:
 * Molecular peptide chain visualization in Muted Platinum & Gold,
 * Epitalon/GHK-Cu helix nodes, disulfide bridges, and amino acid residues.
 */
export function PeptidesVisualization({ className = "" }: VisualizationProps) {
  return (
    <div
      role="img"
      aria-label="Molecular Peptide Chain and GHK-Cu Bioregulator Diagram"
      className={`relative overflow-hidden rounded-lg bg-canvas-obsidian/90 border border-border-gold-subtle ${className}`}
    >
      <span className="sr-only">
        Molecular schematic illustrating peptide bioregulators Epitalon and GHK-Copper. Shows amino acid residues linked by peptide bonds, a copper chelation coordinate complex, and covalent disulfide cross-link bridges maintaining telomeric stability.
      </span>
      <svg
        viewBox="0 0 400 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="w-full h-full object-contain select-none"
      >
        <defs>
          <radialGradient id="peptideGlow" cx="60%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0B0F19" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="400" height="240" fill="url(#peptideGlow)" />

        {/* Grid lines */}
        <g stroke="#D4AF37" strokeOpacity="0.07" strokeWidth="0.5" strokeDasharray="3 3">
          <line x1="50" y1="0" x2="50" y2="240" />
          <line x1="150" y1="0" x2="150" y2="240" />
          <line x1="250" y1="0" x2="250" y2="240" />
          <line x1="350" y1="0" x2="350" y2="240" />
          <line x1="0" y1="80" x2="400" y2="80" />
          <line x1="0" y1="160" x2="400" y2="160" />
        </g>

        {/* Helical Backbone Wave Ribbon */}
        <path
          d="M 40 120 Q 80 50, 120 120 T 200 120 T 280 120 T 360 120"
          stroke="#4E6B5E"
          strokeWidth="2.5"
          strokeOpacity="0.6"
          fill="none"
        />
        <path
          d="M 40 120 Q 80 190, 120 120 T 200 120 T 280 120 T 360 120"
          stroke="#D4AF37"
          strokeWidth="1.5"
          strokeOpacity="0.8"
          strokeDasharray="5 3"
          fill="none"
        />

        {/* Disulfide Covalent Bridge (-S-S-) */}
        <g stroke="#F2CA50" strokeWidth="1.5">
          <line x1="120" y1="120" x2="120" y2="175" strokeDasharray="2 2" />
          <circle cx="120" cy="175" r="4" fill="#D4AF37" />
          <line x1="280" y1="120" x2="280" y2="175" strokeDasharray="2 2" />
          <circle cx="280" cy="175" r="4" fill="#D4AF37" />
          <path d="M 120 175 C 160 210, 240 210, 280 175" stroke="#F2CA50" strokeWidth="1.5" fill="none" />
          <text x="200" y="208" fill="#F2CA50" fontSize="8" fontFamily="monospace" textAnchor="middle">
            -S — S- COVALENT BRIDGE
          </text>
        </g>

        {/* Amino Acid Residue Nodes (Platinum & Gold) */}
        {/* Node 1: N-Terminus */}
        <g transform="translate(60, 85)">
          <circle cx="0" cy="0" r="14" fill="#121826" stroke="#DFE2F1" strokeWidth="1.5" />
          <text x="0" y="3" fill="#DFE2F1" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            Ala
          </text>
        </g>

        {/* Node 2: Glu */}
        <g transform="translate(120, 120)">
          <circle cx="0" cy="0" r="15" fill="#121826" stroke="#D4AF37" strokeWidth="2" />
          <text x="0" y="3.5" fill="#D4AF37" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            Glu
          </text>
        </g>

        {/* Node 3: Central GHK-Cu Core */}
        <g transform="translate(200, 100)">
          <circle cx="0" cy="0" r="20" fill="#121826" stroke="#F2CA50" strokeWidth="2" />
          <circle cx="0" cy="0" r="28" stroke="#4E6B5E" strokeWidth="1" strokeDasharray="3 3" />
          <text x="0" y="-3" fill="#F2CA50" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            Asp
          </text>
          <text x="0" y="7" fill="#4E6B5E" fontSize="7" fontFamily="monospace" textAnchor="middle">
            [Cu²⁺]
          </text>
        </g>

        {/* Node 4: Gly */}
        <g transform="translate(280, 120)">
          <circle cx="0" cy="0" r="15" fill="#121826" stroke="#D4AF37" strokeWidth="2" />
          <text x="0" y="3.5" fill="#D4AF37" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            Gly
          </text>
        </g>

        {/* Node 5: C-Terminus */}
        <g transform="translate(340, 85)">
          <circle cx="0" cy="0" r="14" fill="#121826" stroke="#DFE2F1" strokeWidth="1.5" />
          <text x="0" y="3" fill="#DFE2F1" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            Pro
          </text>
        </g>

        {/* Peptide Bond Arrows */}
        <path d="M 74 93 L 105 112" stroke="#DFE2F1" strokeWidth="1.5" />
        <path d="M 135 116 L 180 105" stroke="#D4AF37" strokeWidth="2" />
        <path d="M 220 105 L 265 116" stroke="#D4AF37" strokeWidth="2" />
        <path d="M 295 112 L 326 93" stroke="#DFE2F1" strokeWidth="1.5" />

        {/* Telemetry Labels */}
        <text x="25" y="32" fill="#D4AF37" fontSize="9" fontFamily="monospace" fontWeight="600">
          FIG 2.1 // PEPTIDE KINETICS
        </text>
        <text x="25" y="44" fill="#99907C" fontSize="7.5" fontFamily="monospace">
          EPITALON &bull; PINEAL CIRCADIAN VECTOR
        </text>
        <text x="375" y="215" fill="#DFE2F1" fontSize="8" fontFamily="monospace" textAnchor="end">
          TELOMERIC LENGTH RETENTION &gt; 94%
        </text>
      </svg>
    </div>
  );
}

/**
 * 3. BTL Emsella Pelvic Core:
 * Biomechanical pelvic-gluteal core stabilization vectors with focused
 * electromagnetic flux vector lines (HIFEM 2.5 Tesla) and autonomic vagal tone loop.
 */
export function EmsellaVisualization({ className = "" }: VisualizationProps) {
  return (
    <div
      role="img"
      aria-label="BTL Emsella 2.5 Tesla HIFEM Pelvic Core Stabilization Diagram"
      className={`relative overflow-hidden rounded-lg bg-canvas-obsidian/90 border border-border-gold-subtle ${className}`}
    >
      <span className="sr-only">
        Biomechanical diagram of BTL Emsella high-intensity focused electromagnetic field (2.5 Tesla). Demonstrates supramaximal pelvic floor muscle contraction vectors and visceral vagal nerve tone recalibration for autonomic nervous system stability.
      </span>
      <svg
        viewBox="0 0 400 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="w-full h-full object-contain select-none"
      >
        <defs>
          <radialGradient id="emsellaGlow" cx="50%" cy="80%" r="60%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0B0F19" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hifemUp" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#F2CA50" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#4E6B5E" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        <rect width="400" height="240" fill="url(#emsellaGlow)" />

        {/* Grid ticks */}
        <g stroke="#D4AF37" strokeOpacity="0.07" strokeWidth="0.5" strokeDasharray="3 3">
          <line x1="100" y1="0" x2="100" y2="240" />
          <line x1="200" y1="0" x2="200" y2="240" />
          <line x1="300" y1="0" x2="300" y2="240" />
          <line x1="0" y1="120" x2="400" y2="120" />
        </g>

        {/* Pelvic Basin Biomechanical Outline */}
        <path
          d="M 90 90 C 120 150, 160 175, 200 175 C 240 175, 280 150, 310 90"
          stroke="#DFE2F1"
          strokeWidth="2"
          fill="#121826"
          fillOpacity="0.7"
        />

        {/* Pelvic Floor Diaphragm (Deep Visceral Core) */}
        <path
          d="M 130 145 C 160 162, 240 162, 270 145"
          stroke="#F2CA50"
          strokeWidth="2.5"
          strokeDasharray="4 2"
        />

        {/* HIFEM Emitter Base Plate (2.5T Generator) */}
        <rect x="120" y="200" width="160" height="18" rx="4" fill="#121826" stroke="#D4AF37" strokeWidth="1.5" />
        <text x="200" y="212" fill="#D4AF37" fontSize="8" fontFamily="monospace" textAnchor="middle" letterSpacing="1.5">
          2.5 TESLA HIFEM EMITTER
        </text>

        {/* Supramaximal Electromagnetic Force Vectors (Upward Field Lines) */}
        <g stroke="url(#hifemUp)" strokeWidth="1.5">
          <path d="M 150 200 C 150 170, 160 140, 175 110" />
          <path d="M 175 200 C 175 160, 185 130, 190 95" strokeWidth="2" />
          <path d="M 200 200 L 200 80" strokeWidth="2.5" />
          <path d="M 225 200 C 225 160, 215 130, 210 95" strokeWidth="2" />
          <path d="M 250 200 C 250 170, 240 140, 225 110" />
        </g>

        {/* Vector Arrow Heads pointing upward */}
        <polygon points="200,75 196,85 204,85" fill="#D4AF37" />
        <polygon points="190,90 186,99 194,97" fill="#F2CA50" />
        <polygon points="210,90 206,97 214,99" fill="#F2CA50" />

        {/* Parasympathetic Vagal Resonance Ring */}
        <circle cx="200" cy="135" r="45" stroke="#4E6B5E" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <circle cx="200" cy="135" r="65" stroke="#4E6B5E" strokeWidth="0.75" strokeDasharray="4 4" opacity="0.4" />

        {/* Telemetry Labels */}
        <text x="25" y="32" fill="#D4AF37" fontSize="9" fontFamily="monospace" fontWeight="600">
          FIG 3.1 // HIFEM BIOMECHANICS
        </text>
        <text x="25" y="44" fill="#99907C" fontSize="7.5" fontFamily="monospace">
          11,200 SUPRAMAXIMAL CONTRACTIONS / 28 MIN
        </text>
        <text x="375" y="215" fill="#4E6B5E" fontSize="8" fontFamily="monospace" textAnchor="end">
          VAGAL TONE rMSSD &gt; 55ms
        </text>
      </svg>
    </div>
  );
}

/**
 * 4. Cerebral Photobiomodulation:
 * Near-infrared 810nm–1064nm dual-wavelength oscillation diagram,
 * photon quanta packets (hv), and Cytochrome c Oxidase Unit IV peak.
 */
export function PhotobiomodulationVisualization({ className = "" }: VisualizationProps) {
  return (
    <div
      role="img"
      aria-label="Cerebral Photobiomodulation 810nm and 1064nm Mitochondrial Optical Diagram"
      className={`relative overflow-hidden rounded-lg bg-canvas-obsidian/90 border border-border-gold-subtle ${className}`}
    >
      <span className="sr-only">
        Optical penetration model depicting dual near-infrared wavelengths (810nm and 1064nm) pulsed at 40 Hz gamma frequency across cortical tissue, directly activating cytochrome c oxidase in the mitochondrial electron transport chain.
      </span>
      <svg
        viewBox="0 0 400 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="w-full h-full object-contain select-none"
      >
        <defs>
          <radialGradient id="nirGlow" cx="40%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0B0F19" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="400" height="240" fill="url(#nirGlow)" />

        {/* Optical Grid */}
        <g stroke="#D4AF37" strokeOpacity="0.08" strokeWidth="0.5" strokeDasharray="4 2">
          <line x1="0" y1="60" x2="400" y2="60" />
          <line x1="0" y1="120" x2="400" y2="120" />
          <line x1="0" y1="180" x2="400" y2="180" />
          <line x1="100" y1="0" x2="100" y2="240" />
          <line x1="200" y1="0" x2="200" y2="240" />
          <line x1="300" y1="0" x2="300" y2="240" />
        </g>

        {/* 810 nm Primary NIR Waveform (Gold) */}
        <path
          d="M 30 120 C 55 40, 85 40, 110 120 C 135 200, 165 200, 190 120 C 215 40, 245 40, 270 120 C 295 200, 325 200, 350 120 L 375 120"
          stroke="#D4AF37"
          strokeWidth="2.5"
          fill="none"
        />

        {/* 1064 nm Deep-Penetration Waveform (Muted Sage & Platinum) */}
        <path
          d="M 30 120 C 70 70, 110 70, 150 120 C 190 170, 230 170, 270 120 C 310 70, 350 70, 390 120"
          stroke="#4E6B5E"
          strokeWidth="1.8"
          strokeDasharray="5 3"
          fill="none"
        />

        {/* 40 Hz Gamma Pulse Envelope Markers */}
        <g stroke="#F2CA50" strokeWidth="0.8" opacity="0.6">
          <line x1="110" y1="30" x2="110" y2="210" strokeDasharray="2 2" />
          <line x1="270" y1="30" x2="270" y2="210" strokeDasharray="2 2" />
          <text x="190" y="50" fill="#F2CA50" fontSize="8" fontFamily="monospace" textAnchor="middle">
            &tau; = 25ms (40 HZ GAMMA)
          </text>
        </g>

        {/* Cytochrome C Oxidase Target Reticle (Right) */}
        <g transform="translate(310, 120)">
          <circle cx="0" cy="0" r="22" stroke="#DFE2F1" strokeWidth="1.5" fill="#121826" />
          <circle cx="0" cy="0" r="14" stroke="#D4AF37" strokeWidth="1.2" strokeDasharray="3 2" />
          <circle cx="0" cy="0" r="4" fill="#F2CA50" />
          <text x="0" y="32" fill="#DFE2F1" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
            CCO UNIT IV
          </text>
        </g>

        {/* Photon Energy Vectors h*v */}
        <g fill="#D4AF37">
          <circle cx="85" cy="80" r="3" />
          <circle cx="135" cy="160" r="3" />
          <circle cx="245" cy="80" r="3" />
        </g>

        {/* Telemetry Labels */}
        <text x="25" y="32" fill="#D4AF37" fontSize="9" fontFamily="monospace" fontWeight="600">
          FIG 4.1 // PHOTOBIOMODULATION OPTICS
        </text>
        <text x="25" y="44" fill="#99907C" fontSize="7.5" fontFamily="monospace">
          DUAL &lambda;: 810 NM &bull; 1064 NM
        </text>
        <text x="375" y="215" fill="#4E6B5E" fontSize="8" fontFamily="monospace" textAnchor="end">
          &Delta;ATP PRODUCTION +38% &bull; ROS REGULATION
        </text>
      </svg>
    </div>
  );
}

/**
 * 5. GLP-1 Metabolic Optimization:
 * Receptor-ligand signaling cascade, 7-transmembrane GPCR receptor,
 * G-alpha-s subunit dissociation, adenylate cyclase, and cAMP burst.
 */
export function GLP1Visualization({ className = "" }: VisualizationProps) {
  return (
    <div
      role="img"
      aria-label="Endocrine Receptor Dual-Agonist Kinetic Signaling Diagram"
      className={`relative overflow-hidden rounded-lg bg-canvas-obsidian/90 border border-border-gold-subtle ${className}`}
    >
      <span className="sr-only">
        Metabolic signaling diagram illustrating GLP-1 and GIP receptor activation within the hypothalamus arcuate nucleus, downregulating systemic neuroinflammation and preserving lean body mass.
      </span>
      <svg
        viewBox="0 0 400 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="w-full h-full object-contain select-none"
      >
        <defs>
          <radialGradient id="glpGlow" cx="45%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0B0F19" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="400" height="240" fill="url(#glpGlow)" />

        {/* Membrane Lipid Bilayer */}
        <g stroke="#DFE2F1" strokeOpacity="0.25" strokeWidth="1">
          <line x1="20" y1="95" x2="380" y2="95" />
          <line x1="20" y1="145" x2="380" y2="145" />
          <text x="30" y="90" fill="#99907C" fontSize="7" fontFamily="monospace">
            EXTRACELLULAR SPACE
          </text>
          <text x="30" y="160" fill="#99907C" fontSize="7" fontFamily="monospace">
            CYTOSOLIC MATRIX
          </text>
        </g>

        {/* 7-Transmembrane GPCR (GLP-1R) Helices */}
        <g fill="#121826" stroke="#D4AF37" strokeWidth="1.5">
          <rect x="90" y="85" width="10" height="70" rx="4" />
          <rect x="105" y="85" width="10" height="70" rx="4" />
          <rect x="120" y="85" width="10" height="70" rx="4" />
          <rect x="135" y="85" width="10" height="70" rx="4" />
          <rect x="150" y="85" width="10" height="70" rx="4" />
          <rect x="165" y="85" width="10" height="70" rx="4" />
          <rect x="180" y="85" width="10" height="70" rx="4" />
        </g>

        {/* GLP-1 / GIP Dual Agonist Ligand Docking Pocket */}
        <g transform="translate(140, 68)">
          <path
            d="M -15 -10 C -5 -25, 15 -25, 25 -10 C 15 5, -5 5, -15 -10 Z"
            fill="#D4AF37"
            stroke="#F2CA50"
            strokeWidth="1.5"
          />
          <text x="5" y="-8" fill="#3C2F00" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            GLP-1
          </text>
        </g>

        {/* Heterotrimeric G-Protein (Gs-alpha) */}
        <g transform="translate(140, 175)">
          <ellipse cx="0" cy="0" rx="18" ry="12" fill="#121826" stroke="#F2CA50" strokeWidth="1.5" />
          <text x="0" y="3" fill="#F2CA50" fontSize="8" fontFamily="monospace" textAnchor="middle">
            G&alpha;s
          </text>
        </g>

        {/* Adenylate Cyclase Transducer */}
        <g transform="translate(250, 120)">
          <rect x="-15" y="-30" width="30" height="60" rx="6" fill="#121826" stroke="#4E6B5E" strokeWidth="2" />
          <text x="0" y="4" fill="#DFE2F1" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
            AC
          </text>
        </g>

        {/* G-protein activation path to AC */}
        <path d="M 158 175 C 190 175, 220 160, 235 140" stroke="#F2CA50" strokeWidth="1.5" strokeDasharray="3 2" />

        {/* cAMP Second Messenger Cascade */}
        <g stroke="#D4AF37" strokeWidth="1.2">
          <path d="M 265 140 C 290 165, 320 170, 345 170" />
          <polygon points="345,170 338,166 338,174" fill="#D4AF37" />
        </g>
        <text x="315" y="160" fill="#D4AF37" fontSize="8" fontFamily="monospace" fontWeight="bold">
          cAMP &uarr;
        </text>

        {/* Telemetry Labels */}
        <text x="25" y="32" fill="#D4AF37" fontSize="9" fontFamily="monospace" fontWeight="600">
          FIG 5.1 // METABOLIC ENDOCRINE AXIS
        </text>
        <text x="25" y="44" fill="#99907C" fontSize="7.5" fontFamily="monospace">
          GLP-1R &bull; GIPR ARCUATE NUCLEUS KINETICS
        </text>
        <text x="375" y="215" fill="#DFE2F1" fontSize="8" fontFamily="monospace" textAnchor="end">
          INSULIN SENSITIVITY HOMA-IR &lt; 1.0
        </text>
      </svg>
    </div>
  );
}

/**
 * 6. Mitochondrial Bioenergetics:
 * Inner mitochondrial cristae fold, Electron Transport Chain Complexes I–IV,
 * ubiquinone Q shuttle, and rotary ATP Synthase.
 */
export function MitochondriaVisualization({ className = "" }: VisualizationProps) {
  return (
    <div
      role="img"
      aria-label="Mitochondrial Resuscitation Electron Transport Chain Complex Diagram"
      className={`relative overflow-hidden rounded-lg bg-canvas-obsidian/90 border border-border-gold-subtle ${className}`}
    >
      <span className="sr-only">
        Cellular bioenergetics diagram showing the inner mitochondrial membrane, complexes I through IV of the electron transport chain, mass-action thiamine pyrophosphate cofactors, and ATP synthase rotary motor phosphorylation generating cellular energy.
      </span>
      <svg
        viewBox="0 0 400 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="w-full h-full object-contain select-none"
      >
        <defs>
          <radialGradient id="mitoGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0B0F19" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="400" height="240" fill="url(#mitoGlow)" />

        {/* Inner Mitochondrial Membrane (IMM) Fold */}
        <path
          d="M 20 140 L 90 140 C 110 140, 110 90, 130 90 L 270 90 C 290 90, 290 140, 310 140 L 380 140"
          stroke="#4E6B5E"
          strokeWidth="3"
          fill="none"
        />

        {/* Complex I */}
        <g transform="translate(60, 115)">
          <rect x="-14" y="-22" width="28" height="44" rx="4" fill="#121826" stroke="#D4AF37" strokeWidth="1.5" />
          <text x="0" y="3" fill="#D4AF37" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            I
          </text>
        </g>

        {/* Complex II */}
        <g transform="translate(115, 115)">
          <rect x="-11" y="-16" width="22" height="32" rx="3" fill="#121826" stroke="#DFE2F1" strokeWidth="1.2" />
          <text x="0" y="3" fill="#DFE2F1" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
            II
          </text>
        </g>

        {/* Coenzyme Q10 Shuttle */}
        <g transform="translate(155, 105)">
          <circle cx="0" cy="0" r="9" fill="#121826" stroke="#F2CA50" strokeWidth="1.5" />
          <text x="0" y="2.5" fill="#F2CA50" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            Q10
          </text>
        </g>

        {/* Complex III */}
        <g transform="translate(195, 115)">
          <rect x="-13" y="-20" width="26" height="40" rx="4" fill="#121826" stroke="#D4AF37" strokeWidth="1.5" />
          <text x="0" y="3" fill="#D4AF37" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            III
          </text>
        </g>

        {/* Cytochrome c */}
        <g transform="translate(240, 75)">
          <circle cx="0" cy="0" r="8" fill="#121826" stroke="#4E6B5E" strokeWidth="1.5" />
          <text x="0" y="2" fill="#4E6B5E" fontSize="6.5" fontFamily="monospace" textAnchor="middle">
            Cyt c
          </text>
        </g>

        {/* Complex IV */}
        <g transform="translate(275, 115)">
          <rect x="-14" y="-22" width="28" height="44" rx="4" fill="#121826" stroke="#D4AF37" strokeWidth="1.5" />
          <text x="0" y="3" fill="#D4AF37" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            IV
          </text>
        </g>

        {/* Rotary ATP Synthase (F0-F1 Complex) */}
        <g transform="translate(340, 115)">
          {/* F0 Channel */}
          <rect x="-8" y="-18" width="16" height="36" rx="2" fill="#121826" stroke="#DFE2F1" strokeWidth="1.5" />
          {/* F1 Headpiece */}
          <ellipse cx="0" cy="30" rx="16" ry="12" fill="#121826" stroke="#F2CA50" strokeWidth="2" />
          <text x="0" y="33" fill="#F2CA50" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            ATP SYN
          </text>
          {/* Rotation arc */}
          <path d="M -10 44 C -5 48, 5 48, 10 44" stroke="#F2CA50" strokeWidth="1" strokeDasharray="2 1" />
        </g>

        {/* H+ Proton Translocation Vectors (Intermembrane space) */}
        <g stroke="#F2CA50" strokeWidth="1.2">
          <path d="M 60 93 L 60 65 M 57 70 L 60 65 L 63 70" />
          <path d="M 195 95 L 195 65 M 192 70 L 195 65 L 198 70" />
          <path d="M 275 93 L 275 65 M 272 70 L 275 65 L 278 70" />
          {/* Return flow into ATP Synthase */}
          <path d="M 340 70 L 340 95 M 337 90 L 340 95 L 343 90" stroke="#DFE2F1" />
        </g>

        <text x="200" y="55" fill="#F2CA50" fontSize="8" fontFamily="monospace" textAnchor="middle">
          INTERMEMBRANE PROTON GRADIENT [H⁺] &Delta;&Psi;m = 180mV
        </text>

        {/* Telemetry Labels */}
        <text x="25" y="32" fill="#D4AF37" fontSize="9" fontFamily="monospace" fontWeight="600">
          FIG 6.1 // MITOCHONDRIAL RESUSCITATION
        </text>
        <text x="25" y="44" fill="#99907C" fontSize="7.5" fontFamily="monospace">
          ETC COMPLEXES I–IV &bull; UBIQUINOL POOL
        </text>
        <text x="375" y="215" fill="#4E6B5E" fontSize="8" fontFamily="monospace" textAnchor="end">
          INTRACELLULAR NAD+ &gt; 60 &mu;M
        </text>
      </svg>
    </div>
  );
}

/**
 * 7. BDNF Synaptic Preservation:
 * Long-Term Potentiation (LTP) synaptic density schema,
 * TrkB homodimerization, dendritic spine hypertrophy, and PSD-95 density grid.
 */
export function BDNFVisualization({ className = "" }: VisualizationProps) {
  return (
    <div
      role="img"
      aria-label="Brain-Derived Neurotrophic Factor Synaptogenesis Diagram"
      className={`relative overflow-hidden rounded-lg bg-canvas-obsidian/90 border border-border-gold-subtle ${className}`}
    >
      <span className="sr-only">
        Neurogenesis model showing TrkB receptor dimerization, intracellular tyrosine kinase autophosphorylation, and dendritic arborization stimulated by targeted neurovascular coupling.
      </span>
      <svg
        viewBox="0 0 400 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="w-full h-full object-contain select-none"
      >
        <defs>
          <radialGradient id="bdnfGlow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0B0F19" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="400" height="240" fill="url(#bdnfGlow)" />

        {/* Presynaptic Axon Bouton */}
        <path
          d="M 140 30 C 140 70, 160 90, 200 90 C 240 90, 260 70, 260 30"
          stroke="#DFE2F1"
          strokeWidth="1.8"
          fill="#121826"
          fillOpacity="0.8"
        />

        {/* Secretory Granules containing BDNF Dimers */}
        <circle cx="185" cy="65" r="5" fill="#121826" stroke="#D4AF37" strokeWidth="1.5" />
        <circle cx="215" cy="65" r="5" fill="#121826" stroke="#D4AF37" strokeWidth="1.5" />

        {/* BDNF Ligand Dimers Released in Cleft */}
        <g fill="#D4AF37" stroke="#F2CA50" strokeWidth="1">
          <ellipse cx="192" cy="108" rx="4" ry="6" />
          <ellipse cx="200" cy="108" rx="4" ry="6" />
          <ellipse cx="208" cy="108" rx="4" ry="6" />
        </g>

        {/* Postsynaptic TrkB Receptor Homodimer */}
        <g transform="translate(200, 132)">
          {/* TrkB Extracellular Domain */}
          <path d="M -14 0 C -14 -10, -6 -15, 0 -10 C 6 -15, 14 -10, 14 0" stroke="#F2CA50" strokeWidth="2" fill="none" />
          {/* Transmembrane domain */}
          <line x1="-8" y1="0" x2="-8" y2="18" stroke="#D4AF37" strokeWidth="2" />
          <line x1="8" y1="0" x2="8" y2="18" stroke="#D4AF37" strokeWidth="2" />
          {/* Kinase Domain with Phosphorylation (Tyr515 / Tyr816) */}
          <circle cx="-8" cy="22" r="5" fill="#121826" stroke="#F2CA50" strokeWidth="1.5" />
          <circle cx="8" cy="22" r="5" fill="#121826" stroke="#F2CA50" strokeWidth="1.5" />
          <text x="0" y="38" fill="#F2CA50" fontSize="7" fontFamily="monospace" textAnchor="middle">
            TrkB (p-Tyr)
          </text>
        </g>

        {/* Expanded Dendritic Spine Neck & Head (Hypertrophy Vector) */}
        <path
          d="M 100 220 C 130 190, 160 145, 200 145 C 240 145, 270 190, 300 220"
          stroke="#DFE2F1"
          strokeWidth="2.2"
          fill="#121826"
          fillOpacity="0.85"
        />

        {/* Postsynaptic Density Scaffolding (PSD-95 & AMPA/NMDA Grid) */}
        <g stroke="#4E6B5E" strokeWidth="1.5" strokeDasharray="3 2">
          <line x1="160" y1="155" x2="240" y2="155" />
          <line x1="155" y1="162" x2="245" y2="162" />
        </g>
        <text x="200" y="174" fill="#4E6B5E" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
          PSD-95 SCAFFOLDING MATRIX
        </text>

        {/* Spine Growth & Remodeling Vector Arrows */}
        <g stroke="#D4AF37" strokeWidth="1.2">
          <path d="M 160 185 L 140 195 M 140 195 L 148 193 M 140 195 L 143 187" />
          <path d="M 240 185 L 260 195 M 260 195 L 252 193 M 260 195 L 257 187" />
        </g>

        {/* Telemetry Labels */}
        <text x="25" y="32" fill="#D4AF37" fontSize="9" fontFamily="monospace" fontWeight="600">
          FIG 7.1 // BDNF SYNAPSE EXPANSION
        </text>
        <text x="25" y="44" fill="#99907C" fontSize="7.5" fontFamily="monospace">
          TrkB HOMODIMER &bull; LONG-TERM POTENTIATION (LTP)
        </text>
        <text x="375" y="215" fill="#4E6B5E" fontSize="8" fontFamily="monospace" textAnchor="end">
          SPINE DENSITY +42% &bull; CA-AKG CALIBRATED
        </text>
      </svg>
    </div>
  );
}

/**
 * Universal Modality Artwork Selector:
 * Automatically matches slug to the appropriate bespoke scientific diagram.
 */
export function ModalityArtwork({
  slug,
  className = "",
}: {
  slug: string;
  className?: string;
  variant?: "card" | "hero";
}) {
  switch (slug) {
    case "tms-neuromodulation":
      return <TMSVisualization className={className} />;
    case "subcutaneous-peptides":
      return <PeptidesVisualization className={className} />;
    case "btl-emsella-pelvic-core":
      return <EmsellaVisualization className={className} />;
    case "cerebral-photobiomodulation":
      return <PhotobiomodulationVisualization className={className} />;
    case "glp1-metabolic-optimization":
      return <GLP1Visualization className={className} />;
    case "mitochondrial-bioenergetics":
      return <MitochondriaVisualization className={className} />;
    case "bdnf-synaptic-preservation":
      return <BDNFVisualization className={className} />;
    default:
      return <TMSVisualization className={className} />;
  }
}

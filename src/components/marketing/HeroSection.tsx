"use client";

import React from "react";
import Link from "next/link";
import { HeroVideo } from "../media/HeroVideo";

export { HeroVideo };

export interface HeroSectionProps {
  onOpenBooking?: () => void;
}

export function HeroSection({ onOpenBooking }: HeroSectionProps) {
  void onOpenBooking;

  return (
    <section
      id="hero"
      className="relative w-full min-h-[921px] flex flex-col items-center justify-center border-b border-[#D4AF37]/15 overflow-hidden bg-canvas-obsidian py-16 lg:py-24"
    >
      {/* 
        Shader / Ambient Glow Background
        Matches Figma [4:2642] "Shader Background" (STITCH_SHADER_START:ANIMATION_30)
      */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle radial gold nebula centered behind hero text */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] opacity-20 blur-[130px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(212,175,55,0.6) 0%, rgba(78,107,94,0.3) 40%, rgba(11,15,25,0) 70%)",
          }}
        />
        {/* Fine background grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #d4af37 1px, transparent 1px), linear-gradient(to bottom, #d4af37 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* 
        Content Canvas: Matches Figma [4:2645] (max-w: 1280px, centered container, w: 927px content)
      */}
      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 lg:px-10 flex flex-col items-center text-center">
        {/* 
          1. Pill Badge: Advanced Neuro-Cellular & Metabolic Longevity
        */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface-midnight border border-[#D4AF37]/30 shadow-[0_2px_12px_rgba(0,0,0,0.4)] mb-6 transition-all hover:border-champagne-gold/60">
          <span className="w-2 h-2 rounded-full bg-champagne-gold shadow-[0_0_8px_rgba(212,175,55,0.8)] animate-pulse" />
          <span className="font-mono text-[10px] sm:text-[11px] font-medium tracking-[0.12em] text-champagne-gold uppercase">
            ● ADVANCED NEURO-CELLULAR &amp; METABOLIC LONGEVITY
          </span>
        </div>

        {/* 
          2. Headline (H1): Peak Cognitive Performance. Systemic Cellular Vitality.
        */}
        <h1 className="max-w-[927px] font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-[1.1] tracking-tight text-text-surface">
          Peak Cognitive Performance. Systemic Cellular Vitality.
        </h1>

        {/* 
          3. Supporting Body Copy
        */}
        <p className="mt-6 max-w-2xl mx-auto font-body text-base sm:text-lg leading-relaxed text-slate-300">
          Integrating clinical neuromodulation, cellular peptide therapy, and precision metabolic medicine. We engineer personalized protocols to sharpen cognitive performance, restore physical vitality, and protect your neurological future across every decade of life.
        </p>

        {/* 
          4. Twin Call-to-Action Buttons
        */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Link
            href="/services"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#D4AF37] text-slate-950 font-medium hover:bg-[#bfa032] font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Explore Clinical Protocols
          </Link>

          <Link
            href="/consultation"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full border border-slate-700 hover:border-slate-500 text-white font-mono text-xs uppercase tracking-wider transition-colors flex items-center justify-center"
          >
            Schedule a Free Consultation
          </Link>
        </div>

        {/* 
          Google Flow Clinical Briefing Video Container (CLS = 0.000)
          Quiet-luxury Obsidian/Champagne Gold presentation with zero-shift SVG shimmer
        */}
        <HeroVideo className="mt-14" />
      </div>
    </section>
  );
}

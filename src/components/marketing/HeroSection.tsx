"use client";

import React from "react";
import Link from "next/link";
import { HeroVideo } from "../media/HeroVideo";

export { HeroVideo };

interface HeroSectionProps {
  onOpenBooking: () => void;
}

export function HeroSection({ onOpenBooking }: HeroSectionProps) {

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
          1. Pill Badge
          Matches Figma [4:2647] "div.inline-flex" (w: 333px, h: 26px, rounded-full)
        */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface-midnight border border-[#D4AF37]/30 shadow-[0_2px_12px_rgba(0,0,0,0.4)] mb-6 transition-all hover:border-champagne-gold/60">
          <span className="w-2 h-2 rounded-full bg-champagne-gold shadow-[0_0_8px_rgba(212,175,55,0.8)] animate-pulse" />
          <span className="font-mono text-[10px] sm:text-[11px] font-medium tracking-[0.12em] text-champagne-gold uppercase">
            Bespoke Precision Neuro-Preservation
          </span>
        </div>

        {/* 
          2. Headline
          Matches Figma [4:2654] "Restoring Autonomic Vitality & Cognitive Edge"
          EB Garamond 64px, weight 400, line-height 110%, letter-spacing -2%
        */}
        <h1 className="max-w-[927px] font-display text-4xl sm:text-5xl lg:text-[64px] font-normal leading-[1.1] tracking-[-0.02em] text-text-surface">
          Restoring Autonomic Vitality &amp; Cognitive Edge
        </h1>

        {/* 
          3. Subtitle
          Matches Figma [4:2657] "Transcending conventional medicine..."
          Hanken Grotesk 18px, weight 300, line-height 162.5%
        */}
        <p className="mt-6 max-w-3xl font-body text-base sm:text-lg lg:text-[18px] font-light leading-[1.625] text-text-surface-variant">
          Transcending conventional medicine through stoichiometric analysis and targeted
          interventions. We architect personalized pathways to optimize neural performance
          and mitigate biological friction for high-performing individuals.
        </p>

        {/* 
          4. Action Cluster
          Matches Figma [4:2658] (itemSpacing: 24px, items-center)
        */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
          {/* Primary CTA Button: Matches Figma [12:7] CTA_Button_Primary (223x49px, rounded-full, #d4af37) */}
          <button
            type="button"
            onClick={onOpenBooking}
            className="w-full sm:w-[223px] h-[49px] rounded-full bg-champagne-gold hover:bg-champagne-gold-light text-text-on-gold font-mono text-[12px] font-bold tracking-[0.1em] uppercase transition-all flex items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.3)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] hover:scale-[1.02] active:scale-[0.98] btn-luxury-shimmer"
          >
            Initiate Assessment
          </button>

          {/* Secondary Link: Matches Figma [4:2661] a.font-label-caps (w: 209px, border-b 1px #d4af37 30%) */}
          <Link
            href="/services"
            className="inline-flex items-center justify-center h-[22px] border-b border-[#D4AF37]/30 pb-1 font-mono text-[12px] font-medium tracking-[0.1em] text-champagne-gold hover:text-champagne-gold-light transition-colors uppercase"
          >
            Explore Clinical Modalities &rarr;
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

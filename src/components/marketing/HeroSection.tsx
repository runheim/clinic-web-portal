"use client";

import React, { useState } from "react";
import Link from "next/link";

interface HeroSectionProps {
  onOpenBooking: () => void;
}

export function HeroSection({ onOpenBooking }: HeroSectionProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

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
          TASK 1: Google Flow Clinical Briefing Video Container
          Styling: Delicate radial gradient mask (from transparent to #0B0F19) and hairline gold border (border-[#D4AF37]/15)
        */}
        <div className="mt-14 w-full max-w-4xl relative group">
          <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/15 bg-surface-midnight shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
            {/* Top Telemetry Header Bar */}
            <div className="px-5 py-2.5 bg-canvas-obsidian/95 border-b border-[#D4AF37]/15 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-2 text-champagne-gold">
                <span className="w-1.5 h-1.5 rounded-full bg-vitality-sage animate-ping" />
                <span className="uppercase tracking-widest font-semibold">Google Flow // Clinical Briefing</span>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-text-surface-muted">
                <span>LATENCY: 12ms</span>
                <span>RES: 4K 60FPS</span>
                <span className="text-champagne-gold-light">TELEMETRY: ACTIVE</span>
              </div>
            </div>

            {/* Video Container with Delicate Radial Gradient Mask */}
            <div
              className="relative aspect-video w-full overflow-hidden bg-black"
              style={{
                maskImage: "radial-gradient(ellipse 95% 90% at 50% 50%, black 65%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(ellipse 95% 90% at 50% 50%, black 65%, transparent 100%)",
              }}
            >
              {/* HTML5 Video with Pre-Warming */}
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                data-testid="hero-video"
                onLoadedData={() => setIsVideoLoaded(true)}
                onPlay={() => setIsVideoLoaded(true)}
                onError={() => setVideoError(true)}
                className={`w-full h-full object-cover transition-opacity duration-700 ${
                  isVideoLoaded && !videoError ? "opacity-90" : "opacity-0"
                }`}
              >
                <source
                  src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4"
                  type="video/mp4"
                />
              </video>

              {/* 1. Adaptive SVG Gradient Shimmer Placeholder (Renders until metadata loads) */}
              {!isVideoLoaded && !videoError && (
                <div
                  data-testid="video-shimmer-placeholder"
                  className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0F19] p-6 text-center z-20"
                >
                  {/* Lightweight SVG Shimmer Canvas */}
                  <svg
                    className="w-full h-full absolute inset-0 opacity-40"
                    preserveAspectRatio="none"
                    viewBox="0 0 800 450"
                  >
                    <defs>
                      <linearGradient id="heroShimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0B0F19" stopOpacity="0.8" />
                        <stop offset="35%" stopColor="#121826" stopOpacity="0.9" />
                        <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.18">
                          <animate
                            attributeName="offset"
                            values="-0.5; 1.5"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </stop>
                        <stop offset="65%" stopColor="#121826" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#0B0F19" stopOpacity="0.8" />
                      </linearGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#heroShimmer)" />
                  </svg>

                  {/* Pulsing Central Reticle & Status */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-[#121826] border border-[#D4AF37]/35 flex items-center justify-center text-champagne-gold mb-3 shadow-[0_0_35px_rgba(212,175,55,0.2)]">
                      <svg className="w-7 h-7 animate-pulse text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-champagne-gold">
                      Pre-Warming Neural Briefing Stream...
                    </span>
                    <span className="font-mono text-[10px] text-text-surface-muted mt-1">
                      Adaptive SVG Shimmer Active &bull; Zero-ePHI Buffer
                    </span>
                  </div>
                </div>
              )}

              {/* 2. Graceful Fallback: Quiet-Luxury Obsidian/Champagne Gold Poster on Error */}
              {videoError && (
                <div
                  data-testid="video-fallback-poster"
                  className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#121826] via-[#0B0F19] to-black p-6 sm:p-10 text-center z-20"
                >
                  <div className="w-16 h-16 rounded-full bg-[#0B0F19] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mb-3 shadow-[0_0_25px_rgba(212,175,55,0.2)]">
                    <span className="font-serif text-2xl font-bold tracking-wider text-[#D4AF37]">
                      CE
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B0F19] border border-[#D4AF37]/25 mb-2 font-mono text-[10px] text-[#D4AF37] uppercase tracking-widest">
                    <span>Clinical Briefing Sanctuary Standby</span>
                  </div>
                  <h3 className="font-display text-lg sm:text-xl text-[#DFE2F1] max-w-md">
                    Google Flow Cortical Hemodynamics &amp; VITACOG Stoichiometry
                  </h3>
                  <p className="font-sans text-xs text-[#99907C] max-w-sm mt-1">
                    Adaptive static sanctuary engaged. Stream playback paused or offline; review complete briefings in the Clinical Theater.
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setVideoError(false);
                        setIsVideoLoaded(false);
                      }}
                      className="px-4 py-1.5 rounded-full bg-[#1A2234] border border-[#D4AF37]/30 text-champagne-gold font-mono text-[10px] uppercase tracking-wider hover:bg-[#222C42] transition-colors cursor-pointer"
                    >
                      Retry Stream
                    </button>
                    <Link
                      href="/briefings"
                      className="px-4 py-1.5 rounded-full bg-champagne-gold text-text-on-gold font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-champagne-gold-light transition-colors"
                    >
                      Video Archive &rarr;
                    </Link>
                  </div>
                </div>
              )}

              {/* Delicate Radial Gradient Mask Overlay: Fading from transparent in center to #0B0F19 at edges */}
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background:
                    "radial-gradient(ellipse 90% 85% at 50% 50%, transparent 55%, #0B0F19 100%)",
                }}
              />

              {/* Bottom Scrim */}
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-canvas-obsidian to-transparent pointer-events-none z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

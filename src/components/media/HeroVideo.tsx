"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

export interface HeroVideoProps {
  src?: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  title?: string;
  subtitle?: string;
  telemetryLatency?: string;
  telemetryRes?: string;
  showTelemetryBar?: boolean;
  aspectRatio?: string;
  onLoadedData?: () => void;
  onError?: () => void;
}

export function HeroVideo({
  src = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  poster,
  className = "",
  autoPlay = true,
  title = "Google Flow Cortical Hemodynamics & VITACOG Stoichiometry",
  subtitle = "Google Flow // Clinical Briefing",
  telemetryLatency = "12ms",
  telemetryRes = "4K 60FPS",
  showTelemetryBar = true,
  aspectRatio = "aspect-video",
  onLoadedData,
  onError,
}: HeroVideoProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (autoPlay) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err: unknown) => {
          // Gracefully fallback if browser policy blocks autoplay or playback fails
          console.warn("[HeroVideo] Autoplay prevented or blocked by browser policy:", err);
          setVideoError(true);
          onError?.();
        });
      }
    }
  }, [autoPlay, onError]);

  const handleLoadedData = () => {
    setIsVideoLoaded(true);
    onLoadedData?.();
  };

  const handlePlay = () => {
    setIsVideoLoaded(true);
  };

  const handleVideoError = () => {
    setVideoError(true);
    onError?.();
  };

  const handleRetry = () => {
    setVideoError(false);
    setIsVideoLoaded(false);
    if (videoRef.current) {
      videoRef.current.load();
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setVideoError(true);
        });
      }
    }
  };

  return (
    <div className={`w-full max-w-4xl relative group ${className}`}>
      <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/15 bg-surface-midnight shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
        {/* Top Telemetry Header Bar */}
        {showTelemetryBar && (
          <div className="px-5 py-2.5 bg-canvas-obsidian/95 border-b border-[#D4AF37]/15 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-2 text-champagne-gold">
              <span className="w-1.5 h-1.5 rounded-full bg-vitality-sage animate-ping" />
              <span className="uppercase tracking-widest font-semibold">{subtitle}</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-text-surface-muted">
              <span>LATENCY: {telemetryLatency}</span>
              <span>RES: {telemetryRes}</span>
              <span className="text-champagne-gold-light">TELEMETRY: ACTIVE</span>
            </div>
          </div>
        )}

        {/* Video Container with Zero-Layout-Shift (CLS = 0.000) & Delicate Radial Gradient Mask */}
        <div
          className={`relative ${aspectRatio} w-full overflow-hidden bg-black`}
          style={{
            maskImage: "radial-gradient(ellipse 95% 90% at 50% 50%, black 65%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 95% 90% at 50% 50%, black 65%, transparent 100%)",
          }}
        >
          {/* HTML5 Video with Pre-Warming & Mandatory Attributes */}
          <video
            ref={videoRef}
            autoPlay={autoPlay}
            loop
            muted
            playsInline
            preload="metadata"
            data-testid="hero-video"
            poster={poster}
            onLoadedData={handleLoadedData}
            onPlay={handlePlay}
            onError={handleVideoError}
            className={`w-full h-full object-cover transition-opacity duration-700 ${
              isVideoLoaded && !videoError ? "opacity-90" : "opacity-0"
            }`}
          >
            <source src={src} type="video/mp4" onError={handleVideoError} />
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

          {/* 2. Graceful Fallback: Quiet-Luxury Obsidian/Champagne Gold Poster on Error or Blocked */}
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
                {title}
              </h3>
              <p className="font-sans text-xs text-[#99907C] max-w-sm mt-1">
                Adaptive static sanctuary engaged. Stream playback paused or offline; review complete briefings in the Clinical Theater.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
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
  );
}

export default HeroVideo;

"use client";

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import {
  getBinauralEngine,
  getAtmosphereState,
  isAudioContextSupported,
  type AudioEngineState,
} from "@/lib/audio/binauralSynthesizer";

export interface AcousticAtmosphereToggleProps {
  /** Optional CSS classes for the container button */
  className?: string;
  /** Visual presentation mode: 'compact' (icon + mini visualizer), 'pill' (discrete status badge), 'full' (with volume controls) */
  variant?: "compact" | "pill" | "full";
  /** Callback fired whenever the audio engine changes state */
  onStateChange?: (state: AudioEngineState) => void;
  /** Whether to show a headphone recommendation tooltip */
  showHeadphoneNotice?: boolean;
}

const emptySubscribe = () => () => {};

export function AcousticAtmosphereToggle({
  className = "",
  variant = "pill",
  onStateChange,
  showHeadphoneNotice = true,
}: AcousticAtmosphereToggleProps) {
  // Subscribe to external audio engine state via useSyncExternalStore
  const subscribeState = useCallback((onStoreChange: () => void) => {
    const engine = getBinauralEngine();
    return engine.onStateChange(() => {
      onStoreChange();
    });
  }, []);

  const getStateSnapshot = useCallback((): AudioEngineState => {
    return getAtmosphereState();
  }, []);

  const getServerStateSnapshot = useCallback((): AudioEngineState => {
    return "unsupported";
  }, []);

  const audioState = useSyncExternalStore(
    subscribeState,
    getStateSnapshot,
    getServerStateSnapshot
  );

  const isSupported = useSyncExternalStore(
    emptySubscribe,
    () => isAudioContextSupported(),
    () => false
  );

  const getVolumeSnapshot = useCallback((): number => {
    return getBinauralEngine().getMasterVolume();
  }, []);

  const getServerVolumeSnapshot = useCallback((): number => {
    return 0.25;
  }, []);

  const volume = useSyncExternalStore(
    subscribeState,
    getVolumeSnapshot,
    getServerVolumeSnapshot
  );

  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const previousBarsRef = useRef<number[]>([2, 2, 2, 2, 2]);

  const isPlaying = audioState === "playing" || audioState === "fading_in";
  const isTransitioning = audioState === "fading_in" || audioState === "fading_out";

  // Notify consumer of state updates
  useEffect(() => {
    onStateChange?.(audioState);
  }, [audioState, onStateChange]);

  // Visualizer Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const engine = getBinauralEngine();
      const analyserData = engine.getAnalyserData();
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const numBars = 5;
      const barWidth = 3;
      const gap = 3;
      const totalWidth = numBars * barWidth + (numBars - 1) * gap;
      const startX = Math.floor((width - totalWidth) / 2);

      // Extract frequency power from specific bins (carrier, gamma, hum)
      const rawValues = isPlaying
        ? [
            analyserData[0] || 0,
            analyserData[1] || 0,
            analyserData[2] || 0,
            analyserData[3] || 0,
            analyserData[4] || 0,
          ]
        : [0, 0, 0, 0, 0];

      const currentBars = previousBarsRef.current;

      for (let i = 0; i < numBars; i++) {
        let targetHeight = 2; // resting floor (2px)

        if (isPlaying) {
          const normalized = rawValues[i] / 255;
          const time = performance.now() * 0.003;
          const wobble = Math.sin(time + i * 0.8) * 0.2 + 0.8;
          targetHeight = Math.max(3, Math.min(height - 1, normalized * (height - 2) * wobble + 3));
        } else if (isTransitioning) {
          const breath = (Math.sin(performance.now() * 0.005) + 1) * 0.5;
          targetHeight = 2 + breath * 4;
        }

        // Smooth damping (lerp)
        currentBars[i] += (targetHeight - currentBars[i]) * 0.25;
        const barH = currentBars[i];

        const x = startX + i * (barWidth + gap);
        const y = Math.floor((height - barH) / 2);

        // Champagne Gold gradient
        const gradient = ctx.createLinearGradient(x, y + barH, x, y);
        if (isPlaying) {
          gradient.addColorStop(0, "#d4af37"); // Champagne Gold base
          gradient.addColorStop(1, "#f2ca50"); // Light Gold crest
          ctx.shadowColor = "rgba(212, 175, 55, 0.45)";
          ctx.shadowBlur = 4;
        } else {
          gradient.addColorStop(0, "rgba(212, 175, 55, 0.35)");
          gradient.addColorStop(1, "rgba(242, 202, 80, 0.25)");
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = gradient;

        const radius = barWidth / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, Math.max(barH, 2), radius);
        ctx.fill();
      }

      if (isPlaying || isTransitioning) {
        animFrameIdRef.current = requestAnimationFrame(render);
      } else {
        animFrameIdRef.current = null;
      }
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [isPlaying, isTransitioning]);

  const handleToggle = useCallback(async () => {
    if (!isSupported) return;
    const engine = getBinauralEngine();
    await engine.toggle();
  }, [isSupported]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    getBinauralEngine().setMasterVolume(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      void handleToggle();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const nextVol = Math.min(1.0, volume + 0.05);
      getBinauralEngine().setMasterVolume(nextVol);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextVol = Math.max(0.0, volume - 0.05);
      getBinauralEngine().setMasterVolume(nextVol);
    }
  };

  if (!isSupported) {
    return null; // Gracefully hidden when Web Audio is unsupported
  }

  const statusLabel =
    audioState === "fading_in"
      ? "Entraining (3s Fade-In)"
      : audioState === "playing"
      ? "40Hz Gamma Active"
      : audioState === "fading_out"
      ? "Fading Out (1.5s)"
      : "40Hz Gamma Atmosphere";

  const accessibleStatusMessage =
    audioState === "fading_in"
      ? "40Hz Gamma clinical atmosphere is fading in over 3 seconds."
      : audioState === "playing"
      ? "40Hz Gamma clinical atmosphere is actively playing."
      : audioState === "fading_out"
      ? "40Hz Gamma clinical atmosphere is fading out over 1.5 seconds."
      : "40Hz Gamma clinical atmosphere is muted.";

  return (
    <div
      className={`relative inline-flex items-center gap-2 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Accessible Live Region */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {accessibleStatusMessage}
      </span>

      {/* Main Interactive Button */}
      <button
        type="button"
        role="button"
        aria-pressed={isPlaying}
        aria-label="Toggle 40Hz Gamma Clinical Atmosphere"
        aria-expanded={showVolumeSlider}
        onClick={() => {
          void handleToggle();
        }}
        onKeyDown={handleKeyDown}
        className={`group relative flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all duration-300 select-none cursor-pointer focus-visible:outline-1 focus-visible:outline-[#d4af37] focus-visible:outline-offset-2 ${
          isPlaying
            ? "bg-[#121826] border-[#d4af37]/60 shadow-[0_0_15px_rgba(212,175,55,0.22)] ring-1 ring-[#d4af37]/40"
            : isTransitioning
            ? "bg-[#121826]/90 border-[#d4af37]/40 shadow-[0_0_8px_rgba(212,175,55,0.12)]"
            : "bg-[#121826]/70 border-[#d4af37]/20 hover:border-[#d4af37]/45 hover:bg-[#1c1f2a]/80"
        }`}
      >
        {/* Glow backdrop on active */}
        <span
          className={`absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#d4af37]/20 to-[#f2ca50]/10 blur-sm pointer-events-none transition-opacity duration-500 ${
            isPlaying ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        />

        {/* Headphone Audio Icon */}
        <span
          className={`relative shrink-0 flex items-center justify-center w-4 h-4 transition-colors duration-300 ${
            isPlaying
              ? "text-[#f2ca50]"
              : isTransitioning
              ? "text-[#d4af37]"
              : "text-[#d0c5af]/60 group-hover:text-[#d4af37]/80"
          }`}
          aria-hidden="true"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
          </svg>
        </span>

        {/* Champagne Gold Frequency Visualizer Canvas */}
        <canvas
          ref={canvasRef}
          width={32}
          height={16}
          className="relative shrink-0 w-8 h-4 pointer-events-none"
          aria-hidden="true"
        />

        {/* Informative Label */}
        {variant !== "compact" && (
          <span className="relative flex flex-col items-start leading-none pr-0.5">
            <span
              className={`font-mono text-[11px] uppercase tracking-wider font-medium transition-colors duration-200 ${
                isPlaying
                  ? "text-[#f2ca50]"
                  : isTransitioning
                  ? "text-[#d4af37]"
                  : "text-[#d0c5af] group-hover:text-[#f2ca50]"
              }`}
            >
              {variant === "full" ? statusLabel : "40Hz Gamma"}
            </span>
            <span className="font-mono text-[8.5px] tracking-tight text-[#a89f8c]/80 uppercase mt-0.5">
              {isPlaying ? "200/240Hz Pure" : "Acoustic Focus"}
            </span>
          </span>
        )}

        {/* Status indicator dot */}
        <span
          className={`relative w-1.5 h-1.5 rounded-full transition-all duration-300 ${
            isPlaying
              ? "bg-[#d4af37] shadow-[0_0_6px_#f2ca50] animate-pulse"
              : isTransitioning
              ? "bg-[#d4af37]/60 animate-ping"
              : "bg-[#313540]"
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Volume Slider Trigger / Container for 'full' variant or active playback */}
      {(variant === "full" || isPlaying) && (
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="Adjust Atmosphere Volume"
            aria-expanded={showVolumeSlider}
            onClick={() => setShowVolumeSlider((prev) => !prev)}
            className="p-1 rounded text-[#a89f8c] hover:text-[#f2ca50] transition-colors focus-visible:outline-1 focus-visible:outline-[#d4af37]"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              {volume > 0.5 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
            </svg>
          </button>

          {/* Flyout Volume Range Slider */}
          {showVolumeSlider && (
            <div
              role="region"
              aria-label="Volume Control"
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 px-3 py-2 bg-[#121826] border border-[#d4af37]/30 rounded-lg shadow-[0_8px_20px_rgba(0,0,0,0.6)] flex items-center gap-2"
            >
              <span className="font-mono text-[9px] text-[#d0c5af]/80">Vol</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={volume}
                onChange={handleVolumeChange}
                aria-label="Atmosphere Master Volume"
                className="w-20 h-1 accent-[#d4af37] bg-[#313540] rounded-lg cursor-pointer"
              />
              <span className="font-mono text-[9px] text-[#f2ca50] w-6 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Clinical Guidance Tooltip on Hover */}
      {isHovered && showHeadphoneNotice && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-64 p-2.5 bg-[#0b0f19]/95 border border-[#d4af37]/25 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.7)] backdrop-blur-md text-left transition-opacity duration-200"
        >
          <div className="flex items-center gap-1.5 mb-1 text-[#f2ca50]">
            <svg
              className="w-3.5 h-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
              Clinical Gamma Entrainment
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#d0c5af]/90 mb-1.5">
            40Hz cortical synchronization via 200Hz Left / 240Hz Right carrier wave, layered with
            subtle low-pass pink hum for deep cognitive grounding.
          </p>
          <div className="flex items-center gap-1 text-[9.5px] font-mono text-[#d4af37]/90 bg-[#121826] px-2 py-0.5 rounded border border-[#d4af37]/20">
            <span>🎧</span>
            <span>Stereo headphones recommended</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AcousticAtmosphereToggle;

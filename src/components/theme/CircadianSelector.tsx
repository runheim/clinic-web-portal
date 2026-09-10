'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import {
  CircadianPalette,
  CIRCADIAN_PALETTES,
  CIRCADIAN_PALETTE_IDS,
  calculateSolarTimes,
  applyCircadianPalette,
  getStoredCircadianPalette,
  getStoredAutoSunset,
  setStoredAutoSunset,
  CIRCADIAN_EVENT_NAME,
  SolarTimesResult,
} from '@/lib/theme/circadianTokens';

export interface CircadianSelectorProps {
  className?: string;
  variant?: 'floating' | 'inline' | 'compact';
  onPaletteChange?: (palette: CircadianPalette) => void;
}

interface CircadianSnapshot {
  activePalette: CircadianPalette;
  autoSunset: boolean;
  solarData: SolarTimesResult;
}

let cachedSnapshot: CircadianSnapshot | null = null;
let cachedKey = '';

function getCircadianSnapshot(): CircadianSnapshot {
  if (typeof window === 'undefined') {
    return {
      activePalette: 'obsidian',
      autoSunset: true,
      solarData: calculateSolarTimes(new Date()),
    };
  }

  const storedPalette = getStoredCircadianPalette();
  const autoSunset = getStoredAutoSunset();
  const solarData = calculateSolarTimes(new Date());

  const key = `${storedPalette ?? ''}|${autoSunset}|${solarData.suggestedPalette}|${Math.floor(Date.now() / 60000)}`;
  if (cachedSnapshot && cachedKey === key) {
    return cachedSnapshot;
  }

  let activePalette: CircadianPalette;
  if (storedPalette) {
    activePalette = storedPalette;
  } else if (autoSunset) {
    activePalette = solarData.suggestedPalette;
  } else {
    activePalette = 'obsidian';
  }

  cachedKey = key;
  cachedSnapshot = {
    activePalette,
    autoSunset,
    solarData,
  };

  return cachedSnapshot;
}

const SERVER_SNAPSHOT: CircadianSnapshot = {
  activePalette: 'obsidian',
  autoSunset: true,
  solarData: calculateSolarTimes(new Date(Date.UTC(2026, 8, 10, 12, 0, 0))),
};

function getServerSnapshot(): CircadianSnapshot {
  return SERVER_SNAPSHOT;
}

function subscribeToCircadianStore(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const intervalId = setInterval(callback, 60000);
  window.addEventListener(CIRCADIAN_EVENT_NAME, callback);
  window.addEventListener('storage', callback);

  return () => {
    clearInterval(intervalId);
    window.removeEventListener(CIRCADIAN_EVENT_NAME, callback);
    window.removeEventListener('storage', callback);
  };
}

function subscribeToMounted(): () => void {
  return () => {};
}

export const CircadianSelector: React.FC<CircadianSelectorProps> = ({
  className = '',
  variant = 'floating',
  onPaletteChange,
}) => {
  const isMounted = useSyncExternalStore(
    subscribeToMounted,
    () => true,
    () => false
  );

  const snapshot = useSyncExternalStore(
    subscribeToCircadianStore,
    getCircadianSnapshot,
    getServerSnapshot
  );

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { activePalette, autoSunset, solarData } = snapshot;

  // Synchronize DOM with the current active palette
  useEffect(() => {
    applyCircadianPalette(activePalette, {
      persist: Boolean(getStoredCircadianPalette()),
      dispatchEvent: false,
    });
  }, [activePalette]);

  // Handle outside clicks and ESC key to close popover
  useEffect(() => {
    if (variant === 'inline' || !isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, variant]);

  const handleSelectPalette = (palette: CircadianPalette) => {
    applyCircadianPalette(palette, { persist: true, dispatchEvent: true });
    onPaletteChange?.(palette);
  };

  const handleToggleAutoSunset = () => {
    const nextValue = !autoSunset;
    setStoredAutoSunset(nextValue);

    if (nextValue) {
      const solar = calculateSolarTimes(new Date());
      applyCircadianPalette(solar.suggestedPalette, { persist: false, dispatchEvent: true });
      onPaletteChange?.(solar.suggestedPalette);
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(CIRCADIAN_EVENT_NAME, {
          detail: { palette: activePalette, timestamp: Date.now() },
        })
      );
    }
  };

  const formatTime = (date?: Date): string => {
    if (!date) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isMounted) {
    // Placeholder during SSR hydration to maintain pristine zero-shift layout
    return (
      <div
        className={`inline-flex items-center space-x-2 text-xs text-text-surface-muted ${className}`}
        aria-hidden="true"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]/30 animate-pulse" />
        <span className="font-mono uppercase tracking-wider text-[10px]">Circadian Sync</span>
      </div>
    );
  }

  const currentTokens = CIRCADIAN_PALETTES[activePalette];

  // Core selector panel
  const selectorPanel = (
    <div
      className="rounded-2xl border border-gold-hairline bg-[#121826]/95 backdrop-blur-xl shadow-2xl p-5 text-[#DFE2F1] w-full max-w-sm"
      role="region"
      aria-label="Circadian Adaptive Luminescence Settings"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: currentTokens.colors.accent,
              boxShadow: `0 0 10px ${currentTokens.colors.glow}`,
            }}
          />
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-[#D4AF37]">
              Circadian Protection
            </h3>
            <p className="text-[11px] text-text-surface-muted">
              Photobiological Blue-Light Shield
            </p>
          </div>
        </div>
        {variant !== 'inline' && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-text-surface-muted hover:text-white p-1 rounded-lg transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
            aria-label="Close circadian selector"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Automated Sunset Toggle */}
      <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
        <div className="pr-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-medium text-white">Auto Sunset Sync</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
              NOAA
            </span>
          </div>
          <p className="text-[10px] text-text-surface-muted mt-0.5 leading-snug">
            Switches to Amber Dim at sunset to preserve pineal melatonin secretion.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={autoSunset}
          onClick={handleToggleAutoSunset}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${
            autoSunset ? 'bg-[#D4AF37]' : 'bg-white/20'
          }`}
          aria-label="Toggle automated sunset mode"
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
              autoSunset ? 'translate-x-4 bg-[#0B0F19]' : 'translate-x-0 bg-white'
            }`}
          />
        </button>
      </div>

      {/* Solar Telemetry Readout */}
      {solarData && (
        <div className="mt-2.5 px-3 py-2 rounded-lg bg-black/20 border border-white/5 text-[10px] text-text-surface-muted flex items-center justify-between font-mono">
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                solarData.isPostSunset ? 'bg-[#FFB84D] animate-pulse' : 'bg-[#D4AF37]'
              }`}
            />
            <span>{solarData.isPostSunset ? 'Post-Sunset Active' : 'Daylight Baseline'}</span>
          </div>
          <div>Sunset: {formatTime(solarData.sunset)}</div>
        </div>
      )}

      {/* Palette Swatch Radiogroup */}
      <div className="mt-4 space-y-2" role="radiogroup" aria-label="Luminescence Mode">
        {CIRCADIAN_PALETTE_IDS.map((id) => {
          const config = CIRCADIAN_PALETTES[id];
          const isSelected = activePalette === id;

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelectPalette(id)}
              className={`w-full text-left p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${
                isSelected
                  ? 'border-[#D4AF37] bg-white/[0.07] shadow-sm'
                  : 'border-white/5 hover:border-white/20 bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Swatch visual circle */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center border transition-transform"
                  style={{
                    backgroundColor: config.colors.background,
                    borderColor: isSelected ? config.colors.accent : 'rgba(255,255,255,0.2)',
                    boxShadow: isSelected ? `0 0 12px ${config.colors.glow}` : 'none',
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.colors.accent }}
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs font-medium ${
                        isSelected ? 'text-white font-semibold' : 'text-[#DFE2F1]'
                      }`}
                    >
                      {config.name}
                    </span>
                    {id === 'amber' && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#E6A23C]/20 text-[#FFB84D] border border-[#E6A23C]/40">
                        0% Blue
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-surface-muted truncate max-w-[180px]">
                    {config.tagline}
                  </p>
                </div>
              </div>

              {/* Spectral Metric */}
              <div className="text-right font-mono text-[10px] text-text-surface-muted">
                <div>{config.spectralProfile.blueLightOutputPercent}% Blue</div>
                <div className="text-[9px] opacity-75">{config.spectralProfile.colorTemperatureK}K</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Compliance & Telemetry Footer */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[9px] text-text-surface-muted font-mono">
        <span>Zero-ePHI Ephemeral Session</span>
        <span className="text-[#D4AF37]">HIPAA Safe</span>
      </div>
    </div>
  );

  // Variant Rendering: Inline
  if (variant === 'inline') {
    return (
      <div className={`w-full ${className}`}>
        {selectorPanel}
      </div>
    );
  }

  // Variant Rendering: Compact bar
  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center space-x-1.5 p-1 rounded-full border border-gold-hairline bg-[#121826]/80 backdrop-blur-md ${className}`}
        role="group"
        aria-label="Circadian luminescence switcher"
      >
        {CIRCADIAN_PALETTE_IDS.map((id) => {
          const config = CIRCADIAN_PALETTES[id];
          const isSelected = activePalette === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelectPalette(id)}
              aria-label={`Switch to ${config.name}`}
              className={`relative w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                isSelected ? 'ring-2 ring-[#D4AF37] scale-105' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: config.colors.background }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: config.colors.accent }}
              />
            </button>
          );
        })}
      </div>
    );
  }

  // Variant Rendering: Floating trigger with popover (default)
  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Discreet Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Circadian Luminescence: ${currentTokens.name}. Click to change palette.`}
        className="group flex items-center space-x-2 px-3 py-1.5 rounded-full border border-gold-hairline bg-[#121826]/80 hover:bg-[#121826] backdrop-blur-md text-xs transition-all duration-200 shadow-lg hover:border-[#D4AF37]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
      >
        {/* Pulsing indicator ring reflecting active mode */}
        <span
          className="relative flex h-2.5 w-2.5 items-center justify-center"
          aria-hidden="true"
        >
          {activePalette === 'amber' && (
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: currentTokens.colors.accent }}
            />
          )}
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: currentTokens.colors.accent }}
          />
        </span>

        {/* Label and mode */}
        <span className="font-mono uppercase text-[10px] tracking-wider text-[#DFE2F1] group-hover:text-white transition-colors">
          {activePalette === 'amber' ? 'Amber 0% Blue' : currentTokens.name}
        </span>

        {/* Small chevron */}
        <svg
          className={`w-3 h-3 text-text-surface-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#D4AF37]' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating Popover Panel */}
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {selectorPanel}
        </div>
      )}
    </div>
  );
};

export default CircadianSelector;

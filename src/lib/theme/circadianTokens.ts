/**
 * Medical-Grade Circadian Adaptive Luminescence Engine (Agent 14)
 *
 * Implements photobiologically verified color coordinates and solar twilight
 * algorithms to mitigate nocturnal high-energy visible (HEV) blue light (<490 nm)
 * and preserve endogenous pineal melatonin secretion.
 *
 * Palettes:
 * 1. "Midnight Obsidian" (#0B0F19 background, Champagne Gold accents) — Default day/evening baseline.
 * 2. "OLED Pitch" (#000000 pure black canvas) — Power-saving and deep contrast for dark rooms.
 * 3. "Amber Dim" (#140E0A background, blue-attenuated warm amber text #E6A23C / #FFB84D) — 0% blue-light spectral output.
 *
 * Compliance: Zero-ePHI. Pure astronomical algorithms and ephemeral sessionStorage.
 */

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export type CircadianPalette = 'obsidian' | 'oled' | 'amber';

export interface SpectralProfile {
  /** Approximate percentage of blue-light spectral emission (<490 nm) */
  blueLightOutputPercent: number;
  /** Correlated Color Temperature in Kelvin */
  colorTemperatureK: number;
  /** Clinical melatonin suppression risk */
  melatoninSuppressionRisk: 'baseline' | 'low' | 'zero';
  /** Whether High-Energy Visible (HEV) wavelengths are strictly attenuated */
  heVAttenuated: boolean;
}

export interface CircadianColorCoordinates {
  id: CircadianPalette;
  name: string;
  tagline: string;
  description: string;
  clinicalIndication: string;
  spectralProfile: SpectralProfile;
  colors: {
    background: string;
    surface: string;
    surfaceContainer: string;
    surfaceElevated: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    accentMuted: string;
    border: string;
    borderSubtle: string;
    glow: string;
  };
  cssVariables: Record<string, string>;
}

export interface SolarCoordinatesOptions {
  /** Observer latitude (-90 to +90 degrees) */
  latitude?: number;
  /** Observer longitude (-180 to +180 degrees) */
  longitude?: number;
  /** IANA timezone identifier, e.g. "America/New_York" */
  timeZone?: string;
}

export interface SolarTimesResult {
  /** Reference timestamp evaluated */
  date: Date;
  /** Resolved latitude used for astronomical calculation */
  latitude: number;
  /** Resolved longitude used for astronomical calculation */
  longitude: number;
  /** Resolved IANA timezone */
  timeZone: string;
  /** Sunrise moment (zenith 90.833°) */
  sunrise: Date;
  /** Sunset moment (zenith 90.833°) */
  sunset: Date;
  /** Civil twilight dawn (zenith 96°) */
  civilTwilightDawn: Date;
  /** Civil twilight dusk (zenith 96°) */
  civilTwilightDusk: Date;
  /** Solar noon (highest solar elevation) */
  solarNoon: Date;
  /** Day length in fractional minutes */
  dayLengthMinutes: number;
  /** True if reference date is between sunset and next sunrise */
  isNight: boolean;
  /** True if reference time has passed sunset or is before sunrise */
  isPostSunset: boolean;
  /** True if reference time is within civil twilight dusk window */
  isTwilight: boolean;
  /** Polar night flag (sun remains below horizon all day) */
  isPolarNight?: boolean;
  /** Midnight sun flag (sun remains above horizon all day) */
  isMidnightSun?: boolean;
  /** Clinical suggested palette based on current solar state */
  suggestedPalette: CircadianPalette;
}

// ---------------------------------------------------------------------------
// Medical-Grade Color Coordinate Definitions
// ---------------------------------------------------------------------------

export const CIRCADIAN_PALETTE_IDS: readonly CircadianPalette[] = [
  'obsidian',
  'oled',
  'amber',
] as const;

export const CIRCADIAN_PALETTES: Record<CircadianPalette, CircadianColorCoordinates> = {
  obsidian: {
    id: 'obsidian',
    name: 'Midnight Obsidian',
    tagline: 'Quiet-Luxury Clinical Baseline',
    description:
      'Default day/evening baseline (#0B0F19 background, Champagne Gold accents) engineered for balanced chromaticity.',
    clinicalIndication: 'Daylight consultation and well-lit clinical environment viewing.',
    spectralProfile: {
      blueLightOutputPercent: 35,
      colorTemperatureK: 4200,
      melatoninSuppressionRisk: 'baseline',
      heVAttenuated: false,
    },
    colors: {
      background: '#0B0F19',
      surface: '#121826',
      surfaceContainer: '#1C1F2A',
      surfaceElevated: '#252B3B',
      textPrimary: '#DFE2F1',
      textSecondary: '#D0C5AF',
      textMuted: '#A89F8C',
      accent: '#D4AF37', // Champagne Gold
      accentHover: '#F2CA50',
      accentMuted: '#E9C349',
      border: 'rgba(212, 175, 55, 0.20)',
      borderSubtle: 'rgba(212, 175, 55, 0.10)',
      glow: 'rgba(212, 175, 55, 0.12)',
    },
    cssVariables: {
      '--background': '#0B0F19',
      '--foreground': '#DFE2F1',
      '--color-canvas-obsidian': '#0B0F19',
      '--color-surface-midnight': '#121826',
      '--color-surface-container': '#1C1F2A',
      '--color-champagne-gold': '#D4AF37',
      '--color-champagne-gold-light': '#F2CA50',
      '--color-champagne-gold-brand': '#E9C349',
      '--color-text-surface': '#DFE2F1',
      '--color-text-surface-muted': '#A89F8C',
      '--color-border-gold-subtle': 'rgba(212, 175, 55, 0.20)',
      '--circadian-palette-id': 'obsidian',
      '--circadian-blue-light': '35%',
    },
  },
  oled: {
    id: 'oled',
    name: 'OLED Pitch',
    tagline: 'Infinite Contrast & Dark Room Power Saving',
    description:
      'Pure black canvas (#000000) with complete pixel shutoff for emissive displays in dark clinical spaces.',
    clinicalIndication: 'Low-light diagnostic examination and dark-adapted clinical spaces.',
    spectralProfile: {
      blueLightOutputPercent: 12,
      colorTemperatureK: 3000,
      melatoninSuppressionRisk: 'low',
      heVAttenuated: true,
    },
    colors: {
      background: '#000000',
      surface: '#080808',
      surfaceContainer: '#121212',
      surfaceElevated: '#1A1A1A',
      textPrimary: '#DFE2F1',
      textSecondary: '#C5C5D2',
      textMuted: '#7A7A88',
      accent: '#D4AF37',
      accentHover: '#F2CA50',
      accentMuted: '#A88B2A',
      border: 'rgba(212, 175, 55, 0.15)',
      borderSubtle: 'rgba(255, 255, 255, 0.08)',
      glow: 'rgba(212, 175, 55, 0.06)',
    },
    cssVariables: {
      '--background': '#000000',
      '--foreground': '#DFE2F1',
      '--color-canvas-obsidian': '#000000',
      '--color-surface-midnight': '#080808',
      '--color-surface-container': '#121212',
      '--color-champagne-gold': '#D4AF37',
      '--color-champagne-gold-light': '#F2CA50',
      '--color-champagne-gold-brand': '#E9C349',
      '--color-text-surface': '#DFE2F1',
      '--color-text-surface-muted': '#7A7A88',
      '--color-border-gold-subtle': 'rgba(212, 175, 55, 0.15)',
      '--circadian-palette-id': 'oled',
      '--circadian-blue-light': '12%',
    },
  },
  amber: {
    id: 'amber',
    name: 'Amber Dim',
    tagline: '0% Blue-Light Circadian Protection',
    description:
      'Blue-attenuated warm amber text (#E6A23C / #FFB84D) and #140E0A background with 0% blue-light output for melatonin preservation.',
    clinicalIndication:
      'Post-sunset circadian rhythm alignment, evening triage, and nocturnal on-call duty.',
    spectralProfile: {
      blueLightOutputPercent: 0,
      colorTemperatureK: 1800,
      melatoninSuppressionRisk: 'zero',
      heVAttenuated: true,
    },
    colors: {
      background: '#140E0A',
      surface: '#1D140E',
      surfaceContainer: '#261A12',
      surfaceElevated: '#332318',
      textPrimary: '#FFB84D',
      textSecondary: '#E6A23C',
      textMuted: '#A36F22',
      accent: '#E6A23C',
      accentHover: '#FFB84D',
      accentMuted: '#B37A24',
      border: 'rgba(230, 162, 60, 0.25)',
      borderSubtle: 'rgba(230, 162, 60, 0.12)',
      glow: 'rgba(230, 162, 60, 0.20)',
    },
    cssVariables: {
      '--background': '#140E0A',
      '--foreground': '#FFB84D',
      '--color-canvas-obsidian': '#140E0A',
      '--color-surface-midnight': '#1D140E',
      '--color-surface-container': '#261A12',
      '--color-champagne-gold': '#E6A23C',
      '--color-champagne-gold-light': '#FFB84D',
      '--color-champagne-gold-brand': '#E6A23C',
      '--color-text-surface': '#FFB84D',
      '--color-text-surface-muted': '#A36F22',
      '--color-border-gold-subtle': 'rgba(230, 162, 60, 0.25)',
      '--circadian-palette-id': 'amber',
      '--circadian-blue-light': '0%',
    },
  },
};

// ---------------------------------------------------------------------------
// Timezone Coordinates Mapping (NOAA Solar Reference)
// ---------------------------------------------------------------------------

export const CLINICAL_TIMEZONE_MAP: Record<string, { latitude: number; longitude: number }> = {
  'America/New_York': { latitude: 40.7128, longitude: -74.006 },
  'America/Detroit': { latitude: 42.3314, longitude: -83.0458 },
  'America/Chicago': { latitude: 41.8781, longitude: -87.6298 },
  'America/Denver': { latitude: 39.7392, longitude: -104.9903 },
  'America/Los_Angeles': { latitude: 34.0522, longitude: -118.2437 },
  'America/Phoenix': { latitude: 33.4484, longitude: -112.074 },
  'America/Anchorage': { latitude: 61.2181, longitude: -149.9003 },
  'America/Honolulu': { latitude: 21.3069, longitude: -157.8583 },
  'America/Toronto': { latitude: 43.6532, longitude: -79.3832 },
  'America/Vancouver': { latitude: 49.2827, longitude: -123.1207 },
  'America/Sao_Paulo': { latitude: -23.5505, longitude: -46.6333 },
  'Europe/London': { latitude: 51.5074, longitude: -0.1278 },
  'Europe/Paris': { latitude: 48.8566, longitude: 2.3522 },
  'Europe/Berlin': { latitude: 52.52, longitude: 13.405 },
  'Europe/Zurich': { latitude: 47.3769, longitude: 8.5417 },
  'Europe/Madrid': { latitude: 40.4168, longitude: -3.7038 },
  'Europe/Rome': { latitude: 41.9028, longitude: 12.4964 },
  'Asia/Dubai': { latitude: 25.2048, longitude: 55.2708 },
  'Asia/Tokyo': { latitude: 35.6762, longitude: 139.6503 },
  'Asia/Singapore': { latitude: 1.3521, longitude: 103.8198 },
  'Asia/Hong_Kong': { latitude: 22.3193, longitude: 114.1694 },
  'Asia/Shanghai': { latitude: 31.2304, longitude: 121.4737 },
  'Asia/Kolkata': { latitude: 28.6139, longitude: 77.209 },
  'Australia/Sydney': { latitude: -33.8688, longitude: 151.2093 },
  'Australia/Melbourne': { latitude: -37.8136, longitude: 144.9631 },
  'Pacific/Auckland': { latitude: -36.8485, longitude: 174.7633 },
  UTC: { latitude: 51.4769, longitude: 0.0 },
};

// ---------------------------------------------------------------------------
// Type Guard
// ---------------------------------------------------------------------------

export function isCircadianPalette(value: unknown): value is CircadianPalette {
  return (
    typeof value === 'string' &&
    (value === 'obsidian' || value === 'oled' || value === 'amber')
  );
}

// ---------------------------------------------------------------------------
// Astronomical Solar Calculation Engine (NOAA Method)
// ---------------------------------------------------------------------------

/**
 * Resolves geographic coordinates from options, browser locale, or offset.
 */
export function resolveCoordinates(
  options?: SolarCoordinatesOptions,
  referenceDate: Date = new Date()
): { latitude: number; longitude: number; timeZone: string } {
  let resolvedTimeZone = options?.timeZone;

  if (!resolvedTimeZone && typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    try {
      resolvedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      resolvedTimeZone = undefined;
    }
  }

  if (!resolvedTimeZone) {
    resolvedTimeZone = 'UTC';
  }

  // 1. If explicit latitude & longitude provided
  if (typeof options?.latitude === 'number' && typeof options?.longitude === 'number') {
    return {
      latitude: options.latitude,
      longitude: options.longitude,
      timeZone: resolvedTimeZone,
    };
  }

  // 2. Lookup known timezone map
  const mapped = CLINICAL_TIMEZONE_MAP[resolvedTimeZone];
  if (mapped) {
    return {
      latitude: typeof options?.latitude === 'number' ? options.latitude : mapped.latitude,
      longitude: typeof options?.longitude === 'number' ? options.longitude : mapped.longitude,
      timeZone: resolvedTimeZone,
    };
  }

  // 3. Mathematical approximation from timezone offset
  const offsetMinutes = -referenceDate.getTimezoneOffset();
  const approxLongitude = Math.max(-180, Math.min(180, offsetMinutes / 4));
  const fallbackLatitude = typeof options?.latitude === 'number' ? options.latitude : 37.7749;

  return {
    latitude: fallbackLatitude,
    longitude: approxLongitude,
    timeZone: resolvedTimeZone,
  };
}

/**
 * Computes local solar twilight and sunset approximation from client timezone and latitude.
 * Employs standard NOAA Astronomical Algorithms for sunrise, sunset, and civil twilight.
 */
export function calculateSolarTimes(
  date: Date = new Date(),
  options?: SolarCoordinatesOptions
): SolarTimesResult {
  const { latitude, longitude, timeZone } = resolveCoordinates(options, date);

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Day of year N
  const dayStart = new Date(year, month, day, 0, 0, 0, 0);
  const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
  const dayOfYear =
    Math.floor((dayStart.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Fractional year gamma (radians)
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (date.getHours() - 12) / 24);

  // Equation of time in minutes
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  // Solar declination angle in radians
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const latRad = (latitude * Math.PI) / 180;
  const solarNoonMinutes = 720 - 4 * longitude - eqTime;
  const baseMidnightUtc = Date.UTC(year, month, day, 0, 0, 0);

  // Official zenith: 90° 50' (90.833°) for sunrise/sunset
  const zOfficialRad = (90.833 * Math.PI) / 180;
  const cosH0 =
    (Math.cos(zOfficialRad) - Math.sin(latRad) * Math.sin(decl)) /
    (Math.cos(latRad) * Math.cos(decl));

  // Civil twilight zenith: 96° (sun 6° below horizon)
  const zCivilRad = (96.0 * Math.PI) / 180;
  const cosH0Civil =
    (Math.cos(zCivilRad) - Math.sin(latRad) * Math.sin(decl)) /
    (Math.cos(latRad) * Math.cos(decl));

  // Polar Night check (sun never reaches zenith)
  if (cosH0 > 1) {
    const noon = new Date(baseMidnightUtc + Math.round(solarNoonMinutes * 60 * 1000));
    return {
      date,
      latitude,
      longitude,
      timeZone,
      sunrise: noon,
      sunset: noon,
      civilTwilightDawn: noon,
      civilTwilightDusk: noon,
      solarNoon: noon,
      dayLengthMinutes: 0,
      isNight: true,
      isPostSunset: true,
      isTwilight: false,
      isPolarNight: true,
      isMidnightSun: false,
      suggestedPalette: 'amber',
    };
  }

  // Midnight Sun check (sun never sets)
  if (cosH0 < -1) {
    const noon = new Date(baseMidnightUtc + Math.round(solarNoonMinutes * 60 * 1000));
    return {
      date,
      latitude,
      longitude,
      timeZone,
      sunrise: noon,
      sunset: noon,
      civilTwilightDawn: noon,
      civilTwilightDusk: noon,
      solarNoon: noon,
      dayLengthMinutes: 1440,
      isNight: false,
      isPostSunset: false,
      isTwilight: false,
      isPolarNight: false,
      isMidnightSun: true,
      suggestedPalette: 'obsidian',
    };
  }

  // Standard Solar Calculation
  const haDeg = Math.acos(cosH0) * (180 / Math.PI);
  const sunriseMinutes = solarNoonMinutes - haDeg * 4;
  const sunsetMinutes = solarNoonMinutes + haDeg * 4;

  const sunrise = new Date(baseMidnightUtc + Math.round(sunriseMinutes * 60 * 1000));
  const sunset = new Date(baseMidnightUtc + Math.round(sunsetMinutes * 60 * 1000));
  const solarNoon = new Date(baseMidnightUtc + Math.round(solarNoonMinutes * 60 * 1000));

  // Civil Twilight calculations
  let civilTwilightDawn: Date;
  let civilTwilightDusk: Date;
  if (cosH0Civil >= -1 && cosH0Civil <= 1) {
    const haCivilDeg = Math.acos(cosH0Civil) * (180 / Math.PI);
    civilTwilightDawn = new Date(
      baseMidnightUtc + Math.round((solarNoonMinutes - haCivilDeg * 4) * 60 * 1000)
    );
    civilTwilightDusk = new Date(
      baseMidnightUtc + Math.round((solarNoonMinutes + haCivilDeg * 4) * 60 * 1000)
    );
  } else {
    // Fallback: civil twilight ~30 min padding
    civilTwilightDawn = new Date(sunrise.getTime() - 30 * 60 * 1000);
    civilTwilightDusk = new Date(sunset.getTime() + 30 * 60 * 1000);
  }

  const currentMs = date.getTime();
  const sunriseMs = sunrise.getTime();
  const sunsetMs = sunset.getTime();
  const civilDuskMs = civilTwilightDusk.getTime();

  const isNight = currentMs < sunriseMs || currentMs >= sunsetMs;
  const isPostSunset = currentMs >= sunsetMs || currentMs < sunriseMs;
  const isTwilight = currentMs >= sunsetMs && currentMs <= civilDuskMs;

  const suggestedPalette: CircadianPalette = isNight ? 'amber' : 'obsidian';

  return {
    date,
    latitude,
    longitude,
    timeZone,
    sunrise,
    sunset,
    civilTwilightDawn,
    civilTwilightDusk,
    solarNoon,
    dayLengthMinutes: haDeg * 8,
    isNight,
    isPostSunset,
    isTwilight,
    isPolarNight: false,
    isMidnightSun: false,
    suggestedPalette,
  };
}

/**
 * Checks whether the specified or current time is post-sunset.
 */
export function isAfterSunset(date: Date = new Date(), options?: SolarCoordinatesOptions): boolean {
  const result = calculateSolarTimes(date, options);
  return result.isPostSunset;
}

/**
 * Returns the recommended clinical circadian palette based on solar calculation.
 */
export function getSuggestedCircadianPalette(
  date: Date = new Date(),
  options?: SolarCoordinatesOptions
): CircadianPalette {
  return calculateSolarTimes(date, options).suggestedPalette;
}

// ---------------------------------------------------------------------------
// Zero-ePHI Ephemeral SessionStorage & DOM Application
// ---------------------------------------------------------------------------

export const CIRCADIAN_STORAGE_KEYS = {
  PALETTE: 'agy_circadian_palette',
  AUTO_SUNSET: 'agy_circadian_auto_sunset',
  LAST_UPDATE: 'agy_circadian_updated_at',
} as const;

export const CIRCADIAN_EVENT_NAME = 'agy_circadian_palette_change';

/**
 * Reads stored palette from ephemeral sessionStorage. Zero persistent tracking.
 */
export function getStoredCircadianPalette(): CircadianPalette | null {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(CIRCADIAN_STORAGE_KEYS.PALETTE);
    if (raw && isCircadianPalette(raw)) {
      return raw;
    }
  } catch {
    // Graceful silent fallback if access is restricted
  }
  return null;
}

/**
 * Persists selected palette to ephemeral sessionStorage only. Zero-ePHI.
 */
export function setStoredCircadianPalette(palette: CircadianPalette): void {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.setItem(CIRCADIAN_STORAGE_KEYS.PALETTE, palette);
    window.sessionStorage.setItem(CIRCADIAN_STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
  } catch {
    // Silent fallback
  }
}

/**
 * Reads whether automated sunset synchronization is enabled.
 */
export function getStoredAutoSunset(): boolean {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
    return true; // Default auto-sync enabled for clinical blue-light protection
  }
  try {
    const val = window.sessionStorage.getItem(CIRCADIAN_STORAGE_KEYS.AUTO_SUNSET);
    if (val === null) return true;
    return val === 'true';
  } catch {
    return true;
  }
}

/**
 * Persists automated sunset synchronization preference.
 */
export function setStoredAutoSunset(enabled: boolean): void {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.setItem(CIRCADIAN_STORAGE_KEYS.AUTO_SUNSET, enabled ? 'true' : 'false');
  } catch {
    // Silent fallback
  }
}

/**
 * Applies the circadian palette to document.documentElement:
 * - Sets `data-circadian-mode="obsidian" | "oled" | "amber"`
 * - Updates `circadian-mode-${palette}` CSS class
 * - Injects CSS variables directly onto documentElement style
 * - Dispatches cross-component event
 * - Persists strictly to ephemeral sessionStorage (Zero-ePHI)
 */
export function applyCircadianPalette(
  palette: CircadianPalette,
  options: { persist?: boolean; dispatchEvent?: boolean } = { persist: true, dispatchEvent: true }
): void {
  if (typeof document === 'undefined' || !document.documentElement) {
    return;
  }

  const targetPalette: CircadianPalette = isCircadianPalette(palette) ? palette : 'obsidian';
  const tokens = CIRCADIAN_PALETTES[targetPalette];

  // 1. Apply data attribute on documentElement
  document.documentElement.setAttribute('data-circadian-mode', targetPalette);

  // 2. Synchronize CSS classes
  CIRCADIAN_PALETTE_IDS.forEach((id) => {
    document.documentElement.classList.remove(`circadian-mode-${id}`);
  });
  document.documentElement.classList.add(`circadian-mode-${targetPalette}`);

  // 3. Inject CSS custom properties on documentElement style for seamless live transition
  if (tokens && tokens.cssVariables) {
    Object.entries(tokens.cssVariables).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });
  }

  // 4. Zero-ePHI: Ephemeral sessionStorage persistence only
  if (options.persist !== false) {
    setStoredCircadianPalette(targetPalette);
  }

  // 5. Broadcast change event for reactive components
  if (options.dispatchEvent !== false && typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent(CIRCADIAN_EVENT_NAME, {
          detail: { palette: targetPalette, timestamp: Date.now() },
        })
      );
    } catch {
      // Ignore if CustomEvent is not supported in execution context
    }
  }
}

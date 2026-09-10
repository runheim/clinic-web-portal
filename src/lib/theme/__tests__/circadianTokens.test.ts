import {
  type CircadianPalette,
  CIRCADIAN_PALETTES,
  CIRCADIAN_PALETTE_IDS,
  isCircadianPalette,
  calculateSolarTimes,
  resolveCoordinates,
  isAfterSunset,
  getSuggestedCircadianPalette,
  applyCircadianPalette,
  getStoredCircadianPalette,
  setStoredCircadianPalette,
  getStoredAutoSunset,
  setStoredAutoSunset,
  CIRCADIAN_STORAGE_KEYS,
  CLINICAL_TIMEZONE_MAP,
} from '../circadianTokens';

describe('Circadian Adaptive Luminescence Engine (Agent 14)', () => {
  // -------------------------------------------------------------------------
  // 1. Medical-Grade Color Coordinates & Token Hex Values
  // -------------------------------------------------------------------------
  describe('Medical-Grade Color Coordinates & Token Hex Values', () => {
    test('defines exactly the 3 required clinical palettes', () => {
      const allPalettes: CircadianPalette[] = ['obsidian', 'oled', 'amber'];
      expect(CIRCADIAN_PALETTE_IDS).toHaveLength(3);
      allPalettes.forEach((p) => {
        expect(CIRCADIAN_PALETTE_IDS).toContain(p);
      });
    });

    test('Midnight Obsidian: matches #0B0F19 background and Champagne Gold accents', () => {
      const obsidian = CIRCADIAN_PALETTES.obsidian;
      expect(obsidian).toBeDefined();
      expect(obsidian.id).toBe('obsidian');
      expect(obsidian.name).toBe('Midnight Obsidian');
      expect(obsidian.colors.background.toUpperCase()).toBe('#0B0F19');
      expect(obsidian.colors.accent.toUpperCase()).toBe('#D4AF37'); // Champagne Gold
      expect(obsidian.spectralProfile.blueLightOutputPercent).toBeGreaterThan(0);
      expect(obsidian.spectralProfile.melatoninSuppressionRisk).toBe('baseline');
      expect(obsidian.cssVariables['--background'].toUpperCase()).toBe('#0B0F19');
      expect(obsidian.cssVariables['--color-champagne-gold'].toUpperCase()).toBe('#D4AF37');
    });

    test('OLED Pitch: matches #000000 pure black canvas for dark-room contrast', () => {
      const oled = CIRCADIAN_PALETTES.oled;
      expect(oled).toBeDefined();
      expect(oled.id).toBe('oled');
      expect(oled.name).toBe('OLED Pitch');
      expect(oled.colors.background).toBe('#000000');
      expect(oled.cssVariables['--background']).toBe('#000000');
      expect(oled.cssVariables['--color-canvas-obsidian']).toBe('#000000');
      expect(oled.spectralProfile.melatoninSuppressionRisk).toBe('low');
      expect(oled.spectralProfile.heVAttenuated).toBe(true);
    });

    test('Amber Dim: matches #140E0A background, #E6A23C / #FFB84D warm text, and 0% blue light', () => {
      const amber = CIRCADIAN_PALETTES.amber;
      expect(amber).toBeDefined();
      expect(amber.id).toBe('amber');
      expect(amber.name).toBe('Amber Dim');
      expect(amber.colors.background.toUpperCase()).toBe('#140E0A');

      // Blue-attenuated warm amber text: #E6A23C / #FFB84D
      const textPrimary = amber.colors.textPrimary.toUpperCase();
      const textSecondary = amber.colors.textSecondary.toUpperCase();
      expect(['#FFB84D', '#E6A23C']).toContain(textPrimary);
      expect(['#FFB84D', '#E6A23C']).toContain(textSecondary);

      // 0% blue-light spectral output for post-sunset circadian melatonin protection
      expect(amber.spectralProfile.blueLightOutputPercent).toBe(0);
      expect(amber.spectralProfile.melatoninSuppressionRisk).toBe('zero');
      expect(amber.spectralProfile.colorTemperatureK).toBe(1800);
      expect(amber.spectralProfile.heVAttenuated).toBe(true);

      expect(amber.cssVariables['--background'].toUpperCase()).toBe('#140E0A');
      expect(amber.cssVariables['--foreground'].toUpperCase()).toBe('#FFB84D');
      expect(amber.cssVariables['--circadian-blue-light']).toBe('0%');
    });

    test('validates hex color and rgba formats across all palettes', () => {
      const hexOrRgbaRegex = /^(#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})|rgba?\([\d\s,.]+\))$/;

      CIRCADIAN_PALETTE_IDS.forEach((id) => {
        const palette = CIRCADIAN_PALETTES[id];
        Object.entries(palette.colors).forEach(([, colorValue]) => {
          expect(colorValue).toMatch(hexOrRgbaRegex);
        });
      });
    });

    test('isCircadianPalette type guard identifies valid and invalid palettes', () => {
      expect(isCircadianPalette('obsidian')).toBe(true);
      expect(isCircadianPalette('oled')).toBe(true);
      expect(isCircadianPalette('amber')).toBe(true);

      expect(isCircadianPalette('solar')).toBe(false);
      expect(isCircadianPalette('')).toBe(false);
      expect(isCircadianPalette(null)).toBe(false);
      expect(isCircadianPalette(undefined)).toBe(false);
      expect(isCircadianPalette(123)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Solar Twilight & Sunset Calculation Logic
  // -------------------------------------------------------------------------
  describe('Solar Twilight and Sunset Approximation Engine', () => {
    const nycCoords = { latitude: 40.7128, longitude: -74.006, timeZone: 'America/New_York' };

    test('calculates valid astronomical solar times for New York', () => {
      // Test reference date: September 10, 2026, 12:00 UTC
      const date = new Date(Date.UTC(2026, 8, 10, 16, 0, 0));
      const times = calculateSolarTimes(date, nycCoords);

      expect(times.date).toBe(date);
      expect(times.latitude).toBeCloseTo(40.7128, 2);
      expect(times.longitude).toBeCloseTo(-74.006, 2);
      expect(times.timeZone).toBe('America/New_York');

      expect(times.sunrise).toBeInstanceOf(Date);
      expect(times.sunset).toBeInstanceOf(Date);
      expect(times.civilTwilightDawn).toBeInstanceOf(Date);
      expect(times.civilTwilightDusk).toBeInstanceOf(Date);
      expect(times.solarNoon).toBeInstanceOf(Date);

      // Verify astronomical chronological sequence:
      // civil dawn < sunrise < solar noon < sunset < civil dusk
      expect(times.civilTwilightDawn.getTime()).toBeLessThan(times.sunrise.getTime());
      expect(times.sunrise.getTime()).toBeLessThan(times.solarNoon.getTime());
      expect(times.solarNoon.getTime()).toBeLessThan(times.sunset.getTime());
      expect(times.sunset.getTime()).toBeLessThan(times.civilTwilightDusk.getTime());

      // Civil twilight duration in temperate zones is typically ~25 to 35 minutes
      const twilightDurationMin =
        (times.civilTwilightDusk.getTime() - times.sunset.getTime()) / (60 * 1000);
      expect(twilightDurationMin).toBeGreaterThan(20);
      expect(twilightDurationMin).toBeLessThan(45);
    });

    test('evaluates daytime solar state (suggests obsidian baseline)', () => {
      // In New York (EDT, UTC-4), 18:00 UTC is 14:00 (2 PM) EDT — broad daylight
      const middayDate = new Date(Date.UTC(2026, 8, 10, 18, 0, 0));
      const solar = calculateSolarTimes(middayDate, nycCoords);

      expect(solar.isNight).toBe(false);
      expect(solar.isPostSunset).toBe(false);
      expect(solar.isTwilight).toBe(false);
      expect(solar.suggestedPalette).toBe('obsidian');

      expect(isAfterSunset(middayDate, nycCoords)).toBe(false);
      expect(getSuggestedCircadianPalette(middayDate, nycCoords)).toBe('obsidian');
    });

    test('evaluates post-sunset nocturnal state (suggests amber 0% blue)', () => {
      // In New York (EDT, UTC-4), sunset is ~23:25 UTC (19:25 EDT).
      // 03:00 UTC next day is 23:00 EDT (11 PM) — deep post-sunset night
      const deepNightDate = new Date(Date.UTC(2026, 8, 11, 3, 0, 0));
      const solar = calculateSolarTimes(deepNightDate, nycCoords);

      expect(solar.isNight).toBe(true);
      expect(solar.isPostSunset).toBe(true);
      expect(solar.suggestedPalette).toBe('amber');

      expect(isAfterSunset(deepNightDate, nycCoords)).toBe(true);
      expect(getSuggestedCircadianPalette(deepNightDate, nycCoords)).toBe('amber');
    });

    test('evaluates civil twilight dusk window', () => {
      const baseDate = new Date(Date.UTC(2026, 8, 10, 12, 0, 0));
      const times = calculateSolarTimes(baseDate, nycCoords);

      // Exactly 5 minutes after sunset is within civil twilight
      const twilightDate = new Date(times.sunset.getTime() + 5 * 60 * 1000);
      const twilightResult = calculateSolarTimes(twilightDate, nycCoords);

      expect(twilightResult.isTwilight).toBe(true);
      expect(twilightResult.isPostSunset).toBe(true);
      expect(twilightResult.suggestedPalette).toBe('amber');
    });

    test('resolves coordinates from known timezone identifiers', () => {
      const ny = resolveCoordinates({ timeZone: 'America/New_York' });
      expect(ny.latitude).toBeCloseTo(40.7128, 2);
      expect(ny.longitude).toBeCloseTo(-74.006, 2);

      const london = resolveCoordinates({ timeZone: 'Europe/London' });
      expect(london.latitude).toBeCloseTo(51.5074, 2);
      expect(london.longitude).toBeCloseTo(-0.1278, 2);

      const tokyo = resolveCoordinates({ timeZone: 'Asia/Tokyo' });
      expect(tokyo.latitude).toBeCloseTo(35.6762, 2);
      expect(tokyo.longitude).toBeCloseTo(139.6503, 2);

      // Verify all clinical timezone mapping entries are non-null
      Object.keys(CLINICAL_TIMEZONE_MAP).forEach((tz) => {
        const coords = resolveCoordinates({ timeZone: tz });
        expect(typeof coords.latitude).toBe('number');
        expect(typeof coords.longitude).toBe('number');
        expect(Number.isNaN(coords.latitude)).toBe(false);
        expect(Number.isNaN(coords.longitude)).toBe(false);
      });
    });

    test('handles polar night and midnight sun boundary conditions gracefully', () => {
      // High Arctic in winter (Polar Night): 80°N on December 21
      const polarNightDate = new Date(Date.UTC(2026, 11, 21, 12, 0, 0));
      const polarNight = calculateSolarTimes(polarNightDate, { latitude: 80, longitude: 0 });

      expect(polarNight.isPolarNight).toBe(true);
      expect(polarNight.isNight).toBe(true);
      expect(polarNight.suggestedPalette).toBe('amber');
      expect(Number.isNaN(polarNight.dayLengthMinutes)).toBe(false);

      // High Arctic in summer (Midnight Sun): 80°N on June 21
      const midnightSunDate = new Date(Date.UTC(2026, 5, 21, 12, 0, 0));
      const midnightSun = calculateSolarTimes(midnightSunDate, { latitude: 80, longitude: 0 });

      expect(midnightSun.isMidnightSun).toBe(true);
      expect(midnightSun.isNight).toBe(false);
      expect(midnightSun.suggestedPalette).toBe('obsidian');
      expect(midnightSun.dayLengthMinutes).toBe(1440);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Palette Transitions & DOM Application
  // -------------------------------------------------------------------------
  describe('Palette Transitions & Document Manipulation', () => {
    let mockElement: {
      attributes: Record<string, string>;
      classes: Set<string>;
      styles: Record<string, string>;
      setAttribute: jest.Mock;
      getAttribute: jest.Mock;
      classList: {
        add: jest.Mock;
        remove: jest.Mock;
        contains: jest.Mock;
      };
      style: {
        setProperty: jest.Mock;
        getPropertyValue: jest.Mock;
      };
    };

    let mockSessionStorage: Record<string, string>;
    let mockLocalStorage: Record<string, string>;

    beforeEach(() => {
      mockSessionStorage = {};
      mockLocalStorage = {};

      mockElement = {
        attributes: {},
        classes: new Set<string>(),
        styles: {},
        setAttribute: jest.fn((key: string, val: string) => {
          mockElement.attributes[key] = val;
        }),
        getAttribute: jest.fn((key: string) => mockElement.attributes[key] ?? null),
        classList: {
          add: jest.fn((cls: string) => {
            mockElement.classes.add(cls);
          }),
          remove: jest.fn((cls: string) => {
            mockElement.classes.delete(cls);
          }),
          contains: jest.fn((cls: string) => mockElement.classes.has(cls)),
        },
        style: {
          setProperty: jest.fn((prop: string, val: string) => {
            mockElement.styles[prop] = val;
          }),
          getPropertyValue: jest.fn((prop: string) => mockElement.styles[prop] ?? ''),
        },
      };

      // Mock global document and window for Node environment
      (global as unknown as { document: { documentElement: typeof mockElement } }).document = {
        documentElement: mockElement,
      };

      (global as unknown as { window: unknown }).window = {
        sessionStorage: {
          getItem: jest.fn((key: string) => mockSessionStorage[key] ?? null),
          setItem: jest.fn((key: string, val: string) => {
            mockSessionStorage[key] = val;
          }),
          removeItem: jest.fn((key: string) => {
            delete mockSessionStorage[key];
          }),
          clear: jest.fn(() => {
            mockSessionStorage = {};
          }),
        },
        localStorage: {
          getItem: jest.fn((key: string) => mockLocalStorage[key] ?? null),
          setItem: jest.fn((key: string, val: string) => {
            mockLocalStorage[key] = val;
          }),
          removeItem: jest.fn((key: string) => {
            delete mockLocalStorage[key];
          }),
          clear: jest.fn(() => {
            mockLocalStorage = {};
          }),
        },
        dispatchEvent: jest.fn(),
      };
    });

    afterEach(() => {
      // Clean up globals
      delete (global as unknown as { document?: unknown }).document;
      delete (global as unknown as { window?: unknown }).window;
    });

    test('transitions to Amber Dim: applies data attribute, classes, and CSS custom properties', () => {
      applyCircadianPalette('amber');

      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-circadian-mode', 'amber');
      expect(mockElement.attributes['data-circadian-mode']).toBe('amber');
      expect(mockElement.classes.has('circadian-mode-amber')).toBe(true);
      expect(mockElement.classes.has('circadian-mode-obsidian')).toBe(false);

      // Verify CSS custom properties applied directly for instant theme update
      expect(mockElement.styles['--background']).toBe('#140E0A');
      expect(mockElement.styles['--foreground']).toBe('#FFB84D');
      expect(mockElement.styles['--color-champagne-gold']).toBe('#E6A23C');
      expect(mockElement.styles['--circadian-blue-light']).toBe('0%');
    });

    test('transitions between all three palettes smoothly in sequence', () => {
      // 1. Initial obsidian
      applyCircadianPalette('obsidian');
      expect(mockElement.attributes['data-circadian-mode']).toBe('obsidian');
      expect(mockElement.classes.has('circadian-mode-obsidian')).toBe(true);
      expect(mockElement.styles['--background']).toBe('#0B0F19');

      // 2. Switch to OLED Pitch
      applyCircadianPalette('oled');
      expect(mockElement.attributes['data-circadian-mode']).toBe('oled');
      expect(mockElement.classes.has('circadian-mode-oled')).toBe(true);
      expect(mockElement.classes.has('circadian-mode-obsidian')).toBe(false);
      expect(mockElement.styles['--background']).toBe('#000000');

      // 3. Switch to Amber Dim
      applyCircadianPalette('amber');
      expect(mockElement.attributes['data-circadian-mode']).toBe('amber');
      expect(mockElement.classes.has('circadian-mode-amber')).toBe(true);
      expect(mockElement.classes.has('circadian-mode-oled')).toBe(false);
      expect(mockElement.styles['--background']).toBe('#140E0A');

      // 4. Return to Obsidian
      applyCircadianPalette('obsidian');
      expect(mockElement.attributes['data-circadian-mode']).toBe('obsidian');
      expect(mockElement.classes.has('circadian-mode-amber')).toBe(false);
      expect(mockElement.styles['--background']).toBe('#0B0F19');
    });

    test('falls back gracefully to obsidian if invalid palette is passed', () => {
      // @ts-expect-error testing runtime invalid input
      applyCircadianPalette('invalid-palette');

      expect(mockElement.attributes['data-circadian-mode']).toBe('obsidian');
      expect(mockElement.classes.has('circadian-mode-obsidian')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Ephemeral Storage & Zero-ePHI Compliance
  // -------------------------------------------------------------------------
  describe('Zero-ePHI Ephemeral Session Storage', () => {
    let mockSessionStorage: Record<string, string>;
    let mockLocalStorage: Record<string, string>;

    beforeEach(() => {
      mockSessionStorage = {};
      mockLocalStorage = {};

      (global as unknown as { window: unknown }).window = {
        sessionStorage: {
          getItem: jest.fn((key: string) => mockSessionStorage[key] ?? null),
          setItem: jest.fn((key: string, val: string) => {
            mockSessionStorage[key] = val;
          }),
          removeItem: jest.fn((key: string) => {
            delete mockSessionStorage[key];
          }),
          clear: jest.fn(() => {
            mockSessionStorage = {};
          }),
        },
        localStorage: {
          getItem: jest.fn((key: string) => mockLocalStorage[key] ?? null),
          setItem: jest.fn((key: string, val: string) => {
            mockLocalStorage[key] = val;
          }),
        },
      };
    });

    afterEach(() => {
      delete (global as unknown as { window?: unknown }).window;
    });

    test('persists selected palette exclusively to ephemeral sessionStorage', () => {
      setStoredCircadianPalette('amber');

      expect(mockSessionStorage[CIRCADIAN_STORAGE_KEYS.PALETTE]).toBe('amber');
      expect(getStoredCircadianPalette()).toBe('amber');

      // Zero-ePHI: localStorage must never be accessed or populated
      expect(Object.keys(mockLocalStorage)).toHaveLength(0);
    });

    test('getStoredCircadianPalette safely returns null for corrupted or empty storage', () => {
      expect(getStoredCircadianPalette()).toBeNull();

      mockSessionStorage[CIRCADIAN_STORAGE_KEYS.PALETTE] = 'corrupted_state';
      expect(getStoredCircadianPalette()).toBeNull();
    });

    test('persists automated sunset preference to sessionStorage', () => {
      expect(getStoredAutoSunset()).toBe(true); // Default true

      setStoredAutoSunset(false);
      expect(mockSessionStorage[CIRCADIAN_STORAGE_KEYS.AUTO_SUNSET]).toBe('false');
      expect(getStoredAutoSunset()).toBe(false);

      setStoredAutoSunset(true);
      expect(mockSessionStorage[CIRCADIAN_STORAGE_KEYS.AUTO_SUNSET]).toBe('true');
      expect(getStoredAutoSunset()).toBe(true);
    });

    test('verifies storage contents contain zero ePHI or patient identifiers', () => {
      setStoredCircadianPalette('oled');
      setStoredAutoSunset(true);

      const forbiddenKeys = ['mrn', 'patient', 'email', 'phone', 'ssn', 'diagnosis', 'name'];
      const allSessionKeys = Object.keys(mockSessionStorage).map((k) => k.toLowerCase());

      forbiddenKeys.forEach((forbidden) => {
        expect(allSessionKeys).not.toContain(forbidden);
      });
    });
  });
});

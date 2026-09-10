import fs from 'fs';
import path from 'path';
import {
  STATIC_CACHE_NAME,
  IMAGE_CACHE_NAME,
  CURRENT_CACHES,
  PRECACHE_ASSETS,
  BYPASS_PREFIXES,
  SEVEN_DAYS_MS,
  OFFLINE_FALLBACK_URL,
  isBypassRoute,
  isFontOrSvgRoute,
  isCompiledImageRoute,
  isNavigationRoute,
  classifyRoute,
  isImageExpired,
  parseRequestUrl,
} from '../cacheRules';
import {
  registerServiceWorker,
  unregisterServiceWorker,
  promptWorkerUpdate,
  isOnline,
  registerConnectionListeners,
  isServiceWorkerSupported,
} from '../registerServiceWorker';

type VoidCallback = () => void;
type EventCallback = (event?: unknown) => void;

interface MockServiceWorker {
  state: string;
  onstatechange: VoidCallback | null;
  postMessage?: jest.Mock;
}

interface MockRegistration {
  installing: MockServiceWorker | null;
  waiting: MockServiceWorker | null;
  active: MockServiceWorker | null;
  onupdatefound: VoidCallback | null;
  unregister: jest.Mock;
}

interface MockNavigator {
  onLine: boolean;
  serviceWorker?: {
    controller: object | null;
    register: jest.Mock;
    getRegistration: jest.Mock;
  };
}

interface MockWindow {
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  __triggerEvent: (event: string) => void;
}

describe('Advanced Workbox-Free Service Worker Engine (Agent 09)', () => {
  // =========================================================================
  // Suite 1: Cache Strategy Matcher Rules & URL Classification
  // =========================================================================
  describe('Cache Strategy Matcher Rules & URL Classification', () => {
    describe('Constants & Configuration Invariants', () => {
      it('exports expected cache names and current cache inventory', () => {
        expect(STATIC_CACHE_NAME).toBe('STATIC_CACHE_v4');
        expect(IMAGE_CACHE_NAME).toBe('IMAGE_CACHE_v4');
        expect(CURRENT_CACHES).toContain(STATIC_CACHE_NAME);
        expect(CURRENT_CACHES).toContain(IMAGE_CACHE_NAME);
        expect(CURRENT_CACHES).toHaveLength(2);
      });

      it('exports precache asset inventory and offline fallback', () => {
        expect(OFFLINE_FALLBACK_URL).toBe('/offline');
        expect(PRECACHE_ASSETS).toContain('/offline');
        expect(PRECACHE_ASSETS).toContain('/manifest.json');
        expect(PRECACHE_ASSETS).toContain('/file.svg');
        expect(PRECACHE_ASSETS).toContain('/globe.svg');
      });

      it('exports strict bypass prefixes including ePHI corridors', () => {
        expect(BYPASS_PREFIXES).toContain('/api');
        expect(BYPASS_PREFIXES).toContain('/vault');
        expect(BYPASS_PREFIXES).toContain('/assessment');
      });
    });

    describe('Strict Network-Only Bypass (Zero ePHI / Sensitive Routes)', () => {
      const sensitivePaths = [
        '/api',
        '/api/',
        '/api/auth',
        '/api/auth/session',
        '/api/patients/v1',
        '/api/telemetry',
        '/vault',
        '/vault/',
        '/vault/patient-id-123',
        '/vault/biomarkers',
        '/vault/keys/export',
        '/assessment',
        '/assessment/',
        '/assessment/start',
        '/assessment/score',
        '/assessment/results',
      ];

      it.each(sensitivePaths)('bypasses sensitive route: %s', (testPath) => {
        expect(isBypassRoute(testPath)).toBe(true);

        const classification = classifyRoute({ url: testPath });
        expect(classification.strategy).toBe('strict-network-only');
        expect(classification.cacheName).toBeNull();
        expect(classification.reason).toMatch(/sensitive|ePHI|bypass/i);
      });

      it('bypasses sensitive routes even when requested as HTML navigation', () => {
        const sensitiveNav = classifyRoute({
          url: '/vault/records',
          mode: 'navigate',
          acceptHeader: 'text/html',
        });
        expect(sensitiveNav.strategy).toBe('strict-network-only');
        expect(sensitiveNav.cacheName).toBeNull();

        const assessmentNav = classifyRoute({
          url: '/assessment',
          mode: 'navigate',
          acceptHeader: 'text/html',
        });
        expect(assessmentNav.strategy).toBe('strict-network-only');
        expect(assessmentNav.cacheName).toBeNull();
      });

      it('bypasses all non-GET mutation methods regardless of pathname', () => {
        const mutationMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
        for (const method of mutationMethods) {
          expect(isBypassRoute('/contact', method)).toBe(true);
          expect(isBypassRoute('/offline', method)).toBe(true);

          const classification = classifyRoute({
            url: '/contact',
            method,
          });
          expect(classification.strategy).toBe('strict-network-only');
          expect(classification.cacheName).toBeNull();
        }
      });

      it('does NOT bypass public non-sensitive GET routes', () => {
        expect(isBypassRoute('/')).toBe(false);
        expect(isBypassRoute('/biographies')).toBe(false);
        expect(isBypassRoute('/services')).toBe(false);
        expect(isBypassRoute('/offline')).toBe(false);
        expect(isBypassRoute('/manifest.json')).toBe(false);
      });
    });

    describe('Navigation Requests (Network-First with /offline fallback rewrite)', () => {
      it('classifies navigate mode requests as network-first with STATIC_CACHE_v4', () => {
        const publicPages = ['/', '/biographies', '/services', '/membership', '/status', '/offline'];

        for (const page of publicPages) {
          expect(isNavigationRoute(page, 'navigate')).toBe(true);

          const result = classifyRoute({ url: page, mode: 'navigate' });
          expect(result.strategy).toBe('network-first');
          expect(result.cacheName).toBe(STATIC_CACHE_NAME);
        }
      });

      it('classifies GET requests with text/html Accept header as network-first', () => {
        expect(isNavigationRoute('/governance', undefined, 'text/html,application/xhtml+xml')).toBe(true);

        const result = classifyRoute({
          url: '/governance',
          method: 'GET',
          acceptHeader: 'text/html,application/xhtml+xml',
        });
        expect(result.strategy).toBe('network-first');
        expect(result.cacheName).toBe(STATIC_CACHE_NAME);
      });

      it('does not classify non-html requests as navigation', () => {
        expect(isNavigationRoute('/hero.png', undefined, 'image/png')).toBe(false);
        expect(isNavigationRoute('/data.json', undefined, 'application/json')).toBe(false);
      });
    });

    describe('Fonts and SVGs (Stale-While-Revalidate)', () => {
      const fontUrls = [
        'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&display=swap',
        'https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2',
        '/fonts/inter.woff2',
        '/fonts/cormorant-regular.woff',
        '/fonts/jetbrains-mono.ttf',
        '/fonts/eb-garamond.otf',
        '/static/typography/jetbrains_mono_medium.woff2',
      ];

      it.each(fontUrls)('identifies font URL: %s', (fontUrl) => {
        expect(isFontOrSvgRoute(fontUrl)).toBe(true);

        const result = classifyRoute({ url: fontUrl });
        expect(result.strategy).toBe('stale-while-revalidate');
        expect(result.cacheName).toBe(STATIC_CACHE_NAME);
      });

      const svgUrls = [
        '/file.svg',
        '/globe.svg',
        '/window.svg',
        '/icons/icon-192.svg',
        '/icons/icon-512.svg',
      ];

      it.each(svgUrls)('identifies SVG URL: %s', (svgUrl) => {
        expect(isFontOrSvgRoute(svgUrl)).toBe(true);

        const result = classifyRoute({ url: svgUrl });
        expect(result.strategy).toBe('stale-while-revalidate');
        expect(result.cacheName).toBe(STATIC_CACHE_NAME);
      });
    });

    describe('Compiled Image Assets (Cache-First with 7-Day TTL)', () => {
      const imageUrls = [
        '/assets/hero.png',
        '/clinic/interior.jpg',
        '/staff/dr-runheim.jpeg',
        '/media/banner.webp',
        '/hero-retina.avif',
      ];

      it.each(imageUrls)('classifies direct image asset: %s', (imageUrl) => {
        expect(isCompiledImageRoute(imageUrl)).toBe(true);

        const result = classifyRoute({ url: imageUrl });
        expect(result.strategy).toBe('cache-first');
        expect(result.cacheName).toBe(IMAGE_CACHE_NAME);
      });

      it('classifies Next.js optimized image URLs (/_next/image?url=...)', () => {
        const nextImageUrl = '/_next/image?url=%2Fdr-runheim.webp&w=1080&q=75';
        expect(isCompiledImageRoute(nextImageUrl)).toBe(true);

        const result = classifyRoute({ url: nextImageUrl });
        expect(result.strategy).toBe('cache-first');
        expect(result.cacheName).toBe(IMAGE_CACHE_NAME);
      });

      it('does not classify non-image files under compiled images', () => {
        expect(isCompiledImageRoute('/styles.css')).toBe(false);
        expect(isCompiledImageRoute('/bundle.js')).toBe(false);
      });
    });

    describe('Static Build Assets (_next/static/*)', () => {
      it('classifies Next.js static chunks as stale-while-revalidate in STATIC_CACHE', () => {
        const result = classifyRoute({ url: '/_next/static/chunks/app/layout.js' });
        expect(result.strategy).toBe('stale-while-revalidate');
        expect(result.cacheName).toBe(STATIC_CACHE_NAME);
      });
    });

    describe('Image Expiration & 7-Day TTL Calculation', () => {
      const now = 1773000000000;

      it('confirms 7-day TTL in milliseconds is exactly 604,800,000 ms', () => {
        expect(SEVEN_DAYS_MS).toBe(7 * 24 * 60 * 60 * 1000);
        expect(SEVEN_DAYS_MS).toBe(604800000);
      });

      it('returns false for image cached 1 hour ago', () => {
        const oneHourAgo = now - 60 * 60 * 1000;
        expect(isImageExpired(oneHourAgo, now)).toBe(false);
        expect(isImageExpired({ timestamp: oneHourAgo }, now)).toBe(false);
      });

      it('returns false for image cached 6 days and 23 hours ago', () => {
        const sixDaysAgo = now - (6 * 24 + 23) * 60 * 60 * 1000;
        expect(isImageExpired(sixDaysAgo, now)).toBe(false);
      });

      it('returns true for image cached 7 days and 1 second ago', () => {
        const expiredTime = now - (SEVEN_DAYS_MS + 1000);
        expect(isImageExpired(expiredTime, now)).toBe(true);
        expect(isImageExpired({ timestamp: expiredTime.toString() }, now)).toBe(true);
      });

      it('returns true for image cached 30 days ago', () => {
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        expect(isImageExpired(thirtyDaysAgo, now)).toBe(true);
      });

      it('correctly parses HTTP Date header for TTL comparison', () => {
        const freshDate = new Date(now - 2 * 24 * 60 * 60 * 1000).toUTCString();
        expect(isImageExpired({ dateHeader: freshDate }, now)).toBe(false);

        const staleDate = new Date(now - 10 * 24 * 60 * 60 * 1000).toUTCString();
        expect(isImageExpired({ dateHeader: staleDate }, now)).toBe(true);
      });

      it('handles null, undefined, and unparseable headers safely', () => {
        expect(isImageExpired(null, now)).toBe(false);
        expect(isImageExpired(undefined, now)).toBe(false);
        expect(isImageExpired({ timestamp: 'invalid-num' }, now)).toBe(false);
        expect(isImageExpired({ dateHeader: 'invalid-date' }, now)).toBe(false);
      });
    });

    describe('URL Parsing and Normalization', () => {
      it('parses relative and absolute URLs correctly', () => {
        const relative = parseRequestUrl('/offline');
        expect(relative).not.toBeNull();
        expect(relative?.pathname).toBe('/offline');

        const absolute = parseRequestUrl('https://cognitiveedgeclinic.com/api/health');
        expect(absolute).not.toBeNull();
        expect(absolute?.pathname).toBe('/api/health');
      });

      it('handles URL object inputs directly', () => {
        const inputUrl = new URL('https://cognitiveedgeclinic.com/services');
        const parsed = parseRequestUrl(inputUrl);
        expect(parsed).toBe(inputUrl);
      });
    });
  });

  // =========================================================================
  // Suite 2: Client-Side Registration Logic (registerServiceWorker.ts)
  // =========================================================================
  describe('Client-Side Registration Logic', () => {
    const originalEnv = process.env.NODE_ENV;
    let mockWindow: MockWindow;
    let mockNavigator: MockNavigator;

    beforeEach(() => {
      mockNavigator = {
        onLine: true,
        serviceWorker: {
          controller: null,
          register: jest.fn(),
          getRegistration: jest.fn(),
        },
      };

      const listeners: Record<string, EventCallback[]> = {};
      mockWindow = {
        addEventListener: jest.fn((event: string, cb: EventCallback) => {
          if (!listeners[event]) listeners[event] = [];
          listeners[event].push(cb);
        }),
        removeEventListener: jest.fn((event: string, cb: EventCallback) => {
          if (listeners[event]) {
            listeners[event] = listeners[event].filter((fn) => fn !== cb);
          }
        }),
        __triggerEvent: (event: string) => {
          if (listeners[event]) {
            listeners[event].forEach((cb) => cb());
          }
        },
      };

      // @ts-expect-error Mocking global window in node test environment
      global.window = mockWindow;
      // @ts-expect-error Mocking global navigator in node test environment
      global.navigator = mockNavigator;
    });

    afterEach(() => {
      // @ts-expect-error Restoring original environment
      process.env.NODE_ENV = originalEnv;
      // @ts-expect-error Cleaning up global window
      delete global.window;
      // @ts-expect-error Cleaning up global navigator
      delete global.navigator;
      jest.restoreAllMocks();
    });

    describe('Environment Checks & SSR Safety', () => {
      it('returns null and does not register in SSR context (when window is undefined)', async () => {
        // @ts-expect-error Simulating SSR
        delete global.window;

        expect(isServiceWorkerSupported()).toBe(false);
        const reg = await registerServiceWorker();
        expect(reg).toBeNull();
        expect(mockNavigator.serviceWorker?.register).not.toHaveBeenCalled();
      });

      it('returns null when serviceWorker API is not available on navigator', async () => {
        delete mockNavigator.serviceWorker;

        expect(isServiceWorkerSupported()).toBe(false);
        const reg = await registerServiceWorker();
        expect(reg).toBeNull();
      });

      it('skips registration in development when enableInDev is false', async () => {
        // @ts-expect-error Overriding NODE_ENV
        process.env.NODE_ENV = 'development';

        const reg = await registerServiceWorker({ enableInDev: false });
        expect(reg).toBeNull();
        expect(mockNavigator.serviceWorker?.register).not.toHaveBeenCalled();
      });

      it('registers in development when enableInDev is explicitly true', async () => {
        // @ts-expect-error Overriding NODE_ENV
        process.env.NODE_ENV = 'development';
        const dummyReg = { onupdatefound: null } as unknown as ServiceWorkerRegistration;
        mockNavigator.serviceWorker?.register.mockResolvedValue(dummyReg);

        const reg = await registerServiceWorker({ enableInDev: true });
        expect(reg).toBe(dummyReg);
        expect(mockNavigator.serviceWorker?.register).toHaveBeenCalledWith('/sw/worker.js', { scope: '/' });
      });

      it('registers in production environment by default', async () => {
        // @ts-expect-error Overriding NODE_ENV
        process.env.NODE_ENV = 'production';
        const dummyReg = { onupdatefound: null } as unknown as ServiceWorkerRegistration;
        mockNavigator.serviceWorker?.register.mockResolvedValue(dummyReg);

        const reg = await registerServiceWorker();
        expect(reg).toBe(dummyReg);
        expect(mockNavigator.serviceWorker?.register).toHaveBeenCalledWith('/sw/worker.js', { scope: '/' });
      });
    });

    describe('Update Lifecycle & Callbacks', () => {
      beforeEach(() => {
        // @ts-expect-error Setting production mode
        process.env.NODE_ENV = 'production';
      });

      it('invokes onSuccess when new service worker installs with no prior controller', async () => {
        const onSuccess = jest.fn();
        const onUpdate = jest.fn();

        let installingWorkerStateChange: VoidCallback | null = null;
        const fakeInstallingWorker: MockServiceWorker = {
          state: 'installing',
          set onstatechange(cb: VoidCallback | null) {
            installingWorkerStateChange = cb;
          },
          get onstatechange() {
            return installingWorkerStateChange;
          },
        };

        const fakeRegistration: MockRegistration = {
          installing: fakeInstallingWorker,
          waiting: null,
          active: null,
          onupdatefound: null,
          unregister: jest.fn(),
        };

        mockNavigator.serviceWorker?.register.mockResolvedValue(fakeRegistration);
        if (mockNavigator.serviceWorker) {
          mockNavigator.serviceWorker.controller = null; // Initial install
        }

        await registerServiceWorker({ onSuccess, onUpdate });

        expect(typeof fakeRegistration.onupdatefound).toBe('function');
        fakeRegistration.onupdatefound?.();

        fakeInstallingWorker.state = 'installed';
        if (installingWorkerStateChange) {
          (installingWorkerStateChange as VoidCallback)();
        }

        expect(onSuccess).toHaveBeenCalledWith(fakeRegistration);
        expect(onUpdate).not.toHaveBeenCalled();
      });

      it('invokes onUpdate when service worker installs and a controller already exists', async () => {
        const onSuccess = jest.fn();
        const onUpdate = jest.fn();

        let installingWorkerStateChange: VoidCallback | null = null;
        const fakeInstallingWorker: MockServiceWorker = {
          state: 'installing',
          set onstatechange(cb: VoidCallback | null) {
            installingWorkerStateChange = cb;
          },
          get onstatechange() {
            return installingWorkerStateChange;
          },
        };

        const fakeRegistration: MockRegistration = {
          installing: fakeInstallingWorker,
          waiting: null,
          active: null,
          onupdatefound: null,
          unregister: jest.fn(),
        };

        mockNavigator.serviceWorker?.register.mockResolvedValue(fakeRegistration);
        if (mockNavigator.serviceWorker) {
          mockNavigator.serviceWorker.controller = {}; // Active controller present
        }

        await registerServiceWorker({ onSuccess, onUpdate });

        fakeRegistration.onupdatefound?.();
        fakeInstallingWorker.state = 'installed';
        if (installingWorkerStateChange) {
          (installingWorkerStateChange as VoidCallback)();
        }

        expect(onUpdate).toHaveBeenCalledWith(fakeRegistration);
        expect(onSuccess).not.toHaveBeenCalled();
      });

      it('catches and logs errors and invokes onError callback on registration failure', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const onError = jest.fn();
        const failureError = new Error('SecurityError: Access denied');

        mockNavigator.serviceWorker?.register.mockRejectedValue(failureError);

        const result = await registerServiceWorker({ onError });
        expect(result).toBeNull();
        expect(onError).toHaveBeenCalledWith(failureError);
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
    });

    describe('Online / Offline Status Listeners', () => {
      it('checks online state via isOnline() helper', () => {
        mockNavigator.onLine = true;
        expect(isOnline()).toBe(true);

        mockNavigator.onLine = false;
        expect(isOnline()).toBe(false);
      });

      it('subscribes and fires onOnline / onOffline event listeners correctly', () => {
        const onOnline = jest.fn();
        const onOffline = jest.fn();

        const unsubscribe = registerConnectionListeners(onOnline, onOffline);

        expect(mockWindow.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
        expect(mockWindow.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));

        // Trigger events
        mockWindow.__triggerEvent('online');
        expect(onOnline).toHaveBeenCalledTimes(1);

        mockWindow.__triggerEvent('offline');
        expect(onOffline).toHaveBeenCalledTimes(1);

        // Unsubscribe
        unsubscribe();
        expect(mockWindow.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
        expect(mockWindow.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
      });
    });

    describe('promptWorkerUpdate and unregisterServiceWorker Helpers', () => {
      it('sends SKIP_WAITING message to registration.waiting worker', () => {
        const postMessageMock = jest.fn();
        const fakeRegistration = {
          waiting: {
            postMessage: postMessageMock,
          },
        } as unknown as ServiceWorkerRegistration;

        const sent = promptWorkerUpdate(fakeRegistration);
        expect(sent).toBe(true);
        expect(postMessageMock).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
      });

      it('returns false when registration has no waiting worker', () => {
        const fakeRegistration = { waiting: null } as unknown as ServiceWorkerRegistration;
        expect(promptWorkerUpdate(fakeRegistration)).toBe(false);
      });

      it('unregisters service worker via unregisterServiceWorker', async () => {
        const unregisterMock = jest.fn().mockResolvedValue(true);
        mockNavigator.serviceWorker?.getRegistration.mockResolvedValue({
          unregister: unregisterMock,
        });

        const success = await unregisterServiceWorker();
        expect(success).toBe(true);
        expect(unregisterMock).toHaveBeenCalled();
      });
    });
  });

  // =========================================================================
  // Suite 3: Vanilla Service Worker File Static Integrity (public/sw/worker.js)
  // =========================================================================
  describe('Vanilla Service Worker File Static Integrity (public/sw/worker.js)', () => {
    const workerPath = path.resolve(process.cwd(), 'public/sw/worker.js');
    let workerContent: string;

    beforeAll(() => {
      expect(fs.existsSync(workerPath)).toBe(true);
      workerContent = fs.readFileSync(workerPath, 'utf8');
    });

    it('contains ZERO external dependencies or workbox imports', () => {
      expect(workerContent).not.toMatch(/importScripts\s*\(/i);
      expect(workerContent).not.toMatch(/workbox/i);
      expect(workerContent).not.toMatch(/require\s*\(/i);
      expect(workerContent).not.toMatch(/from\s+['"][^'"]+['"]/i); // No ES module imports
    });

    it('defines exact cache version names STATIC_CACHE_v4 and IMAGE_CACHE_v4', () => {
      expect(workerContent).toContain("STATIC_CACHE = 'STATIC_CACHE_v4'");
      expect(workerContent).toContain("IMAGE_CACHE = 'IMAGE_CACHE_v4'");
    });

    it('defines skipWaiting in install listener', () => {
      expect(workerContent).toContain("self.addEventListener('install'");
      expect(workerContent).toContain('self.skipWaiting()');
    });

    it('defines clients.claim and outdated cache purging in activate listener', () => {
      expect(workerContent).toContain("self.addEventListener('activate'");
      expect(workerContent).toContain('self.clients.claim()');
      expect(workerContent).toContain('caches.delete');
    });

    it('defines strict Network-Only bypass for sensitive / ePHI paths', () => {
      expect(workerContent).toContain('/api');
      expect(workerContent).toContain('/vault');
      expect(workerContent).toContain('/assessment');
      expect(workerContent).toContain('isBypassRequest');
    });

    it('defines 7-day expiration for compiled image assets (.png, .jpg, .webp, .avif)', () => {
      expect(workerContent).toContain('7 * 24 * 60 * 60 * 1000');
      expect(workerContent).toContain('.png');
      expect(workerContent).toContain('.jpg');
      expect(workerContent).toContain('.webp');
      expect(workerContent).toContain('.avif');
      expect(workerContent).toContain('handleCacheFirstImage');
    });

    it('defines Stale-While-Revalidate for fonts and SVGs', () => {
      expect(workerContent).toContain('handleStaleWhileRevalidate');
      expect(workerContent).toContain('fonts.googleapis.com');
      expect(workerContent).toContain('fonts.gstatic.com');
      expect(workerContent).toContain('.svg');
    });

    it('defines Network-First with /offline fallback rewrite for navigation requests', () => {
      expect(workerContent).toContain('handleNavigation');
      expect(workerContent).toContain('/offline');
      expect(workerContent).toContain("request.mode === 'navigate'");
    });

    it('defines SKIP_WAITING message listener', () => {
      expect(workerContent).toContain("self.addEventListener('message'");
      expect(workerContent).toContain('SKIP_WAITING');
    });
  });
});

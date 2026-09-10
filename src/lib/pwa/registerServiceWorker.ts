/**
 * Cognitive Edge Clinic - Client-Side Service Worker Registration
 * Service Worker Edge Caching & Offline Enclave (Agent 09)
 *
 * Collision Policy: Operates EXCLUSIVELY inside public/sw/ and src/lib/pwa/
 */

export interface ServiceWorkerRegistrationOptions {
  /**
   * Path to the service worker script. Defaults to '/sw/worker.js'.
   */
  swUrl?: string;

  /**
   * Registration scope. Defaults to '/'.
   */
  scope?: string;

  /**
   * Force registration in non-production environments (useful for testing or staging).
   * Defaults to false (production only).
   */
  enableInDev?: boolean;

  /**
   * Invoked when service worker successfully installs for the first time.
   */
  onSuccess?: (registration: ServiceWorkerRegistration) => void;

  /**
   * Invoked when an updated service worker has been found and installed.
   */
  onUpdate?: (registration: ServiceWorkerRegistration) => void;

  /**
   * Invoked when registration encounters an error.
   */
  onError?: (error: Error) => void;

  /**
   * Invoked when network connectivity transitions to online.
   */
  onOnline?: () => void;

  /**
   * Invoked when network connectivity transitions to offline.
   */
  onOffline?: () => void;
}

/**
 * Checks if the current runtime environment is appropriate for Service Worker registration.
 */
export function isServiceWorkerSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator
  );
}

/**
 * Checks whether client device currently has active network connectivity.
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true;
  }
  return typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
}

/**
 * Registers listeners for window online and offline events.
 * Returns an unsubscription callback.
 */
export function registerConnectionListeners(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => {
    onOnline?.();
  };

  const handleOffline = () => {
    onOffline?.();
  };

  if (onOnline) {
    window.addEventListener('online', handleOnline);
  }
  if (onOffline) {
    window.addEventListener('offline', handleOffline);
  }

  return () => {
    if (onOnline) {
      window.removeEventListener('online', handleOnline);
    }
    if (onOffline) {
      window.removeEventListener('offline', handleOffline);
    }
  };
}

/**
 * Signals the waiting service worker to skip waiting and activate immediately.
 */
export function promptWorkerUpdate(
  registration: ServiceWorkerRegistration
): boolean {
  if (registration && registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    return true;
  }
  return false;
}

/**
 * Safely unregisters all active service worker registrations for the scope.
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      return await registration.unregister();
    }
    return false;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[PWA Service Worker Unregister Error]:', error.message);
    return false;
  }
}

/**
 * Safe client-side registration helper with production environment checks.
 *
 * Enforces:
 * 1. Server-side rendering (SSR) safety check (typeof window !== 'undefined').
 * 2. Navigator capability check ('serviceWorker' in navigator).
 * 3. Environment check: only registers in production (NODE_ENV === 'production')
 *    unless explicitly overridden via `options.enableInDev: true`.
 * 4. Update lifecycle notification hooks (onSuccess, onUpdate, onError).
 * 5. Online/offline connection monitoring.
 */
export async function registerServiceWorker(
  options: ServiceWorkerRegistrationOptions = {}
): Promise<ServiceWorkerRegistration | null> {
  const {
    swUrl = '/sw/worker.js',
    scope = '/',
    enableInDev = false,
    onSuccess,
    onUpdate,
    onError,
    onOnline,
    onOffline,
  } = options;

  // 1. Browser & SSR compatibility guard
  if (!isServiceWorkerSupported()) {
    return null;
  }

  // 2. Production environment guard
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction && !enableInDev) {
    return null;
  }

  // 3. Register online/offline status listeners if requested
  if (onOnline || onOffline) {
    registerConnectionListeners(onOnline, onOffline);
  }

  try {
    const registration = await navigator.serviceWorker.register(swUrl, { scope });

    // Handle initial vs. updated worker lifecycle states
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            onUpdate?.(registration);
          } else {
            // First-time precached content ready
            onSuccess?.(registration);
          }
        }
      };
    };

    return registration;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[PWA Service Worker Registration Error]:', error.message);
    onError?.(error);
    return null;
  }
}

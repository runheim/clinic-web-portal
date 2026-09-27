/**
 * @file webauthn.ts
 * @deprecated WebAuthn / Passkeys have been intentionally decoupled and deprecated
 * in favor of staff-only provisioning via Cognitive Edge Clinic administrative enclave.
 * 
 * To safeguard zero-ePHI requirements and enforce strict physician-coordinator oversight,
 * patient credentials are now provisioned directly by clinic staff via Netlify Blobs storage
 * (scripts/provision-user.ts or /vault/admin).
 */

export interface DeprecatedWebAuthnConfig {
  enabled: false;
  reason: string;
}

export const WEBAUTHN_DEPRECATED_CONFIG: DeprecatedWebAuthnConfig = {
  enabled: false,
  reason:
    "WebAuthn has been decoupled in favor of staff-only provisioning via Cognitive Edge Clinic administrative enclave.",
};

/**
 * @deprecated WebAuthn hardware authentication is deprecated in favor of staff provisioning.
 */
export async function isWebAuthnAvailable(): Promise<boolean> {
  return false;
}

/**
 * @deprecated Platform authenticators are decoupled from client authentication flow.
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  return false;
}

export default WEBAUTHN_DEPRECATED_CONFIG;

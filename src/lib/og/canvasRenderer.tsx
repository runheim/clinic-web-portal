import { ImageResponse } from "next/og";
import React from "react";

/**
 * OpenGraph canvas card options.
 */
export interface OgCardOptions {
  /** Modality or page title (e.g. "High-Frequency DLPFC TMS") */
  title?: string;
  /** Category badge text (e.g. "NEUROMODULATION PROTOCOL") */
  category?: string;
  /** Subtitle text detailing clinical context */
  subtitle?: string;
  /** Optional secondary badge or protocol metadata tag */
  badge?: string;
}

/** Default secret used for signing OG cards when environment secret is not configured */
const DEFAULT_OG_SECRET = "cognitive-edge-clinic-og-secret-key-2026";

// Standard SHA-256 Round Constants
const K256: readonly number[] = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

/**
 * Pure TypeScript SHA-256 byte digest computation for Edge runtime isolation.
 * Eliminates external Node.js module warnings and guarantees zero external dependencies.
 */
function computeSha256(data: Uint8Array): Uint8Array<ArrayBuffer> {
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const bitLength = data.length * 8;
  const newLen = (((data.length + 8) >> 6) + 1) << 6;
  const paddedBuffer = new ArrayBuffer(newLen);
  const padded = new Uint8Array(paddedBuffer);
  padded.set(data);
  padded[data.length] = 0x80;

  const view = new DataView(paddedBuffer);
  view.setUint32(newLen - 4, bitLength >>> 0, false);
  view.setUint32(newLen - 8, Math.floor(bitLength / 0x100000000), false);

  const w = new Uint32Array(64);

  for (let chunk = 0; chunk < newLen; chunk += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(chunk + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 =
        ((w[i - 15] >>> 7) | (w[i - 15] << 25)) ^
        ((w[i - 15] >>> 18) | (w[i - 15] << 14)) ^
        (w[i - 15] >>> 3);
      const s1 =
        ((w[i - 2] >>> 17) | (w[i - 2] << 15)) ^
        ((w[i - 2] >>> 19) | (w[i - 2] << 13)) ^
        (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const s1 =
        ((e >>> 6) | (e << 26)) ^
        ((e >>> 11) | (e << 21)) ^
        ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + K256[i] + w[i]) >>> 0;
      const s0 =
        ((a >>> 2) | (a << 30)) ^
        ((a >>> 13) | (a << 19)) ^
        ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const resultBuffer = new ArrayBuffer(32);
  const result = new Uint8Array(resultBuffer);
  const resView = new DataView(resultBuffer);
  resView.setUint32(0, h0, false);
  resView.setUint32(4, h1, false);
  resView.setUint32(8, h2, false);
  resView.setUint32(12, h3, false);
  resView.setUint32(16, h4, false);
  resView.setUint32(20, h5, false);
  resView.setUint32(24, h6, false);
  resView.setUint32(28, h7, false);
  return result;
}

/**
 * Computes an HMAC-SHA256 hex digest using Edge-compatible pure TypeScript algorithms.
 *
 * @param title - The card title or payload string to sign.
 * @param secret - Optional secret key. Defaults to OG_SIGNING_SECRET env var or fallback.
 * @returns 64-character lowercase hexadecimal HMAC-SHA256 signature digest.
 */
export function generateOgSignature(title: string, secret?: string): string {
  const signingKey =
    secret ||
    process.env.OG_SIGNING_SECRET ||
    process.env.AUTH_SECRET ||
    DEFAULT_OG_SECRET;

  const enc = new TextEncoder();
  let keyBytes: Uint8Array = enc.encode(signingKey);
  const msgBytes = enc.encode(title);

  if (keyBytes.length > 64) {
    keyBytes = computeSha256(keyBytes);
  }

  const keyPadded = new Uint8Array(64);
  keyPadded.set(keyBytes);

  const oKeyPad = new Uint8Array(64);
  const iKeyPad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    oKeyPad[i] = keyPadded[i] ^ 0x5c;
    iKeyPad[i] = keyPadded[i] ^ 0x36;
  }

  const inner = new Uint8Array(64 + msgBytes.length);
  inner.set(iKeyPad, 0);
  inner.set(msgBytes, 64);
  const innerHash = computeSha256(inner);

  const outer = new Uint8Array(64 + 32);
  outer.set(oKeyPad, 0);
  outer.set(innerHash, 64);
  const outerHash = computeSha256(outer);

  let hex = "";
  for (let i = 0; i < outerHash.length; i++) {
    hex += outerHash[i].toString(16).padStart(2, "0");
  }
  return hex;
}

/**
 * Cryptographic HMAC-SHA256 verification utility to protect against unauthorized
 * image generation and query parameter tampering on Edge runtime.
 * Constant-time comparison ensures protection against timing side-channel attacks.
 *
 * @param title - The title query parameter to verify.
 * @param signature - The hexadecimal signature provided by the client/request.
 * @param secret - Optional HMAC secret key.
 * @returns boolean indicating whether signature is valid and authentic.
 */
export function verifyOgSignature(
  title: string,
  signature: string,
  secret?: string
): boolean {
  if (
    !title ||
    !signature ||
    typeof title !== "string" ||
    typeof signature !== "string"
  ) {
    return false;
  }

  try {
    const expected = generateOgSignature(title, secret);

    if (expected.length !== signature.length) {
      return false;
    }

    // Constant-time comparison
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

/**
 * Renders the JSX tree for the high-fidelity luxury 1200x630 OpenGraph card.
 */
export function renderOgCard(options?: OgCardOptions): React.ReactElement {
  const title =
    options?.title?.trim() ||
    "Autonomic Vitality & Neuro-Metabolic Resuscitation";

  const category =
    options?.category?.trim() ||
    "QUANTITATIVE NEUROSCIENCE & REGENERATIVE METABOLISM";

  const subtitle =
    options?.subtitle?.trim() ||
    "Discreet Concierge Neurology & Stoichiometric Neuro-Metabolic Resuscitation";

  // Dynamic font sizing based on length of title to prevent truncation or overflow
  const titleFontSize =
    title.length > 60 ? "42px" : title.length > 38 ? "50px" : "58px";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0B0F19",
        padding: "28px",
        position: "relative",
      }}
    >
      {/* Outer Luxury Card with Obsidian Surface and Hairline Champagne Gold Border */}
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#101623",
          border: "1px solid rgba(212, 175, 55, 0.35)",
          borderRadius: "18px",
          padding: "44px 50px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle Radial Champagne Gold Glow (Top Right) */}
        <div
          style={{
            position: "absolute",
            top: "-70px",
            right: "-70px",
            width: "480px",
            height: "480px",
            borderRadius: "100%",
            background:
              "radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, rgba(78, 107, 94, 0.08) 45%, transparent 70%)",
          }}
        />

        {/* Subtle Ambient Radial Glow (Bottom Left) */}
        <div
          style={{
            position: "absolute",
            bottom: "-90px",
            left: "-90px",
            width: "420px",
            height: "420px",
            borderRadius: "100%",
            background:
              "radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, rgba(11, 15, 25, 0) 65%)",
          }}
        />

        {/* Background Monogram Insignia Watermark */}
        <div
          style={{
            position: "absolute",
            right: "40px",
            top: "130px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.04,
          }}
        >
          <svg width="340" height="340" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" stroke="#D4AF37" strokeWidth="1.5" />
            <circle
              cx="50"
              cy="50"
              r="41"
              stroke="#D4AF37"
              strokeWidth="0.8"
              strokeDasharray="3 2"
            />
            <text
              x="50"
              y="61"
              fontFamily="'Cormorant Garamond', 'EB Garamond', Georgia, serif"
              fontSize="34"
              fontWeight="600"
              fill="#D4AF37"
              textAnchor="middle"
            >
              CE
            </text>
          </svg>
        </div>

        {/* Top Header Row: Clinic Monogram Insignia & Category Badge */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            zIndex: 1,
          }}
        >
          {/* Clinic Monogram Crest & Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "48px",
                height: "48px",
                borderRadius: "100%",
                backgroundColor: "rgba(11, 15, 25, 0.9)",
                border: "1.5px solid #D4AF37",
              }}
            >
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="21" stroke="#D4AF37" strokeWidth="1.2" />
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  stroke="#D4AF37"
                  strokeWidth="0.6"
                  strokeDasharray="2.5 2"
                  strokeOpacity="0.5"
                />
                <text
                  x="24"
                  y="30"
                  fontFamily="'Cormorant Garamond', 'EB Garamond', Georgia, serif"
                  fontSize="17"
                  fontWeight="600"
                  fill="#D4AF37"
                  letterSpacing="0.04em"
                  textAnchor="middle"
                >
                  CE
                </text>
              </svg>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span
                style={{
                  fontFamily:
                    "'Cormorant Garamond', 'EB Garamond', Georgia, serif",
                  fontSize: "19px",
                  letterSpacing: "0.08em",
                  color: "#F6F7FB",
                  fontWeight: 600,
                }}
              >
                COGNITIVE EDGE CLINIC
              </span>
              <span
                style={{
                  fontFamily:
                    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontSize: "10px",
                  letterSpacing: "0.22em",
                  color: "#D4AF37",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                QUANTITATIVE NEUROSCIENCE &bull; CONCIERGE RESUSCITATION
              </span>
            </div>
          </div>

          {/* Optional Category Badge */}
          {category && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                border: "1px solid rgba(212, 175, 55, 0.4)",
                backgroundColor: "rgba(11, 15, 25, 0.85)",
                borderRadius: "9999px",
                padding: "8px 18px",
              }}
            >
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "9999px",
                  backgroundColor: "#D4AF37",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.18em",
                  color: "#D4AF37",
                  textTransform: "uppercase",
                  fontFamily:
                    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontWeight: 600,
                }}
              >
                {category}
              </span>
            </div>
          )}
        </div>

        {/* Center Main Section: Dynamic Modality Title & Clinical Subtitle */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            margin: "20px 0",
            zIndex: 1,
          }}
        >
          {/* Champagne Gold Accent Bar */}
          <div
            style={{
              width: "44px",
              height: "2px",
              backgroundColor: "#D4AF37",
              borderRadius: "2px",
            }}
          />

          {/* Dynamic Modality Title */}
          <div
            style={{
              fontSize: titleFontSize,
              lineHeight: "1.18",
              color: "#F6F7FB",
              fontWeight: 400,
              letterSpacing: "-0.015em",
              maxWidth: "1020px",
              fontFamily:
                "'Cormorant Garamond', 'EB Garamond', Georgia, serif",
            }}
          >
            {title}
          </div>

          {/* Clinical Subtitle */}
          <div
            style={{
              fontSize: "20px",
              lineHeight: "1.4",
              color: "#9FA7BC",
              letterSpacing: "0.02em",
              fontFamily:
                "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              maxWidth: "960px",
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Bottom Metadata & Zero-ePHI Watermark */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(212, 175, 55, 0.22)",
            paddingTop: "22px",
            width: "100%",
            zIndex: 1,
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* Attending Physician Credentials */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontSize: "16px",
                color: "#F6F7FB",
                fontWeight: 600,
              }}
            >
              David Andreas Runheim, MD
            </span>
            <span
              style={{
                fontSize: "14px",
                color: "#9FA7BC",
              }}
            >
              &bull; Board-Certified Neurologist (ABPN)
            </span>
          </div>

          {/* Zero-ePHI Certification Badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "11px",
              letterSpacing: "0.14em",
              color: "#4E6B5E",
              textTransform: "uppercase",
              fontFamily: "ui-monospace, Menlo, Monaco, Consolas, monospace",
              fontWeight: 600,
            }}
          >
            <span>ZERO-ePHI QUARANTINE CERTIFIED</span>
            <span>&bull;</span>
            <span>HIPAA BAA SECURE</span>
            <span>&bull;</span>
            <span>EDGE RUNTIME</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders dynamic 1200x630 OpenGraph cards using Next.js ImageResponse (`next/og`) on Edge runtime.
 *
 * @param options - Card rendering options including title, category, and clinical subtitle.
 * @returns Next.js ImageResponse instance configured for 1200x630 OG image.
 */
export function renderOgImage(options?: OgCardOptions): ImageResponse {
  return new ImageResponse(renderOgCard(options), {
    width: 1200,
    height: 630,
    headers: {
      "content-type": "image/png",
      "cache-control":
        "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "x-og-engine": "CognitiveEdge-CanvasRenderer/1.0-Edge",
      "x-zero-ephi-quarantine": "enforced",
    },
  });
}

/** Alias export matching task naming */
export const canvasRenderer = renderOgImage;

export default canvasRenderer;

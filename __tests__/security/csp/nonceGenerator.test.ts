import crypto from "crypto";
import {
  generateCspNonce,
  buildContentSecurityPolicy,
  generateSriHash,
  verifySri,
  LOCKED_REMOTE_SCRIPT_DOMAINS,
  LOCKED_CONNECT_DOMAINS,
  LOCKED_FRAME_DOMAINS,
  SUPPORTED_SRI_ALGORITHMS,
} from "@/lib/security/csp/nonceGenerator";

describe("Dynamic CSP Nonce & Subresource Integrity (SRI) Engine", () => {
  // =========================================================================
  // Suite 1: High-Entropy CSP Nonce Generation
  // =========================================================================
  describe("generateCspNonce", () => {
    it("generates a valid 24-character Base64 string", () => {
      const nonce = generateCspNonce();
      expect(typeof nonce).toBe("string");
      expect(nonce.length).toBe(24);
      // 16 bytes base64 encoded produces 22 base64 chars + 2 padding '='
      expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    });

    it("generates unique nonces across successive calls (zero collisions in 1,000 samples)", () => {
      const sampleSize = 1000;
      const nonces = new Set<string>();

      for (let i = 0; i < sampleSize; i++) {
        nonces.add(generateCspNonce());
      }

      expect(nonces.size).toBe(sampleSize);
    });

    it("exhibits high Shannon entropy across generated nonces", () => {
      // Collect 100 nonces and calculate aggregate character frequency
      const nonces = Array.from({ length: 100 }, () => generateCspNonce());
      const charCounts: Record<string, number> = {};
      let totalChars = 0;

      for (const nonce of nonces) {
        // Exclude trailing base64 padding '=' from entropy calculation
        const clean = nonce.replace(/=+$/, "");
        for (const ch of clean) {
          charCounts[ch] = (charCounts[ch] || 0) + 1;
          totalChars++;
        }
      }

      // Shannon entropy H = - sum(p * log2(p))
      let entropy = 0;
      for (const count of Object.values(charCounts)) {
        const p = count / totalChars;
        entropy -= p * Math.log2(p);
      }

      // 6-bit Base64 theoretical maximum is 6.0 bits/char.
      // A sample of 100 16-byte random nonces should easily exceed 5.5 bits/char.
      expect(entropy).toBeGreaterThan(5.5);
    });
  });

  // =========================================================================
  // Suite 2: Content-Security-Policy Header Builder
  // =========================================================================
  describe("buildContentSecurityPolicy", () => {
    const testNonce = "Kj7gH8vL1mP9qR3sT5uV8w==";

    it("includes strict-dynamic, frame-ancestors 'none', and the dynamic nonce", () => {
      const csp = buildContentSecurityPolicy(testNonce);

      expect(csp).toContain("'strict-dynamic'");
      expect(csp).toContain("frame-ancestors 'none';");
      expect(csp).toContain(`'nonce-${testNonce}'`);
    });

    it("incorporates locked remote script domains", () => {
      const csp = buildContentSecurityPolicy(testNonce);

      for (const domain of LOCKED_REMOTE_SCRIPT_DOMAINS) {
        expect(csp).toContain(domain);
      }
      expect(csp).toContain("https://app.cal.com");
      expect(csp).toContain("https://js.stripe.com");
    });

    it("constructs standard mandatory clinical portal directives", () => {
      const csp = buildContentSecurityPolicy(testNonce);

      expect(csp).toContain("default-src 'self';");
      expect(csp).toContain("object-src 'none';");
      expect(csp).toContain("base-uri 'self';");
      expect(csp).toContain("form-action 'self' https://mycw*.eclinicalworks.com;");

      // Verify connect-src contains all locked domains
      for (const domain of LOCKED_CONNECT_DOMAINS) {
        expect(csp).toContain(domain);
      }

      // Verify frame-src contains locked frame domains
      for (const domain of LOCKED_FRAME_DOMAINS) {
        expect(csp).toContain(domain);
      }
    });

    it("allows appending additional script domains via options", () => {
      const customDomain = "https://analytics.example.com";
      const csp = buildContentSecurityPolicy(testNonce, {
        additionalScriptDomains: [customDomain],
      });

      expect(csp).toContain(customDomain);
      expect(csp).toContain("https://app.cal.com");
    });

    it("allows appending additional connect and frame domains", () => {
      const customApi = "https://custom-api.example.com";
      const customFrame = "https://checkout.example.com";

      const csp = buildContentSecurityPolicy(testNonce, {
        additionalConnectDomains: [customApi],
        additionalFrameDomains: [customFrame],
      });

      expect(csp).toContain(customApi);
      expect(csp).toContain(customFrame);
    });

    it("supports allowEval option for development debugging", () => {
      const prodCsp = buildContentSecurityPolicy(testNonce);
      expect(prodCsp).not.toContain("'unsafe-eval'");

      const devCsp = buildContentSecurityPolicy(testNonce, { allowEval: true });
      expect(devCsp).toContain("'unsafe-eval'");
    });

    it("supports unsafeInlineFallback option for legacy browser fallback", () => {
      const strictCsp = buildContentSecurityPolicy(testNonce);
      // In script-src, unsafe-inline is omitted by default unless fallback is set
      const scriptSrcDirective = strictCsp
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("script-src"));
      expect(scriptSrcDirective).toBeDefined();
      expect(scriptSrcDirective).not.toContain("'unsafe-inline'");

      const fallbackCsp = buildContentSecurityPolicy(testNonce, {
        unsafeInlineFallback: true,
      });
      const fallbackScriptSrc = fallbackCsp
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("script-src"));
      expect(fallbackScriptSrc).toContain("'unsafe-inline'");
    });

    it("supports upgradeInsecureRequests, reportUri, and reportTo options", () => {
      const csp = buildContentSecurityPolicy(testNonce, {
        upgradeInsecureRequests: true,
        reportUri: "https://telemetry.example.com/csp-report",
        reportTo: "csp-endpoint",
      });

      expect(csp).toContain("upgrade-insecure-requests;");
      expect(csp).toContain("report-uri https://telemetry.example.com/csp-report;");
      expect(csp).toContain("report-to csp-endpoint;");
    });

    it("allows overriding and extending directives via options.directives", () => {
      const csp = buildContentSecurityPolicy(testNonce, {
        directives: {
          "worker-src": ["'self'", "blob:"],
          "object-src": false, // Removes object-src
        },
      });

      expect(csp).toContain("worker-src 'self' blob:;");
      expect(csp).not.toContain("object-src");
    });

    it("rejects empty, whitespace-only, or invalid nonces with descriptive errors", () => {
      expect(() => buildContentSecurityPolicy("")).toThrow(
        "Invalid CSP nonce: nonce must be a non-empty string."
      );
      expect(() => buildContentSecurityPolicy("   ")).toThrow(
        "Invalid CSP nonce: nonce must be a non-empty string."
      );
      // Injection attempts with CRLF or semicolons
      expect(() =>
        buildContentSecurityPolicy("nonce123; script-src 'unsafe-inline'")
      ).toThrow("Invalid CSP nonce: nonce contains illegal characters.");
      expect(() =>
        buildContentSecurityPolicy("nonce\r\nX-Injected-Header: evil")
      ).toThrow("Invalid CSP nonce: nonce contains illegal characters.");
    });
  });

  // =========================================================================
  // Suite 3: SRI Hash Generation
  // =========================================================================
  describe("generateSriHash", () => {
    const sampleScript = 'console.log("Cognitive Edge Clinic Secure Asset");';

    it("generates a sha384 SRI digest by default", () => {
      const sri = generateSriHash(sampleScript);
      expect(sri.startsWith("sha384-")).toBe(true);

      const rawDigest = crypto
        .createHash("sha384")
        .update(sampleScript)
        .digest("base64");
      expect(sri).toBe(`sha384-${rawDigest}`);
    });

    it("generates a sha256 SRI digest when specified", () => {
      const sri = generateSriHash(sampleScript, "sha256");
      expect(sri.startsWith("sha256-")).toBe(true);

      const rawDigest = crypto
        .createHash("sha256")
        .update(sampleScript)
        .digest("base64");
      expect(sri).toBe(`sha256-${rawDigest}`);
    });

    it("generates a sha512 SRI digest when specified", () => {
      const sri = generateSriHash(sampleScript, "sha512");
      expect(sri.startsWith("sha512-")).toBe(true);

      const rawDigest = crypto
        .createHash("sha512")
        .update(sampleScript)
        .digest("base64");
      expect(sri).toBe(`sha512-${rawDigest}`);
    });

    it("accepts Buffer inputs and generates identical hashes to string inputs", () => {
      const strHash256 = generateSriHash(sampleScript, "sha256");
      const bufHash256 = generateSriHash(Buffer.from(sampleScript, "utf8"), "sha256");
      expect(bufHash256).toBe(strHash256);

      const strHash384 = generateSriHash(sampleScript, "sha384");
      const bufHash384 = generateSriHash(Buffer.from(sampleScript, "utf8"), "sha384");
      expect(bufHash384).toBe(strHash384);
    });

    it("matches RFC 6920 / W3C SRI known test vector for empty string", () => {
      // SHA-256 of empty string is e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
      // Base64: 47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=
      const emptySha256 = generateSriHash("", "sha256");
      expect(emptySha256).toBe("sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=");

      const emptySha384 = generateSriHash("", "sha384");
      expect(emptySha384).toBe(
        "sha384-OLBgp1GsljhM2TJ+sbHjaiH9txEUvgdDTAzHv2P24donTt6/529l+9Ua0vFImLlb"
      );
    });

    it("throws error for unsupported algorithms", () => {
      // @ts-expect-error Testing invalid algorithm runtime rejection
      expect(() => generateSriHash(sampleScript, "md5")).toThrow(
        'Unsupported SRI algorithm: "md5"'
      );
    });

    it("throws error for invalid content input types", () => {
      // @ts-expect-error Testing invalid content runtime rejection
      expect(() => generateSriHash(null)).toThrow(
        "Invalid content: content must be a string or Buffer."
      );
      // @ts-expect-error Testing invalid content runtime rejection
      expect(() => generateSriHash(undefined)).toThrow(
        "Invalid content: content must be a string or Buffer."
      );
      // @ts-expect-error Testing invalid content runtime rejection
      expect(() => generateSriHash(12345)).toThrow(
        "Invalid content: content must be a string or Buffer."
      );
    });
  });

  // =========================================================================
  // Suite 4: Subresource Integrity (SRI) Verification
  // =========================================================================
  describe("verifySri", () => {
    const validScript = 'function authenticatePatient() { return "AUTHORIZED"; }';
    const tamperedScript = 'function authenticatePatient() { return "EXPLOITED"; }';

    it("verifies matching sha256 digests accurately", () => {
      const sri256 = generateSriHash(validScript, "sha256");
      expect(verifySri(validScript, sri256)).toBe(true);
      expect(verifySri(tamperedScript, sri256)).toBe(false);
    });

    it("verifies matching sha384 digests accurately", () => {
      const sri384 = generateSriHash(validScript, "sha384");
      expect(verifySri(validScript, sri384)).toBe(true);
      expect(verifySri(tamperedScript, sri384)).toBe(false);
    });

    it("verifies matching sha512 digests accurately", () => {
      const sri512 = generateSriHash(validScript, "sha512");
      expect(verifySri(validScript, sri512)).toBe(true);
      expect(verifySri(tamperedScript, sri512)).toBe(false);
    });

    it("verifies Buffer content accurately", () => {
      const scriptBuffer = Buffer.from(validScript, "utf8");
      const sri = generateSriHash(validScript, "sha384");
      expect(verifySri(scriptBuffer, sri)).toBe(true);
      expect(verifySri(Buffer.from(tamperedScript, "utf8"), sri)).toBe(false);
    });

    it("handles multiple space-separated hashes in metadata", () => {
      const hash1 = generateSriHash(validScript, "sha384");
      const dummyAltHash = "sha384-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      const multiHash = `${dummyAltHash} ${hash1}`;

      expect(verifySri(validScript, multiHash)).toBe(true);
      expect(verifySri(tamperedScript, multiHash)).toBe(false);
    });

    it("enforces W3C algorithm priority: strongest algorithm wins (sha384 > sha256)", () => {
      const validSha256 = generateSriHash(validScript, "sha256");
      const validSha384 = generateSriHash(validScript, "sha384");
      const forgedSha384 = "sha384-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

      // Case A: Strongest algorithm (sha384) is valid, weaker sha256 is mismatched -> PASS
      const metadataValidStronger = "sha256-mismatchedHash123 " + validSha384;
      expect(verifySri(validScript, metadataValidStronger)).toBe(true);

      // Case B: Strongest algorithm (sha384) is forged/mismatched, weaker sha256 is valid -> FAIL
      const metadataForgedStronger = `${validSha256} ${forgedSha384}`;
      expect(verifySri(validScript, metadataForgedStronger)).toBe(false);
    });

    it("handles SRI tokens with query parameter options without error", () => {
      const validSha256 = generateSriHash(validScript, "sha256");
      const integrityWithOptions = `${validSha256}?content-type=application/javascript`;
      expect(verifySri(validScript, integrityWithOptions)).toBe(true);
    });

    it("returns false on tampered hash strings", () => {
      const validSha384 = generateSriHash(validScript, "sha384");
      const tamperedHash = validSha384.slice(0, -4) + "XXXX";
      expect(verifySri(validScript, tamperedHash)).toBe(false);
    });

    it("returns false for empty, invalid, or malformed metadata strings", () => {
      expect(verifySri(validScript, "")).toBe(false);
      expect(verifySri(validScript, "   ")).toBe(false);
      expect(verifySri(validScript, "not-an-sri-hash")).toBe(false);
      expect(verifySri(validScript, "md5-unsupportedHashValue==")).toBe(false);
      // @ts-expect-error Testing invalid runtime inputs
      expect(verifySri(validScript, null)).toBe(false);
      // @ts-expect-error Testing invalid runtime inputs
      expect(verifySri(validScript, undefined)).toBe(false);
    });

    it("returns false for invalid content inputs", () => {
      const validSha384 = generateSriHash(validScript, "sha384");
      // @ts-expect-error Testing invalid runtime content
      expect(verifySri(null, validSha384)).toBe(false);
      // @ts-expect-error Testing invalid runtime content
      expect(verifySri(undefined, validSha384)).toBe(false);
      // @ts-expect-error Testing invalid runtime content
      expect(verifySri(12345, validSha384)).toBe(false);
    });
  });

  // =========================================================================
  // Suite 5: Immutability of Exported Configuration
  // =========================================================================
  describe("Configuration Immutability", () => {
    it("freezes locked remote domain constants", () => {
      expect(Object.isFrozen(LOCKED_REMOTE_SCRIPT_DOMAINS)).toBe(true);
      expect(Object.isFrozen(LOCKED_CONNECT_DOMAINS)).toBe(true);
      expect(Object.isFrozen(LOCKED_FRAME_DOMAINS)).toBe(true);
      expect(Object.isFrozen(SUPPORTED_SRI_ALGORITHMS)).toBe(true);
    });
  });
});

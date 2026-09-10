import {
  encryptVaultPayload,
  decryptVaultPayload,
  bytesToBase64,
  base64ToBytes,
  unpackVaultBinary,
  VAULT_MAGIC,
  VAULT_VERSION,
  PBKDF2_ITERATIONS,
  SALT_BYTE_LENGTH,
  IV_BYTE_LENGTH,
  HMAC_BYTE_LENGTH,
  ARMOR_HEADER,
  ARMOR_FOOTER,
} from "../vaultCrypto";

describe("VaultCrypto Engine - In-Browser AES-GCM-256 Client-Side Export", () => {
  const masterPassphrase = "VITACOG-omega3-protocol-2026!#UltraSecure";

  const clinicalDossierPayload = {
    patientProtocolId: "PROT-2026-NEURO-8821",
    timestamp: "2026-09-10T06:30:00.000Z",
    simulationParameters: {
      deliveryMode: "ttfd",
      doseMg: 300,
      omega3Index: 8.5,
      saturationPercentage: 88,
      membraneGateCleared: true,
      cerebralPenetration: "High (Passive Diffusion)",
    },
    biomarkerTrajectories: [
      {
        id: "holoTC",
        name: "Holotranscobalamin (Active B12)",
        baseline: 42,
        target: 125,
        unit: "pmol/L",
        status: "optimal",
        weeksToNormalization: 6,
      },
      {
        id: "tdp",
        name: "Thiamine Diphosphate (Active B1)",
        baseline: 98,
        target: 195,
        unit: "nmol/L",
        status: "optimal",
        weeksToNormalization: 4,
      },
      {
        id: "homocysteine",
        name: "Total Plasma Homocysteine",
        baseline: 14.8,
        target: 7.2,
        unit: "umol/L",
        status: "optimal",
        weeksToNormalization: 8,
      },
    ],
    sessionPreferences: {
      theme: "editorial-dark",
      contrastMode: "high-contrast-optimal",
      zeroKnowledgeAttestation: true,
      telemetryOptOut: true,
    },
  };

  describe("1. Core Encryption & Decryption Round-Trip", () => {
    it("should encrypt and decrypt a complete clinical dossier with 100% fidelity", async () => {
      const armored = await encryptVaultPayload(clinicalDossierPayload, masterPassphrase);

      expect(typeof armored).toBe("string");
      expect(armored).toContain(ARMOR_HEADER);
      expect(armored).toContain(ARMOR_FOOTER);

      const decrypted = await decryptVaultPayload<typeof clinicalDossierPayload>(
        armored,
        masterPassphrase
      );

      expect(decrypted).toEqual(clinicalDossierPayload);
      expect(decrypted.simulationParameters.deliveryMode).toBe("ttfd");
      expect(decrypted.biomarkerTrajectories).toHaveLength(3);
    });

    it("should encrypt and decrypt diverse primitive and structural data types", async () => {
      const primitives = [
        "A string with UTF-8 symbols: Ω-3, α-lipoic acid, Δ-osmolarity, 🧬",
        1337.42,
        true,
        false,
        [1, "two", { three: 3 }],
        { empty: {}, array: [] },
        null,
      ];

      for (const item of primitives) {
        const encrypted = await encryptVaultPayload(item, "simple-passphrase-test");
        const decrypted = await decryptVaultPayload(encrypted, "simple-passphrase-test");
        expect(decrypted).toEqual(item);
      }
    });

    it("should produce non-deterministic ciphertexts for identical inputs via CSPRNG salts and IVs", async () => {
      const sample = { sample: "deterministic-input-test" };
      const enc1 = await encryptVaultPayload(sample, masterPassphrase);
      const enc2 = await encryptVaultPayload(sample, masterPassphrase);

      expect(enc1).not.toBe(enc2);

      const dec1 = await decryptVaultPayload(enc1, masterPassphrase);
      const dec2 = await decryptVaultPayload(enc2, masterPassphrase);

      expect(dec1).toEqual(sample);
      expect(dec2).toEqual(sample);
    });

    it("should generate a structured .edgevault binary container adhering to all header specs", async () => {
      const armored = await encryptVaultPayload({ ping: "pong" }, masterPassphrase);
      const cleaned = armored
        .replace(ARMOR_HEADER, "")
        .replace(ARMOR_FOOTER, "")
        .replace(/\s+/g, "");

      const envelopeBytes = base64ToBytes(cleaned);
      const unpacked = unpackVaultBinary(envelopeBytes);

      expect(VAULT_MAGIC).toBe("EDGEVAUL");
      expect(unpacked.version).toBe(VAULT_VERSION);
      expect(unpacked.iterations).toBe(PBKDF2_ITERATIONS);
      expect(unpacked.salt.length).toBe(SALT_BYTE_LENGTH);
      expect(unpacked.iv.length).toBe(IV_BYTE_LENGTH);
      expect(unpacked.hmac.length).toBe(HMAC_BYTE_LENGTH);
      expect(unpacked.ciphertext.length).toBeGreaterThan(0);
    });

    it("should successfully decrypt raw base64 without armor headers/footers", async () => {
      const armored = await encryptVaultPayload({ test: "unarmored-export" }, masterPassphrase);
      const rawBase64 = armored
        .replace(ARMOR_HEADER, "")
        .replace(ARMOR_FOOTER, "")
        .trim();

      const decrypted = await decryptVaultPayload<{ test: string }>(rawBase64, masterPassphrase);
      expect(decrypted).toEqual({ test: "unarmored-export" });
    });
  });

  describe("2. Incorrect Passphrase Rejection (Zero-Knowledge Authentication)", () => {
    it("should reject decryption with completely incorrect passphrase", async () => {
      const armored = await encryptVaultPayload(clinicalDossierPayload, masterPassphrase);

      await expect(
        decryptVaultPayload(armored, "WrongPassphrase123!")
      ).rejects.toThrow(/Decryption failed.*HMAC verification failed/i);
    });

    it("should reject decryption with single-character mutated passphrase", async () => {
      const armored = await encryptVaultPayload(clinicalDossierPayload, masterPassphrase);
      const mutatedPass = masterPassphrase + "x";

      await expect(
        decryptVaultPayload(armored, mutatedPass)
      ).rejects.toThrow(/Decryption failed.*HMAC verification failed/i);
    });

    it("should reject empty or whitespace passphrase during encryption", async () => {
      await expect(encryptVaultPayload(clinicalDossierPayload, "")).rejects.toThrow(
        /Passphrase cannot be empty/i
      );
      await expect(encryptVaultPayload(clinicalDossierPayload, "   ")).rejects.toThrow(
        /Passphrase cannot be empty/i
      );
    });

    it("should reject empty or whitespace passphrase during decryption", async () => {
      const armored = await encryptVaultPayload(clinicalDossierPayload, masterPassphrase);
      await expect(decryptVaultPayload(armored, "")).rejects.toThrow(
        /Passphrase cannot be empty/i
      );
      await expect(decryptVaultPayload(armored, "   ")).rejects.toThrow(
        /Passphrase cannot be empty/i
      );
    });

    it("should reject empty armored envelope input", async () => {
      await expect(decryptVaultPayload("", masterPassphrase)).rejects.toThrow(
        /Armored vault envelope cannot be empty/i
      );
    });
  });

  describe("3. Tamper Resistance & Integrity Verification", () => {
    let baseEnvelopeBytes: Uint8Array;

    beforeEach(async () => {
      const armored = await encryptVaultPayload(clinicalDossierPayload, masterPassphrase);
      const cleaned = armored
        .replace(ARMOR_HEADER, "")
        .replace(ARMOR_FOOTER, "")
        .replace(/\s+/g, "");
      baseEnvelopeBytes = base64ToBytes(cleaned);
    });

    it("should detect and reject tampering in ciphertext payload (bit flip)", async () => {
      const tampered = new Uint8Array(baseEnvelopeBytes);
      // Ciphertext starts at byte 73
      const ctIndex = tampered.length - 1;
      tampered[ctIndex] ^= 0x01; // flip 1 bit

      const armoredTampered = `${ARMOR_HEADER}\n${bytesToBase64(tampered)}\n${ARMOR_FOOTER}`;
      await expect(decryptVaultPayload(armoredTampered, masterPassphrase)).rejects.toThrow(
        /tampered vault envelope|HMAC verification failed/i
      );
    });

    it("should detect and reject tampering in the 12-byte IV", async () => {
      const tampered = new Uint8Array(baseEnvelopeBytes);
      // IV is at bytes [29..41]
      tampered[29] ^= 0x01;

      const armoredTampered = `${ARMOR_HEADER}\n${bytesToBase64(tampered)}\n${ARMOR_FOOTER}`;
      await expect(decryptVaultPayload(armoredTampered, masterPassphrase)).rejects.toThrow(
        /tampered vault envelope|HMAC verification failed/i
      );
    });

    it("should detect and reject tampering in the 16-byte Salt", async () => {
      const tampered = new Uint8Array(baseEnvelopeBytes);
      // Salt is at bytes [13..29]
      tampered[13] ^= 0x01;

      const armoredTampered = `${ARMOR_HEADER}\n${bytesToBase64(tampered)}\n${ARMOR_FOOTER}`;
      await expect(decryptVaultPayload(armoredTampered, masterPassphrase)).rejects.toThrow(
        /tampered vault envelope|HMAC verification failed/i
      );
    });

    it("should detect and reject tampering in the 32-byte HMAC signature", async () => {
      const tampered = new Uint8Array(baseEnvelopeBytes);
      // HMAC is at bytes [41..73]
      tampered[41] ^= 0x01;

      const armoredTampered = `${ARMOR_HEADER}\n${bytesToBase64(tampered)}\n${ARMOR_FOOTER}`;
      await expect(decryptVaultPayload(armoredTampered, masterPassphrase)).rejects.toThrow(
        /tampered vault envelope|HMAC verification failed/i
      );
    });

    it("should reject envelope with invalid MAGIC bytes", async () => {
      const tampered = new Uint8Array(baseEnvelopeBytes);
      tampered[0] = 0x58; // 'X' instead of 'E'

      const armoredTampered = `${ARMOR_HEADER}\n${bytesToBase64(tampered)}\n${ARMOR_FOOTER}`;
      await expect(decryptVaultPayload(armoredTampered, masterPassphrase)).rejects.toThrow(
        /unrecognized magic header/i
      );
    });

    it("should reject envelope with unsupported VERSION", async () => {
      const tampered = new Uint8Array(baseEnvelopeBytes);
      tampered[8] = 99; // Version 99

      const armoredTampered = `${ARMOR_HEADER}\n${bytesToBase64(tampered)}\n${ARMOR_FOOTER}`;
      await expect(decryptVaultPayload(armoredTampered, masterPassphrase)).rejects.toThrow(
        /Unsupported vault envelope version/i
      );
    });

    it("should reject truncated or incomplete envelopes", async () => {
      // Minimum is 89 bytes
      const truncated = baseEnvelopeBytes.subarray(0, 40);
      const armoredTruncated = `${ARMOR_HEADER}\n${bytesToBase64(truncated)}\n${ARMOR_FOOTER}`;

      await expect(decryptVaultPayload(armoredTruncated, masterPassphrase)).rejects.toThrow(
        /shorter than minimum required/i
      );
    });

    it("should reject corrupted or non-base64 input string", async () => {
      const corrupted = `${ARMOR_HEADER}\n!@#$%^&*()_NOT_VALID_BASE64\n${ARMOR_FOOTER}`;
      await expect(decryptVaultPayload(corrupted, masterPassphrase)).rejects.toThrow(
        /corrupted base64 encoding|shorter than minimum required/i
      );
    });
  });

  describe("4. Encoding & Utility Robustness", () => {
    it("should round-trip binary byte conversion accurately", () => {
      const randomData = new Uint8Array([0, 1, 2, 253, 254, 255, 42, 99, 128]);
      const b64 = bytesToBase64(randomData);
      const restored = base64ToBytes(b64);

      expect(restored).toEqual(randomData);
    });

    it("should verify constant-time integrity across multiple iterations", async () => {
      const largeBiomarkerArray = Array.from({ length: 50 }, (_, i) => ({
        index: i,
        name: `Biomarker-Gene-${i}`,
        concentration: Math.sin(i) * 100 + 150,
        fluxRate: Math.cos(i) * 12,
      }));

      const armored = await encryptVaultPayload({ data: largeBiomarkerArray }, masterPassphrase);
      const decrypted = await decryptVaultPayload<{ data: typeof largeBiomarkerArray }>(
        armored,
        masterPassphrase
      );

      expect(decrypted.data).toHaveLength(50);
      expect(decrypted.data[25].name).toBe("Biomarker-Gene-25");
    });
  });
});

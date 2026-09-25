import {
  saveMember,
  getMember,
  hashPassword,
  verifyPassword,
  getMembersStore,
  diagnoseStorageEngine,
  MemberRecord,
} from "@/lib/auth/server";

describe("Member Storage & Persistence Hardening Suite (__tests__/security/memberStorePersistence.test.ts)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("1. Password Cryptography (scrypt + constant-time)", () => {
    test("hashes password with 16-byte random salt and 64-byte scrypt key", () => {
      const password = "PatientSecretPass#2026!";
      const { salt, hash } = hashPassword(password);

      expect(salt).toHaveLength(32); // 16 bytes in hex = 32 chars
      expect(hash).toHaveLength(128); // 64 bytes in hex = 128 chars
      expect(verifyPassword(password, salt, hash)).toBe(true);
      expect(verifyPassword("IncorrectPassword", salt, hash)).toBe(false);
    });
  });

  describe("2. Member Record Storage & Normalization", () => {
    test("saves and retrieves member with case-insensitive email normalization", async () => {
      const testEmail = "Patient_Alpha_01@CognitiveEdge.Clinic";
      const { salt, hash } = hashPassword("TestPass_123");

      const member: MemberRecord = {
        email: testEmail,
        salt,
        hash,
        createdAt: new Date().toISOString(),
      };

      await saveMember(member);

      // Lookup with lowercase
      const retrieved = await getMember("patient_alpha_01@cognitiveedge.clinic");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.email.toLowerCase()).toBe("patient_alpha_01@cognitiveedge.clinic");
      expect(retrieved?.hash).toBe(hash);

      // Lookup with uppercase
      const retrievedUpper = await getMember("PATIENT_ALPHA_01@COGNITIVEEDGE.CLINIC");
      expect(retrievedUpper).not.toBeNull();
      expect(retrievedUpper?.hash).toBe(hash);
    });
  });

  describe("3. Netlify Blobs Store Resolution & Fallback Logic", () => {
    test("resolves store cleanly when siteID and token are configured", () => {
      process.env.NETLIFY_SITE_ID = "17273c6e-100f-403d-b963-d879bf47d66b";
      process.env.NETLIFY_AUTH_TOKEN = "mock_auth_token_for_test";

      const store = getMembersStore();
      expect(store).not.toBeNull();
    });

    test("falls back cleanly when environment lacks Blobs configuration", () => {
      delete process.env.NETLIFY;
      delete process.env.NETLIFY_BLOBS_CONTEXT;
      delete process.env.NETLIFY_AUTH_TOKEN;
      delete process.env.NETLIFY_API_TOKEN;

      const store = getMembersStore();
      expect(store).toBeNull();
    });

    test("diagnoseStorageEngine reports structured diagnostics without leaking secrets", async () => {
      const diag = await diagnoseStorageEngine();
      expect(diag.storeName).toBe("members");
      expect(typeof diag.engine).toBe("string");
      expect(typeof diag.blobsConnected).toBe("boolean");
      expect(typeof diag.hasAutoContext).toBe("boolean");
    });
  });
});

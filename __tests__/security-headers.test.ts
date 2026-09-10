import { GET as healthGET } from "@/app/api/health/route";

describe("Production Edge Security & Zero-ePHI Health Check (/api/health)", () => {
  const originalEnv = process.env;
  const dummyCalSecret = "cal_webhook_secret_super_confidential_998877";
  const dummySpruceKey = "spruce_live_api_key_confidential_665544";
  const dummyStripeKey = "stripe_sk_live_confidential_112233";

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      CALCOM_WEBHOOK_SECRET: dummyCalSecret,
      SPRUCE_API_KEY: dummySpruceKey,
      STRIPE_SECRET_KEY: dummyStripeKey,
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("Test Case 1: Health endpoint returns HTTP 200 with sanitized status booleans", async () => {
    const response = await healthGET();
    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.status).toBe("healthy");
    expect(body.quarantine).toBe("ZERO_ePHI_ENFORCED");
    expect(body.integrations).toBeDefined();

    // Verify all integrations are pure booleans
    expect(typeof body.integrations.calcom).toBe("boolean");
    expect(typeof body.integrations.spruce).toBe("boolean");
    expect(typeof body.integrations.stripe).toBe("boolean");
    expect(typeof body.integrations.ecw_portal).toBe("boolean");

    expect(body.integrations.calcom).toBe(true);
    expect(body.integrations.spruce).toBe(true);
    expect(body.integrations.stripe).toBe(true);
    expect(body.integrations.ecw_portal).toBe(true);

    expect(typeof body.uptime).toBe("number");
    expect(typeof body.timestamp).toBe("string");
  });

  test("Test Case 2: Health endpoint contains zero cleartext secrets or ePHI fields", async () => {
    const response = await healthGET();
    const body = await response.json();
    const rawJsonString = JSON.stringify(body);

    // Assert raw secrets never leak into response
    expect(rawJsonString).not.toContain(dummyCalSecret);
    expect(rawJsonString).not.toContain(dummySpruceKey);
    expect(rawJsonString).not.toContain(dummyStripeKey);

    // Assert no ePHI keys exist
    const forbiddenKeys = [
      "patient",
      "mrn",
      "ssn",
      "dob",
      "medicalRecord",
      "diagnosis",
      "prescription",
      "chart",
    ];

    for (const key of forbiddenKeys) {
      expect(rawJsonString.toLowerCase()).not.toContain(`"${key.toLowerCase()}"`);
    }
  });

  test("Test Case 3: Missing environment secrets gracefully report false without crashing", async () => {
    delete process.env.CALCOM_WEBHOOK_SECRET;
    delete process.env.SPRUCE_API_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    const response = await healthGET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.integrations.calcom).toBe(false);
    expect(body.integrations.spruce).toBe(false);
    expect(body.integrations.stripe).toBe(false);
    expect(body.integrations.ecw_portal).toBe(true);
  });
});

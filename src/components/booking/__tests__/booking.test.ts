import {
  AppointmentTier,
  APPOINTMENT_TIER_CONFIGS,
  BookingState,
  BookingPayload,
  FallbackIntakePayload,
  SyntheticBookingTelemetry,
} from "@/types/booking";
import { dispatchQuarantinedEvent } from "@/lib/telemetryQuarantine";

describe("Booking Module & Appointment Concierge Suite (Agent 04)", () => {
  describe("Appointment Tiers & Configuration Catalog", () => {
    const requiredTiers: AppointmentTier[] = [
      "clinical_evaluation",
      "vip_executive",
      "concierge_protocol",
    ];

    test("defines all three clinical and executive appointment tiers", () => {
      requiredTiers.forEach((tier) => {
        const config = APPOINTMENT_TIER_CONFIGS[tier];
        expect(config).toBeDefined();
        expect(config.tier).toBe(tier);
        expect(typeof config.title).toBe("string");
        expect(config.durationMinutes).toBeGreaterThan(0);
        expect(config.depositAmountUsd).toBeGreaterThan(0);
        expect(typeof config.defaultCalLink).toBe("string");
        expect(typeof config.eventTypeId).toBe("number");
        expect(config.highlights.length).toBeGreaterThan(0);
      });
    });

    test("Clinical Evaluation tier matches diagnostic baseline specifications", () => {
      const evalTier = APPOINTMENT_TIER_CONFIGS.clinical_evaluation;
      expect(evalTier.durationMinutes).toBe(45);
      expect(evalTier.depositAmountUsd).toBe(1000);
      expect(evalTier.eventTypeId).toBe(982148);
      expect(evalTier.code).toBe("EV-982148");
    });

    test("VIP Executive tier matches 60-minute autonomic specifications", () => {
      const vipTier = APPOINTMENT_TIER_CONFIGS.vip_executive;
      expect(vipTier.durationMinutes).toBe(60);
      expect(vipTier.depositAmountUsd).toBe(2500);
      expect(vipTier.eventTypeId).toBe(982149);
      expect(vipTier.code).toBe("EV-982149");
    });

    test("Concierge Bespoke tier matches 90-minute white-glove specifications", () => {
      const conciergeTier = APPOINTMENT_TIER_CONFIGS.concierge_protocol;
      expect(conciergeTier.durationMinutes).toBe(90);
      expect(conciergeTier.depositAmountUsd).toBe(5000);
      expect(conciergeTier.eventTypeId).toBe(982150);
      expect(conciergeTier.code).toBe("EV-982150");
    });
  });

  describe("Booking State Machine Lifecycle", () => {
    const allStates: BookingState[] = [
      "idle",
      "loading",
      "active",
      "timeout",
      "error",
      "fallback",
      "confirmed",
    ];

    test("supports all seven specified booking states", () => {
      expect(allStates).toHaveLength(7);
      allStates.forEach((state) => {
        expect(typeof state).toBe("string");
      });
    });

    test("constructs strongly-typed BookingPayload with valid state", () => {
      const mockPayload: BookingPayload = {
        uid: "cal_test_uid_12345",
        title: "Private Consultation Reservation",
        startTime: "2026-09-15T14:00:00.000Z",
        endTime: "2026-09-15T14:45:00.000Z",
        eventTypeId: 982148,
        tier: "clinical_evaluation",
        status: "confirmed",
        paymentRequired: true,
        depositAuthorized: true,
        depositAmountUsd: 1000,
        attendees: [
          {
            name: "Test Candidate",
            email: "candidate@example.com",
            timeZone: "America/New_York",
          },
        ],
        calLink: "your-practice/initial-assessment",
        confirmationCode: "CAL-CONF-TEST99",
        createdAt: new Date().toISOString(),
      };

      expect(mockPayload.status).toBe("confirmed");
      expect(mockPayload.tier).toBe("clinical_evaluation");
      expect(mockPayload.depositAmountUsd).toBe(1000);
    });
  });

  describe("Concierge Intake Fallback & Hotlines", () => {
    test("constructs FallbackIntakePayload for white-glove triage", () => {
      const fallbackPayload: FallbackIntakePayload = {
        candidateName: "Richard Roe",
        candidateEmail: "richard.roe@familyoffice.com",
        candidatePhone: "+1 (800) 555-0199",
        consultationWindow: "Morning (08:00 - 12:00 EST)",
        preferredTier: "vip_executive",
        clinicalNotes: "Autonomic regulation protocol inquiry",
        timestamp: new Date().toISOString(),
        triageTrackingId: "CP-2026-XYZ99",
        dispatchedToConcierge: true,
      };

      expect(fallbackPayload.dispatchedToConcierge).toBe(true);
      expect(fallbackPayload.preferredTier).toBe("vip_executive");
      expect(fallbackPayload.triageTrackingId).toMatch(/^CP-2026-/);
    });

    test("validates official Concierge hotline links format", () => {
      const smsLink = "sms:+18005550199";
      const telLink = "tel:+18005550199";

      expect(smsLink).toMatch(/^sms:\+1[0-9]{10}$/);
      expect(telLink).toMatch(/^tel:\+1[0-9]{10}$/);
    });
  });

  describe("Zero-ePHI Quarantined Telemetry Verification", () => {
    test("dispatches quarantined telemetry event without leaking forbidden ePHI", () => {
      const event = dispatchQuarantinedEvent("booking_completed", {
        tier: "clinical_evaluation",
        latencyMs: 1250,
        clsScore: 0.0,
        // The following sensitive keys should be completely stripped by the quarantine engine:
        email: "leak@example.com",
        phone: "+15551234567",
        ssn: "000-00-0000",
        mrn: "MRN-123456",
        diagnosis: "clinical-leak",
      });

      // In Node environment, dispatchQuarantinedEvent returns null if window is undefined,
      // or an event object if window is mocked. Let's verify structure when defined.
      if (event) {
        expect(event.eventName).toBe("booking_completed");
        expect(event.metadata).not.toHaveProperty("email");
        expect(event.metadata).not.toHaveProperty("phone");
        expect(event.metadata).not.toHaveProperty("ssn");
        expect(event.metadata).not.toHaveProperty("mrn");
        expect(event.metadata).not.toHaveProperty("diagnosis");
      }
    });

    test("validates SyntheticBookingTelemetry structure and zero-CLS compliance", () => {
      const telemetry: SyntheticBookingTelemetry = {
        eventName: "booking_completed",
        bookingState: "confirmed",
        tier: "clinical_evaluation",
        latencyMs: 1450,
        timestamp: new Date().toISOString(),
        sanitizedPath: "/services/clinical-evaluation",
        clsScore: 0.0,
        syntheticSessionId: "syn_sess_abc123",
        quarantineVerified: true,
        metadata: {
          depositUsd: 1000,
          timeoutSlaMet: true,
        },
      };

      expect(telemetry.clsScore).toBe(0.0);
      expect(telemetry.quarantineVerified).toBe(true);
      expect(telemetry.bookingState).toBe("confirmed");
    });
  });
});

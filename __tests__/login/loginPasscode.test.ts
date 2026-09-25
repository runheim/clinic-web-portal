import React from "react";
import { renderToString } from "react-dom/server";
import MemberLoginGateway, {
  isPasscodeLengthValid,
  getPasscodeFeedback,
} from "@/app/login/page";

// Mock next/navigation for Node SSR / Jest test environment
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
}));

describe("MemberLoginGateway — Passcode UI & Validation Hardening Suite", () => {
  let renderedHtml: string;

  beforeAll(() => {
    renderedHtml = renderToString(React.createElement(MemberLoginGateway));
  });

  describe("Password Visibility Toggle UI", () => {
    test("renders the passcode input initially with type='password'", () => {
      expect(renderedHtml).toContain('id="password"');
      expect(renderedHtml).toContain('type="password"');
    });

    test("renders the password visibility toggle button with accessible aria-label", () => {
      expect(renderedHtml).toContain('aria-label="Show passcode"');
      expect(renderedHtml).toContain('data-testid="toggle-passcode-visibility"');
    });

    test("renders SVG eye icon within the toggle button matching luxury theme", () => {
      expect(renderedHtml).toContain("<svg");
      expect(renderedHtml).toContain('stroke="currentColor"');
      // SVG path definition for the eye icon
      expect(renderedHtml).toContain("M2.036 12.322");
    });
  });

  describe("Minimum 6 Characters Notification Message", () => {
    test("renders default notification message beneath passcode input in initial state", () => {
      expect(renderedHtml).toContain('data-testid="passcode-length-feedback"');
      expect(renderedHtml).toContain("• Passcode must be a minimum of 6 characters");
    });

    test("provides real-time empty state helper text when password is empty", () => {
      const feedback = getPasscodeFeedback("");
      expect(feedback.isValid).toBe(false);
      expect(feedback.variant).toBe("empty");
      expect(feedback.message).toBe("• Passcode must be a minimum of 6 characters");
    });

    test("provides real-time warning feedback when password length is between 1 and 5 characters", () => {
      for (let len = 1; len <= 5; len++) {
        const testPass = "a".repeat(len);
        const feedback = getPasscodeFeedback(testPass);
        expect(feedback.isValid).toBe(false);
        expect(feedback.variant).toBe("warning");
        expect(feedback.message).toBe(
          `⚠ Passcode must be at least 6 characters (currently ${len})`
        );
      }
    });

    test("provides real-time valid feedback when password length is 6 or more characters", () => {
      const lengths = [6, 7, 10, 16, 20];
      for (const len of lengths) {
        const testPass = "a".repeat(len);
        const feedback = getPasscodeFeedback(testPass);
        expect(feedback.isValid).toBe(true);
        expect(feedback.variant).toBe("valid");
        expect(feedback.message).toBe("✓ Minimum length satisfied (6+ characters)");
      }
    });
  });

  describe("Passcode Length Acceptance & Validation Enforcement", () => {
    test("rejects password lengths strictly below 6 characters", () => {
      expect(isPasscodeLengthValid("")).toBe(false);
      expect(isPasscodeLengthValid("a")).toBe(false);
      expect(isPasscodeLengthValid("12")).toBe(false);
      expect(isPasscodeLengthValid("abc")).toBe(false);
      expect(isPasscodeLengthValid("test1")).toBe(false);
    });

    test("accepts password length >= 6 characters", () => {
      // Exactly 6 characters boundary
      expect(isPasscodeLengthValid("123456")).toBe(true);
      expect(isPasscodeLengthValid("abcdef")).toBe(true);

      // More than 6 characters
      expect(isPasscodeLengthValid("securePassword123")).toBe(true);
    });

    test("accepts Demo Standard and Demo VIP credentials which satisfy >= 6 characters", () => {
      const demoStandardPasscode = "CognitiveEdge$2026";
      const demoVipPasscode = "CognitiveVIP$2026";

      expect(demoStandardPasscode.length).toBeGreaterThanOrEqual(6);
      expect(isPasscodeLengthValid(demoStandardPasscode)).toBe(true);
      expect(getPasscodeFeedback(demoStandardPasscode).isValid).toBe(true);

      expect(demoVipPasscode.length).toBeGreaterThanOrEqual(6);
      expect(isPasscodeLengthValid(demoVipPasscode)).toBe(true);
      expect(getPasscodeFeedback(demoVipPasscode).isValid).toBe(true);
    });
  });
});

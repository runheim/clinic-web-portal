/**
 * Core Booking & Appointment Concierge Type Definitions
 * Strict Zero-ePHI Isolation & Synthetic Telemetry Enforcement
 */

/**
 * High-tier clinical and executive appointment categories.
 */
export type AppointmentTier =
  | "clinical_evaluation"
  | "vip_executive"
  | "concierge_protocol";

/**
 * State machine phases for the Cal.com embedded scheduler.
 */
export type BookingState =
  | "idle"
  | "loading"
  | "active"
  | "timeout"
  | "error"
  | "fallback"
  | "confirmed";

/**
 * Metadata configuration for each clinical appointment tier.
 */
export interface AppointmentTierConfig {
  readonly tier: AppointmentTier;
  readonly code: string;
  readonly label: string;
  readonly title: string;
  readonly subtitle: string;
  readonly durationMinutes: number;
  readonly depositAmountUsd: number;
  readonly defaultCalLink: string;
  readonly eventTypeId: number;
  readonly description: string;
  readonly highlights: readonly string[];
  readonly badgeText: string;
}

/**
 * Catalog of appointment tier configurations matching Figma specifications.
 */
export const APPOINTMENT_TIER_CONFIGS: Record<AppointmentTier, AppointmentTierConfig> = {
  clinical_evaluation: {
    tier: "clinical_evaluation",
    code: "EV-982148",
    label: "Clinical Diagnostic Evaluation",
    title: "Private Consultation Reservation",
    subtitle: "Comprehensive 45-Minute Diagnostic Consultation & Baseline Mapping • Dr. David Andreas Runheim, MD",
    durationMinutes: 45,
    depositAmountUsd: 1000,
    defaultCalLink: "your-practice/initial-assessment",
    eventTypeId: 982148,
    description: "In-depth clinical neuro-diagnostic assessment, baseline biomarkers, and quantitative cognitive mapping.",
    highlights: [
      "Multi-omic & neuro-functional review",
      "Quantitative baseline cognitive metrics",
      "Direct consultation with Chief Medical Officer",
    ],
    badgeText: "Template #982148 • Neuro-Diagnostic Baseline",
  },
  vip_executive: {
    tier: "vip_executive",
    code: "EV-982149",
    label: "VIP Executive Protocol",
    title: "Executive Autonomic & Performance Optimization",
    subtitle: "60-Minute Autonomic Regulation, Epigenetic Review & Performance Synthesis",
    durationMinutes: 60,
    depositAmountUsd: 2500,
    defaultCalLink: "your-practice/vip-executive",
    eventTypeId: 982149,
    description: "Tailored autonomic optimization and accelerated telemetry synthesis for executive longevity protocols.",
    highlights: [
      "Direct priority concierge intake routing",
      "Metabolic & molecular biomarker mapping",
      "Extended 1-on-1 clinician baseline synthesis",
    ],
    badgeText: "Template #982149 • Executive Longevity",
  },
  concierge_protocol: {
    tier: "concierge_protocol",
    code: "EV-982150",
    label: "Concierge Bespoke Protocol",
    title: "White-Glove Longevity Immersion & Care Concierge",
    subtitle: "90-Minute Full-Spectrum Diagnostics, Dedicated Care Navigator & Priority Hotline",
    durationMinutes: 90,
    depositAmountUsd: 5000,
    defaultCalLink: "your-practice/concierge-protocol",
    eventTypeId: 982150,
    description: "Full white-glove clinical immersion with 24/7 dedicated care navigation and expedited protocol execution.",
    highlights: [
      "Direct tele-desk & dedicated SMS triage channel",
      "Same-day clinical review guarantee",
      "Custom multi-modality therapeutic roadmap",
    ],
    badgeText: "Template #982150 • White-Glove Concierge",
  },
};

/**
 * Attendee metadata captured during booking.
 * Note: Zero-ePHI policy mandates administrative contact data only.
 */
export interface BookingAttendee {
  name?: string;
  email?: string;
  phoneNumber?: string;
  timeZone?: string;
}

/**
 * Strongly-typed booking payload produced upon successful appointment reservation.
 */
export interface BookingPayload {
  uid?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  eventTypeId?: number | null;
  tier: AppointmentTier;
  status: BookingState;
  paymentRequired?: boolean;
  depositAuthorized?: boolean;
  depositAmountUsd?: number;
  attendees: BookingAttendee[];
  videoCallUrl?: string;
  calLink: string;
  notes?: string;
  confirmationCode?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Ephemeral Concierge Intake form payload for fail-safe dispatch.
 */
export interface FallbackIntakePayload {
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  consultationWindow: string;
  preferredTier: AppointmentTier;
  clinicalNotes?: string;
  timestamp: string;
  triageTrackingId: string;
  dispatchedToConcierge: boolean;
}

/**
 * Synthetic telemetry event types for booking pipeline observability.
 */
export type BookingTelemetryAction =
  | "booking_session_started"
  | "booking_tier_selected"
  | "booking_iframe_mount"
  | "booking_iframe_loaded"
  | "booking_timeout_triggered"
  | "booking_fallback_engaged"
  | "booking_fallback_submitted"
  | "booking_completed"
  | "booking_error_encountered";

/**
 * Anonymized, quarantined telemetry event structure.
 * Guaranteed zero-ePHI: strictly records operational latency, layout shift, tier, and synthetic IDs.
 */
export interface SyntheticBookingTelemetry {
  eventName: BookingTelemetryAction;
  bookingState: BookingState;
  tier: AppointmentTier;
  latencyMs?: number;
  timestamp: string;
  sanitizedPath: string;
  clsScore: number;
  syntheticSessionId: string;
  quarantineVerified: boolean;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Props for the CalComEmbed component.
 */
export interface CalComEmbedProps {
  /** Selected appointment tier. Defaults to 'clinical_evaluation' */
  tier?: AppointmentTier;
  /** Custom Cal link override (defaults to the tier's defaultCalLink) */
  calLink?: string;
  /** Timeout threshold in milliseconds before switching or offering fallback (default: 3000ms) */
  timeoutMs?: number;
  /** Additional CSS class names for the outer container */
  className?: string;
  /** Whether to show the tier switcher tabs */
  showTierSelector?: boolean;
  /** Whether to render the status & deposit banner */
  showStatusBanner?: boolean;
  /** Callback fired whenever the booking state transitions */
  onStateChange?: (state: BookingState) => void;
  /** Callback fired upon verified booking completion */
  onBookingComplete?: (payload: BookingPayload) => void;
  /** Callback fired when the fallback intake drawer is triggered or engaged */
  onFallbackTriggered?: () => void;
  /** Concierge emergency hotline phone number link (defaults to "tel:+18005550199") */
  conciergePhone?: string;
  /** Concierge SMS hotline link (defaults to "sms:+18005550199") */
  conciergeSms?: string;
  /** Pre-fill information for the attendee if available */
  prefill?: {
    name?: string;
    email?: string;
    notes?: string;
  };
}

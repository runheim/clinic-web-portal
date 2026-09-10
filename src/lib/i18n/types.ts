/**
 * Longevity Localization (i18n) Type Definitions
 * Strict Zero-Client-Bundle & Zero-ePHI Isolation Enclave
 */

export type Locale = "en" | "sv" | "de-CH";

export interface ModalityEntry {
  readonly title: string;
  readonly subtitle: string;
  readonly tagline: string;
  readonly abstract: string;
  readonly clinicalCadence: string;
  readonly deliveryMethod: string;
}

export interface FeeTierEntry {
  readonly code: string;
  readonly label: string;
  readonly title: string;
  readonly subtitle: string;
  readonly duration: string;
  readonly deposit: string;
  readonly description: string;
  readonly highlights: readonly string[];
  readonly badgeText: string;
}

export interface SafetyGateEntry {
  readonly title: string;
  readonly condition: string;
  readonly action: string;
  readonly rationale: string;
}

export interface Dictionary {
  readonly meta: {
    readonly locale: Locale;
    readonly localeName: string;
    readonly language: string;
    readonly region: string;
    readonly clinicalDialect: string;
  };
  readonly navigation: {
    readonly brandName: string;
    readonly brandTagline: string;
    readonly services: string;
    readonly ledger: string;
    readonly briefings: string;
    readonly membership: string;
    readonly biographies: string;
    readonly diagnosticVault: string;
    readonly intakeAssessment: string;
    readonly memberLogin: string;
    readonly clientPortal: string;
    readonly search: string;
    readonly searchAria: string;
    readonly portalGateway: string;
    readonly spruceRelay: string;
    readonly systemStatus: string;
  };
  readonly modalities: {
    readonly tmsNeuromodulation: ModalityEntry;
    readonly subcutaneousPeptides: ModalityEntry;
    readonly btlEmsella: ModalityEntry;
    readonly cerebralPhotobiomodulation: ModalityEntry;
    readonly glp1MetabolicOptimization: ModalityEntry;
    readonly mitochondrialBioenergetics: ModalityEntry;
    readonly bdnfSynapticPreservation: ModalityEntry;
  };
  readonly feeTiers: {
    readonly clinicalEvaluation: FeeTierEntry;
    readonly vipExecutive: FeeTierEntry;
    readonly conciergeProtocol: FeeTierEntry;
    readonly depositPolicy: string;
    readonly cancellationPolicy: string;
    readonly superbillNotice: string;
  };
  readonly disclaimers: {
    readonly educationalNoticeTitle: string;
    readonly educationalNotice: string;
    readonly safeHarborTitle: string;
    readonly safeHarborNotice: string;
    readonly outOfNetworkTitle: string;
    readonly outOfNetworkNotice: string;
    readonly fdaDisclaimerTitle: string;
    readonly fdaDisclaimerNotice: string;
    readonly safetyGatesTitle: string;
    readonly safetyGatesSubtitle: string;
    readonly gates: {
      readonly nadOncologyLock: SafetyGateEntry;
      readonly b6NeuropathyCeiling: SafetyGateEntry;
      readonly tmsFerromagneticLock: SafetyGateEntry;
      readonly anticoagulantAuditing: SafetyGateEntry;
    };
  };
  readonly triage: {
    readonly drawerTitle: string;
    readonly drawerSubtitle: string;
    readonly latencyGuardNotice: string;
    readonly whiteGloveHeader: string;
    readonly directSms: string;
    readonly callTeleDesk: string;
    readonly hotlineNotice: string;
    readonly hotlineNumber: string;
    readonly categoryLabel: string;
    readonly fields: {
      readonly fullName: string;
      readonly fullNamePlaceholder: string;
      readonly email: string;
      readonly emailPlaceholder: string;
      readonly phone: string;
      readonly phonePlaceholder: string;
      readonly consultationWindow: string;
      readonly clinicalNotes: string;
      readonly clinicalNotesPlaceholder: string;
    };
    readonly windows: {
      readonly morning: string;
      readonly afternoon: string;
      readonly evening: string;
      readonly urgent: string;
    };
    readonly confirmation: {
      readonly badge: string;
      readonly title: string;
      readonly descriptionTemplate: string;
      readonly dispatchReferenceLabel: string;
      readonly consultationWindowLabel: string;
      readonly depositAuthorizationLabel: string;
      readonly depositAmountTemplate: string;
      readonly directHotlineLabel: string;
      readonly smsConfirmButton: string;
      readonly callButton: string;
      readonly newReservationButton: string;
    };
    readonly actions: {
      readonly submit: string;
      readonly returnToCalendar: string;
    };
    readonly footerNotice: string;
  };
  readonly zeroEphi: {
    readonly badge: string;
    readonly banner: string;
    readonly statusActive: string;
    readonly quarantineTitle: string;
    readonly quarantineDescription: string;
    readonly ephemeralStateTitle: string;
    readonly ephemeralStateNotice: string;
    readonly hipaaAttestation: string;
    readonly soc2Attestation: string;
    readonly auditStatusPass: string;
    readonly clientIsolationNotice: string;
  };
  readonly ui: {
    readonly buttons: {
      readonly bookConsultation: string;
      readonly initiateIntake: string;
      readonly viewMembership: string;
      readonly close: string;
      readonly back: string;
      readonly next: string;
      readonly submit: string;
      readonly loading: string;
      readonly cancel: string;
      readonly retry: string;
    };
    readonly status: {
      readonly active: string;
      readonly verified: string;
      readonly locked: string;
      readonly pending: string;
      readonly quarantined: string;
    };
    readonly labels: {
      readonly durationMinutes: string;
      readonly depositAmount: string;
      readonly priorityAssistance: string;
      readonly confidentialNotice: string;
    };
    readonly languages: {
      readonly en: string;
      readonly sv: string;
      readonly deCH: string;
    };
  };
}

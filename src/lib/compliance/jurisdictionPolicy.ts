export const HEADER_JURISDICTION = 'x-clinic-jurisdiction';
export const HEADER_TELEHEALTH_ELIGIBLE = 'x-clinic-telehealth-eligible';

export type JurisdictionTier = 'NC_CLINICAL' | 'US_EDUCATIONAL' | 'GLOBAL_ADVISORY';

export interface LicensureDisclosure {
  licensingBody: string;
  licensureState: string;
  physicianPatientRelationship: boolean;
  prescriptiveAuthority: boolean;
}

export interface Disclaimers {
  primary: string;
  telehealth: string;
  prescriptions: string;
  emergencyNotice: string;
}

export interface FeeMatrixAdjustments {
  hsaFsaEligible: boolean;
  salesTaxApplicable?: boolean;
  taxJurisdictionClassification?: string;
  billingCategory: string;
}

export interface JurisdictionProfile {
  tier: JurisdictionTier;
  jurisdiction: JurisdictionTier;
  isHomeState: boolean;
  telehealthEligible: boolean;
  telehealthHeaderValue: '1' | '0';
  countryCode: string | null;
  subdivisionCode: string | null;
  mode: 'clinical' | 'educational' | 'restricted';
  title: string;
  disclaimer: string;
  authorizationScope: string[];
  authorizedServices: string[];
  licensureDisclosure: LicensureDisclosure;
  disclaimers: Disclaimers;
  feeMatrixAdjustments: FeeMatrixAdjustments;
}

export const JURISDICTION_TEMPLATES = Object.freeze({
  NC_CLINICAL: Object.freeze({
    tier: 'NC_CLINICAL' as JurisdictionTier,
    jurisdiction: 'NC_CLINICAL' as JurisdictionTier,
    title: 'North Carolina Clinical Enclave',
    disclaimer: 'Direct clinical consultation and diagnostic ordering available within North Carolina.',
    mode: 'clinical' as const,
    isHomeState: true,
    telehealthEligible: true,
    telehealthHeaderValue: '1' as const,
    authorizationScope: Object.freeze([
      'direct medical diagnosis',
      'neuro-metabolic interventions',
      'clinical in-office/telemedicine consultations',
    ]),
    authorizedServices: Object.freeze([
      'Direct Medical Diagnosis',
      'Neuro-Metabolic Interventions',
      'Clinical Telemedicine Consultations',
    ]),
    licensureDisclosure: Object.freeze({
      licensingBody: 'North Carolina Medical Board (NCMB)',
      licensureState: 'NC',
      physicianPatientRelationship: true,
      prescriptiveAuthority: true,
    }),
    disclaimers: Object.freeze({
      primary: 'Direct clinical practice under North Carolina Medical Board (NCMB) jurisdiction.',
      telehealth: 'Clinical telemedicine authorized within the State of North Carolina.',
      prescriptions: 'Full prescriptive authority under North Carolina medical licensure.',
      emergencyNotice: 'If experiencing an acute emergency, dial 911 immediately.',
    }),
    feeMatrixAdjustments: Object.freeze({
      hsaFsaEligible: true,
      salesTaxApplicable: false,
      billingCategory: 'CLINICAL_MEDICAL_SERVICES',
    }),
  }),
  US_EDUCATIONAL: Object.freeze({
    tier: 'US_EDUCATIONAL' as JurisdictionTier,
    jurisdiction: 'US_EDUCATIONAL' as JurisdictionTier,
    title: 'Executive Educational Longevity Consultation',
    disclaimer: 'Out-of-state clinical inquiries are routed to Executive Educational Longevity Consultation in compliance with interstate medical board regulations.',
    mode: 'educational' as const,
    isHomeState: false,
    telehealthEligible: false,
    telehealthHeaderValue: '0' as const,
    authorizationScope: Object.freeze([
      'Executive Educational Longevity Consultation',
      'biomarker protocol guidance',
      'interstate medical advisory standards',
    ]),
    authorizedServices: Object.freeze([
      'Executive Educational Longevity Consultation',
      'Biomarker Protocol Guidance',
    ]),
    licensureDisclosure: Object.freeze({
      licensingBody: 'North Carolina Medical Board (NCMB)',
      licensureState: 'NC',
      physicianPatientRelationship: false,
      prescriptiveAuthority: false,
    }),
    disclaimers: Object.freeze({
      primary: 'Consultation conducted under interstate medical advisory standards for educational purposes.',
      telehealth: 'Direct clinical telemedicine is restricted by medical licensure to North Carolina.',
      prescriptions: 'Physician does not prescribe medications outside licensed jurisdictions.',
      emergencyNotice: 'If experiencing an acute emergency, dial 911 immediately.',
    }),
    feeMatrixAdjustments: Object.freeze({
      hsaFsaEligible: false,
      salesTaxApplicable: false,
      billingCategory: 'EXECUTIVE_EDUCATIONAL_CONSULTATION',
    }),
  }),
  GLOBAL_ADVISORY: Object.freeze({
    tier: 'GLOBAL_ADVISORY' as JurisdictionTier,
    jurisdiction: 'GLOBAL_ADVISORY' as JurisdictionTier,
    title: 'Global Advisory Consultation',
    disclaimer: 'International consultations are educational and non-prescriptive.',
    mode: 'restricted' as const,
    isHomeState: false,
    telehealthEligible: false,
    telehealthHeaderValue: '0' as const,
    authorizationScope: Object.freeze([
      'Global Longevity Advisory',
      'educational briefings',
    ]),
    authorizedServices: Object.freeze([
      'Global Longevity Advisory',
      'International Executive Educational Briefings',
    ]),
    licensureDisclosure: Object.freeze({
      licensingBody: 'North Carolina Medical Board (NCMB)',
      licensureState: 'NC',
      physicianPatientRelationship: false,
      prescriptiveAuthority: false,
    }),
    disclaimers: Object.freeze({
      primary: 'International engagements constitute strictly educational briefings on neuro-metabolic science.',
      telehealth: 'Direct clinical telemedicine is not offered internationally.',
      prescriptions: 'No international prescription fulfillment or medicinal dispatch.',
      emergencyNotice: 'If experiencing an emergency, contact local emergency services (911 / 112).',
    }),
    feeMatrixAdjustments: Object.freeze({
      hsaFsaEligible: false,
      salesTaxApplicable: false,
      taxJurisdictionClassification: 'INTERNATIONAL_CROSS_BORDER_EXEMPT',
      billingCategory: 'GLOBAL_EDUCATIONAL_BRIEFING',
    }),
  }),
});

export function resolveJurisdiction(
  countryInput?: string | null,
  subdivisionInput?: string | null
): JurisdictionProfile {
  const rawCountry = typeof countryInput === 'string' ? countryInput.trim() : null;
  const rawSub = typeof subdivisionInput === 'string' ? subdivisionInput.trim() : null;

  const country = rawCountry && rawCountry.length > 0 ? rawCountry : null;
  let sub = rawSub && rawSub.length > 0 ? rawSub : null;

  if (sub) {
    const isoMatch = sub.match(/^[A-Za-z]{2}-([A-Za-z0-9]+)$/);
    if (isoMatch) {
      sub = isoMatch[1];
    }
  }

  const upperSub = sub ? sub.toUpperCase() : null;

  if (!country) {
    const tmpl = JURISDICTION_TEMPLATES.GLOBAL_ADVISORY;
    return {
      tier: 'GLOBAL_ADVISORY',
      jurisdiction: 'GLOBAL_ADVISORY',
      isHomeState: false,
      telehealthEligible: false,
      telehealthHeaderValue: '0',
      countryCode: null,
      subdivisionCode: upperSub,
      mode: tmpl.mode,
      title: tmpl.title,
      disclaimer: tmpl.disclaimer,
      authorizationScope: [...tmpl.authorizationScope],
      authorizedServices: [...tmpl.authorizedServices],
      licensureDisclosure: { ...tmpl.licensureDisclosure },
      disclaimers: { ...tmpl.disclaimers },
      feeMatrixAdjustments: { ...tmpl.feeMatrixAdjustments },
    };
  }

  const upperCountry = country.toUpperCase();
  const isUS = upperCountry === 'US' || upperCountry === 'USA';

  if (!isUS) {
    const tmpl = JURISDICTION_TEMPLATES.GLOBAL_ADVISORY;
    return {
      tier: 'GLOBAL_ADVISORY',
      jurisdiction: 'GLOBAL_ADVISORY',
      isHomeState: false,
      telehealthEligible: false,
      telehealthHeaderValue: '0',
      countryCode: upperCountry,
      subdivisionCode: upperSub,
      mode: tmpl.mode,
      title: tmpl.title,
      disclaimer: tmpl.disclaimer,
      authorizationScope: [...tmpl.authorizationScope],
      authorizedServices: [...tmpl.authorizedServices],
      licensureDisclosure: { ...tmpl.licensureDisclosure },
      disclaimers: { ...tmpl.disclaimers },
      feeMatrixAdjustments: { ...tmpl.feeMatrixAdjustments },
    };
  }

  if (upperSub === 'NC') {
    const tmpl = JURISDICTION_TEMPLATES.NC_CLINICAL;
    return {
      tier: 'NC_CLINICAL',
      jurisdiction: 'NC_CLINICAL',
      isHomeState: true,
      telehealthEligible: true,
      telehealthHeaderValue: '1',
      countryCode: 'US',
      subdivisionCode: 'NC',
      mode: tmpl.mode,
      title: tmpl.title,
      disclaimer: tmpl.disclaimer,
      authorizationScope: [...tmpl.authorizationScope],
      authorizedServices: [...tmpl.authorizedServices],
      licensureDisclosure: { ...tmpl.licensureDisclosure },
      disclaimers: { ...tmpl.disclaimers },
      feeMatrixAdjustments: { ...tmpl.feeMatrixAdjustments },
    };
  }

  const tmpl = JURISDICTION_TEMPLATES.US_EDUCATIONAL;
  return {
    tier: 'US_EDUCATIONAL',
    jurisdiction: 'US_EDUCATIONAL',
    isHomeState: false,
    telehealthEligible: false,
    telehealthHeaderValue: '0',
    countryCode: 'US',
    subdivisionCode: upperSub,
    mode: tmpl.mode,
    title: tmpl.title,
    disclaimer: tmpl.disclaimer,
    authorizationScope: [...tmpl.authorizationScope],
    authorizedServices: [...tmpl.authorizedServices],
    licensureDisclosure: { ...tmpl.licensureDisclosure },
    disclaimers: { ...tmpl.disclaimers },
    feeMatrixAdjustments: { ...tmpl.feeMatrixAdjustments },
  };
}

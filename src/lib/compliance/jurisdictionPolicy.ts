/**
 * Legal Jurisdiction & State-Level Telehealth Compliance Policy
 * 
 * Strict regulatory enforcement:
 * - Home State (NC): Full clinical medical licensure (North Carolina Medical Board - NCMB),
 *   direct medical diagnosis, neuro-metabolic interventions, and clinical in-office /
 *   telemedicine consultations.
 * - Out-of-State US: "Executive Educational Longevity Consultation" & biomarker protocol
 *   guidance under interstate medical advisory standards (non-clinical, no cross-border Rx).
 * - International: "Global Longevity Advisory" educational briefings (cross-border educational).
 */

export type JurisdictionTier = 'NC_CLINICAL' | 'US_EDUCATIONAL' | 'GLOBAL_ADVISORY';

export type TelehealthHeaderValue = '1' | '0';

export const HEADER_JURISDICTION = 'x-clinic-jurisdiction' as const;
export const HEADER_TELEHEALTH_ELIGIBLE = 'x-clinic-telehealth-eligible' as const;

export interface FeeMatrixAdjustment {
  readonly currency: string;
  readonly surchargePercent: number;
  readonly retainerAdjustmentPercent: number;
  readonly salesTaxApplicable: boolean;
  readonly vatApplicable: boolean;
  readonly taxJurisdictionClassification: string;
  readonly billingCategory: string;
  readonly hsaFsaEligible: boolean;
  readonly notes: string;
}

export interface LicensureDisclosure {
  readonly licensingBody: string;
  readonly licensureState: string;
  readonly licenseType: string;
  readonly physicianPatientRelationship: boolean;
  readonly prescriptiveAuthority: boolean;
  readonly supervisoryScope: string;
  readonly disclosureText: string;
}

export interface JurisdictionDisclaimers {
  readonly primary: string;
  readonly telehealth: string;
  readonly prescriptions: string;
  readonly emergencyNotice: string;
  readonly all: readonly string[];
}

export interface JurisdictionProfile {
  readonly tier: JurisdictionTier;
  readonly jurisdiction: JurisdictionTier;
  readonly countryCode: string | null;
  readonly subdivisionCode: string | null;
  readonly isHomeState: boolean;
  readonly telehealthEligible: boolean;
  readonly telehealthHeaderValue: TelehealthHeaderValue;
  readonly authorizationScope: string;
  readonly authorizedServices: readonly string[];
  readonly disclaimers: JurisdictionDisclaimers;
  readonly licensureDisclosure: LicensureDisclosure;
  readonly feeMatrixAdjustments: FeeMatrixAdjustment;
}

interface TierPolicyTemplate {
  readonly tier: JurisdictionTier;
  readonly isHomeState: boolean;
  readonly telehealthEligible: boolean;
  readonly telehealthHeaderValue: TelehealthHeaderValue;
  readonly authorizationScope: string;
  readonly authorizedServices: readonly string[];
  readonly disclaimers: JurisdictionDisclaimers;
  readonly licensureDisclosure: LicensureDisclosure;
  readonly feeMatrixAdjustments: FeeMatrixAdjustment;
}

const NC_POLICY_TEMPLATE: TierPolicyTemplate = {
  tier: 'NC_CLINICAL',
  isHomeState: true,
  telehealthEligible: true,
  telehealthHeaderValue: '1',
  authorizationScope:
    'Authorized for direct medical diagnosis, neuro-metabolic interventions, and clinical in-office/telemedicine consultations.',
  authorizedServices: [
    'Direct Medical Diagnosis',
    'Neuro-Metabolic Interventions',
    'Clinical In-Office Consultations',
    'Clinical Telemedicine Consultations',
    'Prescriptive Therapeutics & Controlled Oversight',
    'Diagnostic Phlebotomy & Laboratory Orders',
  ],
  disclaimers: {
    primary:
      'Direct clinical medical services provided under North Carolina Medical Board licensure. Patient must be physically present in North Carolina during clinical encounters.',
    telehealth:
      'Clinical telemedicine consultations are authorized and delivered in accordance with North Carolina Medical Board telemedicine regulations and HIPAA compliance standards.',
    prescriptions:
      'Prescription therapeutics, neuro-metabolic medications, and clinical laboratory requisitions are authorized for North Carolina patients.',
    emergencyNotice:
      'If you are experiencing a medical emergency, call 911 immediately or visit the nearest emergency department. Telemedicine is not a substitute for emergency services.',
    all: [
      'Direct clinical medical services provided under North Carolina Medical Board licensure. Patient must be physically present in North Carolina during clinical encounters.',
      'Clinical telemedicine consultations are authorized and delivered in accordance with North Carolina Medical Board telemedicine regulations and HIPAA compliance standards.',
      'Prescription therapeutics, neuro-metabolic medications, and clinical laboratory requisitions are authorized for North Carolina patients.',
      'If you are experiencing a medical emergency, call 911 immediately or visit the nearest emergency department. Telemedicine is not a substitute for emergency services.',
    ],
  },
  licensureDisclosure: {
    licensingBody: 'North Carolina Medical Board (NCMB)',
    licensureState: 'NC',
    licenseType: 'Active Unrestricted NC Medical License',
    physicianPatientRelationship: true,
    prescriptiveAuthority: true,
    supervisoryScope:
      'Full clinical attending physician oversight of medical diagnosis, neuro-metabolic protocols, and comprehensive patient care.',
    disclosureText:
      'Medical services are rendered by an attending physician holding an active, unrestricted medical license issued by the North Carolina Medical Board (NCMB). A formal physician-patient relationship is established upon completion of clinical intake protocols.',
  },
  feeMatrixAdjustments: {
    currency: 'USD',
    surchargePercent: 0,
    retainerAdjustmentPercent: 0,
    salesTaxApplicable: false,
    vatApplicable: false,
    taxJurisdictionClassification: 'NC_MEDICAL_SERVICES_EXEMPT',
    billingCategory: 'CLINICAL_MEDICAL_SERVICES',
    hsaFsaEligible: true,
    notes:
      'Direct clinical medical services. Qualified medical expenses may be reimbursed via HSA/FSA itemized Superbill documentation.',
  },
};

const US_OUT_OF_STATE_POLICY_TEMPLATE: TierPolicyTemplate = {
  tier: 'US_EDUCATIONAL',
  isHomeState: false,
  telehealthEligible: false,
  telehealthHeaderValue: '0',
  authorizationScope:
    'Authorized for "Executive Educational Longevity Consultation" & biomarker protocol guidance under interstate medical advisory standards.',
  authorizedServices: [
    'Executive Educational Longevity Consultation',
    'Biomarker Protocol Guidance',
    'Stoichiometric Analysis & Health Architecture',
    'Interstate Medical Advisory Briefings',
  ],
  disclaimers: {
    primary:
      'Interstate consultations are educational and advisory in nature under interstate medical advisory standards. Services do not constitute the practice of medicine in the client\'s state of residence and do not create a formal physician-patient relationship.',
    telehealth:
      'Direct clinical telemedicine is restricted by medical licensure to North Carolina. Out-of-state US consultations are strictly non-clinical educational advisory sessions.',
    prescriptions:
      'Physician does not prescribe medications, adjust prescription therapies, or issue clinical laboratory requisitions outside North Carolina. Clients must consult a locally licensed healthcare provider.',
    emergencyNotice:
      'If you are experiencing a medical emergency, call 911 immediately or proceed to the nearest emergency medical facility. Educational consultations are not emergency medical services.',
    all: [
      'Interstate consultations are educational and advisory in nature under interstate medical advisory standards. Services do not constitute the practice of medicine in the client\'s state of residence and do not create a formal physician-patient relationship.',
      'Direct clinical telemedicine is restricted by medical licensure to North Carolina. Out-of-state US consultations are strictly non-clinical educational advisory sessions.',
      'Physician does not prescribe medications, adjust prescription therapies, or issue clinical laboratory requisitions outside North Carolina. Clients must consult a locally licensed healthcare provider.',
      'If you are experiencing a medical emergency, call 911 immediately or proceed to the nearest emergency medical facility. Educational consultations are not emergency medical services.',
    ],
  },
  licensureDisclosure: {
    licensingBody: 'North Carolina Medical Board (NCMB)',
    licensureState: 'NC',
    licenseType: 'Physician Advisory (Interstate Educational Scope)',
    physicianPatientRelationship: false,
    prescriptiveAuthority: false,
    supervisoryScope:
      'Executive educational longevity advisory and biomarker guidance; non-clinical interstate informational scope.',
    disclosureText:
      'Consultations are conducted by a North Carolina-licensed physician acting as an educational longevity advisor under interstate informational advisory standards. No physician-patient relationship is formed in the client\'s jurisdiction, and consultations do not substitute for local clinical care.',
  },
  feeMatrixAdjustments: {
    currency: 'USD',
    surchargePercent: 0,
    retainerAdjustmentPercent: 0,
    salesTaxApplicable: true,
    vatApplicable: false,
    taxJurisdictionClassification: 'US_INTERSTATE_EDUCATIONAL_SERVICES',
    billingCategory: 'EXECUTIVE_EDUCATIONAL_CONSULTATION',
    hsaFsaEligible: false,
    notes:
      'Executive educational advisory fee matrix applies. Non-clinical advisory; not directly eligible for HSA/FSA reimbursement without an independent Letter of Medical Necessity from the client\'s local primary care physician.',
  },
};

const GLOBAL_POLICY_TEMPLATE: TierPolicyTemplate = {
  tier: 'GLOBAL_ADVISORY',
  isHomeState: false,
  telehealthEligible: false,
  telehealthHeaderValue: '0',
  authorizationScope:
    'Authorized for "Global Longevity Advisory" educational briefings.',
  authorizedServices: [
    'Global Longevity Advisory',
    'International Executive Educational Briefings',
    'Longevity Science & Biomarker Literacy',
    'Stoichiometric Strategy Briefings',
  ],
  disclaimers: {
    primary:
      'International sessions are strictly educational briefings on longevity science and biomarker principles. They do not constitute medical diagnosis, treatment, or clinical consultation under foreign national health regulations.',
    telehealth:
      'Direct clinical telemedicine is not offered internationally. All interactions are cross-border educational briefings governed by United States jurisdiction.',
    prescriptions:
      'No international prescription fulfillment, clinical orders, or pharmaceutical directives are issued. All clinical protocols must be managed by a local medical practitioner licensed in your country.',
    emergencyNotice:
      'In case of a medical emergency, immediately contact your national emergency services (e.g., 999, 112, 000) or report to the nearest hospital or urgent care clinic.',
    all: [
      'International sessions are strictly educational briefings on longevity science and biomarker principles. They do not constitute medical diagnosis, treatment, or clinical consultation under foreign national health regulations.',
      'Direct clinical telemedicine is not offered internationally. All interactions are cross-border educational briefings governed by United States jurisdiction.',
      'No international prescription fulfillment, clinical orders, or pharmaceutical directives are issued. All clinical protocols must be managed by a local medical practitioner licensed in your country.',
      'In case of a medical emergency, immediately contact your national emergency services (e.g., 999, 112, 000) or report to the nearest hospital or urgent care clinic.',
    ],
  },
  licensureDisclosure: {
    licensingBody: 'North Carolina Medical Board (NCMB)',
    licensureState: 'NC (USA)',
    licenseType: 'US Physician (Global Educational Advisory Scope)',
    physicianPatientRelationship: false,
    prescriptiveAuthority: false,
    supervisoryScope:
      'Global longevity educational briefings; no international medical licensure claimed.',
    disclosureText:
      'Briefings are delivered in an educational advisory capacity by a physician licensed in the State of North Carolina, United States. Services do not constitute the local practice of medicine in any foreign jurisdiction, and no doctor-patient relationship is established.',
  },
  feeMatrixAdjustments: {
    currency: 'USD',
    surchargePercent: 0,
    retainerAdjustmentPercent: 0,
    salesTaxApplicable: false,
    vatApplicable: false,
    taxJurisdictionClassification: 'INTERNATIONAL_CROSS_BORDER_EXEMPT',
    billingCategory: 'GLOBAL_EDUCATIONAL_BRIEFING',
    hsaFsaEligible: false,
    notes:
      'International global advisory fee matrix denominated in USD. Transactions are cross-border educational advisory services exempt from US state sales taxes; local VAT/customs responsibilities remain with the client.',
  },
};

export const JURISDICTION_TEMPLATES: Readonly<Record<JurisdictionTier, TierPolicyTemplate>> = {
  NC_CLINICAL: NC_POLICY_TEMPLATE,
  US_EDUCATIONAL: US_OUT_OF_STATE_POLICY_TEMPLATE,
  GLOBAL_ADVISORY: GLOBAL_POLICY_TEMPLATE,
};

function createJurisdictionProfile(
  tier: JurisdictionTier,
  countryCode: string | null,
  subdivisionCode: string | null
): JurisdictionProfile {
  const template = JURISDICTION_TEMPLATES[tier];
  return {
    tier: template.tier,
    jurisdiction: template.tier,
    countryCode,
    subdivisionCode,
    isHomeState: template.isHomeState,
    telehealthEligible: template.telehealthEligible,
    telehealthHeaderValue: template.telehealthHeaderValue,
    authorizationScope: template.authorizationScope,
    authorizedServices: template.authorizedServices,
    disclaimers: template.disclaimers,
    licensureDisclosure: template.licensureDisclosure,
    feeMatrixAdjustments: template.feeMatrixAdjustments,
  };
}

/**
 * Resolves the legal compliance and telehealth jurisdiction profile
 * based on ISO 3166-1 country code and ISO 3166-2 subdivision code.
 *
 * Mapping Rules:
 * - Country == "US" & Subdivision == "NC": Home state NC_CLINICAL (telehealth eligible = 1)
 * - Country == "US" & Subdivision != "NC": Out-of-state US_EDUCATIONAL (telehealth eligible = 0)
 * - Country != "US" (or undefined/fallback): International GLOBAL_ADVISORY (telehealth eligible = 0)
 *
 * @param countryCode Optional 2-letter ISO country code (e.g. "US", "GB", "CA")
 * @param subdivisionCode Optional ISO subdivision/state code (e.g. "NC", "CA", "US-NC")
 * @returns Strongly-typed JurisdictionProfile
 */
export function resolveJurisdiction(
  countryCode?: string,
  subdivisionCode?: string
): JurisdictionProfile {
  const normalizedCountry = countryCode?.trim().toUpperCase() || null;
  let normalizedSubdivision = subdivisionCode?.trim().toUpperCase() || null;

  if (normalizedSubdivision) {
    // Strip redundant country prefix if present (e.g. "US-NC" -> "NC")
    normalizedSubdivision = normalizedSubdivision.replace(/^US-/, '');
  }

  // Handle US Domestic Jurisdictions
  if (normalizedCountry === 'US' || normalizedCountry === 'USA') {
    if (normalizedSubdivision === 'NC') {
      return createJurisdictionProfile('NC_CLINICAL', 'US', 'NC');
    }
    return createJurisdictionProfile(
      'US_EDUCATIONAL',
      'US',
      normalizedSubdivision
    );
  }

  // Handle Identified Non-US International Jurisdictions
  if (normalizedCountry && normalizedCountry !== 'US' && normalizedCountry !== 'USA') {
    return createJurisdictionProfile(
      'GLOBAL_ADVISORY',
      normalizedCountry,
      normalizedSubdivision
    );
  }

  // Fallback Case: Missing, empty, or whitespace countryCode
  // Default safely to the most restrictive tier (GLOBAL_ADVISORY)
  return createJurisdictionProfile(
    'GLOBAL_ADVISORY',
    null,
    normalizedSubdivision
  );
}

/**
 * Unit Test Suite: State-Level Telehealth Compliance & Legal Jurisdiction Policy
 * 
 * Validates:
 * 1. Home State (NC) -> NC_CLINICAL tier, clinical telemedicine eligibility (1).
 * 2. Out-of-State US (CA, NY, TX, etc.) -> US_EDUCATIONAL tier, educational advisory (0).
 * 3. International (GB, CA, DE, FR, JP, AU, etc.) -> GLOBAL_ADVISORY tier, global briefings (0).
 * 4. Fallback & Edge cases -> missing, undefined, empty, malformed input handling.
 * 5. Netlify Edge Function response header injection.
 */

import {
  resolveJurisdiction,
  HEADER_JURISDICTION,
  HEADER_TELEHEALTH_ELIGIBLE,
  JURISDICTION_TEMPLATES,
  JurisdictionProfile,
} from '../jurisdictionPolicy';
import edgeHandler, { EdgeContext } from '../../../../netlify/edge-functions/jurisdiction/index';

describe('Legal Jurisdiction & Telehealth Compliance Policy', () => {
  describe('1. Home State: North Carolina (NC_CLINICAL)', () => {
    it('resolves standard ("US", "NC") to NC_CLINICAL with full clinical telehealth authorization', () => {
      const profile: JurisdictionProfile = resolveJurisdiction('US', 'NC');

      expect(profile.tier).toBe('NC_CLINICAL');
      expect(profile.jurisdiction).toBe('NC_CLINICAL');
      expect(profile.isHomeState).toBe(true);
      expect(profile.telehealthEligible).toBe(true);
      expect(profile.telehealthHeaderValue).toBe('1');
      expect(profile.countryCode).toBe('US');
      expect(profile.subdivisionCode).toBe('NC');

      // Authorization Scope
      expect(profile.authorizationScope).toContain('direct medical diagnosis');
      expect(profile.authorizationScope).toContain('neuro-metabolic interventions');
      expect(profile.authorizationScope).toContain('clinical in-office/telemedicine consultations');

      // Authorized Services
      expect(profile.authorizedServices).toContain('Direct Medical Diagnosis');
      expect(profile.authorizedServices).toContain('Neuro-Metabolic Interventions');
      expect(profile.authorizedServices).toContain('Clinical Telemedicine Consultations');

      // Licensure Disclosure
      expect(profile.licensureDisclosure.licensingBody).toBe('North Carolina Medical Board (NCMB)');
      expect(profile.licensureDisclosure.licensureState).toBe('NC');
      expect(profile.licensureDisclosure.physicianPatientRelationship).toBe(true);
      expect(profile.licensureDisclosure.prescriptiveAuthority).toBe(true);

      // Disclaimers & Fee Matrix
      expect(profile.disclaimers.primary).toContain('North Carolina Medical Board');
      expect(profile.disclaimers.emergencyNotice).toContain('911');
      expect(profile.feeMatrixAdjustments.hsaFsaEligible).toBe(true);
      expect(profile.feeMatrixAdjustments.salesTaxApplicable).toBe(false);
      expect(profile.feeMatrixAdjustments.billingCategory).toBe('CLINICAL_MEDICAL_SERVICES');
    });

    it('handles lowercase, mixed-case, and whitespace input for NC', () => {
      const profileLower = resolveJurisdiction('us', 'nc');
      expect(profileLower.tier).toBe('NC_CLINICAL');
      expect(profileLower.telehealthEligible).toBe(true);

      const profileMixed = resolveJurisdiction('Us', 'Nc');
      expect(profileMixed.tier).toBe('NC_CLINICAL');

      const profilePadded = resolveJurisdiction('  US  ', '  NC  ');
      expect(profilePadded.tier).toBe('NC_CLINICAL');
      expect(profilePadded.subdivisionCode).toBe('NC');
    });

    it('normalizes ISO subdivision prefix "US-NC" and accepts "USA" country code', () => {
      const profileIso = resolveJurisdiction('US', 'US-NC');
      expect(profileIso.tier).toBe('NC_CLINICAL');
      expect(profileIso.subdivisionCode).toBe('NC');
      expect(profileIso.telehealthEligible).toBe(true);

      const profileUsa = resolveJurisdiction('USA', 'NC');
      expect(profileUsa.tier).toBe('NC_CLINICAL');

      const profileUsaIso = resolveJurisdiction('USA', 'US-NC');
      expect(profileUsaIso.tier).toBe('NC_CLINICAL');
    });
  });

  describe('2. Out-of-State US Jurisdictions (US_EDUCATIONAL)', () => {
    it.each([
      ['California', 'US', 'CA'],
      ['New York', 'US', 'NY'],
      ['Texas', 'US', 'TX'],
      ['Florida', 'US', 'FL'],
      ['Washington', 'US', 'WA'],
      ['Illinois', 'US', 'IL'],
    ])('maps %s (%s, %s) to US_EDUCATIONAL with restricted telehealth eligibility', (_, country, state) => {
      const profile = resolveJurisdiction(country, state);

      expect(profile.tier).toBe('US_EDUCATIONAL');
      expect(profile.jurisdiction).toBe('US_EDUCATIONAL');
      expect(profile.isHomeState).toBe(false);
      expect(profile.telehealthEligible).toBe(false);
      expect(profile.telehealthHeaderValue).toBe('0');
      expect(profile.countryCode).toBe('US');
      expect(profile.subdivisionCode).toBe(state);

      // Authorization Scope
      expect(profile.authorizationScope).toContain('Executive Educational Longevity Consultation');
      expect(profile.authorizationScope).toContain('biomarker protocol guidance');
      expect(profile.authorizationScope).toContain('interstate medical advisory standards');

      // Authorized Services
      expect(profile.authorizedServices).toContain('Executive Educational Longevity Consultation');
      expect(profile.authorizedServices).toContain('Biomarker Protocol Guidance');

      // Licensure & Disclaimers
      expect(profile.licensureDisclosure.physicianPatientRelationship).toBe(false);
      expect(profile.licensureDisclosure.prescriptiveAuthority).toBe(false);
      expect(profile.disclaimers.primary).toContain('interstate medical advisory standards');
      expect(profile.disclaimers.telehealth).toContain('Direct clinical telemedicine is restricted by medical licensure to North Carolina');
      expect(profile.disclaimers.prescriptions).toContain('Physician does not prescribe medications');
      expect(profile.disclaimers.emergencyNotice).toContain('911');

      // Fee Matrix
      expect(profile.feeMatrixAdjustments.hsaFsaEligible).toBe(false);
      expect(profile.feeMatrixAdjustments.billingCategory).toBe('EXECUTIVE_EDUCATIONAL_CONSULTATION');
    });

    it('normalizes ISO subdivision prefixes for out-of-state US (e.g. US-CA, US-NY, US-TX)', () => {
      expect(resolveJurisdiction('US', 'US-CA').tier).toBe('US_EDUCATIONAL');
      expect(resolveJurisdiction('US', 'US-CA').subdivisionCode).toBe('CA');

      expect(resolveJurisdiction('US', 'US-NY').tier).toBe('US_EDUCATIONAL');
      expect(resolveJurisdiction('US', 'US-NY').subdivisionCode).toBe('NY');

      expect(resolveJurisdiction('US', 'US-TX').tier).toBe('US_EDUCATIONAL');
      expect(resolveJurisdiction('US', 'US-TX').subdivisionCode).toBe('TX');
    });

    it('maps US country with missing or non-NC subdivision to US_EDUCATIONAL', () => {
      const profileNoSub = resolveJurisdiction('US', undefined);
      expect(profileNoSub.tier).toBe('US_EDUCATIONAL');
      expect(profileNoSub.telehealthEligible).toBe(false);
      expect(profileNoSub.telehealthHeaderValue).toBe('0');

      const profileEmptySub = resolveJurisdiction('US', '');
      expect(profileEmptySub.tier).toBe('US_EDUCATIONAL');

      const profileUnknownSub = resolveJurisdiction('US', 'ZZ');
      expect(profileUnknownSub.tier).toBe('US_EDUCATIONAL');
    });
  });

  describe('3. International Jurisdictions (GLOBAL_ADVISORY)', () => {
    it.each([
      ['United Kingdom', 'GB', 'ENG'],
      ['Canada (Ontario)', 'CA', 'ON'],
      ['Germany', 'DE', 'BY'],
      ['France', 'FR', 'IDF'],
      ['Japan', 'JP', '13'],
      ['Australia', 'AU', 'NSW'],
      ['Switzerland', 'CH', 'ZH'],
      ['Singapore', 'SG', undefined],
    ])('maps %s (%s) to GLOBAL_ADVISORY', (_, country, sub) => {
      const profile = resolveJurisdiction(country, sub);

      expect(profile.tier).toBe('GLOBAL_ADVISORY');
      expect(profile.jurisdiction).toBe('GLOBAL_ADVISORY');
      expect(profile.isHomeState).toBe(false);
      expect(profile.telehealthEligible).toBe(false);
      expect(profile.telehealthHeaderValue).toBe('0');
      expect(profile.countryCode).toBe(country);

      // Scope
      expect(profile.authorizationScope).toContain('Global Longevity Advisory');
      expect(profile.authorizationScope).toContain('educational briefings');

      // Authorized Services
      expect(profile.authorizedServices).toContain('Global Longevity Advisory');
      expect(profile.authorizedServices).toContain('International Executive Educational Briefings');

      // Licensure & Disclaimers
      expect(profile.licensureDisclosure.physicianPatientRelationship).toBe(false);
      expect(profile.licensureDisclosure.prescriptiveAuthority).toBe(false);
      expect(profile.disclaimers.primary).toContain('strictly educational briefings');
      expect(profile.disclaimers.telehealth).toContain('Direct clinical telemedicine is not offered internationally');
      expect(profile.disclaimers.prescriptions).toContain('No international prescription fulfillment');

      // Fee Matrix
      expect(profile.feeMatrixAdjustments.hsaFsaEligible).toBe(false);
      expect(profile.feeMatrixAdjustments.taxJurisdictionClassification).toBe('INTERNATIONAL_CROSS_BORDER_EXEMPT');
      expect(profile.feeMatrixAdjustments.billingCategory).toBe('GLOBAL_EDUCATIONAL_BRIEFING');
    });

    it('correctly distinguishes ISO country "CA" (Canada) from US state "CA" (California)', () => {
      const canadaProfile = resolveJurisdiction('CA', 'ON');
      expect(canadaProfile.tier).toBe('GLOBAL_ADVISORY');
      expect(canadaProfile.countryCode).toBe('CA');

      const californiaProfile = resolveJurisdiction('US', 'CA');
      expect(californiaProfile.tier).toBe('US_EDUCATIONAL');
      expect(californiaProfile.countryCode).toBe('US');
      expect(californiaProfile.subdivisionCode).toBe('CA');
    });
  });

  describe('4. Fallback and Edge Cases', () => {
    it('safely defaults to GLOBAL_ADVISORY when no arguments are passed', () => {
      const profile = resolveJurisdiction();
      expect(profile.tier).toBe('GLOBAL_ADVISORY');
      expect(profile.telehealthEligible).toBe(false);
      expect(profile.telehealthHeaderValue).toBe('0');
      expect(profile.countryCode).toBeNull();
      expect(profile.subdivisionCode).toBeNull();
    });

    it('safely defaults to GLOBAL_ADVISORY for undefined or null inputs', () => {
      const profile = resolveJurisdiction(undefined, undefined);
      expect(profile.tier).toBe('GLOBAL_ADVISORY');
      expect(profile.telehealthEligible).toBe(false);
      expect(profile.telehealthHeaderValue).toBe('0');
    });

    it('safely defaults to GLOBAL_ADVISORY for empty or whitespace-only strings', () => {
      const profileEmpty = resolveJurisdiction('', '');
      expect(profileEmpty.tier).toBe('GLOBAL_ADVISORY');

      const profileSpaces = resolveJurisdiction('   ', '   ');
      expect(profileSpaces.tier).toBe('GLOBAL_ADVISORY');
      expect(profileSpaces.countryCode).toBeNull();
    });

    it('defaults to GLOBAL_ADVISORY when country is missing even if subdivision is NC (cannot verify US physical presence)', () => {
      const profile = resolveJurisdiction(undefined, 'NC');
      expect(profile.tier).toBe('GLOBAL_ADVISORY');
      expect(profile.telehealthEligible).toBe(false);
      expect(profile.telehealthHeaderValue).toBe('0');
    });

    it('defaults to GLOBAL_ADVISORY for non-US unknown country codes', () => {
      const profile = resolveJurisdiction('XX', 'YY');
      expect(profile.tier).toBe('GLOBAL_ADVISORY');
      expect(profile.countryCode).toBe('XX');
      expect(profile.subdivisionCode).toBe('YY');
    });

    it('exposes frozen/immutable template dictionary for all tiers', () => {
      expect(JURISDICTION_TEMPLATES.NC_CLINICAL).toBeDefined();
      expect(JURISDICTION_TEMPLATES.US_EDUCATIONAL).toBeDefined();
      expect(JURISDICTION_TEMPLATES.GLOBAL_ADVISORY).toBeDefined();
    });
  });

  describe('5. Netlify Edge Function Response Header Injection', () => {
    function createMockRequest(url: string = 'https://clinic.domain.com/'): Request {
      return new Request(url);
    }

    function createMockContext(
      countryCode?: string,
      subdivisionCode?: string,
      initialHeaders: Record<string, string> = {}
    ): EdgeContext {
      return {
        geo: {
          country: countryCode ? { code: countryCode } : undefined,
          subdivision: subdivisionCode ? { code: subdivisionCode } : undefined,
        },
        next: jest.fn().mockImplementation(async () => {
          const headers = new Headers(initialHeaders);
          return new Response('OK', { status: 200, headers });
        }),
      };
    }

    it('injects NC_CLINICAL and telehealth-eligible=1 for North Carolina visitors', async () => {
      const request = createMockRequest();
      const context = createMockContext('US', 'NC');

      const response = await edgeHandler(request, context);

      expect(response.headers.get(HEADER_JURISDICTION)).toBe('NC_CLINICAL');
      expect(response.headers.get(HEADER_TELEHEALTH_ELIGIBLE)).toBe('1');
    });

    it.each([
      ['CA', 'US_EDUCATIONAL'],
      ['NY', 'US_EDUCATIONAL'],
      ['TX', 'US_EDUCATIONAL'],
    ])('injects %s jurisdiction headers for US state %s', async (state, expectedTier) => {
      const request = createMockRequest();
      const context = createMockContext('US', state);

      const response = await edgeHandler(request, context);

      expect(response.headers.get(HEADER_JURISDICTION)).toBe(expectedTier);
      expect(response.headers.get(HEADER_TELEHEALTH_ELIGIBLE)).toBe('0');
    });

    it('injects GLOBAL_ADVISORY and telehealth-eligible=0 for international visitors (GB, DE)', async () => {
      const requestGb = createMockRequest();
      const contextGb = createMockContext('GB', 'ENG');
      const responseGb = await edgeHandler(requestGb, contextGb);

      expect(responseGb.headers.get(HEADER_JURISDICTION)).toBe('GLOBAL_ADVISORY');
      expect(responseGb.headers.get(HEADER_TELEHEALTH_ELIGIBLE)).toBe('0');

      const requestDe = createMockRequest();
      const contextDe = createMockContext('DE', 'BY');
      const responseDe = await edgeHandler(requestDe, contextDe);

      expect(responseDe.headers.get(HEADER_JURISDICTION)).toBe('GLOBAL_ADVISORY');
      expect(responseDe.headers.get(HEADER_TELEHEALTH_ELIGIBLE)).toBe('0');
    });

    it('injects fallback GLOBAL_ADVISORY and telehealth-eligible=0 when geo data is missing', async () => {
      const request = createMockRequest();
      const context: EdgeContext = {
        next: jest.fn().mockResolvedValue(new Response('OK', { status: 200 })),
      };

      const response = await edgeHandler(request, context);

      expect(response.headers.get(HEADER_JURISDICTION)).toBe('GLOBAL_ADVISORY');
      expect(response.headers.get(HEADER_TELEHEALTH_ELIGIBLE)).toBe('0');
    });

    it('handles immutable headers gracefully via fallback cloning', async () => {
      const request = createMockRequest();
      const mockResponse = new Response('OK', { status: 200 });
      // Simulate an immutable headers object where set() throws
      mockResponse.headers.set = jest.fn().mockImplementation(() => {
        throw new TypeError('Headers are immutable');
      });

      const context: EdgeContext = {
        geo: { country: { code: 'US' }, subdivision: { code: 'NC' } },
        next: jest.fn().mockResolvedValue(mockResponse),
      };

      const response = await edgeHandler(request, context);

      expect(response.headers.get(HEADER_JURISDICTION)).toBe('NC_CLINICAL');
      expect(response.headers.get(HEADER_TELEHEALTH_ELIGIBLE)).toBe('1');
    });

    it('constructs a default Response when context.next is not provided', async () => {
      const request = createMockRequest();
      const context: EdgeContext = {
        geo: { country: { code: 'US' }, subdivision: { code: 'NC' } },
        next: undefined as unknown as EdgeContext['next'],
      };

      const response = await edgeHandler(request, context);

      expect(response.status).toBe(200);
      expect(response.headers.get(HEADER_JURISDICTION)).toBe('NC_CLINICAL');
      expect(response.headers.get(HEADER_TELEHEALTH_ELIGIBLE)).toBe('1');
    });
  });
});

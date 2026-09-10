/**
 * Netlify Edge Function: Legal Jurisdiction & Telehealth Compliance Router
 * 
 * Inspects incoming request geolocation metadata (ISO 3166-1 country code and
 * ISO 3166-2 subdivision code) and injects strict legal jurisdiction & telehealth
 * eligibility headers into the edge response.
 * 
 * Injected Headers:
 * - x-clinic-jurisdiction: NC_CLINICAL | US_EDUCATIONAL | GLOBAL_ADVISORY
 * - x-clinic-telehealth-eligible: 1 | 0
 */

import {
  resolveJurisdiction,
  HEADER_JURISDICTION,
  HEADER_TELEHEALTH_ELIGIBLE,
} from '../../../src/lib/compliance/jurisdictionPolicy';

export interface EdgeContext {
  next: (options?: { sendConditional?: boolean }) => Promise<Response>;
  geo?: {
    city?: string;
    country?: {
      code?: string;
      name?: string;
    };
    subdivision?: {
      code?: string;
      name?: string;
    };
    timezone?: string;
    latitude?: number;
    longitude?: number;
  };
  ip?: string;
  params?: Record<string, string>;
  requestId?: string;
  site?: {
    id?: string;
    name?: string;
    url?: string;
  };
  [key: string]: unknown;
}

export type Context = EdgeContext;

export const config = {
  path: '/*',
};

export default async function handler(
  request: Request,
  context: EdgeContext
): Promise<Response> {
  const response =
    context && typeof context.next === 'function'
      ? await context.next()
      : new Response(null, { status: 200 });

  const countryCode = context?.geo?.country?.code;
  const subdivisionCode = context?.geo?.subdivision?.code;

  const profile = resolveJurisdiction(countryCode, subdivisionCode);

  const headersToSet: [string, string][] = [
    [HEADER_JURISDICTION, profile.jurisdiction],
    [HEADER_TELEHEALTH_ELIGIBLE, profile.telehealthEligible ? '1' : '0'],
  ];

  try {
    for (const [key, value] of headersToSet) {
      response.headers.set(key, value);
    }
    return response;
  } catch {
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of headersToSet) {
      newHeaders.set(key, value);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }
}

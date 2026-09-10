export const HEADER_JURISDICTION = 'x-clinic-jurisdiction';
export const HEADER_TELEHEALTH_ELIGIBLE = 'x-clinic-telehealth-eligible';

export interface EdgeContext {
  geo?: {
    city?: string;
    country?: { code?: string; name?: string };
    subdivision?: { code?: string; name?: string };
  };
  next?: () => Promise<Response>;
}

function resolveEdgeTier(countryCode?: string, subdivisionCode?: string) {
  const country = countryCode?.trim().toUpperCase();
  let sub = subdivisionCode?.trim().toUpperCase();
  if (sub && sub.startsWith('US-')) {
    sub = sub.slice(3);
  }

  if (!country || (country !== 'US' && country !== 'USA')) {
    return { tier: 'GLOBAL_ADVISORY', eligible: '0' };
  }
  if (sub === 'NC') {
    return { tier: 'NC_CLINICAL', eligible: '1' };
  }
  return { tier: 'US_EDUCATIONAL', eligible: '0' };
}

export default async function edgeHandler(request: Request, context?: EdgeContext): Promise<Response> {
  const { tier, eligible } = resolveEdgeTier(
    context?.geo?.country?.code,
    context?.geo?.subdivision?.code
  );

  let response: Response;
  if (context && typeof context.next === 'function') {
    response = await context.next();
  } else {
    response = new Response(null, { status: 200 });
  }

  try {
    response.headers.set(HEADER_JURISDICTION, tier);
    response.headers.set(HEADER_TELEHEALTH_ELIGIBLE, eligible);
    return response;
  } catch {
    // Handle immutable response headers via fallback cloning
    const newHeaders = new Headers(response.headers);
    newHeaders.set(HEADER_JURISDICTION, tier);
    newHeaders.set(HEADER_TELEHEALTH_ELIGIBLE, eligible);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }
}

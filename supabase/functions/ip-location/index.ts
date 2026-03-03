// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type IpLookupResult = {
  lat: number;
  lng: number;
  city?: string | null;
  country?: string | null;
  accuracyKm?: number | null;
  source: string;
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  });
}

function parseClientIp(headers: Headers): string | null {
  const candidates = [
    headers.get('x-forwarded-for'),
    headers.get('x-real-ip'),
    headers.get('cf-connecting-ip'),
    headers.get('fly-client-ip'),
    headers.get('x-client-ip'),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    // x-forwarded-for may include multiple values.
    const first = candidate.split(',')[0]?.trim();
    if (!first) continue;

    const normalized = normalizeIp(first);
    if (isLikelyIp(normalized)) return normalized;
  }

  return null;
}

function normalizeIp(rawValue: string): string {
  const value = rawValue.trim();

  // Bracketed IPv6 with optional port: [2001:db8::1]:443
  const bracketed = value.match(/^\[([0-9a-fA-F:]+)\](?::\d+)?$/);
  if (bracketed?.[1]) {
    return bracketed[1];
  }

  // IPv4 with port: 1.2.3.4:443
  const ipv4WithPort = value.match(/^((?:\d{1,3}\.){3}\d{1,3}):\d+$/);
  if (ipv4WithPort?.[1]) {
    return ipv4WithPort[1];
  }

  // IPv4-mapped IPv6
  return value.replace(/^::ffff:/, '');
}

function isLikelyIp(value: string): boolean {
  const ipv4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
  const ipv6 = /^[0-9a-fA-F:]+$/;
  return ipv4.test(value) || ipv6.test(value);
}

function asNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchWithTimeout(url: string, timeoutMs = 3500): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function lookupWithIpapi(ip: string): Promise<IpLookupResult | null> {
  const resp = await fetchWithTimeout(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
  if (!resp.ok) return null;

  const payload = await resp.json();
  const lat = asNumber(payload?.latitude);
  const lng = asNumber(payload?.longitude);
  if (lat == null || lng == null) return null;

  return {
    lat,
    lng,
    city: payload?.city ?? null,
    country: payload?.country_name ?? null,
    accuracyKm: null,
    source: 'ipapi',
  };
}

async function lookupWithIpwhois(ip: string): Promise<IpLookupResult | null> {
  const resp = await fetchWithTimeout(`https://ipwho.is/${encodeURIComponent(ip)}`);
  if (!resp.ok) return null;

  const payload = await resp.json();
  if (payload?.success === false) return null;

  const lat = asNumber(payload?.latitude);
  const lng = asNumber(payload?.longitude);
  if (lat == null || lng == null) return null;

  return {
    lat,
    lng,
    city: payload?.city ?? null,
    country: payload?.country ?? null,
    accuracyKm: asNumber(payload?.location?.accuracy_radius) ?? null,
    source: 'ipwhois',
  };
}

async function lookupWithIp2Location(ip: string): Promise<IpLookupResult | null> {
  const apiKey = Deno.env.get('IP2LOCATION_API_KEY');
  let url = `https://api.ip2location.io/?ip=${encodeURIComponent(ip)}&format=json`;
  if (apiKey) {
    url += `&key=${encodeURIComponent(apiKey)}`;
  }

  const resp = await fetchWithTimeout(url);
  if (!resp.ok) return null;

  const payload = await resp.json();
  const lat = asNumber(payload?.latitude);
  const lng = asNumber(payload?.longitude);
  if (lat == null || lng == null) return null;

  return {
    lat,
    lng,
    city: payload?.city_name ?? null,
    country: payload?.country_name ?? null,
    accuracyKm: null,
    source: 'ip2location',
  };
}

async function resolveIpLocation(ip: string): Promise<IpLookupResult | null> {
  const ip2location = await lookupWithIp2Location(ip);
  if (ip2location) return ip2location;

  const primary = await lookupWithIpapi(ip);
  if (primary) return primary;

  return await lookupWithIpwhois(ip);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const headerIp = parseClientIp(req.headers);
  let bodyIp: string | null = null;

  try {
    const body = await req.json();
    if (body?.ip && isLikelyIp(String(body.ip).trim())) {
      bodyIp = String(body.ip).trim();
    }
  } catch {
    // Empty body is fine.
  }

  const ip = bodyIp || headerIp;
  if (!ip) {
    return jsonResponse(
      {
        error: 'Could not determine client IP',
        lat: 37.5665,
        lng: 126.978,
        source: 'default',
      },
      200
    );
  }

  try {
    const resolved = await resolveIpLocation(ip);
    if (!resolved) {
      return jsonResponse(
        {
          error: 'IP lookup failed',
          ip,
          lat: 37.5665,
          lng: 126.978,
          source: 'default',
        },
        200
      );
    }

    return jsonResponse({
      ip,
      ...resolved,
    });
  } catch (err) {
    return jsonResponse(
      {
        error: 'Unexpected error during IP lookup',
        detail: err instanceof Error ? err.message : String(err),
        lat: 37.5665,
        lng: 126.978,
        source: 'default',
      },
      200
    );
  }
});

import { supabase } from '../lib/supabase';

function toLatLng(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const latCandidates = [
    payload.lat,
    payload.latitude,
    payload?.data?.lat,
    payload?.data?.latitude,
  ];
  const lngCandidates = [
    payload.lng,
    payload.lon,
    payload.longitude,
    payload?.data?.lng,
    payload?.data?.lon,
    payload?.data?.longitude,
  ];

  const lat = latCandidates
    .map((value) => Number.parseFloat(value))
    .find((value) => Number.isFinite(value));
  const lng = lngCandidates
    .map((value) => Number.parseFloat(value))
    .find((value) => Number.isFinite(value));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export async function getIpBasedLocation() {
  // Preferred path: Supabase Edge Function (server-to-server IP lookup).
  try {
    const { data, error } = await supabase.functions.invoke('ip-location', {
      body: {},
    });
    if (!error) {
      const coords = toLatLng(data);
      if (coords) return coords;
    }
  } catch (err) {
    // Continue to fallback API.
  }

  // Last fallback: public endpoint that may fail on strict CORS/network setups.
  const response = await fetch('https://ipapi.co/json/', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`IP location lookup failed (${response.status})`);
  }

  const payload = await response.json();
  const coords = toLatLng(payload);
  if (!coords) {
    throw new Error('IP location response did not include coordinates');
  }
  return coords;
}

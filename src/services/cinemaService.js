// src/services/cinemaService.js
import { supabase } from '../lib/supabase';
import { getCachedJson, roundCoord, setCachedJson } from './cache';

export async function listCinemasByDistance(lat, lng) {
  const roundedLat = roundCoord(lat);
  const roundedLng = roundCoord(lng);
  const cacheKey = `cinemasByDistance:${roundedLat}:${roundedLng}`;
  const cached = getCachedJson(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase.rpc('get_cinemas_by_distance', {
    in_user_lat: lat,
    in_user_lng: lng,
  });
  if (error) throw error;
  setCachedJson(cacheKey, data);
  return data; // [{ cinema_code, cinema_name, distance_m }, …]
}

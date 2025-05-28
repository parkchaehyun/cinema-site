// src/services/cinemaService.js
import { supabase } from '../lib/supabase';

export async function listCinemasByDistance(lat, lng) {
  const { data, error } = await supabase.rpc('get_cinemas_by_distance', {
    in_user_lat: lat,
    in_user_lng: lng,
  });
  if (error) throw error;
  return data;             // [{ cinema_code, cinema_name, distance_m }, …]
}

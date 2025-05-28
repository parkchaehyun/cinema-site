import { supabase } from '../lib/supabase'

export async function listMovieDates(movieId) {
  const { data, error } = await supabase
    .from('upcoming_screenings')
    .select('play_date')
    .eq('movie_id', movieId)
    .order('play_date', { ascending: true })

  if (error) throw error

  // // Dedupe just in case
  const dates = Array.from(new Set(data.map(r => r.play_date)))
  return dates
}

// 2) Get nearby screenings for a movie
export async function getNearbyScreenings(movieId, lat, lng, date) {
  const { data, error } = await supabase
    .rpc('get_nearby_screenings', {
      in_movie_id:   movieId,
      in_user_lat:   lat,
      in_user_lng:   lng,
      in_target_date: date,           // pass YYYY-MM-DD
    });
  if (error) throw error;
  return data;
}

// 3) Get timetable for a single cinema
// src/services/screeningService.js
export async function getCinemaTimetable(cinemaCode, date) {
  const { data, error } = await supabase
    .from('upcoming_screenings')
    .select(`
      screen_name,
      start_dt,
      end_dt,
      remain_seat_cnt,
      total_seat_cnt,
      url,
      movie:movies(title)
    `)
    .eq('cinema_code', cinemaCode)
    .eq('play_date', date)
    .order('start_dt', { ascending: true });

  if (error) throw error;
  return data;
}

// 4) List all cinemas with coords
export async function listCinemas() {
  const { data, error } = await supabase
    .from('cinemas')
    .select('cinema_code, name, latitude, longitude')
  if (error) throw error
  return data
}

export async function listCinemaDates(cinemaCode) {
  const { data, error } = await supabase
    .from('upcoming_screenings')
    .select('play_date')
    .eq('cinema_code', cinemaCode)
    .order('play_date', { ascending: true });

  if (error) throw error;
  // extract strings and dedupe
  const dates = Array.from(new Set(data.map(r => r.play_date)));
  return dates;
}

export async function getCinemaScreenings(cinemaCode) {
  const { data, error } = await supabase
    .from('upcoming_screenings')
    .select(`
      play_date,
      start_dt,
      end_dt,
      screen_name,
      remain_seat_cnt,
      total_seat_cnt,
      url,
      movie:movies(title)
    `)
    .eq('cinema_code', cinemaCode)
    .order('play_date', { ascending: true })
    .order('start_dt', { ascending: true });

  if (error) throw error;
  return data;
}


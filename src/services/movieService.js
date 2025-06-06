﻿// src/services/movieService.js
import { supabase } from '../lib/supabase';

export async function listUpcomingMovies() {
  const { data, error } = await supabase
    .from('upcoming_movie_counts')
    .select('id, title, poster_url, num_screenings')
  
  if (error) throw error

  // Optionally drop the count if you don’t want it in props:
  return data.map(({ id, title, poster_url }) => ({ id, title, poster_url }))
}

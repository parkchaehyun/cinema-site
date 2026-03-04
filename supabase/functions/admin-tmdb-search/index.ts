import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Auth check
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt ?? '');
  if (authError || !user) return new Response('Unauthorized', { status: 401 });

  const allowed = (Deno.env.get('ADMIN_EMAILS') ?? '').split(',').map((e) => e.trim());
  if (!allowed.includes(user.email!)) return new Response('Forbidden', { status: 403 });

  // Parse request body
  let query: string;
  try {
    const body = await req.json();
    query = body?.query?.trim();
    if (!query) return jsonResponse({ error: 'query is required' }, 400);
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  // Call TMDB search
  const tmdbKey = Deno.env.get('TMDB_API_KEY');
  if (!tmdbKey) return jsonResponse({ error: 'TMDB_API_KEY not configured' }, 500);

  const tmdbUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=ko-KR&page=1`;
  const tmdbResp = await fetch(tmdbUrl, {
    headers: { Authorization: `Bearer ${tmdbKey}` },
  });

  if (!tmdbResp.ok) {
    return jsonResponse({ error: 'TMDB search failed', status: tmdbResp.status }, 502);
  }

  const tmdbData = await tmdbResp.json();
  const results = (tmdbData.results ?? []).slice(0, 20).map((m: Record<string, unknown>) => ({
    tmdb_id: m.id,
    title: m.title,
    original_title: m.original_title,
    poster_path: m.poster_path,
    release_date: m.release_date,
    original_language: m.original_language,
    popularity: m.popularity,
  }));

  return jsonResponse({ results });
});

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

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { movie_id, action, tmdb_id, poster_url, original_title, release_date, tmdb_language, tmdb_match_score, lock } = body as {
    movie_id: number;
    action: 'set' | 'clear' | 'lock' | 'unlock';
    tmdb_id?: number;
    poster_url?: string;
    original_title?: string;
    release_date?: string;
    tmdb_language?: string;
    tmdb_match_score?: number;
    lock?: boolean;
  };

  if (!movie_id || !action) {
    return jsonResponse({ error: 'movie_id and action are required' }, 400);
  }

  if (action === 'set' && !tmdb_id) {
    return jsonResponse({ error: 'tmdb_id is required for action=set' }, 400);
  }

  // Fetch current movie state for audit log
  const { data: currentMovie } = await supabaseAdmin
    .from('movies')
    .select('tmdb_id')
    .eq('id', movie_id)
    .single();

  const oldTmdbId = currentMovie?.tmdb_id ?? null;

  let updatePayload: Record<string, unknown> = {};
  let auditAction = action;

  if (action === 'set') {
    updatePayload = {
      tmdb_id,
      poster_url,
      original_title,
      release_date,
      tmdb_language,
      tmdb_match_score,
      tmdb_match_source: 'manual',
    };
    if (lock === true) updatePayload.tmdb_locked = true;
    auditAction = 'set_match';
  } else if (action === 'clear') {
    updatePayload = {
      tmdb_id: null,
      poster_url: null,
      original_title: null,
      release_date: null,
      tmdb_language: null,
      tmdb_match_score: null,
      tmdb_match_source: 'auto',
      tmdb_locked: false,
    };
    auditAction = 'clear_match';
  } else if (action === 'lock') {
    updatePayload = { tmdb_locked: true };
  } else if (action === 'unlock') {
    updatePayload = { tmdb_locked: false };
  } else {
    return jsonResponse({ error: 'Invalid action' }, 400);
  }

  const { error: updateError } = await supabaseAdmin
    .from('movies')
    .update(updatePayload)
    .eq('id', movie_id);

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 500);
  }

  // Log action
  await supabaseAdmin.from('movie_admin_actions').insert({
    movie_id,
    admin_email: user.email,
    action: auditAction,
    old_tmdb_id: oldTmdbId,
    new_tmdb_id: action === 'set' ? tmdb_id : (action === 'clear' ? null : oldTmdbId),
  });

  return jsonResponse({ ok: true });
});

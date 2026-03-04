import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const SUPABASE_FUNCTIONS_URL = process.env.REACT_APP_SUPABASE_URL
  ? process.env.REACT_APP_SUPABASE_URL.replace('.supabase.co', '.supabase.co/functions/v1')
  : '';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

function statusChip(movie) {
  if (movie.tmdb_locked) return { label: '잠금', bg: '#7c3aed', color: '#fff' };
  if (!movie.tmdb_id) return { label: '없음', bg: '#fee2e2', color: '#b91c1c' };
  if (movie.tmdb_match_source === 'manual') return { label: '수동', bg: '#d1fae5', color: '#065f46' };
  return { label: '자동', bg: '#dbeafe', color: '#1e40af' };
}

async function callEdgeFunction(name, body, token) {
  const r = await fetch(`${SUPABASE_FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!r.ok && r.headers.get('content-type')?.includes('application/json') === false) {
    return { error: `HTTP ${r.status}: ${await r.text()}` };
  }
  return r.json();
}

export default function AdminMovies({ session }) {
  const [movies, setMovies] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [filterNoTmdb, setFilterNoTmdb] = useState(false);
  const [selected, setSelected] = useState(null);
  const [screenings, setScreenings] = useState([]);
  const [tmdbQuery, setTmdbQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchMovies = useCallback(async () => {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title, canonical_title, tmdb_id, poster_url, tmdb_locked, tmdb_match_source')
      .order('title');
    if (!error) setMovies(data ?? []);
  }, []);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  useEffect(() => {
    let list = movies;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((m) =>
        (m.title ?? '').toLowerCase().includes(q) ||
        (m.canonical_title ?? '').toLowerCase().includes(q)
      );
    }
    if (filterNoTmdb) list = list.filter((m) => !m.tmdb_id);
    setFiltered(list);
  }, [movies, search, filterNoTmdb]);

  const selectMovie = useCallback(async (movie) => {
    setSelected(movie);
    setTmdbQuery(movie.canonical_title ?? movie.title ?? '');
    setTmdbResults([]);
    setStatusMsg('');

    const { data } = await supabase
      .from('upcoming_screenings')
      .select('play_date, start_dt, cinema_name')
      .eq('movie_id', movie.id)
      .order('play_date')
      .limit(15);
    setScreenings(data ?? []);
  }, []);

  const handleTmdbSearch = async () => {
    if (!tmdbQuery.trim()) return;
    setTmdbLoading(true);
    setTmdbResults([]);
    const result = await callEdgeFunction('admin-tmdb-search', { query: tmdbQuery.trim() }, session.access_token);
    setTmdbLoading(false);
    if (result.results) setTmdbResults(result.results);
    else setStatusMsg(result.error ?? '검색 실패');
  };

  const applyCandidate = async (candidate) => {
    if (!selected) return;
    setActionLoading(true);
    setStatusMsg('');
    const result = await callEdgeFunction('admin-set-tmdb-match', {
      movie_id: selected.id,
      action: 'set',
      tmdb_id: candidate.tmdb_id,
      poster_url: candidate.poster_path ? `${TMDB_IMAGE_BASE}${candidate.poster_path}` : null,
      original_title: candidate.original_title,
      release_date: candidate.release_date,
      tmdb_language: candidate.original_language,
      tmdb_match_score: candidate.popularity != null ? Math.round(candidate.popularity) : null,
    }, session.access_token);
    setActionLoading(false);
    if (result.ok) {
      setStatusMsg('적용 완료');
      await fetchMovies();
      // Refresh selected movie state
      setSelected((prev) => prev ? {
        ...prev,
        tmdb_id: candidate.tmdb_id,
        poster_url: candidate.poster_path ? `${TMDB_IMAGE_BASE}${candidate.poster_path}` : prev.poster_url,
        tmdb_match_source: 'manual',
      } : prev);
    } else {
      setStatusMsg(result.error ?? '오류 발생');
    }
  };

  const doAction = async (action) => {
    if (!selected) return;
    setActionLoading(true);
    setStatusMsg('');
    const result = await callEdgeFunction('admin-set-tmdb-match', {
      movie_id: selected.id,
      action,
    }, session.access_token);
    setActionLoading(false);
    if (result.ok) {
      const msgs = { clear: '초기화 완료', lock: '잠금 완료', unlock: '잠금 해제 완료' };
      setStatusMsg(msgs[action] ?? '완료');
      await fetchMovies();
      setSelected((prev) => {
        if (!prev) return prev;
        if (action === 'clear') return { ...prev, tmdb_id: null, poster_url: null, tmdb_match_source: 'auto', tmdb_locked: false };
        if (action === 'lock') return { ...prev, tmdb_locked: true };
        if (action === 'unlock') return { ...prev, tmdb_locked: false };
        return prev;
      });
    } else {
      setStatusMsg(result.error ?? '오류 발생');
    }
  };

  const handleSignOut = () => supabase.auth.signOut();

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      {/* Left panel */}
      <div style={{ width: '38%', minWidth: 260, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, color: '#111827' }}>
            Indie<span style={{ color: '#6366f1' }}>Go</span> 관리자
          </div>
          <input
            type="text"
            placeholder="영화 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box', marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="checkbox" checked={filterNoTmdb} onChange={(e) => setFilterNoTmdb(e.target.checked)} />
              TMDB 없음
            </label>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: 8 }}>
          {filtered.map((movie) => {
            const chip = statusChip(movie);
            const isSelected = selected?.id === movie.id;
            return (
              <div
                key={movie.id}
                onClick={() => selectMovie(movie)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: isSelected ? '#eef2ff' : 'transparent',
                  marginBottom: 2,
                  border: isSelected ? '1px solid #c7d2fe' : '1px solid transparent',
                }}
              >
                <div style={{ width: 36, height: 52, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: '#f3f4f6' }}>
                  {movie.poster_url
                    ? <img src={movie.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎬</div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {movie.title ?? movie.canonical_title}
                  </div>
                  <span style={{ fontSize: 11, background: chip.bg, color: chip.color, borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>
                    {chip.label}
                  </span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 40 }}>결과 없음</div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f9fafb' }}>
        {!selected ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: 14 }}>
            영화를 선택하세요
          </div>
        ) : (
          <div style={{ padding: 24, maxWidth: 800 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
                {selected.title ?? selected.canonical_title}
              </h2>
              <button
                onClick={handleSignOut}
                style={{ fontSize: 12, color: '#6b7280', background: 'none', border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
              >
                로그아웃
              </button>
            </div>

            {/* Current state */}
            <div style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid #e5e7eb', display: 'flex', gap: 16 }}>
              <div style={{ width: 80, height: 116, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#f3f4f6' }}>
                {selected.poster_url
                  ? <img src={selected.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎬</div>
                }
              </div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
                <div><b>TMDB ID:</b> {selected.tmdb_id ?? '없음'}</div>
                <div><b>출처:</b> {selected.tmdb_match_source ?? 'auto'}</div>
                <div><b>잠금:</b> {selected.tmdb_locked ? '잠김 🔒' : '해제됨'}</div>
              </div>
            </div>

            {/* Upcoming screenings */}
            {screenings.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>예정 상영</div>
                <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.8 }}>
                  {screenings.map((s, i) => (
                    <div key={i}>{s.play_date} — {s.cinema_name} {s.start_dt ? `(${s.start_dt})` : ''}</div>
                  ))}
                </div>
              </div>
            )}

            {/* TMDB Search */}
            <div style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>TMDB 검색</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  value={tmdbQuery}
                  onChange={(e) => setTmdbQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTmdbSearch()}
                  placeholder="검색어..."
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
                />
                <button
                  onClick={handleTmdbSearch}
                  disabled={tmdbLoading}
                  style={{ padding: '8px 16px', borderRadius: 6, background: '#6366f1', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {tmdbLoading ? '...' : '검색'}
                </button>
              </div>
              {tmdbResults.map((c) => (
                <div key={c.tmdb_id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ width: 44, height: 64, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: '#f3f4f6' }}>
                    {c.poster_path
                      ? <img src={`${TMDB_IMAGE_BASE}${c.poster_path}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎬</div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 12 }}>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{c.title}</div>
                    <div style={{ color: '#6b7280' }}>{c.original_title}</div>
                    <div style={{ color: '#9ca3af' }}>{c.release_date?.slice(0, 4)} · {c.original_language} · 인기 {c.popularity != null ? Math.round(c.popularity) : '-'}</div>
                  </div>
                  <button
                    onClick={() => applyCandidate(c)}
                    disabled={actionLoading}
                    style={{ padding: '5px 12px', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                  >
                    적용
                  </button>
                </div>
              ))}
            </div>

            {/* Status */}
            {statusMsg && (
              <div style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, marginBottom: 12 }}>{statusMsg}</div>
            )}

            {/* Bottom actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => doAction('clear')}
                disabled={actionLoading}
                style={{ padding: '8px 16px', borderRadius: 6, background: '#fee2e2', color: '#b91c1c', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                매칭 초기화
              </button>
              {selected.tmdb_locked ? (
                <button
                  onClick={() => doAction('unlock')}
                  disabled={actionLoading}
                  style={{ padding: '8px 16px', borderRadius: 6, background: '#f3f4f6', color: '#374151', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  잠금 해제
                </button>
              ) : (
                <button
                  onClick={() => doAction('lock')}
                  disabled={actionLoading}
                  style={{ padding: '8px 16px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  잠금
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const CACHE_PREFIX = 'cinema_site_cache:';
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

function now() {
  return Date.now();
}

function hasSessionStorage() {
  return typeof window !== 'undefined' && !!window.sessionStorage;
}

function fullKey(key) {
  return `${CACHE_PREFIX}${key}`;
}

export function roundCoord(value) {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return 'nan';
  return num.toFixed(3);
}

export function getCachedJson(key) {
  if (!hasSessionStorage()) return null;
  const raw = window.sessionStorage.getItem(fullKey(key));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.expiresAt !== 'number') return null;
    if (parsed.expiresAt < now()) {
      window.sessionStorage.removeItem(fullKey(key));
      return null;
    }
    return parsed.value ?? null;
  } catch (err) {
    return null;
  }
}

export function setCachedJson(key, value, ttlMs = DEFAULT_TTL_MS) {
  if (!hasSessionStorage()) return;
  const payload = {
    value,
    expiresAt: now() + ttlMs,
  };
  window.sessionStorage.setItem(fullKey(key), JSON.stringify(payload));
}

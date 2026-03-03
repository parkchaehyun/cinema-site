import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getIpBasedLocation } from '../services/locationService';

const DEFAULT_COORDS = { lat: 37.5665, lng: 126.9780 }; // Seoul
const STORAGE_KEY = 'cinema_site_last_geo';
const GEO_TIMEOUT_MS = 8000;
const GEO_TIMEOUT_RETRY_MS = 10000;

const GeoContext = createContext(null);

function safeParseFloat(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readCachedCoords() {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const lat = safeParseFloat(parsed.lat);
    const lng = safeParseFloat(parsed.lng);
    if (lat == null || lng == null) return null;
    return {
      lat,
      lng,
      source: parsed.source || 'cache',
    };
  } catch (err) {
    return null;
  }
}

function writeCachedCoords(coords) {
  if (typeof window === 'undefined') return;
  if (!coords || coords.lat == null || coords.lng == null) return;
  window.sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      lat: coords.lat,
      lng: coords.lng,
      source: coords.source || 'cache',
      savedAt: Date.now(),
    })
  );
}

function mapGeoErrorMessage(err) {
  if (!err) return 'Could not access your location.';
  if (err.code === err.PERMISSION_DENIED) {
    return 'Location permission is blocked in the browser.';
  }
  if (err.code === err.POSITION_UNAVAILABLE) {
    return 'Location information is unavailable.';
  }
  if (err.code === err.TIMEOUT) {
    return 'Timed out while getting your location.';
  }
  return 'Could not access your location.';
}

function requestBrowserCoords(timeoutMs) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation API is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: timeoutMs,
      maximumAge: 5 * 60 * 1000,
    });
  });
}

async function getPermissionState() {
  if (
    typeof navigator === 'undefined' ||
    !navigator.permissions ||
    !navigator.permissions.query
  ) {
    return 'unknown';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state || 'unknown';
  } catch (err) {
    return 'unknown';
  }
}

export function GeoProvider({ children }) {
  const cached = readCachedCoords();
  const [position, setPosition] = useState(
    cached || { ...DEFAULT_COORDS, source: 'default' }
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionState, setPermissionState] = useState('unknown');
  const initializedRef = useRef(false);

  const applyPosition = useCallback((next, { persist = true } = {}) => {
    setPosition(next);
    if (persist) {
      writeCachedCoords(next);
    }
  }, []);

  const resolveLocation = useCallback(
    async ({ userInitiated = false } = {}) => {
      setIsLoading(true);

      // For click-triggered retries, call geolocation immediately so browsers
      // can treat it as a direct user gesture (re-prompt when possible).
      if (!userInitiated) {
        const permission = await getPermissionState();
        setPermissionState(permission);
      }

      try {
        const geo = await requestBrowserCoords(
          userInitiated ? GEO_TIMEOUT_RETRY_MS : GEO_TIMEOUT_MS
        );
        const next = {
          lat: geo.coords.latitude,
          lng: geo.coords.longitude,
          source: 'gps',
        };
        applyPosition(next);
        setError(null);
        const permission = await getPermissionState();
        setPermissionState(permission);
        return;
      } catch (geoErr) {
        const geoMessage = mapGeoErrorMessage(geoErr);
        const permission = await getPermissionState();
        if (permission !== 'unknown') {
          setPermissionState(permission);
        } else if (geoErr && geoErr.code === geoErr.PERMISSION_DENIED) {
          setPermissionState('denied');
        }

        try {
          const ipCoords = await getIpBasedLocation();
          applyPosition({
            lat: ipCoords.lat,
            lng: ipCoords.lng,
            source: 'ip',
          });
          setError(`${geoMessage} Using approximate IP-based location.`);
          return;
        } catch (ipErr) {
          const fallback = readCachedCoords();
          if (fallback) {
            applyPosition(
              {
                lat: fallback.lat,
                lng: fallback.lng,
                source: 'cache',
              },
              { persist: false }
            );
            setError(`${geoMessage} Using your last known location.`);
            return;
          }

          applyPosition(
            {
              ...DEFAULT_COORDS,
              source: 'default',
            },
            { persist: false }
          );
          setError(`${geoMessage} Using default location (Seoul).`);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [applyPosition]
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    resolveLocation();
  }, [resolveLocation]);

  const contextValue = useMemo(
    () => ({
      lat: position.lat,
      lng: position.lng,
      source: position.source,
      error,
      isLoading,
      permissionState,
      requestLocation: () => resolveLocation({ userInitiated: true }),
    }),
    [error, isLoading, permissionState, position, resolveLocation]
  );

  return <GeoContext.Provider value={contextValue}>{children}</GeoContext.Provider>;
}

export function useGeo() {
  const context = useContext(GeoContext);
  if (!context) {
    throw new Error('useGeo must be used within GeoProvider');
  }
  return context;
}

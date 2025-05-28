// src/hooks/useNaverMaps.js
import { useState, useEffect } from 'react';

export function useNaverMaps() {
  const [ready, setReady] = useState(() =>
    !!(window.naver && window.naver.maps)
  );

  useEffect(() => {
    if (ready) return;                 // already loaded

    // check if we injected it on a previous mount
    const existing = document.querySelector(
      'script[data-navermaps-sdk]'
    );
    if (existing) {
      existing.addEventListener('load', () => setReady(true));
      return;
    }

    const key = process.env.REACT_APP_NAVER_KEY_ID;
    if (!key) {
      console.error('NAVER key missing');
      return;
    }

    const el = document.createElement('script');
    el.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${key}`;
    el.async = true;
    el.dataset.navermapsSdk = 'true';  // tag it so we can find it later
    el.onload  = () => setReady(true);
    el.onerror = () => console.error('NAVER script failed to load');
    document.head.appendChild(el);

    // ⭐ DO NOT remove the script on unmount
  }, [ready]);

  return ready;
}

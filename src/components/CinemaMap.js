// src/components/CinemaMap.js  (NAVER version)
import React, { useEffect, useRef, useState } from 'react';
import { useGeo }          from '../hooks/useGeo';
import { useNaverMaps }    from '../hooks/useNaverMaps';
import { listCinemas }     from '../services/screeningService';
import CinemaOverlay       from './CinemaOverlay';

export default function CinemaMap() {
  const mapsReady        = useNaverMaps();
  const { lat, lng }     = useGeo();
  const [cinemas, setCinemas]   = useState([]);
  const [selected, setSelected] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => { if (mapsReady) listCinemas().then(setCinemas); }, [mapsReady]);

  useEffect(() => {
    if (!mapsReady || lat == null || lng == null) return;

    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(lat, lng),
      zoom: 12,
    });


    // cinema pins
    cinemas.forEach(c => {
      const m = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(c.latitude, c.longitude),
        map,
      });
      window.naver.maps.Event.addListener(m, 'click', () => setSelected(c));
    });
  }, [mapsReady, lat, lng, cinemas]);

  if (!mapsReady || lat == null || lng == null) return <p>Loading map…</p>;

  return (
    <>
      <div ref={mapRef} style={{ height: '80vh', width: '100%' }} />
      {selected && <CinemaOverlay cinema={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
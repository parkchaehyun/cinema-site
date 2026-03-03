import React, { useEffect, useRef, useState } from 'react';
import { useGeo } from '../hooks/useGeo';
import { useNaverMaps } from '../hooks/useNaverMaps';
import { listCinemasByDistance } from '../services/cinemaService'
import CinemaOverlay from './CinemaOverlay';
import LocationStatusBar from './LocationStatusBar';

const MARKER_DEFAULT = '#2563EB';
const MARKER_SELECTED = '#DC2626';

function makeMarkerIcon(color) {
  return {
    content: `<div style="width:38px;height:38px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:pointer;"></div>`,
    anchor: new window.naver.maps.Point(19, 19),
  };
}

export default function CinemaMap() {
  const mapsReady = useNaverMaps();
  const { lat, lng, source } = useGeo();
  const showDistance = source !== 'default';
  const [cinemas, setCinemas] = useState([]);
  const [selected, setSelected] = useState(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]); // [{ cinema, marker }]

  useEffect(() => {
    if (mapsReady && lat != null && lng != null) {
      listCinemasByDistance(lat, lng).then(setCinemas).catch(console.error);
    }
  }, [mapsReady, lat, lng]);

  useEffect(() => {
    if (!mapsReady || lat == null || lng == null || cinemas.length === 0) return;

    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(lat, lng),
      zoom: 14,
    });

    const entries = [];
    cinemas.forEach(c => {
      const m = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(c.latitude, c.longitude),
        map,
        title: c.cinema_name,
        icon: makeMarkerIcon(MARKER_DEFAULT),
      });
      entries.push({ cinema: c, marker: m });
      window.naver.maps.Event.addListener(m, 'click', () => setSelected(c));
    });
    markersRef.current = entries;

    return () => {
      entries.forEach(({ marker }) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [mapsReady, lat, lng, cinemas]);

  // Update marker colors when selection changes
  useEffect(() => {
    markersRef.current.forEach(({ cinema, marker }) => {
      const isSelected = selected && selected.cinema_code === cinema.cinema_code;
      marker.setIcon(makeMarkerIcon(isSelected ? MARKER_SELECTED : MARKER_DEFAULT));
    });
  }, [selected]);

  if (!mapsReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
        <p className="text-gray-600 text-lg">지도 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-inter flex flex-col">
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        `}
      </style>

      <div className="px-4 pt-4 pb-2 bg-white border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">가까운 예술영화관</h1>
        <LocationStatusBar />
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ height: '45vh' }} className="w-full" />

      {/* Panel below map */}
      <div className="flex-1 overflow-hidden bg-white">
        {selected === null ? (
          /* Cinema list */
          <div className="h-full overflow-y-auto scrollbar-hide p-4 space-y-2">
            {cinemas.length === 0 ? (
              <p className="text-gray-600 text-center py-4">근처에 영화관이 없습니다.</p>
            ) : (
              cinemas.map(c => (
                <button
                  key={c.cinema_code}
                  onClick={() => setSelected(c)}
                  className="w-full flex justify-between items-center bg-gray-50 hover:bg-gray-100 rounded-md p-3 transition-colors duration-200 border border-gray-200 shadow-sm"
                >
                  <strong className="text-lg font-semibold text-gray-800">{c.cinema_name}</strong>
                  <span className="text-md text-gray-600">
                    {showDistance && c.distance_m ? `${(c.distance_m / 1000).toFixed(1)} km` : ''}
                  </span>
                </button>
              ))
            )}
          </div>
        ) : (
          /* Cinema detail */
          <div className="h-full flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setSelected(null)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                ← 목록
              </button>
              <h2 className="text-lg font-bold text-gray-900 truncate">{selected.cinema_name}</h2>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <CinemaOverlay cinema={selected} onClose={() => setSelected(null)} inline />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

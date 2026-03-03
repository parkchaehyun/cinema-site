import React, { useEffect, useRef, useState } from 'react';
import { useGeo } from '../hooks/useGeo';
import { useNaverMaps } from '../hooks/useNaverMaps';
import { listCinemasByDistance } from '../services/cinemaService'
import CinemaOverlay from './CinemaOverlay';
import LocationStatusBar from './LocationStatusBar';

const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };

function makePinIcon(color, number, selected = false) {
  const w = selected ? 40 : 32;
  const h = selected ? 52 : 42;
  return {
    content: `<div style="cursor:pointer;width:${w}px;height:${h}px">
      <svg width="${w}" height="${h}" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16,40 C9,32 3,24 3,14 C3,7.9 9,3 16,3 C23,3 29,7.9 29,14 C29,24 23,32 16,40 Z" fill="${color}" stroke="white" stroke-width="3"/>
        <text x="16" y="15" text-anchor="middle" dominant-baseline="central" fill="white" font-size="12" font-weight="700" font-family="Inter,sans-serif">${number}</text>
      </svg>
    </div>`,
    anchor: new window.naver.maps.Point(w / 2, h),
  };
}

function makeLocationIcon() {
  return {
    content: `<div style="width:16px;height:16px;background:#16A34A;border:3px solid white;border-radius:50%;animation:location-pulse 2s infinite;"></div>`,
    anchor: new window.naver.maps.Point(8, 8),
  };
}

export default function CinemaMap() {
  const mapsReady = useNaverMaps();
  const { lat, lng, source } = useGeo();
  const showDistance = source !== 'default';
  const [cinemas, setCinemas] = useState([]);
  const [selected, setSelected] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const locationMarkerRef = useRef(null);

  useEffect(() => {
    if (mapsReady && lat != null && lng != null) {
      listCinemasByDistance(lat, lng).then(setCinemas).catch(console.error);
    }
  }, [mapsReady, lat, lng]);

  useEffect(() => {
    if (!mapsReady || cinemas.length === 0) return;

    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
      zoom: 12,
      mapTypeId: window.naver.maps.MapTypeId.NORMAL,
    });
    mapInstanceRef.current = map;

    const entries = [];
    cinemas.forEach((c, i) => {
      const m = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(c.latitude, c.longitude),
        map,
        title: c.cinema_name,
        icon: makePinIcon('#6366F1', i + 1, false),
      });
      entries.push({ cinema: c, marker: m, index: i });
      window.naver.maps.Event.addListener(m, 'click', () => setSelected(c));
    });
    markersRef.current = entries;

    return () => {
      mapInstanceRef.current = null;
      entries.forEach(({ marker }) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [mapsReady, cinemas]);

  // Location marker — runs after map is created, re-runs when location updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || source === 'default' || lat == null || lng == null) return;

    const marker = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(lat, lng),
      map,
      icon: makeLocationIcon(),
      zIndex: 100,
    });
    locationMarkerRef.current = marker;

    return () => { marker.setMap(null); };
  }, [lat, lng, source, mapsReady, cinemas]);

  // Update pin colors/size on selection change
  useEffect(() => {
    markersRef.current.forEach(({ cinema, marker, index }) => {
      const isSelected = selected && selected.cinema_code === cinema.cinema_code;
      marker.setIcon(makePinIcon(isSelected ? '#DC2626' : '#6366F1', index + 1, isSelected));
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
        .font-inter { font-family: 'Inter', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes location-pulse {
          0%   { box-shadow: 0 0 0 0   rgba(22,163,74,0.5); }
          70%  { box-shadow: 0 0 0 10px rgba(22,163,74,0);   }
          100% { box-shadow: 0 0 0 0   rgba(22,163,74,0);   }
        }
        `}
      </style>

      <div className="px-4 pt-4 pb-2 bg-white border-b border-gray-200">
        <LocationStatusBar />
      </div>

      <div ref={mapRef} style={{ height: '45vh' }} className="w-full" />

      <div className="flex-1 overflow-hidden bg-white">
        {selected === null ? (
          <div className="h-full overflow-y-auto scrollbar-hide p-4 space-y-2">
            {cinemas.length === 0 ? (
              <p className="text-gray-600 text-center py-4">근처에 영화관이 없습니다.</p>
            ) : (
              cinemas.map((c, i) => (
                <button
                  key={c.cinema_code}
                  onClick={() => setSelected(c)}
                  className="w-full flex justify-between items-center bg-gray-50 hover:bg-gray-100 rounded-md p-3 transition-colors duration-200 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <strong className="text-lg font-semibold text-gray-800">{c.cinema_name}</strong>
                  </div>
                  <span className="text-sm text-gray-600">
                    {showDistance && c.distance_m ? `${(c.distance_m / 1000).toFixed(1)} km` : ''}
                  </span>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setSelected(null)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
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

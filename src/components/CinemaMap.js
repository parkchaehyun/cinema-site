import React, { useEffect, useRef, useState } from 'react';
import { useGeo } from '../hooks/useGeo';
import { useNaverMaps } from '../hooks/useNaverMaps';
import { listCinemasByDistance } from '../services/cinemaService'
import CinemaOverlay from './CinemaOverlay';

export default function CinemaMap() {
  const mapsReady = useNaverMaps();
  const { lat, lng, error: geoError, isLoading: isGeoLoading, requestLocation } = useGeo();
  const [cinemas, setCinemas] = useState([]);
  const [selected, setSelected] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapsReady && lat != null && lng != null) {
      listCinemasByDistance(lat, lng).then(setCinemas).catch(console.error);
    }
  }, [mapsReady, lat, lng]);

  useEffect(() => {
    if (!mapsReady || lat == null || lng == null || cinemas.length === 0) return;

    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(lat, lng),
      zoom: 12,
    });

    const markers = [];
    cinemas.forEach(c => {
      const m = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(c.latitude, c.longitude),
        map,
        title: c.cinema_name,
      });
      markers.push(m);
      window.naver.maps.Event.addListener(m, 'click', () => setSelected(c));
    });

    return () => {
      markers.forEach(m => m.setMap(null));
    };
  }, [mapsReady, lat, lng, cinemas]);

  // Handle loading and error states
  if (isGeoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
        <p className="text-gray-600 text-lg">Getting your location...</p>
      </div>
    );
  }
  
  if (geoError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 font-inter text-center">
        <p className="text-lg text-red-600 mb-2">Could not get your location</p>
        <p className="text-gray-600 mb-4">{geoError}</p>
        <button
          onClick={requestLocation}
          className="px-6 py-2 rounded-full text-lg font-medium transition-colors duration-200 bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!mapsReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
        <p className="text-gray-600 text-lg">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-inter flex flex-col items-center">
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
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">가까운 예술영화관</h1>

        <div ref={mapRef} className="w-full rounded-lg overflow-hidden border border-gray-300 mb-4" style={{ height: '60vh' }} />

        <div className="max-h-[30vh] overflow-y-auto scrollbar-hide space-y-2 p-2">
          {cinemas.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No cinemas found nearby.</p>
          ) : (
            cinemas.map(c => (
              <button
                key={c.cinema_code}
                onClick={() => setSelected(c)}
                className="w-full flex justify-between items-center bg-gray-50 hover:bg-gray-100 rounded-md p-3 transition-colors duration-200 border border-gray-200 shadow-sm"
              >
                <strong className="text-lg font-semibold text-gray-800">{c.cinema_name}</strong>
                <span className="text-md text-gray-600">
                  {(c.distance_m / 1000).toFixed(1)} km
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {selected && (
        <CinemaOverlay cinema={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
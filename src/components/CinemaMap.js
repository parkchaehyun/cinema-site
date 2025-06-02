import React, { useEffect, useRef, useState } from 'react';
import { useGeo }          from '../hooks/useGeo';
import { useNaverMaps }    from '../hooks/useNaverMaps';
import { listCinemasByDistance } from '../services/cinemaService'
import CinemaOverlay       from './CinemaOverlay';

export default function CinemaMap() {
  const mapsReady        = useNaverMaps();
  const { lat, lng }     = useGeo();
  const [cinemas, setCinemas]   = useState([]);
  const [selected, setSelected] = useState(null); // Keeping original state name 'selected'
  const mapRef = useRef(null);

  // Original useEffect for loading cinemas
  useEffect(() => {
    if (mapsReady && lat != null && lng != null) { // Ensure lat and lng are not null before fetching
      listCinemasByDistance(lat, lng).then(setCinemas).catch(console.error);
    }
  }, [mapsReady, lat, lng]); // Dependencies remain original

  // Original useEffect for map initialization and markers
  useEffect(() => {
    if (!mapsReady || lat == null || lng == null || cinemas.length === 0) return; // Add cinemas.length check to prevent re-rendering map with no data

    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(lat, lng),
      zoom: 12,
      // minZoom: 8, // Added for better UX
      // maxZoom: 18, // Added for better UX
      // zoomControl: true, // Added zoom control
      // zoomControlOptions: {
      //   position: window.naver.maps.Position.TOP_RIGHT // Position zoom control
      // }
    });

    // Clear existing markers to prevent duplicates on re-render
    const markers = [];
    cinemas.forEach(c => {
      const m = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(c.latitude, c.longitude),
        map,
        title: c.cinema_name, // Add title for hover tooltip
      });
      markers.push(m); // Store marker for cleanup
      window.naver.maps.Event.addListener(m, 'click', () => setSelected(c));
    });

    // Cleanup function to remove markers when component unmounts or dependencies change
    return () => {
      markers.forEach(m => m.setMap(null));
    };
  }, [mapsReady, lat, lng, cinemas]); // Dependencies remain original

  // Original loading message
  if (!mapsReady || lat == null || lng == null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
        <p className="text-gray-600 text-lg">Loading map…</p>
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
        /* Hide scrollbar for cinema list but allow scrolling */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
        `}
      </style>
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">가까운 예술영화관</h1>

        {/* Map */}
        <div ref={mapRef} className="w-full rounded-lg overflow-hidden border border-gray-300 mb-4" style={{ height: '60vh' }} />

        {/* List under map, already sorted by distance_m from SQL */}
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

      {/* Full-screen overlay */}
      {selected && (
        <CinemaOverlay cinema={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

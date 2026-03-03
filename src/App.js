import React, { useState } from 'react';
import MovieScreeningsList from './components/MovieScreeningsList';
import CinemaMap from './components/CinemaMap'; // Original import
import { GeoProvider } from './hooks/useGeo';
import { Analytics } from '@vercel/analytics/react';

function App() {
  const [view, setView] = useState('movie');

  return (
    <>
    <GeoProvider>
      <div className="font-inter">
        <style>
          {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          .font-inter {
            font-family: 'Inter', sans-serif;
          }
          `}
        </style>
        <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <span className="text-lg sm:text-xl font-bold tracking-tight select-none">
            <span className="text-gray-900">Indie</span><span className="text-indigo-500">Go</span>
          </span>
          <div className="flex gap-2">
            <button
              className={`px-3 sm:px-5 py-1.5 rounded-full text-sm sm:text-base font-medium transition-colors duration-200
                ${view === 'movie'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
              onClick={() => setView('movie')}
            >
              🎬 영화
            </button>
            <button
              className={`px-3 sm:px-5 py-1.5 rounded-full text-sm sm:text-base font-medium transition-colors duration-200
                ${view === 'map'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
              onClick={() => setView('map')}
            >
              📍 극장
            </button>
          </div>
        </nav>

        {view === 'movie' && (
          <>
            {/* MovieSelector is removed. MovieScreeningsList now handles movie selection internally. */}
            {/* No movieId prop is passed as it's managed within MovieScreeningsList */}
            <MovieScreeningsList />
          </>
        )}

        {view === 'map' && <CinemaMap />}
      </div>
    </GeoProvider>
    <Analytics />
    </>
  );
}

export default App;

import React, { useState } from 'react';
import MovieScreeningsList from './components/MovieScreeningsList';
import CinemaMap from './components/CinemaMap'; // Original import
import { GeoProvider } from './hooks/useGeo';

function App() {
  const [view, setView] = useState('movie');

  return (
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
        <nav className="bg-white shadow-md p-4 flex justify-center space-x-4">
          <button
            className={`px-6 py-2 rounded-full text-lg font-medium transition-colors duration-200
              ${view === 'movie'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            onClick={() => setView('movie')}
          >
            🎬 Movies
          </button>
          <button
            className={`px-6 py-2 rounded-full text-lg font-medium transition-colors duration-200
              ${view === 'map'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            onClick={() => setView('map')}
          >
            🗺️ Map
          </button>
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
  );
}

export default App;

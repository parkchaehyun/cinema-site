import React, { useState } from 'react'
import MovieSelector from './components/MovieSelector'
import MovieScreeningsList from './components/MovieScreeningsList'
import CinemaMap from './components/CinemaMap'

function App() {
  const [view, setView] = useState('movie')  // or 'map'
  const [movieId, setMovieId] = useState(null)

  return (
    <div>
      <nav>
        <button onClick={() => setView('movie')}>🎬 Movies</button>
        <button onClick={() => setView('map')}>🗺️ Map</button>
      </nav>

      {view === 'movie' && (
        <>
          <MovieSelector onSelect={setMovieId} />
          <MovieScreeningsList movieId={parseInt(movieId)} />
        </>
      )}

      {view === 'map' && <CinemaMap />}
    </div>
  )
}

export default App

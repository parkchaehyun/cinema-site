import React, { useState, useEffect } from 'react'
import { listUpcomingMovies } from '../services/movieService'

export default function MovieSelector({ onSelect }) {
  const [movies, setMovies] = useState([])

  useEffect(() => {
    listUpcomingMovies().then(setMovies).catch(console.error)
  }, [])

  return (
    <select onChange={e => onSelect(e.target.value)}>
      <option value="">— Select a movie —</option>
      {movies.map(m => (
        <option key={m.id} value={m.id}>{m.title}</option>
      ))}
    </select>
  )
}

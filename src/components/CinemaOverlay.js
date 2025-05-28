// src/components/CinemaOverlay.js
import React, { useEffect, useState } from 'react'
import {
  listCinemaDates,
  getCinemaTimetable
} from '../services/screeningService'
import ScreeningCard from './ScreeningCard'
import './CinemaOverlay.css'

export default function CinemaOverlay({ cinema, onClose }) {
  const [dates, setDates]     = useState([])
  const [date, setDate]       = useState(null)
  const [screenings, setScreenings] = useState([])

  // 1) Load all upcoming dates for this cinema
  useEffect(() => {
    listCinemaDates(cinema.cinema_code)
      .then(dts => {
        setDates(dts)
        setDate(dts[0] ?? null)
      })
      .catch(console.error)
  }, [cinema.cinema_code])

  // 2) Whenever the selected date changes, fetch that day's shows
  useEffect(() => {
    if (!date) return
    getCinemaTimetable(cinema.cinema_code, date)
      .then(setScreenings)
      .catch(console.error)
  }, [cinema.cinema_code, date])

  // 3) Group today's screenings by movie title
  const byMovie = screenings.reduce((acc, s) => {
    const title = s.movie.title
    if (!acc[title]) acc[title] = []
    acc[title].push(s)
    return acc
  }, {})

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="overlay-window" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>{cinema.cinema_name}</h2>

        {dates.length > 0 && (
          <div className="date-tabs">
            {dates.map(d => (
              <button
                key={d}
                className={d === date ? 'active' : ''}
                onClick={() => setDate(d)}
              >
                {new Date(d).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric'
                })}
              </button>
            ))}
          </div>
        )}

        {screenings.length === 0 ? (
          <p>No showings on {date}.</p>
        ) : (
          Object.entries(byMovie).map(([title, shows]) => (
            <section key={title} className="movie-block">
              <h3>{title}</h3>
              <div className="show-list">
                {shows.map(s => (
                  <ScreeningCard
                    key={`${s.screen_name}-${s.start_dt}`}
                    screening={s}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

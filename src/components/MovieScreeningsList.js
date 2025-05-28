import React, { useState, useEffect } from 'react'
import { useGeo } from '../hooks/useGeo'
import {
  listMovieDates,
  getNearbyScreenings,
} from '../services/screeningService'
import ScreeningCard from './ScreeningCard'

export default function MovieScreeningsList({ movieId }) {
  const { lat, lng, error: geoError } = useGeo()
  const [dates, setDates] = useState([])
  const [date,  setDate]  = useState(null)
  const [data,  setData]  = useState([])

  // 1) When movieId changes, load its upcoming dates
  useEffect(() => {
    if (!movieId) {
      setDates([])
      setDate(null)
      return
    }
    listMovieDates(movieId)
      .then(dts => {
        setDates(dts)
        setDate(dts[0] ?? null)
      })
      .catch(console.error)
  }, [movieId])

  // 2) When date (or location) changes, fetch that day’s cinemas
  useEffect(() => {
    if (movieId && date && lat && lng) {
      getNearbyScreenings(movieId, lat, lng, date)
        .then(setData)
        .catch(console.error)
    }
  }, [movieId, date, lat, lng])

  if (!movieId)     return <p>Please select a movie.</p>
  if (geoError)     return <p>Geolocation error: {geoError}</p>
  if (dates.length===0) return <p>No upcoming showings.</p>

  return (
    <div>
      {/* Date tabs */}
      <div className="date-tabs">
        {dates.map(d => (
          <button
            key={d}
            className={d === date ? 'active' : ''}
            onClick={() => setDate(d)}
          >
            {new Date(d).toLocaleDateString(undefined, { month:'short', day:'numeric' })}
          </button>
        ))}
      </div>

      {/* Cinema cards for that date */}
      <div className="cinema-list">
        {data.length === 0
          ? <p>No showings on {date}.</p>
          : data.map(c => (
              <div key={c.cinema_code} className="card">
                <h3>{c.cinema_name}</h3>
                <p>{(c.distance_m/1000).toFixed(1)} km</p>
                <div className="showtimes">
                  {c.screenings.map(s => (
                    <ScreeningCard
                      key={`${c.cinema_code}-${s.start_dt}`}
                      screening={s}
                    />
                  ))}
                </div>
              </div>
            ))
        }
      </div>
    </div>
  )
}

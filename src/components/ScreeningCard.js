// src/components/ScreeningCard.js
import React from 'react'
import './ScreeningCard.css'

export default function ScreeningCard({ screening }) {
  const {
    screen_name,
    start_dt,
    end_dt,
    remain_seat_cnt,
    total_seat_cnt,
    url,
  } = screening

  const timeRange = `${start_dt} – ${end_dt}`
  const seatsLabel = `${remain_seat_cnt} / ${total_seat_cnt}`

  const handleClick = () => {
    if (url) window.open(url, '_blank', 'noopener')
  }

  return (
    <div
      className={`screening-card ${url ? 'clickable' : 'disabled'}`}
      onClick={handleClick}
    >
      <div className="screen-name">{screen_name}</div>
      <div className="time-range">{timeRange}</div>
      <div className="seats">{seatsLabel}</div>
    </div>
  )
}

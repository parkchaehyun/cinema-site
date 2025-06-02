import React, { useEffect, useState } from 'react'
import {
  listCinemaDates,
  getCinemaTimetable
} from '../services/screeningService'
import ScreeningCard from './ScreeningCard'

export default function CinemaOverlay({ cinema, onClose }) {
  const [dates, setDates]     = useState([])
  const [date, setDate]       = useState(null) // Keeping original state name 'date'
  const [screenings, setScreenings] = useState([])

  // 1) Load all upcoming dates for this cinema (Original Logic)
  useEffect(() => {
    listCinemaDates(cinema.cinema_code)
      .then(dts => {
        setDates(dts)
        setDate(dts[0] ?? null)
      })
      .catch(console.error)
  }, [cinema.cinema_code])

  // 2) Whenever the selected date changes, fetch that day's shows (Original Logic)
  useEffect(() => {
    if (!date) return // Using original state name 'date'
    getCinemaTimetable(cinema.cinema_code, date) // Using original state name 'date'
      .then(setScreenings)
      .catch(console.error)
  }, [cinema.cinema_code, date]) // Dependencies remain original

  // 3) Group today's screenings by movie title (Original Logic)
  const byMovie = screenings.reduce((acc, s) => {
    const title = s.movie.title
    if (!acc[title]) acc[title] = []
    acc[title].push(s)
    return acc
  }, {})

  // Helper to format date for display (Copied from MovieScreeningsList)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
  };

  return (
    // Overlay Backdrop
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 font-inter" onClick={onClose}>
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        /* Hide scrollbar for date tabs and movie selection but allow scrolling */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
        `}
      </style>
      {/* Overlay Window */}
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold p-1 rounded-full hover:bg-gray-100 transition-colors"
          onClick={onClose}
        >
          &times; {/* Unicode multiplication sign for a clean 'X' */}
        </button>

        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">{cinema.cinema_name}</h2>

        {dates.length > 0 && (
          // Date tabs - Styled similarly to MovieScreeningsList
          <div className="flex overflow-x-auto py-4 space-x-3 mb-6 scrollbar-hide border-b border-gray-200 -mx-6 px-6"> {/* Changed pb-3 to py-4 */}
            {dates.map(d => (
              <button
                key={d}
                className={`flex-shrink-0 px-6 py-3 rounded-full text-sm font-medium transition-colors duration-200 whitespace-nowrap
                  ${d === date // Using original state name 'date'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                onClick={() => setDate(d)} // Using original state name 'date'
              >
                {formatDateForDisplay(d)}
              </button>
            ))}
          </div>
        )}

        {screenings.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No showings on {formatDateForDisplay(date)}.</p>
        ) : (
          // Screenings list - Scrollable content area
          <div className="flex-grow overflow-y-auto pr-2 -mr-2">
            {Object.entries(byMovie).map(([title, shows]) => (
              <section key={title} className="bg-gray-50 rounded-lg p-4 mb-4 shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{title}</h3>
                <div className="flex flex-wrap gap-2">
                  {shows.map(s => (
                    <ScreeningCard
                      key={`${s.screen_name}-${s.start_dt}`}
                      screening={s}
                    />
                  ))}
                </div>
              </section>
            ))
          }
          </div>
        )}
      </div>
    </div>
  );
}

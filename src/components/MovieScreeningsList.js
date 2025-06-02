import React, { useState, useEffect } from 'react';
import { useGeo } from '../hooks/useGeo'; // Original import
import {
  listMovieDates,
  getNearbyScreenings,
} from '../services/screeningService'; // Original imports
import { listUpcomingMovies } from '../services/movieService'; // New import for fetching movies
import ScreeningCard from './ScreeningCard'; // Original import

export default function MovieScreeningsList() { // Removed movieId prop, now managed internally
  const { lat, lng, error: geoError } = useGeo();
  const [movies, setMovies] = useState([]); // New state for list of movies
  const [selectedMovieId, setSelectedMovieId] = useState(null); // New state for selected movie
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null); // Renamed 'date' to 'selectedDate' for clarity
  const [screeningsData, setScreeningsData] = useState([]); // Renamed 'data' to 'screeningsData' for clarity
  const [isLoadingMovies, setIsLoadingMovies] = useState(true); // New loading state
  const [isLoadingDates, setIsLoadingDates] = useState(false); // New loading state
  const [isLoadingScreenings, setIsLoadingScreenings] = useState(false); // Renamed 'isLoading'

  // Load movies on component mount
  useEffect(() => {
    setIsLoadingMovies(true);
    listUpcomingMovies() // Fetch list of movies
      .then(mvs => {
        setMovies(mvs);
        if (mvs.length > 0) {
          setSelectedMovieId(mvs[0].id); // Auto-select the first movie
        }
        setIsLoadingMovies(false);
      })
      .catch(err => {
        console.error("Error loading movies:", err);
        setIsLoadingMovies(false);
      });
  }, []);

  /* Load dates when selectedMovieId changes */
  useEffect(() => {
    if (!selectedMovieId) {
      setDates([]);
      setSelectedDate(null);
      return;
    }
    setIsLoadingDates(true); // Set loading state for dates
    listMovieDates(selectedMovieId) // Use selectedMovieId
      .then(dts => {
        setDates(dts);
        setSelectedDate(dts[0] ?? null);
        setIsLoadingDates(false); // Clear loading state
      })
      .catch(err => {
        console.error("Error loading dates:", err);
        setIsLoadingDates(false);
      });
  }, [selectedMovieId]); // Dependency now selectedMovieId

  /* Load screenings when selectedMovieId, selectedDate, lat, or lng change */
  useEffect(() => {
    if (selectedMovieId && selectedDate && lat && lng) {
      setIsLoadingScreenings(true); // Set loading state for screenings
      getNearbyScreenings(selectedMovieId, lat, lng, selectedDate) // Use selectedMovieId and selectedDate
        .then(data => {
          setScreeningsData(data); // Use screeningsData
          setIsLoadingScreenings(false); // Clear loading state
        })
        .catch(err => {
          console.error("Error loading screenings:", err);
          setIsLoadingScreenings(false);
        });
    } else if (!selectedDate || !lat || !lng) {
        setScreeningsData([]);
        setIsLoadingScreenings(false);
    }
  }, [selectedMovieId, selectedDate, lat, lng]); // Dependencies updated

  // Helper to format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
  };

  if (geoError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
        <p className="text-red-500 text-lg">Geolocation error: {geoError}. Please enable location services.</p>
      </div>
    );
  }

  // Main rendering structure
  return (
    <div className="min-h-screen bg-gray-100 p-4 font-inter flex flex-col items-center">
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
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">예술영화관 시간표</h1>

        {/* Movie Selection Section */}
        <div className="mb-8 p-4 bg-white rounded-lg shadow-md border border-gray-200">
          {isLoadingMovies ? (
            <p className="text-gray-600">Loading movies...</p>
          ) : movies.length === 0 ? (
            <p className="text-gray-600">No movies available.</p>
          ) : (
            <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide px-4 pt-4"> {/* Added px-4 and pt-4 here */}
              {movies.map(movie => (
                <button
                  key={movie.id}
                  className="flex-shrink-0 transition-all duration-200" // Button acts as clickable wrapper
                  onClick={() => setSelectedMovieId(movie.id)}
                >
                  {/* This outer div will define the dimensions and receive the ring/shadow */}
                  <div
                    className={`w-32 h-auto rounded-lg shadow-md
                      ${selectedMovieId === movie.id
                        ? 'ring-4 ring-blue-500 ring-offset-2' // Ring and offset applied here
                        : 'hover:shadow-lg' // Hover shadow also applied here
                      }`}
                  >
                    {/* This inner div will handle the overflow-hidden for the content */}
                    <div className="w-full h-full rounded-lg overflow-hidden"> {/* w-full h-full to fill parent */}
                      <img
                        src={movie.poster_url || "https://placehold.co/150x225/CCCCCC/333333?text=No+Poster"}
                        alt={movie.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/150x225/CCCCCC/333333?text=No+Poster" }}
                      />
                      <div className="p-2 bg-gray-50 text-center">
                        <p className="text-sm font-medium text-gray-800 truncate">{movie.title}</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conditional rendering for dates and screenings based on movie selection */}
        {selectedMovieId ? (
          <>
            {/* Date tabs */}
            <div className="date-tabs flex overflow-x-auto pb-2 space-x-2 mb-4 md:mb-6 scrollbar-hide">
              {isLoadingDates ? (
                <p className="text-gray-600">Loading dates...</p>
              ) : dates.length === 0 ? (
                <p className="text-gray-600">No upcoming dates for this movie.</p>
              ) : (
                dates.map(d => (
                  <button
                    key={d}
                    className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200
                      ${d === selectedDate
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    onClick={() => setSelectedDate(d)}
                  >
                    {formatDateForDisplay(d)}
                  </button>
                ))
              )}
            </div>

            {/* Loading indicator for screenings */}
            {isLoadingScreenings && selectedDate && lat && lng ? (
              <div className="flex justify-center items-center h-48">
                <p className="text-gray-600 text-lg">Loading showtimes for {formatDateForDisplay(selectedDate)}...</p>
              </div>
            ) : (
              /* Cinema cards */
              <div className="cinema-list space-y-4">
                {screeningsData.length === 0
                  ? <p className="text-gray-600 text-center py-8">No showings on {formatDateForDisplay(selectedDate)}.</p>
                  : screeningsData.map(c => (
                      <div key={c.cinema_code} className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
                        <div className="flex justify-between items-baseline mb-3">
                          <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">{c.cinema_name}</h3>
                          <p className="text-sm text-gray-600">{c.distance_m ? `${(c.distance_m / 1000).toFixed(1)} km` : ''}</p>
                        </div>

                        {/* Showtimes laid out tight & wrapping */}
                        <div
                          className="showtimes flex flex-wrap gap-2"
                        >
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
            )}
          </>
        ) : (
          <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-md border border-gray-200">
            <p className="text-gray-600 text-lg">Please select a movie above to view showtimes.</p>
          </div>
        )}
      </div>
    </div>
  );
}

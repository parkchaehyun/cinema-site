import React, { useState, useEffect } from 'react';
import { useGeo } from '../hooks/useGeo';
import {
  listMovieDates,
  getNearbyScreenings,
} from '../services/screeningService';
import { listUpcomingMovies } from '../services/movieService';
import ScreeningCard from './ScreeningCard';

export default function MovieScreeningsList() {
  const { lat, lng, error: geoError, isLoading: isGeoLoading, requestLocation } = useGeo();
  const [movies, setMovies] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [screeningsData, setScreeningsData] = useState([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(true);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [isLoadingScreenings, setIsLoadingScreenings] = useState(false);

  useEffect(() => {
    setIsLoadingMovies(true);
    listUpcomingMovies()
      .then(mvs => {
        setMovies(mvs);
        if (mvs.length > 0) {
          setSelectedMovieId(mvs[0].id);
        }
        setIsLoadingMovies(false);
      })
      .catch(err => {
        console.error("Error loading movies:", err);
        setIsLoadingMovies(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedMovieId) {
      setDates([]);
      setSelectedDate(null);
      return;
    }
    setIsLoadingDates(true);
    listMovieDates(selectedMovieId)
      .then(dts => {
        setDates(dts);
        setSelectedDate(dts[0] ?? null);
        setIsLoadingDates(false);
      })
      .catch(err => {
        console.error("Error loading dates:", err);
        setIsLoadingDates(false);
      });
  }, [selectedMovieId]);

  useEffect(() => {
    if (selectedMovieId && selectedDate && lat && lng) {
      setIsLoadingScreenings(true);
      getNearbyScreenings(selectedMovieId, lat, lng, selectedDate)
        .then(data => {
          setScreeningsData(data);
          setIsLoadingScreenings(false);
        })
        .catch(err => {
          console.error("Error loading screenings:", err);
          setIsLoadingScreenings(false);
        });
    } else if (!selectedDate || !lat || !lng) {
        setScreeningsData([]);
        setIsLoadingScreenings(false);
    }
  }, [selectedMovieId, selectedDate, lat, lng]);

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
  };

  if (isGeoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-inter">
        <p className="text-gray-600 text-lg">Getting your location...</p>
      </div>
    );
  }

  if (geoError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 font-inter text-center">
        <p className="text-lg text-red-600 mb-2">Could not get your location</p>
        <p className="text-gray-600 mb-4">{geoError}</p>
        <button
          onClick={requestLocation}
          className="px-6 py-2 rounded-full text-lg font-medium transition-colors duration-200 bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Try Again
        </button>
        <p className="text-gray-500 text-sm mt-4 max-w-md">
          To see nearby cinemas, please allow location access in your browser. You may need to update your site settings.
        </p>
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
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
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
            <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide px-4 pt-4">
              {movies.map(movie => (
                <button
                  key={movie.id}
                  className="flex-shrink-0 transition-all duration-200"
                  onClick={() => setSelectedMovieId(movie.id)}
                >
                  <div
                    className={`w-32 h-auto rounded-lg shadow-md
                      ${selectedMovieId === movie.id
                        ? 'ring-4 ring-blue-500 ring-offset-2'
                        : 'hover:shadow-lg'
                      }`}
                  >
                    <div className="w-full h-full rounded-lg overflow-hidden">
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

        {selectedMovieId ? (
          <>
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
            
            {isLoadingScreenings ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="cinema-list space-y-4">
                {screeningsData.length === 0
                  ? <p className="text-gray-600 text-center py-8">No showings on {formatDateForDisplay(selectedDate)}.</p>
                  : screeningsData.map(c => (
                      <div key={c.cinema_code} className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
                        <div className="flex justify-between items-baseline mb-3">
                          <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">{c.cinema_name}</h3>
                          <p className="text-sm text-gray-600">{c.distance_m ? `${(c.distance_m / 1000).toFixed(1)} km` : ''}</p>
                        </div>
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
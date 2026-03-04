import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGeo } from '../hooks/useGeo';
import {
  listMovieDates,
  getNearbyScreenings,
} from '../services/screeningService';
import { listUpcomingMovies } from '../services/movieService';
import ScreeningCard from './ScreeningCard';
import LocationStatusBar from './LocationStatusBar';

export default function MovieScreeningsList() {
  const { lat, lng, source } = useGeo();
  const showDistance = source !== 'default';
  const [movies, setMovies] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [screeningsData, setScreeningsData] = useState([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(true);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [isLoadingScreenings, setIsLoadingScreenings] = useState(false);
  const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);
  const [movieSearch, setMovieSearch] = useState('');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const movieRailRef = useRef(null);
  const movieCardRefs = useRef({});
  const datesRef = useRef(dates);

  const updateScrollButtons = () => {
    const rail = movieRailRef.current;
    if (!rail) return;
    setCanScrollLeft(rail.scrollLeft > 0);
    setCanScrollRight(rail.scrollLeft < rail.scrollWidth - rail.clientWidth - 1);
  };

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
        datesRef.current = dts;
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
    if (selectedMovieId && selectedDate && lat != null && lng != null) {
      setIsLoadingScreenings(true);
      getNearbyScreenings(selectedMovieId, lat, lng, selectedDate)
        .then(data => {
          const todayISO = new Date().toISOString().slice(0, 10);
          if (selectedDate === todayISO) {
            const now = new Date();
            const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            data = data
              .map(cinema => ({ ...cinema, screenings: cinema.screenings.filter(s => s.start_dt > currentHHMM) }))
              .filter(cinema => cinema.screenings.length > 0);
          }
          if (data.length === 0 && selectedDate === new Date().toISOString().slice(0, 10)) {
            const nextDate = datesRef.current.find(d => d > selectedDate);
            if (nextDate) {
              datesRef.current = datesRef.current.filter(d => d !== selectedDate);
              setDates(prev => prev.filter(d => d !== selectedDate));
              setSelectedDate(nextDate);
              return;
            }
          }
          setScreeningsData(data);
          setIsLoadingScreenings(false);
        })
        .catch(err => {
          console.error("Error loading screenings:", err);
          setIsLoadingScreenings(false);
        });
    } else if (!selectedDate || lat == null || lng == null) {
        setScreeningsData([]);
        setIsLoadingScreenings(false);
    }
  }, [selectedMovieId, selectedDate, lat, lng]);

  useEffect(() => {
    const rail = movieRailRef.current;
    if (!rail) return;
    updateScrollButtons();
    rail.addEventListener('scroll', updateScrollButtons);
    return () => rail.removeEventListener('scroll', updateScrollButtons);
  }, [movies]);

  useEffect(() => {
    if (!isMovieModalOpen) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMovieModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMovieModalOpen]);

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const today = new Date().toDateString();
    if (new Date(dateString + 'T00:00:00').toDateString() === today) return '오늘';
    const d = new Date(dateString);
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  const selectedMovie = movies.find(m => m.id === selectedMovieId);

  const filteredMovies = useMemo(() => {
    const query = movieSearch.trim().toLowerCase();
    if (!query) return movies;
    return movies.filter((movie) => movie.title.toLowerCase().includes(query));
  }, [movies, movieSearch]);

  const handleMovieSelect = (movieId) => {
    setSelectedMovieId(movieId);
    setIsMovieModalOpen(false);
    setMovieSearch('');
    setTimeout(() => {
      movieCardRefs.current[movieId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 50);
  };

  const scrollMovieRail = (direction) => {
    const rail = movieRailRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * 320, behavior: 'smooth' });
  };

  const handleMovieRailWheel = (event) => {
    const rail = movieRailRef.current;
    if (!rail) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    rail.scrollLeft += event.deltaY;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-4 sm:px-4 font-inter">
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
      <div className="w-full max-w-4xl mx-auto">
        <LocationStatusBar />

        {/* Movie Selection Section */}
        <div className="mb-4 sm:mb-8 py-4 sm:px-4 bg-white sm:rounded-lg shadow-none sm:shadow-md border-y sm:border border-gray-200">
          {isLoadingMovies ? (
            <p className="text-gray-600">영화 불러오는 중...</p>
          ) : movies.length === 0 ? (
            <p className="text-gray-600">등록된 영화가 없습니다.</p>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-end px-4 sm:px-1">
                <button
                  onClick={() => setIsMovieModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
                >
                  전체 보기
                </button>
              </div>
              <div className="relative">
                <button
                  onClick={() => scrollMovieRail(-1)}
                  className={`${canScrollLeft ? 'hidden sm:flex' : 'hidden'} absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-gray-300 bg-white/90 px-3 py-2 text-gray-700 shadow-sm hover:bg-white`}
                  aria-label="Scroll movies left"
                >
                  ‹
                </button>
                <div
                  ref={movieRailRef}
                  onWheel={handleMovieRailWheel}
                  className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide px-2 sm:px-4 pt-2 scroll-smooth"
                >
                  {movies.map(movie => (
                    <button
                      key={movie.id}
                      ref={el => movieCardRefs.current[movie.id] = el}
                      className="flex-shrink-0 transition-all duration-200"
                      onClick={() => handleMovieSelect(movie.id)}
                    >
                      <div
                        className={`w-32 h-auto rounded-lg shadow-md
                          ${selectedMovieId === movie.id
                            ? 'ring-4 ring-indigo-500 ring-offset-2'
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
                <button
                  onClick={() => scrollMovieRail(1)}
                  className={`${canScrollRight ? 'hidden sm:flex' : 'hidden'} absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-gray-300 bg-white/90 px-3 py-2 text-gray-700 shadow-sm hover:bg-white`}
                  aria-label="Scroll movies right"
                >
                  ›
                </button>
              </div>
            </>
          )}
        </div>

        {isMovieModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
            onClick={() => setIsMovieModalOpen(false)}
          >
            <div
              className="w-full max-w-xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">전체 영화</h2>
                </div>
                <button
                  onClick={() => setIsMovieModalOpen(false)}
                  className="rounded-full px-2 py-1 text-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                  aria-label="Close movie list"
                >
                  ×
                </button>
              </div>
              <div className="p-5">
                <input
                  type="text"
                  value={movieSearch}
                  onChange={(event) => setMovieSearch(event.target.value)}
                  placeholder="영화 제목 검색"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
                />
                <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
                  {filteredMovies.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-600">검색 결과가 없습니다.</p>
                  ) : (
                    filteredMovies.map((movie) => (
                      <button
                        key={movie.id}
                        onClick={() => handleMovieSelect(movie.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all
                          ${selectedMovieId === movie.id
                            ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        <img
                          src={movie.poster_url || "https://placehold.co/60x90/CCCCCC/333333?text=No+Poster"}
                          alt={movie.title}
                          className="h-14 w-10 flex-shrink-0 rounded object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/60x90/CCCCCC/333333?text=No+Poster" }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800">{movie.title}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMovie && (
          <div className="mb-4 px-4 sm:px-1">
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{selectedMovie.title}</h2>
          </div>
        )}

        {selectedMovieId ? (
          <>
            <div className="date-tabs flex overflow-x-auto pb-2 space-x-2 mb-4 md:mb-6 scrollbar-hide px-4 sm:px-0">
              {isLoadingDates ? (
                <p className="text-gray-600">날짜 불러오는 중...</p>
              ) : dates.length === 0 ? (
                <p className="text-gray-600">상영 날짜가 없습니다.</p>
              ) : (
                dates.map(d => (
                  <button
                    key={d}
                    className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200
                      ${d === selectedDate
                        ? 'bg-indigo-600 text-white shadow-lg'
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="cinema-list space-y-4">
                {screeningsData.length === 0
                  ? <p className="text-gray-600 text-center py-8">{formatDateForDisplay(selectedDate) === '오늘' ? '오늘은 상영이 없습니다.' : `${formatDateForDisplay(selectedDate)}에 상영이 없습니다.`}</p>
                  : screeningsData.map(c => (
                      <div key={c.cinema_code} className="bg-white sm:rounded-lg shadow-none sm:shadow-md p-4 sm:p-6 border-y sm:border border-gray-200">
                        <div className="flex justify-between items-baseline mb-3">
                          <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">{c.cinema_name}</h3>
                          <p className="text-sm text-gray-600">
                            {showDistance && c.distance_m ? `${(c.distance_m / 1000).toFixed(1)} km` : ''}
                          </p>
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
            <p className="text-gray-600 text-lg">위에서 영화를 선택하세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}

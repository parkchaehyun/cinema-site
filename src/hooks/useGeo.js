import { useState, useEffect, useCallback } from 'react';

export function useGeo() {
  const [pos, setPos] = useState({ lat: null, lng: null, error: null });
  const [isLoading, setIsLoading] = useState(true);

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setPos({ lat: null, lng: null, error: 'Geolocation is not supported by your browser.' });
      setIsLoading(false);
      return;
    }

    setIsLoading(true); // Start loading

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPos({ lat: coords.latitude, lng: coords.longitude, error: null });
        setIsLoading(false); // Stop loading on success
      },
      (err) => {
        let errorMessage = 'An unknown error occurred.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Geolocation permission denied. Please enable it in your browser settings and try again.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case err.TIMEOUT:
            errorMessage = 'The request to get user location timed out.';
            break;
        }
        setPos({ lat: null, lng: null, error: errorMessage });
        setIsLoading(false); // Stop loading on error
      }
    );
  }, []);

  // Request location on initial component mount
  useEffect(() => {
    getPosition();
  }, [getPosition]);

  // Expose the loading state along with everything else
  return { ...pos, isLoading, requestLocation: getPosition };
}
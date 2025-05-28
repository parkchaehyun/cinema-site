import { useState, useEffect } from 'react'

export function useGeo() {
  const [pos, setPos] = useState({ lat: null, lng: null, error: null })

  useEffect(() => {
    if (!navigator.geolocation) {
      setPos(p => ({ ...p, error: 'Geolocation not supported' }))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setPos({ lat: coords.latitude, lng: coords.longitude, error: null }),
      err => setPos(p => ({ ...p, error: err.message }))
    )
  }, [])

  return pos
}

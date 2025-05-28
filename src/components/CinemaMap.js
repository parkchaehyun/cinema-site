import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, CircleMarker, Popup } from 'react-leaflet'
import { useGeo } from '../hooks/useGeo'
import { listCinemas } from '../services/screeningService'
import CinemaOverlay from './CinemaOverlay'

export default function CinemaMap() {
  const { lat, lng, error: geoError } = useGeo()
  const [cinemas, setCinemas] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    listCinemas().then(setCinemas).catch(console.error)
  }, [])

  if (geoError) return <p>Geolocation error: {geoError}</p>
  if (lat == null || lng == null) return <p>Loading map…</p>

  return (
    <>
      <MapContainer
        center={[lat, lng]}
        zoom={12}
        style={{ height: '80vh' }}
        key={`${lat}-${lng}`}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        <CircleMarker
          center={[lat, lng]}
          radius={8}
          pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 1 }}
        />

        {cinemas.map(c => (
          <Marker
            key={c.cinema_code}
            position={[c.latitude, c.longitude]}
            eventHandlers={{ click: () => setSelected(c) }}
          />
        ))}
      </MapContainer>

      {selected && (
        <CinemaOverlay
          cinema={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}


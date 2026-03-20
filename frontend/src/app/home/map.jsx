import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import L from 'leaflet'

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function Map() {
  // Default location (Phnom Penh, Cambodia)
  const defaultCenter = [11.548038, 104.942829];

  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [location, setLocation] = useState(null)
  const [error, setError] = useState('')

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        setLocation(coords)
        setMapCenter([coords.latitude, coords.longitude])
        setError('')
        console.log(coords.latitude, coords.longitude)
      },
      (err) => {
        setError(err.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  return (
    <div className="container mx-auto p-10" style={{ height: '500px' }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Default marker showing current location */}
        <Marker position={mapCenter}>
          <Popup>
            <strong>Current Location</strong><br />
            Lat: {mapCenter[0]}, Lng: {mapCenter[1]}
          </Popup>
        </Marker>
      </MapContainer>
      <div style={{ padding: '20px' }}>
        <h2>Get Current Latitude and Longitude</h2>

        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={getCurrentLocation}>Get Location</button>

        {location && (
            <div style={{ marginTop: '20px' }}>
            <p><strong>Latitude:</strong> {location.latitude}</p>
            <p><strong>Longitude:</strong> {location.longitude}</p>
            </div>
        )}

        {error && (
            <p style={{ color: 'red', marginTop: '20px' }}>
            {error}
            </p>
        )}
      </div>
    </div>
  )
}

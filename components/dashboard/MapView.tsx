import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { WasteRequest } from './mockRequests'
interface MapViewProps {
  requests: WasteRequest[]
  onSelectRequest: (id: string) => void
  selectedRequestId: string | null
}
// Helper component to re-center map when needed or handle bounds
function MapController({ requests }: { requests: WasteRequest[] }) {
  const map = useMap()
  useEffect(() => {
    if (requests.length > 0) {
      const bounds = L.latLngBounds(requests.map((r) => [r.lat, r.lng]))
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14,
      })
    }
  }, [requests, map])
  return null
}
export function MapView({
  requests,
  onSelectRequest,
  selectedRequestId,
}: MapViewProps) {
  void selectedRequestId
  // Nairobi coordinates
  const center: [number, number] = [-1.2921, 36.8219]
  const createCustomIcon = (type: 'donation' | 'disposal') => {
    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: `<div class="custom-pin ${type}"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })
  }
  return (
    <div className="relative flex-1 h-full bg-gray-100 z-0">
      <MapContainer
        center={center}
        zoom={12}
        style={{
          height: '100%',
          width: '100%',
        }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapController requests={requests} />

        {requests.map((req) => (
          <Marker
            key={req.id}
            position={[req.lat, req.lng]}
            icon={createCustomIcon(req.type)}
            eventHandlers={{
              click: () => onSelectRequest(req.id),
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -10]}
              opacity={1}
              className="custom-tooltip"
            >
              <div className="font-sans">
                <p className="font-bold text-gray-900 text-sm">{req.estate}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {req.items.length} items •{' '}
                  {req.type === 'donation' ? 'Donation' : 'Disposal'}
                </p>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* Watermark */}
      <div className="absolute bottom-6 left-6 z-50 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200 pointer-events-none">
        <span className="text-sm font-semibold text-gray-700">
          Nairobi, Kenya
        </span>
      </div>
    </div>
  )
}

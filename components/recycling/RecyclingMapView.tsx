import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  ChevronRight,
  Package,
  Scale,
  CalendarCheck,
  Filter,
} from 'lucide-react'
import { DisposalRequest } from './mockRecyclingData'
interface RecyclingMapViewProps {
  requests: DisposalRequest[]
  onSelectRequest: (id: string) => void
  filterMode: 'disposal' | 'all'
  setFilterMode: (mode: 'disposal' | 'all') => void
}
function MapController({ requests }: { requests: DisposalRequest[] }) {
  const map = useMap()
  useEffect(() => {
    if (requests.length > 0) {
      const bounds = L.latLngBounds(requests.map((r) => [r.lat, r.lng]))
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 13,
      })
    }
  }, [requests, map])
  return null
}
export function RecyclingMapView({
  requests,
  onSelectRequest,
  filterMode,
  setFilterMode,
}: RecyclingMapViewProps) {
  const center: [number, number] = [-1.2921, 36.8219]
  const createIcon = (status: 'urgent' | 'scheduled') => {
    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: `<div class="custom-pin ${status === 'urgent' ? 'donation' : 'disposal'}"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })
  }
  const openRequests = requests.length
  const totalWeight = requests
    .reduce((sum, r) => sum + r.totalWeightKg, 0)
    .toFixed(1)
  const confirmedNext7 = requests.filter((r) => r.status === 'scheduled').length
  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
      {/* Left Stats Sidebar */}
      <aside className="w-full lg:w-72 bg-white border-r border-gray-200 p-5 overflow-y-auto shrink-0 z-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Overview</h2>
        <div className="space-y-3 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">
                Open Requests
              </span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">
              {openRequests}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Scale className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">
                Pending Volume
              </span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">
              {totalWeight}
              <span className="text-base text-gray-500 ml-1">kg</span>
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <CalendarCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">
                Next 7 Days
              </span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">
              {confirmedNext7}
              <span className="text-base text-gray-500 ml-1">pickups</span>
            </p>
          </div>
        </div>

        <h3 className="text-sm font-bold text-gray-900 mb-3">Legend</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-3 h-3 rounded-full bg-red-500" /> Urgent disposal
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-3 h-3 rounded-full bg-wastewise-orange" />{' '}
            Scheduled pickup
          </div>
        </div>
      </aside>

      {/* Map */}
      <div className="relative flex-1 h-64 lg:h-full bg-gray-100 z-0">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] flex bg-white p-1 rounded-full shadow-md border border-gray-200">
          <button
            onClick={() => setFilterMode('disposal')}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors flex items-center gap-1.5 ${filterMode === 'disposal' ? 'bg-wastewise-green text-white' : 'text-gray-500'}`}
          >
            <Filter className="w-3.5 h-3.5" /> Disposal Requests
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${filterMode === 'all' ? 'bg-wastewise-green text-white' : 'text-gray-500'}`}
          >
            All Types
          </button>
        </div>

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
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapController requests={requests} />
          {requests.map((req) => (
            <Marker
              key={req.id}
              position={[req.lat, req.lng]}
              icon={createIcon(req.status)}
              eventHandlers={{
                click: () => onSelectRequest(req.id),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="font-sans">
                  <p className="font-bold text-gray-900 text-sm">
                    {req.estate}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {req.totalWeightKg}kg •{' '}
                    {req.status === 'urgent' ? 'Urgent' : 'Scheduled'}
                  </p>
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>

        <div className="absolute bottom-6 left-6 z-[400] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200 pointer-events-none">
          <span className="text-sm font-semibold text-gray-700">
            Nairobi, Kenya
          </span>
        </div>
      </div>

      {/* Right Requests Panel */}
      <aside className="w-full lg:w-[360px] bg-white border-l border-gray-200 flex flex-col shrink-0 z-10">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Active Requests</h2>
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">
            {requests.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {requests.map((req) => (
            <button
              key={req.id}
              onClick={() => onSelectRequest(req.id)}
              className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center gap-4"
            >
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${req.status === 'urgent' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-wastewise-orange shadow-[0_0_8px_rgba(255,111,0,0.5)]'}`}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 truncate">
                  {req.estate}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span className="font-bold">{req.totalWeightKg}kg</span>
                  <span>•</span>
                  <span>{req.households} households</span>
                  <span>•</span>
                  <span>{req.distanceKm}km</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{req.pickupDate}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${req.status === 'urgent' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-wastewise-orange'}`}
                >
                  {req.status}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}

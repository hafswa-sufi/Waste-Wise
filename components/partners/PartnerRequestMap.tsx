import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Calendar, MapPin, Package } from 'lucide-react'
import {
  displayPartnerDate,
  type PartnerAction,
} from './partnerActions'

interface PartnerRequestMapProps {
  actions: PartnerAction[]
  emptyLabel: string
  pinTone: 'donation' | 'disposal'
}

function hasCoordinates(action: PartnerAction) {
  return (
    typeof action.pickupLocation?.lat === 'number' &&
    typeof action.pickupLocation?.lng === 'number'
  )
}

function MapController({ actions }: { actions: PartnerAction[] }) {
  const map = useMap()

  useEffect(() => {
    const locatedActions = actions.filter(hasCoordinates)
    if (locatedActions.length === 0) return

    const bounds = L.latLngBounds(
      locatedActions.map((action) => [
        action.pickupLocation!.lat!,
        action.pickupLocation!.lng!,
      ]),
    )
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 17 })
  }, [actions, map])

  return null
}

export function PartnerRequestMap({
  actions,
  emptyLabel,
  pinTone,
}: PartnerRequestMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const locatedActions = useMemo(
    () => actions.filter(hasCoordinates),
    [actions],
  )
  const center: [number, number] = [-1.2921, 36.8219]
  const pinIcon = useMemo(
    () =>
      L.divIcon({
        className: 'custom-leaflet-icon',
        html: `<div class="custom-pin ${pinTone}"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    [pinTone],
  )

  if (locatedActions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
        <MapPin className="mx-auto h-10 w-10 text-gray-300" />
        <h2 className="mt-3 text-lg font-extrabold text-gray-900">
          No mapped requests yet
        </h2>
        <p className="mt-1 text-sm text-gray-500">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="h-[520px] overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController actions={locatedActions} />
          {locatedActions.map((action) => (
            <Marker
              key={`${action.householdId}-${action.id}`}
              position={[
                action.pickupLocation!.lat!,
                action.pickupLocation!.lng!,
              ]}
              icon={pinIcon}
              eventHandlers={{
                click: () => setSelectedId(action.id),
              }}
            >
              <Popup>
                <div className="min-w-52 font-sans">
                  <p className="text-sm font-extrabold text-gray-900">
                    {action.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-gray-600">
                    {action.quantity}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    {action.pickupLocation?.buildingNameNumber ||
                      action.pickupLocation?.label ||
                      'Pickup pin'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {displayPartnerDate(action.pickupDate)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <aside className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-extrabold uppercase text-gray-500">
          Mapped Requests
        </h2>
        <div className="mt-4 space-y-3">
          {locatedActions.map((action) => {
            const selected = selectedId === action.id
            return (
              <button
                key={`${action.householdId}-${action.id}-summary`}
                type="button"
                onClick={() => setSelectedId(action.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selected
                    ? 'border-wastewise-green bg-green-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className="font-bold text-gray-900">{action.name}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    {action.quantity}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {displayPartnerDate(action.pickupDate)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {action.pickupLocation?.buildingNameNumber ||
                    action.pickupLocation?.label ||
                    'Exact pickup pin saved'}
                </p>
              </button>
            )
          })}
        </div>
      </aside>
    </div>
  )
}

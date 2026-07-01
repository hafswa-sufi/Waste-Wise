import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import {
  ArrowLeft,
  Building2,
  LocateFixed,
  MapPin,
  RefreshCw,
  Save,
} from 'lucide-react'
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../../src/firebase/firebase'
import { useAuth } from '../../src/context/useAuth'
import { authErrorMessage } from '../auth/authErrors'
import {
  buildPartnerLocationQueries,
  searchKenyaLocation,
} from '../locationLookup'

function PartnerPinPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null
  lng: number | null
  onChange: (next: { lat: number; lng: number }) => void
}) {
  const position = lat !== null && lng !== null ? [lat, lng] as [number, number] : null
  const center: [number, number] = position ?? [-1.2921, 36.8219]
  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'custom-leaflet-icon',
        html: '<div class="custom-pin partner"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    [],
  )

  return (
    <MapContainer
      center={center}
      zoom={position ? 15 : 12}
      className="h-72 w-full rounded-lg"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <PartnerMapRecenter position={position} />
      <PartnerMapClickCatcher onChange={onChange} />
      {position && <Marker position={position} icon={icon} />}
    </MapContainer>
  )
}

function PartnerMapRecenter({ position }: { position: [number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    if (position) map.setView(position, 15)
  }, [map, position])

  return null
}

function PartnerMapClickCatcher({
  onChange,
}: {
  onChange: (next: { lat: number; lng: number }) => void
}) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })
  return null
}

export function PartnerProfile() {
  const navigate = useNavigate()
  const { currentUser, userData } = useAuth()
  const [organizationName, setOrganizationName] = useState(
    userData?.organizationName ?? userData?.name ?? '',
  )
  const [registrationNumber, setRegistrationNumber] = useState(
    userData?.registrationNumber ?? '',
  )
  const [operatingCounties, setOperatingCounties] = useState(
    userData?.operatingCounties ?? userData?.location ?? '',
  )
  const [pinLat, setPinLat] = useState<number | null>(
    typeof userData?.lat === 'number' ? userData.lat : null,
  )
  const [pinLng, setPinLng] = useState<number | null>(
    typeof userData?.lng === 'number' ? userData.lng : null,
  )
  const [contactName, setContactName] = useState(userData?.contactName ?? '')
  const [designation, setDesignation] = useState(userData?.designation ?? '')
  const [serviceBaseAddress, setServiceBaseAddress] = useState(
    userData?.serviceBaseAddress ?? '',
  )
  const [maxPickupRadiusKm, setMaxPickupRadiusKm] = useState(
    typeof userData?.maxPickupRadiusKm === 'number'
      ? String(userData.maxPickupRadiusKm)
      : '25',
  )
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const dashboardPath = userData?.role === 'RecyclingFirm' ? '/recycling' : '/dashboard'
  const partnerLabel =
    userData?.role === 'RecyclingFirm' ? 'Recycling Company' : 'NGO'

  useEffect(() => {
    setPinLat(typeof userData?.lat === 'number' ? userData.lat : null)
    setPinLng(typeof userData?.lng === 'number' ? userData.lng : null)
  }, [userData?.lat, userData?.lng])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    setError(null)

    if (!currentUser) {
      setError('Please log in again before updating your details.')
      return
    }

    setSaving(true)
    try {
      const radius = Number(maxPickupRadiusKm)

      if (!serviceBaseAddress.trim()) {
        throw new Error('Enter the service base or pickup area.')
      }
      if (!Number.isFinite(radius) || radius <= 0) {
        throw new Error('Enter a valid pickup radius in kilometres.')
      }

      let resolvedPin =
        pinLat !== null && pinLng !== null ? { lat: pinLat, lng: pinLng } : null
      if (!resolvedPin) {
        const result = await searchKenyaLocation(
          buildPartnerLocationQueries(
            serviceBaseAddress,
            operatingCounties,
            organizationName,
          ),
        )
        resolvedPin = result ? { lat: result.lat, lng: result.lng } : null
      }

      if (!resolvedPin) {
        throw new Error(
          'Set the organisation pickup base pin before saving.',
        )
      }

      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: contactName.trim() || organizationName.trim(),
        location: operatingCounties.trim(),
        organizationName: organizationName.trim(),
        registrationNumber: registrationNumber.trim(),
        operatingCounties: operatingCounties.trim(),
        serviceBaseAddress: serviceBaseAddress.trim(),
        contactName: contactName.trim(),
        designation: designation.trim(),
        lat: resolvedPin.lat,
        lng: resolvedPin.lng,
        maxPickupRadiusKm: radius,
        updatedAt: serverTimestamp(),
      })
      setMessage('Partner details updated.')
    } catch (saveError) {
      console.error('Partner profile update error:', saveError)
      setError(
        authErrorMessage(
          saveError,
          'We could not save your organisation details. Check your connection and try again.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  const geocodeOperatingArea = async () => {
    const queries = buildPartnerLocationQueries(
      serviceBaseAddress,
      operatingCounties,
      organizationName,
    )

    if (queries.length === 0) {
      setError('Enter your service base or operating area before locating it.')
      return
    }

    setLocating(true)
    setError(null)
    setMessage(null)

    try {
      const result = await searchKenyaLocation(queries)
      if (!result) {
        throw new Error('Could not find that area.')
      }
      setPinLat(result.lat)
      setPinLng(result.lng)
      setMessage('Service base pinned. Save changes to use it for routing.')
    } catch (lookupError) {
      console.error('Partner geocode error:', lookupError)
      setError('Could not locate that area. Click the map to set your pin.')
    } finally {
      setLocating(false)
    }
  }

  const useCurrentLocation = () => {
    setMessage(null)
    setError(null)

    if (!navigator.geolocation) {
      setError('Your browser does not support current-location lookup.')
      return
    }

    setUsingCurrentLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPinLat(position.coords.latitude)
        setPinLng(position.coords.longitude)
        setMessage('Current location pinned. Save changes to use it for routing.')
        setUsingCurrentLocation(false)
      },
      () => {
        setError('Could not access your location. Allow location permission or click the map.')
        setUsingCurrentLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-wastewise-green selection:text-white">
      <header className="border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link
            to={dashboardPath}
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-wastewise-green"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sm font-bold text-gray-500 hover:text-gray-900"
          >
            WasteWise
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-1 text-xs font-bold text-wastewise-green">
            <Building2 className="h-4 w-4" />
            {partnerLabel} Settings
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
            Partner Profile
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Update the organisation and contact details used for pickups and admin review.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-gray-700">
                Organisation name
              </span>
              <input
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                required
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 focus:border-wastewise-green focus:outline-none focus:ring-2 focus:ring-wastewise-green/20"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-gray-700">
                Registration number
              </span>
              <input
                value={registrationNumber}
                onChange={(event) => setRegistrationNumber(event.target.value)}
                required
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 focus:border-wastewise-green focus:outline-none focus:ring-2 focus:ring-wastewise-green/20"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-bold text-gray-700">
                Operating counties / pickup coverage
              </span>
              <input
                value={operatingCounties}
                onChange={(event) => setOperatingCounties(event.target.value)}
                required
                placeholder="Nairobi, Kiambu"
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 focus:border-wastewise-green focus:outline-none focus:ring-2 focus:ring-wastewise-green/20"
              />
            </label>

            <div className="md:col-span-2">
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-sm font-bold text-gray-700">
                    Organisation pickup base pin
                  </span>
                  <p className="mt-1 text-xs font-semibold text-gray-500">
                    Used to sort nearby household requests and compare routing distance.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={geocodeOperatingArea}
                    disabled={locating || usingCurrentLocation}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {locating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <LocateFixed className="h-4 w-4" />
                    )}
                    {locating ? 'Finding...' : 'Find on map'}
                  </button>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={locating || usingCurrentLocation}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm font-bold text-wastewise-green hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LocateFixed className="h-4 w-4" />
                    {usingCurrentLocation ? 'Locating...' : 'Use my location'}
                  </button>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                <PartnerPinPicker
                  lat={pinLat}
                  lng={pinLng}
                  onChange={(next) => {
                    setPinLat(next.lat)
                    setPinLng(next.lng)
                  }}
                />
              </div>
              <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                {pinLat !== null && pinLng !== null
                  ? `${pinLat.toFixed(5)}, ${pinLng.toFixed(5)}`
                  : 'No partner pin saved yet.'}
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-bold text-gray-700">
                Contact person
              </span>
              <input
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                required
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 focus:border-wastewise-green focus:outline-none focus:ring-2 focus:ring-wastewise-green/20"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-gray-700">
                Designation
              </span>
              <input
                value={designation}
                onChange={(event) => setDesignation(event.target.value)}
                required
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 focus:border-wastewise-green focus:outline-none focus:ring-2 focus:ring-wastewise-green/20"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-gray-700">
                Service base / pickup area
              </span>
              <input
                value={serviceBaseAddress}
                onChange={(event) => setServiceBaseAddress(event.target.value)}
                required
                placeholder="e.g. Westlands, Nairobi"
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 focus:border-wastewise-green focus:outline-none focus:ring-2 focus:ring-wastewise-green/20"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-gray-700">
                Pickup radius (km)
              </span>
              <input
                value={maxPickupRadiusKm}
                onChange={(event) => setMaxPickupRadiusKm(event.target.value)}
                required
                placeholder="25"
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 focus:border-wastewise-green focus:outline-none focus:ring-2 focus:ring-wastewise-green/20"
              />
            </label>
          </div>

          {message && (
            <p className="mt-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              {message}
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-wastewise-green px-5 py-3 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

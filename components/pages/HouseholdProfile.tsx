import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { updatePassword, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import {
  ArrowLeft,
  KeyRound,
  Leaf,
  LogOut,
  MailCheck,
  MapPin,
  Save,
  User,
} from 'lucide-react'
import { auth, db } from '../../src/firebase/firebase'
import { useAuth } from '../../src/context/useAuth'
import { logout, resendVerificationEmail } from '../../src/service/authService'
import { authErrorMessage } from '../auth/authErrors'

function ProfilePinPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null
  lng: number | null
  onChange: (next: { lat: number; lng: number }) => void
}) {
  const position: [number, number] | null =
    lat !== null && lng !== null ? [lat, lng] : null
  const center: [number, number] = useMemo(
    () => position ?? [-1.2921, 36.8219],
    [position],
  )
  const pinIcon = useMemo(
    () =>
      L.divIcon({
        className: 'custom-leaflet-icon',
        html: '<div class="custom-pin donation"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    [],
  )

  return (
    <MapContainer
      center={center}
      zoom={16}
      style={{ height: 220, width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ProfileMapRecenter position={position} />
      <ProfileClickCatcher onChange={onChange} />
      {position && <Marker position={position} icon={pinIcon} />}
    </MapContainer>
  )
}

function ProfileMapRecenter({
  position,
}: {
  position: [number, number] | null
}) {
  const map = useMap()
  useEffect(() => {
    if (position) map.setView(position, 17)
  }, [map, position])
  return null
}

function ProfileClickCatcher({
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

export function HouseholdProfile() {
  const navigate = useNavigate()
  const { currentUser, userData } = useAuth()
  const locationFromProfile =
    typeof (userData as { location?: unknown } | null)?.location === 'string'
      ? ((userData as { location?: string }).location ?? '')
      : ''
  const [name, setName] = useState(userData?.name ?? '')
  const [location, setLocation] = useState(locationFromProfile)
  const [buildingNameNumber, setBuildingNameNumber] = useState(
    userData?.buildingNameNumber ?? '',
  )
  const [pinLat, setPinLat] = useState<number | null>(
    typeof userData?.lat === 'number' ? userData.lat : null,
  )
  const [pinLng, setPinLng] = useState<number | null>(
    typeof userData?.lng === 'number' ? userData.lng : null,
  )
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [mapSearchLoading, setMapSearchLoading] = useState(false)
  const [verificationSending, setVerificationSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [logoutOpen, setLogoutOpen] = useState(false)

  useEffect(() => {
    setName(userData?.name ?? currentUser?.displayName ?? '')
    setLocation(locationFromProfile)
    setBuildingNameNumber(userData?.buildingNameNumber ?? '')
    setPinLat(typeof userData?.lat === 'number' ? userData.lat : null)
    setPinLng(typeof userData?.lng === 'number' ? userData.lng : null)
  }, [
    currentUser?.displayName,
    locationFromProfile,
    userData?.buildingNameNumber,
    userData?.lat,
    userData?.lng,
    userData?.name,
  ])

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const user = auth.currentUser ?? currentUser
      if (!user) throw new Error('Please log in again to update your account.')

      if (name.trim()) await updateProfile(user, { displayName: name.trim() })

      await setDoc(
        doc(db, 'users', user.uid),
        {
          name: name.trim() || userData?.name || 'WasteWise User',
          location: location.trim(),
          buildingNameNumber: buildingNameNumber.trim(),
          lat: pinLat,
          lng: pinLng,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      if (newPassword.trim()) {
        await updatePassword(user, newPassword.trim())
        setNewPassword('')
      }

      setMessage('Profile updated.')
    } catch (err) {
      setError(
        authErrorMessage(
          err,
          'Could not save profile. Log in again if you are changing password.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  const handleFindLocation = async () => {
    const query = [buildingNameNumber, location, 'Kenya']
      .map((part) => part.trim())
      .filter(Boolean)
      .join(', ')

    if (!query) {
      setError('Enter your household location or building name first.')
      return
    }

    setMessage(null)
    setError(null)
    setMapSearchLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ke&q=${encodeURIComponent(
          query,
        )}`,
      )
      const results = (await response.json()) as Array<{
        lat?: string
        lon?: string
      }>
      const result = results[0]
      const lat = Number(result?.lat)
      const lng = Number(result?.lon)

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setError('Could not find that place. Try estate, road, town, and county.')
        return
      }

      setPinLat(lat)
      setPinLng(lng)
      setMessage('Location found. Save settings to use this pin for pickups.')
    } catch {
      setError('Could not search the map right now. You can still click the map manually.')
    } finally {
      setMapSearchLoading(false)
    }
  }

  const handleLogout = async () => {
    window.sessionStorage.setItem('wastewise.justLoggedOut', 'true')
    await logout()
    navigate('/auth', { replace: true, state: { authState: 'login' } })
  }

  const handleResendVerification = async () => {
    setMessage(null)
    setError(null)
    setVerificationSending(true)
    try {
      await resendVerificationEmail()
      setMessage('Verification email sent. Check your inbox.')
    } catch (err) {
      setError(
        authErrorMessage(err, 'Could not send verification email. Try again.'),
      )
    } finally {
      setVerificationSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <Link
          to="/household"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-wastewise-green"
        >
          <ArrowLeft className="w-4 h-4" />
          Household
        </Link>
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-wastewise-green" />
          <span className="font-extrabold text-gray-900">Profile</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Account Settings
          </h1>
          <p className="mt-1 text-gray-500">
            Manage your household account, location, and password.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="bg-white border border-gray-200 rounded-xl p-5 h-fit">
            <div className="w-16 h-16 rounded-full bg-wastewise-green text-white flex items-center justify-center text-xl font-extrabold">
              {(name || userData?.name || 'WK').slice(0, 2).toUpperCase()}
            </div>
            <h2 className="mt-4 font-extrabold text-gray-900">
              {name || userData?.name || 'WasteWise User'}
            </h2>
            <p className="text-sm text-gray-500 break-all">
              {userData?.email || currentUser?.email || 'Demo account'}
            </p>
            <p className="mt-3 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-wastewise-green">
              {userData?.role || 'Household'}
            </p>
            <div
              className={`mt-4 rounded-lg border px-3 py-3 text-sm font-semibold ${currentUser?.emailVerified ? 'border-green-100 bg-green-50 text-green-700' : 'border-yellow-100 bg-yellow-50 text-yellow-800'}`}
            >
              <div className="flex items-center gap-2">
                <MailCheck className="w-4 h-4" />
                {currentUser?.emailVerified
                  ? 'Email verified'
                  : 'Email not verified'}
              </div>
              {!currentUser?.emailVerified && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={verificationSending}
                  className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-bold text-yellow-800 border border-yellow-200 hover:bg-yellow-50 disabled:opacity-60"
                >
                  {verificationSending ? 'Sending...' : 'Resend verification'}
                </button>
              )}
            </div>
          </aside>

          <form
            onSubmit={handleSave}
            className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-5"
          >
            <label className="block">
              <span className="text-sm font-bold text-gray-700">
                Display name
              </span>
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-wastewise-green focus-within:ring-2 focus-within:ring-wastewise-green/20">
                <User className="w-4 h-4 text-gray-400" />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full text-sm outline-none"
                  placeholder="Your name"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-gray-700">
                Household location
              </span>
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-wastewise-green focus-within:ring-2 focus-within:ring-wastewise-green/20">
                <MapPin className="w-4 h-4 text-gray-400" />
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="w-full text-sm outline-none"
                  placeholder="Estate, town, or pickup area"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-gray-700">
                Building name / number
              </span>
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-wastewise-green focus-within:ring-2 focus-within:ring-wastewise-green/20">
                <MapPin className="w-4 h-4 text-gray-400" />
                <input
                  value={buildingNameNumber}
                  onChange={(event) =>
                    setBuildingNameNumber(event.target.value)
                  }
                  className="w-full text-sm outline-none"
                  placeholder="Estate, building, block, or house number"
                />
              </div>
            </label>

            <div className="block">
              <span className="text-sm font-bold text-gray-700">
                Exact pickup pin
              </span>
              <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                <div className="border-b border-gray-200 bg-white p-3">
                  <button
                    type="button"
                    onClick={handleFindLocation}
                    disabled={mapSearchLoading}
                    className="w-full rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm font-bold text-wastewise-green hover:bg-green-100 disabled:opacity-60"
                  >
                    {mapSearchLoading ? 'Finding location...' : 'Find on map'}
                  </button>
                </div>
                <ProfilePinPicker
                  lat={pinLat}
                  lng={pinLng}
                  onChange={(next) => {
                    setPinLat(next.lat)
                    setPinLng(next.lng)
                  }}
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-gray-500">
                Click the map to update the pin partners use for pickups.
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-bold text-gray-700">
                Change password
              </span>
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-wastewise-green focus-within:ring-2 focus-within:ring-wastewise-green/20">
                <KeyRound className="w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full text-sm outline-none"
                  placeholder="New password"
                  minLength={6}
                />
              </div>
            </label>

            {message && (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                {message}
              </p>
            )}
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLogoutOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-wastewise-green px-4 py-2 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save settings'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {logoutOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-extrabold text-gray-900">Log out?</h2>
            <p className="mt-1 text-sm text-gray-500">
              You will return to the login page.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLogoutOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, Eye, EyeOff, MapPin } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithGoogle, signUp } from '../../src/service/authService'
import { authErrorMessage } from './authErrors'
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'


interface HouseholdSignupProps {
  onLoginClick: () => void
}

function PinPicker({
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
    () => (position ? position : [-1.2921, 36.8219]),
    [position],
  )

  const pinIcon = useMemo(
    () =>
      L.divIcon({
        className: 'custom-leaflet-icon',
        html: `<div class="custom-pin donation"></div>`,
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
      <MapRecenter position={position} />
      <ClickCatcher onChange={onChange} />
      {position && <Marker position={position} icon={pinIcon} />}
    </MapContainer>
  )
}

function MapRecenter({ position }: { position: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.setView(position, 17)
  }, [map, position])
  return null
}

function ClickCatcher({
  onChange,
}: {
  onChange: (next: { lat: number; lng: number }) => void
}) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}



export function HouseholdSignup({ onLoginClick }: HouseholdSignupProps) {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [location, setLocation] = useState('')

  const [buildingNameNumber, setBuildingNameNumber] = useState('')
  const [pinLat, setPinLat] = useState<number | null>(null)
  const [pinLng, setPinLng] = useState<number | null>(null)
  const [mapSearchLoading, setMapSearchLoading] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const validate = () => {
    if (!fullName.trim()) return 'Full name is required.'
    if (!email.trim()) return 'Email address is required.'
    if (!location.trim()) return 'County or location is required.'
    if (!buildingNameNumber.trim()) return 'Building name/number is required.'
    if (pinLat === null || pinLng === null) return 'Please click the map to set your pin location.'
    if (!password) return 'Password is required.'
    if (password.length < 6) return 'Password should be at least 6 characters.'
    if (!confirmPassword) return 'Please confirm your password.'
    if (password !== confirmPassword) return 'Passwords do not match.'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    try {
      await signUp(fullName, email, password, 'Household', {
        location: location.trim(),
        buildingNameNumber: buildingNameNumber.trim(),
        lat: pinLat!,
        lng: pinLng!,
      })
      navigate('/household')
    } catch (err) {
      setError(authErrorMessage(err, 'Failed to create account. Try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    // For Google signup, require pin fields too (keep it simple and consistent)
    setError(null)
    setIsLoading(true)
    try {
      if (!buildingNameNumber.trim()) {
        setError('Building name/number is required.')
        return
      }
      if (pinLat === null || pinLng === null) {
        setError('Please click the map to set your pin location.')
        return
      }

      await signInWithGoogle('Household', {
        location: location.trim(),
        buildingNameNumber: buildingNameNumber.trim(),
        lat: pinLat,
        lng: pinLng,
      })
      navigate('/household')
    } catch (err) {
      setError(authErrorMessage(err, 'Google sign up failed. Try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleFindLocation = async () => {
    const query = [buildingNameNumber, location, 'Kenya']
      .map((part) => part.trim())
      .filter(Boolean)
      .join(', ')

    if (!query) {
      setError('Enter your county/location or building name first.')
      return
    }

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
    } catch {
      setError('Could not search the map right now. You can still click the map manually.')
    } finally {
      setMapSearchLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-12">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-wastewise-green"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Create Household Account
        </h2>
        <p className="text-gray-500 mt-2">Start tracking and saving today.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
              placeholder="jane@example.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Password
              </label>
              <PasswordField
                value={password}
                show={showPassword}
                onChange={setPassword}
                onToggle={() => setShowPassword((value) => !value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Confirm
              </label>
              <PasswordField
                value={confirmPassword}
                show={showConfirmPassword}
                onChange={setConfirmPassword}
                onToggle={() => setShowConfirmPassword((value) => !value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              County / Location
            </label>
            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all appearance-none"
            >
              <option value="">Select your county</option>
              <option value="Nairobi">Nairobi</option>
              <option value="Mombasa">Mombasa</option>
              <option value="Kisumu">Kisumu</option>
              <option value="Nakuru">Nakuru</option>
              <option value="Uasin Gishu">Uasin Gishu</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Building name / number
            </label>
            <input
              type="text"
              value={buildingNameNumber}
              onChange={(e) => setBuildingNameNumber(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
              placeholder="e.g. Kilimani Heights, Block A"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              Set exact pickup pin
            </label>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                <MapPin className="mt-0.5 h-4 w-4 text-wastewise-green" />
                <span>
                  Search using the fields above or click the map to place/move
                  your pin.
                </span>
              </div>
              <button
                type="button"
                onClick={handleFindLocation}
                disabled={mapSearchLoading}
                className="mb-3 w-full rounded-lg border border-green-100 bg-white px-3 py-2 text-sm font-bold text-wastewise-green hover:bg-green-50 disabled:opacity-60"
              >
                {mapSearchLoading ? 'Finding location...' : 'Find on map'}
              </button>
              <PinPicker
                lat={pinLat}
                lng={pinLng}
                onChange={(next) => {
                  setPinLat(next.lat)
                  setPinLng(next.lng)
                }}
              />
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-bold text-gray-600">Lat</span>
                  <div className="font-mono text-gray-900">
                    {pinLat === null ? '—' : pinLat.toFixed(6)}
                  </div>
                </div>
                <div>
                  <span className="font-bold text-gray-600">Lng</span>
                  <div className="font-mono text-gray-900">
                    {pinLng === null ? '—' : pinLng.toFixed(6)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 font-medium" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full py-3.5 bg-white border border-gray-300 text-gray-800 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60"
          >
            Create Account with Google
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-wastewise-green text-white rounded-xl font-bold text-lg hover:bg-green-800 transition-colors shadow-sm mt-2 disabled:opacity-60"
          >
            {isLoading ? 'Please wait...' : 'Create Account'}
          </button>
        </form>
      </div>

      <div className="text-center mt-8">
        <p className="text-gray-600 font-medium">
          Already have an account?{' '}
          <button
            onClick={onLoginClick}
            className="text-wastewise-green font-bold hover:underline"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  )
}

function PasswordField({
  value,
  show,
  onChange,
  onToggle,
}: {
  value: string
  show: boolean
  onChange: (value: string) => void
  onToggle: () => void
}) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 pr-11 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
        placeholder="Password"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  )
}

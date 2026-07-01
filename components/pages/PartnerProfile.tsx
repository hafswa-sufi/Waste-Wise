import { useState, type FormEvent } from 'react'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { ArrowLeft, Building2, Save } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../../src/firebase/firebase'
import { useAuth } from '../../src/context/useAuth'
import { authErrorMessage } from '../auth/authErrors'

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
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const dashboardPath = userData?.role === 'RecyclingFirm' ? '/recycling' : '/dashboard'
  const partnerLabel =
    userData?.role === 'RecyclingFirm' ? 'Recycling Company' : 'NGO'

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
      const locationQuery = [
        serviceBaseAddress.trim(),
        operatingCounties.trim(),
        'Kenya',
      ]
        .filter(Boolean)
        .join(', ')

      if (!serviceBaseAddress.trim()) {
        throw new Error('Enter the service base or pickup area.')
      }
      if (!Number.isFinite(radius) || radius <= 0) {
        throw new Error('Enter a valid pickup radius in kilometres.')
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ke&q=${encodeURIComponent(
          locationQuery,
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
        throw new Error(
          'Could not find that service location. Try estate, road, town, and county.',
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
        lat,
        lng,
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

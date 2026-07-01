import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  collectionGroup,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  writeBatch,
  where,
  type DocumentReference,
  type Timestamp,
} from 'firebase/firestore'
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Leaf,
  LogOut,
  Mail,
  MapPin,
  RefreshCw,
  Recycle,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../src/firebase/firebase'
import {
  approvePartner,
  logout,
  rejectPartner,
  type UserData,
} from '../../src/service/authService'
import { useAuth } from '../../src/context/useAuth'

type PartnerStatus = 'all' | 'pending' | 'approved' | 'rejected'
type ReportFilter = 'all' | 'donation' | 'disposal' | 'consumed' | 'pending' | 'collected'
type AdminView = 'verification' | 'reports' | 'aggregation'

interface PartnerProfile extends UserData {
  updatedAt?: Timestamp
  createdAt: Timestamp
}

interface AdminActionReport {
  id: string
  householdId: string
  ref: DocumentReference
  type: 'donation' | 'disposal' | 'consumed'
  status: string
  name: string
  quantity: string
  partner: string
  partnerUserId?: string | null
  pickupDate: string
  pickupLocation?: {
    label?: string
    buildingNameNumber?: string
    lat?: number
    lng?: number
  }
}

interface AggregationGroup {
  key: string
  type: 'donation' | 'disposal'
  area: string
  householdCount: number
  requestCount: number
  totalQuantity: number
  mappedCount: number
  centerLat?: number
  centerLng?: number
  statuses: string[]
  nextPickupDate: string
  items: string[]
  actions: AdminActionReport[]
}

const statusStyles = {
  pending: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  approved: 'border-green-200 bg-green-50 text-green-700',
  rejected: 'border-red-200 bg-red-50 text-red-700',
}

const reportLabels: Record<ReportFilter, string> = {
  all: 'All Activity',
  donation: 'Donation Requests',
  disposal: 'Disposal Requests',
  consumed: 'Consumed Food',
  pending: 'Pending Requests',
  collected: 'Collected Pickups',
}

function formatDate(value: unknown) {
  if (!value || typeof value !== 'object' || !('toDate' in value)) return 'Not set'
  return (value as Timestamp).toDate().toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function quantityAmount(value: string) {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)/)
  const amount = match ? Number(match[1]) : 0
  return Number.isFinite(amount) ? amount : 0
}

function normalizeArea(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function adminErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('permission-denied')) {
    return 'This admin account is not allowed to make that change. Confirm you are logged in as an approved admin.'
  }
  if (message.includes('unavailable') || message.includes('network')) {
    return 'The connection dropped before the change was saved. Check your internet and try again.'
  }
  if (message.includes('not-found')) {
    return 'This record was not found. It may have been updated or removed already.'
  }

  return fallback
}

function distanceBetweenKm(
  from: { lat?: number; lng?: number },
  to: { lat?: number; lng?: number },
) {
  if (
    typeof from.lat !== 'number' ||
    typeof from.lng !== 'number' ||
    typeof to.lat !== 'number' ||
    typeof to.lng !== 'number'
  ) {
    return null
  }

  const earthRadiusKm = 6371
  const latDelta = ((to.lat - from.lat) * Math.PI) / 180
  const lngDelta = ((to.lng - from.lng) * Math.PI) / 180
  const fromLat = (from.lat * Math.PI) / 180
  const toLat = (to.lat * Math.PI) / 180
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(fromLat) *
      Math.cos(toLat) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Number((earthRadiusKm * c).toFixed(1))
}

function formatDistance(value: number | null) {
  return typeof value === 'number' ? `${value.toFixed(1)} km` : 'distance unknown'
}

export function Admin() {
  const navigate = useNavigate()
  const { userData } = useAuth()
  const [partners, setPartners] = useState<PartnerProfile[]>([])
  const [filter, setFilter] = useState<PartnerStatus>('pending')
  const [loading, setLoading] = useState(true)
  const [workingUserId, setWorkingUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<AdminActionReport[]>([])
  const [reportFilter, setReportFilter] = useState<ReportFilter>('all')
  const [activeView, setActiveView] = useState<AdminView>('verification')
  const [selectedBatchPartners, setSelectedBatchPartners] = useState<
    Record<string, string>
  >({})
  const [assigningBatchKey, setAssigningBatchKey] = useState<string | null>(
    null,
  )
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedPartner, setSelectedPartner] =
    useState<PartnerProfile | null>(null)

  useEffect(() => {
    const partnersQuery = query(
      collection(db, 'users'),
      where('role', 'in', ['NGO', 'RecyclingFirm']),
    )

    return onSnapshot(
      partnersQuery,
      (snapshot) => {
        const profiles = snapshot.docs.map((docSnapshot) => ({
          ...(docSnapshot.data() as PartnerProfile),
          userId: docSnapshot.id,
        }))

        profiles.sort((a, b) => {
          const statusOrder = { pending: 0, approved: 1, rejected: 2 }
          const statusDiff =
            statusOrder[a.approvalStatus] - statusOrder[b.approvalStatus]
          if (statusDiff !== 0) return statusDiff

          const aCreated = a.createdAt?.toDate?.().getTime() ?? 0
          const bCreated = b.createdAt?.toDate?.().getTime() ?? 0
          return bCreated - aCreated
        })

        setPartners(profiles)
        setLoading(false)
      },
      (snapshotError) => {
        console.error('Admin partner load error:', snapshotError)
        setError(
          adminErrorMessage(
            snapshotError,
            'We could not load partner applications right now. Refresh the page or log in again as admin.',
          ),
        )
        setLoading(false)
      },
    )
  }, [])

  useEffect(() => {
    return onSnapshot(collectionGroup(db, 'householdActions'), (snapshot) => {
      setReports(
        snapshot.docs.map((snapshotDoc) => {
          const data = snapshotDoc.data()
          const householdId = snapshotDoc.ref.parent.parent?.id ?? ''
          const rawPickupLocation =
            data.pickupLocation && typeof data.pickupLocation === 'object'
              ? (data.pickupLocation as Record<string, unknown>)
              : null

          return {
            id: snapshotDoc.id,
            householdId,
            ref: snapshotDoc.ref,
            type: String(data.type || 'consumed') as AdminActionReport['type'],
            status: String(data.status || 'Pending'),
            name: String(data.name || 'Unnamed item'),
            quantity: String(data.quantity || ''),
            partner: String(data.partner || 'Awaiting assignment'),
            partnerUserId:
              typeof data.partnerUserId === 'string'
                ? data.partnerUserId
                : null,
            pickupDate: String(data.pickupDate || ''),
            pickupLocation: rawPickupLocation
              ? {
                  label:
                    typeof rawPickupLocation.label === 'string'
                      ? rawPickupLocation.label
                      : undefined,
                  buildingNameNumber:
                    typeof rawPickupLocation.buildingNameNumber === 'string'
                      ? rawPickupLocation.buildingNameNumber
                      : undefined,
                  lat:
                    typeof rawPickupLocation.lat === 'number'
                      ? rawPickupLocation.lat
                      : undefined,
                  lng:
                    typeof rawPickupLocation.lng === 'number'
                      ? rawPickupLocation.lng
                      : undefined,
                }
              : undefined,
          }
        }),
      )
    })
  }, [])

  const filteredPartners = useMemo(() => {
    if (filter === 'all') return partners
    return partners.filter((partner) => partner.approvalStatus === filter)
  }, [filter, partners])

  const counts = useMemo(
    () => ({
      all: partners.length,
      pending: partners.filter((partner) => partner.approvalStatus === 'pending')
        .length,
      approved: partners.filter(
        (partner) => partner.approvalStatus === 'approved',
      ).length,
      rejected: partners.filter(
        (partner) => partner.approvalStatus === 'rejected',
      ).length,
    }),
    [partners],
  )

  const reportTotals = useMemo(
    () => ({
      donation: reports.filter((item) => item.type === 'donation').length,
      disposal: reports.filter((item) => item.type === 'disposal').length,
      consumed: reports.filter((item) => item.type === 'consumed').length,
      pending: reports.filter((item) => item.status === 'Pending' || item.status === 'Assigned').length,
      collected: reports.filter((item) => item.type !== 'consumed' && item.status === 'Collected').length,
      quantity: reports.reduce((total, item) => {
        return total + quantityAmount(item.quantity)
      }, 0),
    }),
    [reports],
  )

  const aggregationGroups = useMemo<AggregationGroup[]>(() => {
    const groups = new Map<
      string,
      {
        type: 'donation' | 'disposal'
        area: string
        households: Set<string>
        requestCount: number
        totalQuantity: number
        mappedCount: number
        statuses: Set<string>
        pickupDates: string[]
        items: Set<string>
        actions: AdminActionReport[]
        latTotal: number
        lngTotal: number
        coordinateCount: number
      }
    >()

    reports.forEach((item) => {
      if (
        (item.type !== 'donation' && item.type !== 'disposal') ||
        item.status === 'Collected' ||
        item.status === 'Cancelled' ||
        item.status === 'Confirmed' ||
        Boolean(item.partnerUserId)
      ) {
        return
      }

      const surplusType: 'donation' | 'disposal' = item.type
      const area = normalizeArea(
        item.pickupLocation?.buildingNameNumber ||
          item.pickupLocation?.label ||
          'No pickup area saved',
      )
      const key = `${surplusType}:${area.toLowerCase()}`
      const existing =
        groups.get(key) ??
        {
          type: surplusType,
          area,
          households: new Set<string>(),
          requestCount: 0,
          totalQuantity: 0,
          mappedCount: 0,
          statuses: new Set<string>(),
          pickupDates: [] as string[],
          items: new Set<string>(),
          actions: [] as AdminActionReport[],
          latTotal: 0,
          lngTotal: 0,
          coordinateCount: 0,
        }

      existing.households.add(item.householdId)
      existing.requestCount += 1
      existing.totalQuantity += quantityAmount(item.quantity)
      existing.statuses.add(item.status)
      existing.items.add(item.name)
      existing.actions.push(item)
      if (item.pickupDate) existing.pickupDates.push(item.pickupDate)
      if (
        typeof item.pickupLocation?.lat === 'number' &&
        typeof item.pickupLocation?.lng === 'number'
      ) {
        existing.mappedCount += 1
        existing.latTotal += item.pickupLocation.lat
        existing.lngTotal += item.pickupLocation.lng
        existing.coordinateCount += 1
      }

      groups.set(key, existing)
    })

    return Array.from(groups.entries())
      .map(([key, group]) => ({
        key,
        type: group.type,
        area: group.area,
        householdCount: group.households.size,
        requestCount: group.requestCount,
        totalQuantity: group.totalQuantity,
        mappedCount: group.mappedCount,
        centerLat:
          group.coordinateCount > 0 ? group.latTotal / group.coordinateCount : undefined,
        centerLng:
          group.coordinateCount > 0 ? group.lngTotal / group.coordinateCount : undefined,
        statuses: Array.from(group.statuses),
        nextPickupDate: group.pickupDates.sort()[0] || 'Not scheduled',
        items: Array.from(group.items).slice(0, 4),
        actions: group.actions,
      }))
      .sort((a, b) => {
        const requestDiff = b.requestCount - a.requestCount
        if (requestDiff !== 0) return requestDiff
        return a.area.localeCompare(b.area)
      })
  }, [reports])

  const filteredReports = useMemo(() => {
    if (reportFilter === 'all') return reports
    if (reportFilter === 'collected') {
      return reports.filter((item) => item.type !== 'consumed' && item.status === 'Collected')
    }
    if (reportFilter === 'pending') {
      return reports.filter((item) => item.status === 'Pending' || item.status === 'Assigned')
    }
    return reports.filter((item) => item.type === reportFilter)
  }, [reportFilter, reports])

  const approvedPartnersByType = useMemo(
    () => ({
      donation: partners.filter(
        (partner) =>
          partner.role === 'NGO' && partner.approvalStatus === 'approved',
      ),
      disposal: partners.filter(
        (partner) =>
          partner.role === 'RecyclingFirm' &&
          partner.approvalStatus === 'approved',
      ),
    }),
    [partners],
  )

  const partnersForGroup = (group: AggregationGroup) =>
    approvedPartnersByType[group.type]
      .map((partner) => ({
        partner,
        distanceKm: distanceBetweenKm(
          { lat: partner.lat, lng: partner.lng },
          { lat: group.centerLat, lng: group.centerLng },
        ),
      }))
      .sort((a, b) => {
        const aDistance =
          typeof a.distanceKm === 'number'
            ? a.distanceKm
            : Number.POSITIVE_INFINITY
        const bDistance =
          typeof b.distanceKm === 'number'
            ? b.distanceKm
            : Number.POSITIVE_INFINITY
        return aDistance - bDistance
      })

  const handleBatchAssignment = async (group: AggregationGroup) => {
    const partnerUserId = selectedBatchPartners[group.key]
    const partner = approvedPartnersByType[group.type].find(
      (item) => item.userId === partnerUserId,
    )

    if (!partner) {
      setError('Choose an approved partner for this batch first.')
      return
    }

    const partnerName =
      partner.organizationName || partner.name || 'Approved partner'

    setAssigningBatchKey(group.key)
    setError(null)
    setSuccessMessage(null)

    try {
      const batch = writeBatch(db)
      const batchId = `${group.type}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`

      group.actions.forEach((action) => {
        batch.update(action.ref, {
          batchId,
          batchArea: group.area,
          batchAssignedAt: serverTimestamp(),
          batchRequestCount: group.requestCount,
          partner: partnerName,
          partnerUserId: partner.userId,
          status: 'Confirmed',
          confirmedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        batch.set(doc(collection(action.ref, 'statusHistory')), {
          previousStatus: action.status,
          status: 'Confirmed',
          changedByUserId: userData?.userId || 'admin',
          changedByRole: 'Admin',
          changedAt: serverTimestamp(),
          note: `Admin assigned as part of ${group.area} ${group.type} batch.`,
        })
      })

      await batch.commit()
      setSuccessMessage(
        `${group.requestCount} ${group.type} request${
          group.requestCount === 1 ? '' : 's'
        } assigned to ${partnerName}.`,
      )
    } catch (assignmentError) {
      console.error('Admin batch assignment error:', assignmentError)
      setError(
        adminErrorMessage(
          assignmentError,
          'This batch could not be assigned. Make sure the selected partner is still approved, then try again.',
        ),
      )
    } finally {
      setAssigningBatchKey(null)
    }
  }

  const handleDecision = async (
    userId: string,
    decision: 'approved' | 'rejected',
  ) => {
    setWorkingUserId(userId)
    setError(null)

    try {
      if (decision === 'approved') {
        await approvePartner(userId)
      } else {
        await rejectPartner(userId)
      }
    } catch (decisionError) {
      console.error('Admin decision error:', decisionError)
      setError(
        adminErrorMessage(
          decisionError,
          'That approval decision could not be saved. Refresh the applications list and try again.',
        ),
      )
    } finally {
      setWorkingUserId(null)
    }
  }

  const handleLogout = async () => {
    if (!window.confirm('Log out of WasteWise?')) return
    window.sessionStorage.setItem('wastewise.justLoggedOut', 'true')
    await logout()
    navigate('/auth', { replace: true, state: { authState: 'login' } })
  }

  const flowStyle = (type: AdminActionReport['type']) => {
    if (type === 'donation') return 'bg-green-50 text-green-700'
    if (type === 'disposal') return 'bg-orange-50 text-orange-700'
    return 'bg-blue-50 text-blue-700'
  }

  const flowDetail = (item: AdminActionReport) => {
    if (item.type === 'consumed') return 'Household consumed'
    return item.pickupDate || 'Pickup not scheduled'
  }

  const displayReportStatus = (item: AdminActionReport) => {
    if (item.type === 'consumed') return 'Consumed'
    return item.status
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-wastewise-green selection:text-white">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-left"
          >
            <Leaf className="h-6 w-6 text-wastewise-green" />
            <span className="text-xl font-extrabold text-gray-900">
              WasteWise
            </span>
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-gray-900">
                {userData?.name ?? 'Admin'}
              </p>
              <p className="text-xs font-semibold text-gray-500">
                Administrator
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <section className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-1 text-xs font-bold text-wastewise-green">
              <ShieldCheck className="h-4 w-4" />
              Admin Console
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
              Admin Console
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Verify partner organisations separately from household food
              activity reports.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['pending', 'approved', 'rejected', 'all'] as PartnerStatus[]).map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilter(status)}
                  className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                    filter === status
                      ? 'border-wastewise-green bg-white shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="block text-2xl font-extrabold text-gray-900">
                    {counts[status]}
                  </span>
                  <span className="text-xs font-bold uppercase text-gray-500">
                    {status}
                  </span>
                </button>
              ),
            )}
          </div>
        </section>

        {error && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {successMessage}
          </div>
        )}

        <div className="mb-6 flex rounded-lg bg-gray-100 p-1 sm:w-fit">
          <button
            type="button"
            onClick={() => setActiveView('verification')}
            className={`rounded-md px-4 py-2 text-sm font-bold ${
              activeView === 'verification'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Organisation Verification
          </button>
          <button
            type="button"
            onClick={() => setActiveView('reports')}
            className={`rounded-md px-4 py-2 text-sm font-bold ${
              activeView === 'reports'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Food Activity Reports
          </button>
          <button
            type="button"
            onClick={() => setActiveView('aggregation')}
            className={`rounded-md px-4 py-2 text-sm font-bold ${
              activeView === 'aggregation'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Surplus Aggregation
          </button>
        </div>

        {activeView === 'aggregation' && (
          <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">
                  Surplus Aggregation
                </h2>
                <p className="text-sm text-gray-500">
                  Group open donation and disposal requests by estate, building,
                  or saved pickup area for one coordinated collection.
                </p>
              </div>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                {aggregationGroups.length} active batch
                {aggregationGroups.length === 1 ? '' : 'es'}
              </span>
            </div>

            {aggregationGroups.length === 0 ? (
              <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm font-semibold text-gray-500">
                No open donation or disposal requests are ready to group yet.
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {aggregationGroups.map((group) => (
                  <article
                    key={group.key}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${flowStyle(
                            group.type,
                          )}`}
                        >
                          {group.type} batch
                        </span>
                        <h3 className="mt-2 text-base font-extrabold text-gray-900">
                          {group.area}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Next pickup: {group.nextPickupDate}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2 text-right">
                        <p className="text-xl font-extrabold text-gray-900">
                          {group.requestCount}
                        </p>
                        <p className="text-xs font-bold uppercase text-gray-500">
                          requests
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="font-extrabold text-gray-900">
                          {group.householdCount}
                        </p>
                        <p className="text-xs font-semibold text-gray-500">
                          households
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="font-extrabold text-gray-900">
                          {group.totalQuantity}
                        </p>
                        <p className="text-xs font-semibold text-gray-500">
                          approx. qty
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="font-extrabold text-gray-900">
                          {group.mappedCount}
                        </p>
                        <p className="text-xs font-semibold text-gray-500">
                          mapped pins
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="truncate font-extrabold text-gray-900">
                          {group.statuses.join(', ')}
                        </p>
                        <p className="text-xs font-semibold text-gray-500">
                          statuses
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <span
                          key={`${group.key}-${item}`}
                          className="rounded-full bg-white px-2 py-1 text-xs font-bold text-gray-600 ring-1 ring-gray-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row">
                      <select
                        value={selectedBatchPartners[group.key] || ''}
                        onChange={(event) =>
                          setSelectedBatchPartners((current) => ({
                            ...current,
                            [group.key]: event.target.value,
                          }))
                        }
                        className="min-h-11 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 focus:border-wastewise-green focus:outline-none focus:ring-2 focus:ring-wastewise-green/20"
                        aria-label={`Choose partner for ${group.area} ${group.type} batch`}
                      >
                        <option value="">
                          Choose approved{' '}
                          {group.type === 'donation' ? 'NGO' : 'recycler'}
                        </option>
                        {partnersForGroup(group).map(({ partner, distanceKm }) => (
                          <option key={partner.userId} value={partner.userId}>
                            {partner.organizationName ||
                              partner.name ||
                              partner.email}{' '}
                            - {formatDistance(distanceKm)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleBatchAssignment(group)}
                        disabled={
                          assigningBatchKey === group.key ||
                          !selectedBatchPartners[group.key] ||
                          approvedPartnersByType[group.type].length === 0
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-wastewise-green px-4 text-sm font-bold text-white transition-colors hover:bg-wastewise-green-dark disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        {assigningBatchKey === group.key ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Assigning
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Assign Batch
                          </>
                        )}
                      </button>
                    </div>
                    {approvedPartnersByType[group.type].length === 0 && (
                      <p className="mt-2 text-xs font-semibold text-orange-600">
                        Approve a{' '}
                        {group.type === 'donation' ? 'NGO' : 'recycling firm'}{' '}
                        before assigning this batch.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeView === 'reports' && (
          <>
        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['donation', 'Donation Requests', reportTotals.donation, BarChart3],
            ['disposal', 'Disposal Requests', reportTotals.disposal, Recycle],
            ['consumed', 'Consumed', reportTotals.consumed, CheckCircle2],
            ['pending', 'Pending', reportTotals.pending, Clock3],
            ['collected', 'Collected Pickups', reportTotals.collected, ShieldCheck],
          ].map(([filterKey, label, value, Icon]) => {
            const MetricIcon = Icon as typeof BarChart3
            return (
              <button
                key={String(label)}
                type="button"
                onClick={() => setReportFilter(filterKey as ReportFilter)}
                className={`rounded-lg border bg-white p-4 text-left shadow-sm transition-colors hover:border-wastewise-green hover:bg-green-50/30 ${
                  reportFilter === filterKey
                    ? 'border-wastewise-green ring-2 ring-wastewise-green/10'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 text-gray-500">
                  <MetricIcon className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase">
                    {String(label)}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-extrabold text-gray-900">
                  {String(value)}
                </p>
              </button>
            )
          })}
        </section>

        <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                {reportLabels[reportFilter]}
              </h2>
              <p className="text-sm text-gray-500">
                {filteredReports.length} household action
                {filteredReports.length === 1 ? '' : 's'}
              </p>
            </div>
            {reportFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setReportFilter('all')}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Show all
              </button>
            )}
          </div>

          {filteredReports.length === 0 ? (
            <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm font-semibold text-gray-500">
              No records for this filter yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 font-bold">Food / Request</th>
                    <th className="px-3 py-2 font-bold">Flow</th>
                    <th className="px-3 py-2 font-bold">Quantity</th>
                    <th className="px-3 py-2 font-bold">Status</th>
                    <th className="px-3 py-2 font-bold">Partner</th>
                    <th className="px-3 py-2 font-bold">Activity Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReports.slice(0, 8).map((item) => (
                    <tr key={`${item.householdId}-${item.id}`}>
                      <td className="px-3 py-3 font-bold text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${flowStyle(item.type)}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {item.quantity || 'Not set'}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-700">
                          {displayReportStatus(item)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {item.partner}
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {flowDetail(item)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredReports.length > 8 && (
                <p className="mt-3 text-xs font-semibold text-gray-400">
                  Showing latest 8 records.
                </p>
              )}
            </div>
          )}
        </section>
          </>
        )}

        {activeView === 'verification' && (
          <>
        <section className="mb-4">
          <h2 className="text-xl font-extrabold text-gray-900">
            Organisation Verification
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Review NGO and recycling company registrations here. Food activity
            reports are in the separate tab above.
          </p>
        </section>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading partner applications...
            </div>
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-gray-300" />
            <h2 className="mt-3 text-lg font-extrabold text-gray-900">
              No applications here
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Change the filter to review a different approval status.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredPartners.map((partner) => {
              const isPending = partner.approvalStatus === 'pending'
              const busy = workingUserId === partner.userId
              const organization =
                partner.organizationName || partner.name || 'Unnamed partner'

              return (
                <article
                  key={partner.userId}
                  className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-wastewise-green"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPartner(partner)}
                    className="block w-full text-left"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-extrabold text-gray-900">
                          {organization}
                        </h2>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                            statusStyles[partner.approvalStatus]
                          }`}
                        >
                          {partner.approvalStatus}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-gray-500">
                        {partner.role === 'RecyclingFirm'
                          ? 'Recycling Company'
                          : 'NGO'}
                      </p>
                    </div>
                    </div>
                  </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleDecision(partner.userId, 'approved')
                        }
                        disabled={busy || partner.approvalStatus === 'approved'}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-wastewise-green text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Approve partner"
                        title="Approve"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="sr-only">Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleDecision(partner.userId, 'rejected')
                        }
                        disabled={busy || partner.approvalStatus === 'rejected'}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Reject partner"
                        title="Reject"
                      >
                        <XCircle className="h-5 w-5" />
                        <span className="sr-only">Reject</span>
                      </button>
                    </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPartner(partner)}
                    className="mt-5 grid w-full gap-3 text-left text-sm sm:grid-cols-2"
                  >
                    <div className="flex items-start gap-2 text-gray-600">
                      <Mail className="mt-0.5 h-4 w-4 text-gray-400" />
                      <span className="break-all">{partner.email}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
                      <span>{partner.operatingCounties || 'No counties set'}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600">
                      <Building2 className="mt-0.5 h-4 w-4 text-gray-400" />
                      <span>
                        {partner.registrationNumber || 'No registration number'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600">
                      <Clock3 className="mt-0.5 h-4 w-4 text-gray-400" />
                      <span>Applied {formatDate(partner.createdAt)}</span>
                    </div>
                  </button>

                  <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2 font-bold text-gray-800">
                      <FileText className="h-4 w-4 text-gray-400" />
                      Verification
                    </div>
                    <p className="mt-1">
                      {partner.certificateFileUrl ? (
                        <a
                          href={partner.certificateFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-wastewise-green hover:underline"
                        >
                          {partner.certificateFileName || 'Open certificate'}
                        </a>
                      ) : partner.certificateFileName ? (
                        partner.certificateFileName
                      ) : (
                        'No certificate file recorded.'
                      )}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-gray-500">
                      Contact: {partner.contactName || partner.name || 'Not set'}
                      {partner.designation ? `, ${partner.designation}` : ''}
                    </p>
                  </div>

                  {!isPending && (
                    <p className="mt-3 text-xs font-semibold text-gray-400">
                      Last updated {formatDate(partner.updatedAt)}
                    </p>
                  )}
                </article>
              )
            })}
          </div>
        )}
          </>
        )}
      </main>

      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  {selectedPartner.organizationName ||
                    selectedPartner.name ||
                    'Partner details'}
                </h2>
                <p className="mt-1 text-sm font-semibold text-gray-500">
                  {selectedPartner.role === 'RecyclingFirm'
                    ? 'Recycling Company'
                    : 'NGO'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPartner(null)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase text-gray-500">
                  Email
                </p>
                <p className="mt-1 break-all font-semibold text-gray-900">
                  {selectedPartner.email}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase text-gray-500">
                  Status
                </p>
                <p className="mt-1 font-semibold capitalize text-gray-900">
                  {selectedPartner.approvalStatus}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase text-gray-500">
                  Registration
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedPartner.registrationNumber || 'Not set'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase text-gray-500">
                  Counties
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedPartner.operatingCounties || 'Not set'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase text-gray-500">
                  Contact
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedPartner.contactName || selectedPartner.name || 'Not set'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase text-gray-500">
                  Designation
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedPartner.designation || 'Not set'}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
              <p className="text-xs font-bold uppercase text-gray-500">
                Certificate
              </p>
              {selectedPartner.certificateFileUrl ? (
                <a
                  href={selectedPartner.certificateFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block font-bold text-wastewise-green hover:underline"
                >
                  {selectedPartner.certificateFileName || 'Open certificate'}
                </a>
              ) : (
                <p className="mt-1 font-semibold text-gray-700">
                  {selectedPartner.certificateFileName ||
                    'No certificate uploaded.'}
                </p>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => handleDecision(selectedPartner.userId, 'rejected')}
                disabled={selectedPartner.approvalStatus === 'rejected'}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleDecision(selectedPartner.userId, 'approved')}
                disabled={selectedPartner.approvalStatus === 'approved'}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-wastewise-green px-4 py-2 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

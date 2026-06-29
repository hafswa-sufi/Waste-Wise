import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  collectionGroup,
  onSnapshot,
  query,
  where,
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
  Scale,
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
type ReportFilter = 'all' | 'donation' | 'disposal' | 'consumed' | 'collected'

interface PartnerProfile extends UserData {
  updatedAt?: Timestamp
  createdAt: Timestamp
}

interface AdminActionReport {
  id: string
  householdId: string
  type: 'donation' | 'disposal' | 'consumed'
  status: string
  name: string
  quantity: string
  partner: string
  pickupDate: string
}

const statusStyles = {
  pending: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  approved: 'border-green-200 bg-green-50 text-green-700',
  rejected: 'border-red-200 bg-red-50 text-red-700',
}

const reportLabels: Record<ReportFilter, string> = {
  all: 'All Activity',
  donation: 'Donations',
  disposal: 'Disposals',
  consumed: 'Consumed',
  collected: 'Collected',
}

function formatDate(value: unknown) {
  if (!value || typeof value !== 'object' || !('toDate' in value)) return 'Not set'
  return (value as Timestamp).toDate().toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
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
        setError('Could not load partner applications.')
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
          return {
            id: snapshotDoc.id,
            householdId,
            type: String(data.type || 'consumed') as AdminActionReport['type'],
            status: String(data.status || 'Pending'),
            name: String(data.name || 'Unnamed item'),
            quantity: String(data.quantity || ''),
            partner: String(data.partner || 'Partner pending'),
            pickupDate: String(data.pickupDate || ''),
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
      collected: reports.filter((item) => item.status === 'Collected').length,
      quantity: reports.reduce((total, item) => {
        const match = item.quantity.trim().match(/^(\d+(?:\.\d+)?)/)
        const amount = match ? Number(match[1]) : 0
        return total + (Number.isFinite(amount) ? amount : 0)
      }, 0),
    }),
    [reports],
  )

  const filteredReports = useMemo(() => {
    if (reportFilter === 'all') return reports
    if (reportFilter === 'collected') {
      return reports.filter((item) => item.status === 'Collected')
    }
    return reports.filter((item) => item.type === reportFilter)
  }, [reportFilter, reports])

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
      setError('Could not save that approval decision. Check admin rules.')
    } finally {
      setWorkingUserId(null)
    }
  }

  const handleLogout = async () => {
    window.sessionStorage.setItem('wastewise.justLoggedOut', 'true')
    await logout()
    navigate('/auth', { replace: true, state: { authState: 'login' } })
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
              Partner Approvals
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Review NGO and recycling company registrations before they can
              access their dashboards.
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

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['donation', 'Donations', reportTotals.donation, BarChart3],
            ['disposal', 'Disposals', reportTotals.disposal, Recycle],
            ['consumed', 'Consumed', reportTotals.consumed, CheckCircle2],
            ['collected', 'Collected', reportTotals.collected, ShieldCheck],
            ['all', 'Quantity', reportTotals.quantity, Scale],
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
                    <th className="px-3 py-2 font-bold">Item</th>
                    <th className="px-3 py-2 font-bold">Type</th>
                    <th className="px-3 py-2 font-bold">Quantity</th>
                    <th className="px-3 py-2 font-bold">Status</th>
                    <th className="px-3 py-2 font-bold">Partner</th>
                    <th className="px-3 py-2 font-bold">Household</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReports.slice(0, 8).map((item) => (
                    <tr key={`${item.householdId}-${item.id}`}>
                      <td className="px-3 py-3 font-bold text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-3 py-3 capitalize text-gray-600">
                        {item.type}
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {item.quantity || 'Not set'}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-700">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {item.partner}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-gray-500">
                        {item.householdId.slice(0, 8)}
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

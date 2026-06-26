import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  onSnapshot,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore'
import {
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Leaf,
  LogOut,
  Mail,
  MapPin,
  RefreshCw,
  ShieldCheck,
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

interface PartnerProfile extends UserData {
  updatedAt?: Timestamp
  createdAt: Timestamp
}

const statusStyles = {
  pending: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  approved: 'border-green-200 bg-green-50 text-green-700',
  rejected: 'border-red-200 bg-red-50 text-red-700',
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
                  className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
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
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
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
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2 font-bold text-gray-800">
                      <FileText className="h-4 w-4 text-gray-400" />
                      Verification
                    </div>
                    <p className="mt-1">
                      {partner.certificateFileName
                        ? partner.certificateFileName
                        : 'No certificate file name recorded.'}
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
    </div>
  )
}

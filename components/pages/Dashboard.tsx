import { useMemo, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  HandHeart,
  Leaf,
  LogOut,
  MapPinned,
  Package,
  RefreshCw,
  Users,
  XCircle,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  displayPartnerDate,
  displayDistance,
  displayPartnerStatus,
  groupPartnerBatches,
  partnerActionErrorMessage,
  parseQuantityValue,
  usePartnerActions,
  type PartnerAction,
  type PartnerActionBatch,
} from '../partners/partnerActions'
import { PartnerRequestMap } from '../partners/PartnerRequestMap'
import { PartnerRequestDetails } from '../partners/PartnerRequestDetails'
import { logout } from '../../src/service/authService'
import { useAuth } from '../../src/context/useAuth'

type ViewMode = 'available' | 'assigned' | 'map'

function statusClass(status: PartnerAction['status']) {
  switch (status) {
    case 'Pending':
    case 'Assigned':
      return 'bg-yellow-50 text-yellow-800 border-yellow-200'
    case 'Confirmed':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Collected':
      return 'bg-green-50 text-green-700 border-green-200'
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200'
  }
}

export function Dashboard() {
  const navigate = useNavigate()
  const { userData } = useAuth()
  const {
    availableActions,
    assignedActions,
    loading,
    error,
    acceptAction,
    declineAction,
    markCollected,
    markBatchCollected,
  } = usePartnerActions('donation')
  const [viewMode, setViewMode] = useState<ViewMode>('available')
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<PartnerAction | null>(
    null,
  )

  const activeActions =
    viewMode === 'available' ? availableActions : assignedActions
  const mapActions = [...availableActions, ...assignedActions].filter(
    (action) => action.status !== 'Collected',
  )
  const assignedBatches = useMemo(
    () => groupPartnerBatches(assignedActions),
    [assignedActions],
  )

  const stats = useMemo(
    () => ({
      available: availableActions.length,
      assigned: assignedActions.length,
      collected: assignedActions.filter((action) => action.status === 'Collected')
        .length,
      quantity: assignedActions.reduce(
        (total, action) => total + parseQuantityValue(action.quantity),
        0,
      ),
    }),
    [availableActions, assignedActions],
  )

  const handleLogout = async () => {
    if (!window.confirm('Log out of WasteWise?')) return
    window.sessionStorage.setItem('wastewise.justLoggedOut', 'true')
    await logout()
    navigate('/auth', { replace: true, state: { authState: 'login' } })
  }

  const runAction = async (
    action: PartnerAction,
    handler: (selectedAction: PartnerAction) => Promise<void>,
    successMessage: string,
    nextView?: ViewMode,
  ) => {
    setWorkingId(action.id)
    setMessage(null)
    setActionError(null)
    try {
      await handler(action)
      setMessage(successMessage)
      if (nextView) setViewMode(nextView)
    } catch (actionError) {
      console.error('NGO action error:', actionError)
      setActionError(
        partnerActionErrorMessage(actionError, 'donation pickup'),
      )
    } finally {
      setWorkingId(null)
    }
  }

  const runBatchAction = async (batch: PartnerActionBatch) => {
    setWorkingId(batch.key)
    setMessage(null)
    setActionError(null)
    try {
      await markBatchCollected(batch)
      setMessage(`${batch.area} batch marked as collected.`)
    } catch (actionError) {
      console.error('NGO batch action error:', actionError)
      setActionError(
        partnerActionErrorMessage(actionError, 'donation pickup batch'),
      )
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-wastewise-green selection:text-white">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Leaf className="h-6 w-6 text-wastewise-green" />
            <span className="text-xl font-extrabold text-gray-900">
              WasteWise
            </span>
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-gray-900">
                {userData?.organizationName || userData?.name || 'NGO'}
              </p>
              <p className="text-xs font-semibold text-gray-500">
                Donation Partner
              </p>
            </div>
            <Link
              to="/partner/profile"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-wastewise-green text-sm font-extrabold text-white hover:bg-green-800"
              aria-label="Open partner profile"
              title="Open partner profile"
            >
              {(userData?.organizationName || userData?.name || 'NGO')
                .slice(0, 2)
                .toUpperCase()}
            </Link>
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
              <HandHeart className="h-4 w-4" />
              NGO Dashboard
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
              Donation Pickups
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Accept available household donation requests and update pickups
              when collection is complete.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <span className="block text-2xl font-extrabold text-gray-900">
                {stats.available}
              </span>
              <span className="text-xs font-bold uppercase text-gray-500">
                Available
              </span>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <span className="block text-2xl font-extrabold text-gray-900">
                {stats.assigned}
              </span>
              <span className="text-xs font-bold uppercase text-gray-500">
                Mine
              </span>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <span className="block text-2xl font-extrabold text-gray-900">
                {stats.collected}
              </span>
              <span className="text-xs font-bold uppercase text-gray-500">
                Collected
              </span>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <span className="block text-2xl font-extrabold text-gray-900">
                {stats.quantity}
              </span>
              <span className="text-xs font-bold uppercase text-gray-500">
                Qty
              </span>
            </div>
          </div>
        </section>

        <div className="mb-4 flex rounded-lg bg-gray-100 p-1 sm:w-fit">
          <button
            type="button"
            onClick={() => setViewMode('available')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-bold sm:flex-none ${
              viewMode === 'available'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Available
          </button>
          <button
            type="button"
            onClick={() => setViewMode('assigned')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-bold sm:flex-none ${
              viewMode === 'assigned'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Pickups
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-bold sm:flex-none ${
              viewMode === 'map'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <MapPinned className="h-4 w-4" />
              Map
            </span>
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {message}
          </div>
        )}
        {actionError && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {actionError}
          </div>
        )}

        {(typeof userData?.lat !== 'number' ||
          typeof userData?.lng !== 'number') && (
          <div className="mb-4 rounded-lg border border-yellow-100 bg-yellow-50 px-4 py-3 text-sm font-semibold text-yellow-800">
            Save your organisation pickup base in Partner Profile to sort
            requests by distance.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {viewMode === 'map' ? (
          <PartnerRequestMap
            actions={mapActions}
            emptyLabel="Only requests with a saved household pickup pin can appear here."
            pinTone="donation"
            partnerLocation={
              typeof userData?.lat === 'number' &&
              typeof userData?.lng === 'number'
                ? {
                    lat: userData.lat,
                    lng: userData.lng,
                    label: userData.organizationName || userData.name,
                  }
                : undefined
            }
            onSelectAction={setSelectedAction}
          />
        ) : loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading donation requests...
            </div>
          </div>
        ) : viewMode === 'assigned' && assignedBatches.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
            <Package className="mx-auto h-10 w-10 text-gray-300" />
            <h2 className="mt-3 text-lg font-extrabold text-gray-900">
              No assigned donation batches
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Admin-assigned donation batches will appear here.
            </p>
          </div>
        ) : viewMode === 'assigned' ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {assignedBatches.map((batch) => (
              <article
                key={batch.key}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                      Donation batch
                    </span>
                    <h2 className="mt-2 text-lg font-extrabold text-gray-900">
                      {batch.area}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-gray-500">
                      {batch.householdCount} household
                      {batch.householdCount === 1 ? '' : 's'} -{' '}
                      {batch.requestCount} request
                      {batch.requestCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(
                      batch.status,
                    )}`}
                  >
                    {displayPartnerStatus(batch.status)}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span>{batch.totalQuantity} approx. qty</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{displayPartnerDate(batch.nextPickupDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{batch.mappedCount} mapped pickup pins</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {batch.items.slice(0, 5).map((item) => (
                    <span
                      key={`${batch.key}-${item.id}`}
                      className="rounded-full bg-gray-50 px-2 py-1 text-xs font-bold text-gray-600 ring-1 ring-gray-200"
                    >
                      {item.name}: {item.quantity}
                    </span>
                  ))}
                </div>

                {batch.status !== 'Collected' && (
                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      disabled={workingId === batch.key}
                      onClick={() => runBatchAction(batch)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-wastewise-green px-4 py-2 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Batch Collected
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : activeActions.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
            <Package className="mx-auto h-10 w-10 text-gray-300" />
            <h2 className="mt-3 text-lg font-extrabold text-gray-900">
              No donation requests
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              New household donation requests will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {activeActions.map((action) => (
              <article
                key={`${action.householdId}-${action.id}`}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-900">
                      {action.name}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-gray-500">
                      Household {action.householdId.slice(0, 8)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(
                      action.status,
                    )}`}
                  >
                    {displayPartnerStatus(action.status)}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span>{action.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{displayPartnerDate(action.pickupDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{action.partner}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
                    <MapPinned className="h-4 w-4 text-gray-400" />
                    <span>{displayDistance(action.distanceKm)}</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedAction(action)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
                  >
                    View Details
                  </button>
                  {(action.status === 'Assigned' ||
                    action.status === 'Pending') && (
                    <>
                      <button
                        type="button"
                        disabled={workingId === action.id}
                        onClick={() =>
                          runAction(
                            action,
                            declineAction,
                            `${action.name} declined. Another NGO can still accept it.`,
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" />
                        Decline
                      </button>
                      <button
                        type="button"
                        disabled={workingId === action.id}
                        onClick={() =>
                          runAction(
                            action,
                            acceptAction,
                            `${action.name} pickup scheduled. It is now visible on your map.`,
                            'map',
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-wastewise-green px-4 py-2 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Schedule Pickup
                      </button>
                    </>
                  )}
                  {action.status === 'Confirmed' && (
                    <button
                      type="button"
                      disabled={workingId === action.id}
                      onClick={() =>
                        runAction(
                          action,
                          markCollected,
                          `${action.name} marked as collected.`,
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-wastewise-green px-4 py-2 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Collected
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      {selectedAction && (
        <PartnerRequestDetails
          action={selectedAction}
          onClose={() => setSelectedAction(null)}
          tone="donation"
        />
      )}
    </div>
  )
}





import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  Calendar,
  HandHeart,
  MapPin,
  Recycle,
  Route,
} from 'lucide-react'
import {
  displayDate,
  useHouseholdBackend,
  type ActionItem,
} from '../household/householdBackend'

function statusClass(status: ActionItem['status']) {
  switch (status) {
    case 'Collected':
      return 'bg-green-50 text-green-700 border-green-100'
    case 'Confirmed':
      return 'bg-blue-50 text-blue-700 border-blue-100'
    default:
      return 'bg-yellow-50 text-yellow-700 border-yellow-100'
  }
}

function actionCopy(item: ActionItem) {
  if (item.status === 'Collected') return 'Completed pickup'
  if (item.status === 'Confirmed') return 'Partner is on the way'
  return 'Waiting for partner confirmation'
}

export function HouseholdNotifications() {
  const [params] = useSearchParams()
  const selectedId = params.get('item')
  const { donationItems, disposalItems, loading, error } = useHouseholdBackend()
  const actions = [...donationItems, ...disposalItems].sort((a, b) => {
    const first = new Date(`${a.pickupDate}T00:00:00`).getTime()
    const second = new Date(`${b.pickupDate}T00:00:00`).getTime()
    return first - second
  })

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
          <Bell className="w-5 h-5 text-wastewise-green" />
          <span className="font-extrabold text-gray-900">Notifications</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Pickup Notifications
          </h1>
          <p className="mt-1 text-gray-500">
            Donation and disposal updates with partner, route, and pickup
            status.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <section className="space-y-4">
            {actions.map((item) => {
              const isDonation = item.type === 'donation'
              const Icon = isDonation ? HandHeart : Recycle
              const selected = selectedId === item.id
              return (
                <article
                  key={item.id}
                  className={`bg-white rounded-xl border p-5 shadow-sm ${selected ? 'border-wastewise-green ring-2 ring-wastewise-green/20' : 'border-gray-200'}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center ${isDonation ? 'bg-orange-50 text-wastewise-orange' : 'bg-red-50 text-red-600'}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          {isDonation ? 'Donation pickup' : 'Disposal pickup'}
                        </p>
                        <h2 className="mt-1 text-xl font-extrabold text-gray-900">
                          {item.name}
                        </h2>
                        <p className="mt-1 text-sm font-medium text-gray-500">
                          {item.quantity} with {item.partner}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-gray-50 px-3 py-3">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">
                          Pickup date
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-gray-900">
                        {displayDate(item.pickupDate)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-3">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Route className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">
                          Route
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-gray-900">
                        Partner route to household area
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-3">
                      <div className="flex items-center gap-2 text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">
                          Location
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-gray-900">
                        Uses saved household location
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-600">
                      {actionCopy(item)}
                    </p>
                    <Link
                      to={`/household?tab=${isDonation ? 'donate' : 'dispose'}`}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                    >
                      View tracking tab
                    </Link>
                  </div>
                </article>
              )
            })}

            {loading && (
              <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-gray-500">
                Loading notifications...
              </div>
            )}
            {!loading && !error && actions.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-gray-500">
                No pickup notifications yet.
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-6 py-10 text-center text-red-600">
                {error}
              </div>
            )}
          </section>

          <aside className="bg-white border border-gray-200 rounded-xl p-5 h-fit">
            <h2 className="font-extrabold text-gray-900">Notification Data</h2>
            <p className="mt-2 text-sm text-gray-500">
              These updates are generated from household donation and disposal
              records. When a partner confirms or collects an item, the status
              changes here and in the relevant tracking tab.
            </p>
            <div className="mt-5 space-y-3">
              <div className="rounded-lg bg-yellow-50 px-3 py-3 text-sm font-semibold text-yellow-800">
                Pending means the request exists but partner confirmation is
                still needed.
              </div>
              <div className="rounded-lg bg-blue-50 px-3 py-3 text-sm font-semibold text-blue-800">
                Confirmed means pickup is planned and visible in your route
                updates.
              </div>
              <div className="rounded-lg bg-green-50 px-3 py-3 text-sm font-semibold text-green-800">
                Collected means the pickup is complete.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

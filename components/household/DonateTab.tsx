import {
  displayDate,
  useHouseholdBackend,
  type ActionItem,
  type ActionStatus,
} from './householdBackend'
import { Calendar, HandHeart } from 'lucide-react'
export function DonateTab() {
  const { donationItems, loading, error, updateActionStatus } =
    useHouseholdBackend()

  const counts = {
    pending: donationItems.filter((i) => i.status === 'Pending').length,
    confirmed: donationItems.filter((i) => i.status === 'Confirmed').length,
    collected: donationItems.filter((i) => i.status === 'Collected').length,
  }
  const getStatusColor = (status: ActionItem['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'Collected':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          My Donations
        </h1>
        <p className="text-gray-500 mt-1">Items you've flagged for donation</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
            Pending
          </p>
          <p className="text-3xl font-extrabold text-gray-900">
            {counts.pending}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
            Confirmed
          </p>
          <p className="text-3xl font-extrabold text-gray-900">
            {counts.confirmed}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
            Collected
          </p>
          <p className="text-3xl font-extrabold text-gray-900">
            {counts.collected}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {donationItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
              <p className="text-gray-500 font-medium">{item.quantity}</p>
            </div>

            <div className="flex-1 flex items-center gap-2 text-gray-700">
              <HandHeart className="w-5 h-5 text-wastewise-orange" />
              <span className="font-bold text-sm">{item.partner}</span>
            </div>

            <div className="flex-1 flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">
                {displayDate(item.pickupDate)}
              </span>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(item.status)}`}
              >
                {item.status}
              </span>
              <select
                value={item.status}
                onChange={(event) =>
                  updateActionStatus(
                    item.id,
                    event.target.value as ActionStatus,
                  )
                }
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-600 bg-white"
                aria-label={`Update ${item.name} donation status`}
              >
                <option>Pending</option>
                <option>Confirmed</option>
                <option>Collected</option>
              </select>
            </div>
          </div>
        ))}
        {loading && (
          <div className="py-10 text-center text-gray-500">
            Loading donations...
          </div>
        )}
        {!loading && !error && donationItems.length === 0 && (
          <div className="py-10 text-center text-gray-500">
            No donation requests yet.
          </div>
        )}
        {error && <div className="py-10 text-center text-red-600">{error}</div>}
      </div>
    </div>
  )
}

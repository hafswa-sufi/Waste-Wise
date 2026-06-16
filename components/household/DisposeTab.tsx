import {
  displayDate,
  useHouseholdBackend,
  type ActionItem,
  type ActionStatus,
} from './householdBackend'
import { useEffect, useRef, useState } from 'react'
import { Calendar, Recycle, RotateCcw } from 'lucide-react'
import gsap from 'gsap'
export function DisposeTab() {
  const {
    disposalItems,
    loading,
    error,
    updateActionStatus,
    removeActionAndRestoreToPantry,
  } = useHouseholdBackend()
  const listRef = useRef<HTMLDivElement>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!listRef.current) return
    gsap.fromTo(
      listRef.current.querySelectorAll('.action-card'),
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out' },
    )
  }, [disposalItems.length])

  const handleRestore = async (item: ActionItem) => {
    await removeActionAndRestoreToPantry(item)
    setNotice(`${item.name} removed from disposal and kept in pantry.`)
    window.setTimeout(() => setNotice(null), 2500)
  }

  const counts = {
    pending: disposalItems.filter((i) => i.status === 'Pending').length,
    confirmed: disposalItems.filter((i) => i.status === 'Confirmed').length,
    collected: disposalItems.filter((i) => i.status === 'Collected').length,
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
          My Disposals
        </h1>
        <p className="text-gray-500 mt-1">
          Items you've flagged for responsible disposal
        </p>
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
      {notice && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
          {notice}
        </div>
      )}

      <div ref={listRef} className="space-y-4">
        {disposalItems.map((item) => (
          <div
            key={item.id}
            className="action-card bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
              <p className="text-gray-500 font-medium">{item.quantity}</p>
            </div>

            <div className="flex-1 flex items-center gap-2 text-gray-700">
              <Recycle className="w-5 h-5 text-gray-500" />
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
                aria-label={`Update ${item.name} disposal status`}
              >
                <option>Pending</option>
                <option>Confirmed</option>
                <option>Collected</option>
              </select>
              <button
                type="button"
                onClick={() => handleRestore(item)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4" />
                Back to pantry
              </button>
            </div>
          </div>
        ))}
        {loading && (
          <div className="py-10 text-center text-gray-500">
            Loading disposals...
          </div>
        )}
        {!loading && !error && disposalItems.length === 0 && (
          <div className="py-10 text-center text-gray-500">
            No disposal requests yet.
          </div>
        )}
        {error && <div className="py-10 text-center text-red-600">{error}</div>}
      </div>
    </div>
  )
}

import { Calendar, CheckCircle2 } from 'lucide-react'
import { displayDate, useHouseholdBackend } from './householdBackend'

export function ConsumedTab() {
  const { consumedItems, loading, error } = useHouseholdBackend()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Consumed Foods
        </h1>
        <p className="text-gray-500 mt-1">
          Items marked as eaten or removed from your pantry.
        </p>
      </div>

      <div className="space-y-4">
        {consumedItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {item.name}
                </h3>
                <p className="text-gray-500 font-medium">{item.quantity}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">
                {displayDate(item.pickupDate)}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="py-10 text-center text-gray-500">
            Loading consumed foods...
          </div>
        )}
        {!loading && !error && consumedItems.length === 0 && (
          <div className="py-10 text-center text-gray-500">
            No consumed foods recorded yet.
          </div>
        )}
        {error && <div className="py-10 text-center text-red-600">{error}</div>}
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Recycle, Loader2 } from 'lucide-react'
import { useAuth } from '../../src/context/useAuth'
import { getDisposedItems, type PantryItem } from '../../src/service/pantryService'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending':   return 'bg-yellow-100 text-yellow-800'
    case 'Confirmed': return 'bg-blue-100 text-blue-800'
    case 'Collected': return 'bg-green-100 text-green-800'
    default:          return 'bg-gray-100 text-gray-800'
  }
}

export function DisposeTab() {
  const { currentUser } = useAuth()
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDisposed = useCallback(async () => {
    if (!currentUser) return
    try {
      setLoading(true)
      setError(null)
      const data = await getDisposedItems(currentUser.uid)
      setItems(data)
    } catch {
      setError('Failed to load disposal items')
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchDisposed()
  }, [fetchDisposed])

  const counts = {
    pending:   items.filter((i) => i.status === 'Disposed').length,
    confirmed: 0,
    collected: 0,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    )
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

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Pending</p>
          <p className="text-3xl font-extrabold text-gray-900">{counts.pending}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Confirmed</p>
          <p className="text-3xl font-extrabold text-gray-900">{counts.confirmed}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Collected</p>
          <p className="text-3xl font-extrabold text-gray-900">{counts.collected}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <Recycle className="w-12 h-12 mb-3 text-gray-200" />
          <p className="text-lg font-medium">No disposals yet</p>
          <p className="text-sm mt-1">Flag items for disposal from the Pantry or Alerts tab</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                <p className="text-gray-500 font-medium">{item.quantity}</p>
              </div>

              <div className="flex-1 flex items-center gap-2 text-gray-700">
                <Recycle className="w-5 h-5 text-gray-500" />
                <span className="font-bold text-sm">Taka Taka Solutions</span>
              </div>

              <div className="flex-1 flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Pending scheduling</span>
              </div>

              <div className="shrink-0">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor('Pending')}`}>
                  Pending
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
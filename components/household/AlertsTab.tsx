import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import gsap from 'gsap'
import { useAuth } from '../../src/context/useAuth'
import {
  getExpiryAlerts,
  updateItemStatus,
  type PantryItem,
} from '../../src/service/pantryService'

function getDaysRemaining(expiryDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getAlertStatus(item: PantryItem): 'expired' | 'expiring-soon' | 'this-week' {
  const days = getDaysRemaining(item.expiryDate)
  if (days < 0) return 'expired'
  if (days <= 3) return 'expiring-soon'
  return 'this-week'
}

function getCountdown(item: PantryItem): string {
  const days = getDaysRemaining(item.expiryDate)
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`
  if (days === 0) return 'Expires today!'
  if (days === 1) return 'Expires tomorrow'
  return `Expires in ${days} days`
}

const getBorderColor = (status: 'expired' | 'expiring-soon' | 'this-week') => {
  switch (status) {
    case 'expired':       return 'border-l-red-500'
    case 'expiring-soon': return 'border-l-wastewise-orange'
    case 'this-week':     return 'border-l-yellow-400'
    default:              return 'border-l-gray-300'
  }
}

const getTextColor = (status: 'expired' | 'expiring-soon' | 'this-week') => {
  switch (status) {
    case 'expired':       return 'text-red-600'
    case 'expiring-soon': return 'text-wastewise-orange'
    case 'this-week':     return 'text-yellow-600'
    default:              return 'text-gray-600'
  }
}

export function AlertsTab() {
  const { currentUser } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    if (!currentUser) return
    try {
      setLoading(true)
      setError(null)
      const data = await getExpiryAlerts(currentUser.uid)
      setItems(data)
    } catch {
      setError('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // Run GSAP animation after items load — same as original
  useEffect(() => {
    if (!loading && items.length > 0 && containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.alert-card')
      gsap.fromTo(
        cards,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' },
      )
    }
  }, [loading, items])

  async function handleAction(
    itemId: string,
    action: 'Consumed' | 'Donated' | 'Disposed'
  ) {
    try {
      setActionLoading(itemId + action)
      await updateItemStatus(itemId, action)
      // Remove from list immediately so the card disappears
      setItems((prev) => prev.filter((i) => i.id !== itemId))
    } catch {
      setError(`Failed to mark item as ${action.toLowerCase()}`)
    } finally {
      setActionLoading(null)
    }
  }

  const counts = {
    expired:      items.filter((i) => getAlertStatus(i) === 'expired').length,
    expiringSoon: items.filter((i) => getAlertStatus(i) === 'expiring-soon').length,
    thisWeek:     items.filter((i) => getAlertStatus(i) === 'this-week').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Expiry Alerts
        </h1>
        <p className="text-gray-500 mt-1">Items needing your attention</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        <div className="px-4 py-2 rounded-full bg-red-50 border border-red-100 text-red-700 text-sm font-bold flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          Expired ({counts.expired})
        </div>
        <div className="px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-800 text-sm font-bold flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-wastewise-orange" />
          Expiring in 3 days ({counts.expiringSoon})
        </div>
        <div className="px-4 py-2 rounded-full bg-yellow-50 border border-yellow-100 text-yellow-800 text-sm font-bold flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          This week ({counts.thisWeek})
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <p className="text-lg font-medium">No alerts right now</p>
          <p className="text-sm mt-1">All your pantry items are fresh!</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {items.map((item) => {
            const alertStatus = getAlertStatus(item)
            return (
              <div
                key={item.id}
                className={`alert-card bg-white rounded-xl shadow-sm border border-gray-200 border-l-[6px] p-6 flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300 ${getBorderColor(alertStatus)}`}
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500 font-medium">{item.category}</p>
                </div>

                <div className="mb-6">
                  <p className={`text-lg font-extrabold mb-2 ${getTextColor(alertStatus)}`}>
                    {getCountdown(item)}
                  </p>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {item.storageType}
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleAction(item.id, 'Consumed')}
                    disabled={!!actionLoading}
                    className="py-2 px-1 text-xs font-bold text-green-700 border border-green-600 rounded-lg hover:bg-green-50 transition-colors text-center disabled:opacity-50"
                  >
                    {actionLoading === item.id + 'Consumed' ? '...' : 'Consume'}
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'Donated')}
                    disabled={!!actionLoading}
                    className="py-2 px-1 text-xs font-bold text-white bg-wastewise-orange rounded-lg hover:bg-orange-600 transition-colors text-center disabled:opacity-50"
                  >
                    {actionLoading === item.id + 'Donated' ? '...' : 'Donate'}
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'Disposed')}
                    disabled={!!actionLoading}
                    className="py-2 px-1 text-xs font-bold text-red-600 border border-red-500 rounded-lg hover:bg-red-50 transition-colors text-center disabled:opacity-50"
                  >
                    {actionLoading === item.id + 'Disposed' ? '...' : 'Dispose'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
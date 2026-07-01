import { useEffect, useRef, useState } from 'react'
import { useHouseholdBackend, type AlertItem } from './householdBackend'
import { MapPin } from 'lucide-react'
import gsap from 'gsap'
export function AlertsTab() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [consumingAlert, setConsumingAlert] = useState<AlertItem | null>(null)
  const [consumedQuantity, setConsumedQuantity] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const {
    alerts,
    loading,
    error,
    consumePantryQuantity,
    reducePantryQuantity,
    flagAction,
  } = useHouseholdBackend()

  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.alert-card')
      gsap.fromTo(
        cards,
        {
          y: 20,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
        },
      )
    }
  }, [alerts])
  const getBorderColor = (status: AlertItem['status']) => {
    switch (status) {
      case 'expired':
        return 'border-l-red-500'
      case 'expiring-soon':
        return 'border-l-wastewise-orange'
      case 'this-week':
        return 'border-l-yellow-400'
      default:
        return 'border-l-gray-300'
    }
  }
  const getTextColor = (status: AlertItem['status']) => {
    switch (status) {
      case 'expired':
        return 'text-red-600'
      case 'expiring-soon':
        return 'text-wastewise-orange'
      case 'this-week':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }
  const counts = {
    expired: alerts.filter((i) => i.status === 'expired').length,
    expiringSoon: alerts.filter((i) => i.status === 'expiring-soon').length,
    thisWeek: alerts.filter((i) => i.status === 'this-week').length,
  }
  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 2500)
  }

  const openConsumeModal = (item: AlertItem) => {
    setConsumingAlert(item)
    setConsumedQuantity('')
    setFormError(null)
  }

  const submitConsumedQuantity = async () => {
    if (!consumingAlert) return
    if (!consumedQuantity.trim()) {
      setFormError('Enter how much was consumed.')
      return
    }

    try {
      await consumePantryQuantity(
        {
          id: consumingAlert.pantryItemId,
          name: consumingAlert.name,
          quantity: consumingAlert.quantity,
        },
        consumedQuantity.trim(),
      )
      showNotice(`${consumingAlert.name} consumption recorded.`)
      setConsumingAlert(null)
      setConsumedQuantity('')
      setFormError(null)
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Could not record that consumption amount.',
      )
    }
  }

  const requestPickup = async (item: AlertItem, type: 'donation' | 'disposal') => {
    try {
      const created = await flagAction({
        type,
        pantryItemId: item.pantryItemId,
        name: item.name,
        quantity: item.quantity,
      })

      if (!created) {
        showNotice(`A ${type} request already exists for ${item.name}.`)
        return
      }

      await reducePantryQuantity(
        { id: item.pantryItemId, quantity: item.quantity },
        item.quantity,
      )
      showNotice(
        type === 'donation'
          ? `${item.name} donation request created.`
          : `${item.name} disposal request created.`,
      )
    } catch (err) {
      showNotice(
        err instanceof Error
          ? err.message
          : `Could not create ${type} request.`,
      )
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Expiry Alerts
        </h1>
        <p className="text-gray-500 mt-1">Items needing your attention</p>
      </div>

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

      {notice && (
        <div className="mb-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
          {notice}
        </div>
      )}

      <div
        ref={containerRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {alerts.map((item) => (
          <div
            key={item.id}
            className={`alert-card bg-white rounded-xl shadow-sm border border-gray-200 border-l-[6px] p-6 flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300 ${getBorderColor(item.status)}`}
          >
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
              <p className="text-sm text-gray-500 font-medium">
                {item.category}
              </p>
            </div>

            <div className="mb-6">
              <p
                className={`text-lg font-extrabold mb-2 ${getTextColor(item.status)}`}
              >
                {item.countdown}
              </p>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin className="w-4 h-4 shrink-0" />
                {item.storageLocation}
              </div>
            </div>

            <div
              className={`mt-auto grid gap-2 ${item.status === 'expired' ? 'grid-cols-1' : 'grid-cols-3'}`}
            >
              {item.status !== 'expired' && (
                <>
                  <button
                    onClick={() => openConsumeModal(item)}
                    className="py-2 px-1 text-xs font-bold text-green-700 border border-green-600 rounded-lg hover:bg-green-50 transition-colors text-center"
                  >
                    Consume
                  </button>
                  {item.itemKind !== 'fresh' &&
                    item.category !== 'Vegetables' &&
                    item.category !== 'Fruits' && (
                    <button
                      onClick={() => requestPickup(item, 'donation')}
                      className="py-2 px-1 text-xs font-bold text-white bg-wastewise-orange rounded-lg hover:bg-orange-600 transition-colors text-center"
                    >
                      Donate
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => requestPickup(item, 'disposal')}
                className="py-2 px-1 text-xs font-bold text-red-600 border border-red-500 rounded-lg hover:bg-red-50 transition-colors text-center"
              >
                Dispose
              </button>
            </div>
          </div>
        ))}
      </div>
      {loading && (
        <div className="py-10 text-center text-gray-500">Loading alerts...</div>
      )}
      {!loading && !error && alerts.length === 0 && (
        <div className="py-10 text-center text-gray-500">
          No expiry alerts right now.
        </div>
      )}
      {error && <div className="py-10 text-center text-red-600">{error}</div>}
      {consumingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-extrabold text-gray-900">
              Record consumption
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Available: {consumingAlert.quantity}
            </p>
            <input
              autoFocus
              value={consumedQuantity}
              onChange={(event) => setConsumedQuantity(event.target.value)}
              placeholder={`Amount eaten, e.g. ${consumingAlert.quantity}`}
              className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-wastewise-green focus:outline-none focus:ring-2 focus:ring-wastewise-green/20"
            />
            {formError && (
              <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {formError}
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setConsumingAlert(null)
                  setFormError(null)
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitConsumedQuantity}
                className="rounded-lg bg-wastewise-green px-4 py-2 text-sm font-bold text-white hover:bg-green-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

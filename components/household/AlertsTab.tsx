import { useEffect, useRef } from 'react'
import { mockAlertItems } from './mockHouseholdData'
import type { AlertItem } from './mockHouseholdData'
import { MapPin } from 'lucide-react'
import gsap from 'gsap'
export function AlertsTab() {
  const containerRef = useRef<HTMLDivElement>(null)
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
  }, [])
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
    expired: mockAlertItems.filter((i) => i.status === 'expired').length,
    expiringSoon: mockAlertItems.filter((i) => i.status === 'expiring-soon')
      .length,
    thisWeek: mockAlertItems.filter((i) => i.status === 'this-week').length,
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

      <div
        ref={containerRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {mockAlertItems.map((item) => (
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

            <div className="mt-auto grid grid-cols-3 gap-2">
              <button className="py-2 px-1 text-xs font-bold text-green-700 border border-green-600 rounded-lg hover:bg-green-50 transition-colors text-center">
                Consume
              </button>
              <button className="py-2 px-1 text-xs font-bold text-white bg-wastewise-orange rounded-lg hover:bg-orange-600 transition-colors text-center">
                Donate
              </button>
              <button className="py-2 px-1 text-xs font-bold text-red-600 border border-red-500 rounded-lg hover:bg-red-50 transition-colors text-center">
                Dispose
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

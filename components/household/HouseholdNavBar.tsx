import React from 'react'
import {
  Leaf,
  Bell,
  LogOut,
  Package,
  Bell as BellIcon,
  HandHeart,
  Trash2,
  Sparkles,
  CheckCircle2,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../src/context/useAuth'
import { logout } from '../../src/service/authService'
import { useHouseholdBackend } from './householdBackend'

export type TabType =
  | 'pantry'
  | 'alerts'
  | 'freshness'
  | 'consumed'
  | 'donate'
  | 'dispose'

interface HouseholdNavbarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs: {
  id: TabType
  label: string
  icon: React.ElementType
}[] = [
  { id: 'pantry', label: 'Pantry', icon: Package },
  { id: 'alerts', label: 'Alerts', icon: BellIcon },
  { id: 'freshness', label: 'Freshness', icon: Sparkles },
  { id: 'consumed', label: 'Consumed', icon: CheckCircle2 },
  { id: 'donate', label: 'Donate', icon: HandHeart },
  { id: 'dispose', label: 'Dispose', icon: Trash2 },
]

export function HouseholdNavbar({
  activeTab,
  onTabChange,
}: HouseholdNavbarProps) {
  const navigate = useNavigate()
  const { userData } = useAuth()
  const { notifications } = useHouseholdBackend()
  const [logoutOpen, setLogoutOpen] = React.useState(false)
  const initials =
    userData?.name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'WK'

  const notificationCount = notifications.filter((item) => !item.read).length

  const handleLogout = async () => {
    window.sessionStorage.setItem('wastewise.justLoggedOut', 'true')
    await logout()
    navigate('/auth', { replace: true, state: { authState: 'login' } })
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm shrink-0">
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Leaf className="w-6 h-6 text-wastewise-green" />
          <span className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">
            WasteWise
          </span>
        </Link>
      </div>

      <div className="hidden md:flex items-center h-full">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`h-full px-4 flex items-center gap-2 border-b-2 transition-colors ${isActive ? 'border-wastewise-green text-wastewise-green' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-bold text-sm">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <button
          onClick={() => navigate('/household/notifications')}
          className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100"
          aria-label="Open notifications"
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-500 rounded-full border border-white text-[10px] leading-4 text-white font-bold">
              {notificationCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate('/household/profile')}
          className="w-8 h-8 bg-wastewise-green text-white rounded-full flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-green-800 transition-colors"
          aria-label="Open profile"
        >
          {initials}
        </button>

        <button
          onClick={() => setLogoutOpen(true)}
          className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
          aria-label="Log out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {logoutOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">
                  Log out?
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  You will return to the login page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLogoutOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Cancel logout"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLogoutOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

import React from 'react'
import {
  Leaf,
  Bell,
  LogOut,
  Package,
  Bell as BellIcon,
  Sparkles,
  HandHeart,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
export type TabType = 'pantry' | 'alerts' | 'freshness' | 'donate' | 'dispose'
interface HouseholdNavbarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}
const tabs: {
  id: TabType
  label: string
  icon: React.ElementType
}[] = [
  {
    id: 'pantry',
    label: 'Pantry',
    icon: Package,
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: BellIcon,
  },
  {
    id: 'freshness',
    label: 'Freshness',
    icon: Sparkles,
  },
  {
    id: 'donate',
    label: 'Donate',
    icon: HandHeart,
  },
  {
    id: 'dispose',
    label: 'Dispose',
    icon: Trash2,
  },
]
export function HouseholdNavbar({
  activeTab,
  onTabChange,
}: HouseholdNavbarProps) {
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
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <div className="w-8 h-8 bg-wastewise-green text-white rounded-full flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-green-800 transition-colors">
          WK
        </div>

        <button
          className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
          aria-label="Log out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}

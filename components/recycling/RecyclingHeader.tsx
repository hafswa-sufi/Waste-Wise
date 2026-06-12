import { Leaf, Bell, User } from 'lucide-react'
import { Link } from 'react-router-dom'
export type RecyclingTab = 'map' | 'collections' | 'schedule' | 'reports'
interface RecyclingHeaderProps {
  activeTab: RecyclingTab
  onTabChange: (tab: RecyclingTab) => void
  companyName: string
}
const tabs: {
  id: RecyclingTab
  label: string
}[] = [
  {
    id: 'map',
    label: 'Map View',
  },
  {
    id: 'collections',
    label: 'My Collections',
  },
  {
    id: 'schedule',
    label: 'Schedule',
  },
  {
    id: 'reports',
    label: 'Reports',
  },
]
export function RecyclingHeader({
  activeTab,
  onTabChange,
  companyName,
}: RecyclingHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 z-30 relative shadow-sm shrink-0">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <Leaf className="w-7 h-7 text-wastewise-green" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-wastewise-orange rounded-full border border-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">
              WasteWise
            </span>
          </Link>
          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase tracking-wide">
            Recycling Co.
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-gray-900 hidden md:block">
            {companyName}
          </span>
          <button
            className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          <div className="w-8 h-8 bg-wastewise-green text-white rounded-full flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-green-800 transition-colors">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-3 border-b-2 font-bold text-sm whitespace-nowrap transition-colors ${isActive ? 'border-wastewise-green text-wastewise-green' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </header>
  )
}

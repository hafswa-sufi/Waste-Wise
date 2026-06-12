import { Leaf, Bell, User } from 'lucide-react'
import { Link } from 'react-router-dom'
interface DashboardHeaderProps {
  filterMode: 'all' | 'donation' | 'disposal'
  setFilterMode: (mode: 'all' | 'donation' | 'disposal') => void
  userType: 'NGO' | 'Recycling Company'
  setUserType: (type: 'NGO' | 'Recycling Company') => void
}
export function DashboardHeader({
  filterMode,
  setFilterMode,
  userType,
  setUserType,
}: DashboardHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between z-20 relative shadow-sm shrink-0">
      <div className="flex items-center gap-2">
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

      <div className="flex bg-gray-100 p-1 rounded-full border border-gray-200">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterMode === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilterMode('donation')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterMode === 'donation' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Donations
        </button>
        <button
          onClick={() => setFilterMode('disposal')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterMode === 'disposal' ? 'bg-white text-wastewise-orange shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Disposals
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex bg-gray-100 p-1 rounded-full border border-gray-200">
          <button
            onClick={() => setUserType('NGO')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${userType === 'NGO' ? 'bg-white text-wastewise-green shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            NGO
          </button>
          <button
            onClick={() => setUserType('Recycling Company')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${userType === 'Recycling Company' ? 'bg-white text-wastewise-green shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Recycling
          </button>
        </div>

        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <div className="w-8 h-8 bg-wastewise-green/10 rounded-full flex items-center justify-center text-wastewise-green cursor-pointer hover:bg-wastewise-green/20 transition-colors">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  )
}

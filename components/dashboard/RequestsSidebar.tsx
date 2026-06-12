import { ChevronRight, Search } from 'lucide-react'
import type { WasteRequest } from './mockRequests'
interface RequestsSidebarProps {
  requests: WasteRequest[]
  onSelectRequest: (id: string) => void
  selectedRequestId: string | null
}
export function RequestsSidebar({
  requests,
  onSelectRequest,
  selectedRequestId,
}: RequestsSidebarProps) {
  return (
    <div className="w-full md:w-[380px] h-full bg-white border-l border-gray-200 flex flex-col z-10 shrink-0">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Active Requests</h2>
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">
            {requests.length}
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search estates..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No requests found matching your filter.
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {requests.map((req) => (
              <li
                key={req.id}
                onClick={() => onSelectRequest(req.id)}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 flex items-center gap-4 ${selectedRequestId === req.id ? 'bg-green-50/50' : ''}`}
              >
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${req.type === 'donation' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-wastewise-orange shadow-[0_0_8px_rgba(255,111,0,0.5)]'}`}
                />

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">
                    {req.estate}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span className="font-medium">{req.distanceKm}km away</span>
                    <span>•</span>
                    <span>{req.items.length} items</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${req.type === 'donation' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-wastewise-orange'}`}
                  >
                    {req.type}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

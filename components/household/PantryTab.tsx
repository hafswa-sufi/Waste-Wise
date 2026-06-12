import { useState } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Check,
  Flag,
  ChevronDown,
} from 'lucide-react'
import { mockPantryItems } from './mockHouseholdData'
import type { PantryItem } from './mockHouseholdData'
export function PantryTab() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const getStatusColor = (status: PantryItem['status']) => {
    switch (status) {
      case 'Fresh':
        return 'bg-green-100 text-green-800'
      case 'Expiring Soon':
        return 'bg-orange-100 text-orange-800'
      case 'Expired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  const getCategoryDot = (category: PantryItem['category']) => {
    switch (category) {
      case 'Vegetables':
        return 'bg-green-500'
      case 'Grains':
        return 'bg-yellow-500'
      case 'Dairy':
        return 'bg-blue-400'
      case 'Fruits':
        return 'bg-orange-400'
      case 'Proteins':
        return 'bg-red-400'
      default:
        return 'bg-gray-400'
    }
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            My Pantry
          </h1>
          <p className="text-gray-500 mt-1">
            Track all items in your household
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-wastewise-green text-white rounded-lg font-semibold hover:bg-green-800 transition-colors shadow-sm">
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search pantry..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 whitespace-nowrap">
              Category <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 whitespace-nowrap">
              Status <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 whitespace-nowrap">
              Expiry Date <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="px-6 py-4 font-bold">Item Name</th>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold">Quantity</th>
                <th className="px-6 py-4 font-bold">Storage</th>
                <th className="px-6 py-4 font-bold">Purchase Date</th>
                <th className="px-6 py-4 font-bold">Expiry Date</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockPantryItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${getCategoryDot(item.category)}`}
                      />
                      <span className="font-bold text-gray-900">
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.storageType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.purchaseDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.expiryDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColor(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 relative">
                      <button
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        aria-label="Mark as consumed"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <div className="relative">
                        <button
                          className="p-1.5 text-wastewise-orange hover:bg-orange-50 rounded-md transition-colors"
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === item.id ? null : item.id,
                            )
                          }
                          aria-label="Flag options"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                        {activeDropdown === item.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1">
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-wastewise-orange transition-colors">
                              Flag for Donation
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors">
                              Flag for Disposal
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

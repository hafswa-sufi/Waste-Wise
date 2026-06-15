import { useState, useEffect } from 'react'
import { Search, Plus, Pencil, Check, Flag, ChevronDown, Loader2 } from 'lucide-react'
import { useAuth } from '../../src/context/useAuth'
import {
  getPantryItems,
  addPantryItem,
  updateItemStatus,
  deletePantryItem,
} from '../../src/service/pantryService'
import type { PantryItem } from '../../src/service/pantryService'
import { AddItemModal } from './AddItemModal'

export function PantryTab() {
  const { currentUser } = useAuth()
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch pantry items on mount
  useEffect(() => {
    if (!currentUser) return
    fetchItems()
  }, [currentUser])

  async function fetchItems() {
    try {
      setLoading(true)
      const data = await getPantryItems(currentUser.uid)
      setItems(data)
    } catch (err) {
      setError('Failed to load pantry items')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkConsumed(itemId: string) {
    try {
      await updateItemStatus(itemId, 'Consumed')
      setItems((prev) => prev.filter((i) => i.id !== itemId))
    } catch (err) {
      console.error('Failed to mark as consumed', err)
    }
  }

  async function handleFlag(itemId: string, action: 'Donated' | 'Disposed') {
    try {
      await updateItemStatus(itemId, action)
      await fetchItems()
      setActiveDropdown(null)
    } catch (err) {
      console.error('Failed to flag item', err)
    }
  }

  // Filter by search query
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: PantryItem['status']) => {
    switch (status) {
      case 'Fresh': return 'bg-green-100 text-green-800'
      case 'Expiring Soon': return 'bg-orange-100 text-orange-800'
      case 'Expired': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryDot = (category: PantryItem['category']) => {
    switch (category) {
      case 'Vegetables': return 'bg-green-500'
      case 'Grains': return 'bg-yellow-500'
      case 'Dairy': return 'bg-blue-400'
      case 'Fruits': return 'bg-orange-400'
      case 'Proteins': return 'bg-red-400'
      default: return 'bg-gray-400'
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-green-700" />
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-64 text-red-500">
      {error}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Pantry</h1>
          <p className="text-gray-500 mt-1">Track all items in your household</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-wastewise-green text-white rounded-lg font-semibold hover:bg-green-800 transition-colors shadow-sm"
        >
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
              Category <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
              Status <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
              Expiry Date <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">No pantry items yet</p>
            <p className="text-sm mt-1">Click "Add Item" to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Storage</th>
                  <th className="px-6 py-4">Purchase Date</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getCategoryDot(item.category)}`} />
                        <span className="font-bold text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.storageType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.purchaseDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.expiryDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColor(item.status)}`}>
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
                          onClick={() => handleMarkConsumed(item.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          aria-label="Mark as consumed"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
                            onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                            aria-label="Flag options"
                          >
                            <Flag className="w-4 h-4" />
                          </button>
                          {activeDropdown === item.id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1">
                              <button
                                onClick={() => handleFlag(item.id, 'Donated')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-500 transition-colors"
                              >
                                Flag for Donation
                              </button>
                              <button
                                onClick={() => handleFlag(item.id, 'Disposed')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                              >
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
        )}
      </div>

      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (newItem) => {
            await addPantryItem(currentUser.uid, newItem)
            await fetchItems()
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}
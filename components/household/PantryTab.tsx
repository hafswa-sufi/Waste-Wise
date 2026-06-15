import { useState, type FormEvent } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Check,
  ChevronDown,
  HandHeart,
  Recycle,
} from 'lucide-react'
import {
  displayDate,
  type NewPantryItemInput,
  useHouseholdBackend,
  type PantryCategory,
  type PantryItem,
  type PantryStatus,
  type StorageType,
} from './householdBackend'

const categoryOptions: PantryCategory[] = [
  'Vegetables',
  'Grains',
  'Dairy',
  'Fruits',
  'Proteins',
  'Pantry',
]

const storageOptions: StorageType[] = ['Fridge', 'Counter', 'Basket']
const statusOptions: Array<PantryStatus | 'All'> = [
  'All',
  'Fresh',
  'Expiring Soon',
  'Expired',
]
const produceOptions: Array<{
  value: string
  label: string
  category: PantryCategory
  shelfLife: Record<StorageType, number>
}> = [
  {
    value: 'sukuma',
    label: 'Sukuma Wiki',
    category: 'Vegetables',
    shelfLife: { Fridge: 6, Counter: 2, Basket: 1 },
  },
  {
    value: 'tomatoes',
    label: 'Tomatoes',
    category: 'Vegetables',
    shelfLife: { Fridge: 7, Counter: 4, Basket: 3 },
  },
  {
    value: 'mangoes',
    label: 'Mangoes',
    category: 'Fruits',
    shelfLife: { Fridge: 6, Counter: 3, Basket: 2 },
  },
  {
    value: 'bananas',
    label: 'Bananas',
    category: 'Fruits',
    shelfLife: { Fridge: 5, Counter: 4, Basket: 3 },
  },
  {
    value: 'cabbage',
    label: 'Cabbage',
    category: 'Vegetables',
    shelfLife: { Fridge: 10, Counter: 3, Basket: 2 },
  },
  {
    value: 'spinach',
    label: 'Spinach',
    category: 'Vegetables',
    shelfLife: { Fridge: 5, Counter: 1, Basket: 1 },
  },
]

const emptyForm: NewPantryItemInput = {
  name: '',
  category: 'Pantry',
  quantity: '',
  storageType: 'Counter',
  purchaseDate: new Date().toISOString().slice(0, 10),
  expiryDate: '',
}

function addDays(dateOnly: string, days: number) {
  const date = new Date(`${dateOnly}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function PantryTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<PantryCategory | 'All'>(
    'All',
  )
  const [statusFilter, setStatusFilter] = useState<PantryStatus | 'All'>('All')
  const [sortMode, setSortMode] = useState<'soonest' | 'latest'>('soonest')
  const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [form, setForm] = useState<NewPantryItemInput>(emptyForm)
  const [itemKind, setItemKind] = useState<'processed' | 'fresh'>('processed')
  const [freshProduce, setFreshProduce] = useState(produceOptions[0].value)
  const [notice, setNotice] = useState<string | null>(null)
  const {
    pantryItems,
    loading,
    error,
    addPantryItem,
    updatePantryItem,
    markConsumed,
    flagAction,
  } = useHouseholdBackend()

  const selectedFreshProduce =
    produceOptions.find((item) => item.value === freshProduce) ??
    produceOptions[0]
  const estimatedFreshDays =
    selectedFreshProduce.shelfLife[form.storageType] ?? 2
  const estimatedFreshExpiryDate = addDays(
    form.purchaseDate,
    estimatedFreshDays,
  )

  const filteredItems = pantryItems
    .filter((item) =>
      [item.name, item.category, item.quantity, item.storageType]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    )
    .filter((item) =>
      categoryFilter === 'All' ? true : item.category === categoryFilter,
    )
    .filter((item) =>
      statusFilter === 'All' ? true : item.status === statusFilter,
    )
    .sort((a, b) => {
      const first = new Date(`${a.expiryDate}T00:00:00`).getTime()
      const second = new Date(`${b.expiryDate}T00:00:00`).getTime()
      return sortMode === 'soonest' ? first - second : second - first
    })

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 2500)
  }

  const openAddForm = () => {
    setForm(emptyForm)
    setEditingItemId(null)
    setItemKind('processed')
    setFreshProduce(produceOptions[0].value)
    setFormMode('add')
  }

  const openEditForm = (item: PantryItem) => {
    setForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      storageType: item.storageType,
      purchaseDate: item.purchaseDate,
      expiryDate: item.expiryDate,
    })
    setEditingItemId(item.id)
    setItemKind('processed')
    setFormMode('edit')
  }

  const handleSubmitItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const submittedForm =
      itemKind === 'fresh'
        ? {
            ...form,
            name: selectedFreshProduce.label,
            category: selectedFreshProduce.category,
            expiryDate: estimatedFreshExpiryDate,
          }
        : form

    if (formMode === 'edit' && editingItemId) {
      await updatePantryItem(editingItemId, submittedForm)
      showNotice('Pantry item updated.')
    } else {
      await addPantryItem(submittedForm)
      showNotice('Pantry item added.')
    }
    setFormMode(null)
    setEditingItemId(null)
  }

  const handleFlag = async (
    item: PantryItem,
    type: 'donation' | 'disposal',
  ) => {
    await flagAction({
      type,
      pantryItemId: item.id,
      name: item.name,
      quantity: item.quantity,
    })
    showNotice(
      type === 'donation'
        ? 'Donation request created.'
        : 'Disposal request created.',
    )
  }

  const handleConsumed = async (item: PantryItem) => {
    await markConsumed(item)
    showNotice(`${item.name} marked as consumed.`)
  }

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
        <button
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-wastewise-green text-white rounded-lg font-semibold hover:bg-green-800 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>
      {notice && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
          {notice}
        </div>
      )}

      {formMode && (
        <form
          onSubmit={handleSubmitItem}
          className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-6 gap-3"
        >
          <div className="md:col-span-6 flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setItemKind('processed')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-bold transition-colors ${itemKind === 'processed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Processed goods
            </button>
            <button
              type="button"
              onClick={() => setItemKind('fresh')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-bold transition-colors ${itemKind === 'fresh' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Fresh produce
            </button>
          </div>
          {itemKind === 'fresh' && (
            <select
              value={freshProduce}
              onChange={(event) => setFreshProduce(event.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm md:col-span-2"
            >
              {produceOptions.map((produce) => (
                <option key={produce.value} value={produce.value}>
                  {produce.label}
                </option>
              ))}
            </select>
          )}
          <input
            required
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Item name"
            disabled={itemKind === 'fresh'}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm md:col-span-2 disabled:bg-gray-100 disabled:text-gray-500"
          />
          <input
            required
            value={form.quantity}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                quantity: event.target.value,
              }))
            }
            placeholder="Quantity"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category: event.target.value as PantryCategory,
              }))
            }
            disabled={itemKind === 'fresh'}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
          >
            {categoryOptions.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <select
            value={form.storageType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                storageType: event.target.value as StorageType,
              }))
            }
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {storageOptions.map((storage) => (
              <option key={storage}>{storage}</option>
            ))}
          </select>
          <input
            required
            type="date"
            value={itemKind === 'fresh' ? estimatedFreshExpiryDate : form.expiryDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                expiryDate: event.target.value,
              }))
            }
            disabled={itemKind === 'fresh'}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
          />
          <input
            required
            type="date"
            value={form.purchaseDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                purchaseDate: event.target.value,
              }))
            }
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm md:col-span-2"
          />
          {itemKind === 'fresh' && (
            <div className="md:col-span-6 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">
              Estimated expiry: {displayDate(estimatedFreshExpiryDate)} based
              on {selectedFreshProduce.label}, {form.storageType.toLowerCase()}{' '}
              storage, and purchase date.
            </div>
          )}
          <div className="flex gap-2 md:col-span-4 md:justify-end">
            <button
              type="button"
              onClick={() => setFormMode(null)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-wastewise-green text-white rounded-lg text-sm font-bold hover:bg-green-800"
            >
              {formMode === 'edit' ? 'Save Changes' : 'Save Item'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search pantry..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value as PantryCategory | 'All')
                }
                className="appearance-none px-3 py-1.5 pr-8 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <option>All</option>
                {categoryOptions.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as PantryStatus | 'All')
                }
                className="appearance-none px-3 py-1.5 pr-8 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
            </div>
            <div className="relative">
              <select
                value={sortMode}
                onChange={(event) =>
                  setSortMode(event.target.value as 'soonest' | 'latest')
                }
                className="appearance-none px-3 py-1.5 pr-8 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <option value="soonest">Expiry soonest</option>
                <option value="latest">Expiry latest</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
            </div>
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
                <th className="px-6 py-4 font-bold text-right">
                  Quick Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
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
                    {displayDate(item.purchaseDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {displayDate(item.expiryDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColor(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-blue-700 border border-blue-100 hover:bg-blue-50 rounded-md transition-colors"
                        aria-label="Edit"
                        onClick={() => openEditForm(item)}
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-green-700 border border-green-100 hover:bg-green-50 rounded-md transition-colors"
                        aria-label="Mark as consumed"
                        onClick={() => handleConsumed(item)}
                      >
                        <Check className="w-4 h-4" />
                        Eat
                      </button>
                      <button
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-orange-700 border border-orange-100 hover:bg-orange-50 rounded-md transition-colors"
                        onClick={() => handleFlag(item, 'donation')}
                        aria-label={`Donate ${item.name}`}
                      >
                        <HandHeart className="w-4 h-4" />
                        Donate
                      </button>
                      <button
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-red-700 border border-red-100 hover:bg-red-50 rounded-md transition-colors"
                        onClick={() => handleFlag(item, 'disposal')}
                        aria-label={`Dispose ${item.name}`}
                      >
                        <Recycle className="w-4 h-4" />
                        Dispose
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && (
            <div className="px-6 py-10 text-center text-gray-500">
              Loading pantry...
            </div>
          )}
          {!loading && !error && filteredItems.length === 0 && (
            <div className="px-6 py-10 text-center text-gray-500">
              No pantry items found.
            </div>
          )}
          {error && (
            <div className="px-6 py-10 text-center text-red-600">{error}</div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Check,
  ChevronDown,
  HandHeart,
  Recycle,
} from 'lucide-react'
import gsap from 'gsap'
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
  'Other',
]

const storageOptions: StorageType[] = ['Fridge', 'Counter', 'Basket']
const statusOptions: Array<PantryStatus | 'All'> = [
  'All',
  'Fresh',
  'Expiring Soon',
  'Expired',
]
const categoryShelfLife: Record<PantryCategory, Record<StorageType, number>> = {
  Vegetables: { Fridge: 6, Counter: 2, Basket: 1 },
  Fruits: { Fridge: 6, Counter: 4, Basket: 2 },
  Grains: { Fridge: 30, Counter: 120, Basket: 90 },
  Dairy: { Fridge: 4, Counter: 1, Basket: 1 },
  Proteins: { Fridge: 3, Counter: 1, Basket: 1 },
  Other: { Fridge: 14, Counter: 14, Basket: 7 },
}

const cookedFoodKeywords = [
  'cooked',
  'leftover',
  'leftovers',
  'stew',
  'soup',
  'meal',
  'takeaway',
  'fried',
  'boiled',
  'roasted',
  'grilled',
  'pilau',
]
const freshFoodKeywords = [
  'sukuma',
  'kale',
  'spinach',
  'tomato',
  'mango',
  'banana',
  'cabbage',
  'lettuce',
  'avocado',
  'carrot',
  'onion',
  'chicken',
  'beef',
  'meat',
  'fish',
  'pork',
  'lamb',
]
const processedFoodKeywords = [
  'flour',
  'cereal',
  'pasta',
  'canned',
  'tin',
  'packet',
  'noodles',
  'biscuits',
  'crackers',
  'sauce',
  'jam',
]

const emptyForm: NewPantryItemInput = {
  name: '',
  category: 'Other',
  quantity: '',
  storageType: 'Counter',
  purchaseDate: toDateInputValue(new Date()),
  expiryDate: '',
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(dateOnly: string, days: number) {
  const date = new Date(`${dateOnly}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  date.setDate(date.getDate() + days)
  return toDateInputValue(date)
}

function includesAny(value: string, words: string[]) {
  const normalized = value.toLowerCase()
  return words.some((word) => normalized.includes(word))
}

function validatePantryItem(input: NewPantryItemInput, kind: 'processed' | 'fresh') {
  if (includesAny(input.name, cookedFoodKeywords)) {
    return 'Cooked food is outside the current WasteWise pantry scope. Add raw fresh produce or packaged/processed goods only.'
  }

  if (kind === 'fresh') {
    if (input.category !== 'Vegetables' && input.category !== 'Fruits' && input.category !== 'Proteins') {
      return 'Fresh produce must be a vegetable, fruit, or fresh protein such as chicken, beef, meat, or fish.'
    }
    if (includesAny(input.name, processedFoodKeywords)) {
      return 'That looks like a processed good. Add it under Processed goods with a manual expiry date.'
    }
  }

  if (
    kind === 'processed' &&
    (input.category === 'Vegetables' ||
      input.category === 'Fruits' ||
      includesAny(input.name, freshFoodKeywords))
  ) {
    return 'Fresh produce should be added under Fresh produce so WasteWise can estimate its shelf life.'
  }

  return null
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
  const [notice, setNotice] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [consumingItem, setConsumingItem] = useState<PantryItem | null>(null)
  const [consumedQuantity, setConsumedQuantity] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const tableBodyRef = useRef<HTMLTableSectionElement>(null)
  const {
    pantryItems,
    donationItems,
    disposalItems,
    loading,
    error,
    addPantryItem,
    updatePantryItem,
    consumePantryQuantity,
    flagAction,
  } = useHouseholdBackend()

  const estimatedFreshDays =
    categoryShelfLife[form.category]?.[form.storageType] ?? 2
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

  useEffect(() => {
    if (!tableBodyRef.current) return
    gsap.fromTo(
      tableBodyRef.current.querySelectorAll('tr'),
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out' },
    )
  }, [filteredItems.length])

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 2500)
  }

  const openAddForm = () => {
    setForm(emptyForm)
    setEditingItemId(null)
    setItemKind('processed')
    setFormError(null)
    setFormMode('add')
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 0)
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
    setItemKind(item.itemKind ?? 'processed')
    setFormError(null)
    setFormMode('edit')
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 0)
  }

  const handleSubmitItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const submittedForm =
      itemKind === 'fresh'
        ? {
            ...form,
            itemKind,
            expiryDate: estimatedFreshExpiryDate,
          }
        : { ...form, storageType: 'Counter' as StorageType, itemKind }
    const validationMessage = validatePantryItem(submittedForm, itemKind)
    if (validationMessage) {
      setFormError(validationMessage)
      return
    }
    setFormError(null)

    try {
      if (formMode === 'edit' && editingItemId) {
        await updatePantryItem(editingItemId, submittedForm)
        showNotice('Pantry item updated.')
      } else {
        await addPantryItem(submittedForm)
        showNotice('Pantry item added.')
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Could not save this pantry item.',
      )
      return
    }
    setFormMode(null)
    setEditingItemId(null)
  }

  const handleFlag = async (
    item: PantryItem,
    type: 'donation' | 'disposal',
  ) => {
    try {
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
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Could not create that request.',
      )
    }
  }

  const handleConsumed = async (item: PantryItem) => {
    setConsumingItem(item)
    setConsumedQuantity('')
    setFormError(null)
  }

  const submitConsumedQuantity = async () => {
    if (!consumingItem) return
    try {
      await consumePantryQuantity(consumingItem, consumedQuantity.trim())
      showNotice(`${consumingItem.name} consumption recorded.`)
      setConsumingItem(null)
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
          ref={formRef}
          onSubmit={handleSubmitItem}
          className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-6 gap-3"
        >
          <div className="md:col-span-6">
            <h2 className="text-lg font-extrabold text-gray-900">
              {formMode === 'edit' ? 'Edit pantry item' : 'Add pantry item'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {formMode === 'edit'
                ? 'Update the item details and save your changes.'
                : 'Processed goods use a manual expiry date; fresh produce uses the estimator.'}
            </p>
          </div>
          <div className="md:col-span-6 flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setItemKind('processed')
                setForm((current) => ({ ...current, category: 'Other' }))
              }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-bold transition-colors ${itemKind === 'processed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Processed goods
            </button>
            <button
              type="button"
              onClick={() => {
                setItemKind('fresh')
                setForm((current) => ({ ...current, category: 'Vegetables' }))
              }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-bold transition-colors ${itemKind === 'fresh' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Fresh produce
            </button>
          </div>
          <input
            required
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Item name"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm md:col-span-2"
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
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {categoryOptions.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          {itemKind === 'fresh' && (
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
          )}
          <label className="text-xs font-bold text-gray-500">
            Expiry date
            <input
              required
              type="date"
              value={
                itemKind === 'fresh' ? estimatedFreshExpiryDate : form.expiryDate
              }
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  expiryDate: event.target.value,
                }))
              }
              disabled={itemKind === 'fresh'}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
            />
          </label>
          <label className="text-xs font-bold text-gray-500 md:col-span-2">
            Purchase date
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
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          {itemKind === 'fresh' && (
            <div className="md:col-span-6 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">
              Estimated expiry: {displayDate(estimatedFreshExpiryDate)} based
              on {form.category.toLowerCase()}, {form.storageType.toLowerCase()}{' '}
              storage, and purchase date.
            </div>
          )}
          {formError && (
            <div className="md:col-span-6 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {formError}
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
            <tbody ref={tableBodyRef} className="divide-y divide-gray-100">
              {filteredItems.map((item) => {
                const hasDonation = donationItems.some(
                  (action) => action.pantryItemId === item.id,
                )
                const hasDisposal = disposalItems.some(
                  (action) => action.pantryItemId === item.id,
                )
                const isFreshProduce =
                  item.itemKind === 'fresh' ||
                  item.category === 'Vegetables' ||
                  item.category === 'Fruits'
                return (
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
                      {item.status !== 'Expired' && (
                        <>
                          <button
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-green-700 border border-green-100 hover:bg-green-50 rounded-md transition-colors"
                            aria-label="Mark as consumed"
                            onClick={() => handleConsumed(item)}
                          >
                            <Check className="w-4 h-4" />
                            Eat
                          </button>
                          {!isFreshProduce && (
                            <button
                              disabled={hasDonation}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-orange-700 border border-orange-100 hover:bg-orange-50 rounded-md transition-colors disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                              onClick={() => handleFlag(item, 'donation')}
                              aria-label={`Donate ${item.name}`}
                            >
                              <HandHeart className="w-4 h-4" />
                              {hasDonation ? 'Donated' : 'Donate'}
                            </button>
                          )}
                        </>
                      )}
                      <button
                        disabled={hasDisposal}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-red-700 border border-red-100 hover:bg-red-50 rounded-md transition-colors disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                        onClick={() => handleFlag(item, 'disposal')}
                        aria-label={`Dispose ${item.name}`}
                      >
                        <Recycle className="w-4 h-4" />
                        {hasDisposal ? 'Queued' : 'Dispose'}
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
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
      {consumingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-extrabold text-gray-900">
              Record consumption
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Available: {consumingItem.quantity}
            </p>
            <input
              autoFocus
              value={consumedQuantity}
              onChange={(event) => setConsumedQuantity(event.target.value)}
              placeholder={`Amount eaten, e.g. ${consumingItem.quantity}`}
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
                  setConsumingItem(null)
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

import { useMemo, useState, type FormEvent } from 'react'
import {
  Calendar,
  Check,
  HandHeart,
  Recycle,
  Sparkles,
  Thermometer,
} from 'lucide-react'
import {
  displayDate,
  useHouseholdBackend,
  type PantryCategory,
  type StorageType,
} from './householdBackend'

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

function addDays(dateOnly: string, days: number) {
  const date = new Date(`${dateOnly}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function daysUntil(dateOnly: string) {
  const expiry = new Date(`${dateOnly}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000)
}

export function FreshnessTab() {
  const { addPantryItem, flagAction } = useHouseholdBackend()
  const [produce, setProduce] = useState(produceOptions[0].value)
  const [storage, setStorage] = useState<StorageType>('Counter')
  const [quantity, setQuantity] = useState('1 item')
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [submitted, setSubmitted] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)

  const selectedProduce = useMemo(
    () =>
      produceOptions.find((option) => option.value === produce) ??
      produceOptions[0],
    [produce],
  )
  const estimatedDays = selectedProduce.shelfLife[storage]
  const expiryDate = addDays(purchaseDate, estimatedDays)
  const remainingDays = daysUntil(expiryDate)
  const status =
    remainingDays < 0
      ? 'Spoiled'
      : remainingDays <= 1
        ? 'Use Today'
        : remainingDays <= 3
          ? 'Use Soon'
          : 'Fresh'
  const statusClass =
    status === 'Spoiled'
      ? 'bg-red-50 text-red-700 border-red-100'
      : status === 'Use Today' || status === 'Use Soon'
        ? 'bg-orange-50 text-orange-700 border-orange-100'
        : 'bg-green-50 text-green-700 border-green-100'

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 2500)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
  }

  const handleSaveToPantry = async () => {
    await addPantryItem({
      name: selectedProduce.label,
      category: selectedProduce.category,
      quantity,
      storageType: storage,
      purchaseDate,
      expiryDate,
    })
    showNotice(`${selectedProduce.label} added to pantry.`)
  }

  const handleAction = async (type: 'donation' | 'disposal') => {
    await flagAction({
      type,
      name: selectedProduce.label,
      quantity,
    })
    showNotice(
      type === 'donation'
        ? 'Donation request created.'
        : 'Disposal request created.',
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-wastewise-green mb-3">
            <Sparkles className="w-4 h-4" />
            Fresh produce estimator
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Estimate Freshness
          </h1>
          <p className="text-gray-500 mt-1">
            For fresh produce without printed expiry dates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 h-fit space-y-5"
        >
          <label className="block">
            <span className="text-sm font-bold text-gray-700">
              Produce type
            </span>
            <select
              value={produce}
              onChange={(event) => setProduce(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold focus:border-wastewise-green focus:outline-none focus:ring-2 focus:ring-wastewise-green/20"
            >
              {produceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-gray-700">Quantity</span>
            <input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-wastewise-green focus:outline-none focus:ring-2 focus:ring-wastewise-green/20"
              placeholder="1 bunch, 2kg, 6 pieces"
            />
          </label>

          <div>
            <span className="text-sm font-bold text-gray-700">
              Storage method
            </span>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['Fridge', 'Counter', 'Basket'] as StorageType[]).map(
                (method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setStorage(method)}
                    className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${storage === method ? 'border-wastewise-green bg-green-50 text-wastewise-green' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    {method}
                  </button>
                ),
              )}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-bold text-gray-700">
              Purchase date
            </span>
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-wastewise-green focus-within:ring-2 focus-within:ring-wastewise-green/20">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={purchaseDate}
                onChange={(event) => setPurchaseDate(event.target.value)}
                className="w-full text-sm outline-none"
              />
            </div>
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-wastewise-green px-4 py-3 text-sm font-extrabold text-white hover:bg-green-800"
          >
            Estimate freshness
          </button>
        </form>

        <section className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
          {submitted && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-gray-400">
                    Estimated result
                  </p>
                  <h2 className="mt-1 text-3xl font-extrabold text-gray-900">
                    {selectedProduce.label}
                  </h2>
                  <p className="mt-1 text-gray-500">
                    {storage} storage from {displayDate(purchaseDate)}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold ${statusClass}`}
                >
                  {status}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg bg-gray-50 px-4 py-4">
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Shelf life
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-gray-900">
                    {estimatedDays} days
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 px-4 py-4">
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Expiry estimate
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-gray-900">
                    {displayDate(expiryDate)}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 px-4 py-4">
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Time left
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-gray-900">
                    {remainingDays > 0
                      ? `${remainingDays} days`
                      : remainingDays === 0
                        ? 'Today'
                        : 'Expired'}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4">
                <div className="flex items-start gap-3">
                  <Thermometer className="w-5 h-5 text-wastewise-green mt-0.5" />
                  <div>
                    <h3 className="font-extrabold text-gray-900">
                      Freshness recommendation
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {status === 'Spoiled'
                        ? 'Move this to disposal so it can be handled responsibly.'
                        : status === 'Use Today'
                          ? 'Use this today or donate it immediately if it is still edible.'
                          : 'Add this to the pantry so alerts can track it automatically.'}
                    </p>
                  </div>
                </div>
              </div>

              {notice && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
                  {notice}
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSaveToPantry}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-wastewise-green px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800"
                >
                  <Check className="w-4 h-4" />
                  Add to pantry
                </button>
                <button
                  onClick={() => handleAction('donation')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-orange-100 px-4 py-2.5 text-sm font-bold text-orange-700 hover:bg-orange-50"
                >
                  <HandHeart className="w-4 h-4" />
                  Donate
                </button>
                <button
                  onClick={() => handleAction('disposal')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50"
                >
                  <Recycle className="w-4 h-4" />
                  Dispose
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

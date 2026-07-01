import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  Calendar,
  Check,
  Search,
  Sparkles,
  Thermometer,
} from 'lucide-react'
import gsap from 'gsap'
import {
  displayDate,
  useHouseholdBackend,
  type PantryCategory,
  type StorageType,
} from './householdBackend'
import { useAuth } from '../../src/context/useAuth'

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
    value: 'avocado',
    label: 'Avocado',
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
  {
    value: 'chicken',
    label: 'Chicken',
    category: 'Proteins',
    shelfLife: { Fridge: 2, Counter: 1, Basket: 1 },
  },
  {
    value: 'beef',
    label: 'Beef',
    category: 'Proteins',
    shelfLife: { Fridge: 3, Counter: 1, Basket: 1 },
  },
  {
    value: 'fish',
    label: 'Fish',
    category: 'Proteins',
    shelfLife: { Fridge: 1, Counter: 1, Basket: 1 },
  },
  {
    value: 'meat',
    label: 'Meat',
    category: 'Proteins',
    shelfLife: { Fridge: 2, Counter: 1, Basket: 1 },
  },
]

const categoryOptions: Array<PantryCategory | 'All'> = [
  'All',
  'Vegetables',
  'Fruits',
  'Proteins',
]

const categoryShelfLife: Record<PantryCategory, Record<StorageType, number>> = {
  Vegetables: { Fridge: 6, Counter: 2, Basket: 1 },
  Fruits: { Fridge: 6, Counter: 4, Basket: 2 },
  Grains: { Fridge: 30, Counter: 120, Basket: 90 },
  Dairy: { Fridge: 4, Counter: 1, Basket: 1 },
  Proteins: { Fridge: 3, Counter: 1, Basket: 1 },
  Other: { Fridge: 14, Counter: 14, Basket: 7 },
}

function addDays(dateOnly: string, days: number) {
  const date = new Date(`${dateOnly}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  date.setDate(date.getDate() + days)
  return toDateInputValue(date)
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function daysUntil(dateOnly: string) {
  const expiry = new Date(`${dateOnly}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000)
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
const proteinKeywords = ['chicken', 'beef', 'meat', 'fish', 'pork', 'lamb']
const fruitKeywords = ['mango', 'banana', 'apple', 'orange', 'avocado']

function includesAny(value: string, words: string[]) {
  const normalized = value.toLowerCase()
  return words.some((word) => normalized.includes(word))
}

function validateFreshnessInput(name: string) {
  if (includesAny(name, cookedFoodKeywords)) {
    return 'Cooked food is outside the current freshness estimator scope.'
  }
  if (includesAny(name, processedFoodKeywords)) {
    return 'Processed goods should be added from the Pantry tab with a manual expiry date.'
  }
  return null
}

function inferCustomCategory(name: string, selectedCategory: PantryCategory | 'All') {
  if (selectedCategory !== 'All') return selectedCategory
  if (includesAny(name, proteinKeywords)) return 'Proteins'
  if (includesAny(name, fruitKeywords)) return 'Fruits'
  return 'Vegetables'
}

interface WeatherContext {
  temperature: number
  humidity: number
  summary: string
}

function climateAdjustmentDays(
  weather: WeatherContext | null,
  storageType: StorageType,
  category: PantryCategory,
) {
  if (!weather || storageType === 'Fridge') return 0

  let adjustment = 0
  if (weather.temperature >= 30) adjustment -= 2
  else if (weather.temperature >= 26) adjustment -= 1
  else if (weather.temperature <= 20 && weather.humidity < 65) adjustment += 1

  if (
    weather.humidity >= 75 &&
    (category === 'Vegetables' || category === 'Fruits')
  ) {
    adjustment -= 1
  }

  return adjustment
}

export function FreshnessTab() {
  const { userData } = useAuth()
  const { addPantryItem } = useHouseholdBackend()
  const [produce, setProduce] = useState('')
  const [produceSearch, setProduceSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<
    PantryCategory | 'All'
  >('All')
  const [customProduceName, setCustomProduceName] = useState('')
  const [storage, setStorage] = useState<StorageType>('Counter')
  const [quantity, setQuantity] = useState('1 item')
  const [purchaseDate, setPurchaseDate] = useState(
    toDateInputValue(new Date()),
  )
  const [submitted, setSubmitted] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [weather, setWeather] = useState<WeatherContext | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const resultRef = useRef<HTMLElement>(null)

  const filteredProduceOptions = useMemo(
    () =>
      produceOptions.filter((option) => {
        const matchesSearch = option.label
          .toLowerCase()
          .includes(produceSearch.toLowerCase())
        const matchesCategory =
          categoryFilter === 'All' || option.category === categoryFilter
        return matchesSearch && matchesCategory
      }),
    [categoryFilter, produceSearch],
  )

  const selectedKnownProduce =
    produceOptions.find((option) => option.value === produce) ??
    filteredProduceOptions.find((option) => option.value === produce) ??
    (produceSearch.trim() && filteredProduceOptions.length === 1
      ? filteredProduceOptions[0]
      : undefined)
  const customCategory = inferCustomCategory(
    customProduceName.trim(),
    categoryFilter,
  )
  const selectedProduce = customProduceName.trim()
    ? {
        value: 'custom',
        label: customProduceName.trim(),
        category: customCategory,
        shelfLife: categoryShelfLife[customCategory],
      }
    : selectedKnownProduce
  const baseEstimatedDays = selectedProduce?.shelfLife[storage] ?? 0
  const weatherAdjustment = selectedProduce
    ? climateAdjustmentDays(weather, storage, selectedProduce.category)
    : 0
  const estimatedDays = selectedProduce
    ? Math.max(1, baseEstimatedDays + weatherAdjustment)
    : 0
  const expiryDate = selectedProduce ? addDays(purchaseDate, estimatedDays) : ''
  const remainingDays = selectedProduce ? daysUntil(expiryDate) : 0
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

  useEffect(() => {
    const lat = typeof userData?.lat === 'number' ? userData.lat : null
    const lng = typeof userData?.lng === 'number' ? userData.lng : null

    if (lat === null || lng === null) {
      setWeather(null)
      setWeatherError('Save a household pickup pin in Profile for local climate adjustment.')
      return
    }

    let cancelled = false
    setWeatherLoading(true)
    setWeatherError(null)

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m&timezone=auto`,
    )
      .then((response) => {
        if (!response.ok) throw new Error('Weather request failed.')
        return response.json() as Promise<{
          current?: {
            temperature_2m?: number
            relative_humidity_2m?: number
          }
        }>
      })
      .then((data) => {
        if (cancelled) return
        const temperature = Number(data.current?.temperature_2m)
        const humidity = Number(data.current?.relative_humidity_2m)
        if (!Number.isFinite(temperature) || !Number.isFinite(humidity)) {
          throw new Error('Weather data was incomplete.')
        }
        setWeather({
          temperature,
          humidity,
          summary: `${Math.round(temperature)} deg C, ${Math.round(humidity)}% humidity`,
        })
      })
      .catch(() => {
        if (!cancelled) {
          setWeather(null)
          setWeatherError('Local weather is unavailable, so the standard shelf-life estimate is shown.')
        }
      })
      .finally(() => {
        if (!cancelled) setWeatherLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userData?.lat, userData?.lng])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedProduce) {
      setErrorMessage('Choose a food from the list or type its name before estimating.')
      setSubmitted(false)
      return
    }
    const validationMessage = validateFreshnessInput(selectedProduce.label)
    if (validationMessage) {
      setErrorMessage(validationMessage)
      setSubmitted(false)
      return
    }
    setErrorMessage(null)
    setSubmitted(true)
  }

  useEffect(() => {
    if (!submitted || !resultRef.current) return
    gsap.fromTo(
      resultRef.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
    )
  }, [submitted, selectedProduce?.label, storage, purchaseDate])

  const handleSaveToPantry = async () => {
    if (!selectedProduce) {
      setErrorMessage('Choose a food from the list or type its name before adding it to pantry.')
      setSubmitted(false)
      return
    }
    const validationMessage = validateFreshnessInput(selectedProduce.label)
    if (validationMessage) {
      setErrorMessage(validationMessage)
      setSubmitted(false)
      return
    }
    try {
      await addPantryItem({
        name: selectedProduce.label,
        category: selectedProduce.category,
        quantity,
        storageType: storage,
        purchaseDate,
        expiryDate,
        itemKind: 'fresh',
      })
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not add this item to pantry.',
      )
      return
    }
    showNotice(`${selectedProduce.label} added to pantry.`)
    setSubmitted(false)
    setErrorMessage(null)
    setCustomProduceName('')
    setProduceSearch('')
    setProduce('')
    setQuantity('1 item')
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
            Choose a fresh food, tell us where it is stored, then add the
            estimate to your pantry.
          </p>
        </div>
      </div>
      {notice && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 h-fit space-y-5"
        >
          <label className="block">
            <span className="text-sm font-bold text-gray-700">
              Find a fresh food
            </span>
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-wastewise-green focus-within:ring-2 focus-within:ring-wastewise-green/20">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                value={produceSearch}
                onChange={(event) => {
                  setProduceSearch(event.target.value)
                  setProduce('')
                }}
                className="w-full text-sm outline-none"
                placeholder="Search tomatoes, mangoes, chicken..."
              />
            </div>
            <p className="mt-2 text-xs font-medium text-gray-500">
              Search and select a result, or use a custom fresh food name.
            </p>
            {produceSearch.trim() && (
              <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-2">
                {filteredProduceOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {filteredProduceOptions.slice(0, 6).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setProduce(option.value)
                          setProduceSearch(option.label)
                          setCustomProduceName('')
                        }}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
                          produce === option.value
                            ? 'bg-green-50 text-wastewise-green ring-green-200'
                            : 'bg-white text-gray-600 ring-gray-200 hover:bg-green-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomProduceName(produceSearch.trim())
                      setProduce('')
                    }}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-600 ring-1 ring-gray-200 hover:bg-green-50"
                  >
                    Use "{produceSearch.trim()}" as custom fresh food
                  </button>
                )}
              </div>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-bold text-gray-700">
              Food group
            </span>
            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value as PantryCategory | 'All')
                setProduce('')
              }}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold focus:border-wastewise-green focus:outline-none focus:ring-2 focus:ring-wastewise-green/20"
            >
              {categoryOptions.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-gray-700">
              Common foods
            </span>
            <select
              value={produce}
              onChange={(event) => {
                setProduce(event.target.value)
                setCustomProduceName('')
              }}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold focus:border-wastewise-green focus:outline-none focus:ring-2 focus:ring-wastewise-green/20"
            >
              <option value="">Select a food</option>
              {filteredProduceOptions.length > 0 ? (
                filteredProduceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No matching produce
                </option>
              )}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-gray-700">
              Custom food name
            </span>
            <input
              value={customProduceName}
              onChange={(event) => {
                setCustomProduceName(event.target.value)
                setProduce('')
              }}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-wastewise-green focus:outline-none focus:ring-2 focus:ring-wastewise-green/20"
              placeholder="Example: managu, beef, fish"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-gray-700">
              Pantry quantity
            </span>
            <input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-wastewise-green focus:outline-none focus:ring-2 focus:ring-wastewise-green/20"
              placeholder="Example: 2 kg, 1 bunch, 3 packets"
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
          {errorMessage && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}
        </form>

        <section
          ref={resultRef}
          className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6"
        >
          {submitted && selectedProduce && (
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
                  {weatherAdjustment !== 0 && (
                    <p className="mt-1 text-xs font-bold text-gray-500">
                      Base {baseEstimatedDays} days, climate{' '}
                      {weatherAdjustment > 0 ? '+' : ''}
                      {weatherAdjustment}
                    </p>
                  )}
                </div>
                <div className="rounded-lg bg-gray-50 px-4 py-4">
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Estimated expiry date
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
                          ? 'Add this to pantry so alerts can help you use it in time.'
                        : 'Add this to the pantry so alerts can track it automatically.'}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-gray-500">
                      {weatherLoading
                        ? 'Checking local climate...'
                        : weather
                          ? `Adjusted using local conditions: ${weather.summary}.`
                          : weatherError}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSaveToPantry}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-wastewise-green px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800"
                >
                  <Check className="w-4 h-4" />
                  Add to pantry
                </button>
              </div>
            </>
          )}
          {!submitted && (
            <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 text-center">
              <div className="max-w-sm">
                <Sparkles className="mx-auto h-8 w-8 text-wastewise-green/50" />
                <p className="mt-3 text-base font-extrabold text-gray-800">
                  No estimate yet
                </p>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  Choose a fresh food or type one in, enter the quantity and
                  storage method, then press Estimate freshness.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

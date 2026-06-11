import React, { useState, useRef } from 'react'
import { Leaf, Calendar } from 'lucide-react'
import gsap from 'gsap'
const produceOptions = [
  {
    value: 'sukuma',
    label: 'Sukuma Wiki',
    icon: '🥬',
  },
  {
    value: 'tomatoes',
    label: 'Tomatoes',
    icon: '🍅',
  },
  {
    value: 'onions',
    label: 'Onions',
    icon: '🧅',
  },
  {
    value: 'managu',
    label: 'Managu',
    icon: '🌿',
  },
  {
    value: 'avocado',
    label: 'Avocado',
    icon: '🥑',
  },
  {
    value: 'bananas',
    label: 'Bananas',
    icon: '🍌',
  },
  {
    value: 'cabbage',
    label: 'Cabbage',
    icon: '🥬',
  },
  {
    value: 'carrots',
    label: 'Carrots',
    icon: '🥕',
  },
  {
    value: 'spinach',
    label: 'Spinach (Mchicha)',
    icon: '🍃',
  },
]
export function FreshnessTab() {
  const [produce, setProduce] = useState('sukuma')
  const [storage, setStorage] = useState('Counter')
  const [date, setDate] = useState('2026-06-06') // 2 days ago mock
  const [showResult, setShowResult] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowResult(false)
    // Small delay to allow re-triggering animation if already shown
    setTimeout(() => {
      setShowResult(true)
      if (resultRef.current) {
        gsap.fromTo(
          resultRef.current,
          {
            y: -20,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'power3.out',
          },
        )
      }
    }, 50)
  }
  // Simple deterministic mock logic
  const getResult = () => {
    if (storage === 'Fridge' && produce === 'sukuma')
      return {
        status: 'Fresh',
        days: 4,
        rec: 'Consume within 4 days',
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
      }
    if (storage === 'Counter' && produce === 'sukuma')
      return {
        status: 'Mid-Fresh',
        days: 1,
        rec: 'Consume soon or freeze',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
      }
    if (storage === 'Basket')
      return {
        status: 'Spoiled',
        days: 0,
        rec: 'Dispose responsibly',
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
      }
    return {
      status: 'Fresh',
      days: 5,
      rec: 'Store properly',
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
    }
  }
  const result = getResult()
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Check Freshness
        </h1>
        <p className="text-gray-500 mt-2">
          For open-air market produce without an expiry date
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Produce Type
            </label>
            <div className="relative">
              <select
                value={produce}
                onChange={(e) => setProduce(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green font-medium"
              >
                {produceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg
                  className="h-4 w-4 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Storage Method
            </label>
            <div className="flex p-1 bg-gray-100 rounded-xl">
              {['Fridge', 'Counter', 'Basket'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setStorage(method)}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${storage === method ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Purchase Date
            </label>
            <div className="relative">
              <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-wastewise-green text-white rounded-xl font-bold text-lg hover:bg-green-800 transition-colors shadow-sm mt-4"
          >
            Check Freshness
          </button>
        </form>
      </div>

      {/* Result Card */}
      <div
        ref={resultRef}
        className={`rounded-2xl border p-6 text-center shadow-sm ${result.bg} ${result.border}`}
        style={{
          display: showResult ? 'block' : 'none',
          opacity: 0,
        }}
      >
        <div
          className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-sm font-bold text-sm mb-4 ${result.color}`}
        >
          {result.status}
        </div>

        <h2 className={`text-4xl font-extrabold mb-2 ${result.color}`}>
          {result.days > 0 ? `${result.days} days remaining` : 'Spoiled'}
        </h2>

        <p className="text-gray-700 font-medium mb-6">{result.rec}</p>

        <div className="flex justify-center gap-3">
          {result.days > 0 ? (
            <>
              <button className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                Mark as Consumed
              </button>
              <button className="px-6 py-2.5 bg-wastewise-orange text-white font-bold rounded-lg hover:bg-orange-600 transition-colors shadow-sm">
                Donate
              </button>
            </>
          ) : (
            <button className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm">
              Flag for Disposal
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

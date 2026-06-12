import { Scale } from 'lucide-react'
import { mockSchedule } from './mockRecyclingData'
export function ScheduleTab() {
  const weekTotal = mockSchedule
    .reduce(
      (sum, day) => sum + day.collections.reduce((s, c) => s + c.weightKg, 0),
      0,
    )
    .toFixed(1)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Schedule
          </h1>
          <p className="text-gray-500 mt-1">
            Upcoming confirmed collections — week of 15 Jun 2026
          </p>
        </div>
        <div className="bg-wastewise-green text-white rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm">
          <Scale className="w-5 h-5" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-green-100">
              Week Total
            </p>
            <p className="text-xl font-extrabold">{weekTotal} kg</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {mockSchedule.map((day) => {
          const dayTotal = day.collections.reduce((s, c) => s + c.weightKg, 0)
          return (
            <div
              key={day.date}
              className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[200px]"
            >
              <div className="p-3 border-b border-gray-100 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  {day.day}
                </p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {day.date}
                </p>
              </div>
              <div className="flex-1 p-3 space-y-2">
                {day.collections.length === 0 ? (
                  <p className="text-xs text-gray-300 text-center mt-4">
                    No pickups
                  </p>
                ) : (
                  day.collections.map((c, idx) => (
                    <div
                      key={idx}
                      className="bg-green-50 border border-green-100 rounded-lg p-2"
                    >
                      <p className="text-xs font-bold text-wastewise-green truncate">
                        {c.estate}
                      </p>
                      <p className="text-[11px] text-green-700 font-medium">
                        {c.weightKg} kg
                      </p>
                    </div>
                  ))
                )}
              </div>
              {dayTotal > 0 && (
                <div className="p-2 border-t border-gray-100 text-center">
                  <p className="text-xs font-bold text-gray-700">
                    {dayTotal.toFixed(1)} kg
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

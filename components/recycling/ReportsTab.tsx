import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Download, Scale, Users } from 'lucide-react'
import {
  weeklyVolumeData,
  wasteCategoryData,
  reportMetrics,
} from './mockRecyclingData'
export function ReportsTab() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Reports
          </h1>
          <p className="text-gray-500 mt-1">Recycling performance overview</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-wastewise-green text-white rounded-lg font-bold hover:bg-green-800 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Download Report
        </button>
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-wastewise-green text-white rounded-2xl p-6 shadow-sm md:col-span-1">
          <div className="flex items-center gap-2 text-green-100 mb-2">
            <Scale className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wide">
              Processed This Month
            </span>
          </div>
          <p className="text-5xl font-extrabold">
            {reportMetrics.totalProcessedThisMonth}
            <span className="text-2xl text-green-200 ml-1">kg</span>
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wide">
              Households Served
            </span>
          </div>
          <p className="text-5xl font-extrabold text-gray-900">
            {reportMetrics.householdsServed}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-2">
            Waste Categories
          </h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={wasteCategoryData}
                dataKey="value"
                nameKey="name"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={2}
              >
                {wasteCategoryData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">
          Kg Collected per Week
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={weeklyVolumeData}
            margin={{
              top: 0,
              right: 0,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="week"
              tick={{
                fontSize: 12,
                fill: '#6B7280',
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{
                fontSize: 12,
                fill: '#6B7280',
              }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{
                fill: '#f9fafb',
              }}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
              }}
            />
            <Bar
              dataKey="kg"
              fill="#1B5E20"
              radius={[8, 8, 0, 0]}
              maxBarSize={64}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

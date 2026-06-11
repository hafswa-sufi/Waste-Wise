import React from 'react'
import { ChevronDown, Eye, Check, MapPin } from 'lucide-react'
import { mockCollectionJobs, JobStatus } from './mockRecyclingData'
const statusStyles: Record<JobStatus, string> = {
  Confirmed: 'bg-blue-100 text-blue-700',
  'En Route': 'bg-orange-100 text-wastewise-orange',
  Collected: 'bg-green-100 text-green-700',
  Processed: 'bg-gray-200 text-gray-700',
}
export function MyCollectionsTab() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          My Collections
        </h1>
        <p className="text-gray-500 mt-1">All accepted disposal jobs</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
          Status <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
          Date Range <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-4">
        {mockCollectionJobs.map((job) => {
          const canCollect =
            job.status === 'Confirmed' || job.status === 'En Route'
          return (
            <div
              key={job.id}
              className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center gap-4"
            >
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {job.estate}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                  <MapPin className="w-4 h-4" /> {job.neighborhood}, Nairobi
                </div>
              </div>
              <div className="flex-1 text-sm">
                <p className="text-gray-400 font-bold uppercase text-xs tracking-wide">
                  Scheduled
                </p>
                <p className="text-gray-900 font-medium">{job.scheduledDate}</p>
              </div>
              <div className="flex-1 text-sm">
                <p className="text-gray-400 font-bold uppercase text-xs tracking-wide">
                  Est. Weight
                </p>
                <p className="text-gray-900 font-bold">{job.weightKg} kg</p>
              </div>
              <div className="shrink-0">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusStyles[job.status]}`}
                >
                  {job.status}
                </span>
              </div>
              <div className="shrink-0">
                {canCollect ? (
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-wastewise-green text-white rounded-lg font-bold text-sm hover:bg-green-800 transition-colors">
                    <Check className="w-4 h-4" /> Mark Collected
                  </button>
                ) : (
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors">
                    <Eye className="w-4 h-4" /> View Details
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

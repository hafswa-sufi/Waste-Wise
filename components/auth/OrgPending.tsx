import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CheckCircleIcon = CheckCircle2 as unknown as React.ComponentType<
  React.SVGProps<SVGSVGElement>
>

export function OrgPending() {
  const navigate = useNavigate()
  return (
    <div className="w-full max-w-md mx-auto px-4 py-20 text-center">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
        <CheckCircleIcon className="w-12 h-12 text-wastewise-green" />
      </div>

      <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
        Application Submitted
      </h2>

      <p className="text-gray-600 text-lg mb-8 leading-relaxed">
        Thank you for registering with WasteWise. Your application is currently
        under review by our team.
      </p>

      <div className="bg-gray-50 rounded-xl p-6 mb-10 border border-gray-100">
        <p className="text-sm text-gray-700 font-medium">
          Estimated review time:
          <br />
          <span className="text-lg font-bold text-gray-900 mt-1 block">
            Within 48 hours
          </span>
        </p>
      </div>

      <button
        onClick={() => navigate('/')}
        className="w-full py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        Return to Home
      </button>
    </div>
  )
}

import React from 'react'
import { Home, HandHeart, Recycle } from 'lucide-react'

const HomeIcon = Home as unknown as React.ComponentType<
  React.SVGProps<SVGSVGElement>
>
const HandHeartIcon = HandHeart as unknown as React.ComponentType<
  React.SVGProps<SVGSVGElement>
>
const RecycleIcon = Recycle as unknown as React.ComponentType<
  React.SVGProps<SVGSVGElement>
>

interface RoleSelectProps {
  onSelect: (role: 'household' | 'ngo' | 'recycling') => void
  onLoginClick: () => void
}
export function RoleSelect({ onSelect, onLoginClick }: RoleSelectProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          Join WasteWise
        </h1>
        <p className="text-xl text-gray-600">Track it. Save it. Share it.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Household */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 flex flex-col items-center text-center hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="w-16 h-16 bg-green-50 text-wastewise-green rounded-full flex items-center justify-center mb-6">
            <HomeIcon className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Household</h3>
          <p className="text-gray-600 mb-8 flex-1">
            Track your pantry, get expiry alerts, and reduce food waste at home.
          </p>
          <button
            onClick={() => onSelect('household')}
            className="w-full py-3.5 px-6 bg-wastewise-green text-white rounded-xl font-bold hover:bg-green-800 transition-colors"
          >
            Sign Up
          </button>
        </div>

        {/* NGO */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 flex flex-col items-center text-center hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="w-16 h-16 bg-orange-50 text-wastewise-orange rounded-full flex items-center justify-center mb-6">
            <HandHeartIcon className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            NGO Representative
          </h3>
          <p className="text-gray-600 mb-8 flex-1">
            Receive surplus food donations from households in your area.
          </p>
          <button
            onClick={() => onSelect('ngo')}
            className="w-full py-3.5 px-6 bg-wastewise-green text-white rounded-xl font-bold hover:bg-green-800 transition-colors"
          >
            Sign Up
          </button>
        </div>

        {/* Recycling */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 flex flex-col items-center text-center hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
            <RecycleIcon className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Recycling Company
          </h3>
          <p className="text-gray-600 mb-8 flex-1">
            Coordinate organic waste pickups from estates and apartments.
          </p>
          <button
            onClick={() => onSelect('recycling')}
            className="w-full py-3.5 px-6 bg-wastewise-green text-white rounded-xl font-bold hover:bg-green-800 transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>

      <div className="text-center">
        <p className="text-gray-600 font-medium">
          Already have an account?{' '}
          <button
            onClick={onLoginClick}
            className="text-wastewise-green font-bold hover:underline"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  )
}

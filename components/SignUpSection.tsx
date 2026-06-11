import React from 'react'
import { Home, HandHeart, Recycle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
export function SignUpSection() {
  const navigate = useNavigate()
  return (
    <section id="sign-up" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Join the movement. Choose your path.
          </h2>
          <p className="text-xl text-gray-600">
            Start reducing food waste today. Select how you want to use
            WasteWise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Household */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-green-50 text-wastewise-green rounded-full flex items-center justify-center mb-6">
              <Home className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Household</h3>
            <p className="text-gray-600 mb-8 flex-1">
              Track your pantry, get expiry alerts, and connect with local NGOs
              for surplus food.
            </p>
            <button
              onClick={() =>
                navigate('/auth', {
                  state: {
                    authState: 'household-signup',
                  },
                })
              }
              className="w-full py-3.5 px-6 bg-wastewise-green text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-green-800 transition-colors group"
            >
              Sign Up as Household
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* NGO */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 flex flex-col items-center text-center hover:shadow-lg transition-shadow relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-wastewise-orange"></div>
            <div className="w-16 h-16 bg-orange-50 text-wastewise-orange rounded-full flex items-center justify-center mb-6">
              <HandHeart className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">NGO</h3>
            <p className="text-gray-600 mb-8 flex-1">
              Receive notifications for surplus food donations and coordinate
              pickups efficiently.
            </p>
            <button
              onClick={() =>
                navigate('/auth', {
                  state: {
                    authState: 'org-signup-step1',
                    orgType: 'NGO',
                  },
                })
              }
              className="w-full py-3.5 px-6 bg-wastewise-orange text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors group"
            >
              Sign Up as NGO
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Recycling */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-gray-50 text-gray-700 rounded-full flex items-center justify-center mb-6">
              <Recycle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Recycling Co.
            </h3>
            <p className="text-gray-600 mb-8 flex-1">
              Manage bulk organic waste collection requests from estates and
              apartments.
            </p>
            <button
              onClick={() =>
                navigate('/auth', {
                  state: {
                    authState: 'org-signup-step1',
                    orgType: 'Recycling Company',
                  },
                })
              }
              className="w-full py-3.5 px-6 bg-transparent border-2 border-wastewise-green text-wastewise-green rounded-full font-bold flex items-center justify-center gap-2 hover:bg-green-50 transition-colors group"
            >
              Sign Up as Partner
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

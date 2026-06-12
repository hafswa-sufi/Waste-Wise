import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
interface LoginProps {
  onSignupClick: () => void
}
export function Login({ onSignupClick }: LoginProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [accountType, setAccountType] = useState<'household' | 'ngo'>(
    'household',
  )
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (accountType === 'ngo') {
      navigate('/auth', {
        state: {
          authState: 'org-pending',
          orgType: 'NGO',
        },
      })
    } else {
      navigate('/household')
    }
  }
  return (
    <div className="w-full max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Welcome Back
        </h2>
        <p className="text-gray-500 mt-2">Log in to your WasteWise account.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Account Type
            </label>
            <select
              value={accountType}
              onChange={(e) =>
                setAccountType(e.target.value as 'household' | 'ngo')
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
            >
              <option value="household">Household</option>
              <option value="ngo">NGO</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-bold text-gray-700">
                Password
              </label>
              <button
                type="button"
                className="text-sm font-bold text-wastewise-green hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-wastewise-green text-white rounded-xl font-bold text-lg hover:bg-green-800 transition-colors shadow-sm mt-2"
          >
            Log In
          </button>
        </form>
      </div>

      <div className="text-center mt-8">
        <p className="text-gray-600 font-medium">
          New to WasteWise?{' '}
          <button
            onClick={onSignupClick}
            className="text-wastewise-green font-bold hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}

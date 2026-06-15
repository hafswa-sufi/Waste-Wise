import { useState } from 'react'
import { signInWithGoogle, signUp } from '../../src/service/authService'
import { useNavigate } from 'react-router-dom'

interface HouseholdSignupProps {
  onLoginClick: () => void
}

export function HouseholdSignup({ onLoginClick }: HouseholdSignupProps) {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      await signUp(fullName, email, password, 'Household')
      navigate('/household')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError(null)
    setIsLoading(true)
    try {
      await signInWithGoogle('Household')
      navigate('/household')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Google sign up failed. Try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="w-full max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Create Household Account
        </h2>
        <p className="text-gray-500 mt-2">Start tracking and saving today.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
              placeholder="e.g. Jane Doe"
            />
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
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
              placeholder="jane@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Confirm
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              County / Location
            </label>
            <select
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all appearance-none"
            >
              <option value="">Select your county</option>
              <option value="Nairobi">Nairobi</option>
              <option value="Mombasa">Mombasa</option>
              <option value="Kisumu">Kisumu</option>
              <option value="Nakuru">Nakuru</option>
              <option value="Uasin Gishu">Uasin Gishu</option>
            </select>
          </div>

          {/* <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Primary Storage Conditions
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Fridge', 'Counter', 'Basket'].map((opt) => (
                <label
                  key={opt}
                  className="flex items-center justify-center px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-checked:bg-green-50 has-checked:border-wastewise-green has-checked:text-wastewise-green font-medium text-sm text-gray-600"
                >
                  <input
                    type="radio"
                    name="storage"
                    value={opt}
                    className="sr-only"
                    required
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div> */}

          {error && (
            <p className="text-sm text-red-600 font-medium" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full py-3.5 bg-white border border-gray-300 text-gray-800 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            Create Account with Google
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-wastewise-green text-white rounded-xl font-bold text-lg hover:bg-green-800 transition-colors shadow-sm mt-2"
          >
            {isLoading ? 'Please wait...' : 'Create Account'}
          </button>
        </form>
      </div>

      <div className="text-center mt-8">
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

import { useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle, signUp } from '../../src/service/authService'
import { authErrorMessage } from './authErrors'

interface HouseholdSignupProps {
  onLoginClick: () => void
}

export function HouseholdSignup({ onLoginClick }: HouseholdSignupProps) {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const validate = () => {
    if (!fullName.trim()) return 'Full name is required.'
    if (!email.trim()) return 'Email address is required.'
    if (!password) return 'Password is required.'
    if (password.length < 6) return 'Password should be at least 6 characters.'
    if (!confirmPassword) return 'Please confirm your password.'
    if (password !== confirmPassword) return 'Passwords do not match.'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    try {
      await signUp(fullName, email, password, 'Household')
      navigate('/household')
    } catch (err) {
      setError(authErrorMessage(err, 'Failed to create account. Try again.'))
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
      setError(authErrorMessage(err, 'Google sign up failed. Try again.'))
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
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
              placeholder="jane@example.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Password
              </label>
              <PasswordField
                value={password}
                show={showPassword}
                onChange={setPassword}
                onToggle={() => setShowPassword((value) => !value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Confirm
              </label>
              <PasswordField
                value={confirmPassword}
                show={showConfirmPassword}
                onChange={setConfirmPassword}
                onToggle={() => setShowConfirmPassword((value) => !value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              County / Location
            </label>
            <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all appearance-none">
              <option value="">Select your county</option>
              <option value="Nairobi">Nairobi</option>
              <option value="Mombasa">Mombasa</option>
              <option value="Kisumu">Kisumu</option>
              <option value="Nakuru">Nakuru</option>
              <option value="Uasin Gishu">Uasin Gishu</option>
            </select>
          </div>

          <div>
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
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 font-medium" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full py-3.5 bg-white border border-gray-300 text-gray-800 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60"
          >
            Create Account with Google
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-wastewise-green text-white rounded-xl font-bold text-lg hover:bg-green-800 transition-colors shadow-sm mt-2 disabled:opacity-60"
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

function PasswordField({
  value,
  show,
  onChange,
  onToggle,
}: {
  value: string
  show: boolean
  onChange: (value: string) => void
  onToggle: () => void
}) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 pr-11 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
        placeholder="Password"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  )
}

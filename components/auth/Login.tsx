import { useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  login,
  sendResetPasswordEmail,
  signInWithGoogle,
} from '../../src/service/authService'
import { authErrorMessage } from './authErrors'

interface LoginProps {
  onSignupClick: () => void
}

export function Login({ onSignupClick }: LoginProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accountType, setAccountType] = useState<
    'household' | 'ngo' | 'recycling' | 'admin'
  >('household')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const selectedRole =
    accountType === 'household'
      ? 'Household'
      : accountType === 'ngo'
        ? 'NGO'
        : accountType === 'recycling'
          ? 'RecyclingFirm'
          : 'Admin'

  const navigateByRole = (role: string) => {
    if (role === 'Admin') {
      navigate('/admin')
      return
    }
    if (role === 'NGO') {
      navigate('/dashboard')
      return
    }
    if (role === 'RecyclingFirm') {
      navigate('/recycling')
      return
    }
    navigate('/household')
  }

  const handlePending = () => {
    navigate('/auth', {
      state: {
        authState: 'org-pending',
        orgType: accountType === 'recycling' ? 'Recycling Company' : 'NGO',
      },
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!email.trim()) {
      setError('Email address is required.')
      return
    }
    if (!password) {
      setError('Password is required.')
      return
    }

    setIsLoading(true)

    try {
      const { userData } = await login(email, password)
      navigateByRole(userData.role)
    } catch (err) {
      const message = authErrorMessage(err, 'Login failed. Try again.')
      if (message === 'Your account is still pending approval.') {
        handlePending()
        return
      }
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setMessage(null)

    if (accountType === 'admin') {
      setError('Admin accounts must use email and password login.')
      return
    }

    setIsLoading(true)

    try {
      const { userData } = await signInWithGoogle(selectedRole)
      navigateByRole(userData.role)
    } catch (err) {
      const message = authErrorMessage(err, 'Google sign-in failed. Try again.')
      if (message === 'Your account is still pending approval.') {
        handlePending()
        return
      }
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    setError(null)
    setMessage(null)
    if (!email.trim()) {
      setError('Enter your email address first, then request a reset link.')
      return
    }

    setIsLoading(true)
    try {
      await sendResetPasswordEmail(email.trim())
      setMessage('Password reset email sent. Check your inbox.')
    } catch (err) {
      setError(authErrorMessage(err, 'Could not send reset email. Try again.'))
    } finally {
      setIsLoading(false)
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
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Account Type
            </label>
            <select
              value={accountType}
              onChange={(e) =>
                setAccountType(
                  e.target.value as
                    | 'household'
                    | 'ngo'
                    | 'recycling'
                    | 'admin',
                )
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
            >
              <option value="household">Household</option>
              <option value="ngo">NGO</option>
              <option value="recycling">Recycling Company</option>
              <option value="admin">Admin</option>
            </select>
            {accountType === 'admin' && (
              <p className="mt-2 text-xs font-semibold text-gray-500">
                Admin accounts are created in Firebase by project owners.
              </p>
            )}
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
                onClick={handlePasswordReset}
                className="text-sm font-bold text-wastewise-green hover:underline"
              >
                
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 font-medium" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-green-700 font-medium" role="status">
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading || accountType === 'admin'}
            className="w-full py-3.5 bg-white border border-gray-300 text-gray-800 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60"
          >
            {accountType === 'admin'
              ? 'Google unavailable for Admin'
              : 'Continue with Google'}
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-wastewise-green text-white rounded-xl font-bold text-lg hover:bg-green-800 transition-colors shadow-sm mt-2 disabled:opacity-60"
          >
            {isLoading ? 'Please wait...' : 'Log In'}
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

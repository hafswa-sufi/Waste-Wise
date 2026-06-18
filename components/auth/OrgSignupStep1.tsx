import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { authErrorMessage } from './authErrors'
export interface OrgSignupDraft {
  organizationName: string
  organizationType: 'NGO' | 'Recycling Company'
  registrationNumber: string
  operatingCounties: string
  contactName: string
  designation: string
  workEmail: string
  password: string
}
interface OrgSignupStep1Props {
  orgType: 'NGO' | 'Recycling Company'
  onNext: (draft: OrgSignupDraft) => void
  onLoginClick: () => void
  onGoogleSignup: (draft: Omit<OrgSignupDraft, 'password'>) => Promise<void>
}
export function OrgSignupStep1({
  orgType,
  onNext,
  onLoginClick,
  onGoogleSignup,
}: OrgSignupStep1Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget as HTMLFormElement
    if (!form.checkValidity()) {
      setError('Please fill in all required registration details.')
      return
    }
    const formData = new FormData(form)
    onNext({
      organizationName: String(formData.get('organizationName') || '').trim(),
      organizationType: String(formData.get('organizationType') || orgType) as
        | 'NGO'
        | 'Recycling Company',
      registrationNumber: String(formData.get('registrationNumber') || '').trim(),
      operatingCounties: String(formData.get('operatingCounties') || '').trim(),
      contactName: String(formData.get('contactName') || '').trim(),
      designation: String(formData.get('designation') || '').trim(),
      workEmail: String(formData.get('workEmail') || '').trim(),
      password: String(formData.get('password') || ''),
    })
  }

  const handleGoogleSignup = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setError(null)
    const form = event.currentTarget.form
    if (!form || !form.checkValidity()) {
      setError('Please fill in the organisation details before continuing with Google.')
      return
    }
    const formData = new FormData(form)
    setIsLoading(true)
    try {
      await onGoogleSignup({
        organizationName: String(formData.get('organizationName') || '').trim(),
        organizationType: String(formData.get('organizationType') || orgType) as
          | 'NGO'
          | 'Recycling Company',
        registrationNumber: String(formData.get('registrationNumber') || '').trim(),
        operatingCounties: String(formData.get('operatingCounties') || '').trim(),
        contactName: String(formData.get('contactName') || '').trim(),
        designation: String(formData.get('designation') || '').trim(),
        workEmail: String(formData.get('workEmail') || '').trim(),
      })
    } catch (err) {
      setError(authErrorMessage(err, 'Google sign up failed. Try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-wastewise-green"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Partner Registration
        </h2>
        <p className="text-gray-500 mt-2">Step 1 of 2: Organisation Details</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Organisation Name
              </label>
              <input
                name="organizationName"
                type="text"
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
                placeholder="e.g. Food Banking Kenya"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Organisation Type
              </label>
              <select
                name="organizationType"
                defaultValue={orgType}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all appearance-none"
              >
                <option value="NGO">NGO</option>
                <option value="Recycling Company">Recycling Company</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Official Registration Number
              </label>
              <input
                name="registrationNumber"
                type="text"
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
                placeholder="Registration No."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Operating Counties
              </label>
              <input
                name="operatingCounties"
                type="text"
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
                placeholder="e.g. Nairobi, Kiambu"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Contact Person
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input
                  name="contactName"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Designation
                </label>
                <input
                  name="designation"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
                  placeholder="e.g. Logistics Manager"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Work Email
                </label>
                <input
                  name="workEmail"
                  type="email"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
                  placeholder="jane@org.org"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full px-4 py-2.5 pr-11 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wastewise-green/20 focus:border-wastewise-green transition-all"
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
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 font-medium" role="alert">
              {error}
            </p>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="mr-3 px-6 py-3.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors"
            >
              Continue with Google
            </button>
            <button
              type="submit"
              className="px-8 py-3.5 bg-wastewise-green text-white rounded-xl font-bold text-lg hover:bg-green-800 transition-colors shadow-sm"
            >
              Next: Upload Documents
            </button>
          </div>
        </form>
      </div>

      <div className="text-center mt-8">
        <p className="text-gray-600 font-medium">
          Already registered?{' '}
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

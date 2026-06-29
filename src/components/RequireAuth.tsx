import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

interface RequireAuthProps {
  children: ReactNode
  allowedRoles?: string[]
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const { currentUser, userData, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-4 text-sm font-semibold text-gray-600 shadow-sm">
          Checking your session...
        </div>
      </div>
    )
  }

  if (!currentUser) {
    const loggedOutIntentionally =
      window.sessionStorage.getItem('wastewise.justLoggedOut') === 'true'

    if (loggedOutIntentionally) {
      window.sessionStorage.removeItem('wastewise.justLoggedOut')
      return (
        <Navigate
          to="/auth?mode=login"
          replace
          state={{ from: location.pathname, authState: 'login' }}
        />
      )
    }

    return (
      <Navigate
        to="/auth?mode=login&error=auth-required"
        replace
        state={{
          from: location.pathname,
          authState: 'login',
          authError: 'auth-required',
        }}
      />
    )
  }

  if (allowedRoles && !userData) {
    return (
      <Navigate
        to="/auth?mode=login&error=unauthorized"
        replace
        state={{
          from: location.pathname,
          authState: 'login',
          authError: 'unauthorized',
        }}
      />
    )
  }

  if (allowedRoles && userData?.role && !allowedRoles.includes(userData.role)) {
    return (
      <Navigate
        to="/auth?mode=login&error=unauthorized"
        replace
        state={{
          from: location.pathname,
          authState: 'login',
          authError: 'unauthorized',
        }}
      />
    )
  }

  if (
    allowedRoles &&
    userData &&
    (userData.role === 'NGO' || userData.role === 'RecyclingFirm') &&
    userData.approvalStatus !== 'approved'
  ) {
    return (
      <Navigate
        to="/auth?mode=login&error=unauthorized"
        replace
        state={{
          from: location.pathname,
          authState: 'login',
          authError: 'unauthorized',
        }}
      />
    )
  }

  return <>{children}</>
}


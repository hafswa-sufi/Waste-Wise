import { useState, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import gsap from 'gsap'
import { useScreenInit } from '../../useScreenInit'
import { RoleSelect } from '../auth/RoleSelect'
import { HouseholdSignup } from '../auth/HouseholdSignup'
import { OrgSignupStep1 } from '../auth/OrgSignupStep1'
import { OrgSignupStep2 } from '../auth/OrgSignupStep2'
import { OrgPending } from '../auth/OrgPending'
import { Login } from '../auth/Login'
export type AuthState =
  | 'role-select'
  | 'household-signup'
  | 'org-signup-step1'
  | 'org-signup-step2'
  | 'org-pending'
  | 'login'
export type OrgType = 'NGO' | 'Recycling Company'
export function Auth() {
  const location = useLocation()
  const screenInit = useScreenInit()
  const [authState, setAuthState] = useState<AuthState>(() => {
    if (screenInit?.authState) return screenInit.authState as AuthState
    if (location.state?.authState) return location.state.authState as AuthState
    return 'role-select'
  })
  const [orgType, setOrgType] = useState<OrgType>(() => {
    if (screenInit?.orgType) return screenInit.orgType as OrgType
    if (location.state?.orgType) return location.state.orgType as OrgType
    return 'NGO'
  })
  const containerRef = useRef<HTMLDivElement>(null)
  // GSAP transition helper
  const transitionTo = (newState: AuthState, newOrgType?: OrgType) => {
    if (newState === authState) return
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          setAuthState(newState)
          if (newOrgType) setOrgType(newOrgType)
          gsap.fromTo(
            containerRef.current,
            {
              opacity: 0,
              y: 10,
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.3,
              ease: 'power2.out',
            },
          )
        },
      })
    } else {
      setAuthState(newState)
      if (newOrgType) setOrgType(newOrgType)
    }
  }
  const renderContent = () => {
    switch (authState) {
      case 'role-select':
        return (
          <RoleSelect
            onSelect={(role) => {
              if (role === 'household') transitionTo('household-signup')
              else if (role === 'ngo') transitionTo('org-signup-step1', 'NGO')
              else if (role === 'recycling')
                transitionTo('org-signup-step1', 'Recycling Company')
            }}
            onLoginClick={() => transitionTo('login')}
          />
        )
      case 'household-signup':
        return <HouseholdSignup onLoginClick={() => transitionTo('login')} />
      case 'org-signup-step1':
        return (
          <OrgSignupStep1
            orgType={orgType}
            onNext={() => transitionTo('org-signup-step2')}
            onLoginClick={() => transitionTo('login')}
          />
        )
      case 'org-signup-step2':
        return (
          <OrgSignupStep2
            onSubmit={() => transitionTo('org-pending')}
            onBack={() => transitionTo('org-signup-step1')}
          />
        )
      case 'org-pending':
        return <OrgPending />
      case 'login':
        return <Login onSignupClick={() => transitionTo('role-select')} />
      default:
        return null
    }
  }
  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-wastewise-green selection:text-white flex flex-col">
      {/* Simple Header */}
      <header className="py-6 px-4 sm:px-6 lg:px-8 flex justify-center">
        <Link
          to="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Leaf className="w-8 h-8 text-wastewise-green" />
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            WasteWise
          </span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center pb-12">
        <div ref={containerRef} className="w-full">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

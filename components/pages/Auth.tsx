import { useState, useRef } from 'react'
import { useLocation, Link, useSearchParams } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import gsap from 'gsap'
import { signInWithGoogle, signUp } from '../../src/service/authService'
import { useScreenInit } from '../../useScreenInit'
import { RoleSelect } from '../auth/RoleSelect'
import { HouseholdSignup } from '../auth/HouseholdSignup'
import { OrgSignupStep1, type OrgSignupDraft } from '../auth/OrgSignupStep1'
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
  const [searchParams] = useSearchParams()
  const authError =
    typeof location.state?.authError === 'string'
      ? location.state.authError
      : null
  const screenInit = useScreenInit()
  const [authState, setAuthState] = useState<AuthState>(() => {
    if (screenInit?.authState) return screenInit.authState as AuthState
    if (location.state?.authState) return location.state.authState as AuthState
    if (searchParams.get('mode') === 'login') return 'login'
    return 'role-select'
  })
  const [orgType, setOrgType] = useState<OrgType>(() => {
    if (screenInit?.orgType) return screenInit.orgType as OrgType
    if (location.state?.orgType) return location.state.orgType as OrgType
    return 'NGO'
  })
  const [orgSignupDraft, setOrgSignupDraft] =
    useState<OrgSignupDraft | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const partnerRole = (type: OrgType) =>
    type === 'NGO' ? 'NGO' : 'RecyclingFirm'

  const handlePartnerGoogleSignup = async (
    draft: Omit<OrgSignupDraft, 'password'>,
  ) => {
    await signInWithGoogle(partnerRole(draft.organizationType), {
      organizationName: draft.organizationName,
      organizationType: draft.organizationType,
      registrationNumber: draft.registrationNumber,
      operatingCounties: draft.operatingCounties,
      contactName: draft.contactName,
      designation: draft.designation,
      verificationDocumentStatus: 'not_submitted',
    })
    transitionTo('org-pending')
  }

  const handlePartnerSubmit = async (certificateFile: File | null) => {
    if (!orgSignupDraft) {
      transitionTo('org-signup-step1')
      return
    }
    await signUp(
      orgSignupDraft.contactName,
      orgSignupDraft.workEmail,
      orgSignupDraft.password,
      partnerRole(orgSignupDraft.organizationType),
      {
        organizationName: orgSignupDraft.organizationName,
        organizationType: orgSignupDraft.organizationType,
        registrationNumber: orgSignupDraft.registrationNumber,
        operatingCounties: orgSignupDraft.operatingCounties,
        contactName: orgSignupDraft.contactName,
        designation: orgSignupDraft.designation,
        certificateFileName: certificateFile?.name,
        verificationDocumentStatus: certificateFile
          ? 'submitted'
          : 'not_submitted',
      },
      certificateFile,
    )
    transitionTo('org-pending')
  }

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
            onNext={(draft) => {
              setOrgSignupDraft(draft)
              transitionTo('org-signup-step2', draft.organizationType)
            }}
            onLoginClick={() => transitionTo('login')}
            onGoogleSignup={handlePartnerGoogleSignup}
          />
        )
      case 'org-signup-step2':
        return (
          <OrgSignupStep2
            onSubmit={handlePartnerSubmit}
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
          {authError === 'auth-required' && (
            <div className="mx-auto mb-4 max-w-md rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Please log in before opening that page.
            </div>
          )}
          {authError === 'unauthorized' && (
            <div className="mx-auto mb-4 max-w-md rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              That page is not available for this account type.
            </div>
          )}
          {renderContent()}
        </div>
      </main>
    </div>
  )
}


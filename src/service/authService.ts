// src/service/authService.ts
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { auth, db, googleProvider, storage } from '../firebase/firebase'

export type UserRole = 'Household' | 'Admin' | 'NGO' | 'RecyclingFirm'

export interface UserData {
  userId: string
  name: string
  email: string
  role: UserRole
  approvalStatus: 'approved' | 'pending' | 'rejected'
  location?: string
  organizationName?: string
  organizationType?: 'NGO' | 'Recycling Company'
  registrationNumber?: string
  operatingCounties?: string
  contactName?: string
  designation?: string
  certificateFileName?: string
  certificateFilePath?: string
  certificateFileUrl?: string
  verificationDocumentStatus?: 'not_submitted' | 'submitted'
  createdAt: unknown
}

export interface SignupProfileData {
  location?: string
  organizationName?: string
  organizationType?: 'NGO' | 'Recycling Company'
  registrationNumber?: string
  operatingCounties?: string
  contactName?: string
  designation?: string
  certificateFileName?: string
  certificateFilePath?: string
  certificateFileUrl?: string
  verificationDocumentStatus?: 'not_submitted' | 'submitted'
}

function cleanProfileData(data: SignupProfileData = {}) {
  return Object.fromEntries(
    Object.entries(data).filter(
      ([key, value]) =>
        key.toLowerCase() !== 'password' &&
        value !== undefined &&
        value !== '',
    ),
  )
}

function authActionSettings(path = '/auth?mode=login') {
  if (typeof window === 'undefined') return undefined

  return {
    url: `${window.location.origin}${path}`,
    handleCodeInApp: false,
  }
}

const requiresApproval = (role: UserRole) =>
  role === 'NGO' || role === 'RecyclingFirm'

const ensureApproved = async (user: User): Promise<UserData> => {
  const userDoc = await getDoc(doc(db, 'users', user.uid))
  if (!userDoc.exists()) {
    throw new Error('User not found')
  }

  const userData = userDoc.data() as UserData
  if (requiresApproval(userData.role) && userData.approvalStatus !== 'approved') {
    await signOut(auth)
    throw new Error('PENDING_APPROVAL')
  }

  return userData
}

// SIGN UP - Create new user account (works for all user types)
export const signUp = async (
  name: string,
  email: string,
  password: string,
  role: UserRole,
  profileData: SignupProfileData = {},
  certificateFile?: File | null,
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    let uploadedCertificate: SignupProfileData = {}

    if (certificateFile && requiresApproval(role)) {
      const safeName = certificateFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `partner-certificates/${user.uid}/${Date.now()}-${safeName}`
      const fileRef = ref(storage, filePath)
      await uploadBytes(fileRef, certificateFile, {
        contentType: certificateFile.type || 'application/octet-stream',
      })
      uploadedCertificate = {
        certificateFileName: certificateFile.name,
        certificateFilePath: filePath,
        certificateFileUrl: await getDownloadURL(fileRef),
        verificationDocumentStatus: 'submitted',
      }
    }

    await setDoc(doc(db, 'users', user.uid), {
      userId: user.uid,
      name,
      email,
      role,
      emailVerified: user.emailVerified,
      approvalStatus: requiresApproval(role) ? 'pending' : 'approved',
      ...cleanProfileData(profileData),
      ...uploadedCertificate,
      createdAt: serverTimestamp(),
    })

    await sendEmailVerification(user, authActionSettings())

    return user
  } catch (error) {
    console.error('Sign up error:', error)
    throw error
  }
}

// LOGIN - Sign in (checks approval status for NGO/RecyclingFirm)
export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    const userData = await ensureApproved(user)
    return { user, userData }
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

export const signInWithGoogle = async (
  roleForNewUser: UserRole,
  profileData: SignupProfileData = {},
) => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider)
    const user = userCredential.user
    const userRef = doc(db, 'users', user.uid)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        userId: user.uid,
        name: user.displayName ?? 'WasteWise User',
        email: user.email ?? '',
        role: roleForNewUser,
        emailVerified: user.emailVerified,
        approvalStatus: requiresApproval(roleForNewUser) ? 'pending' : 'approved',
        ...cleanProfileData(profileData),
        createdAt: serverTimestamp(),
      })
    }

    const userData = await ensureApproved(user)
    return { user, userData }
  } catch (error) {
    console.error('Google sign-in error:', error)
    throw error
  }
}

// LOGOUT
export const logout = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Logout error:', error)
    throw error
  }
}

// Monitor auth state
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user)
  })
}

// Get full user info from USERS table
export const getUserInfo = async (uid: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      return userDoc.data() as UserData
    }
    return null
  } catch (error) {
    console.error('Error getting user info:', error)
    throw error
  }
}

// ADMIN ONLY: Approve/Reject NGO or RecyclingFirm
export const approvePartner = async (userId: string) => {
  try {
    await setDoc(
      doc(db, 'users', userId),
      {
        approvalStatus: 'approved',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    console.error('Error approving partner:', error)
    throw error
  }
}

export const rejectPartner = async (userId: string) => {
  try {
    await setDoc(
      doc(db, 'users', userId),
      {
        approvalStatus: 'rejected',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    console.error('Error rejecting partner:', error)
    throw error
  }
}

export const sendResetPasswordEmail = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email, authActionSettings())
  } catch (error) {
    console.error('Password reset error:', error)
    throw error
  }
}

export const resendVerificationEmail = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Please log in again to verify your email.')
    await sendEmailVerification(user, authActionSettings())
  } catch (error) {
    console.error('Email verification error:', error)
    throw error
  }
}

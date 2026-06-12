// src/context/AuthContext.tsx
import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  getUserInfo,
  onAuthChange,
  type UserData,
} from '../service/authService'
import { AuthContext } from './AuthContextStore'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        setCurrentUser(user)
        try {
          const data = await getUserInfo(user.uid)
          setUserData(data)
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
      } else {
        setCurrentUser(null)
        setUserData(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
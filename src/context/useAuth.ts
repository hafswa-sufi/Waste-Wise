import { useContext } from 'react'
import { AuthContext } from './AuthContextStore'

export const useAuth = () => {
  const context = useContext(AuthContext)
  return context
}

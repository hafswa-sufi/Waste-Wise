import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Landing } from '../components/pages/Landing'
import { Dashboard } from '../components/pages/Dashboard'
import { Household } from '../components/pages/Household'
import { HouseholdNotifications } from '../components/pages/HouseholdNotifications'
import { HouseholdProfile } from '../components/pages/HouseholdProfile'
import { Auth } from '../components/pages/Auth'
import { Recycling } from '../components/pages/Recycling'
import { Admin } from '../components/pages/Admin'
import { AuthProvider } from './context/AuthContext'
import { RequireAuth } from './components/RequireAuth'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth allowedRoles={['NGO']}>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/household"
            element={
              <RequireAuth allowedRoles={['Household']}>
                <Household />
              </RequireAuth>
            }
          />
          <Route
            path="/household/notifications"
            element={
              <RequireAuth allowedRoles={['Household']}>
                <HouseholdNotifications />
              </RequireAuth>
            }
          />
          <Route
            path="/household/profile"
            element={
              <RequireAuth allowedRoles={['Household']}>
                <HouseholdProfile />
              </RequireAuth>
            }
          />
          <Route
            path="/recycling"
            element={
              <RequireAuth allowedRoles={['RecyclingFirm']}>
                <Recycling />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth allowedRoles={['Admin']}>
                <Admin />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

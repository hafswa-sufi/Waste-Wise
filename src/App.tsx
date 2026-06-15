import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Landing } from '../components/pages/Landing'
import { Dashboard } from '../components/pages/Dashboard'
import { Household } from '../components/pages/Household'
import { HouseholdNotifications } from '../components/pages/HouseholdNotifications'
import { HouseholdProfile } from '../components/pages/HouseholdProfile'
import { Auth } from '../components/pages/Auth'
import { Recycling } from '../components/pages/Recycling'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/household" element={<Household />} />
          <Route
            path="/household/notifications"
            element={<HouseholdNotifications />}
          />
          <Route path="/household/profile" element={<HouseholdProfile />} />
          <Route path="/recycling" element={<Recycling />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Landing } from './components/pages/Landing'
import { Dashboard } from './components/pages/Dashboard'
import { Household } from './components/pages/Household'
import { Auth } from './components/pages/Auth'
import { Recycling } from './components/pages/Recycling'
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/household" element={<Household />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/recycling" element={<Recycling />} />
      </Routes>
    </BrowserRouter>
  )
}

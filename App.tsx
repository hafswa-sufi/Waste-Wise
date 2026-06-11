import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { Dashboard } from './pages/Dashboard'
import { Household } from './pages/Household'
import { Auth } from './pages/Auth'
import { Recycling } from './pages/Recycling'
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

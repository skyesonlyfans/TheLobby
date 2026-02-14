import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import LobbyPage from './pages/LobbyPage'
import CrewPage from './pages/CrewPage'
import { useAuth } from './state/auth'

export default function App() {
  const { user, ready } = useAuth()
  if (!ready) return <div className="min-h-screen grid place-items-center text-white/70">Loading…</div>

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="/crew/:roomId" element={<CrewPage />} />
      <Route path="/" element={<Navigate to={user ? "/lobby" : "/auth"} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

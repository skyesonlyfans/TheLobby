import React from 'react'
import { LogOut, Settings2, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth'
import { Avatar } from './Avatar'
import { Badge, Button } from './ui'

export function Topbar({ subtitle }: { subtitle?: string }) {
  const { user, profile, logout } = useAuth()
  const nav = useNavigate()
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={() => nav('/lobby')} className="glass-strong glow rounded-3xl px-4 py-3 text-left min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white/80" />
            <div className="font-display text-lg truncate">The Lobby by Skye <span className="text-white/60">&lt;3</span></div>
          </div>
          <div className="text-xs text-white/60 mt-0.5 truncate">{subtitle || 'Welcome to The Lobby  - Skye'}</div>
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {profile?.guest && <Badge>Guest</Badge>}
        {profile && (
          <button onClick={() => nav('/settings')} className="flex items-center gap-2 glass rounded-3xl px-3 py-2 hover:bg-white/5 transition">
            <Avatar src={profile.avatar} alt={profile.username} size={34} />
            <div className="leading-tight hidden sm:block text-left">
              <div className="text-sm font-medium">{profile.username}</div>
              <div className="text-[11px] text-white/60">{user?.uid?.slice(0, 10)}</div>
            </div>
          </button>
        )}
        <Button variant="ghost" onClick={() => nav('/settings')} title="Settings">
          <Settings2 className="w-4 h-4" />
          <span className="hidden md:inline">Settings</span>
        </Button>
        <Button variant="ghost" onClick={logout} title="Log out">
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Log out</span>
        </Button>
      </div>
    </div>
  )
}

import React from 'react'
import { LogOut, Sparkles } from 'lucide-react'
import { useAuth } from '../state/auth'
import { Avatar } from './Avatar'
import { Badge, Button } from './ui'

export function Topbar({ subtitle }: { subtitle?: string }) {
  const { user, profile, logout } = useAuth()
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <div className="glass-strong glow rounded-3xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white/80" />
            <div className="font-display text-lg">The Lobby by Skye <span className="text-white/60">&lt;3</span></div>
          </div>
          <div className="text-xs text-white/60 mt-0.5">{subtitle || 'Welcome to The Lobby  - Skye'}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {profile?.guest && <Badge>Guest</Badge>}
        {profile && (
          <div className="flex items-center gap-2 glass rounded-3xl px-3 py-2">
            <Avatar src={profile.avatar} alt={profile.username} size={34} />
            <div className="leading-tight">
              <div className="text-sm font-medium">{profile.username}</div>
              <div className="text-[11px] text-white/60">{user?.uid?.slice(0, 10)}</div>
            </div>
          </div>
        )}
        <Button variant="ghost" onClick={logout} title="Log out">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </div>
  )
}

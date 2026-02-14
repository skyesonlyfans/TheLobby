import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/Topbar'
import { Avatar } from '../components/Avatar'
import { Button, Card, H2, Input, Textarea, Badge } from '../components/ui'
import { useAuth } from '../state/auth'
import { loadFriends, removeFriend, type Friend } from '../state/friends'
import { ArrowLeft, ExternalLink, Trash2, Wand2 } from 'lucide-react'

export default function SettingsPage() {
  const nav = useNavigate()
  const { user, profile, updateMyProfile } = useAuth()
  const [username, setUsername] = useState(profile?.username || '')
  const [avatar, setAvatar] = useState(profile?.avatar || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [status, setStatus] = useState(() => localStorage.getItem('lobby_status') || 'Online')
  const [refreshKey, setRefreshKey] = useState(0)

  const friends = useMemo<Friend[]>(() => (user ? loadFriends(user.uid) : []), [user, refreshKey])

  function save() {
    if (!user || !profile) return
    const p = {
      ...profile,
      username: username.trim() || profile.username,
      avatar: avatar.trim() || profile.avatar,
      bio: bio.trim(),
    }
    updateMyProfile(p)
    localStorage.setItem('lobby_status', status)
    setRefreshKey(x => x + 1)
  }

  function regenAvatar() {
    const seed = encodeURIComponent(username.trim() || 'SkyeUser')
    setAvatar(`https://api.dicebear.com/9.x/shapes/svg?seed=${seed}`)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Topbar subtitle="Settings" />
      <div className="mb-3">
        <Button variant="ghost" onClick={() => nav('/lobby')}><ArrowLeft className="w-4 h-4" /> Back</Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-7 glass-strong">
          <div className="flex items-center justify-between">
            <H2>Profile</H2>
            {profile?.guest && <Badge>Guest</Badge>}
          </div>
          <p className="text-xs text-white/50 mt-1">Profile is stored locally on this device.</p>

          <div className="mt-4 flex items-start gap-3">
            <Avatar src={avatar || profile?.avatar || ''} alt={username} size={64} ring />
            <div className="flex-1 space-y-2">
              <div className="grid sm:grid-cols-2 gap-2">
                <Input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Username" />
                <Input value={status} onChange={(e)=>setStatus(e.target.value)} placeholder="Status (e.g. Grinding ranked)" />
              </div>
              <Input value={avatar} onChange={(e)=>setAvatar(e.target.value)} placeholder="Avatar URL (or generate)" />
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={regenAvatar}><Wand2 className="w-4 h-4" /> Generate avatar</Button>
                <Button onClick={save}>Save</Button>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <Textarea value={bio} onChange={(e)=>setBio(e.target.value)} placeholder="Bio / links / favorite games…" rows={4} />
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <H2>Friends</H2>
          <p className="text-xs text-white/50 mt-1">Friends are saved to this device. Add friends from the Lobby sidebar.</p>

          <div className="mt-3 space-y-2 max-h-[52vh] overflow-auto pr-1">
            {friends.map(f => (
              <div key={f.uid} className="glass rounded-3xl p-3 border border-white/10 flex items-center gap-3">
                <img src={f.avatar} className="w-10 h-10 rounded-2xl" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{f.username}</div>
                  <div className="text-[11px] text-white/50 truncate">{f.uid.slice(0, 10)}</div>
                </div>
                <div className="ml-auto">
                  <Button variant="ghost" onClick={() => { if(!user) return; removeFriend(user.uid, f.uid); setRefreshKey(x=>x+1) }}>
                    <Trash2 className="w-4 h-4" /> Remove
                  </Button>
                </div>
              </div>
            ))}
            {friends.length === 0 && <div className="text-sm text-white/60">No friends saved yet.</div>}
          </div>
        </Card>

        <Card className="lg:col-span-12 glass-strong">
          <H2>Toolkit</H2>
          <p className="text-xs text-white/50 mt-1">Quick links to free, no-signup dev references.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ToolLink title="DevDocs" href="https://devdocs.io/" />
            <ToolLink title="Devhints" href="https://devhints.io/" />
            <ToolLink title="Crontab Guru" href="https://crontab.guru/" />
            <ToolLink title="Webhook.site" href="https://webhook.site/" />
            <ToolLink title="PublicWWW" href="https://publicwww.com/" />
          </div>
          <div className="text-[11px] text-white/50 mt-3">Swap or expand links anytime.</div>
        </Card>
      </div>
    </div>
  )
}

function ToolLink({ title, href }: { title: string, href: string }) {
  return (
    <a className="glass rounded-2xl px-3 py-2 border border-white/10 hover:bg-white/5 transition inline-flex items-center gap-2 text-sm"
      href={href} target="_blank" rel="noreferrer">
      <ExternalLink className="w-4 h-4 text-white/70" />
      {title}
    </a>
  )
}

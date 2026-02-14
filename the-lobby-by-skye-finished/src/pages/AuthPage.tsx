import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, H1, Input } from '../components/ui'
import { useAuth } from '../state/auth'
import { Shield, UserPlus, UserCircle2 } from 'lucide-react'

export default function AuthPage() {
  const { signupEmail, loginEmail, loginGoogle, loginGuest } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [guestName, setGuestName] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const title = useMemo(() => mode === 'login' ? 'Sign in' : 'Create account', [mode])

  async function go(fn: () => Promise<void>, label: string) {
    try {
      setErr(null)
      setBusy(label)
      await fn()
      nav('/lobby')
    } catch (e: any) {
      setErr(e?.message || 'Something went wrong.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-4">
        <Card className="glow">
          <H1>Welcome to The Lobby <span className="text-white/60">- Skye</span></H1>
          <p className="text-white/70 mt-2 text-sm leading-relaxed">
            Jump in, link up, and keep it moving.
          </p>

          <div className="mt-5 flex gap-2">
            <Button variant={mode === 'login' ? 'primary' : 'ghost'} onClick={() => setMode('login')}>
              <Shield className="w-4 h-4" /> Sign in
            </Button>
            <Button variant={mode === 'signup' ? 'primary' : 'ghost'} onClick={() => setMode('signup')}>
              <UserPlus className="w-4 h-4" /> Sign up
            </Button>
          </div>

          <div className="mt-6 space-y-3">
            <div className="text-xs uppercase tracking-wider text-white/50">{title}</div>
            {mode === 'signup' && (
              <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            )}
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

            <div className="flex flex-wrap gap-2">
              {mode === 'signup' ? (
                <Button disabled={!!busy} onClick={() => go(() => signupEmail(email, password, username || 'SkyeUser'), 'signup')}>
                  <UserPlus className="w-4 h-4" /> Create
                </Button>
              ) : (
                <Button disabled={!!busy} onClick={() => go(() => loginEmail(email, password), 'login')}>
                  <Shield className="w-4 h-4" /> Continue
                </Button>
              )}
              <Button variant="ghost" disabled={!!busy} onClick={() => go(() => loginGoogle(), 'google')}>
                Continue with Google
              </Button>
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Guest pass</div>
              <div className="flex gap-2">
                <Input placeholder="Guest name (optional)" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                <Button variant="ghost" disabled={!!busy} onClick={() => go(() => loginGuest(guestName), 'guest')}>
                  <UserCircle2 className="w-4 h-4" /> Enter
                </Button>
              </div>
              <p className="text-xs text-white/50 mt-2">
                Guests can join calls and read chat, but can’t create crews or shout.
              </p>
            </div>

            {err && <div className="text-sm text-rose-300">{err}</div>}
          </div>
        </Card>

        <Card className="glass-strong">
          <div className="text-xs uppercase tracking-wider text-white/50">What’s inside</div>
          <ul className="mt-3 space-y-2 text-sm text-white/70 list-disc pl-5">
            <li>Friends list (online presence)</li>
            <li>Direct & crew chat (peer-to-peer sync)</li>
            <li>1:1 video calls (WebRTC)</li>
            <li>Shouts with @mentions and #hashtags</li>
            <li>Watch link / sync for direct video files</li>
          </ul>
          <div className="mt-6 text-xs text-white/50">
            
          </div>
        </Card>
      </div>
    </div>
  )
}

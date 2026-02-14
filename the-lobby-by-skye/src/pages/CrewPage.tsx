import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Topbar } from '../components/Topbar'
import { Button, Card, H2, Input } from '../components/ui'
import { useAuth } from '../state/auth'
import { joinRoom } from '../lib/yroom'
import { parseTags } from '../lib/format'
import { Send, ArrowLeft } from 'lucide-react'

type Presence = { uid: string, username: string, avatar: string, guest?: boolean }
type Msg = { id: string, from: Presence, text: string, ts: number }

export default function CrewPage() {
  const { user, profile, ready } = useAuth()
  const nav = useNavigate()
  const { roomId } = useParams()
  const [sp] = useSearchParams()
  const pass = sp.get('pass') || undefined
  const decoded = useMemo(() => decodeURIComponent(roomId || ''), [roomId])

  useEffect(() => { if (ready && !user) nav('/auth') }, [ready, user, nav])

  const me = useMemo<Presence | null>(() => {
    if (!user || !profile) return null
    return { uid: user.uid, username: profile.username, avatar: profile.avatar, guest: profile.guest }
  }, [user, profile])

  const roomRef = useRef<ReturnType<typeof joinRoom> | null>(null)
  const [_, force] = useState(0)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!me || !decoded) return
    const room = joinRoom(decoded, pass)
    roomRef.current = room
    room.provider.awareness.setLocalStateField('user', me)
    const rerender = () => force(x => x + 1)
    room.messages.observe(rerender)
    return () => {
      room.messages.unobserve(rerender)
      room.provider.destroy()
      room.doc.destroy()
    }
  }, [decoded, pass, me?.uid])

  const room = roomRef.current
  const messages = (room?.messages.toArray() as Msg[] | undefined) || []

  function sendMessage(text: string) {
    if (!room || !me) return
    const t = text.trim()
    if (!t) return
    room.messages.push([{ id: crypto.randomUUID(), from: me, text: t, ts: Date.now() }])
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Topbar subtitle={`Crew: ${decoded}`} />
      <div className="mb-3">
        <Button variant="ghost" onClick={() => nav('/lobby')}><ArrowLeft className="w-4 h-4" /> Back</Button>
      </div>

      <Card className="glass-strong">
        <div className="flex items-center justify-between">
          <H2>Crew chat</H2>
          <div className="text-xs text-white/50">{messages.length} msgs</div>
        </div>

        <div className="mt-4 max-h-[55vh] overflow-auto pr-1 space-y-2">
          {messages.slice(-200).map(m => (
            <div key={m.id} className="rounded-3xl p-3 border border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <img src={m.from.avatar} className="w-7 h-7 rounded-2xl" />
                <div className="text-sm font-medium">{m.from.username}</div>
                <div className="ml-auto text-[11px] text-white/50">{new Date(m.ts).toLocaleTimeString()}</div>
              </div>
              <div className="mt-2 text-sm text-white/80 break-words">
                {parseTags(m.text).map((t, i) => {
                  if (t.t === 'text') return <span key={i}>{t.v}</span>
                  return (
                    <span key={i} className="px-1.5 py-0.5 rounded-xl border border-white/10 bg-white/5 text-white/80">{t.v}</span>
                  )
                })}
              </div>
            </div>
          ))}
          {messages.length === 0 && <div className="text-sm text-white/60">No messages yet.</div>}
        </div>

        <div className="mt-3 flex gap-2">
          <Input value={draft} onChange={(e)=>setDraft(e.target.value)} placeholder="Message…" onKeyDown={(e)=>{ if(e.key==='Enter'){ sendMessage(draft); setDraft('') } }} />
          <Button onClick={()=>{ sendMessage(draft); setDraft('') }}><Send className="w-4 h-4" /></Button>
        </div>
      </Card>
    </div>
  )
}

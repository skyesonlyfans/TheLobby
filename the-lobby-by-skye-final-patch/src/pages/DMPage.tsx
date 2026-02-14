import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Topbar } from '../components/Topbar'
import { Avatar } from '../components/Avatar'
import { Badge, Button, Card, H2, Input } from '../components/ui'
import { useAuth } from '../state/auth'
import { joinRoom } from '../lib/yroom'
import { parseTags, shortId } from '../lib/format'
import { ArrowLeft, Mic, Phone, Send, X } from 'lucide-react'
import { createCallerPeer, createCalleePeer, getLocalMedia } from '../lib/webrtcCall'

type Presence = { uid: string, username: string, avatar: string, guest?: boolean }
type Msg = { id: string, from: Presence, text: string, ts: number }

export default function DMPage() {
  const { user, profile, ready } = useAuth()
  const nav = useNavigate()
  const { uid } = useParams()

  useEffect(() => { if (ready && !user) nav('/auth') }, [ready, user, nav])

  const me = useMemo<Presence | null>(() => {
    if (!user || !profile) return null
    return { uid: user.uid, username: profile.username, avatar: profile.avatar, guest: profile.guest }
  }, [user, profile])

  const otherUid = uid || ''
  const dmRoom = useMemo(() => {
    if (!me || !otherUid) return ''
    const a = me.uid, b = otherUid
    const sorted = [a, b].sort()
    return `skye-dm::${sorted[0]}::${sorted[1]}`
  }, [me, otherUid])

  const roomRef = useRef<ReturnType<typeof joinRoom> | null>(null)
  const [connected, setConnected] = useState(false)
  const [_, force] = useState(0)

  // call
  const [callStatus, setCallStatus] = useState<'idle'|'calling'|'connected'>('idle')
  const [voiceOnly, setVoiceOnly] = useState(true)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const peerRef = useRef<any>(null)

  const otherPresence = useMemo<Presence>(() => ({
    uid: otherUid,
    username: `User${shortId(otherUid)}`,
    avatar: `https://api.dicebear.com/9.x/shapes/svg?seed=${otherUid}`
  }), [otherUid])

  useEffect(() => {
    if (!me || !dmRoom) return
    const room = joinRoom(dmRoom)
    roomRef.current = room

    const awareness = room.provider.awareness
    awareness.setLocalStateField('user', me)

    const onSynced = () => setConnected(true)
    room.provider.on('synced', onSynced)

    const rerender = () => force(x => x + 1)
    room.messages.observe(rerender)
    room.signals.observe(rerender)

    room.signals.observe(() => {
      if (!me) return
      const payload = room.signals.get(me.uid)
      if (!payload) return
      room.signals.delete(me.uid)
      if (payload?.type === 'call' && payload?.from && payload?.signal) {
        // Answer automatically (DM)
        ;(async () => {
          try {
            const vo = !!payload.voiceOnly
            setVoiceOnly(vo)
            setCallStatus('connected')
            const local = await getLocalMedia({ audio: true, video: vo ? false : true })
            setLocalStream(local)
            const callee = createCalleePeer(local, (p) => {
              room.signals.set(payload.from, { type: 'call', from: me.uid, signal: p.data, voiceOnly: vo })
            }, me.uid, payload.from)
            peerRef.current = callee
            callee.on('stream', (s: MediaStream) => setRemoteStream(s))
            callee.on('error', () => endCall())
            callee.signal(payload.signal)
          } catch {
            endCall()
          }
        })()
      }
    })

    return () => {
      room.provider.off('synced', onSynced)
      room.messages.unobserve(rerender)
      room.signals.unobserve(rerender)
      room.provider.destroy()
      room.doc.destroy()
    }
  }, [me?.uid, dmRoom])

  const room = roomRef.current
  const items = (room?.messages.toArray() as Msg[] | undefined) || []

  function send(text: string) {
    if (!room || !me) return
    const t = text.trim()
    if (!t) return
    room.messages.push([{ id: crypto.randomUUID(), from: me, text: t, ts: Date.now() }])
  }

  async function startCall(vo: boolean) {
    if (!room || !me) return
    setVoiceOnly(vo)
    setCallStatus('calling')
    try {
      const local = await getLocalMedia({ audio: true, video: vo ? false : true })
      setLocalStream(local)
      const caller = createCallerPeer(local, (p) => {
        room.signals.set(otherUid, { type: 'call', from: me.uid, signal: p.data, voiceOnly: vo })
      }, me.uid, otherUid)
      peerRef.current = caller
      caller.on('stream', (s: MediaStream) => {
        setRemoteStream(s)
        setCallStatus('connected')
      })
      caller.on('error', () => endCall())
    } catch {
      endCall()
    }
  }

  function endCall() {
    setCallStatus('idle')
    setRemoteStream(null)
    try { peerRef.current?.destroy?.() } catch {}
    peerRef.current = null
    if (localStream) localStream.getTracks().forEach(t => t.stop())
    setLocalStream(null)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Topbar subtitle={connected ? 'Direct message' : 'Connecting…'} />
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={() => nav('/lobby')}><ArrowLeft className="w-4 h-4" /> Back</Button>

        <div className="flex items-center gap-2 glass rounded-3xl px-3 py-2 border border-white/10">
          <Avatar src={otherPresence.avatar} alt={otherPresence.username} size={34} />
          <div className="text-sm font-medium">{otherPresence.username}</div>
          <Badge>{shortId(otherUid)}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => startCall(true)} title="Voice call"><Mic className="w-4 h-4" /></Button>
          <Button variant="ghost" onClick={() => startCall(false)} title="Video call"><Phone className="w-4 h-4" /></Button>
          {callStatus !== 'idle' && <Button variant="danger" onClick={endCall}><X className="w-4 h-4" /> End</Button>}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-8 glass-strong">
          <H2>Chat</H2>
          <Feed items={items} />
          <Composer onSend={send} />
        </Card>

        <Card className="lg:col-span-4 glass-strong">
          <H2>{voiceOnly ? 'Voice' : 'Call'}</H2>
          {callStatus === 'idle' && <div className="text-sm text-white/70 mt-2">No active call.</div>}
          {callStatus !== 'idle' && (
            <div className="mt-3 grid gap-2">
              <VideoTile label="You" stream={localStream} muted voiceOnly={voiceOnly} />
              <VideoTile label={otherPresence.username} stream={remoteStream} voiceOnly={voiceOnly} />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function Composer({ onSend }: { onSend: (t: string) => void }) {
  const [draft, setDraft] = useState('')
  return (
    <div className="mt-3 flex gap-2">
      <Input value={draft} onChange={(e)=>setDraft(e.target.value)} placeholder="Message… @mentions #tags" onKeyDown={(e)=>{ if(e.key==='Enter'){ onSend(draft); setDraft('') } }} />
      <Button onClick={()=>{ onSend(draft); setDraft('') }}><Send className="w-4 h-4" /></Button>
    </div>
  )
}

function Feed({ items }: { items: Array<any> }) {
  return (
    <div className="max-h-[56vh] overflow-auto pr-1 space-y-2 mt-3">
      {items.slice(-200).map((m: any) => (
        <div key={m.id} className="rounded-3xl p-3 border border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <img src={m.from.avatar} className="w-7 h-7 rounded-2xl" />
            <div className="text-sm font-medium">{m.from.username}</div>
            <div className="ml-auto text-[11px] text-white/50">{new Date(m.ts).toLocaleTimeString()}</div>
          </div>
          <div className="mt-2 text-sm text-white/80 leading-relaxed break-words">
            {parseTags(m.text).map((t, i) => {
              if (t.t === 'text') return <span key={i}>{t.v}</span>
              return (
                <span key={i} className={"px-1.5 py-0.5 rounded-xl border " + (t.t === 'mention'
                  ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
                  : "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-200"
                )}>{t.v}</span>
              )
            })}
          </div>
        </div>
      ))}
      {items.length === 0 && <div className="text-sm text-white/60">Say hi.</div>}
    </div>
  )
}

function VideoTile({ stream, label, muted, voiceOnly }: { stream: MediaStream | null, label: string, muted?: boolean, voiceOnly?: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null)
  useEffect(() => { if (ref.current) (ref.current as any).srcObject = stream }, [stream])
  const hasVideo = !!stream && stream.getVideoTracks().length > 0
  return (
    <div className="glass rounded-3xl overflow-hidden">
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
        <div className="text-xs text-white/70">{label}</div>
        <div className={"text-[10px] px-2 py-0.5 rounded-full border border-white/10 " + (stream ? "text-emerald-200 bg-emerald-400/10" : "text-white/50 bg-white/5")}>
          {stream ? (voiceOnly && !hasVideo ? 'VOICE' : 'LIVE') : '…'}
        </div>
      </div>

      {voiceOnly && !hasVideo ? (
        <div className="w-full aspect-video bg-black/40 grid place-items-center text-white/60">
          <Mic className="w-10 h-10" />
        </div>
      ) : (
        <video ref={ref} autoPlay playsInline muted={!!muted} className="w-full aspect-video bg-black/40" />
      )}
    </div>
  )
}

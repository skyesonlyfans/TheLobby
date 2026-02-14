import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as Y from 'yjs'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/Topbar'
import { Avatar } from '../components/Avatar'
import { Badge, Button, Card, H2, Input, Textarea } from '../components/ui'
import { useAuth } from '../state/auth'
import { clsx, parseTags, shortId } from '../lib/format'
import { joinRoom } from '../lib/yroom'
import { createCallerPeer, createCalleePeer, getLocalMedia } from '../lib/webrtcCall'
import { Phone, Users, Hash, Send, Video, Plus, X, Link as LinkIcon } from 'lucide-react'

type Presence = {
  uid: string
  username: string
  avatar: string
  guest?: boolean
}

type Msg = { id: string, from: Presence, text: string, ts: number }
type Shout = { id: string, from: Presence, text: string, ts: number }

function uidFromAwareness(a: any): string | null {
  return a?.uid || null
}

export default function LobbyPage() {
  const { user, profile, ready } = useAuth()
  const nav = useNavigate()

  useEffect(() => {
    if (ready && !user) nav('/auth')
  }, [ready, user, nav])

  const me = useMemo<Presence | null>(() => {
    if (!user || !profile) return null
    return { uid: user.uid, username: profile.username, avatar: profile.avatar, guest: profile.guest }
  }, [user, profile])

  const [roomCode, setRoomCode] = useState(() => localStorage.getItem('lobby_room') || 'skye-lobby')
  const [roomPass, setRoomPass] = useState(() => localStorage.getItem('lobby_pass') || '')

  const [connected, setConnected] = useState(false)
  const [peers, setPeers] = useState<Presence[]>([])
  const [tab, setTab] = useState<'chat'|'shouts'|'crews'>('chat')

  const roomRef = useRef<ReturnType<typeof joinRoom> | null>(null)
  const [_, force] = useState(0)

  // call state
  const [callWith, setCallWith] = useState<Presence | null>(null)
  const [callStatus, setCallStatus] = useState<'idle'|'calling'|'ringing'|'connected'>('idle')
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const peerRef = useRef<any>(null)

  // watch party
  const [watchUrl, setWatchUrl] = useState('')
  const [activeWatchUrl, setActiveWatchUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!me) return

    localStorage.setItem('lobby_room', roomCode)
    localStorage.setItem('lobby_pass', roomPass)

    const room = joinRoom(roomCode.trim() || 'skye-lobby', roomPass.trim() || undefined)
    roomRef.current = room

    const awareness = room.provider.awareness
    awareness.setLocalStateField('user', me)

    const updatePeers = () => {
      const states = Array.from(awareness.getStates().values())
        .map((s: any) => s?.user)
        .filter(Boolean) as Presence[]
      // unique by uid
      const uniq = new Map(states.map(p => [p.uid, p]))
      setPeers(Array.from(uniq.values()).sort((a,b) => a.username.localeCompare(b.username)))
    }

    awareness.on('change', updatePeers)
    updatePeers()

    const onSynced = () => setConnected(true)
    room.provider.on('synced', onSynced)

    // react to doc updates
    const rerender = () => force(x => x + 1)
    room.messages.observe(rerender)
    room.shouts.observe(rerender)
    room.crews.observe(rerender)
    room.signals.observe(rerender)

    // incoming call signals
    const unobsSignals = room.signals.observe(() => {
      if (!me) return
      const payload = room.signals.get(me.uid)
      if (!payload) return

      // clear after read
      room.signals.delete(me.uid)

      if (payload?.type === 'call' && payload?.from && payload?.signal) {
        const from = peers.find(p => p.uid === payload.from) || { uid: payload.from, username: `User${shortId(payload.from)}`, avatar: `https://api.dicebear.com/9.x/shapes/svg?seed=${payload.from}` }
        // if we are idle, ring
        if (callStatus === 'idle') {
          setCallWith(from)
          setCallStatus('ringing')
          ;(async () => {
            try {
              const local = await getLocalMedia()
              setLocalStream(local)
              const callee = createCalleePeer(local, (p) => {
                room.signals.set(payload.from, { type: 'call', from: me.uid, signal: p.data })
              }, me.uid, payload.from)

              peerRef.current = callee
              callee.on('stream', (s: MediaStream) => {
                setRemoteStream(s)
                setCallStatus('connected')
              })
              callee.on('error', () => { endCall() })

              // feed remote offer
              callee.signal(payload.signal)
            } catch {
              endCall()
            }
          })()
        }
      }

      if (payload?.type === 'watch' && payload?.url) {
        setActiveWatchUrl(payload.url)
      }

      if (payload?.type === 'sync' && payload?.t != null) {
        const v = videoRef.current
        if (v && Math.abs(v.currentTime - payload.t) > 0.9) v.currentTime = payload.t
        if (v && payload.paused === false && v.paused) v.play().catch(()=>{})
        if (v && payload.paused === true && !v.paused) v.pause()
      }
    })

    return () => {
      awareness.off('change', updatePeers)
      room.provider.off('synced', onSynced)
      room.messages.unobserve(rerender)
      room.shouts.unobserve(rerender)
      room.crews.unobserve(rerender)
      room.signals.unobserve(rerender)
      unobsSignals
      room.provider.destroy()
      room.doc.destroy()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, roomPass, me?.uid])

  const room = roomRef.current
  const messages = (room?.messages.toArray() as Msg[] | undefined) || []
  const shouts = (room?.shouts.toArray() as Shout[] | undefined) || []
  const crews = room ? Array.from(room.crews.entries()).map(([id, v]) => ({ id, ...v })) : []

  function sendMessage(text: string) {
    if (!room || !me) return
    const t = text.trim()
    if (!t) return
    const msg: Msg = { id: crypto.randomUUID(), from: me, text: t, ts: Date.now() }
    room.messages.push([msg])
  }

  function sendShout(text: string) {
    if (!room || !me) return
    if (me.guest) return
    const t = text.trim()
    if (!t) return
    const shout: Shout = { id: crypto.randomUUID(), from: me, text: t, ts: Date.now() }
    room.shouts.push([shout])
  }

  function createCrew(name: string) {
    if (!room || !me) return
    if (me.guest) return
    const n = name.trim()
    if (!n) return
    const id = `crew_${crypto.randomUUID().slice(0, 8)}`
    room.crews.set(id, { name: n, createdBy: me.uid, createdAt: Date.now() })
  }

  async function startCall(target: Presence) {
    if (!room || !me) return
    setCallWith(target)
    setCallStatus('calling')
    try {
      const local = await getLocalMedia()
      setLocalStream(local)
      const caller = createCallerPeer(local, (p) => {
        room.signals.set(target.uid, { type: 'call', from: me.uid, signal: p.data })
      }, me.uid, target.uid)
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
    setCallWith(null)
    setRemoteStream(null)
    try {
      peerRef.current?.destroy?.()
    } catch {}
    peerRef.current = null
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop())
    }
    setLocalStream(null)
  }

  function broadcastWatch(url: string) {
    if (!room || !me) return
    const u = url.trim()
    if (!u) return
    setActiveWatchUrl(u)
    // send to everyone by writing a message in signals map for each peer
    peers.forEach(p => {
      if (p.uid !== me.uid) room.signals.set(p.uid, { type: 'watch', url: u, from: me.uid })
    })
  }

  function broadcastSync() {
    if (!room || !me) return
    const v = videoRef.current
    if (!v) return
    const payload = { type: 'sync', t: v.currentTime, paused: v.paused, from: me.uid }
    peers.forEach(p => { if (p.uid !== me.uid) room.signals.set(p.uid, payload) })
  }

  const [draft, setDraft] = useState('')
  const [shoutDraft, setShoutDraft] = useState('')
  const [crewName, setCrewName] = useState('')

  const canVideoWatch = !!activeWatchUrl && /\.(mp4|webm|ogg)(\?|#|$)/i.test(activeWatchUrl)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Topbar subtitle={connected ? `Room: ${roomCode}` : 'Connecting…'} />

      <div className="grid lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <H2>Friends</H2>
            <Badge>{peers.length}</Badge>
          </div>
          <p className="text-xs text-white/50 mt-1">Online presence in this room.</p>

          <div className="mt-3 space-y-2 max-h-[55vh] overflow-auto pr-1">
            {peers.map(p => (
              <button
                key={p.uid}
                className={clsx(
                  "w-full flex items-center gap-3 rounded-3xl px-3 py-2 text-left hover:bg-white/5 border border-white/0 hover:border-white/10 transition",
                  p.uid === me?.uid && "opacity-70"
                )}
                onClick={() => p.uid !== me?.uid && startCall(p)}
              >
                <Avatar src={p.avatar} alt={p.username} size={40} ring={p.uid !== me?.uid} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium truncate">{p.username}</div>
                    {p.guest && <Badge>Guest</Badge>}
                  </div>
                  <div className="text-[11px] text-white/50 truncate">{shortId(p.uid)}</div>
                </div>
                <div className="ml-auto text-white/60">
                  {p.uid !== me?.uid ? <Phone className="w-4 h-4" /> : null}
                </div>
              </button>
            ))}
            {peers.length === 0 && <div className="text-sm text-white/60">No one here yet.</div>}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs uppercase tracking-wider text-white/50">Room settings</div>
            <div className="mt-2 space-y-2">
              <Input value={roomCode} onChange={(e)=>setRoomCode(e.target.value)} placeholder="Room code" />
              <Input value={roomPass} onChange={(e)=>setRoomPass(e.target.value)} placeholder="Optional room password" />
              <div className="text-[11px] text-white/50">Tip: share the room code + password with friends.</div>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-6 space-y-4">
          <Card className="glass-strong">
            <div className="flex items-center gap-2">
              <button onClick={()=>setTab('chat')} className={clsx("px-3 py-2 rounded-2xl text-sm border border-white/10", tab==='chat' ? "bg-white/10" : "hover:bg-white/5")}>
                <Users className="w-4 h-4 inline mr-2" /> Chat
              </button>
              <button onClick={()=>setTab('shouts')} className={clsx("px-3 py-2 rounded-2xl text-sm border border-white/10", tab==='shouts' ? "bg-white/10" : "hover:bg-white/5")}>
                <Hash className="w-4 h-4 inline mr-2" /> Shouts
              </button>
              <button onClick={()=>setTab('crews')} className={clsx("px-3 py-2 rounded-2xl text-sm border border-white/10", tab==='crews' ? "bg-white/10" : "hover:bg-white/5")}>
                Crews
              </button>
            </div>

            {tab === 'chat' && (
              <div className="mt-4">
                <Feed items={messages} />
                <div className="mt-3 flex gap-2">
                  <Input value={draft} onChange={(e)=>setDraft(e.target.value)} placeholder="Message… (supports @mentions, #tags)" onKeyDown={(e)=>{ if(e.key==='Enter'){ sendMessage(draft); setDraft('') } }} />
                  <Button onClick={()=>{ sendMessage(draft); setDraft('') }}><Send className="w-4 h-4" /></Button>
                </div>
              </div>
            )}

            {tab === 'shouts' && (
              <div className="mt-4">
                <Feed items={shouts} isShout />
                <div className="mt-3 flex gap-2">
                  <Input value={shoutDraft} onChange={(e)=>setShoutDraft(e.target.value)} placeholder={me?.guest ? "Guests can’t shout" : "Shout… @someone #topic"} disabled={!!me?.guest} onKeyDown={(e)=>{ if(e.key==='Enter'){ sendShout(shoutDraft); setShoutDraft('') } }} />
                  <Button disabled={!!me?.guest} onClick={()=>{ sendShout(shoutDraft); setShoutDraft('') }}><Hash className="w-4 h-4" /></Button>
                </div>
              </div>
            )}

            {tab === 'crews' && (
              <div className="mt-4">
                <div className="flex gap-2">
                  <Input value={crewName} onChange={(e)=>setCrewName(e.target.value)} placeholder={me?.guest ? "Guests can’t create crews" : "Create a crew…"} disabled={!!me?.guest} />
                  <Button disabled={!!me?.guest} onClick={()=>{ createCrew(crewName); setCrewName('') }}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="mt-3 grid gap-2">
                  {crews.map(c => <CrewCard key={c.id} crew={c} baseRoom={roomCode} pass={roomPass} />)}
                  {crews.length === 0 && <div className="text-sm text-white/60">No crews yet—make one.</div>}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <H2>Watch together</H2>
            <p className="text-xs text-white/50 mt-1">Share a direct video file URL (mp4/webm/ogg) for synced playback. Other links open as embeds.</p>
            <div className="mt-3 flex gap-2">
              <Input value={watchUrl} onChange={(e)=>setWatchUrl(e.target.value)} placeholder="Paste a link…" />
              <Button variant="ghost" onClick={() => broadcastWatch(watchUrl)}><LinkIcon className="w-4 h-4" /> Share</Button>
            </div>

            {activeWatchUrl && (
              <div className="mt-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm text-white/70 truncate">{activeWatchUrl}</div>
                  <Button variant="ghost" onClick={() => setActiveWatchUrl(null)}><X className="w-4 h-4" /> Clear</Button>
                </div>

                <div className="mt-3 glass rounded-3xl p-3">
                  {canVideoWatch ? (
                    <div>
                      <video
                        ref={(el)=>{ videoRef.current = el }}
                        src={activeWatchUrl}
                        controls
                        className="w-full rounded-2xl"
                        onPlay={broadcastSync}
                        onPause={broadcastSync}
                        onSeeked={broadcastSync}
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button variant="ghost" onClick={broadcastSync}><Video className="w-4 h-4" /> Sync now</Button>
                      </div>
                    </div>
                  ) : (
                    <iframe
                      title="shared"
                      src={activeWatchUrl}
                      className="w-full h-[360px] rounded-2xl border border-white/10"
                      allow="autoplay; fullscreen; picture-in-picture"
                    />
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        <Card className="lg:col-span-3 glass-strong">
          <H2>Call</H2>
          <p className="text-xs text-white/50 mt-1">Tap a friend to start a 1:1 call.</p>

          <div className="mt-3">
            {callStatus === 'idle' && (
              <div className="text-sm text-white/70">No active call.</div>
            )}

            {callWith && callStatus !== 'idle' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar src={callWith.avatar} alt={callWith.username} size={44} ring />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{callWith.username}</div>
                    <div className="text-xs text-white/60">{callStatus === 'calling' ? 'Calling…' : callStatus === 'ringing' ? 'Incoming…' : 'Connected'}</div>
                  </div>
                  <div className="ml-auto">
                    <Button variant="danger" onClick={endCall}><X className="w-4 h-4" /> End</Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <VideoTile label="You" stream={localStream} muted />
                  <VideoTile label={callWith.username} stream={remoteStream} />
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Notes</div>
            <ul className="text-xs text-white/50 space-y-1 list-disc pl-5">
              <li>Calls are peer-to-peer (no media relay).</li>
              <li>Room password encrypts signaling messages.</li>
              <li>For larger groups, consider adding a hosted SFU later.</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Feed({ items, isShout }: { items: Array<any>, isShout?: boolean }) {
  return (
    <div className="max-h-[42vh] overflow-auto pr-1 space-y-2">
      {items.slice(-150).map((m: any) => (
        <div key={m.id} className={clsx("rounded-3xl p-3 border border-white/10", isShout ? "bg-rose-500/10" : "bg-white/5")}>
          <div className="flex items-center gap-2">
            <img src={m.from.avatar} className="w-7 h-7 rounded-2xl" />
            <div className="text-sm font-medium">{m.from.username}</div>
            {m.from.guest && <Badge>Guest</Badge>}
            <div className="ml-auto text-[11px] text-white/50">{new Date(m.ts).toLocaleTimeString()}</div>
          </div>
          <div className="mt-2 text-sm text-white/80 leading-relaxed break-words">
            {parseTags(m.text).map((t, i) => {
              if (t.t === 'text') return <span key={i}>{t.v}</span>
              return (
                <span key={i} className={clsx(
                  "px-1.5 py-0.5 rounded-xl border",
                  t.t === 'mention' ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200" : "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-200"
                )}>{t.v}</span>
              )
            })}
          </div>
        </div>
      ))}
      {items.length === 0 && <div className="text-sm text-white/60">Nothing yet—say hi.</div>}
    </div>
  )
}

function VideoTile({ stream, label, muted }: { stream: MediaStream | null, label: string, muted?: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream
    }
  }, [stream])
  return (
    <div className="glass rounded-3xl overflow-hidden">
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
        <div className="text-xs text-white/70">{label}</div>
        <div className={clsx("text-[10px] px-2 py-0.5 rounded-full border border-white/10", stream ? "text-emerald-200 bg-emerald-400/10" : "text-white/50 bg-white/5")}>
          {stream ? 'LIVE' : '…'}
        </div>
      </div>
      <video ref={ref} autoPlay playsInline muted={!!muted} className="w-full aspect-video bg-black/40" />
    </div>
  )
}

function CrewCard({ crew, baseRoom, pass }: { crew: any, baseRoom: string, pass: string }) {
  const nav = useNavigate()
  const crewRoom = `${baseRoom}::${crew.id}`
  return (
    <div className="glass rounded-3xl p-3 border border-white/10">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{crew.name}</div>
          <div className="text-[11px] text-white/50 truncate">{crewRoom}</div>
        </div>
        <Button variant="ghost" onClick={() => nav(`/crew/${encodeURIComponent(crewRoom)}?pass=${encodeURIComponent(pass || '')}`)}>
          Join
        </Button>
      </div>
    </div>
  )
}

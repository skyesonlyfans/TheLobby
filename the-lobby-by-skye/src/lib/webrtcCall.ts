import Peer, { Instance } from 'simple-peer'

type SignalPayload = {
  from: string
  to: string
  kind: 'offer' | 'answer' | 'ice'
  data: any
  ts: number
}

export type CallState = {
  peer: Instance | null
  remoteStream: MediaStream | null
  localStream: MediaStream | null
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'error'
  error?: string
}

export async function getLocalMedia(): Promise<MediaStream> {
  return await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
}

export function createCallerPeer(local: MediaStream, onSignal: (p: SignalPayload) => void, me: string, to: string) {
  const peer = new Peer({
    initiator: true,
    trickle: true,
    stream: local
  })
  peer.on('signal', (data) => {
    onSignal({ from: me, to, kind: 'offer', data, ts: Date.now() })
  })
  return peer
}

export function createCalleePeer(local: MediaStream, onSignal: (p: SignalPayload) => void, me: string, to: string) {
  const peer = new Peer({
    initiator: false,
    trickle: true,
    stream: local
  })
  peer.on('signal', (data) => {
    onSignal({ from: me, to, kind: 'answer', data, ts: Date.now() })
  })
  return peer
}

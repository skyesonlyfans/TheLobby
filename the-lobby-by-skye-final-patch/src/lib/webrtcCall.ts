import Peer, { Instance } from 'simple-peer'

type SignalPayload = {
  from: string
  to: string
  kind: 'offer' | 'answer' | 'ice'
  data: any
  ts: number
}

export async function getLocalMedia(opts?: { audio?: boolean, video?: boolean }): Promise<MediaStream> {
  const audio = opts?.audio ?? true
  const video = opts?.video ?? true
  return await navigator.mediaDevices.getUserMedia({ audio, video })
}

export function createCallerPeer(local: MediaStream, onSignal: (p: SignalPayload) => void, me: string, to: string) {
  const peer = new Peer({ initiator: true, trickle: true, stream: local })
  peer.on('signal', (data) => onSignal({ from: me, to, kind: 'offer', data, ts: Date.now() }))
  return peer
}

export function createCalleePeer(local: MediaStream, onSignal: (p: SignalPayload) => void, me: string, to: string) {
  const peer = new Peer({ initiator: false, trickle: true, stream: local })
  peer.on('signal', (data) => onSignal({ from: me, to, kind: 'answer', data, ts: Date.now() }))
  return peer
}

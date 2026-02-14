import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

export type Room = {
  doc: Y.Doc
  provider: WebrtcProvider
  messages: Y.Array<any>
  shouts: Y.Array<any>
  crews: Y.Map<any>
  signals: Y.Map<any>
}

export function joinRoom(roomName: string, password?: string): Room {
  const doc = new Y.Doc()

  // y-webrtc ships with public signaling servers by default; can override if needed.
  const provider = new WebrtcProvider(roomName, doc, {
    password: password || undefined
  })

  const messages = doc.getArray('messages')
  const shouts = doc.getArray('shouts')
  const crews = doc.getMap('crews')      // crewId -> {name, createdBy}
  const signals = doc.getMap('signals')  // uid -> { from, data, type, ts }

  return { doc, provider, messages, shouts, crews, signals }
}

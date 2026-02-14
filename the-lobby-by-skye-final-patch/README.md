# The Lobby by Skye <3

**Welcome to The Lobby  - Skye**

What’s inside:
- Firebase **Auth only** (Email/Password + Google + Anonymous guest)
- P2P presence + chat + shouts using **Yjs + y-webrtc**
- 1:1 **voice or video** calls using **simple-peer**
- Crews (group rooms) with crew chat
- “Watch together” (sync for direct video URLs; embeds for other links)
- Profiles + local friends list + settings

## Quick start
```bash
npm install
npm run dev
```

## Firebase config
`src/lib/firebase.ts` contains the embedded config so you can easily replace it.

## Deploy
```bash
npm run build
```
Deploy `dist/`.

## Notes
- Realtime features are peer-to-peer and not persisted.
- For larger group calls later, add a hosted SFU/relay.

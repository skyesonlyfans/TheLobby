# The Lobby by Skye <3

**Welcome to The Lobby  - Skye**

A lightweight, gamer-friendly hangout:
- Firebase **Auth only** (Email/Password + Google + Anonymous guest)
- P2P presence + chat + shouts using **Yjs + y-webrtc**
- 1:1 WebRTC video calls using **simple-peer**
- Crews (group rooms) with crew chat
- "Watch together" (sync for direct video URLs; embeds for other links)

> Note: There is **no server-side persistence** in this starter. It’s intentionally “drop-in / no signup infra”
> beyond Firebase Auth, and avoids Firebase Database/Firestore/Storage.

## Quick start

1. Install deps
```bash
npm install
```

2. Create a Firebase project (free tier)
- Enable Authentication providers: **Email/Password**, **Google**, **Anonymous**
- Add a **Web App**
- Copy config into `.env` (see `.env.example`)

3. Run
```bash
npm run dev
```

## Deploy

- Vercel / Netlify / Cloudflare Pages / any static host:
```bash
npm run build
```
Deploy `dist/`.

## How rooms work
- Everyone who enters the same **room code** (and password, if set) will see each other as “online”.
- Crews are simply sub-rooms under the hood: `<room>::crew_xxxxxxxx`.

## Privacy & reliability
- y-webrtc uses signaling servers to discover peers and can encrypt signaling when a password is provided.
- Calls are pure peer-to-peer; larger groups should use an SFU/relay later if needed.

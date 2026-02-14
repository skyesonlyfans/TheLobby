import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { loadProfile, saveProfile, type LocalProfile } from './profile'

type AuthCtx = {
  user: User | null
  profile: LocalProfile | null
  ready: boolean
  signupEmail: (email: string, password: string, username: string) => Promise<void>
  loginEmail: (email: string, password: string) => Promise<void>
  loginGoogle: () => Promise<void>
  loginGuest: (username?: string) => Promise<void>
  logout: () => Promise<void>
  setLocalProfile: (p: LocalProfile) => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<LocalProfile | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setProfile(u ? loadProfile(u.uid) : null)
      setReady(true)
    })
    return () => unsub()
  }, [])

  const ctx = useMemo<AuthCtx>(() => ({
    user,
    profile,
    ready,
    setLocalProfile: (p) => {
      if (!user) return
      saveProfile(user.uid, p)
      setProfile(p)
    },
    signupEmail: async (email, password, username) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: username })
      const p: LocalProfile = {
        username,
        avatar: randomAvatar(username),
        bio: 'New in The Lobby.',
      }
      saveProfile(cred.user.uid, p)
      setProfile(p)
    },
    loginEmail: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password)
    },
    loginGoogle: async () => {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      const u = auth.currentUser
      if (u) {
        const existing = loadProfile(u.uid)
        if (!existing) {
          const username = u.displayName || `SkyeUser${u.uid.slice(0, 5)}`
          const p: LocalProfile = {
            username,
            avatar: (u.photoURL || randomAvatar(username)),
            bio: 'Here for the vibes.',
          }
          saveProfile(u.uid, p)
          setProfile(p)
        }
      }
    },
    loginGuest: async (username) => {
      await signInAnonymously(auth)
      const u = auth.currentUser
      if (!u) return
      const existing = loadProfile(u.uid)
      if (!existing) {
        const uname = username?.trim() || `Guest${Math.floor(Math.random()*9000+1000)}`
        const p: LocalProfile = {
          username: uname,
          avatar: randomAvatar(uname),
          bio: 'Guest pass (limited).',
          guest: true
        }
        saveProfile(u.uid, p)
        setProfile(p)
      }
    },
    logout: async () => { await signOut(auth) }
  }), [user, profile, ready])

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used inside AuthProvider')
  return v
}

function randomAvatar(seed: string) {
  const s = encodeURIComponent(seed)
  // no-storage avatar service (dicebear)
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${s}`
}

export type LocalProfile = {
  username: string
  avatar: string
  bio?: string
  guest?: boolean
}

const key = (uid: string) => `lobby_profile_${uid}`

export function loadProfile(uid: string): LocalProfile | null {
  try {
    const raw = localStorage.getItem(key(uid))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveProfile(uid: string, p: LocalProfile) {
  localStorage.setItem(key(uid), JSON.stringify(p))
}

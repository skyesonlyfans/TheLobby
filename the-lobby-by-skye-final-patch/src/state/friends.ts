export type Friend = { uid: string, username: string, avatar: string }

const key = (uid: string) => `lobby_friends_${uid}`

export function loadFriends(uid: string): Friend[] {
  try {
    const raw = localStorage.getItem(key(uid))
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.filter(Boolean)
  } catch {
    return []
  }
}

export function saveFriends(uid: string, friends: Friend[]) {
  localStorage.setItem(key(uid), JSON.stringify(friends))
}

export function upsertFriend(uid: string, f: Friend) {
  const list = loadFriends(uid)
  const m = new Map(list.map(x => [x.uid, x]))
  m.set(f.uid, f)
  saveFriends(uid, Array.from(m.values()).sort((a,b)=>a.username.localeCompare(b.username)))
}

export function removeFriend(uid: string, friendUid: string) {
  const list = loadFriends(uid).filter(f => f.uid !== friendUid)
  saveFriends(uid, list)
}

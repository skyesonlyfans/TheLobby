export function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ')
}

export function shortId(id: string) {
  return id.slice(0, 6)
}

export function parseTags(text: string) {
  const tokens: Array<{ t: 'text' | 'mention' | 'tag', v: string }> = []
  const re = /(@[a-zA-Z0-9_]{2,24}|#[a-zA-Z0-9_]{2,24})/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) tokens.push({ t: 'text', v: text.slice(last, m.index) })
    const v = m[0]
    tokens.push({ t: v.startsWith('@') ? 'mention' : 'tag', v })
    last = m.index + v.length
  }
  if (last < text.length) tokens.push({ t: 'text', v: text.slice(last) })
  return tokens
}

import React from 'react'
import { clsx } from '../lib/format'

export function Avatar({ src, alt, size=40, ring }: { src: string, alt?: string, size?: number, ring?: boolean }) {
  return (
    <div
      className={clsx("rounded-2xl overflow-hidden shrink-0", ring && "ring-2 ring-white/20")}
      style={{ width: size, height: size }}
      title={alt}
    >
      <img src={src} alt={alt || 'avatar'} className="w-full h-full object-cover" />
    </div>
  )
}

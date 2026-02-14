import React from 'react'
import { clsx } from '../lib/format'

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'ghost'|'danger' }) {
  const v = props.variant || 'primary'
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition active:scale-[0.99] disabled:opacity-60",
        v === 'primary' && "glass glow hover:bg-white/10",
        v === 'ghost' && "hover:bg-white/10 border border-white/10",
        v === 'danger' && "bg-rose-500/15 border border-rose-400/20 hover:bg-rose-500/20",
        props.className
      )}
    />
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20",
        props.className
      )}
    />
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        "w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20",
        props.className
      )}
    />
  )
}

export function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={clsx("glass rounded-3xl p-4", className)}>{children}</div>
}

export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/80">{children}</span>
}

export function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="font-display text-3xl md:text-4xl tracking-tight">{children}</h1>
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-xl tracking-tight">{children}</h2>
}

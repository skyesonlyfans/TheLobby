export function mustEnv(name: string): string {
  const v = (import.meta as any).env[name]
  if (!v) throw new Error(`Missing env var ${name}. See .env.example`)
  return v
}

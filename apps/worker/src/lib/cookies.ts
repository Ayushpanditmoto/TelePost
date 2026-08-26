// Minimal cookie parsing/serialisation helpers for the Cloudflare Worker.
// Kept dependency-free (no `@hono/cookie`) to avoid extra installs.

interface CookieOptions {
  maxAge?: number
  path?: string
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'Lax' | 'Strict' | 'None'
}

export function parseCookies(header: string | null | undefined): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!header) return cookies
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const name = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (name) cookies[name] = decodeURIComponent(value)
  }
  return cookies
}

export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`]
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge)}`)
  parts.push(`Path=${options.path ?? '/'}`)
  if (options.httpOnly) parts.push('HttpOnly')
  if (options.secure) parts.push('Secure')
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`)
  return parts.join('; ')
}

export function serializeClearCookie(name: string, options: CookieOptions = {}): string {
  // Empty value + immediate expiry clears the cookie.
  return serializeCookie(name, '', {
    ...options,
    maxAge: 0,
    httpOnly: true,
  })
}
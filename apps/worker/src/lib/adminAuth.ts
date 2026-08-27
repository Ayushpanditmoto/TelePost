// Admin-panel authentication: credentials matched against ADMIN_EMAIL /
// ADMIN_KEY from env, then a short-lived signed cookie keeps the browser
// unlocked. No row in `sessions` — admins never appear as normal logins.
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Env, HonoEnv } from '../types'
import { cookieBase } from './auth'
import { parseCookies, serializeClearCookie, serializeCookie } from './cookies'

export const ADMIN_COOKIE = 'tp_admin'
const ADMIN_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours

interface CookieOptions {
  maxAge?: number
  path?: string
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'Lax' | 'Strict' | 'None'
}

function cookieOptions(env: Env): CookieOptions {
  const base = cookieBase(env)
  // Max-Age matches the token TTL so a stale browser cookie dies on its own.
  return { ...base, maxAge: Math.floor(ADMIN_TTL_MS / 1000) }
}

// True when both admin vars are configured. The panel refuses to operate (and
// the login endpoint returns 503) rather than admitting everyone on a misconfig.
export function isAdminConfigured(env: Env): boolean {
  return Boolean(env.ADMIN_EMAIL?.trim() && env.ADMIN_KEY?.trim())
}

// ─── Constant-time comparisons ───────────────────────────────────────────────
// Web Crypto has no timingSafeEqual, so we compare SHA-256 digests instead:
// identical input length always hashes to fixed-size output before comparing.

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  )
  return bytesToHex(new Uint8Array(digest))
}

async function digestsEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256Hex(a), sha256Hex(b)])
  let diff = 0
  for (let i = 0; i < ha.length; i++) {
    diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i)
  }
  return diff === 0
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// ─── Credentials ─────────────────────────────────────────────────────────────

export async function verifyAdminCredentials(
  env: Env,
  email: unknown,
  key: unknown
): Promise<boolean> {
  if (!isAdminConfigured(env)) return false
  if (typeof email !== 'string' || typeof key !== 'string') return false

  const expectedEmail = env.ADMIN_EMAIL!.trim().toLowerCase()
  const [emailOk, keyOk] = await Promise.all([
    digestsEqual(email.trim().toLowerCase(), expectedEmail),
    digestsEqual(key, env.ADMIN_KEY!),
  ])
  return emailOk && keyOk
}

// ─── Signed cookie token ─────────────────────────────────────────────────────
// Payload is `${expiresAtMs}.${hex(hmac(secret, 'tp_admin:${expiresAtMs}'))}`.
// ADMIN_KEY signs it when present, falling back to SESSION_SECRET.

async function hmacKey(env: Env): Promise<CryptoKey> {
  const secret = env.ADMIN_KEY?.trim() || env.SESSION_SECRET || ''
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

async function signPayload(env: Env, payload: string): Promise<string> {
  const key = await hmacKey(env)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return bytesToHex(new Uint8Array(sig))
}

export async function createAdminCookieValue(env: Env): Promise<{ value: string }> {
  const expiresAtMs = Date.now() + ADMIN_TTL_MS
  const payload = String(expiresAtMs)
  const sig = await signPayload(env, `tp_admin:${payload}`)
  return { value: `${payload}.${sig}` }
}

export async function isValidAdminToken(env: Env, raw: string | undefined): Promise<boolean> {
  if (!raw) return false
  const dot = raw.indexOf('.')
  if (dot <= 0) return false
  const payload = raw.slice(0, dot)
  const sig = raw.slice(dot + 1)

  const expiresAtMs = Number(payload)
  if (!Number.isSafeInteger(expiresAtMs) || expiresAtMs <= Date.now()) return false

  const expected = await signPayload(env, `tp_admin:${payload}`)
  // Compare digests to stay length-independent / timing-safe.
  return digestsEqual(sig, expected)
}

function readAdminCookie(c: Context<HonoEnv>): string | undefined {
  return parseCookies(c.req.header('Cookie'))[ADMIN_COOKIE]
}

// Guard used by every protected /api/admin route. Returns nothing or throws 401
// (mirrors requireAuth's style in lib/auth.ts).
export async function requireAdmin(c: Context<HonoEnv>): Promise<void> {
  const ok = await isValidAdminToken(c.env, readAdminCookie(c))
  if (!ok) {
    throw new HTTPException(401, { res: c.json({ error: 'Admin authentication required' }, 401) })
  }
}

export function setAdminCookie(c: Context<HonoEnv>, value: string): void {
  c.header('Set-Cookie', serializeCookie(ADMIN_COOKIE, value, cookieOptions(c.env)), {
    append: true,
  })
}

export function clearAdminCookie(c: Context<HonoEnv>): void {
  c.header('Set-Cookie', serializeClearCookie(ADMIN_COOKIE, cookieBase(c.env)), {
    append: true,
  })
}

export function isAuthenticatedAdmin(c: Context<HonoEnv>): Promise<boolean> {
  return isValidAdminToken(c.env, readAdminCookie(c))
}
// Session helpers + Hono auth middleware.
import { eq } from 'drizzle-orm'
import type { Context, MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { createDb, type Db } from '../db'
import { users, sessions, authNonces } from '@telepost/db'
import type { Env, HonoEnv, SessionUser } from '../types'
import { parseCookies, serializeCookie, serializeClearCookie } from './cookies'

export const SESSION_COOKIE = 'tp_session'
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30 // 30 days

function isSecure(env: Env): boolean {
  return env.ENVIRONMENT !== 'development'
}

export function cookieBase(env: Env): CookieOptions {
  const isProd = isSecure(env)
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ('None' as const) : ('Lax' as const),
    path: '/',
  }
}

interface CookieOptions {
  maxAge?: number
  path?: string
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'Lax' | 'Strict' | 'None'
}

function makeSessionDb(c: Context<HonoEnv>): Db {
  return createDb(c.env.DB)
}

export async function getSessionUser(
  c: Context<HonoEnv>
): Promise<SessionUser | null> {
  const cookie = parseCookies(c.req.header('Cookie'))[SESSION_COOKIE]
  if (!cookie) return null

  const db = makeSessionDb(c)
  const rows = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, cookie))
    .limit(1)

  const found = rows[0]
  if (!found) return null
  if (new Date(found.session.expiresAt).getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, found.session.id))
    return null
  }

  const u = found.user
  return {
    id: u.id,
    telegramId: u.telegramId,
    username: u.telegramUsername,
    displayName: u.displayName,
  }
}

export async function createSession(
  c: Context<HonoEnv>,
  userId: string
): Promise<void> {
  const id = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toISOString()
  await makeSessionDb(c).insert(sessions).values({ id, userId, expiresAt })

  c.header('Set-Cookie', serializeCookie(SESSION_COOKIE, id, cookieBase(c.env)), {
    append: true,
  })
}

export async function destroySession(
  c: Context<HonoEnv>,
  sessionId: string | null
): Promise<void> {
  if (sessionId) {
    await makeSessionDb(c).delete(sessions).where(eq(sessions.id, sessionId))
  }
  c.header('Set-Cookie', serializeClearCookie(SESSION_COOKIE, cookieBase(c.env)), {
    append: true,
  })
}

export function sessionMiddleware(): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const user = await getSessionUser(c)
    if (user) c.set('user', user)
    await next()
  }
}

// Guard for protected routes; returns the user or throws a 401 (handled by Hono).
export async function requireAuth(
  c: Context<HonoEnv>
): Promise<SessionUser> {
  const user = c.get('user')
  if (!user) {
    throw new HTTPException(401, { res: c.json({ error: 'Unauthorized' }, 401) })
  }
  return user
}

// Upsert a Telegram user and return the row.
export async function findOrCreateUser(
  db: Db,
  telegramId: number,
  username: string | null,
  displayName: string,
  avatarUrl: string | null
): Promise<typeof users.$inferSelect> {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1)

  if (existing[0]) {
    const row = existing[0]
    await db
      .update(users)
      .set({
        telegramUsername: username ?? row.telegramUsername,
        displayName,
        avatarUrl: avatarUrl ?? row.avatarUrl,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, row.id))
    return row
  }

  const inserted = await db
    .insert(users)
    .values({ telegramId, telegramUsername: username, displayName, avatarUrl })
    .returning()
  return inserted[0]!
}

// Mark a login nonce as consumed (optionally attaching the resulting session/user).
export async function consumeNonce(
  db: Db,
  nonceId: string,
  params: { sessionId?: string; userId?: string }
): Promise<void> {
  await db
    .update(authNonces)
    .set({
      sessionId: params.sessionId,
      userId: params.userId,
      consumedAt: new Date().toISOString(),
    })
    .where(eq(authNonces.id, nonceId))
}
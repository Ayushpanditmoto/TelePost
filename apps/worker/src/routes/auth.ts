import { Hono } from 'hono'
import type { Env } from '../types'

export const authRoutes = new Hono<{ Bindings: Env }>()

// POST /api/auth/telegram
// Verify Telegram login widget hash, create/find user, issue session cookie
authRoutes.post('/telegram', async (c) => {
  // TODO Phase 2: verify HMAC, create session
  return c.json({ message: 'Auth not yet implemented' }, 501)
})

// POST /api/auth/logout
authRoutes.post('/logout', async (c) => {
  // TODO Phase 2: clear session cookie
  return c.json({ message: 'Logout not yet implemented' }, 501)
})

// GET /api/auth/me
authRoutes.get('/me', async (c) => {
  // TODO Phase 2: return current user from session
  return c.json({ message: 'Session not yet implemented' }, 501)
})

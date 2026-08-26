import { Hono } from 'hono'
import type { Env } from '../types'

export const botRoutes = new Hono<{ Bindings: Env }>()

// GET /api/bots
botRoutes.get('/', async (c) => {
  return c.json({ message: 'Bots not yet implemented' }, 501)
})

// POST /api/bots — connect a new bot
botRoutes.post('/', async (c) => {
  // TODO Phase 4: validate token with Telegram getMe, encrypt, store
  return c.json({ message: 'Bot connection not yet implemented' }, 501)
})

// DELETE /api/bots/:id
botRoutes.delete('/:id', async (c) => {
  return c.json({ message: 'Bot deletion not yet implemented' }, 501)
})

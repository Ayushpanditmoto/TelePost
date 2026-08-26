import { Hono } from 'hono'
import type { Env } from '../types'

export const channelRoutes = new Hono<{ Bindings: Env }>()

// GET /api/channels
channelRoutes.get('/', async (c) => {
  return c.json({ message: 'Channels not yet implemented' }, 501)
})

// POST /api/channels — connect a channel
channelRoutes.post('/', async (c) => {
  return c.json({ message: 'Channel connection not yet implemented' }, 501)
})

// GET /api/channels/:id
channelRoutes.get('/:id', async (c) => {
  return c.json({ message: 'Channel not yet implemented' }, 501)
})

// DELETE /api/channels/:id
channelRoutes.delete('/:id', async (c) => {
  return c.json({ message: 'Channel deletion not yet implemented' }, 501)
})

// POST /api/channels/:id/verify — send test message
channelRoutes.post('/:id/verify', async (c) => {
  return c.json({ message: 'Channel verification not yet implemented' }, 501)
})

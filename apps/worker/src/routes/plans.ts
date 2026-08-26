import { Hono } from 'hono'
import type { Env } from '../types'

export const planRoutes = new Hono<{ Bindings: Env }>()

// GET /api/plans
planRoutes.get('/', async (c) => {
  return c.json({ message: 'Plans not yet implemented' }, 501)
})

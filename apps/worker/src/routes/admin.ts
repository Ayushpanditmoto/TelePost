import { Hono } from 'hono'
import type { Env } from '../types'

export const adminRoutes = new Hono<{ Bindings: Env }>()

// GET /api/admin/users
adminRoutes.get('/users', async (c) => {
  return c.json({ message: 'Admin users not yet implemented' }, 501)
})

// GET /api/admin/posts
adminRoutes.get('/posts', async (c) => {
  return c.json({ message: 'Admin posts not yet implemented' }, 501)
})

// GET /api/admin/payments
adminRoutes.get('/payments', async (c) => {
  return c.json({ message: 'Admin payments not yet implemented' }, 501)
})

// GET /api/admin/analytics
adminRoutes.get('/analytics', async (c) => {
  return c.json({ message: 'Admin analytics not yet implemented' }, 501)
})

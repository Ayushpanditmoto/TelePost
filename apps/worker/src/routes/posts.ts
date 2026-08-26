import { Hono } from 'hono'
import type { Env } from '../types'

export const postRoutes = new Hono<{ Bindings: Env }>()

// GET /api/posts
postRoutes.get('/', async (c) => {
  return c.json({ message: 'Posts not yet implemented' }, 501)
})

// POST /api/posts — create post
postRoutes.post('/', async (c) => {
  return c.json({ message: 'Post creation not yet implemented' }, 501)
})

// GET /api/posts/:id
postRoutes.get('/:id', async (c) => {
  return c.json({ message: 'Post not yet implemented' }, 501)
})

// PATCH /api/posts/:id
postRoutes.patch('/:id', async (c) => {
  return c.json({ message: 'Post update not yet implemented' }, 501)
})

// DELETE /api/posts/:id
postRoutes.delete('/:id', async (c) => {
  return c.json({ message: 'Post deletion not yet implemented' }, 501)
})

// POST /api/posts/:id/publish — publish immediately
postRoutes.post('/:id/publish', async (c) => {
  return c.json({ message: 'Post publish not yet implemented' }, 501)
})

// POST /api/posts/:id/schedule — schedule post
postRoutes.post('/:id/schedule', async (c) => {
  return c.json({ message: 'Post scheduling not yet implemented' }, 501)
})

// POST /api/posts/:id/reschedule
postRoutes.post('/:id/reschedule', async (c) => {
  return c.json({ message: 'Post reschedule not yet implemented' }, 501)
})

// POST /api/posts/:id/cancel
postRoutes.post('/:id/cancel', async (c) => {
  return c.json({ message: 'Post cancel not yet implemented' }, 501)
})

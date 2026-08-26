import { Hono } from 'hono'
import { asc, eq } from 'drizzle-orm'
import { createDb } from '../db'
import { plans } from '@telepost/db'
import type { HonoEnv } from '../types'

export const planRoutes = new Hono<HonoEnv>()

// GET /api/plans — public: powers the pricing page (no auth required).
planRoutes.get('/', async (c) => {
  const db = createDb(c.env.DB)

  const rows = await db
    .select()
    .from(plans)
    .where(eq(plans.active, true))
    .orderBy(asc(plans.price))

  return c.json({ plans: rows })
})
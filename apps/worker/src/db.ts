import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'
import type { Session } from '@telepost/db'
import * as schema from '@telepost/db'

export type Db = DrizzleD1Database<typeof schema>

export function createDb(db: D1Database): Db {
  return drizzle(db, { schema })
}

export type SessionRow = Session
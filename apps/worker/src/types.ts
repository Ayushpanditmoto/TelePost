export interface Env {
  DB: D1Database
  MEDIA_BUCKET: R2Bucket
  ENVIRONMENT: string
  /** Primary web app origin, e.g. https://telepost.app */
  APP_URL?: string
  /** Comma-separated list of origins allowed to call the API. Falls back to APP_URL when unset. */
  CORS_ORIGINS?: string
    TOKEN_ENCRYPTION_KEY: string
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_WEBHOOK_SECRET: string
  SESSION_SECRET: string
}

export interface SessionUser {
  id: string
  telegramId: number
  username: string | null
  displayName: string
}

// Combined Hono environment: Cloudflare bindings + authenticated request user.
export interface HonoEnv {
  Bindings: Env
  Variables: {
    user?: SessionUser
  }
}

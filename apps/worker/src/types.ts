export interface Env {
  DB: D1Database
  MEDIA_BUCKET: R2Bucket
  ENVIRONMENT: string
  /** Primary web app origin used for CORS, e.g. https://telepost.app */
  APP_URL: string
  TOKEN_ENCRYPTION_KEY: string
  TELEGRAM_BOT_TOKEN: string
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

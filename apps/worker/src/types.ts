export interface Env {
  DB: D1Database
  MEDIA_BUCKET: R2Bucket
  POST_QUEUE: Queue
  ENVIRONMENT: string
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

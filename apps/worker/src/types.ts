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
  /** Admin panel login e-mail (matched case-insensitively against /admin login). */
  ADMIN_EMAIL?: string
  /** Shared secret required alongside ADMIN_EMAIL to unlock the admin panel. */
  ADMIN_KEY?: string
  /** Manual payment via TrustWallet QR — wallet address (TRC20 etc.) shown to users. */
  PAYMENT_ADDRESS?: string
  /** Manual payment via TrustWallet QR — optional direct URL to the QR image. */
  PAYMENT_QR_URL?: string
  /** Optional network label, e.g. "TRON (TRC20) · USDT". */
  PAYMENT_NETWORK?: string
  /** Optional instruction note shown with the payment details. */
  PAYMENT_NOTE?: string
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

// Telegram Login Widget authentication.
// Reference: https://core.telegram.org/widgets/login#checking-authorization
//
// Verification steps:
//   1. secret_key = SHA256(TELEGRAM_BOT_TOKEN)
//   2. data_check_string = all received fields except `hash`, sorted by key,
//      joined as `key=value` separated by newlines.
//   3. calculated = HMAC-SHA256(secret_key, data_check_string)
//   4. Valid iff calculated (hex) equals the `hash` field.

const AUTH_MAX_AGE_SECONDS = 60 * 60 * 24 // Reject auth older than 24h (anti-replay)

export interface VerifiedTelegramUser {
  telegramId: number
  username: string | null
  displayName: string
  avatarUrl: string | null
}

export type TelegramAuthResult =
  | { ok: true; user: VerifiedTelegramUser }
  | { ok: false; error: string }

export async function verifyTelegramAuth(
  fields: Record<string, unknown>,
  botToken: string
): Promise<TelegramAuthResult> {
  const hash = typeof fields.hash === 'string' ? fields.hash : ''
  const authDateRaw = fields.auth_date
  const authDate =
    typeof authDateRaw === 'number' ? authDateRaw : Number(String(authDateRaw))

  if (!hash) return { ok: false, error: 'Missing hash' }
  if (!Number.isFinite(authDate)) return { ok: false, error: 'Missing auth_date' }

  const now = Math.floor(Date.now() / 1000)
  if (now - authDate > AUTH_MAX_AGE_SECONDS) {
    return { ok: false, error: 'Auth payload is stale' }
  }

  const id = Number(fields.id)
  if (!Number.isSafeInteger(id) || id <= 0) {
    return { ok: false, error: 'Invalid id' }
  }

  // Build the `data_check_string` (exclude `hash`).
  const dataCheckString =
    Object.keys(fields)
      .filter((k) => k !== 'hash')
      .sort()
      .map((k) => `${k}=${fields[k] ?? ''}`)
      .join('\n')

  const expected = await hmac(botToken, dataCheckString)
  const provided = hexToBytes(hash)

  if (provided.length !== expected.length || !bytesAreEqual(provided, expected)) {
    return { ok: false, error: 'Invalid hash' }
  }

  const firstName = stringOrNull(fields.first_name)
  const lastName = stringOrNull(fields.last_name)
  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim()

  return {
    ok: true,
    user: {
      telegramId: id,
      username: stringOrNull(fields.username),
      displayName: displayName.length > 0 ? displayName : 'Telegram User',
      avatarUrl: stringOrNull(fields.photo_url),
    },
  }
}

// ─── Crypto primitives (Web Crypto, available under nodejs_compat) ──────────

async function hmac(botToken: string, data: string): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const secretBytes = await crypto.subtle.digest('SHA-256', encoder.encode(botToken))
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return new Uint8Array(signature)
}

function bytesAreEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  }
  return diff === 0
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor(hex.length / 2))
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function stringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
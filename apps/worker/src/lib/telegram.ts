// Minimal Telegram Bot API client for the Cloudflare Worker.

interface TelegramError {
  ok: false
  error_code?: number
  description?: string
}

interface TelegramSuccess<T> {
  ok: true
  result: T
}

export type TelegramResponse<T> = TelegramSuccess<T> | TelegramError

export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
}

const API_BASE = 'https://api.telegram.org'

export async function callTelegram<T>(
  token: string,
  method: string,
  params: Record<string, unknown> = {}
): Promise<TelegramResponse<T>> {
  const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  // Handle non-JSON error responses defensively.
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    const text = await res.text()
    return { ok: false, error_code: res.status, description: text.slice(0, 500) }
  }

  return (await res.json()) as TelegramResponse<T>
}

export function getMe(token: string): Promise<TelegramResponse<TelegramUser>> {
  return callTelegram<TelegramUser>(token, 'getMe')
}
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

export interface TelegramChat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
}

export function getChat(token: string, chatId: string): Promise<TelegramResponse<TelegramChat>> {
  return callTelegram<TelegramChat>(token, 'getChat', { chat_id: chatId })
}

export interface TelegramChatMember {
  status: 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked'
  user?: { id: number }
}

export function getChatMember(
  token: string,
  chatId: string,
  userId: number
): Promise<TelegramResponse<TelegramChatMember>> {
  return callTelegram<TelegramChatMember>(token, 'getChatMember', {
    chat_id: chatId,
    user_id: userId,
  })
}

export interface TelegramMessage {
  message_id: number
  chat: { id: number }
  text?: string
}

export function sendMessage(
  token: string,
  chatId: string,
  text: string,
  opts: Record<string, unknown> = {}
): Promise<TelegramResponse<TelegramMessage>> {
  return callTelegram<TelegramMessage>(token, 'sendMessage', {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
    ...opts,
  })
}
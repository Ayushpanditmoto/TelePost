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

function parseTelegramResponse<T>(res: Response): Promise<TelegramResponse<T>> {
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return res.text().then((text) => ({
      ok: false as const,
      error_code: res.status,
      description: text.slice(0, 500),
    }))
  }
  return res.json() as Promise<TelegramResponse<T>>
}

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
  return parseTelegramResponse<T>(res)
}

// Send binary media (photo/video) via multipart upload — used by the publisher
// when a post has R2-attached media.
export async function sendMedia(
  token: string,
  method: 'sendPhoto' | 'sendVideo',
  chatId: string,
  bytes: ArrayBuffer,
  filename: string,
  mimeType: string,
  caption?: string
): Promise<TelegramResponse<TelegramMessage>> {
  const form = new FormData()
  form.append('chat_id', chatId)
  form.append(
    method === 'sendVideo' ? 'video' : 'photo',
    new Blob([bytes], { type: mimeType }),
    filename
  )
  if (caption && caption.length > 0) {
    // Telegram caps media captions at 1024 characters.
    form.append('caption', caption.slice(0, 1024))
  }

  const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
    method: 'POST',
    body: form,
  })
  return parseTelegramResponse<TelegramMessage>(res)
}

export function getMe(token: string): Promise<TelegramResponse<TelegramUser>> {
  return callTelegram<TelegramUser>(token, 'getMe')
}

// ChatFullInfo.photo for channels/supergroups with a visible avatar.
export interface TelegramChatPhoto {
  small_file_id: string
  small_file_unique_id?: string
  big_file_id: string
  big_file_unique_id?: string
}

export interface TelegramChat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
  photo?: TelegramChatPhoto
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

// Delete a previously sent message (bots may delete their own messages in
// channels/supergroups where they are admins, within 48 hours of posting).
export function deleteMessage(
  token: string,
  chatId: string,
  messageId: number
): Promise<TelegramResponse<true>> {
  return callTelegram<true>(token, 'deleteMessage', {
    chat_id: chatId,
    message_id: messageId,
  })
}

// Bot API getChatMemberCount: current subscriber/member count for a channel
// or supergroup (the bot must be an admin there — it always is, by design).
export function getChatMemberCount(
  token: string,
  chatId: string
): Promise<TelegramResponse<number>> {
  return callTelegram<number>(token, 'getChatMemberCount', { chat_id: chatId })
}

// Bot API getFile: resolves a file_id to a relative path downloadable from
// https://api.telegram.org/file/bot<token>/<path> (valid for ~1 hour).
export function getFile(
  token: string,
  fileId: string
): Promise<TelegramResponse<{ file_path?: string }>> {
  return callTelegram<{ file_path?: string }>(token, 'getFile', {
    file_id: fileId,
  })
}

// Download a file's bytes (chat photos etc.) via getFile + the file URL.
export async function downloadTelegramFile(
  token: string,
  fileId: string
): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  const meta = await getFile(token, fileId)
  if (!meta.ok || !meta.result.file_path) return null

  const res = await fetch(`${API_BASE}/file/bot${token}/${meta.result.file_path}`)
  if (!res.ok) return null

  return {
    bytes: await res.arrayBuffer(),
    contentType: res.headers.get('content-type') ?? 'image/jpeg',
  }
}
// Publishing pipeline, part 2: queue consumer — send to Telegram and record outcome.
import { eq } from 'drizzle-orm'
import { createDb } from '../db'
import { postMedia, posts, telegramChannels } from '@telepost/db'
import type { Env } from '../types'
import {
  sendMessage,
  sendMedia,
  sendMediaGroup,
  type TelegramResponse,
  type TelegramMessage,
} from './telegram'
import type { PublishClaim } from './publish'

// Telegram error codes worth retrying (transient) vs permanent rejections.
const TRANSIENT_ERROR_CODES = new Set([429, 500, 502, 503, 504])
const MAX_RETRIES = 3

export type PublishDisposition = 'published' | 'retry-scheduled' | 'failed' | 'skipped'

function nowIso(): string {
  return new Date().toISOString()
}

async function markFailed(
  db: ReturnType<typeof createDb>,
  postId: string,
  errorMessage: string,
  retryCount: number
): Promise<void> {
  await db
    .update(posts)
    .set({ status: 'failed', errorMessage, retryCount, updatedAt: nowIso() })
    .where(eq(posts.id, postId))
}

/**
 * Process one queue message: load post + channel + bot, decrypt the token,
 * deliver to Telegram (text or media), record the outcome.
 */
export async function processPublishMessage(
  env: Env,
  msg: PublishClaim
): Promise<PublishDisposition> {
  const db = createDb(env.DB)

  const [post] = await db.select().from(posts).where(eq(posts.id, msg.postId)).limit(1)
  // Deleted mid-flight, or a stale duplicate of an older publish attempt.
  if (!post || post.idempotencyKey !== msg.idempotencyKey) return 'skipped'
  if (post.status === 'published' || post.status === 'cancelled') return 'skipped'

  const [channel] = await db
    .select()
    .from(telegramChannels)
    .where(eq(telegramChannels.id, post.channelId))
    .limit(1)
  if (!channel) {
    await markFailed(db, post.id, 'Channel no longer exists', post.retryCount)
    return 'failed'
  }

  // Publish through the platform's own bot (@Panditfxbot) — no per-user tokens.
  const token = env.TELEGRAM_BOT_TOKEN

  let result: TelegramResponse<TelegramMessage>
  try {
    result = await deliverPost(env, token, channel.telegramChatId, post.content, post.id)
  } catch (err) {
    result = { ok: false, description: err instanceof Error ? err.message : String(err) }
  }

  if (result.ok && result.result?.message_id) {
    await db
      .update(posts)
      .set({
        status: 'published',
        publishedAt: nowIso(),
        telegramMessageId: result.result.message_id,
        errorMessage: null,
        updatedAt: nowIso(),
      })
      .where(eq(posts.id, post.id))
    return 'published'
  }

  const description =
    !result.ok && result.description ? result.description : 'Unknown Telegram error'
  const errorCode = !result.ok ? result.error_code : undefined
  const transient =
    errorCode !== undefined && TRANSIENT_ERROR_CODES.has(errorCode)

  const retryCount = post.retryCount + 1

  // Permanent rejection or retries exhausted → fail for good.
  if (!transient || retryCount >= MAX_RETRIES) {
    await markFailed(db, post.id, description, retryCount)
    return 'failed'
  }

  // Transient failure → hand back to cron with a short delay.
  await db
    .update(posts)
    .set({
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 60_000).toISOString(),
      errorMessage: description,
      retryCount,
      updatedAt: nowIso(),
    })
    .where(eq(posts.id, post.id))
  return 'retry-scheduled'
}

// Send text, or media+caption when the post has R2 attachments.
async function deliverPost(
  env: Env,
  token: string,
  chatId: string,
  content: string,
  postId: string
): Promise<TelegramResponse<TelegramMessage>> {
  const db = createDb(env.DB)
  const mediaRows = await db.select().from(postMedia).where(eq(postMedia.postId, postId))

  if (mediaRows.length === 0) {
    return sendMessage(token, chatId, content)
  }

  if (mediaRows.length === 0) {
    return sendMessage(token, chatId, content)
  }

  const items: Array<{
    bytes: ArrayBuffer
    filename: string
    mimeType: string
    caption?: string
  }> = []
  for (const media of mediaRows) {
    const obj = await env.MEDIA_BUCKET.get(media.r2Key)
    if (!obj) {
      return { ok: false, description: `Media missing from storage: ${media.r2Key}` }
    }
    items.push({
      bytes: await obj.arrayBuffer(),
      filename: media.r2Key.split('/').pop() ?? 'media',
      mimeType: media.mimeType,
      ...(items.length === 0 ? { caption: content } : {}),
    })
  }

  // Telegram accepts at most 10 items per media group.
  let firstMessage: TelegramMessage | undefined
  for (let i = 0; i < items.length; i += 10) {
    const result =
      items.length === 1
        ? await sendMedia(
            token,
            items[0]!.mimeType.startsWith('video/') ? 'sendVideo' : 'sendPhoto',
            chatId,
            items[0]!.bytes,
            items[0]!.filename,
            items[0]!.mimeType,
            items[0]!.caption
          )
        : await sendMediaGroup(token, chatId, items.slice(i, i + 10))
    if (!result.ok) return result
    if (!firstMessage) {
      firstMessage = Array.isArray(result.result) ? result.result[0] : result.result
    }
  }

  return firstMessage
    ? { ok: true, result: firstMessage }
    : { ok: false, description: 'Telegram returned no media message' }
}
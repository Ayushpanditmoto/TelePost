// R2 media upload helpers for post attachments.
import type { Context } from 'hono'
import { createDb, type Db } from '../db'
import { postMedia } from '@telepost/db'
import type { Env, HonoEnv } from '../types'
import { downloadTelegramFile, type TelegramChatPhoto } from './telegram'

export const MAX_MEDIA_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB per file

const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
])

export type UploadMediaResult =
  | { ok: true; mediaId: string; r2Key: string }
  | { ok: false; error: string; status: 400 | 403 | 413 | 415 | 500 }

// Upload a single file to R2 and record it in post_media.
export async function uploadPostMedia(
  c: Context<HonoEnv>,
  postId: string,
  file: File,
): Promise<UploadMediaResult> {
  const { MEDIA_BUCKET } = c.env

  const mimeType = file.type
  if (!ACCEPTED_MIME_TYPES.has(mimeType)) {
    return { ok: false, error: `Unsupported file type "${mimeType}"`, status: 415 }
  }
  if (file.size > MAX_MEDIA_SIZE_BYTES) {
    return { ok: false, error: 'File exceeds 50 MB limit', status: 413 }
  }

  const ext = mimeType.startsWith('video') ? 'mp4' : mimeType.split('/')[1] ?? 'bin'
  const r2Key = `${postId}/${crypto.randomUUID()}.${ext}`

  await MEDIA_BUCKET.put(r2Key, file.stream(), {
    httpMetadata: { contentType: mimeType },
  })

  const db: Db = createDb(c.env.DB)
  const [row] = await db
    .insert(postMedia)
    .values({
      postId,
      r2Key,
      mimeType,
      fileSizeBytes: file.size,
    })
    .returning()

  if (!row) {
    return { ok: false, error: 'Failed to record media', status: 500 }
  }

  return { ok: true, mediaId: row.id, r2Key: row.r2Key }
}

// Download a chat's profile photo from the Bot API and cache it in R2 under
// channel-photos/<channelId>. Returns the R2 key, or null when the chat has
// no photo (or the download fails) — callers treat null as "no photo".
export async function storeChannelPhoto(
  env: Env,
  photo: TelegramChatPhoto | null | undefined,
  channelId: string
): Promise<string | null> {
  const fileId = photo?.small_file_id || photo?.big_file_id
  if (!fileId) return null

  try {
    const file = await downloadTelegramFile(env.TELEGRAM_BOT_TOKEN, fileId)
    if (!file) return null

    const key = `channel-photos/${channelId}`
    await env.MEDIA_BUCKET.put(key, file.bytes, {
      httpMetadata: { contentType: file.contentType },
    })
    return key
  } catch {
    return null
  }
}
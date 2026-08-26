// AES-256-GCM encryption for secrets (e.g. Telegram bot tokens).
// Uses TOKEN_ENCRYPTION_KEY from env, hashed to a fixed 32-byte key.

import type { Env } from '../types'

const IV_LENGTH = 12

async function getEncryptionKey(env: Env): Promise<CryptoKey> {
  const raw = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(env.TOKEN_ENCRYPTION_KEY)
  )
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
}

// Returns base64(`${iv}${ciphertext}`) — iv is prepended for decryption.
export async function encryptSecret(env: Env, plaintext: string): Promise<string> {
  const key = await getEncryptionKey(env)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  )

  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.length)

  return bytesToBase64(combined)
}

export async function decryptSecret(env: Env, stored: string): Promise<string> {
  const combined = base64ToBytes(stored)
  if (combined.length < IV_LENGTH) throw new Error('Invalid encrypted secret')

  const iv = combined.slice(0, IV_LENGTH)
  const ciphertext = combined.slice(IV_LENGTH)
  const key = await getEncryptionKey(env)

  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}

// ─── base64 helpers ──────────────────────────────────────────────────────────

function bytesToBase64(bytes: Uint8Array): string {
  // Chunked to avoid call-stack overflow for large inputs.
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
// Typed fetch wrapper for the TelePost worker API.
// Normalise the configured base so it never ends with a trailing slash AND never
// carries a stray `/api` segment — all request paths already begin with `/api/...`,
// so a base like `https://...workers.dev/api` would otherwise double up to
// `.../api/api/...` and 404.
const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787')
    .replace(/\/+$/, '')
    .replace(/\/api$/, '')

export const API_URL = API_BASE

export interface SessionUser {
  id: string
  telegramId: number
  username: string | null
  displayName: string
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  })

  const data = (await res.json().catch(() => null)) as T | { error?: string } | null

  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `Request failed (${res.status})`
    throw new ApiError(res.status, message)
  }

  return data as T
}
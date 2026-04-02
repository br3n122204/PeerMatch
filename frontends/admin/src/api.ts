export type AuthUser = {
  id: string
  name: string
  email: string
  role: string
  verified?: boolean
}

function apiBase(): string {
  // `next build` runs TypeScript checks on the whole repo and may not load Vite's `ImportMeta` types.
  // Cast here so the admin API client can still compile under both environments.
  const env = (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env
  return env?.VITE_API_BASE_URL || 'http://localhost:5000'
}

export class ApiError extends Error {
  status: number
  payload?: unknown
  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

async function parseJsonResponse(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json().catch(() => undefined)
  }
  return res.text().catch(() => undefined)
}

export async function apiPostJson<TResponse>(
  path: string,
  body: unknown,
  init?: Omit<RequestInit, 'method' | 'body' | 'headers'>,
): Promise<TResponse> {
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
      ...init,
    })
  } catch {
    throw new ApiError('Cannot reach the API. Is the backend running?', 0)
  }
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    const message =
      typeof (payload as { message?: string } | undefined)?.message === 'string'
        ? (payload as { message: string }).message
        : 'Request failed.'
    throw new ApiError(message, res.status, payload)
  }
  return payload as TResponse
}

export async function apiGetJson<TResponse>(
  path: string,
  init?: Omit<RequestInit, 'method' | 'headers'>,
): Promise<TResponse> {
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`
  let res: Response
  try {
    res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      ...init,
    })
  } catch {
    throw new ApiError('Cannot reach the API. Is the backend running?', 0)
  }
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    const message =
      typeof (payload as { message?: string } | undefined)?.message === 'string'
        ? (payload as { message: string }).message
        : 'Request failed.'
    throw new ApiError(message, res.status, payload)
  }
  return payload as TResponse
}

export async function apiPatchJson<TResponse>(
  path: string,
  body: unknown,
  init?: Omit<RequestInit, 'method' | 'body' | 'headers'>,
): Promise<TResponse> {
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`
  let res: Response
  try {
    res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
      ...init,
    })
  } catch {
    throw new ApiError('Cannot reach the API. Is the backend running?', 0)
  }
  const payload = await parseJsonResponse(res)
  if (!res.ok) {
    const message =
      typeof (payload as { message?: string } | undefined)?.message === 'string'
        ? (payload as { message: string }).message
        : 'Request failed.'
    throw new ApiError(message, res.status, payload)
  }
  return payload as TResponse
}

export async function apiSend(
  path: string,
  method: 'POST',
  init?: Omit<RequestInit, 'method' | 'body' | 'headers'>,
): Promise<void> {
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`
  let res: Response
  try {
    res = await fetch(url, {
      method,
      credentials: 'include',
      ...init,
    })
  } catch {
    throw new ApiError('Cannot reach the API. Is the backend running?', 0)
  }
  if (!res.ok) {
    const payload = await parseJsonResponse(res)
    const message =
      typeof (payload as { message?: string } | undefined)?.message === 'string'
        ? (payload as { message: string }).message
        : 'Request failed.'
    throw new ApiError(message, res.status, payload)
  }
}

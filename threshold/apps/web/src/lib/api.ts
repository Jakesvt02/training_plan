import { getAccessToken, getRefreshToken, updateAccessToken, clearAuth } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4003'

// Mutex — prevents concurrent requests from each triggering their own refresh
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return null

    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) {
      clearAuth()
      return null
    }

    const data = await res.json()
    updateAccessToken(data.data.accessToken, data.data.refreshToken)
    return data.data.accessToken
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token = getAccessToken()

  const makeRequest = async (t: string | null) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...options.headers,
      },
    })

  let res = await makeRequest(token)

  // Access token expired — try to refresh silently
  if (res.status === 401 && getRefreshToken()) {
    token = await refreshAccessToken()
    if (token) {
      res = await makeRequest(token)
    }
  }

  // If still 401 after refresh attempt, session is dead — boot to login
  if (res.status === 401) {
    clearAuth()
    window.location.href = '/login'
    throw new Error('Session expired')
  }

  const data = await res.json()
  if (!res.ok || !data.success) {
    const err = new Error(data.error || 'Request failed') as Error & {
      fields?: Record<string, string>
    }
    err.fields = data.fields
    throw err
  }
  return data.data as T
}

export function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  })
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET' })
}

export function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'DELETE',
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) })
}

const ACCESS_KEY = 'threshold_access_token'
const REFRESH_KEY = 'threshold_refresh_token'
const USER_KEY = 'threshold_user'

export interface StoredUser {
  id: string
  firstName: string
  lastName: string
  email: string
}

export function saveAuth(accessToken: string, refreshToken: string, user: StoredUser) {
  localStorage.setItem(ACCESS_KEY, accessToken)
  localStorage.setItem(REFRESH_KEY, refreshToken)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  // Cookie read by Next.js middleware for route protection
  document.cookie = `threshold_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
}

export function updateAccessToken(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken)
  localStorage.setItem(REFRESH_KEY, refreshToken)
  document.cookie = `threshold_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_KEY)
}

export function getUser(): StoredUser | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as StoredUser) : null
}

export function updateStoredUser(partial: Partial<Pick<StoredUser, 'firstName' | 'lastName'>>) {
  const current = getUser()
  if (!current) return
  const updated = { ...current, ...partial }
  localStorage.setItem(USER_KEY, JSON.stringify(updated))
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
  document.cookie = 'threshold_token=; path=/; max-age=0'
}

export function isLoggedIn(): boolean {
  return !!getAccessToken()
}

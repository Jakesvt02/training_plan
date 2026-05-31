'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { apiPost } from '@/lib/api'
import { saveAuth } from '@/lib/auth'
import type { AuthResponse } from '@threshold/shared'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await apiPost<AuthResponse>('/api/auth/login', { email, password })
      saveAuth(result.accessToken, result.refreshToken, result.user)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D0D0D' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#3A3A3A]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF3B30] to-[#FF8C00] flex items-center justify-center font-black text-white text-sm">
            T
          </div>
          <span className="font-bold text-lg tracking-tight">THRESHOLD</span>
        </div>
        <p className="text-xs sm:text-sm text-gray-400">
          No account?{' '}
          <Link href="/register" className="text-[#FF3B30] hover:underline font-medium">
            Sign up free
          </Link>
        </p>
      </nav>

      {/* Centred form */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl sm:text-3xl font-black mb-1">Welcome back</h1>
          <p className="text-gray-400 text-sm mb-8">Sign in to your Threshold account</p>

          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Email address" type="email" placeholder="jaco@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
            <Input
              label="Password" type="password" placeholder="Your password"
              value={password} onChange={e => setPassword(e.target.value)} required
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-bold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>
        </div>
      </main>

    </div>
  )
}

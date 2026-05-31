'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearAuth, getUser } from '@/lib/auth'
import type { StoredUser } from '@/lib/auth'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '▣' },
  { href: '/dashboard/checkin', label: 'Check-in', icon: '◎' },
  { href: '/dashboard/plan', label: 'Plan', icon: '📅' },
  { href: '/dashboard/activities', label: 'Activities', icon: '⚡' },
  { href: '/dashboard/log', label: 'History', icon: '📋' },
  { href: '/dashboard/measurements', label: 'Body', icon: '⚖' },
  { href: '/dashboard/nutrition', label: 'Nutrition', icon: '🥗' },
  { href: '/dashboard/integrations', label: 'Integrations', icon: '⟳' },
  { href: '/dashboard/profile', label: 'Profile', icon: '◉' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<StoredUser | null>(null)

  useEffect(() => {
    setUser(getUser())
  }, [pathname])

  function logout() {
    clearAuth()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D0D0D', color: '#F5F5F5' }}>

      {/* Top bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#1E1E1E]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF3B30] to-[#FF8C00] flex items-center justify-center font-black text-white text-sm">
            T
          </div>
          <span className="font-bold tracking-tight hidden sm:block">THRESHOLD</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                pathname === n.href
                  ? 'bg-[#1E1E1E] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#1E1E1E]'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-gray-400 hidden sm:block">
              {user.firstName}
            </span>
          )}
          <button
            onClick={logout}
            className="text-sm text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-[#1E1E1E] cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Page content — keyed on pathname so the animation reruns on each nav */}
      <main className="flex-1 px-4 sm:px-6 py-6 pb-24 sm:pb-6 max-w-5xl mx-auto w-full">
        <div key={pathname} className="page-enter">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav — keep to 5 items max */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-[#1E1E1E] flex" style={{ background: '#0D0D0D' }}>
        {NAV.filter(n => ['/dashboard', '/dashboard/checkin', '/dashboard/plan', '/dashboard/log', '/dashboard/profile'].includes(n.href)).map(n => (
          <Link
            key={n.href}
            href={n.href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition ${
              pathname === n.href ? 'text-[#FF3B30]' : 'text-gray-500'
            }`}
          >
            <span className="text-lg leading-none">{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

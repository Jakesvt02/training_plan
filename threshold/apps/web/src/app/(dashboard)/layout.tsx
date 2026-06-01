'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearAuth, getUser } from '@/lib/auth'
import type { StoredUser } from '@/lib/auth'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/dashboard/checkin', label: 'Check-in', icon: '◎' },
  { href: '/dashboard/plan', label: 'Plan', icon: '▦' },
  { href: '/dashboard/activities', label: 'Activities', icon: '◈' },
  { href: '/dashboard/log', label: 'History', icon: '≡' },
  { href: '/dashboard/measurements', label: 'Body', icon: '⊡' },
  { href: '/dashboard/nutrition', label: 'Nutrition', icon: '◑' },
  { href: '/dashboard/integrations', label: 'Integrations', icon: '↺' },
  { href: '/dashboard/profile', label: 'Profile', icon: '◉' },
]

// Items shown directly in the bottom tab bar
const BOTTOM_PRIMARY = ['/dashboard', '/dashboard/checkin', '/dashboard/plan', '/dashboard/nutrition']

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setUser(getUser())
  }, [pathname])

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  function logout() {
    clearAuth()
    router.push('/login')
  }

  const primaryNav = NAV.filter(n => BOTTOM_PRIMARY.includes(n.href))
  const drawerNav = NAV.filter(n => !BOTTOM_PRIMARY.includes(n.href))
  const isMoreActive = drawerNav.some(n => pathname === n.href)

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

      {/* Page content */}
      <main className="flex-1 px-4 sm:px-6 py-6 pb-24 sm:pb-6 max-w-5xl mx-auto w-full">
        <div key={pathname} className="page-enter">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-[#1E1E1E] flex" style={{ background: '#0D0D0D' }}>
        {primaryNav.map(n => (
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
        {/* More tab */}
        <button
          onClick={() => setDrawerOpen(o => !o)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition cursor-pointer ${
            isMoreActive || drawerOpen ? 'text-[#FF3B30]' : 'text-gray-500'
          }`}
        >
          <span className="text-lg leading-none">☰</span>
          More
        </button>
      </nav>

      {/* Mobile "More" drawer — slides up from bottom */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="sm:hidden fixed inset-0 z-40 bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Sheet */}
          <div
            className="sm:hidden fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl border-t border-x border-[#2A2A2A] py-4"
            style={{ background: '#141414' }}
          >
            <div className="w-10 h-1 rounded-full bg-[#333] mx-auto mb-4" />
            {user && (
              <div className="px-4 pb-3 border-b border-[#1E1E1E] mb-2">
                <p className="text-sm font-semibold text-white">{user.firstName}</p>
                <p className="text-xs text-gray-500">Signed in</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-1 px-3">
              {drawerNav.map(n => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex flex-col items-center gap-1.5 py-4 px-2 rounded-xl text-xs font-medium transition ${
                    pathname === n.href
                      ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
                      : 'text-gray-400 active:bg-[#1E1E1E]'
                  }`}
                >
                  <span className="text-2xl leading-none">{n.icon}</span>
                  {n.label}
                </Link>
              ))}
            </div>
            <div className="px-4 mt-3 pt-3 border-t border-[#1E1E1E]">
              <button
                onClick={logout}
                className="w-full py-3 rounded-xl text-sm font-medium text-gray-400 border border-[#2A2A2A] hover:border-[#FF3B30] hover:text-white transition cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiGet, apiPost } from '@/lib/api'
import type { DeviceConnection } from '@threshold/shared'

interface ConnectionStatus {
  provider: string
  connected: boolean
  providerUserId?: string | null
}

const PROVIDERS = [
  {
    id: 'strava',
    name: 'Strava',
    description: 'Sync runs, rides, workouts. Automatically calculates TSS and training load.',
    color: '#FC4C02',
    logo: '🏃',
  },
  {
    id: 'polar',
    name: 'Polar',
    description: 'Sync heart rate, HRV, nightly recharge, sleep, and training load data.',
    color: '#C00000',
    logo: '❤',
  },
]

export default function IntegrationsPage() {
  const searchParams = useSearchParams()
  const [connections, setConnections] = useState<ConnectionStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    if (connected) setToast(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected!`)
    if (error) setToast(`Connection failed: ${error.replace('_', ' ')}`)

    loadConnections()
  }, [searchParams])

  async function loadConnections() {
    try {
      const data = await apiGet<DeviceConnection[]>('/api/integrations/connections')
      const status = PROVIDERS.map(p => ({
        provider: p.id,
        connected: data.some(c => c.provider === p.id),
        providerUserId: data.find(c => c.provider === p.id)?.providerUserId,
      }))
      setConnections(status)
    } catch {
      // If no integrations endpoint yet, just show all as disconnected
      setConnections(PROVIDERS.map(p => ({ provider: p.id, connected: false })))
    } finally {
      setLoading(false)
    }
  }

  async function connect(provider: string) {
    try {
      const data = await apiGet<{ url: string }>(`/api/${provider}/connect`)
      window.location.href = data.url
    } catch {
      setToast(`Failed to initiate ${provider} connection`)
    }
  }

  async function sync(provider: string) {
    setSyncing(provider)
    try {
      const data = await apiPost<{ synced: number; skipped: number }>(`/api/${provider}/sync`, {})
      setToast(`Synced ${data.synced} activities (${data.skipped} already up to date)`)
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(null)
    }
  }

  async function disconnect(provider: string) {
    if (!confirm(`Disconnect ${provider}? Your existing activities will be kept.`)) return
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4003'}/api/${provider}/disconnect`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('threshold_access_token') : ''}` },
      })
      setConnections(prev => prev.map(c => c.provider === provider ? { ...c, connected: false } : c))
      setToast(`${provider} disconnected`)
    } catch {
      setToast('Failed to disconnect')
    }
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(t)
  }, [toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-black mb-1">Integrations</h1>
      <p className="text-gray-400 text-sm mb-8">Connect your devices to sync activities and improve readiness accuracy.</p>

      {/* Toast */}
      {toast && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: '#1E3A1E', border: '1px solid #2A5A2A', color: '#6BCC6B' }}>
          {toast}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {PROVIDERS.map(provider => {
          const status = connections.find(c => c.provider === provider.id)
          const isConnected = status?.connected ?? false

          return (
            <div
              key={provider.id}
              className="rounded-2xl p-5"
              style={{ background: '#141414', border: `1px solid ${isConnected ? provider.color + '44' : '#1E1E1E'}` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: `${provider.color}22` }}
                  >
                    {provider.logo}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">{provider.name}</h3>
                      {isConnected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide" style={{ background: '#1E3A1E', color: '#4CAF50', border: '1px solid #2A5A2A' }}>
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 max-w-xs">{provider.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {!isConnected ? (
                  <button
                    onClick={() => connect(provider.id)}
                    className="flex-1 h-9 rounded-lg text-sm font-bold text-white transition hover:opacity-90 cursor-pointer"
                    style={{ background: provider.color }}
                  >
                    Connect {provider.name}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => sync(provider.id)}
                      disabled={syncing === provider.id}
                      className="flex-1 h-9 rounded-lg text-sm font-semibold transition disabled:opacity-50 cursor-pointer"
                      style={{ background: '#1E1E1E', border: '1px solid #2A2A2A', color: '#ccc' }}
                    >
                      {syncing === provider.id ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                      onClick={() => disconnect(provider.id)}
                      className="h-9 px-4 rounded-lg text-sm text-gray-500 hover:text-red-400 transition cursor-pointer"
                      style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}
                    >
                      Disconnect
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 p-4 rounded-xl text-sm text-gray-500" style={{ background: '#111', border: '1px solid #1E1E1E' }}>
        <p className="font-semibold text-gray-400 mb-1">Garmin coming soon</p>
        <p>Garmin Connect integration is in development. For now, use Strava as an intermediary to sync Garmin activities.</p>
      </div>
    </div>
  )
}

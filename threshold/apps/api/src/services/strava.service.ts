import { prisma } from '../lib/prisma'
import { updateTrainingLoad } from './adaptive.service'

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI || 'http://localhost:4003/api/strava/callback'

export function getStravaAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: STRAVA_REDIRECT_URI,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
    state,
  })
  return `https://www.strava.com/oauth/authorize?${params}`
}

interface StravaTokenResponse {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete: { id: number }
}

export async function exchangeStravaCode(code: string): Promise<StravaTokenResponse> {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`Strava token exchange failed: ${res.status}`)
  return res.json() as Promise<StravaTokenResponse>
}

export async function refreshStravaToken(userId: string): Promise<string | null> {
  const conn = await prisma.deviceConnection.findUnique({
    where: { userId_provider: { userId, provider: 'strava' } },
  })
  if (!conn?.refreshToken) return null

  const now = Math.floor(Date.now() / 1000)
  if (conn.expiresAt && conn.expiresAt.getTime() / 1000 > now + 60) {
    return conn.accessToken
  }

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: conn.refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) return null

  const data = await res.json() as StravaTokenResponse
  await prisma.deviceConnection.update({
    where: { userId_provider: { userId, provider: 'strava' } },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(data.expires_at * 1000),
    },
  })
  return data.access_token
}

// ─── TSS estimation from HR data ─────────────────────────────────────────────
// Simplified: uses IF (intensity factor) approximated from avg HR / threshold HR
// TSS = (duration_sec × IF² × 100) / 3600
function estimateTss(durationSec: number, avgHr: number | null, maxHr: number | null): number | null {
  if (!avgHr || !maxHr) return null
  const thresholdHr = maxHr * 0.88
  const if_ = Math.min(avgHr / thresholdHr, 1.1)
  return Math.round((durationSec * if_ * if_ * 100) / 3600)
}

interface StravaActivity {
  id: number
  name: string
  type: string
  start_date: string
  elapsed_time: number
  distance?: number
  average_heartrate?: number
  max_heartrate?: number
  total_elevation_gain?: number
  kilojoules?: number
}

export async function syncStravaActivities(userId: string): Promise<{ synced: number; skipped: number }> {
  const token = await refreshStravaToken(userId)
  if (!token) throw new Error('No valid Strava token')

  // Fetch recent activities (last 30 days)
  const after = Math.floor(Date.now() / 1000) - 30 * 24 * 3600
  const res = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!res.ok) throw new Error(`Strava activities fetch failed: ${res.status}`)

  const activities = await res.json() as StravaActivity[]
  let synced = 0
  let skipped = 0

  for (const act of activities) {
    const externalId = String(act.id)
    const existing = await prisma.activity.findUnique({
      where: { provider_externalId: { provider: 'strava', externalId } },
    })
    if (existing) { skipped++; continue }

    const startedAt = new Date(act.start_date)
    const tss = estimateTss(act.elapsed_time, act.average_heartrate ?? null, act.max_heartrate ?? null)
    const calories = act.kilojoules ? Math.round(act.kilojoules * 0.239) : null

    // Check if a Polar activity already covers this workout (within 5 min, duration within 20%)
    const fiveMin = 5 * 60 * 1000
    const polarMatch = await prisma.activity.findFirst({
      where: {
        userId,
        provider: 'polar',
        startedAt: {
          gte: new Date(startedAt.getTime() - fiveMin),
          lte: new Date(startedAt.getTime() + fiveMin),
        },
      },
    })

    if (polarMatch) {
      const durationDiff = Math.abs(polarMatch.durationSec - act.elapsed_time) / polarMatch.durationSec
      if (durationDiff < 0.2) {
        // Same workout — enrich the Polar record with Strava's GPS/route data
        await prisma.activity.update({
          where: { id: polarMatch.id },
          data: {
            name: act.name ?? polarMatch.name,
            ...(act.distance && { distanceM: act.distance }),
            ...(act.total_elevation_gain && { elevationM: act.total_elevation_gain }),
            ...(act.average_heartrate && polarMatch.avgHr == null && { avgHr: Math.round(act.average_heartrate) }),
            ...(act.max_heartrate && polarMatch.maxHr == null && { maxHr: Math.round(act.max_heartrate) }),
            ...(calories && polarMatch.calories == null && { calories }),
            // Only overwrite TSS if Polar didn't provide one (Polar training load is more accurate)
            ...(tss && polarMatch.tss == null && { tss }),
          },
        })
        if (tss && polarMatch.tss == null) await updateTrainingLoad(userId, startedAt, tss)
        synced++
        continue
      }
    }

    await prisma.activity.create({
      data: {
        userId,
        provider: 'strava',
        externalId,
        type: act.type.toLowerCase(),
        name: act.name ?? null,
        startedAt,
        durationSec: act.elapsed_time,
        distanceM: act.distance ?? null,
        avgHr: act.average_heartrate ? Math.round(act.average_heartrate) : null,
        maxHr: act.max_heartrate ? Math.round(act.max_heartrate) : null,
        calories,
        tss,
        elevationM: act.total_elevation_gain ?? null,
        rawJson: act as object,
      },
    })

    if (tss) await updateTrainingLoad(userId, startedAt, tss)
    synced++
  }

  return { synced, skipped }
}

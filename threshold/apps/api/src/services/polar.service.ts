import { prisma } from '../lib/prisma'
import { updateTrainingLoad } from './adaptive.service'

const POLAR_CLIENT_ID = process.env.POLAR_CLIENT_ID!
const POLAR_CLIENT_SECRET = process.env.POLAR_CLIENT_SECRET!
const POLAR_REDIRECT_URI = process.env.POLAR_REDIRECT_URI || 'http://localhost:4003/api/polar/callback'
const POLAR_BASE = 'https://www.polaraccesslink.com/v3'

export function getPolarAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: POLAR_CLIENT_ID,
    redirect_uri: POLAR_REDIRECT_URI,
    scope: 'accesslink.read_all',
    state,
  })
  return `https://flow.polar.com/oauth2/authorization?${params}`
}

interface PolarTokenResponse {
  access_token: string
  token_type: string
  x_user_id: number
}

export async function exchangePolarCode(code: string): Promise<PolarTokenResponse> {
  const credentials = Buffer.from(`${POLAR_CLIENT_ID}:${POLAR_CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://polarremote.com/v2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: POLAR_REDIRECT_URI,
    }).toString(),
  })
  if (!res.ok) throw new Error(`Polar token exchange failed: ${res.status}`)
  return res.json() as Promise<PolarTokenResponse>
}

async function polarGet<T>(userId: string, path: string): Promise<T> {
  const conn = await prisma.deviceConnection.findUnique({
    where: { userId_provider: { userId, provider: 'polar' } },
  })
  if (!conn) throw new Error('No Polar connection found')

  const res = await fetch(`${POLAR_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${conn.accessToken}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Polar API error: ${res.status} ${path}`)
  return res.json() as Promise<T>
}

// Register user with Polar AccessLink (required once per user)
export async function registerPolarUser(userId: string): Promise<void> {
  const conn = await prisma.deviceConnection.findUnique({
    where: { userId_provider: { userId, provider: 'polar' } },
  })
  if (!conn) throw new Error('No Polar connection')

  await fetch(`${POLAR_BASE}/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${conn.accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ 'member-id': userId }),
  })
  // 409 Conflict means already registered — that's fine
}

interface PolarActivity {
  id: string
  upload_time: string
  polar_user: string
  transaction_id: number
}

interface PolarExercise {
  id: string
  upload_time: string
  polar_user: string
  device: string
  start_time: string
  duration: string  // ISO 8601 duration e.g. PT1H30M
  calories: number
  distance?: number
  heart_rate?: { average: number; maximum: number }
  training_load?: number
  sport: string
}

const POLAR_SPORT_MAP: Record<string, string> = {
  running: 'run',
  trail_running: 'run',
  road_running: 'run',
  treadmill_running: 'run',
  cycling: 'ride',
  road_cycling: 'ride',
  mountain_biking: 'ride',
  indoor_cycling: 'ride',
  swimming: 'swim',
  pool_swimming: 'swim',
  open_water_swimming: 'swim',
  walking: 'walk',
  hiking: 'walk',
  rowing: 'rowing',
  strength_training: 'workout',
  functional_training: 'workout',
  crossfit: 'workout',
  yoga: 'yoga',
  fitness_class: 'workout',
  other: 'workout',
}

function normalizePolarSport(sport: string): string {
  const key = sport.toLowerCase()
  return POLAR_SPORT_MAP[key] ?? key
}

function parseDuration(iso: string): number {
  // Parse ISO 8601 duration to seconds
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  return (parseInt(match[1] ?? '0') * 3600) + (parseInt(match[2] ?? '0') * 60) + parseInt(match[3] ?? '0')
}

export async function syncPolarActivities(userId: string): Promise<{ synced: number; skipped: number }> {
  // Create a transaction to list new exercises
  const conn = await prisma.deviceConnection.findUnique({
    where: { userId_provider: { userId, provider: 'polar' } },
  })
  if (!conn) throw new Error('No Polar connection')

  // Create exercise transaction
  const txRes = await fetch(`${POLAR_BASE}/users/${conn.providerUserId}/exercise-transactions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${conn.accessToken}`,
      Accept: 'application/json',
    },
  })

  if (txRes.status === 204) return { synced: 0, skipped: 0 } // No new data
  if (!txRes.ok) throw new Error(`Polar transaction failed: ${txRes.status}`)

  const txData = await txRes.json() as { 'transaction-id': number; exercises: string[] }
  const exerciseUrls: string[] = txData.exercises ?? []

  let synced = 0
  let skipped = 0

  for (const url of exerciseUrls) {
    const exercise = await fetch(url, {
      headers: { Authorization: `Bearer ${conn.accessToken}`, Accept: 'application/json' },
    }).then(r => r.json()) as PolarExercise

    const externalId = exercise.id
    const alreadySynced = await prisma.activity.findUnique({
      where: { provider_externalId: { provider: 'polar', externalId } },
    })
    if (alreadySynced) { skipped++; continue }

    const durationSec = parseDuration(exercise.duration)
    const tss = exercise.training_load ? Math.round(exercise.training_load) : null
    const startedAt = new Date(exercise.start_time)

    // Check if a Strava activity covers the same workout (within 5 min, duration within 20%)
    const fiveMin = 5 * 60 * 1000
    const stravaMatch = await prisma.activity.findFirst({
      where: {
        userId,
        provider: 'strava',
        startedAt: {
          gte: new Date(startedAt.getTime() - fiveMin),
          lte: new Date(startedAt.getTime() + fiveMin),
        },
      },
    })

    if (stravaMatch) {
      const durationDiff = Math.abs(stravaMatch.durationSec - durationSec) / stravaMatch.durationSec
      if (durationDiff < 0.2) {
        // Same workout — enrich the Strava record with Polar's training load data
        await prisma.activity.update({
          where: { id: stravaMatch.id },
          data: {
            ...(tss != null && { tss }),
            ...(exercise.heart_rate?.average != null && stravaMatch.avgHr == null && { avgHr: exercise.heart_rate.average }),
            ...(exercise.heart_rate?.maximum != null && stravaMatch.maxHr == null && { maxHr: exercise.heart_rate.maximum }),
            ...(exercise.calories != null && stravaMatch.calories == null && { calories: exercise.calories }),
          },
        })
        if (tss) await updateTrainingLoad(userId, startedAt, tss)
        synced++
        continue
      }
    }

    // No Strava match — store as a standalone Polar activity
    await prisma.activity.create({
      data: {
        userId,
        provider: 'polar',
        externalId,
        type: normalizePolarSport(exercise.sport),
        startedAt,
        durationSec,
        distanceM: exercise.distance ?? null,
        avgHr: exercise.heart_rate?.average ?? null,
        maxHr: exercise.heart_rate?.maximum ?? null,
        calories: exercise.calories ?? null,
        tss,
        rawJson: exercise as object,
      },
    })

    if (tss) await updateTrainingLoad(userId, startedAt, tss)
    synced++
  }

  // Commit the transaction
  await fetch(
    `${POLAR_BASE}/users/${conn.providerUserId}/exercise-transactions/${txData['transaction-id']}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${conn.accessToken}` },
    },
  )

  return { synced, skipped }
}

// Fetch latest nightly recharge / HRV data from Polar
interface PolarNightlyRecharge {
  date: string
  heart_rate_avg: number
  breathing_rate: number
  heart_rate_variability_avg?: number
  ans_charge?: number  // 1-5 scale
}

export async function getLatestHrvData(userId: string): Promise<{
  hrv?: number
  trend: 'improving' | 'stable' | 'declining' | null
} | null> {
  try {
    const conn = await prisma.deviceConnection.findUnique({
      where: { userId_provider: { userId, provider: 'polar' } },
    })
    if (!conn) return null

    // Fetch nightly recharge for last 7 days
    const txRes = await fetch(`${POLAR_BASE}/users/${conn.providerUserId}/nightly-recharge-transactions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${conn.accessToken}`, Accept: 'application/json' },
    })
    if (!txRes.ok || txRes.status === 204) return null

    const tx = await txRes.json() as { 'transaction-id': number; 'nightly-recharges': string[] }
    if (!tx['nightly-recharges']?.length) return null

    const records: PolarNightlyRecharge[] = []
    for (const url of tx['nightly-recharges'].slice(-7)) {
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${conn.accessToken}`, Accept: 'application/json' },
      }).then(res => res.json()) as PolarNightlyRecharge
      records.push(r)
    }

    // Commit transaction
    await fetch(
      `${POLAR_BASE}/users/${conn.providerUserId}/nightly-recharge-transactions/${tx['transaction-id']}`,
      { method: 'PUT', headers: { Authorization: `Bearer ${conn.accessToken}` } },
    )

    if (records.length < 3) return { trend: null }

    const hrvValues = records
      .filter(r => r.heart_rate_variability_avg != null)
      .map(r => r.heart_rate_variability_avg!)

    if (hrvValues.length < 3) return { trend: null }

    const recent = hrvValues.slice(-3).reduce((a, b) => a + b, 0) / 3
    const older = hrvValues.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(hrvValues.length - 3, 1)
    const latestHrv = hrvValues[hrvValues.length - 1]

    let trend: 'improving' | 'stable' | 'declining'
    if (recent > older * 1.05) trend = 'improving'
    else if (recent < older * 0.95) trend = 'declining'
    else trend = 'stable'

    return { hrv: latestHrv, trend }
  } catch {
    return null
  }
}

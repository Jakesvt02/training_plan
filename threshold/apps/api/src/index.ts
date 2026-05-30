import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { globalLimiter } from './middleware/rateLimit'
import authRoutes from './routes/auth.routes'
import planRoutes from './routes/plan.routes'
import stravaRoutes from './routes/strava.routes'
import polarRoutes from './routes/polar.routes'
import checkinRoutes from './routes/checkin.routes'
import integrationsRoutes from './routes/integrations.routes'
import activityRoutes from './routes/activity.routes'
import workoutLogRoutes from './routes/workout-log.routes'
import profileRoutes from './routes/profile.routes'

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be set and at least 32 characters.')
  process.exit(1)
}

const app = express()
const PORT = process.env.PORT || 4003

app.set('trust proxy', 1) // required for rate limiter to get real IP behind proxy/Vercel

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4002',
  credentials: true,
}))
app.use(express.json({ limit: '10kb' })) // prevent large payload attacks
app.use(globalLimiter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'threshold-api' })
})

app.use('/api/auth', authRoutes)
app.use('/api/plan', planRoutes)
app.use('/api/strava', stravaRoutes)
app.use('/api/polar', polarRoutes)
app.use('/api/checkin', checkinRoutes)
app.use('/api/integrations', integrationsRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/workout-logs', workoutLogRoutes)
app.use('/api/profile', profileRoutes)

app.listen(PORT, () => {
  console.log(`Threshold API running on http://localhost:${PORT}`)
})

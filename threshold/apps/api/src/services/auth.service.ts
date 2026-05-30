import { prisma } from '../lib/prisma'
import { signAccessToken, createRefreshToken } from '../lib/jwt'
import { calculateBmi } from '../lib/bmi'
import { hashPassword, verifyPassword } from '../lib/password'
import type { RegisterPayload, LoginPayload, AuthResponse } from '@threshold/shared'

export async function registerUser(data: RegisterPayload): Promise<AuthResponse> {
  // Hash first — makes timing consistent whether or not the email exists,
  // so an attacker cannot enumerate registered emails via response time.
  const passwordHash = await hashPassword(data.password)

  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new Error('EMAIL_TAKEN')

  const bmi = calculateBmi(data.weightKg, data.heightCm)

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      passwordHash,
      profile: {
        create: {
          gender: data.gender,
          dateOfBirth: new Date(data.dateOfBirth),
          heightCm: data.heightCm,
          weightKg: data.weightKg,
          primaryDiscipline: data.primaryDiscipline,
          secondaryDisciplines: data.secondaryDisciplines ?? [],
          experienceLevel: data.experienceLevel,
          trainingDaysPerWeek: data.trainingDaysPerWeek,
          goal: data.goal,
          goalDate: data.goalDate ? new Date(data.goalDate) : undefined,
          goalDetail: data.goalDetail,
          bmi,
        },
      },
      bodyMeasurements: {
        create: {
          weightKg: data.weightKg,
          chestCm: data.chestCm,
          waistCm: data.waistCm,
          hipsCm: data.hipsCm,
          leftArmCm: data.leftArmCm,
          rightArmCm: data.rightArmCm,
          leftThighCm: data.leftThighCm,
          rightThighCm: data.rightThighCm,
          leftCalfCm: data.leftCalfCm,
          rightCalfCm: data.rightCalfCm,
          bmi,
        },
      },
    },
  })

  const accessToken = signAccessToken({ userId: user.id, email: user.email })
  const refreshToken = await createRefreshToken(user.id)

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email },
  }
}

export async function loginUser(data: LoginPayload): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  })

  // Always run argon2 verify — even against a dummy hash — so response time is
  // identical whether the email exists or not. Prevents email enumeration.
  const DUMMY_HASH = '$argon2id$v=19$m=65536,t=3,p=4$dummysaltXXXXXXXXXXXXXX$dummyhashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
  const valid = await verifyPassword(user?.passwordHash ?? DUMMY_HASH, data.password)

  if (!user || !valid) {
    throw new Error('INVALID_CREDENTIALS')
  }

  const accessToken = signAccessToken({ userId: user.id, email: user.email })
  const refreshToken = await createRefreshToken(user.id)

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email },
  }
}

import type { Discipline, ExperienceLevel, Gender, TrainingDays, TrainingGoal } from './disciplines'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  createdAt: string
}

export interface AthleteProfile {
  id: string
  userId: string
  gender: Gender
  dateOfBirth: string
  heightCm: number
  weightKg: number
  primaryDiscipline: Discipline
  secondaryDisciplines: Discipline[]
  experienceLevel: ExperienceLevel
  trainingDaysPerWeek: TrainingDays
  goal: TrainingGoal
  goalDate?: string
  goalDetail?: string
  bmi: number
}

export interface BodyMeasurement {
  id: string
  userId: string
  date: string
  weightKg: number
  chestCm?: number
  waistCm?: number
  hipsCm?: number
  leftArmCm?: number
  rightArmCm?: number
  leftThighCm?: number
  rightThighCm?: number
  leftCalfCm?: number
  rightCalfCm?: number
  bmi: number
  bodyFatPercent?: number
}

export interface RegisterStep1 {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface RegisterStep2 {
  gender: import('./disciplines').Gender
  dateOfBirth: string // ISO date string
  heightCm: number
  weightKg: number
}

export interface RegisterStep3 {
  chestCm?: number
  waistCm?: number
  hipsCm?: number
  leftArmCm?: number
  rightArmCm?: number
  leftThighCm?: number
  rightThighCm?: number
  leftCalfCm?: number
  rightCalfCm?: number
}

export interface RegisterStep4 {
  primaryDiscipline: import('./disciplines').Discipline
  secondaryDisciplines: import('./disciplines').Discipline[]
  experienceLevel: import('./disciplines').ExperienceLevel
  trainingDaysPerWeek: import('./disciplines').TrainingDays
  goal: import('./disciplines').TrainingGoal
  goalDate?: string // ISO date — for race/comp-driven disciplines
  goalDetail?: string // e.g. target finish time, target total
}

export interface RegisterPayload
  extends RegisterStep1,
    RegisterStep2,
    Partial<RegisterStep3>,
    RegisterStep4 {}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

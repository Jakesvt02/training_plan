export type Discipline =
  | 'hyrox'
  | 'powerlifting'
  | 'bodybuilding'
  | 'crossfit'
  | 'running'
  | 'cycling'
  | 'general_fitness'

export type TrainingGoal =
  | 'race_completion'
  | 'race_time'
  | 'competition'
  | 'muscle_gain'
  | 'fat_loss'
  | 'recomposition'
  | 'general_fitness'
  | 'endurance'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'

export type TrainingDays = 1 | 2 | 3 | 4 | 5 | 6 | 7

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  hyrox: 'HYROX',
  powerlifting: 'Powerlifting',
  bodybuilding: 'Bodybuilding',
  crossfit: 'CrossFit',
  running: 'Running',
  cycling: 'Cycling',
  general_fitness: 'General Fitness',
}

export const DISCIPLINE_DESCRIPTIONS: Record<Discipline, string> = {
  hyrox: 'Functional fitness race combining running and workout stations',
  powerlifting: 'Squat, bench press and deadlift — compete or train for strength',
  bodybuilding: 'Hypertrophy, aesthetics and body recomposition',
  crossfit: 'High-intensity functional movements and benchmark WODs',
  running: '5K to marathon — road, trail or track',
  cycling: 'Road, MTB or indoor — power-based training',
  general_fitness: 'Stay fit, feel good, no specific sport focus',
}

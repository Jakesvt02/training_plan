import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Session JSON shapes ──────────────────────────────────────────────────────
// Each sessionJson is typed loosely here; the app layer enforces strict types.

function hyroxSessions(phase: string, intensity: string) {
  const map: Record<string, Record<string, unknown[]>> = {
    base: {
      recovery: [
        { dayOfWeek: 0, sessionType: 'run', name: 'Easy Recovery Run', estimatedDurationMin: 30, estimatedTss: 30, description: 'Zone 2 easy jog', sessionJson: { type: 'run', targetZone: 2, durationMin: 30, notes: 'Conversational pace' }, swappableWith: ['recovery'] },
        { dayOfWeek: 1, sessionType: 'rest', name: 'Rest Day', estimatedDurationMin: 0, estimatedTss: 0, description: 'Full rest or light stretching', sessionJson: { type: 'rest' }, swappableWith: [] },
        { dayOfWeek: 2, sessionType: 'functional', name: 'Light Functional', estimatedDurationMin: 35, estimatedTss: 35, description: 'Sled, ski erg, sandbag at low load', sessionJson: { type: 'circuit', rounds: 2, exercises: [{ name: 'Ski Erg', meters: 250, notes: 'Easy pace, focus on technique' }, { name: 'Sled Push', distanceM: 25, load: 'light' }, { name: 'Sandbag Lunge', distanceM: 10 }] }, swappableWith: ['recovery'] },
        { dayOfWeek: 3, sessionType: 'run', name: 'Short Zone 2 Run', estimatedDurationMin: 25, estimatedTss: 25, description: 'Easy aerobic run', sessionJson: { type: 'run', targetZone: 2, durationMin: 25 }, swappableWith: ['recovery'] },
        { dayOfWeek: 4, sessionType: 'rest', name: 'Rest Day', estimatedDurationMin: 0, estimatedTss: 0, description: 'Rest', sessionJson: { type: 'rest' }, swappableWith: [] },
        { dayOfWeek: 5, sessionType: 'hyrox_drills', name: 'Movement Drills', estimatedDurationMin: 40, estimatedTss: 40, description: 'Technique focus — all 8 HYROX stations', sessionJson: { type: 'drills', focus: 'technique', stations: ['Ski Erg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump', 'Row', 'Farmers Carry', 'Sandbag Lunge', 'Wall Balls'], repsPerStation: 5 }, swappableWith: ['functional'] },
        { dayOfWeek: 6, sessionType: 'long_run', name: 'Long Easy Run', estimatedDurationMin: 50, estimatedTss: 50, description: 'Zone 2 long run', sessionJson: { type: 'run', targetZone: 2, durationMin: 50 }, swappableWith: ['run'] },
      ],
      low: [
        { dayOfWeek: 0, sessionType: 'run', name: 'Zone 2 Run', estimatedDurationMin: 40, estimatedTss: 45, description: 'Aerobic base run', sessionJson: { type: 'run', targetZone: 2, durationMin: 40 }, swappableWith: ['recovery'] },
        { dayOfWeek: 1, sessionType: 'functional', name: 'Functional Fitness A', estimatedDurationMin: 45, estimatedTss: 55, description: 'Rowing + sled + wall balls', sessionJson: { type: 'circuit', rounds: 3, exercises: [{ name: 'Row', durationSec: 300 }, { name: 'Sled Push', distanceM: 25 }, { name: 'Wall Balls', reps: 15, weightKg: 6 }] }, swappableWith: ['hyrox_drills'] },
        { dayOfWeek: 2, sessionType: 'rest', name: 'Rest Day', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
        { dayOfWeek: 3, sessionType: 'run', name: 'Tempo Intervals', estimatedDurationMin: 45, estimatedTss: 60, description: '4×8 min at threshold pace', sessionJson: { type: 'intervals', sets: [{ durationMin: 8, zone: 4, rest: '2min easy' }], repeats: 4 }, swappableWith: ['run'] },
        { dayOfWeek: 4, sessionType: 'hyrox_drills', name: 'HYROX Skill Work', estimatedDurationMin: 45, estimatedTss: 50, description: 'Technique on all 8 stations', sessionJson: { type: 'drills', focus: 'technique', stations: ['Ski Erg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump', 'Row', 'Farmers Carry', 'Sandbag Lunge', 'Wall Balls'] }, swappableWith: ['functional'] },
        { dayOfWeek: 5, sessionType: 'rest', name: 'Rest Day', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
        { dayOfWeek: 6, sessionType: 'long_run', name: 'Long Run', estimatedDurationMin: 65, estimatedTss: 75, description: 'Zone 2 long run', sessionJson: { type: 'run', targetZone: 2, durationMin: 65 }, swappableWith: ['run'] },
      ],
      moderate: [
        { dayOfWeek: 0, sessionType: 'run', name: 'Aerobic Run', estimatedDurationMin: 50, estimatedTss: 60, sessionJson: { type: 'run', targetZone: 2, durationMin: 50 }, swappableWith: ['recovery'] },
        { dayOfWeek: 1, sessionType: 'functional', name: 'Functional Circuit A', estimatedDurationMin: 55, estimatedTss: 70, sessionJson: { type: 'circuit', rounds: 4, exercises: [{ name: 'Ski Erg', meters: 500 }, { name: 'Sled Push', distanceM: 25, load: 'moderate' }, { name: 'Sandbag Lunge', distanceM: 25 }] }, swappableWith: ['hyrox_drills'] },
        { dayOfWeek: 2, sessionType: 'run', name: 'Threshold Run', estimatedDurationMin: 40, estimatedTss: 65, sessionJson: { type: 'intervals', sets: [{ durationMin: 10, zone: 4 }], repeats: 3, rest: '2min' }, swappableWith: ['run'] },
        { dayOfWeek: 3, sessionType: 'rest', name: 'Rest Day', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
        { dayOfWeek: 4, sessionType: 'hyrox_drills', name: 'HYROX Simulation', estimatedDurationMin: 60, estimatedTss: 80, description: 'Half-race simulation at moderate pace', sessionJson: { type: 'simulation', distanceBetweenStations: 500, stations: ['Ski Erg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump'], pace: 'moderate' }, swappableWith: ['functional'] },
        { dayOfWeek: 5, sessionType: 'functional', name: 'Functional Circuit B', estimatedDurationMin: 50, estimatedTss: 65, sessionJson: { type: 'circuit', rounds: 3, exercises: [{ name: 'Row', durationSec: 400 }, { name: 'Farmers Carry', distanceM: 25 }, { name: 'Wall Balls', reps: 20 }] }, swappableWith: ['hyrox_drills'] },
        { dayOfWeek: 6, sessionType: 'long_run', name: 'Long Aerobic Run', estimatedDurationMin: 75, estimatedTss: 90, sessionJson: { type: 'run', targetZone: 2, durationMin: 75 }, swappableWith: ['run'] },
      ],
      high: [
        { dayOfWeek: 0, sessionType: 'run', name: 'Zone 3 Run', estimatedDurationMin: 55, estimatedTss: 75, sessionJson: { type: 'run', targetZone: 3, durationMin: 55 }, swappableWith: ['recovery'] },
        { dayOfWeek: 1, sessionType: 'hyrox_drills', name: 'Full HYROX Simulation', estimatedDurationMin: 70, estimatedTss: 100, description: 'All 8 stations + 1km runs', sessionJson: { type: 'simulation', runDistanceM: 1000, stations: ['Ski Erg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump', 'Row', 'Farmers Carry', 'Sandbag Lunge', 'Wall Balls'], pace: 'race' }, swappableWith: ['functional'] },
        { dayOfWeek: 2, sessionType: 'run', name: 'Threshold Intervals', estimatedDurationMin: 50, estimatedTss: 80, sessionJson: { type: 'intervals', sets: [{ durationMin: 12, zone: 4 }], repeats: 3, rest: '90sec' }, swappableWith: ['run'] },
        { dayOfWeek: 3, sessionType: 'functional', name: 'Heavy Functional', estimatedDurationMin: 60, estimatedTss: 90, sessionJson: { type: 'circuit', rounds: 5, exercises: [{ name: 'Sled Push', distanceM: 25, load: 'heavy' }, { name: 'Sandbag Lunge', distanceM: 25, load: 'heavy' }, { name: 'Wall Balls', reps: 25 }] }, swappableWith: ['hyrox_drills'] },
        { dayOfWeek: 4, sessionType: 'recovery', name: 'Active Recovery', estimatedDurationMin: 30, estimatedTss: 20, sessionJson: { type: 'recovery', activities: ['foam rolling', 'light walk', 'mobility'] }, swappableWith: ['rest'] },
        { dayOfWeek: 5, sessionType: 'hyrox_drills', name: 'Station Conditioning', estimatedDurationMin: 65, estimatedTss: 95, sessionJson: { type: 'emom', durationMin: 40, stations: ['Ski Erg', 'Row', 'Burpee Broad Jump', 'Farmers Carry'] }, swappableWith: ['functional'] },
        { dayOfWeek: 6, sessionType: 'long_run', name: 'Race-Pace Long Run', estimatedDurationMin: 80, estimatedTss: 110, sessionJson: { type: 'run', targetZone: 3, durationMin: 80, notes: 'Push last 20 min to zone 4' }, swappableWith: ['run'] },
      ],
    },
    build: {
      recovery: [
        { dayOfWeek: 0, sessionType: 'run', name: 'Easy Run', estimatedDurationMin: 30, estimatedTss: 30, sessionJson: { type: 'run', targetZone: 2, durationMin: 30 }, swappableWith: ['recovery'] },
        { dayOfWeek: 1, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
        { dayOfWeek: 2, sessionType: 'functional', name: 'Light Functional', estimatedDurationMin: 35, estimatedTss: 35, sessionJson: { type: 'circuit', rounds: 2, exercises: [{ name: 'Ski Erg', meters: 250 }, { name: 'Sled Pull', distanceM: 25, load: 'light' }] }, swappableWith: ['recovery'] },
        { dayOfWeek: 3, sessionType: 'run', name: 'Short Run', estimatedDurationMin: 25, estimatedTss: 25, sessionJson: { type: 'run', targetZone: 2, durationMin: 25 }, swappableWith: ['recovery'] },
        { dayOfWeek: 4, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
        { dayOfWeek: 5, sessionType: 'hyrox_drills', name: 'Skill Review', estimatedDurationMin: 35, estimatedTss: 35, sessionJson: { type: 'drills', focus: 'technique', stations: ['Burpee Broad Jump', 'Wall Balls', 'Sandbag Lunge'] }, swappableWith: ['functional'] },
        { dayOfWeek: 6, sessionType: 'long_run', name: 'Easy Long Run', estimatedDurationMin: 45, estimatedTss: 45, sessionJson: { type: 'run', targetZone: 2, durationMin: 45 }, swappableWith: ['run'] },
      ],
      low: [
        { dayOfWeek: 0, sessionType: 'run', name: 'Build Run', estimatedDurationMin: 45, estimatedTss: 55, sessionJson: { type: 'run', targetZone: 2, durationMin: 45 }, swappableWith: ['recovery'] },
        { dayOfWeek: 1, sessionType: 'functional', name: 'Functional Build A', estimatedDurationMin: 50, estimatedTss: 65, sessionJson: { type: 'circuit', rounds: 3, exercises: [{ name: 'Sled Push', distanceM: 25 }, { name: 'Row', durationSec: 300 }, { name: 'Wall Balls', reps: 15 }] }, swappableWith: ['hyrox_drills'] },
        { dayOfWeek: 2, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
        { dayOfWeek: 3, sessionType: 'run', name: 'Tempo Run', estimatedDurationMin: 45, estimatedTss: 65, sessionJson: { type: 'intervals', sets: [{ durationMin: 10, zone: 4 }], repeats: 3, rest: '2min' }, swappableWith: ['run'] },
        { dayOfWeek: 4, sessionType: 'hyrox_drills', name: 'Station Practice', estimatedDurationMin: 50, estimatedTss: 60, sessionJson: { type: 'drills', focus: 'load', stations: ['Sled Push', 'Sled Pull', 'Farmers Carry', 'Sandbag Lunge'] }, swappableWith: ['functional'] },
        { dayOfWeek: 5, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
        { dayOfWeek: 6, sessionType: 'long_run', name: 'Longer Run', estimatedDurationMin: 70, estimatedTss: 80, sessionJson: { type: 'run', targetZone: 2, durationMin: 70 }, swappableWith: ['run'] },
      ],
      moderate: [
        { dayOfWeek: 0, sessionType: 'run', name: 'Build Aerobic Run', estimatedDurationMin: 55, estimatedTss: 70, sessionJson: { type: 'run', targetZone: 2, durationMin: 55 }, swappableWith: ['recovery'] },
        { dayOfWeek: 1, sessionType: 'hyrox_drills', name: 'HYROX Brick A', estimatedDurationMin: 60, estimatedTss: 85, sessionJson: { type: 'brick', runDistanceM: 1000, stations: ['Ski Erg', 'Sled Push', 'Row'], pace: 'moderate' }, swappableWith: ['functional'] },
        { dayOfWeek: 2, sessionType: 'run', name: 'Interval Run', estimatedDurationMin: 45, estimatedTss: 70, sessionJson: { type: 'intervals', sets: [{ durationMin: 8, zone: 4 }], repeats: 4, rest: '90sec' }, swappableWith: ['run'] },
        { dayOfWeek: 3, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
        { dayOfWeek: 4, sessionType: 'functional', name: 'Functional Build B', estimatedDurationMin: 60, estimatedTss: 80, sessionJson: { type: 'circuit', rounds: 4, exercises: [{ name: 'Burpee Broad Jump', reps: 10 }, { name: 'Sandbag Lunge', distanceM: 25 }, { name: 'Wall Balls', reps: 20 }] }, swappableWith: ['hyrox_drills'] },
        { dayOfWeek: 5, sessionType: 'run', name: 'Steady State Run', estimatedDurationMin: 40, estimatedTss: 55, sessionJson: { type: 'run', targetZone: 3, durationMin: 40 }, swappableWith: ['recovery'] },
        { dayOfWeek: 6, sessionType: 'long_run', name: 'Long Tempo Run', estimatedDurationMin: 80, estimatedTss: 100, sessionJson: { type: 'run', targetZone: 3, durationMin: 80 }, swappableWith: ['run'] },
      ],
      high: [
        { dayOfWeek: 0, sessionType: 'run', name: 'High Intensity Run', estimatedDurationMin: 55, estimatedTss: 85, sessionJson: { type: 'intervals', sets: [{ durationMin: 5, zone: 5 }], repeats: 6, rest: '2min' }, swappableWith: ['recovery'] },
        { dayOfWeek: 1, sessionType: 'hyrox_drills', name: 'Full Race Sim A', estimatedDurationMin: 75, estimatedTss: 110, sessionJson: { type: 'simulation', runDistanceM: 1000, stations: ['Ski Erg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump', 'Row', 'Farmers Carry', 'Sandbag Lunge', 'Wall Balls'], pace: 'race' }, swappableWith: ['functional'] },
        { dayOfWeek: 2, sessionType: 'run', name: 'VO2max Intervals', estimatedDurationMin: 50, estimatedTss: 90, sessionJson: { type: 'intervals', sets: [{ durationMin: 4, zone: 5 }], repeats: 5, rest: '3min' }, swappableWith: ['run'] },
        { dayOfWeek: 3, sessionType: 'functional', name: 'Heavy Functional Build', estimatedDurationMin: 65, estimatedTss: 95, sessionJson: { type: 'circuit', rounds: 5, exercises: [{ name: 'Sled Push', distanceM: 25, load: 'heavy' }, { name: 'Farmers Carry', distanceM: 25, load: 'heavy' }, { name: 'Wall Balls', reps: 25 }] }, swappableWith: ['hyrox_drills'] },
        { dayOfWeek: 4, sessionType: 'recovery', name: 'Active Recovery', estimatedDurationMin: 30, estimatedTss: 20, sessionJson: { type: 'recovery', activities: ['foam rolling', 'light swim or walk'] }, swappableWith: ['rest'] },
        { dayOfWeek: 5, sessionType: 'hyrox_drills', name: 'HYROX Brick B', estimatedDurationMin: 70, estimatedTss: 105, sessionJson: { type: 'brick', runDistanceM: 1000, stations: ['Burpee Broad Jump', 'Row', 'Sandbag Lunge', 'Wall Balls'], pace: 'race' }, swappableWith: ['functional'] },
        { dayOfWeek: 6, sessionType: 'long_run', name: 'Race-Pace Long Run', estimatedDurationMin: 85, estimatedTss: 120, sessionJson: { type: 'run', targetZone: 4, durationMin: 85 }, swappableWith: ['run'] },
      ],
    },
    peak: {
      recovery: [
        { dayOfWeek: 0, sessionType: 'run', name: 'Easy Shake-Out', estimatedDurationMin: 25, estimatedTss: 25, sessionJson: { type: 'run', targetZone: 2, durationMin: 25 }, swappableWith: ['recovery'] },
        { dayOfWeek: 1, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
        { dayOfWeek: 2, sessionType: 'functional', name: 'Light Activation', estimatedDurationMin: 30, estimatedTss: 30, sessionJson: { type: 'activation', exercises: [{ name: 'Ski Erg', meters: 150 }, { name: 'Wall Balls', reps: 10 }] }, swappableWith: ['recovery'] },
        { dayOfWeek: 3, sessionType: 'run', name: 'Short Easy Run', estimatedDurationMin: 20, estimatedTss: 20, sessionJson: { type: 'run', targetZone: 2, durationMin: 20 }, swappableWith: ['recovery'] },
        { dayOfWeek: 4, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
        { dayOfWeek: 5, sessionType: 'hyrox_drills', name: 'Technique Polish', estimatedDurationMin: 30, estimatedTss: 30, sessionJson: { type: 'drills', focus: 'efficiency', stations: ['Transitions', 'Wall Balls', 'Sled technique'] }, swappableWith: ['functional'] },
        { dayOfWeek: 6, sessionType: 'run', name: 'Easy Jog', estimatedDurationMin: 30, estimatedTss: 30, sessionJson: { type: 'run', targetZone: 2, durationMin: 30 }, swappableWith: ['recovery'] },
      ],
      moderate: [
        { dayOfWeek: 0, sessionType: 'run', name: 'Race-Pace Effort', estimatedDurationMin: 40, estimatedTss: 65, sessionJson: { type: 'run', targetZone: 4, durationMin: 40 }, swappableWith: ['recovery'] },
        { dayOfWeek: 1, sessionType: 'hyrox_drills', name: 'Race Simulation', estimatedDurationMin: 65, estimatedTss: 95, sessionJson: { type: 'simulation', runDistanceM: 1000, stations: ['Ski Erg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump', 'Row', 'Farmers Carry', 'Sandbag Lunge', 'Wall Balls'], pace: 'race' }, swappableWith: ['functional'] },
        { dayOfWeek: 2, sessionType: 'run', name: 'Sharpening Intervals', estimatedDurationMin: 35, estimatedTss: 55, sessionJson: { type: 'intervals', sets: [{ durationMin: 3, zone: 5 }], repeats: 5, rest: '3min' }, swappableWith: ['run'] },
        { dayOfWeek: 3, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
        { dayOfWeek: 4, sessionType: 'functional', name: 'Peak Conditioning', estimatedDurationMin: 50, estimatedTss: 75, sessionJson: { type: 'circuit', rounds: 4, exercises: [{ name: 'Sled Push', distanceM: 25, load: 'race' }, { name: 'Ski Erg', meters: 250 }, { name: 'Wall Balls', reps: 15 }] }, swappableWith: ['hyrox_drills'] },
        { dayOfWeek: 5, sessionType: 'recovery', name: 'Active Recovery', estimatedDurationMin: 25, estimatedTss: 20, sessionJson: { type: 'recovery', activities: ['mobility', 'foam rolling'] }, swappableWith: ['rest'] },
        { dayOfWeek: 6, sessionType: 'run', name: 'Confidence Run', estimatedDurationMin: 45, estimatedTss: 60, sessionJson: { type: 'run', targetZone: 3, durationMin: 45 }, swappableWith: ['run'] },
      ],
    },
    taper: {
      low: [
        { dayOfWeek: 0, sessionType: 'run', name: 'Taper Run A', estimatedDurationMin: 30, estimatedTss: 35, sessionJson: { type: 'run', targetZone: 2, durationMin: 30 }, swappableWith: ['recovery'] },
        { dayOfWeek: 1, sessionType: 'hyrox_drills', name: 'Light Station Work', estimatedDurationMin: 30, estimatedTss: 35, sessionJson: { type: 'drills', focus: 'activation', stations: ['Ski Erg', 'Sled Push', 'Row', 'Wall Balls'], repsPerStation: 3 }, swappableWith: ['functional'] },
        { dayOfWeek: 2, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
        { dayOfWeek: 3, sessionType: 'run', name: 'Race-Pace Strides', estimatedDurationMin: 25, estimatedTss: 30, sessionJson: { type: 'intervals', sets: [{ durationSec: 30, zone: 5 }], repeats: 6, rest: '2min', warmup: '10min easy' }, swappableWith: ['run'] },
        { dayOfWeek: 4, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
        { dayOfWeek: 5, sessionType: 'functional', name: 'Race-Day Preview', estimatedDurationMin: 25, estimatedTss: 25, sessionJson: { type: 'activation', description: 'Brief run-through of all 8 stations at low effort', stations: ['Ski Erg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump', 'Row', 'Farmers Carry', 'Sandbag Lunge', 'Wall Balls'], repsPerStation: 3 }, swappableWith: ['hyrox_drills'] },
        { dayOfWeek: 6, sessionType: 'rest', name: 'Rest / Race Day', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest', notes: 'Race day or final rest' }, swappableWith: [] },
      ],
    },
  }
  return map[phase]?.[intensity] ?? map.base.low
}

function powerliftingSessions(phase: string, intensity: string) {
  const squat = (sets: number, repsOrRange: string, rpe: number) => ({ name: 'Back Squat', sets, repsOrRange, rpe, notes: `RPE ${rpe}` })
  const bench = (sets: number, repsOrRange: string, rpe: number) => ({ name: 'Bench Press', sets, repsOrRange, rpe })
  const deadlift = (sets: number, repsOrRange: string, rpe: number) => ({ name: 'Deadlift', sets, repsOrRange, rpe })

  const base_moderate = [
    { dayOfWeek: 0, sessionType: 'lift', name: 'Squat Day', estimatedDurationMin: 75, estimatedTss: 65, sessionJson: { type: 'strength', exercises: [squat(4, '5', 7), { name: 'Romanian Deadlift', sets: 3, repsOrRange: '8', rpe: 7 }, { name: 'Leg Press', sets: 3, repsOrRange: '10' }, { name: 'Leg Curl', sets: 3, repsOrRange: '12' }] }, swappableWith: ['strength'] },
    { dayOfWeek: 1, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
    { dayOfWeek: 2, sessionType: 'lift', name: 'Bench Day', estimatedDurationMin: 70, estimatedTss: 60, sessionJson: { type: 'strength', exercises: [bench(4, '5', 7), { name: 'DB Incline Press', sets: 3, repsOrRange: '8' }, { name: 'Tricep Pushdown', sets: 3, repsOrRange: '12' }, { name: 'Face Pull', sets: 3, repsOrRange: '15' }] }, swappableWith: ['strength'] },
    { dayOfWeek: 3, sessionType: 'recovery', name: 'Active Recovery', estimatedDurationMin: 30, estimatedTss: 20, sessionJson: { type: 'recovery', activities: ['light cardio', 'mobility'] }, swappableWith: ['rest'] },
    { dayOfWeek: 4, sessionType: 'lift', name: 'Deadlift Day', estimatedDurationMin: 75, estimatedTss: 70, sessionJson: { type: 'strength', exercises: [deadlift(4, '4', 7), { name: 'Front Squat', sets: 3, repsOrRange: '5', rpe: 7 }, { name: 'Lat Pulldown', sets: 3, repsOrRange: '10' }, { name: 'Barbell Row', sets: 3, repsOrRange: '8' }] }, swappableWith: ['strength'] },
    { dayOfWeek: 5, sessionType: 'lift', name: 'Accessory Day', estimatedDurationMin: 60, estimatedTss: 50, sessionJson: { type: 'strength', exercises: [{ name: 'OHP', sets: 4, repsOrRange: '6', rpe: 7 }, { name: 'Bulgarian Split Squat', sets: 3, repsOrRange: '8' }, { name: 'Cable Row', sets: 3, repsOrRange: '12' }, { name: 'Bicep Curl', sets: 3, repsOrRange: '12' }] }, swappableWith: ['strength'] },
    { dayOfWeek: 6, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
  ]

  const peak_high = [
    { dayOfWeek: 0, sessionType: 'lift', name: 'Heavy Squat', estimatedDurationMin: 80, estimatedTss: 90, sessionJson: { type: 'strength', exercises: [squat(5, '3', 8.5), { name: 'Pause Squat', sets: 2, repsOrRange: '3', rpe: 8 }] }, swappableWith: ['strength'] },
    { dayOfWeek: 1, sessionType: 'lift', name: 'Heavy Bench', estimatedDurationMin: 75, estimatedTss: 85, sessionJson: { type: 'strength', exercises: [bench(5, '3', 8.5), { name: 'Close Grip Bench', sets: 3, repsOrRange: '4', rpe: 8 }] }, swappableWith: ['strength'] },
    { dayOfWeek: 2, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
    { dayOfWeek: 3, sessionType: 'lift', name: 'Heavy Deadlift', estimatedDurationMin: 80, estimatedTss: 95, sessionJson: { type: 'strength', exercises: [deadlift(5, '2', 9), { name: 'Block Pull', sets: 2, repsOrRange: '2', rpe: 8.5 }] }, swappableWith: ['strength'] },
    { dayOfWeek: 4, sessionType: 'recovery', name: 'Recovery Work', estimatedDurationMin: 35, estimatedTss: 20, sessionJson: { type: 'recovery', activities: ['mobility', 'light stretching', 'sauna'] }, swappableWith: ['rest'] },
    { dayOfWeek: 5, sessionType: 'lift', name: 'Opener Practice', estimatedDurationMin: 70, estimatedTss: 75, sessionJson: { type: 'strength', description: 'Attempt openers at ~85% of planned', exercises: [squat(1, '1', 8), bench(1, '1', 8), deadlift(1, '1', 8)] }, swappableWith: ['strength'] },
    { dayOfWeek: 6, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
  ]

  const taper_low = [
    { dayOfWeek: 0, sessionType: 'lift', name: 'Squat Activation', estimatedDurationMin: 50, estimatedTss: 40, sessionJson: { type: 'strength', exercises: [squat(3, '2', 7), { name: 'Leg Press', sets: 2, repsOrRange: '8', load: 'light' }] }, swappableWith: ['strength'] },
    { dayOfWeek: 1, sessionType: 'lift', name: 'Bench Activation', estimatedDurationMin: 45, estimatedTss: 35, sessionJson: { type: 'strength', exercises: [bench(3, '2', 7)] }, swappableWith: ['strength'] },
    { dayOfWeek: 2, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
    { dayOfWeek: 3, sessionType: 'lift', name: 'Deadlift Activation', estimatedDurationMin: 45, estimatedTss: 35, sessionJson: { type: 'strength', exercises: [deadlift(2, '1', 7)] }, swappableWith: ['strength'] },
    { dayOfWeek: 4, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
    { dayOfWeek: 5, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
    { dayOfWeek: 6, sessionType: 'rest', name: 'Competition Day', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest', notes: 'Competition or final rest' }, swappableWith: [] },
  ]

  const recovery_week = [
    { dayOfWeek: 0, sessionType: 'lift', name: 'Light Squat', estimatedDurationMin: 50, estimatedTss: 35, sessionJson: { type: 'strength', exercises: [squat(3, '5', 6), { name: 'Goblet Squat', sets: 2, repsOrRange: '12' }] }, swappableWith: ['recovery'] },
    { dayOfWeek: 1, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
    { dayOfWeek: 2, sessionType: 'lift', name: 'Light Bench', estimatedDurationMin: 45, estimatedTss: 30, sessionJson: { type: 'strength', exercises: [bench(3, '5', 6)] }, swappableWith: ['recovery'] },
    { dayOfWeek: 3, sessionType: 'recovery', name: 'Active Recovery', estimatedDurationMin: 30, estimatedTss: 15, sessionJson: { type: 'recovery', activities: ['mobility', 'foam rolling'] }, swappableWith: ['rest'] },
    { dayOfWeek: 4, sessionType: 'lift', name: 'Light Deadlift', estimatedDurationMin: 50, estimatedTss: 35, sessionJson: { type: 'strength', exercises: [deadlift(3, '3', 6)] }, swappableWith: ['recovery'] },
    { dayOfWeek: 5, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
    { dayOfWeek: 6, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
  ]

  if (intensity === 'recovery') return recovery_week
  if (phase === 'peak' && intensity === 'high') return peak_high
  if (phase === 'taper') return taper_low
  return base_moderate
}

function bodybuildingSessions(phase: string, intensity: string) {
  const base_moderate = [
    { dayOfWeek: 0, sessionType: 'lift', name: 'Push A', estimatedDurationMin: 70, estimatedTss: 60, sessionJson: { type: 'hypertrophy', split: 'push', exercises: [{ name: 'Bench Press', sets: 4, repsOrRange: '8-10', rir: 2 }, { name: 'Incline DB Press', sets: 3, repsOrRange: '10-12', rir: 2 }, { name: 'Cable Lateral Raise', sets: 4, repsOrRange: '15', rir: 1 }, { name: 'Tricep Overhead Extension', sets: 3, repsOrRange: '12', rir: 1 }] }, swappableWith: ['strength'] },
    { dayOfWeek: 1, sessionType: 'lift', name: 'Pull A', estimatedDurationMin: 70, estimatedTss: 60, sessionJson: { type: 'hypertrophy', split: 'pull', exercises: [{ name: 'Barbell Row', sets: 4, repsOrRange: '8-10', rir: 2 }, { name: 'Lat Pulldown', sets: 3, repsOrRange: '10-12', rir: 2 }, { name: 'Incline DB Curl', sets: 3, repsOrRange: '12', rir: 1 }, { name: 'Face Pull', sets: 3, repsOrRange: '15' }] }, swappableWith: ['strength'] },
    { dayOfWeek: 2, sessionType: 'lift', name: 'Legs A', estimatedDurationMin: 75, estimatedTss: 65, sessionJson: { type: 'hypertrophy', split: 'legs', exercises: [{ name: 'Back Squat', sets: 4, repsOrRange: '8-10', rir: 2 }, { name: 'Leg Press', sets: 3, repsOrRange: '12', rir: 2 }, { name: 'Leg Curl', sets: 3, repsOrRange: '12' }, { name: 'Calf Raise', sets: 4, repsOrRange: '15' }] }, swappableWith: ['strength'] },
    { dayOfWeek: 3, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
    { dayOfWeek: 4, sessionType: 'lift', name: 'Push B', estimatedDurationMin: 70, estimatedTss: 60, sessionJson: { type: 'hypertrophy', split: 'push', exercises: [{ name: 'OHP', sets: 4, repsOrRange: '8-10', rir: 2 }, { name: 'DB Shoulder Press', sets: 3, repsOrRange: '12', rir: 2 }, { name: 'Pec Deck', sets: 3, repsOrRange: '15' }, { name: 'Tricep Pushdown', sets: 3, repsOrRange: '15' }] }, swappableWith: ['strength'] },
    { dayOfWeek: 5, sessionType: 'lift', name: 'Pull B', estimatedDurationMin: 70, estimatedTss: 60, sessionJson: { type: 'hypertrophy', split: 'pull', exercises: [{ name: 'Cable Row', sets: 4, repsOrRange: '10-12', rir: 2 }, { name: 'Single Arm DB Row', sets: 3, repsOrRange: '10', rir: 2 }, { name: 'Hammer Curl', sets: 3, repsOrRange: '12' }, { name: 'Rear Delt Fly', sets: 3, repsOrRange: '15' }] }, swappableWith: ['strength'] },
    { dayOfWeek: 6, sessionType: 'lift', name: 'Legs B', estimatedDurationMin: 75, estimatedTss: 65, sessionJson: { type: 'hypertrophy', split: 'legs', exercises: [{ name: 'Romanian Deadlift', sets: 4, repsOrRange: '8-10', rir: 2 }, { name: 'Hack Squat', sets: 3, repsOrRange: '12' }, { name: 'Leg Extension', sets: 3, repsOrRange: '15' }, { name: 'Standing Calf Raise', sets: 4, repsOrRange: '15' }] }, swappableWith: ['strength'] },
  ]
  const recovery_week = base_moderate.map((s, i) =>
    i % 2 === 0 ? { ...s, name: s.name + ' (Light)', estimatedTss: Math.floor(s.estimatedTss * 0.5), sessionJson: { ...(s.sessionJson as Record<string, unknown>), notes: 'Reduce load 30-40%, focus on mind-muscle connection' } } : s
  )
  return intensity === 'recovery' ? recovery_week : base_moderate
}

function crossfitSessions(phase: string, intensity: string) {
  const base_moderate = [
    { dayOfWeek: 0, sessionType: 'wod', name: 'Strength + WOD A', estimatedDurationMin: 60, estimatedTss: 75, sessionJson: { type: 'crossfit', strength: { movement: 'Back Squat', scheme: '5x5', notes: 'Build to heavy 5' }, wod: { name: 'Fran', format: 'for_time', movements: [{ name: 'Thrusters', reps: 21, weight: '43kg/30kg' }, { name: 'Pull-ups', reps: 21 }, { name: 'Thrusters', reps: 15, weight: '43kg/30kg' }, { name: 'Pull-ups', reps: 15 }, { name: 'Thrusters', reps: 9 }, { name: 'Pull-ups', reps: 9 }] } }, swappableWith: ['strength'] },
    { dayOfWeek: 1, sessionType: 'wod', name: 'Gymnastics + WOD B', estimatedDurationMin: 55, estimatedTss: 65, sessionJson: { type: 'crossfit', skill: { movement: 'Muscle-up progressions', durationMin: 15 }, wod: { name: 'AMRAP 18', format: 'amrap', durationMin: 18, movements: [{ name: 'Box Jumps', reps: 10 }, { name: 'Kettlebell Swings', reps: 15, weightKg: 24 }, { name: 'Push-ups', reps: 20 }] } }, swappableWith: ['functional'] },
    { dayOfWeek: 2, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
    { dayOfWeek: 3, sessionType: 'wod', name: 'Olympic Lifting + WOD C', estimatedDurationMin: 65, estimatedTss: 80, sessionJson: { type: 'crossfit', strength: { movement: 'Clean & Jerk', scheme: 'Work to 85% 1RM' }, wod: { name: 'EMOM 20', format: 'emom', durationMin: 20, minutes: [{ minute: 'odd', work: '5 Power Cleans + 5 Burpees' }, { minute: 'even', work: '10 Cal Row' }] } }, swappableWith: ['strength'] },
    { dayOfWeek: 4, sessionType: 'recovery', name: 'Active Recovery / Aerobic', estimatedDurationMin: 40, estimatedTss: 35, sessionJson: { type: 'recovery', activities: ['30 min easy row or bike', 'mobility work'] }, swappableWith: ['rest'] },
    { dayOfWeek: 5, sessionType: 'wod', name: 'Deadlift + Chipper', estimatedDurationMin: 65, estimatedTss: 85, sessionJson: { type: 'crossfit', strength: { movement: 'Deadlift', scheme: '5-3-1' }, wod: { name: 'Chipper', format: 'for_time', movements: [{ name: 'Wall Balls', reps: 50 }, { name: 'Box Jumps', reps: 40 }, { name: 'KB Swings', reps: 30, weightKg: 24 }, { name: 'Toes-to-bar', reps: 20 }, { name: 'Double Unders', reps: 100 }] } }, swappableWith: ['functional'] },
    { dayOfWeek: 6, sessionType: 'wod', name: 'Saturday Partner WOD', estimatedDurationMin: 60, estimatedTss: 75, sessionJson: { type: 'crossfit', wod: { name: 'Partner AMRAP 30', format: 'amrap', durationMin: 30, notes: 'Can be done solo — scale reps', movements: [{ name: 'Cal Row', reps: 20 }, { name: 'Synchro Burpees', reps: 10 }, { name: 'DB Thrusters', reps: 15, weightKg: 22.5 }] } }, swappableWith: ['wod'] },
  ]
  return base_moderate
}

function runningSessions(phase: string, intensity: string) {
  const base_low = [
    { dayOfWeek: 0, sessionType: 'run', name: 'Easy Run', estimatedDurationMin: 40, estimatedTss: 45, sessionJson: { type: 'run', targetZone: 2, durationMin: 40, notes: 'Easy conversational pace' }, swappableWith: ['recovery'] },
    { dayOfWeek: 1, sessionType: 'run', name: 'Tempo Intervals', estimatedDurationMin: 50, estimatedTss: 65, sessionJson: { type: 'intervals', warmup: '10min easy', sets: [{ durationMin: 8, zone: 4 }], repeats: 4, cooldown: '10min easy' }, swappableWith: ['run'] },
    { dayOfWeek: 2, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
    { dayOfWeek: 3, sessionType: 'run', name: 'Medium Long Run', estimatedDurationMin: 60, estimatedTss: 70, sessionJson: { type: 'run', targetZone: 2, durationMin: 60 }, swappableWith: ['run'] },
    { dayOfWeek: 4, sessionType: 'run', name: 'Strides + Easy', estimatedDurationMin: 35, estimatedTss: 40, sessionJson: { type: 'run', targetZone: 2, durationMin: 25, strides: { count: 6, durationSec: 20, rest: '1min' } }, swappableWith: ['recovery'] },
    { dayOfWeek: 5, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
    { dayOfWeek: 6, sessionType: 'long_run', name: 'Long Run', estimatedDurationMin: 90, estimatedTss: 105, sessionJson: { type: 'run', targetZone: 2, durationMin: 90, notes: 'Steady aerobic long run' }, swappableWith: ['run'] },
  ]
  const peak_high = [
    { dayOfWeek: 0, sessionType: 'run', name: 'VO2max Intervals', estimatedDurationMin: 55, estimatedTss: 90, sessionJson: { type: 'intervals', warmup: '15min', sets: [{ distanceM: 1000, zone: 5 }], repeats: 5, rest: '3min jog', cooldown: '10min' }, swappableWith: ['run'] },
    { dayOfWeek: 1, sessionType: 'run', name: 'Easy Recovery Run', estimatedDurationMin: 35, estimatedTss: 35, sessionJson: { type: 'run', targetZone: 2, durationMin: 35 }, swappableWith: ['recovery'] },
    { dayOfWeek: 2, sessionType: 'run', name: 'Lactate Threshold Run', estimatedDurationMin: 55, estimatedTss: 85, sessionJson: { type: 'intervals', warmup: '10min', sets: [{ durationMin: 20, zone: 4 }], repeats: 2, rest: '3min walk', cooldown: '10min' }, swappableWith: ['run'] },
    { dayOfWeek: 3, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
    { dayOfWeek: 4, sessionType: 'run', name: 'Race-Pace Workout', estimatedDurationMin: 60, estimatedTss: 95, sessionJson: { type: 'intervals', warmup: '15min', description: 'Progression run — last 20 min at race pace', sets: [{ durationMin: 20, zone: 4 }, { durationMin: 20, zone: 5 }], cooldown: '10min' }, swappableWith: ['run'] },
    { dayOfWeek: 5, sessionType: 'run', name: 'Easy Run + Strides', estimatedDurationMin: 40, estimatedTss: 45, sessionJson: { type: 'run', targetZone: 2, durationMin: 30, strides: { count: 6, durationSec: 20, rest: '90sec' } }, swappableWith: ['recovery'] },
    { dayOfWeek: 6, sessionType: 'long_run', name: 'Peak Long Run', estimatedDurationMin: 110, estimatedTss: 135, sessionJson: { type: 'run', targetZone: 2, durationMin: 110, notes: 'Last 20 min at marathon pace' }, swappableWith: ['run'] },
  ]
  if (phase === 'peak' && intensity === 'high') return peak_high
  return base_low
}

function cyclingSessions(phase: string, intensity: string) {
  const base_moderate = [
    { dayOfWeek: 0, sessionType: 'run', name: 'Endurance Ride', estimatedDurationMin: 75, estimatedTss: 70, sessionJson: { type: 'cycling', format: 'endurance', targetZone: 2, durationMin: 75, notes: 'Steady Z2 — nose breathing' }, swappableWith: ['recovery'] },
    { dayOfWeek: 1, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
    { dayOfWeek: 2, sessionType: 'run', name: 'Sweet Spot Intervals', estimatedDurationMin: 70, estimatedTss: 85, sessionJson: { type: 'cycling', format: 'intervals', warmup: '15min', intervals: [{ durationMin: 12, intensityPct: 88 }], repeats: 3, rest: '5min easy', cooldown: '10min' }, swappableWith: ['run'] },
    { dayOfWeek: 3, sessionType: 'recovery', name: 'Active Recovery Spin', estimatedDurationMin: 40, estimatedTss: 25, sessionJson: { type: 'cycling', format: 'recovery', targetZone: 1, durationMin: 40, notes: 'Spin easy, high cadence' }, swappableWith: ['rest'] },
    { dayOfWeek: 4, sessionType: 'run', name: 'VO2max Efforts', estimatedDurationMin: 65, estimatedTss: 90, sessionJson: { type: 'cycling', format: 'intervals', warmup: '15min', intervals: [{ durationMin: 4, zone: 5 }], repeats: 5, rest: '4min easy', cooldown: '10min' }, swappableWith: ['run'] },
    { dayOfWeek: 5, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
    { dayOfWeek: 6, sessionType: 'long_run', name: 'Long Endurance Ride', estimatedDurationMin: 150, estimatedTss: 130, sessionJson: { type: 'cycling', format: 'endurance', targetZone: 2, durationMin: 150, notes: 'Build to 3h+ over the phase' }, swappableWith: ['run'] },
  ]
  return base_moderate
}

function generalFitnessSessions(phase: string, intensity: string) {
  const base_moderate = [
    { dayOfWeek: 0, sessionType: 'lift', name: 'Full Body A', estimatedDurationMin: 55, estimatedTss: 55, sessionJson: { type: 'general', format: 'full_body', exercises: [{ name: 'Goblet Squat', sets: 3, repsOrRange: '12' }, { name: 'DB Bench Press', sets: 3, repsOrRange: '12' }, { name: 'Cable Row', sets: 3, repsOrRange: '12' }, { name: 'RDL', sets: 3, repsOrRange: '12' }, { name: 'Plank', sets: 3, durationSec: 45 }] }, swappableWith: ['strength'] },
    { dayOfWeek: 1, sessionType: 'run', name: 'Cardio Session', estimatedDurationMin: 35, estimatedTss: 40, sessionJson: { type: 'cardio', options: ['30min treadmill Zone 2', '30min bike', '30min elliptical'] }, swappableWith: ['recovery'] },
    { dayOfWeek: 2, sessionType: 'lift', name: 'Full Body B', estimatedDurationMin: 55, estimatedTss: 55, sessionJson: { type: 'general', format: 'full_body', exercises: [{ name: 'Leg Press', sets: 3, repsOrRange: '12' }, { name: 'DB Shoulder Press', sets: 3, repsOrRange: '12' }, { name: 'Lat Pulldown', sets: 3, repsOrRange: '12' }, { name: 'Leg Curl', sets: 3, repsOrRange: '12' }, { name: 'Dead Bug', sets: 3, repsOrRange: '10 each' }] }, swappableWith: ['strength'] },
    { dayOfWeek: 3, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
    { dayOfWeek: 4, sessionType: 'lift', name: 'Full Body C', estimatedDurationMin: 55, estimatedTss: 55, sessionJson: { type: 'general', format: 'full_body', exercises: [{ name: 'Bulgarian Split Squat', sets: 3, repsOrRange: '10 each' }, { name: 'Push-up Variation', sets: 3, repsOrRange: '12-15' }, { name: 'Dumbbell Row', sets: 3, repsOrRange: '12' }, { name: 'Hip Thrust', sets: 3, repsOrRange: '12' }, { name: 'Farmer Carry', sets: 3, distanceM: 30 }] }, swappableWith: ['strength'] },
    { dayOfWeek: 5, sessionType: 'run', name: 'Optional Cardio', estimatedDurationMin: 30, estimatedTss: 30, sessionJson: { type: 'cardio', notes: 'Optional — pick any cardio modality you enjoy' }, swappableWith: ['recovery'] },
    { dayOfWeek: 6, sessionType: 'rest', name: 'Rest', estimatedDurationMin: 0, estimatedTss: 0, sessionJson: { type: 'rest' }, swappableWith: [] },
  ]
  return base_moderate
}

// ─── Template definitions ─────────────────────────────────────────────────────

interface SessionSpec {
  dayOfWeek: number
  sessionType: string
  name: string
  estimatedDurationMin: number
  estimatedTss: number
  description?: string
  sessionJson: unknown
  swappableWith: string[]
}

interface TemplateSpec {
  discipline: string
  name: string
  phase: string
  intensityLevel: string
  description: string
  daysPerWeek: number
  weeklyTssTarget: number
  sessions: SessionSpec[]
}

const templates: TemplateSpec[] = [
  // ── HYROX ────────────────────────────────────────────────────────────────
  { discipline: 'hyrox', name: 'HYROX Base Recovery', phase: 'base', intensityLevel: 'recovery', description: 'Deload / sick week — keep movement, strip intensity', daysPerWeek: 4, weeklyTssTarget: 200, sessions: hyroxSessions('base', 'recovery') },
  { discipline: 'hyrox', name: 'HYROX Base Low', phase: 'base', intensityLevel: 'low', description: 'Foundation aerobic base and station technique', daysPerWeek: 5, weeklyTssTarget: 340, sessions: hyroxSessions('base', 'low') },
  { discipline: 'hyrox', name: 'HYROX Base Moderate', phase: 'base', intensityLevel: 'moderate', description: 'Moderate aerobic volume + functional work', daysPerWeek: 6, weeklyTssTarget: 430, sessions: hyroxSessions('base', 'moderate') },
  { discipline: 'hyrox', name: 'HYROX Base High', phase: 'base', intensityLevel: 'high', description: 'High-volume base week with race simulations', daysPerWeek: 6, weeklyTssTarget: 560, sessions: hyroxSessions('base', 'high') },
  { discipline: 'hyrox', name: 'HYROX Build Recovery', phase: 'build', intensityLevel: 'recovery', description: 'Recovery week within build phase', daysPerWeek: 4, weeklyTssTarget: 220, sessions: hyroxSessions('build', 'recovery') },
  { discipline: 'hyrox', name: 'HYROX Build Low', phase: 'build', intensityLevel: 'low', description: 'Building intensity and station-specific conditioning', daysPerWeek: 5, weeklyTssTarget: 365, sessions: hyroxSessions('build', 'low') },
  { discipline: 'hyrox', name: 'HYROX Build Moderate', phase: 'build', intensityLevel: 'moderate', description: 'Race-specific conditioning build', daysPerWeek: 6, weeklyTssTarget: 460, sessions: hyroxSessions('build', 'moderate') },
  { discipline: 'hyrox', name: 'HYROX Build High', phase: 'build', intensityLevel: 'high', description: 'Peak build — full race simulations and VO2max', daysPerWeek: 6, weeklyTssTarget: 600, sessions: hyroxSessions('build', 'high') },
  { discipline: 'hyrox', name: 'HYROX Peak Recovery', phase: 'peak', intensityLevel: 'recovery', description: 'Mini deload before race-week peak', daysPerWeek: 4, weeklyTssTarget: 180, sessions: hyroxSessions('peak', 'recovery') },
  { discipline: 'hyrox', name: 'HYROX Peak Moderate', phase: 'peak', intensityLevel: 'moderate', description: 'Race sharpening — maintain fitness, reduce fatigue', daysPerWeek: 5, weeklyTssTarget: 380, sessions: hyroxSessions('peak', 'moderate') },
  { discipline: 'hyrox', name: 'HYROX Taper', phase: 'taper', intensityLevel: 'low', description: 'Race-week taper — stay sharp, arrive fresh', daysPerWeek: 3, weeklyTssTarget: 160, sessions: hyroxSessions('taper', 'low') },

  // ── Powerlifting ─────────────────────────────────────────────────────────
  { discipline: 'powerlifting', name: 'Powerlifting Base Recovery', phase: 'base', intensityLevel: 'recovery', description: 'Deload week — light technique work', daysPerWeek: 3, weeklyTssTarget: 100, sessions: powerliftingSessions('base', 'recovery') },
  { discipline: 'powerlifting', name: 'Powerlifting Base Moderate', phase: 'base', intensityLevel: 'moderate', description: 'Hypertrophy + strength base building', daysPerWeek: 4, weeklyTssTarget: 285, sessions: powerliftingSessions('base', 'moderate') },
  { discipline: 'powerlifting', name: 'Powerlifting Build Moderate', phase: 'build', intensityLevel: 'moderate', description: 'Intensification — ramp RPE, reduce volume', daysPerWeek: 4, weeklyTssTarget: 285, sessions: powerliftingSessions('build', 'moderate') },
  { discipline: 'powerlifting', name: 'Powerlifting Peak High', phase: 'peak', intensityLevel: 'high', description: 'Heavy singles and opener practice', daysPerWeek: 4, weeklyTssTarget: 360, sessions: powerliftingSessions('peak', 'high') },
  { discipline: 'powerlifting', name: 'Powerlifting Taper', phase: 'taper', intensityLevel: 'low', description: 'Competition taper — stay sharp, reduce volume', daysPerWeek: 2, weeklyTssTarget: 110, sessions: powerliftingSessions('taper', 'low') },

  // ── Bodybuilding ─────────────────────────────────────────────────────────
  { discipline: 'bodybuilding', name: 'Bodybuilding Recovery', phase: 'base', intensityLevel: 'recovery', description: 'Light deload — maintain movement patterns', daysPerWeek: 3, weeklyTssTarget: 150, sessions: bodybuildingSessions('base', 'recovery') },
  { discipline: 'bodybuilding', name: 'Bodybuilding Base Moderate', phase: 'base', intensityLevel: 'moderate', description: 'Push/Pull/Legs split — hypertrophy focus', daysPerWeek: 6, weeklyTssTarget: 380, sessions: bodybuildingSessions('base', 'moderate') },
  { discipline: 'bodybuilding', name: 'Bodybuilding Build High', phase: 'build', intensityLevel: 'high', description: 'Intensified PPL — increased RIR proximity', daysPerWeek: 6, weeklyTssTarget: 420, sessions: bodybuildingSessions('build', 'high') },
  { discipline: 'bodybuilding', name: 'Bodybuilding Peak Moderate', phase: 'peak', intensityLevel: 'moderate', description: 'Peak week — manage fatigue, maintain muscle', daysPerWeek: 5, weeklyTssTarget: 300, sessions: bodybuildingSessions('peak', 'moderate') },

  // ── CrossFit ─────────────────────────────────────────────────────────────
  { discipline: 'crossfit', name: 'CrossFit Base Moderate', phase: 'base', intensityLevel: 'moderate', description: 'Strength + WOD mixed methodology', daysPerWeek: 5, weeklyTssTarget: 440, sessions: crossfitSessions('base', 'moderate') },
  { discipline: 'crossfit', name: 'CrossFit Build Moderate', phase: 'build', intensityLevel: 'moderate', description: 'Competition prep — open-style WODs', daysPerWeek: 5, weeklyTssTarget: 480, sessions: crossfitSessions('build', 'moderate') },
  { discipline: 'crossfit', name: 'CrossFit Recovery', phase: 'base', intensityLevel: 'recovery', description: 'Deload — aerobic work and skill drills', daysPerWeek: 3, weeklyTssTarget: 180, sessions: crossfitSessions('base', 'recovery') },

  // ── Running ──────────────────────────────────────────────────────────────
  { discipline: 'running', name: 'Running Base Low', phase: 'base', intensityLevel: 'low', description: 'Aerobic base with tempo work', daysPerWeek: 5, weeklyTssTarget: 325, sessions: runningSessions('base', 'low') },
  { discipline: 'running', name: 'Running Base Moderate', phase: 'base', intensityLevel: 'moderate', description: 'Moderate mileage base building', daysPerWeek: 5, weeklyTssTarget: 400, sessions: runningSessions('base', 'moderate') },
  { discipline: 'running', name: 'Running Base Recovery', phase: 'base', intensityLevel: 'recovery', description: 'Recovery week — easy running only', daysPerWeek: 3, weeklyTssTarget: 160, sessions: runningSessions('base', 'recovery') },
  { discipline: 'running', name: 'Running Peak High', phase: 'peak', intensityLevel: 'high', description: 'Peak week — VO2max and race pace', daysPerWeek: 6, weeklyTssTarget: 485, sessions: runningSessions('peak', 'high') },
  { discipline: 'running', name: 'Running Taper', phase: 'taper', intensityLevel: 'low', description: 'Race taper — maintain sharpness', daysPerWeek: 3, weeklyTssTarget: 175, sessions: runningSessions('taper', 'low') },

  // ── Cycling ──────────────────────────────────────────────────────────────
  { discipline: 'cycling', name: 'Cycling Base Moderate', phase: 'base', intensityLevel: 'moderate', description: 'Aerobic base + sweet spot intervals', daysPerWeek: 4, weeklyTssTarget: 400, sessions: cyclingSessions('base', 'moderate') },
  { discipline: 'cycling', name: 'Cycling Recovery', phase: 'base', intensityLevel: 'recovery', description: 'Easy spin week — active recovery', daysPerWeek: 3, weeklyTssTarget: 175, sessions: cyclingSessions('base', 'recovery') },
  { discipline: 'cycling', name: 'Cycling Build High', phase: 'build', intensityLevel: 'high', description: 'High intensity build — VO2max and threshold', daysPerWeek: 5, weeklyTssTarget: 550, sessions: cyclingSessions('build', 'high') },

  // ── General Fitness ───────────────────────────────────────────────────────
  { discipline: 'general_fitness', name: 'General Fitness Moderate', phase: 'base', intensityLevel: 'moderate', description: '3-day full-body + cardio days', daysPerWeek: 5, weeklyTssTarget: 235, sessions: generalFitnessSessions('base', 'moderate') },
  { discipline: 'general_fitness', name: 'General Fitness Recovery', phase: 'base', intensityLevel: 'recovery', description: 'Light deload week', daysPerWeek: 3, weeklyTssTarget: 110, sessions: generalFitnessSessions('base', 'recovery') },
  { discipline: 'general_fitness', name: 'General Fitness Build Moderate', phase: 'build', intensityLevel: 'moderate', description: 'Progressive overload — add sets and load', daysPerWeek: 5, weeklyTssTarget: 270, sessions: generalFitnessSessions('build', 'moderate') },
]

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding program library...')

  for (const t of templates) {
    const { sessions, ...templateData } = t

    const template = await prisma.programTemplate.upsert({
      where: { discipline_phase_intensityLevel: { discipline: templateData.discipline as never, phase: templateData.phase, intensityLevel: templateData.intensityLevel } },
      update: { name: templateData.name, description: templateData.description, daysPerWeek: templateData.daysPerWeek, weeklyTssTarget: templateData.weeklyTssTarget },
      create: { discipline: templateData.discipline as never, name: templateData.name, phase: templateData.phase, intensityLevel: templateData.intensityLevel, description: templateData.description, daysPerWeek: templateData.daysPerWeek, weeklyTssTarget: templateData.weeklyTssTarget },
    })

    // delete old sessions then recreate so seed is idempotent
    await prisma.programSession.deleteMany({ where: { templateId: template.id } })
    await prisma.programSession.createMany({
      data: sessions.map(s => ({
        templateId: template.id,
        dayOfWeek: s.dayOfWeek,
        sessionType: s.sessionType,
        name: s.name,
        description: s.description ?? null,
        estimatedDurationMin: s.estimatedDurationMin,
        estimatedTss: s.estimatedTss,
        sessionJson: s.sessionJson as never,
        swappableWith: s.swappableWith,
      })),
    })

    console.log(`  ✓ ${template.discipline} / ${template.phase} / ${template.intensityLevel}`)
  }

  console.log(`\nDone — seeded ${templates.length} templates.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

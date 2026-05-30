-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- CreateEnum
CREATE TYPE "Discipline" AS ENUM ('hyrox', 'powerlifting', 'bodybuilding', 'crossfit', 'running', 'cycling', 'general_fitness');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('beginner', 'intermediate', 'advanced', 'elite');

-- CreateEnum
CREATE TYPE "TrainingGoal" AS ENUM ('race_completion', 'race_time', 'competition', 'muscle_gain', 'fat_loss', 'recomposition', 'general_fitness', 'endurance');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "primaryDiscipline" "Discipline" NOT NULL,
    "secondaryDisciplines" "Discipline"[],
    "experienceLevel" "ExperienceLevel" NOT NULL,
    "trainingDaysPerWeek" INTEGER NOT NULL,
    "goal" "TrainingGoal" NOT NULL,
    "goalDate" TIMESTAMP(3),
    "goalDetail" TEXT,
    "bmi" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyMeasurement" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "chestCm" DOUBLE PRECISION,
    "waistCm" DOUBLE PRECISION,
    "hipsCm" DOUBLE PRECISION,
    "leftArmCm" DOUBLE PRECISION,
    "rightArmCm" DOUBLE PRECISION,
    "leftThighCm" DOUBLE PRECISION,
    "rightThighCm" DOUBLE PRECISION,
    "leftCalfCm" DOUBLE PRECISION,
    "rightCalfCm" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION NOT NULL,
    "bodyFatPercent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sleep" INTEGER NOT NULL,
    "energy" INTEGER NOT NULL,
    "motivation" INTEGER NOT NULL,
    "stress" BOOLEAN NOT NULL,
    "stressNote" TEXT,
    "sorenessMap" JSONB NOT NULL,
    "jointPainMap" JSONB,
    "readinessScore" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingPlan" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "goalJson" JSONB NOT NULL,
    "phaseConfig" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "plannedJson" JSONB NOT NULL,
    "actualJson" JSONB,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceConnection" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "providerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionPlan" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tdee" INTEGER NOT NULL,
    "proteinG" INTEGER NOT NULL,
    "carbsG" INTEGER NOT NULL,
    "fatG" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutritionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" UUID NOT NULL,
    "nutritionPlanId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramTemplate" (
    "id" UUID NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "name" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "intensityLevel" TEXT NOT NULL,
    "description" TEXT,
    "daysPerWeek" INTEGER NOT NULL,
    "weeklyTssTarget" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramSession" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "sessionType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "estimatedDurationMin" INTEGER NOT NULL,
    "estimatedTss" INTEGER NOT NULL,
    "sessionJson" JSONB NOT NULL,
    "swappableWith" TEXT[],

    CONSTRAINT "ProgramSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "distanceM" DOUBLE PRECISION,
    "avgHr" INTEGER,
    "maxHr" INTEGER,
    "calories" INTEGER,
    "tss" INTEGER,
    "elevationM" DOUBLE PRECISION,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingLoad" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "atl" DOUBLE PRECISION NOT NULL,
    "ctl" DOUBLE PRECISION NOT NULL,
    "tsb" DOUBLE PRECISION NOT NULL,
    "dailyTss" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingLoad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteProfile_userId_key" ON "AthleteProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceConnection_userId_provider_key" ON "DeviceConnection"("userId", "provider");

-- CreateIndex
CREATE INDEX "ProgramTemplate_discipline_phase_idx" ON "ProgramTemplate"("discipline", "phase");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramTemplate_discipline_phase_intensityLevel_key" ON "ProgramTemplate"("discipline", "phase", "intensityLevel");

-- CreateIndex
CREATE INDEX "ProgramSession_templateId_idx" ON "ProgramSession"("templateId");

-- CreateIndex
CREATE INDEX "Activity_userId_startedAt_idx" ON "Activity"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_provider_externalId_key" ON "Activity"("provider", "externalId");

-- CreateIndex
CREATE INDEX "TrainingLoad_userId_date_idx" ON "TrainingLoad"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingLoad_userId_date_key" ON "TrainingLoad"("userId", "date");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyMeasurement" ADD CONSTRAINT "BodyMeasurement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TrainingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceConnection" ADD CONSTRAINT "DeviceConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionPlan" ADD CONSTRAINT "NutritionPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_nutritionPlanId_fkey" FOREIGN KEY ("nutritionPlanId") REFERENCES "NutritionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramSession" ADD CONSTRAINT "ProgramSession_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProgramTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingLoad" ADD CONSTRAINT "TrainingLoad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

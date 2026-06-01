-- AlterTable
ALTER TABLE "AthleteProfile" ADD COLUMN     "availableEquipment" TEXT[];

-- CreateTable
CREATE TABLE "SessionOverride" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "weekStart" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "swapName" TEXT,
    "swapType" TEXT,
    "swapDurationMin" INTEGER,
    "swapJson" JSONB,
    "moveToDay" INTEGER,
    "customName" TEXT,
    "customType" TEXT,
    "customDurationMin" INTEGER,
    "customJson" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionOverride_userId_weekStart_idx" ON "SessionOverride"("userId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "SessionOverride_userId_weekStart_dayOfWeek_key" ON "SessionOverride"("userId", "weekStart", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "SessionOverride" ADD CONSTRAINT "SessionOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

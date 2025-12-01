-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "pre_planning_appointments" (
    "id" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "funeralHomeId" TEXT NOT NULL,
    "directorId" TEXT NOT NULL,
    "directorName" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "familyEmail" TEXT NOT NULL,
    "familyPhone" TEXT NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "notes" TEXT,
    "status" "AppointmentStatus" NOT NULL,
    "reminderEmailSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSmsSent" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "pre_planning_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pre_planning_appointments_businessKey_isCurrent_idx" ON "pre_planning_appointments"("businessKey", "isCurrent");

-- CreateIndex
CREATE INDEX "pre_planning_appointments_validFrom_validTo_idx" ON "pre_planning_appointments"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "pre_planning_appointments_funeralHomeId_idx" ON "pre_planning_appointments"("funeralHomeId");

-- CreateIndex
CREATE INDEX "pre_planning_appointments_directorId_idx" ON "pre_planning_appointments"("directorId");

-- CreateIndex
CREATE INDEX "pre_planning_appointments_familyEmail_idx" ON "pre_planning_appointments"("familyEmail");

-- CreateIndex
CREATE INDEX "pre_planning_appointments_appointmentDate_idx" ON "pre_planning_appointments"("appointmentDate");

-- CreateIndex
CREATE INDEX "pre_planning_appointments_status_idx" ON "pre_planning_appointments"("status");

-- CreateIndex
CREATE INDEX "pre_planning_appointments_reminderEmailSent_idx" ON "pre_planning_appointments"("reminderEmailSent");

-- CreateIndex
CREATE UNIQUE INDEX "pre_planning_appointments_businessKey_version_key" ON "pre_planning_appointments"("businessKey", "version");

-- AddForeignKey
ALTER TABLE "pre_planning_appointments" ADD CONSTRAINT "pre_planning_appointments_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "funeral_homes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

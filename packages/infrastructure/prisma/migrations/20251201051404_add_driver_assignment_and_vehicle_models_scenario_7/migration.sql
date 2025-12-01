-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('REMOVAL', 'TRANSFER', 'PROCESSION');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED');

-- CreateTable
CREATE TABLE "driver_assignments" (
    "id" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "funeralHomeId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "eventType" "EventType" NOT NULL,
    "caseId" TEXT NOT NULL,
    "pickupLocation" JSONB NOT NULL,
    "dropoffLocation" JSONB NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "estimatedDuration" INTEGER NOT NULL,
    "actualDuration" INTEGER,
    "status" "AssignmentStatus" NOT NULL,
    "mileageStart" INTEGER,
    "mileageEnd" INTEGER,
    "mileageAllowance" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "driver_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "funeralHomeId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "VehicleStatus" NOT NULL,
    "mileageCurrentTotal" INTEGER NOT NULL,
    "lastMaintenanceDate" TIMESTAMP(3),
    "nextMaintenanceDate" TIMESTAMP(3) NOT NULL,
    "lastInspectionDate" TIMESTAMP(3),
    "nextInspectionDate" TIMESTAMP(3) NOT NULL,
    "acquisitionDate" TIMESTAMP(3) NOT NULL,
    "retirementDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "driver_assignments_businessKey_isCurrent_idx" ON "driver_assignments"("businessKey", "isCurrent");

-- CreateIndex
CREATE INDEX "driver_assignments_validFrom_validTo_idx" ON "driver_assignments"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "driver_assignments_funeralHomeId_idx" ON "driver_assignments"("funeralHomeId");

-- CreateIndex
CREATE INDEX "driver_assignments_driverId_idx" ON "driver_assignments"("driverId");

-- CreateIndex
CREATE INDEX "driver_assignments_vehicleId_idx" ON "driver_assignments"("vehicleId");

-- CreateIndex
CREATE INDEX "driver_assignments_caseId_idx" ON "driver_assignments"("caseId");

-- CreateIndex
CREATE INDEX "driver_assignments_scheduledTime_idx" ON "driver_assignments"("scheduledTime");

-- CreateIndex
CREATE INDEX "driver_assignments_status_idx" ON "driver_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "driver_assignments_businessKey_version_key" ON "driver_assignments"("businessKey", "version");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_licensePlate_key" ON "vehicles"("licensePlate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "vehicles"("vin");

-- CreateIndex
CREATE INDEX "vehicles_businessKey_isCurrent_idx" ON "vehicles"("businessKey", "isCurrent");

-- CreateIndex
CREATE INDEX "vehicles_validFrom_validTo_idx" ON "vehicles"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "vehicles_funeralHomeId_idx" ON "vehicles"("funeralHomeId");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_nextInspectionDate_idx" ON "vehicles"("nextInspectionDate");

-- CreateIndex
CREATE INDEX "vehicles_nextMaintenanceDate_idx" ON "vehicles"("nextMaintenanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_businessKey_version_key" ON "vehicles"("businessKey", "version");

-- AddForeignKey
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "funeral_homes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "funeral_homes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

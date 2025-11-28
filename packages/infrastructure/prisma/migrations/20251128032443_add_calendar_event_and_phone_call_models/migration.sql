-- CreateEnum
CREATE TYPE "CalendarProvider" AS ENUM ('MICROSOFT', 'GOOGLE');

-- CreateEnum
CREATE TYPE "PhoneProvider" AS ENUM ('TWILIO', 'RINGCENTRAL');

-- CreateEnum
CREATE TYPE "CallDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('INITIATED', 'RINGING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'BUSY', 'NO_ANSWER', 'CANCELLED');

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "funeralHomeId" TEXT NOT NULL,
    "interactionId" TEXT,
    "provider" "CalendarProvider" NOT NULL,
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "attendees" JSONB NOT NULL DEFAULT '[]',
    "reminders" JSONB NOT NULL DEFAULT '[]',
    "recurrenceRule" TEXT,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "caseId" TEXT,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_calls" (
    "id" TEXT NOT NULL,
    "funeralHomeId" TEXT NOT NULL,
    "interactionId" TEXT,
    "provider" "PhoneProvider" NOT NULL,
    "externalCallId" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "direction" "CallDirection" NOT NULL,
    "status" "CallStatus" NOT NULL,
    "duration" INTEGER,
    "recordingUrl" TEXT,
    "transcription" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "outcome" TEXT,
    "contactId" TEXT,
    "leadId" TEXT,
    "caseId" TEXT,
    "staffId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_interactionId_key" ON "calendar_events"("interactionId");

-- CreateIndex
CREATE INDEX "calendar_events_funeralHomeId_idx" ON "calendar_events"("funeralHomeId");

-- CreateIndex
CREATE INDEX "calendar_events_interactionId_idx" ON "calendar_events"("interactionId");

-- CreateIndex
CREATE INDEX "calendar_events_caseId_idx" ON "calendar_events"("caseId");

-- CreateIndex
CREATE INDEX "calendar_events_startTime_idx" ON "calendar_events"("startTime");

-- CreateIndex
CREATE INDEX "calendar_events_endTime_idx" ON "calendar_events"("endTime");

-- CreateIndex
CREATE INDEX "calendar_events_createdBy_idx" ON "calendar_events"("createdBy");

-- CreateIndex
CREATE INDEX "calendar_events_isCancelled_idx" ON "calendar_events"("isCancelled");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_provider_externalId_key" ON "calendar_events"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "phone_calls_interactionId_key" ON "phone_calls"("interactionId");

-- CreateIndex
CREATE INDEX "phone_calls_funeralHomeId_idx" ON "phone_calls"("funeralHomeId");

-- CreateIndex
CREATE INDEX "phone_calls_interactionId_idx" ON "phone_calls"("interactionId");

-- CreateIndex
CREATE INDEX "phone_calls_contactId_idx" ON "phone_calls"("contactId");

-- CreateIndex
CREATE INDEX "phone_calls_leadId_idx" ON "phone_calls"("leadId");

-- CreateIndex
CREATE INDEX "phone_calls_caseId_idx" ON "phone_calls"("caseId");

-- CreateIndex
CREATE INDEX "phone_calls_staffId_idx" ON "phone_calls"("staffId");

-- CreateIndex
CREATE INDEX "phone_calls_startedAt_idx" ON "phone_calls"("startedAt");

-- CreateIndex
CREATE INDEX "phone_calls_createdAt_idx" ON "phone_calls"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "phone_calls_provider_externalCallId_key" ON "phone_calls"("provider", "externalCallId");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "funeral_homes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "interactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_calls" ADD CONSTRAINT "phone_calls_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "funeral_homes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_calls" ADD CONSTRAINT "phone_calls_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "interactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_calls" ADD CONSTRAINT "phone_calls_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_calls" ADD CONSTRAINT "phone_calls_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_calls" ADD CONSTRAINT "phone_calls_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_calls" ADD CONSTRAINT "phone_calls_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

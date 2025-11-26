-- CreateTable
CREATE TABLE "internal_notes" (
    "id" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "caseId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "internal_notes_businessKey_isCurrent_idx" ON "internal_notes"("businessKey", "isCurrent");

-- CreateIndex
CREATE INDEX "internal_notes_validFrom_validTo_idx" ON "internal_notes"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "internal_notes_caseId_isCurrent_idx" ON "internal_notes"("caseId", "isCurrent");

-- CreateIndex
CREATE INDEX "internal_notes_createdBy_idx" ON "internal_notes"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "internal_notes_businessKey_version_key" ON "internal_notes"("businessKey", "version");

-- AddForeignKey
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

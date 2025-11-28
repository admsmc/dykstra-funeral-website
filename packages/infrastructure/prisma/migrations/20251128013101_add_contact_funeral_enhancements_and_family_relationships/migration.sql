-- CreateEnum
CREATE TYPE "GriefStage" AS ENUM ('SHOCK', 'DENIAL', 'ANGER', 'BARGAINING', 'DEPRESSION', 'ACCEPTANCE');

-- CreateEnum
CREATE TYPE "MilitaryBranch" AS ENUM ('ARMY', 'NAVY', 'AIR_FORCE', 'MARINES', 'COAST_GUARD', 'SPACE_FORCE');

-- CreateEnum
CREATE TYPE "LanguagePreference" AS ENUM ('EN', 'ES', 'FR', 'DE', 'PL', 'IT', 'ZH', 'OTHER');

-- CreateEnum
CREATE TYPE "FamilyRelationshipType" AS ENUM ('SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'GRANDCHILD', 'GRANDPARENT', 'NIECE_NEPHEW', 'AUNT_UNCLE', 'COUSIN', 'IN_LAW', 'STEP_RELATION', 'FRIEND', 'OTHER');

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "culturalPreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "decedentRelationshipId" TEXT,
ADD COLUMN     "dietaryRestrictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "griefJourneyStartedAt" TIMESTAMP(3),
ADD COLUMN     "griefStage" "GriefStage",
ADD COLUMN     "isVeteran" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "languagePreference" "LanguagePreference" NOT NULL DEFAULT 'EN',
ADD COLUMN     "lastGriefCheckIn" TIMESTAMP(3),
ADD COLUMN     "militaryBranch" "MilitaryBranch",
ADD COLUMN     "religiousAffiliation" TEXT,
ADD COLUMN     "serviceAnniversaryDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "family_relationships" (
    "id" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "funeralHomeId" TEXT NOT NULL,
    "sourceContactId" TEXT NOT NULL,
    "targetContactId" TEXT NOT NULL,
    "relationshipType" "FamilyRelationshipType" NOT NULL,
    "isPrimaryContact" BOOLEAN NOT NULL DEFAULT false,
    "decedentId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "family_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "family_relationships_businessKey_isCurrent_idx" ON "family_relationships"("businessKey", "isCurrent");

-- CreateIndex
CREATE INDEX "family_relationships_validFrom_validTo_idx" ON "family_relationships"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "family_relationships_funeralHomeId_idx" ON "family_relationships"("funeralHomeId");

-- CreateIndex
CREATE INDEX "family_relationships_sourceContactId_idx" ON "family_relationships"("sourceContactId");

-- CreateIndex
CREATE INDEX "family_relationships_targetContactId_idx" ON "family_relationships"("targetContactId");

-- CreateIndex
CREATE INDEX "family_relationships_decedentId_idx" ON "family_relationships"("decedentId");

-- CreateIndex
CREATE UNIQUE INDEX "family_relationships_businessKey_version_key" ON "family_relationships"("businessKey", "version");

-- CreateIndex
CREATE INDEX "contacts_griefStage_idx" ON "contacts"("griefStage");

-- CreateIndex
CREATE INDEX "contacts_serviceAnniversaryDate_idx" ON "contacts"("serviceAnniversaryDate");

-- AddForeignKey
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "funeral_homes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_sourceContactId_fkey" FOREIGN KEY ("sourceContactId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_targetContactId_fkey" FOREIGN KEY ("targetContactId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_decedentId_fkey" FOREIGN KEY ("decedentId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

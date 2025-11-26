-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "family_invitations" (
    "id" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "caseId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "relationship" TEXT,
    "role" "CaseMemberRole" NOT NULL DEFAULT 'FAMILY_MEMBER',
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "sentBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "family_invitations_businessKey_isCurrent_idx" ON "family_invitations"("businessKey", "isCurrent");

-- CreateIndex
CREATE INDEX "family_invitations_validFrom_validTo_idx" ON "family_invitations"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "family_invitations_caseId_isCurrent_idx" ON "family_invitations"("caseId", "isCurrent");

-- CreateIndex
CREATE INDEX "family_invitations_email_idx" ON "family_invitations"("email");

-- CreateIndex
CREATE INDEX "family_invitations_token_idx" ON "family_invitations"("token");

-- CreateIndex
CREATE INDEX "family_invitations_status_idx" ON "family_invitations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "family_invitations_businessKey_version_key" ON "family_invitations"("businessKey", "version");

-- CreateIndex
CREATE UNIQUE INDEX "family_invitations_token_key" ON "family_invitations"("token");

-- AddForeignKey
ALTER TABLE "family_invitations" ADD CONSTRAINT "family_invitations_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_invitations" ADD CONSTRAINT "family_invitations_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

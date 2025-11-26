-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FAMILY_PRIMARY', 'FAMILY_MEMBER', 'STAFF', 'DIRECTOR', 'ADMIN', 'FUNERAL_DIRECTOR');

-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('AT_NEED', 'PRE_NEED', 'INQUIRY');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('INQUIRY', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('TRADITIONAL_BURIAL', 'TRADITIONAL_CREMATION', 'MEMORIAL_SERVICE', 'DIRECT_BURIAL', 'DIRECT_CREMATION', 'CELEBRATION_OF_LIFE');

-- CreateEnum
CREATE TYPE "CaseMemberRole" AS ENUM ('PRIMARY_CONTACT', 'FAMILY_MEMBER');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PENDING_SIGNATURES', 'FULLY_SIGNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'ACH', 'CHECK', 'CASH', 'INSURANCE_ASSIGNMENT', 'PAYMENT_PLAN');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentFrequency" AS ENUM ('WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "PaymentPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "PaymentPlanInstallmentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InsuranceAssignmentStatus" AS ENUM ('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'DENIED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CONTRACT', 'DEATH_CERTIFICATE', 'SERVICE_PROGRAM', 'INSURANCE_DOCUMENT', 'RECEIPT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('CASKET', 'URN', 'VAULT', 'FLOWERS', 'MEMORIAL_CARDS', 'GUEST_BOOK', 'JEWELRY', 'KEEPSAKE', 'MISCELLANEOUS');

-- CreateTable
CREATE TABLE "funeral_homes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "settings" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funeral_homes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "funeralHomeId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "passwordHash" TEXT,
    "emailVerified" TIMESTAMP(3),
    "preferences" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "funeralHomeId" TEXT NOT NULL,
    "decedentName" TEXT NOT NULL,
    "decedentDateOfBirth" TIMESTAMP(3),
    "decedentDateOfDeath" TIMESTAMP(3),
    "type" "CaseType" NOT NULL,
    "status" "CaseStatus" NOT NULL,
    "serviceType" "ServiceType",
    "serviceDate" TIMESTAMP(3),
    "arrangements" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_members" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CaseMemberRole" NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "case_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "temporalVersion" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "caseId" TEXT NOT NULL,
    "contractVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "ContractStatus" NOT NULL,
    "services" JSONB NOT NULL DEFAULT '[]',
    "products" JSONB NOT NULL DEFAULT '[]',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "termsAndConditions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signatures" (
    "id" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "contractId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerEmail" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "signatureData" TEXT NOT NULL,
    "consentText" TEXT NOT NULL,
    "consentAccepted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "caseId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripePaymentMethodId" TEXT,
    "receiptUrl" TEXT,
    "failureReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_plans" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "downPayment" DECIMAL(10,2) NOT NULL,
    "remainingBalance" DECIMAL(10,2) NOT NULL,
    "numberOfInstallments" INTEGER NOT NULL,
    "installmentAmount" DECIMAL(10,2) NOT NULL,
    "frequency" "PaymentFrequency" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "nextPaymentDue" TIMESTAMP(3),
    "status" "PaymentPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "payment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_plan_installments" (
    "id" TEXT NOT NULL,
    "paymentPlanId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "PaymentPlanInstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "paidDate" TIMESTAMP(3),
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_plan_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_assignments" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "insuranceCompany" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "policyHolderName" TEXT NOT NULL,
    "assignedAmount" DECIMAL(10,2) NOT NULL,
    "claimNumber" TEXT,
    "status" "InsuranceAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "submittedDate" TIMESTAMP(3),
    "approvedDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "insurance_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memorials" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "allowPhotoUploads" BOOLEAN NOT NULL DEFAULT true,
    "allowTributes" BOOLEAN NOT NULL DEFAULT true,
    "allowGuestbook" BOOLEAN NOT NULL DEFAULT true,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memorials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "memorialId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "caption" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "memorialId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "title" TEXT,
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedByName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tributes" (
    "id" TEXT NOT NULL,
    "memorialId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT,
    "message" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guestbook_entries" (
    "id" TEXT NOT NULL,
    "memorialId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "city" TEXT,
    "state" CHAR(2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guestbook_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "assignedTo" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_catalog" (
    "id" TEXT NOT NULL,
    "funeralHomeId" TEXT,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "imageUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_catalog" (
    "id" TEXT NOT NULL,
    "funeralHomeId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_templates" (
    "id" TEXT NOT NULL,
    "funeralHomeId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serviceType" "ServiceType",
    "content" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_funeralHomeId_idx" ON "users"("funeralHomeId");

-- CreateIndex
CREATE INDEX "cases_businessKey_isCurrent_idx" ON "cases"("businessKey", "isCurrent");

-- CreateIndex
CREATE INDEX "cases_validFrom_validTo_idx" ON "cases"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "cases_funeralHomeId_idx" ON "cases"("funeralHomeId");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "cases_serviceDate_idx" ON "cases"("serviceDate");

-- CreateIndex
CREATE UNIQUE INDEX "cases_businessKey_version_key" ON "cases"("businessKey", "version");

-- CreateIndex
CREATE INDEX "case_members_caseId_idx" ON "case_members"("caseId");

-- CreateIndex
CREATE INDEX "case_members_userId_idx" ON "case_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "case_members_caseId_userId_key" ON "case_members"("caseId", "userId");

-- CreateIndex
CREATE INDEX "contracts_businessKey_isCurrent_idx" ON "contracts"("businessKey", "isCurrent");

-- CreateIndex
CREATE INDEX "contracts_validFrom_validTo_idx" ON "contracts"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "contracts_caseId_idx" ON "contracts"("caseId");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_businessKey_temporalVersion_key" ON "contracts"("businessKey", "temporalVersion");

-- CreateIndex
CREATE INDEX "signatures_businessKey_isCurrent_idx" ON "signatures"("businessKey", "isCurrent");

-- CreateIndex
CREATE INDEX "signatures_validFrom_idx" ON "signatures"("validFrom");

-- CreateIndex
CREATE INDEX "signatures_contractId_idx" ON "signatures"("contractId");

-- CreateIndex
CREATE INDEX "signatures_signerId_idx" ON "signatures"("signerId");

-- CreateIndex
CREATE UNIQUE INDEX "signatures_businessKey_version_key" ON "signatures"("businessKey", "version");

-- CreateIndex
CREATE INDEX "payments_businessKey_isCurrent_idx" ON "payments"("businessKey", "isCurrent");

-- CreateIndex
CREATE INDEX "payments_validFrom_validTo_idx" ON "payments"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "payments_caseId_idx" ON "payments"("caseId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_businessKey_version_key" ON "payments"("businessKey", "version");

-- CreateIndex
CREATE INDEX "payment_plans_caseId_idx" ON "payment_plans"("caseId");

-- CreateIndex
CREATE INDEX "payment_plans_status_idx" ON "payment_plans"("status");

-- CreateIndex
CREATE INDEX "payment_plan_installments_paymentPlanId_idx" ON "payment_plan_installments"("paymentPlanId");

-- CreateIndex
CREATE INDEX "payment_plan_installments_status_idx" ON "payment_plan_installments"("status");

-- CreateIndex
CREATE INDEX "insurance_assignments_caseId_idx" ON "insurance_assignments"("caseId");

-- CreateIndex
CREATE INDEX "insurance_assignments_status_idx" ON "insurance_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "memorials_caseId_key" ON "memorials"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "memorials_slug_key" ON "memorials"("slug");

-- CreateIndex
CREATE INDEX "memorials_slug_idx" ON "memorials"("slug");

-- CreateIndex
CREATE INDEX "photos_businessKey_isCurrent_idx" ON "photos"("businessKey", "isCurrent");

-- CreateIndex
CREATE INDEX "photos_validFrom_validTo_idx" ON "photos"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "photos_memorialId_isCurrent_idx" ON "photos"("memorialId", "isCurrent");

-- CreateIndex
CREATE INDEX "photos_caseId_isCurrent_idx" ON "photos"("caseId", "isCurrent");

-- CreateIndex
CREATE INDEX "photos_uploadedBy_idx" ON "photos"("uploadedBy");

-- CreateIndex
CREATE UNIQUE INDEX "photos_businessKey_version_key" ON "photos"("businessKey", "version");

-- CreateIndex
CREATE INDEX "videos_memorialId_idx" ON "videos"("memorialId");

-- CreateIndex
CREATE INDEX "tributes_memorialId_idx" ON "tributes"("memorialId");

-- CreateIndex
CREATE INDEX "tributes_isApproved_idx" ON "tributes"("isApproved");

-- CreateIndex
CREATE INDEX "guestbook_entries_memorialId_idx" ON "guestbook_entries"("memorialId");

-- CreateIndex
CREATE INDEX "documents_caseId_idx" ON "documents"("caseId");

-- CreateIndex
CREATE INDEX "tasks_caseId_idx" ON "tasks"("caseId");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_assignedTo_idx" ON "tasks"("assignedTo");

-- CreateIndex
CREATE UNIQUE INDEX "family_invitations_token_key" ON "family_invitations"("token");

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
CREATE INDEX "internal_notes_businessKey_isCurrent_idx" ON "internal_notes"("businessKey", "isCurrent");

-- CreateIndex
CREATE INDEX "internal_notes_validFrom_validTo_idx" ON "internal_notes"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "internal_notes_caseId_isCurrent_idx" ON "internal_notes"("caseId", "isCurrent");

-- CreateIndex
CREATE INDEX "internal_notes_createdBy_idx" ON "internal_notes"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "internal_notes_businessKey_version_key" ON "internal_notes"("businessKey", "version");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "product_catalog_sku_key" ON "product_catalog"("sku");

-- CreateIndex
CREATE INDEX "product_catalog_funeralHomeId_idx" ON "product_catalog"("funeralHomeId");

-- CreateIndex
CREATE INDEX "product_catalog_category_idx" ON "product_catalog"("category");

-- CreateIndex
CREATE INDEX "product_catalog_isAvailable_idx" ON "product_catalog"("isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "service_catalog_code_key" ON "service_catalog"("code");

-- CreateIndex
CREATE INDEX "service_catalog_funeralHomeId_idx" ON "service_catalog"("funeralHomeId");

-- CreateIndex
CREATE INDEX "service_catalog_serviceType_idx" ON "service_catalog"("serviceType");

-- CreateIndex
CREATE INDEX "service_catalog_isAvailable_idx" ON "service_catalog"("isAvailable");

-- CreateIndex
CREATE INDEX "contract_templates_funeralHomeId_idx" ON "contract_templates"("funeralHomeId");

-- CreateIndex
CREATE INDEX "contract_templates_serviceType_idx" ON "contract_templates"("serviceType");

-- CreateIndex
CREATE INDEX "contract_templates_isDefault_idx" ON "contract_templates"("isDefault");

-- CreateIndex
CREATE INDEX "contract_templates_isActive_idx" ON "contract_templates"("isActive");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "funeral_homes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "funeral_homes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_members" ADD CONSTRAINT "case_members_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_members" ADD CONSTRAINT "case_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_plan_installments" ADD CONSTRAINT "payment_plan_installments_paymentPlanId_fkey" FOREIGN KEY ("paymentPlanId") REFERENCES "payment_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorials" ADD CONSTRAINT "memorials_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "memorials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "memorials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tributes" ADD CONSTRAINT "tributes_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "memorials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guestbook_entries" ADD CONSTRAINT "guestbook_entries_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "memorials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_invitations" ADD CONSTRAINT "family_invitations_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_invitations" ADD CONSTRAINT "family_invitations_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_catalog" ADD CONSTRAINT "product_catalog_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "funeral_homes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_catalog" ADD CONSTRAINT "service_catalog_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "funeral_homes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "funeral_homes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

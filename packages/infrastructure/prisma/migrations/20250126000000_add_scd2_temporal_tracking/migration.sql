-- SCD Type 2 Temporal Tracking Migration
-- Adds businessKey, version, validFrom, validTo, isCurrent fields to critical tables
-- for audit trail and legal compliance

-- ============================================
-- Case Table - Add SCD2 fields
-- ============================================

-- Add new columns (nullable initially for data migration)
ALTER TABLE "cases" ADD COLUMN "business_key" TEXT;
ALTER TABLE "cases" ADD COLUMN "version" INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE "cases" ADD COLUMN "valid_from" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "cases" ADD COLUMN "valid_to" TIMESTAMP(3);
ALTER TABLE "cases" ADD COLUMN "is_current" BOOLEAN DEFAULT true NOT NULL;

-- Populate businessKey for existing records (use existing ID as business key)
UPDATE "cases" SET "business_key" = "id" WHERE "business_key" IS NULL;

-- Make businessKey non-nullable after population
ALTER TABLE "cases" ALTER COLUMN "business_key" SET NOT NULL;

-- Create unique constraint for businessKey + version
CREATE UNIQUE INDEX "cases_business_key_version_key" ON "cases"("business_key", "version");

-- Create indexes for temporal queries
CREATE INDEX "cases_business_key_is_current_idx" ON "cases"("business_key", "is_current");
CREATE INDEX "cases_valid_from_valid_to_idx" ON "cases"("valid_from", "valid_to");

-- ============================================
-- Contract Table - Add SCD2 fields
-- ============================================

-- Rename existing 'version' to 'contractVersion' to avoid conflict
ALTER TABLE "contracts" RENAME COLUMN "version" TO "contract_version";

-- Add new SCD2 columns
ALTER TABLE "contracts" ADD COLUMN "business_key" TEXT;
ALTER TABLE "contracts" ADD COLUMN "temporal_version" INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE "contracts" ADD COLUMN "valid_from" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "contracts" ADD COLUMN "valid_to" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN "is_current" BOOLEAN DEFAULT true NOT NULL;

-- Populate businessKey for existing records
UPDATE "contracts" SET "business_key" = "id" WHERE "business_key" IS NULL;

-- Make businessKey non-nullable
ALTER TABLE "contracts" ALTER COLUMN "business_key" SET NOT NULL;

-- Create unique constraint and indexes
CREATE UNIQUE INDEX "contracts_business_key_temporal_version_key" ON "contracts"("business_key", "temporal_version");
CREATE INDEX "contracts_business_key_is_current_idx" ON "contracts"("business_key", "is_current");
CREATE INDEX "contracts_valid_from_valid_to_idx" ON "contracts"("valid_from", "valid_to");

-- ============================================
-- Signature Table - Add SCD2 fields
-- ============================================

ALTER TABLE "signatures" ADD COLUMN "business_key" TEXT;
ALTER TABLE "signatures" ADD COLUMN "version" INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE "signatures" ADD COLUMN "valid_from" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "signatures" ADD COLUMN "valid_to" TIMESTAMP(3);
ALTER TABLE "signatures" ADD COLUMN "is_current" BOOLEAN DEFAULT true NOT NULL;

-- Populate businessKey for existing records
UPDATE "signatures" SET "business_key" = "id" WHERE "business_key" IS NULL;

-- Make businessKey non-nullable
ALTER TABLE "signatures" ALTER COLUMN "business_key" SET NOT NULL;

-- Create unique constraint and indexes
CREATE UNIQUE INDEX "signatures_business_key_version_key" ON "signatures"("business_key", "version");
CREATE INDEX "signatures_business_key_is_current_idx" ON "signatures"("business_key", "is_current");
CREATE INDEX "signatures_valid_from_idx" ON "signatures"("valid_from");

-- ============================================
-- Payment Table - Add SCD2 fields
-- ============================================

ALTER TABLE "payments" ADD COLUMN "business_key" TEXT;
ALTER TABLE "payments" ADD COLUMN "version" INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE "payments" ADD COLUMN "valid_from" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE "payments" ADD COLUMN "valid_to" TIMESTAMP(3);
ALTER TABLE "payments" ADD COLUMN "is_current" BOOLEAN DEFAULT true NOT NULL;

-- Populate businessKey for existing records
UPDATE "payments" SET "business_key" = "id" WHERE "business_key" IS NULL;

-- Make businessKey non-nullable
ALTER TABLE "payments" ALTER COLUMN "business_key" SET NOT NULL;

-- Create unique constraint and indexes
CREATE UNIQUE INDEX "payments_business_key_version_key" ON "payments"("business_key", "version");
CREATE INDEX "payments_business_key_is_current_idx" ON "payments"("business_key", "is_current");
CREATE INDEX "payments_valid_from_valid_to_idx" ON "payments"("valid_from", "valid_to");

-- ============================================
-- Comments
-- ============================================

-- SCD Type 2 Implementation Notes:
-- 1. businessKey: Immutable identifier that remains constant across versions
-- 2. version: Increments with each change (1, 2, 3, ...)
-- 3. validFrom: When this version became effective
-- 4. validTo: When this version was superseded (NULL = current)
-- 5. isCurrent: Fast lookup for current version (WHERE isCurrent = true)
--
-- On UPDATE operations:
-- - Close current version: SET validTo = NOW(), isCurrent = false
-- - Insert new version: version = MAX(version) + 1, validFrom = NOW(), isCurrent = true
--
-- Benefits:
-- - Complete audit trail for legal compliance
-- - Point-in-time queries (as of date X, what did this look like?)
-- - Immutable signed contracts (ESIGN Act compliant)
-- - Payment history tracking for accounting
-- - Dispute resolution (what changed and when?)

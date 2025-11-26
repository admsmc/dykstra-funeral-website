-- Photo Table with SCD Type 2 Temporal Tracking
-- Tracks photo metadata changes (caption edits) with version history

-- ============================================
-- Photo Table - Create with SCD2 fields
-- ============================================

CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "business_key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMP(3),
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "memorial_id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "caption" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "width" INTEGER,
    "height" INTEGER,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for businessKey + version (SCD2 requirement)
CREATE UNIQUE INDEX "photos_business_key_version_key" ON "photos"("business_key", "version");

-- Create indexes for temporal queries (SCD2 requirement)
CREATE INDEX "photos_business_key_is_current_idx" ON "photos"("business_key", "is_current");
CREATE INDEX "photos_valid_from_valid_to_idx" ON "photos"("valid_from", "valid_to");

-- Create indexes for fast lookups
CREATE INDEX "photos_memorial_id_is_current_idx" ON "photos"("memorial_id", "is_current");
CREATE INDEX "photos_case_id_is_current_idx" ON "photos"("case_id", "is_current");
CREATE INDEX "photos_uploaded_by_idx" ON "photos"("uploaded_by");

-- Add foreign key constraints
ALTER TABLE "photos" ADD CONSTRAINT "photos_memorial_id_fkey" FOREIGN KEY ("memorial_id") REFERENCES "memorials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "photos" ADD CONSTRAINT "photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- Comments
-- ============================================

-- SCD Type 2 Implementation for Photos:
-- 1. businessKey: Immutable photo identifier (constant across caption edits)
-- 2. version: Increments with each caption edit (1, 2, 3, ...)
-- 3. validFrom: When this version became effective
-- 4. validTo: When this version was superseded (NULL = current)
-- 5. isCurrent: Fast lookup for current version (WHERE isCurrent = true)
--
-- On caption UPDATE operations:
-- - Close current version: SET validTo = NOW(), isCurrent = false
-- - Insert new version: version = MAX(version) + 1, validFrom = NOW(), isCurrent = true
--
-- On DELETE operations:
-- - Soft delete: SET isCurrent = false, validTo = NOW()
-- - Storage cleanup happens asynchronously
--
-- Benefits:
-- - Complete audit trail of photo captions for moderation
-- - Immutable upload history (who uploaded what and when)
-- - Storage key retained for cleanup even after soft delete

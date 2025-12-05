-- Template Analytics Schema
-- Tracks template usage, generation metrics, and errors

CREATE TABLE "template_generation_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "template_business_key" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "template_category" TEXT NOT NULL,
    "template_version" INTEGER NOT NULL,
    "generation_type" TEXT NOT NULL, -- 'service_program', 'prayer_card', etc.
    "status" TEXT NOT NULL, -- 'success', 'error'
    "duration_ms" INTEGER NOT NULL,
    "pdf_size_bytes" INTEGER,
    "error_message" TEXT,
    "error_stack" TEXT,
    "user_id" TEXT,
    "funeral_home_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB
);

-- Indexes for analytics queries
CREATE INDEX "template_generation_log_business_key_idx" ON "template_generation_log"("template_business_key");
CREATE INDEX "template_generation_log_category_idx" ON "template_generation_log"("template_category");
CREATE INDEX "template_generation_log_status_idx" ON "template_generation_log"("status");
CREATE INDEX "template_generation_log_created_at_idx" ON "template_generation_log"("created_at" DESC);
CREATE INDEX "template_generation_log_funeral_home_idx" ON "template_generation_log"("funeral_home_id");

-- Composite index for common analytics queries
CREATE INDEX "template_generation_log_category_status_date_idx" 
    ON "template_generation_log"("template_category", "status", "created_at" DESC);

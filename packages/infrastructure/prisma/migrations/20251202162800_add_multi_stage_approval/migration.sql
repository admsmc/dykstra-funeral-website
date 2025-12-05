-- CreateTable
CREATE TABLE "template_approval_workflows" (
    "id" TEXT NOT NULL,
    "templateBusinessKey" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "workflowName" TEXT NOT NULL DEFAULT 'Standard Review',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "template_approval_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_approval_stages" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "stageOrder" INTEGER NOT NULL,
    "requiredReviewers" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_approval_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_approval_reviews" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" TEXT,
    "notes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_approval_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "template_approval_workflows_templateBusinessKey_idx" ON "template_approval_workflows"("templateBusinessKey");

-- CreateIndex
CREATE INDEX "template_approval_workflows_status_idx" ON "template_approval_workflows"("status");

-- CreateIndex
CREATE INDEX "template_approval_workflows_submittedBy_idx" ON "template_approval_workflows"("submittedBy");

-- CreateIndex
CREATE INDEX "template_approval_stages_workflowId_idx" ON "template_approval_stages"("workflowId");

-- CreateIndex
CREATE INDEX "template_approval_stages_status_idx" ON "template_approval_stages"("status");

-- CreateIndex
CREATE UNIQUE INDEX "template_approval_stages_workflowId_stageOrder_key" ON "template_approval_stages"("workflowId", "stageOrder");

-- CreateIndex
CREATE INDEX "template_approval_reviews_stageId_idx" ON "template_approval_reviews"("stageId");

-- CreateIndex
CREATE INDEX "template_approval_reviews_reviewerId_idx" ON "template_approval_reviews"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "template_approval_reviews_stageId_reviewerId_key" ON "template_approval_reviews"("stageId", "reviewerId");

-- AddForeignKey
ALTER TABLE "template_approval_stages" ADD CONSTRAINT "template_approval_stages_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "template_approval_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_approval_reviews" ADD CONSTRAINT "template_approval_reviews_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "template_approval_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

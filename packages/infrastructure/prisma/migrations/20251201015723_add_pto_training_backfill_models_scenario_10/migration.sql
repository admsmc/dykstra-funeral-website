-- CreateTable PtoPolicy (SCD2 versioned)
CREATE TABLE \"pto_policies\" (
    \"id\" TEXT NOT NULL,
    \"businessKey\" TEXT NOT NULL,
    \"version\" INTEGER NOT NULL DEFAULT 1,
    \"validFrom\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"validTo\" TIMESTAMP(3),
    \"isCurrent\" BOOLEAN NOT NULL DEFAULT true,
    \"funeralHomeId\" TEXT NOT NULL,
    \"minAdvanceNoticeDays\" INTEGER NOT NULL DEFAULT 14,
    \"minAdvanceNoticeHolidaysDays\" INTEGER NOT NULL DEFAULT 30,
    \"annualPtoDaysPerEmployee\" INTEGER NOT NULL DEFAULT 20,
    \"maxConcurrentEmployeesOnPto\" INTEGER NOT NULL DEFAULT 2,
    \"maxConsecutivePtoDays\" INTEGER NOT NULL DEFAULT 10,
    \"roleSpecificPolicies\" JSONB NOT NULL DEFAULT '{}',
    \"blackoutDates\" JSONB NOT NULL DEFAULT '[]',
    \"enablePremiumPayForBackfill\" BOOLEAN NOT NULL DEFAULT true,
    \"premiumMultiplier\" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    \"notes\" TEXT,
    \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"updatedAt\" TIMESTAMP(3) NOT NULL,
    \"createdBy\" TEXT NOT NULL,

    CONSTRAINT \"pto_policies_pkey\" PRIMARY KEY (\"id\")
);

-- CreateIndex PtoPolicy
CREATE UNIQUE INDEX \"pto_policies_businessKey_version_key\" ON \"pto_policies\"(\"businessKey\", \"version\");
CREATE INDEX \"pto_policies_businessKey_isCurrent_idx\" ON \"pto_policies\"(\"businessKey\", \"isCurrent\");
CREATE INDEX \"pto_policies_validFrom_validTo_idx\" ON \"pto_policies\"(\"validFrom\", \"validTo\");
CREATE INDEX \"pto_policies_funeralHomeId_isCurrent_idx\" ON \"pto_policies\"(\"funeralHomeId\", \"isCurrent\");

-- CreateTable TrainingPolicy (SCD2 versioned)
CREATE TABLE \"training_policies\" (
    \"id\" TEXT NOT NULL,
    \"businessKey\" TEXT NOT NULL,
    \"version\" INTEGER NOT NULL DEFAULT 1,
    \"validFrom\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"validTo\" TIMESTAMP(3),
    \"isCurrent\" BOOLEAN NOT NULL DEFAULT true,
    \"funeralHomeId\" TEXT NOT NULL,
    \"roleRequirements\" JSONB NOT NULL DEFAULT '{}',
    \"enableTrainingBackfill\" BOOLEAN NOT NULL DEFAULT true,
    \"backfillPremiumMultiplier\" DOUBLE PRECISION NOT NULL DEFAULT 1.25,
    \"defaultRenewalNoticeDays\" INTEGER NOT NULL DEFAULT 60,
    \"approvalRequiredAboveCost\" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    \"notes\" TEXT,
    \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"updatedAt\" TIMESTAMP(3) NOT NULL,
    \"createdBy\" TEXT NOT NULL,

    CONSTRAINT \"training_policies_pkey\" PRIMARY KEY (\"id\")
);

-- CreateIndex TrainingPolicy
CREATE UNIQUE INDEX \"training_policies_businessKey_version_key\" ON \"training_policies\"(\"businessKey\", \"version\");
CREATE INDEX \"training_policies_businessKey_isCurrent_idx\" ON \"training_policies\"(\"businessKey\", \"isCurrent\");
CREATE INDEX \"training_policies_validFrom_validTo_idx\" ON \"training_policies\"(\"validFrom\", \"validTo\");
CREATE INDEX \"training_policies_funeralHomeId_isCurrent_idx\" ON \"training_policies\"(\"funeralHomeId\", \"isCurrent\");

-- CreateTable PtoRequest (SCD2 versioned)
CREATE TABLE \"pto_requests\" (
    \"id\" TEXT NOT NULL,
    \"businessKey\" TEXT NOT NULL,
    \"version\" INTEGER NOT NULL DEFAULT 1,
    \"validFrom\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"validTo\" TIMESTAMP(3),
    \"isCurrent\" BOOLEAN NOT NULL DEFAULT true,
    \"funeralHomeId\" TEXT NOT NULL,
    \"employeeId\" TEXT NOT NULL,
    \"employeeName\" TEXT NOT NULL,
    \"ptoType\" TEXT NOT NULL,
    \"requestedDays\" INTEGER NOT NULL,
    \"startDate\" TIMESTAMP(3) NOT NULL,
    \"endDate\" TIMESTAMP(3) NOT NULL,
    \"reason\" TEXT,
    \"status\" TEXT NOT NULL DEFAULT 'draft',
    \"requestedAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"respondedAt\" TIMESTAMP(3),
    \"respondedBy\" TEXT,
    \"rejectionReason\" TEXT,
    \"backfillRequirementsMet\" BOOLEAN NOT NULL DEFAULT false,
    \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"updatedAt\" TIMESTAMP(3) NOT NULL,
    \"createdBy\" TEXT NOT NULL,

    CONSTRAINT \"pto_requests_pkey\" PRIMARY KEY (\"id\")
);

-- CreateIndex PtoRequest
CREATE UNIQUE INDEX \"pto_requests_businessKey_version_key\" ON \"pto_requests\"(\"businessKey\", \"version\");
CREATE INDEX \"pto_requests_businessKey_isCurrent_idx\" ON \"pto_requests\"(\"businessKey\", \"isCurrent\");
CREATE INDEX \"pto_requests_validFrom_validTo_idx\" ON \"pto_requests\"(\"validFrom\", \"validTo\");
CREATE INDEX \"pto_requests_funeralHomeId_employeeId_idx\" ON \"pto_requests\"(\"funeralHomeId\", \"employeeId\");
CREATE INDEX \"pto_requests_funeralHomeId_status_idx\" ON \"pto_requests\"(\"funeralHomeId\", \"status\");
CREATE INDEX \"pto_requests_startDate_endDate_idx\" ON \"pto_requests\"(\"startDate\", \"endDate\");
CREATE INDEX \"pto_requests_status_idx\" ON \"pto_requests\"(\"status\");

-- CreateTable TrainingRecord (Non-versioned)
CREATE TABLE \"training_records\" (
    \"id\" TEXT NOT NULL,
    \"funeralHomeId\" TEXT NOT NULL,
    \"employeeId\" TEXT NOT NULL,
    \"employeeName\" TEXT NOT NULL,
    \"trainingType\" TEXT NOT NULL,
    \"trainingName\" TEXT NOT NULL,
    \"requiredForRole\" BOOLEAN NOT NULL DEFAULT false,
    \"status\" TEXT NOT NULL DEFAULT 'scheduled',
    \"scheduledDate\" TIMESTAMP(3),
    \"startDate\" TIMESTAMP(3),
    \"endDate\" TIMESTAMP(3),
    \"completedAt\" TIMESTAMP(3),
    \"hours\" INTEGER NOT NULL,
    \"cost\" DOUBLE PRECISION NOT NULL,
    \"instructor\" TEXT,
    \"location\" TEXT,
    \"certificationNumber\" TEXT UNIQUE,
    \"expiresAt\" TIMESTAMP(3),
    \"renewalReminderSentAt\" TIMESTAMP(3),
    \"notes\" TEXT,
    \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"updatedAt\" TIMESTAMP(3) NOT NULL,
    \"createdBy\" TEXT NOT NULL,

    CONSTRAINT \"training_records_pkey\" PRIMARY KEY (\"id\")
);

-- CreateIndex TrainingRecord
CREATE INDEX \"training_records_funeralHomeId_employeeId_idx\" ON \"training_records\"(\"funeralHomeId\", \"employeeId\");
CREATE INDEX \"training_records_status_idx\" ON \"training_records\"(\"status\");
CREATE INDEX \"training_records_expiresAt_idx\" ON \"training_records\"(\"expiresAt\");
CREATE INDEX \"training_records_trainingType_idx\" ON \"training_records\"(\"trainingType\");
CREATE INDEX \"training_records_completedAt_idx\" ON \"training_records\"(\"completedAt\");

-- CreateTable BackfillAssignment (SCD2 versioned)
CREATE TABLE \"backfill_assignments\" (
    \"id\" TEXT NOT NULL,
    \"businessKey\" TEXT NOT NULL,
    \"version\" INTEGER NOT NULL DEFAULT 1,
    \"validFrom\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"validTo\" TIMESTAMP(3),
    \"isCurrent\" BOOLEAN NOT NULL DEFAULT true,
    \"funeralHomeId\" TEXT NOT NULL,
    \"absenceId\" TEXT NOT NULL,
    \"absenceType\" TEXT NOT NULL,
    \"absenceStartDate\" TIMESTAMP(3) NOT NULL,
    \"absenceEndDate\" TIMESTAMP(3) NOT NULL,
    \"absenceEmployeeId\" TEXT NOT NULL,
    \"absenceEmployeeName\" TEXT NOT NULL,
    \"absenceEmployeeRole\" TEXT NOT NULL,
    \"backfillEmployeeId\" TEXT NOT NULL,
    \"backfillEmployeeName\" TEXT NOT NULL,
    \"backfillEmployeeRole\" TEXT NOT NULL,
    \"status\" TEXT NOT NULL DEFAULT 'suggested',
    \"suggestedAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"confirmedAt\" TIMESTAMP(3),
    \"confirmedBy\" TEXT,
    \"rejectedAt\" TIMESTAMP(3),
    \"rejectionReason\" TEXT,
    \"completedAt\" TIMESTAMP(3),
    \"premiumType\" TEXT NOT NULL DEFAULT 'none',
    \"premiumMultiplier\" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    \"estimatedHours\" INTEGER NOT NULL,
    \"actualHours\" INTEGER,
    \"notes\" TEXT,
    \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"updatedAt\" TIMESTAMP(3) NOT NULL,
    \"createdBy\" TEXT NOT NULL,

    CONSTRAINT \"backfill_assignments_pkey\" PRIMARY KEY (\"id\")
);

-- CreateIndex BackfillAssignment
CREATE UNIQUE INDEX \"backfill_assignments_businessKey_version_key\" ON \"backfill_assignments\"(\"businessKey\", \"version\");
CREATE INDEX \"backfill_assignments_businessKey_isCurrent_idx\" ON \"backfill_assignments\"(\"businessKey\", \"isCurrent\");
CREATE INDEX \"backfill_assignments_validFrom_validTo_idx\" ON \"backfill_assignments\"(\"validFrom\", \"validTo\");
CREATE INDEX \"backfill_assignments_funeralHomeId_absenceId_idx\" ON \"backfill_assignments\"(\"funeralHomeId\", \"absenceId\");
CREATE INDEX \"backfill_assignments_funeralHomeId_status_idx\" ON \"backfill_assignments\"(\"funeralHomeId\", \"status\");
CREATE INDEX \"backfill_assignments_backfillEmployeeId_absenceStartDate_idx\" ON \"backfill_assignments\"(\"backfillEmployeeId\", \"absenceStartDate\");
CREATE INDEX \"backfill_assignments_absenceStartDate_absenceEndDate_idx\" ON \"backfill_assignments\"(\"absenceStartDate\", \"absenceEndDate\");
CREATE INDEX \"backfill_assignments_status_idx\" ON \"backfill_assignments\"(\"status\");

-- CreateTable CertificationStatus (Non-versioned)
CREATE TABLE \"certification_statuses\" (
    \"id\" TEXT NOT NULL,
    \"funeralHomeId\" TEXT NOT NULL,
    \"employeeId\" TEXT NOT NULL,
    \"certificationId\" TEXT NOT NULL,
    \"certificationName\" TEXT NOT NULL,
    \"trainingRecordId\" TEXT,
    \"status\" TEXT NOT NULL,
    \"expiresAt\" TIMESTAMP(3),
    \"renewalDueAt\" TIMESTAMP(3),
    \"renewalReminderSentAt\" TIMESTAMP(3),
    \"notes\" TEXT,
    \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \"updatedAt\" TIMESTAMP(3) NOT NULL,

    CONSTRAINT \"certification_statuses_pkey\" PRIMARY KEY (\"id\")
);

-- CreateIndex CertificationStatus
CREATE UNIQUE INDEX \"certification_statuses_funeralHomeId_employeeId_certificationId_key\" ON \"certification_statuses\"(\"funeralHomeId\", \"employeeId\", \"certificationId\");
CREATE INDEX \"certification_statuses_funeralHomeId_employeeId_idx\" ON \"certification_statuses\"(\"funeralHomeId\", \"employeeId\");
CREATE INDEX \"certification_statuses_expiresAt_idx\" ON \"certification_statuses\"(\"expiresAt\");
CREATE INDEX \"certification_statuses_status_idx\" ON \"certification_statuses\"(\"status\");
CREATE INDEX \"certification_statuses_renewalDueAt_idx\" ON \"certification_statuses\"(\"renewalDueAt\");

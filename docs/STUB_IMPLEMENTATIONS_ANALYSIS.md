# Stub Implementations Analysis

**Date**: December 2, 2024  
**Status**: 2 stub adapters remain (14 TypeScript errors)

## Summary

Two policy adapter stubs reference **non-existent Prisma models**. The domain entities exist, the ports exist, and the adapters are fully implemented - they just need the Prisma schema definitions to become fully functional.

## Current State

### ✅ Already Complete
- **Domain Entities**: Both fully defined with SCD2 support
  - `InteractionManagementPolicy` (packages/domain/src/entities/interaction-management-policy.ts)
  - `InvitationManagementPolicy` (packages/domain/src/entities/invitation-management-policy.ts)
- **Ports (Interfaces)**: Both fully defined with 5 methods each
  - `InteractionManagementPolicyRepositoryService` (packages/application/src/ports/interaction-management-policy-repository.ts)
  - `InvitationManagementPolicyRepositoryService` (packages/application/src/ports/invitation-management-policy-repository.ts)
- **Adapters**: Both fully implemented with all CRUD operations
  - `InteractionManagementPolicyAdapter` (packages/infrastructure/src/adapters/interaction-management-policy-adapter.ts)
  - `InvitationManagementPolicyAdapter` (packages/infrastructure/src/adapters/invitation-management-policy-adapter.ts)

### ❌ Missing Prisma Schema Definitions

**Problem**: The adapters call `prisma.interactionManagementPolicy` and `prisma.invitationManagementPolicy`, but these models don't exist in the Prisma schema.

**Similar Working Examples**: The schema already includes 3 other policy models that follow the exact same SCD2 pattern:
- `LeadScoringPolicy` (lines 1866-1918)
- `LeadToCaseConversionPolicy` (lines 1922-1950)
- `NoteManagementPolicy` (lines 1954-1982)

## Work Required: Add 2 Prisma Models

### 1. InteractionManagementPolicy Model

**Location**: `packages/infrastructure/prisma/schema.prisma` (add after line 1982)

**Model Definition**:
```prisma
// Interaction Management Policy
// SCD Type 2: Tracks historical interaction management policies per funeral home
model InteractionManagementPolicy {
  id            String    @id @default(cuid())
  businessKey   String    @default(cuid()) // Policy identifier
  version       Int       @default(1)
  validFrom     DateTime  @default(now())
  validTo       DateTime?
  isCurrent     Boolean   @default(true)
  funeralHomeId String

  // Interaction Management Rules
  maxSubjectLength                 Int      @default(200)
  minSubjectLength                 Int      @default(1)
  maxOutcomeLength                 Int      @default(1000)
  maxDurationMinutes               Int?     // null = no limit
  requireAssociation               Boolean  @default(true)
  allowScheduledInteractions       Boolean  @default(true)
  autoCompleteUncompletedAfterDays Int?     // null = disabled
  allowOutcomeUpdate               Boolean  @default(false)
  autoArchiveCompletedAfterDays    Int?     // null = disabled

  // Audit Trail
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String
  updatedBy String?
  reason    String?  @db.Text // Reason for policy change

  @@unique([businessKey, version])
  @@index([businessKey, isCurrent])
  @@index([validFrom, validTo])
  @@index([funeralHomeId, isCurrent])
  @@map("interaction_management_policies")
}
```

**Field Mapping** (Domain → Prisma):
- All fields map 1:1 (no transformations needed)
- SCD2 fields: `id`, `businessKey`, `version`, `validFrom`, `validTo`, `isCurrent`
- Policy fields: 9 business rule fields (see above)
- Audit fields: `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `reason`

### 2. InvitationManagementPolicy Model

**Location**: `packages/infrastructure/prisma/schema.prisma` (add after InteractionManagementPolicy)

**Model Definition**:
```prisma
// Invitation Management Policy
// SCD Type 2: Tracks historical invitation management policies per funeral home
model InvitationManagementPolicy {
  id            String    @id @default(cuid())
  businessKey   String    @default(cuid()) // Policy identifier
  version       Int       @default(1)
  validFrom     DateTime  @default(now())
  validTo       DateTime?
  isCurrent     Boolean   @default(true)
  funeralHomeId String

  // Invitation Management Rules
  tokenLengthBytes                 Int     @default(32)
  expirationDays                   Int     @default(7)
  requireStrictEmailValidation     Boolean @default(true)
  allowMultipleInvitationsPerEmail Boolean @default(false)
  autoRevokeExpiredAfterDays       Int?    // null = disabled
  requirePhoneNumber               Boolean @default(false)

  // Audit Trail
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String
  updatedBy String?
  reason    String?  @db.Text // Reason for policy change

  @@unique([businessKey, version])
  @@index([businessKey, isCurrent])
  @@index([validFrom, validTo])
  @@index([funeralHomeId, isCurrent])
  @@map("invitation_management_policies")
}
```

**Field Mapping** (Domain → Prisma):
- All fields map 1:1 (no transformations needed)
- SCD2 fields: `id`, `businessKey`, `version`, `validFrom`, `validTo`, `isCurrent`
- Policy fields: 6 business rule fields (see above)
- Audit fields: `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `reason`

## Implementation Steps

### Step 1: Add Prisma Models (5 minutes)
1. Open `packages/infrastructure/prisma/schema.prisma`
2. Add both model definitions after line 1982 (after NoteManagementPolicy)
3. Save file

### Step 2: Generate Prisma Client (1 minute)
```bash
npx prisma generate --schema=packages/infrastructure/prisma/schema.prisma
```

### Step 3: Create Migration (2 minutes)
```bash
npx prisma migrate dev --name add-interaction-invitation-policy-tables
```

This will:
- Create migration SQL files
- Apply migration to development database
- Create the two new tables with all indexes

### Step 4: Verify (1 minute)
```bash
# Should show 0 errors (down from 14)
npx tsc --noEmit --project packages/infrastructure/tsconfig.json
```

### Total Time Estimate: **10 minutes**

## Expected Results

After completing these steps:
- ✅ All 14 TypeScript errors resolved
- ✅ Both adapters become fully functional
- ✅ SCD2 versioning works out of the box
- ✅ All indexes optimized for query patterns
- ✅ Database migration applied
- ✅ Prisma Client regenerated with new models

## No Additional Code Needed

The adapters are **already fully implemented** with:
- ✅ All 5 CRUD methods (findByFuneralHome, findByBusinessKey, findAllVersions, findAll, save, update, delete)
- ✅ Proper Effect-TS error handling
- ✅ NotFoundError and PersistenceError patterns
- ✅ SCD2 version closing logic in `update()` method
- ✅ mapToDomain helper functions
- ✅ Complete data mapping (Prisma → Domain)

## Policy Use Cases

### InteractionManagementPolicy
**Used by**: CRM interaction logging features
- Controls subject/outcome length limits
- Manages interaction duration constraints
- Configures completion/archival behavior
- Enforces association requirements

**Default Presets** (already defined in domain):
- Standard: 200 char subject, 1000 char outcome, 1-week max duration
- Strict: 150 char subject, 500 char outcome, 4-hour max duration
- Permissive: 500 char subject, 5000 char outcome, no duration limit

### InvitationManagementPolicy
**Used by**: Family invitation system
- Controls invitation token security (16-64 bytes)
- Manages expiration windows (3-30 days)
- Configures email validation strictness
- Handles duplicate invitation rules
- Auto-revokes expired invitations

**Default Presets** (already defined in domain):
- Standard: 32-byte token, 7-day expiration, strict email, no duplicates
- Strict: 64-byte token, 3-day expiration, phone required, 14-day auto-revoke
- Permissive: 16-byte token, 30-day expiration, allow duplicates

## Testing

After implementation, test by:
1. Running existing policy repository tests (if any)
2. Creating a test policy via Prisma Studio
3. Querying via adapter methods to verify mapping
4. Testing SCD2 versioning (update should close old version)

## Notes

- Both models follow identical SCD2 pattern as existing policy tables
- No custom mapping logic needed (1:1 field correspondence)
- Indexes match existing policy table patterns
- Migration will be non-breaking (new tables only)
- No existing data to migrate

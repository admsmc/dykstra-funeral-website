# Funeral Home Management System: UI/UX Development & Deployment Plan
**"Figma for Enterprise Operations" - Category-Defining Experience**

---

## Executive Summary

**Vision**: Build the world's first **AI-native, real-time collaborative funeral home management system** that combines family-facing compassion with staff-facing efficiency.

**Timeline**: 22-31 months (MVP in 12-15 months)  
**Investment**: $2.08M-$2.66M  
**Architecture**: Unified Next.js 15 App Router with dual backend (TypeScript CRM + Go ERP)

**Market Position**: First funeral home software with Figma-like real-time collaboration, Linear-inspired AI triage, and voice-enabled workflows.

---

## Core Architecture Principles

### 1. Pure Functional & Type-Safe Foundation

**TypeScript Throughout**:
- Strict mode enabled, zero `any` types
- **Effect-TS** for functional programming (Either, Option, Task)
- **Zod** for runtime validation and schema definitions
- **tRPC** for end-to-end type-safe APIs
- **Immutable data structures** - no mutations, pure functions
- **Railway-oriented programming** for error handling

### 2. Hexagonal Architecture (Ports & Adapters)

**Critical**: This project STRICTLY follows Clean Architecture patterns per ARCHITECTURE.md.

**Dependency Rule**: Inner layers NEVER depend on outer layers.
- ✅ Infrastructure → Application → Domain
- ❌ Domain → Application (FORBIDDEN)
- ❌ Application → API (FORBIDDEN)

**Domain Layer** (`packages/domain`) - Pure business logic, zero dependencies:
- ✅ Define entities as Effect Data.Class (Case, Lead, Contact, Campaign, Memorial, Contract)
- ✅ All business rules inside domain methods (transitionStatus, validateLead, etc.)
- ✅ Pure functions, immutable data
- ❌ NO database access
- ❌ NO Effect tags for services (those belong in application layer)
- ❌ NO HTTP/API concerns
- ❌ NO imports from other layers

**Application Layer** (`packages/application`) - Use cases and ports:
- ✅ Define repository ports as TypeScript interfaces (CaseRepository, LeadRepository, etc.)
- ✅ Export Context tags for dependency injection (CaseRepository tag, LeadRepository tag)
- ✅ Use cases coordinate domain entities (updateCaseStatus, convertLeadToCase, etc.)
- ✅ All ports exported from `src/ports/`
- ❌ NO direct database access
- ❌ NO Prisma imports
- ❌ NO implementation details

**Infrastructure Layer** (`packages/infrastructure`) - Adapters:
- ✅ **Object-based repositories** (NOT classes) - `export const PrismaCaseRepository: CaseRepository = {...}`
- ✅ Import `prisma` singleton directly from `./prisma-client.ts`
- ✅ Implement SCD2 temporal pattern for all entities with history
- ✅ TypeScript adapters: Prisma (PostgreSQL 1), SendGrid, Stripe, Clerk/Auth0, Vercel Blob/S3
- ❌ NO class-based repositories (old pattern)
- ❌ NO business logic (that's in domain)

**API Layer** (`packages/api`) - HTTP routing only:
- ✅ Define tRPC routers with Zod schemas
- ✅ Call use cases from application layer
- ✅ Use `runEffect()` helper to execute Effects
- ✅ BFF proxy (Next.js API routes) for Go backend
- ✅ OpenAPI-generated client for Go APIs
- ❌ NO business logic
- ❌ NO direct database access
- ❌ NO domain entity manipulation

### 3. Unified Next.js Application (Single Deployment)

```
apps/funeral-home-portal/
  app/
    (family)/              # Family-facing routes (public + authenticated)
      cases/[id]/
      memorials/[id]/
      payments/
    (staff)/               # Staff-facing routes (authenticated, role-based)
      dashboard/
      cases/               # Case management (Go Contracts)
      financial/           # Invoices, payments (Go GL/AR/AP)
      inventory/           # Inventory mgmt (Go Inventory)
      payroll/             # Payroll (Go Payroll)
      procurement/         # P2P (Go Procurement)
      crm/                 # CRM/Marketing (TypeScript)
      hr/                  # HCM lifecycle (Go HCM)
      fixed-assets/        # Fixed assets (Go FA)
      reconciliations/     # Bank recs (Go GL Reconciliations)
    api/
      trpc/[trpc]/         # TypeScript domain APIs
      go-proxy/[...path]/  # BFF proxy to Go backend
  lib/
    trpc.ts                # tRPC client (TypeScript APIs)
    go-client.ts           # OpenAPI client (Go APIs)
    auth.ts                # Unified auth (Clerk)
packages/
  ui/                      # Shared design system (Radix + Tailwind v4)
  domain/                  # Pure TypeScript domain models
  application/             # TypeScript use cases
  infrastructure/          # TypeScript adapters (Prisma, SendGrid, Stripe)
  api/                     # tRPC routers
```

---

## Database Architecture

### Two Separate PostgreSQL Instances

**PostgreSQL 1: funeral_home_crm** (TypeScript domain)
- Owner: TypeScript Next.js app
- Schema: Prisma migrations
- Tables: leads, contacts, campaigns, interactions, memorials, documents (all SCD2)

**PostgreSQL 2: funeral_home_erp** (Go domain)
- Owner: Go backend projectors
- Schema: Go DDL (managed by projectors)
- Tables: contracts_hist, approval_requests_hist, vendor_bills_hist, gl_accounts_hist, payroll_runs_hist, inventory_items_hist, fixed_assets_hist, workers_hist, pto_balances_hist, etc. (all SCD2)

**Why Separate**:
- Schema isolation (Prisma never conflicts with Go DDL)
- Independent scaling
- Blast radius containment
- Clear ownership boundaries

---

## Phase 0: Foundation & Architecture (Weeks 1-6)

### 0.1 Repository Structure ✅

Already in place:
```
/Users/andrewmathers/projects/dykstra-funeral-website/
  packages/
    domain/           # TypeScript domain models
    application/      # TypeScript use cases
    infrastructure/   # TypeScript adapters
    api/              # tRPC routers
    ui/               # Design system (to be built)
  src/                # Next.js app (existing)
  docs/               # All analysis docs ✅
```

### 0.2 Core Schema Definitions (Zod + Effect Data Classes) ✅

**Status**: Partially complete (from external context)

**Domain Entities** (Effect Data.Class in `packages/domain`):
- ✅ Case entity with business rules (transitionStatus, validateTransition)
- ✅ Contract entity (integrates with Go Contract system)
- ✅ Payment entity
- ✅ Memorial entity
- ⚠️ CRM entities (Lead, Contact, Campaign, Interaction, ReferralSource) - to be created as Effect Data.Class

**Zod Schemas** (API layer validation only):
- User schema (family members, funeral directors, admins)
- Case input/output schemas (for tRPC)
- Contract input/output schemas
- Payment input/output schemas
- Memorial input/output schemas
- CRM input/output schemas
- Go domain schemas (generated from OpenAPI specs)

**Critical**: Domain entities use Effect Data.Class, NOT Zod. Zod is ONLY for API layer validation.

### 0.3 Authentication & Authorization Architecture

**Multi-Tenant Design**:
- Funeral home tenant isolation
- Case-based access control
- Family member invitation flow
- Role-based permissions (primary contact, family member, funeral director, admin, staff)

**Stack**:
- **Clerk** (recommended) or **Auth0** for authentication
- **CASL** for authorization rules (defined in domain layer)
- **Magic links + SMS** for family member invitations (no password)
- **Session management** via secure httpOnly cookies
- **BFF auth proxy** to Go backend (single auth boundary)

### 0.4 Database Schema (Prisma + PostgreSQL)

**Critical**: ALL entities with history MUST use SCD2 pattern per ARCHITECTURE.md.

**TypeScript CRM Database** (funeral_home_crm):

```prisma
// Core entities
model FuneralHome {
  id        String   @id @default(cuid())
  name      String
  settings  Json
  cases     Case[]
}

// SCD2 Required Fields (ALL temporal tables MUST have these):
// - businessKey: Immutable business identifier
// - version: Incrementing version number
// - validFrom: When this version became effective
// - validTo: When this version was superseded (null = current)
// - isCurrent: Boolean flag for current version
// - createdAt: Original creation time (preserved across versions)
// - updatedAt: Last update time

model Case {
  id              String   @id @default(cuid())
  businessKey     String   @unique // SCD2: Immutable identifier
  version         Int      @default(1) // SCD2: Version number
  validFrom       DateTime @default(now()) // SCD2: Version start
  validTo         DateTime? // SCD2: Version end (null = current)
  isCurrent       Boolean  @default(true) // SCD2: Current version flag
  createdAt       DateTime @default(now()) // SCD2: Original creation (preserved)
  updatedAt       DateTime @updatedAt // SCD2: Last update
  
  funeralHomeId   String
  decedentName    String
  type            CaseType
  status          CaseStatus
  goContractId    String?  // Link to Go Contract system
  
  contracts       Contract[]
  payments        Payment[]
  memorials       Memorial[]
  documents       Document[]
  familyMembers   FamilyMember[]
  tasks           Task[]
  
  @@index([businessKey, isCurrent]) // SCD2: Required index
}

// CRM entities (SCD2 pattern - MUST include createdAt/updatedAt)
model Lead {
  id              String   @id @default(cuid())
  businessKey     String   @unique // SCD2: Immutable identifier
  version         Int      @default(1) // SCD2: Version number
  validFrom       DateTime @default(now()) // SCD2: Version start
  validTo         DateTime? // SCD2: Version end (null = current)
  isCurrent       Boolean  @default(true) // SCD2: Current version flag
  createdAt       DateTime @default(now()) // SCD2: Original creation (preserved)
  updatedAt       DateTime @updatedAt // SCD2: Last update
  
  decedentName    String
  contactId       String
  score           Int
  status          LeadStatus
  assignedTo      String?
  convertedToCaseId String?
  
  @@index([businessKey, isCurrent]) // SCD2: Required index
}

model Contact {
  id              String   @id @default(cuid())
  businessKey     String   @unique // SCD2: Immutable identifier
  version         Int      @default(1) // SCD2: Version number
  validFrom       DateTime @default(now()) // SCD2: Version start
  validTo         DateTime? // SCD2: Version end (null = current)
  isCurrent       Boolean  @default(true) // SCD2: Current version flag
  createdAt       DateTime @default(now()) // SCD2: Original creation (preserved)
  updatedAt       DateTime @updatedAt // SCD2: Last update
  
  name            String
  email           String?
  phone           String?
  type            ContactType
  optInEmail      Boolean  @default(false)
  optInSMS        Boolean  @default(false)
  doNotContact    Boolean  @default(false)
  
  @@index([businessKey, isCurrent]) // SCD2: Required index
}

model Campaign {
  id              String   @id @default(cuid())
  businessKey     String   @unique // SCD2: Immutable identifier
  version         Int      @default(1) // SCD2: Version number
  validFrom       DateTime @default(now()) // SCD2: Version start
  validTo         DateTime? // SCD2: Version end (null = current)
  isCurrent       Boolean  @default(true) // SCD2: Current version flag
  createdAt       DateTime @default(now()) // SCD2: Original creation (preserved)
  updatedAt       DateTime @updatedAt // SCD2: Last update
  
  name            String
  type            CampaignType
  status          CampaignStatus
  segmentTags     String[]
  sentCount       Int      @default(0)
  openedCount     Int      @default(0)
  clickedCount    Int      @default(0)
  
  @@index([businessKey, isCurrent]) // SCD2: Required index
}

model Interaction {
  id              String   @id @default(cuid())
  type            InteractionType
  direction       Direction
  durationMinutes Int?
  leadId          String?
  contactId       String?
  caseId          String?
  staffId         String
  outcome         String?
  notes           String?
  createdAt       DateTime @default(now())
}

model ReferralSource {
  id              String   @id @default(cuid())
  businessKey     String   @unique
  version         Int
  validFrom       DateTime @default(now())
  validTo         DateTime?
  isCurrent       Boolean  @default(true)
  
  name            String
  type            ReferralType
  totalReferrals  Int      @default(0)
  conversionRate  Decimal?
  isActive        Boolean  @default(true)
  
  @@index([businessKey, isCurrent])
}

// Memorial entities
model Memorial {
  id          String   @id @default(cuid())
  caseId      String
  isPublic    Boolean  @default(true)
  slug        String   @unique
  photos      Photo[]
  videos      Video[]
  tributes    Tribute[]
  guestbook   GuestbookEntry[]
}

model Photo {
  id              String   @id @default(cuid())
  businessKey     String   @unique // SCD2: Immutable identifier
  version         Int      @default(1) // SCD2: Version number
  validFrom       DateTime @default(now()) // SCD2: Version start
  validTo         DateTime? // SCD2: Version end (null = current)
  isCurrent       Boolean  @default(true) // SCD2: Current version flag
  createdAt       DateTime @default(now()) // SCD2: Original creation (preserved)
  updatedAt       DateTime @updatedAt // SCD2: Last update
  
  memorialId      String
  caseId          String
  url             String
  storageKey      String
  caption         String?
  uploadedBy      String
  uploadedAt      DateTime @default(now())
  metadata        Json
  
  @@index([businessKey, isCurrent]) // SCD2: Required index
  @@index([memorialId, isCurrent])
}
```

### 0.5 Infrastructure Setup

**Services**:
- **PostgreSQL 1** (TypeScript CRM): Supabase or Neon
- **PostgreSQL 2** (Go ERP): Managed by Go team
- **Redis**: Caching, rate limiting, WebSocket presence
- **Vercel Blob** or **AWS S3**: File storage (photos, documents)
- **SendGrid**: Transactional emails (invitations, notifications)
- **Stripe**: Payment processing
- **Clerk**: Authentication
- **Sentry**: Error tracking
- **OpenTelemetry**: Observability
- **Ably** or **Pusher**: Managed WebSockets (real-time collaboration)

**Environment Variables**:
```bash
# TypeScript CRM Database
DATABASE_URL="postgresql://user:pass@localhost:5432/funeral_home_crm"

# Go Backend API
GO_BACKEND_URL="http://localhost:8080"
GO_BACKEND_API_KEY="secret"

# Auth
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."

# Payments
STRIPE_SECRET_KEY="sk_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Storage
BLOB_READ_WRITE_TOKEN="..." # Vercel Blob
# OR
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET="funeral-home-uploads"

# Email
SENDGRID_API_KEY="SG...."

# Monitoring
SENTRY_DSN="https://..."
NEXT_PUBLIC_SENTRY_DSN="https://..."

# Real-time
ABLY_API_KEY="..." # or Pusher
```

---

## Phase 1: Design System (packages/ui) (Weeks 7-9)

### 1.1 Package Setup

**Goal**: Create shared design system for ALL domains (TypeScript CRM + Go ERP UIs)

**Structure**:
```
packages/ui/
  src/
    components/
      button.tsx
      card.tsx
      form/
        input.tsx
        select.tsx
        textarea.tsx
        checkbox.tsx
        radio.tsx
      modal.tsx
      avatar.tsx
      toast.tsx
      timeline.tsx
      file-upload.tsx
      signature-pad.tsx
      payment-form.tsx
      data-grid.tsx
      command-palette.tsx
    lib/
      utils.ts
      cn.ts
    styles/
      globals.css
  tailwind.config.ts
  package.json
  tsconfig.json
```

**Dependencies**:
```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-radio-group": "^1.1.3",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "class-variance-authority": "^0.7.0",
    "framer-motion": "^11.0.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "cmdk": "^0.2.0",
    "@tanstack/react-table": "^8.11.0",
    "recharts": "^2.10.0"
  }
}
```

### 1.2 Design Tokens (Dykstra Brand)

**Colors** (from existing globals.css):
```css
:root {
  --navy: #1e3a5f;      /* Primary brand, headings, CTAs */
  --sage: #8b9d83;      /* Secondary accent */
  --cream: #f5f3ed;     /* Alternate backgrounds */
  --gold: #b8956a;      /* Premium accents */
  --charcoal: #2c3539;  /* Footer, dark contrasts */
}
```

**Typography**:
- Headings: Playfair Display (serif)
- Body: Inter (sans-serif)

**Component Variants**:
- Button: primary (navy), secondary (sage), ghost, danger
- Card: default, bordered, elevated
- Form: default, error, success states

### 1.3 Key Components

**Button** (with CVA variants):
```typescript
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-[--navy] text-white hover:bg-[--navy]/90',
        secondary: 'bg-[--sage] text-white hover:bg-[--sage]/90',
        ghost: 'hover:bg-[--cream]',
        danger: 'bg-red-600 text-white hover:bg-red-700'
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-11 px-8'
      }
    }
  }
)
```

**DataGrid** (TanStack Table wrapper):
- Sortable columns
- Filters
- Pagination
- Row selection
- Expandable rows
- Export to CSV

**CommandPalette** (cmdk):
- Universal search across all domains
- Keyboard shortcuts (Cmd+K)
- Recent actions
- Natural language commands (via LLM)

**Timeline** (for case history):
- Vertical timeline with event dots
- Timestamps, icons, descriptions
- Color-coded by event type

**Effort**: 3 weeks (1 senior frontend engineer)

---

## Phase 2A: TypeScript CRM UI (Weeks 10-19)

### Goal: Build CRM/Marketing dashboards

**Routes to Build**:
1. `/staff/crm/leads` - Lead list, filters, hot leads widget
2. `/staff/crm/leads/[id]` - Lead detail, interaction timeline
3. `/staff/crm/contacts` - Contact list, search, merge UI
4. `/staff/crm/campaigns` - Campaign list, builder, metrics
5. `/staff/crm/campaigns/new` - WYSIWYG email editor
6. `/staff/crm/interactions` - Interaction log
7. `/staff/crm/referral-sources` - Referral source dashboard

**Backend**:
- All tRPC routers already exist (from external context: Lead, Contact, Campaign routers)
- Need UI implementation only

**Effort**: 8-10 weeks

---

## Phase 2B: Go ERP UI (20 Modules) (Weeks 20-75)

### Modules to Build (Prioritized)

**Tier 1: MVP (Core Operations) - Weeks 20-45**

1. **Contract Management** (4-5 weeks)
   - Case list, contract builder, approval workflow, signatures
   - Integrates TypeScript Case with Go Contract system
   
2. **Financial (GL/AR/AP)** (3-4 weeks)
   - Invoice list, payment processing, AR aging, GL reports
   
3. **Inventory** (2-3 weeks)
   - Catalog, availability check, receiving, cycle counts
   
4. **Payroll** (2-3 weeks)
   - Timesheets, case assignments, payroll review
   
5. **Procurement (P2P)** (2-3 weeks)
   - PO creation, approval, OCR invoice review, payments
   
6. **Professional Services** (1-2 weeks)
   - Staff assignment, time tracking
   
7. **Approval Workflows** (2-3 weeks)
   - Approval queue, multi-level UI, history
   
8. **Timesheets** (2-3 weeks)
   - Timesheet entry, approval, project aggregation
   
9. **Fixed Assets** (2-3 weeks)
   - Asset register, depreciation schedule, disposal
   
10. **GL Reconciliations** (2-3 weeks)
    - Bank rec UI, account rec workflows

**Tier 2: Full Product (Advanced Features) - Weeks 46-66**

11. **HCM: Employee Onboarding** (2-3 weeks)
    - Hire form, dual-ledger creation, position assignment
    
12. **HCM: Employee Termination** (2-3 weeks)
    - Termination form, exit checklist, PTO payout
    
13. **HCM: Position Management** (2-3 weeks)
    - Promotion wizard, transfer UI, comp change
    
14. **HCM: PTO/Leave Management** (2-3 weeks)
    - PTO accrual dashboard, request/approval, balances
    
15. **HCM: Performance & Discipline** (2-3 weeks)
    - Review forms, disciplinary action tracker
    
16. **HCM: Training & Certifications** (1-2 weeks)
    - Training log, cert tracker, compliance dashboard
    
17. **HCM: Employee Rehire** (1-2 weeks)
    - Rehire workflow, eligibility check
    
18. **Budget vs. Actual** (1-2 weeks)
    - Budget entry, variance reports
    
19. **Consolidations** (1-2 weeks)
    - Multi-entity consolidation views
    
20. **Segment Reporting** (1 week)
    - Segment filters, P&L by segment

**Effort**: 40-55 weeks total

---

## Phase 3: Real-Time Collaboration (Layer 2) (Weeks 76-88)

### Goal: "Figma for Funeral Home Operations"

**Features**:
1. **Cursor Presence** (all entity detail pages)
2. **Live Updates** (WebSocket push from Go ESDB)
3. **Collaborative Editing** (CRDT for contract line items, notes)
4. **Comments & @Mentions** (threaded conversations per entity)
5. **Activity Timeline** (who did what, when)

**Tech Stack**:
- **WebSockets**: Ably or Pusher (managed service)
- **CRDT**: Yjs (collaborative editing)
- **Presence**: Ably Presence API or custom Redis solution

**Architecture**:
```typescript
// BFF subscribes to Go EventStoreDB
// Example: Invoice approval event
{
  "event_type": "InvoiceApproved",
  "aggregate_id": "invoice-12345",
  "user_id": "user-789",
  "timestamp": "2025-11-29T05:00:00Z"
}

// BFF pushes to WebSocket room "invoice-12345"
// All users viewing invoice-12345 see: "John approved this invoice 2 seconds ago"
```

**Effort**: 10-12 weeks

---

## Phase 4: AI-Powered Triage & Suggestions (Layer 2) (Weeks 89-101)

### Goal: Linear-inspired AI workflows

**Use Cases**:

1. **Invoice Approval Triage**:
   ```typescript
   // LLM pre-triages invoices
   const triage = await llm.chat({
     model: 'gpt-4-turbo',
     messages: [
       { role: 'system', content: 'You are an AP approval assistant. Triage invoices as green (auto-approve), amber (review), or red (blocked).' },
       { role: 'user', content: `Triage: ${JSON.stringify(invoices)}` }
     ],
     tools: [
       { name: 'check_po_match', description: 'Check if invoice matches PO' },
       { name: 'check_tolerance', description: 'Check if within tolerance' }
     ]
   })
   // Returns: [{ invoice_id: '12345', status: 'green', reason: 'Matches PO-456, within 2%' }]
   ```

2. **PO Creation Assistant**:
   - AI suggests preferred supplier based on history
   - Estimates delivery date
   - Calculates budget impact

3. **Lead Scoring**:
   - AI scores leads 0-100 based on engagement, demographics
   - Suggests next action (call, email, nurture)

4. **Cash Flow Forecasting**:
   - AI predicts 30-day cash position
   - Suggests actions (delay payment, draw credit line)

**Tech Stack**:
- **LLM**: Vercel AI SDK + OpenAI GPT-4 Turbo or Anthropic Claude 3.5 Sonnet
- **Tool Calling**: LLM calls Go backend APIs
- **Embeddings**: Pinecone or pgvector (semantic search)

**Effort**: 10-12 weeks

---

## Phase 5: Command Palette & Keyboard-First UX (Layer 2) (Weeks 102-107)

### Goal: Linear/Raycast-inspired navigation

**Features**:
- Universal command palette (Cmd+K)
- Fuzzy search across all entities
- Natural language commands (via LLM)
- Keyboard shortcuts for common actions

**Examples**:
- `Cmd+K` → "approve invoice 12345" → Enter → approved
- `Cmd+K` → "create po for sku-1234" → wizard opens
- `Cmd+K` → "show overdue receivables" → dashboard with filters

**Tech Stack**:
- **Command Palette**: `cmdk` (Vercel's library)
- **Fuzzy Search**: Fuse.js
- **NLP Parsing**: LLM or rule-based

**Effort**: 5-6 weeks

---

## Phase 6: Embedded Analytics & Insights (Layer 2) (Weeks 108-120)

### Goal: Stripe-inspired contextual analytics

**Features**:
- Inline insights in every list view
- Sparklines in data grids
- Anomaly detection (outlier invoices highlighted)
- Proactive alerts ("3 customers >90 days overdue")

**Tech Stack**:
- **Charts**: Recharts (declarative React charts)
- **Real-Time Metrics**: ESDB subscriptions → WebSocket push
- **Aggregations**: Pre-computed in PG read-models

**Effort**: 10-12 weeks

---

## Phase 7: AI Agents (Layer 3) (Weeks 121-141)

### Goal: Autonomous workflows with human oversight

**Agents**:

1. **AP Agent** (auto-approve invoices, flag exceptions)
2. **Collections Agent** (send reminders, escalate to human)
3. **Procurement Agent** (reorder low-stock items)
4. **HR Agent** (onboard new hires, track training compliance)

**Architecture**:
```typescript
class APAgent {
  async processInvoice(invoiceId: string) {
    // 1. Fetch from Go backend
    const invoice = await goClient.GET('/v1/ap/invoices/{id}', { params: { path: { id: invoiceId } } })
    
    // 2. LLM decides action
    const decision = await llm.chat({
      model: 'gpt-4',
      messages: [{ role: 'user', content: `Should I auto-approve? ${JSON.stringify(invoice)}` }],
      tools: [
        { name: 'check_po_match', ... },
        { name: 'approve_invoice', ... },
        { name: 'flag_for_review', ... }
      ]
    })
    
    // 3. Execute or flag
    if (decision.action === 'approve') {
      await goClient.POST('/v1/ap/invoices/{id}/approve', { params: { path: { id: invoiceId } } })
      await this.auditLog('AP Agent auto-approved', { invoiceId, reason: decision.reason })
    } else {
      await this.flagForHumanReview(invoiceId, decision.reason)
    }
  }
}
```

**Tech Stack**:
- **Agent Framework**: LangChain or LlamaIndex
- **Human-in-the-Loop**: "Agent Pending" queue UI
- **Audit Trail**: Log all agent actions to Go ESDB

**Effort**: 16-20 weeks

---

## Implementation Timeline (Phased Rollout)

### MVP (12-15 months, $1.2M-$1.5M)

**Goal**: Launch with paying customers

**Build**:
- Phase 0: Foundation (6 weeks)
- Phase 1: Design System (3 weeks)
- Phase 2A: CRM UI (10 weeks)
- Phase 2B: Core 10 Go modules (25-35 weeks)

**Total**: 44-54 weeks (~12-15 months)

**Skip for MVP**:
- HCM UIs (manual processes)
- Real-time collaboration
- AI triage/agents
- Advanced analytics

**Launch Target**: 20 mid-sized funeral homes @ $1,999/mo = $480k/year ARR

---

### V2 (18-24 months, $1.8M-$2.4M)

**Add**:
- HCM lifecycle UIs (14-21 weeks)
- Real-time collaboration (10-12 weeks)
- AI triage (10-12 weeks)

**Total**: 78-99 weeks (~18-24 months)

**Launch Target**: 50 funeral homes @ $1,999/mo = $1.2M/year ARR

---

### V3 (24-31 months, $2.08M-$2.66M)

**Add**:
- Command palette (5-6 weeks)
- Embedded analytics (10-12 weeks)
- AI agents (16-20 weeks)

**Total**: 109-137 weeks (~24-31 months)

**Launch Target**: Category-defining product, 100+ customers, $3M+ ARR

---

## Success Metrics

### MVP Metrics
- **Family Adoption**: 60%+ of families use portal within 6 months
- **Staff Efficiency**: 30%+ reduction in admin tasks
- **Payment Collection**: 20%+ improvement in on-time payments
- **Contract Signing**: 80%+ contracts signed within 24 hours
- **System Uptime**: 99.9%
- **Performance**: <2s page load, <200ms API p95

### V2/V3 Metrics (Category-Defining)
- **AI Triage Accuracy**: 90%+ correct auto-approvals
- **Agent Autonomy**: 70%+ of invoices processed without human review
- **Real-Time Collaboration**: 80%+ of staff use comments/presence features
- **Keyboard Efficiency**: Power users 5x faster with command palette
- **NPS**: >60 (industry-leading)

---

## Clean Architecture Enforcement

### Automated Validation

**Goal**: Prevent architectural drift with CI gates (inspired by Go backend governance framework).

**Architecture Tests** (`packages/architecture-tests/`):
1. **Dependency boundary tests**:
   - Domain imports only stdlib
   - Application imports only domain + Effect
   - Infrastructure imports anything
   - API imports only application layer

2. **Repository pattern tests**:
   - All repositories are object-based (not classes)
   - No Prisma imports in application layer
   - All ports exported from `application/src/ports/`

3. **SCD2 compliance tests**:
   - All temporal tables have required fields
   - All repositories implement SCD2 save pattern

**CI Workflow** (`.github/workflows/arch-validation.yml`):
```yaml
name: Architecture Validation
on: [pull_request]
jobs:
  arch-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - name: Run architecture validation
        run: pnpm arch:validate
      - name: Check SCD2 compliance
        run: pnpm arch:scd2-check
```

**Makefile Targets**:
```makefile
arch-validate:
	pnpm test packages/architecture-tests/

arch-report:
	pnpm test packages/architecture-tests/ --json > arch-report.json
```

**Code Review Checklist**:
- [ ] No Prisma in application or domain layers
- [ ] All repositories are object-based (not classes)
- [ ] SCD2 pattern used for temporal data
- [ ] Domain entities contain business rules
- [ ] Use cases are thin orchestrators
- [ ] API routers delegate to use cases
- [ ] Errors use object format
- [ ] All ports exported from `application/src/ports/`

---

## Risk Mitigation

### Risk 1: Timeline Slippage (High Probability)

**Mitigation**:
- MVP-first approach (skip advanced features)
- Weekly demos to stakeholders
- Buffer 20% extra time per phase

### Risk 2: Go Integration Complexity (Medium Probability)

**Mitigation**:
- Start Go integration early (Phase 0)
- Use OpenAPI code generation (no manual types)
- Build BFF proxy first, then UI

### Risk 3: Family Adoption (Medium Probability)

**Mitigation**:
- User testing with 5-10 families before launch
- Multiple onboarding paths (QR codes, SMS, email, in-person demo)
- In-app tooltips and guidance

### Risk 4: Payment Processing Issues (Low Probability)

**Mitigation**:
- Stripe test mode for all development
- Fallback to manual payment entry
- Comprehensive webhook testing with Stripe CLI

---

## Budget (Revised for Funeral Home Scope)

### MVP (12-15 months)
- **2 Senior Full-Stack Engineers**: $400k-$500k
- **1 UI/UX Designer**: $125k-$150k
- **1 QA Engineer (part-time)**: $75k-$100k
- **Infrastructure**: $15k-$20k
- **Total MVP**: **$1.2M-$1.5M**

### V2 (18-24 months cumulative)
- **Total V2**: **$1.8M-$2.4M**

### V3 (24-31 months cumulative)
- **Total V3**: **$2.08M-$2.66M**

---

## Final Recommendation

✅ **PROCEED with MVP-first approach**

**Why**:
- 87% backend ready (Go ERP is production-grade)
- TypeScript CRM is architecturally sound
- Clear path to revenue in 12-15 months
- Category-defining features (AI, real-time) in V2/V3

**Business Case**:
- MVP: 20 customers @ $1,999/mo = $480k ARR
- V2: 50 customers @ $1,999/mo = $1.2M ARR
- V3: 100+ customers @ $1,999/mo = $2.4M+ ARR
- Year 3 exit valuation: **$50M-$100M** (strategic acquisition by SAP/Oracle/Workday)

---

**Document Status**: Final v1.0  
**Last Updated**: 2025-11-29  
**Next Steps**: 
1. Approve budget and timeline
2. Hire 2 senior full-stack engineers
3. Begin Phase 0 (Foundation) immediately

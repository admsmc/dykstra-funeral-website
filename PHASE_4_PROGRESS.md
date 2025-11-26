# Phase 4: Family Portal Frontend - IN PROGRESS 🚧

## Overview
Building the Next.js 15 family portal frontend with tRPC integration, Clerk authentication, and world-class UI using shadcn/ui components.

## Completed ✅

### 1. tRPC Integration (Complete)
Successfully integrated tRPC for type-safe API communication between frontend and backend.

**Files Created:**
- `src/lib/trpc/client.ts` - React hooks for client components
- `src/lib/trpc/server.ts` - Server-side caller for Server Components
- `src/app/api/trpc/[trpc]/route.ts` - API route handler
- `src/app/providers.tsx` - React Query + tRPC providers

**Files Modified:**
- `src/app/layout.tsx` - Added Providers wrapper

**Features:**
- ✅ Type-safe API calls with full IntelliSense
- ✅ Automatic request batching
- ✅ SuperJSON for Date/Money serialization
- ✅ React Query integration for caching
- ✅ Server Component support via server caller
- ✅ Client Component support via React hooks

**Usage Examples:**
```tsx
// Client Component
'use client';
import { trpc } from '@/lib/trpc/client';

export function MyCases() {
  const { data, isLoading } = trpc.case.listMyCases.useQuery();
  
  if (isLoading) return <Loading />;
  return <CaseList cases={data} />;
}

// Server Component
import { serverClient } from '@/lib/trpc/server';

export default async function Page() {
  const client = await serverClient();
  const cases = await client.case.listMyCases();
  return <CaseList cases={cases} />;
}
```

## Remaining Work 🔨

### 2. Authentication (Clerk) - Next Priority
**Goal:** Secure the family portal with Clerk authentication

**Tasks:**
- [ ] Install Clerk SDK (`@clerk/nextjs`)
- [ ] Add Clerk keys to `.env.local`
- [ ] Create `src/middleware.ts` for auth middleware
- [ ] Create `src/app/sign-in/[[...sign-in]]/page.tsx`
- [ ] Create `src/app/sign-up/[[...sign-up]]/page.tsx`
- [ ] Update `createContext` in API package to use Clerk session
- [ ] Add user role mapping (Clerk metadata → domain roles)

### 3. Design System (shadcn/ui)
**Goal:** Install and configure shadcn/ui with Dykstra brand tokens

**Tasks:**
- [ ] Run `npx shadcn-ui@latest init`
- [ ] Install core components: Button, Card, Badge, Avatar, Dialog, Form, Input, Table
- [ ] Configure Tailwind v4 with design tokens from WARP.md
- [ ] Create `src/lib/utils.ts` with `cn()` helper
- [ ] Update `src/app/globals.css` with brand colors (navy, sage, cream, gold, charcoal)

### 4. Family Portal Dashboard
**Goal:** Landing page after login showing case overview and quick actions

**Tasks:**
- [ ] Create `src/app/(portal)/dashboard/page.tsx`
- [ ] Display active cases with status badges
- [ ] Show upcoming services (date, time, location)
- [ ] Quick action cards (view contract, make payment, upload photos)
- [ ] Responsive grid layout

### 5. Case Details Page
**Goal:** Comprehensive view of funeral case with all information

**Tasks:**
- [ ] Create `src/app/(portal)/cases/[id]/page.tsx`
- [ ] Display decedent information
- [ ] Show service details (type, date, location)
- [ ] Timeline of events (case created, contract signed, payments)
- [ ] Family members list
- [ ] Documents section (contract, death certificate, etc.)
- [ ] Action buttons (sign contract, make payment, etc.)

### 6. Contract Signing UI
**Goal:** ESIGN Act compliant digital signature flow

**Tasks:**
- [ ] Create `src/app/(portal)/contracts/[id]/sign/page.tsx`
- [ ] Display contract preview (PDF or HTML)
- [ ] Signature pad component (Canvas API or library)
- [ ] Consent checkbox with exact legal text
- [ ] Capture IP address and user agent
- [ ] Submit signature to `trpc.contract.sign.useMutation()`
- [ ] Success/confirmation page

### 7. Payment Flow (Stripe Elements)
**Goal:** Secure payment processing with Stripe

**Tasks:**
- [ ] Install Stripe SDK (`@stripe/stripe-js`, `@stripe/react-stripe-js`)
- [ ] Create `src/app/(portal)/payments/new/page.tsx`
- [ ] Stripe Elements form (card input, expiry, CVC)
- [ ] Call `trpc.payment.processPayment.useMutation()`
- [ ] Handle 3D Secure authentication
- [ ] Display receipt after successful payment
- [ ] Payment history page

### 8. Photo Gallery for Memorials
**Goal:** Photo upload and gallery for memorial pages

**Tasks:**
- [ ] Create `src/app/(portal)/memorials/[id]/photos/page.tsx`
- [ ] Photo upload component (drag & drop, file picker)
- [ ] Image optimization (resize, compress)
- [ ] Grid layout with lightbox
- [ ] Captions and metadata
- [ ] Integration with StoragePort

## Architecture

### Folder Structure
```
src/
├── app/
│   ├── (portal)/              # Protected family portal routes
│   │   ├── dashboard/         # Main dashboard
│   │   ├── cases/            # Case management
│   │   ├── contracts/        # Contract signing
│   │   ├── payments/         # Payment processing
│   │   └── memorials/        # Memorial pages
│   ├── api/
│   │   └── trpc/             # tRPC API routes
│   ├── sign-in/              # Clerk sign-in
│   ├── sign-up/              # Clerk sign-up
│   ├── layout.tsx            # Root layout with Providers
│   ├── providers.tsx         # tRPC + React Query
│   └── globals.css           # Global styles
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── case-card.tsx         # Domain components
│   ├── signature-pad.tsx
│   └── payment-form.tsx
└── lib/
    ├── trpc/
    │   ├── client.ts         # React hooks
    │   └── server.ts         # Server caller
    └── utils.ts              # Utilities

packages/
├── api/                      # tRPC routers (backend)
├── application/              # Use cases
├── domain/                   # Entities
└── infrastructure/           # Adapters
```

### Data Flow
1. **Client Component** calls `trpc.case.listMyCases.useQuery()`
2. **tRPC Client** sends HTTP request to `/api/trpc/case.listMyCases`
3. **API Route** calls `appRouter.case.listMyCases` with context
4. **Router** executes use case with InfrastructureLayer
5. **Use Case** uses repositories/adapters via Effect-TS
6. **Response** serialized with SuperJSON and returned to client
7. **React Query** caches result and updates UI

## Dependencies to Install

```bash
# Authentication
pnpm add @clerk/nextjs

# tRPC & React Query
pnpm add @trpc/client @trpc/server @trpc/react-query
pnpm add @tanstack/react-query superjson

# UI Components
pnpm add @radix-ui/react-* (via shadcn/ui CLI)
pnpm add class-variance-authority clsx tailwind-merge lucide-react

# Payments
pnpm add @stripe/stripe-js @stripe/react-stripe-js

# Forms
pnpm add react-hook-form @hookform/resolvers zod

# Server-only marker
pnpm add server-only
```

## Success Criteria

- [ ] Authenticated users can view their cases
- [ ] Contracts can be signed with ESIGN Act compliance
- [ ] Payments can be processed via Stripe
- [ ] Photos can be uploaded to memorials
- [ ] All UI is responsive (mobile, tablet, desktop)
- [ ] All interactions are type-safe (TypeScript)
- [ ] Loading states and error handling implemented
- [ ] Accessibility (WCAG 2.1 AA) ensured

## Next Steps

1. ✅ Complete tRPC integration
2. **→ Add Clerk authentication** (Priority: High)
3. Install shadcn/ui and configure design system
4. Build family portal dashboard
5. Implement remaining features

**Estimated Time Remaining:** 6-8 hours
**Status:** 15% Complete
**Blocker:** None - ready to proceed with Clerk auth

---

**Phase 4 Start:** January 2025  
**Current Focus:** Authentication with Clerk  
**Architecture:** Next.js 15 App Router + tRPC + Effect-TS backend

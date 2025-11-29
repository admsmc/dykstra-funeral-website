# BFF (Backend-for-Frontend)

The BFF layer orchestrates calls to both the TypeScript Funeral CRM backend and the Go ERP/HCM/Payroll backend, providing a unified API for the Next.js frontend.

## Architecture

```
Frontend (Next.js) → BFF (tRPC) → CRM Backend (tRPC)
                                 → ERP Backend (HTTP/OpenAPI)
```

## Tech Stack

- **Server**: Fastify
- **RPC**: tRPC with superjson transformer
- **ERP Client**: openapi-fetch (type-safe HTTP client)
- **CRM Client**: tRPC client (stub for now)
- **Auth**: Clerk JWT validation

## Setup

### Install Dependencies

```bash
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Required variables:

- `PORT` - BFF server port (default: 4000)
- `ERP_BASE_URL` - Go ERP API base URL (default: http://localhost:8080)
- `CRM_BASE_URL` - CRM API base URL (default: http://localhost:3000/api/trpc)
- `CLERK_SECRET_KEY` - Clerk secret key for JWT validation

### Start Development Server

```bash
pnpm dev
```

The BFF will start on http://localhost:4000

Endpoints:
- tRPC API: `http://localhost:4000/trpc`
- Health check: `http://localhost:4000/health`

## Directory Structure

```
services/bff/
├── src/
│   ├── routers/           # tRPC routers
│   │   ├── health.router.ts
│   │   └── index.ts       # Main router
│   ├── clients/           # Backend clients
│   │   ├── erp-client.ts  # Go ERP HTTP client
│   │   └── crm-client.ts  # CRM tRPC client
│   ├── middleware/        # Auth, logging, etc.
│   ├── trpc.ts            # tRPC initialization
│   └── index.ts           # Server entrypoint
├── package.json
├── tsconfig.json
└── README.md
```

## Adding New Routers

1. Create router file in `src/routers/`:

```typescript
// src/routers/cases.router.ts
import { router, staffProcedure } from '../trpc'
import { z } from 'zod'

export const casesRouter = router({
  list: staffProcedure.query(async ({ ctx }) => {
    // Call CRM backend
    return await ctx.crmClient.case.list()
  }),
  
  finalizeCase: staffProcedure
    .input(z.object({ businessKey: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // 1. Finalize in CRM
      const case_ = await ctx.crmClient.case.finalize(input)
      
      // 2. Post to GL in ERP
      const journal = await ctx.erpClient.POST('/v1/gl/journals', {
        body: { /* ... */ }
      })
      
      return { case_, journal }
    })
})
```

2. Add to main router in `src/routers/index.ts`:

```typescript
import { casesRouter } from './cases.router'

export const appRouter = router({
  health: healthRouter,
  cases: casesRouter, // Add here
})
```

## Type Safety

### ERP Client Types

The ERP client uses types generated from the Go ERP's OpenAPI spec:

```bash
# Generate types (requires Go ERP running on localhost:8080)
pnpm generate:openapi
```

This creates `src/generated/erp-api.ts` with full type definitions for all ERP endpoints.

### Frontend Types

Export the main router type for the frontend:

```typescript
// src/routers/index.ts
export type AppRouter = typeof appRouter
```

Frontend can then import this type for end-to-end type safety:

```typescript
// apps/web/lib/trpc.ts
import type { AppRouter } from '@dykstra/bff'
```

## Authentication

The BFF validates Clerk JWTs from the `Authorization: Bearer <token>` header.

Context includes:

```typescript
{
  user: {
    id: string
    roles: string[]
    tenant?: string
    legalEntity?: string
  }
}
```

### Procedure Types

- `publicProcedure` - No auth required
- `protectedProcedure` - Requires valid JWT
- `staffProcedure` - Requires staff role
- `adminProcedure` - Requires admin role

## Testing

### Health Check

```bash
curl http://localhost:4000/health
# { "status": "ok" }
```

### tRPC Health Check

```bash
curl http://localhost:4000/trpc/health.ping
# { "result": { "data": { "status": "ok", "timestamp": "..." } } }
```

### Check Backend Connectivity

```bash
curl http://localhost:4000/trpc/health.check
# { "result": { "data": { "status": "healthy", "services": { ... } } } }
```

## Production Deployment

### Build

```bash
pnpm build
```

### Run

```bash
NODE_ENV=production pnpm start
```

### Environment Variables

Ensure all required environment variables are set in production:

- `NODE_ENV=production`
- `PORT=4000`
- `ERP_BASE_URL=https://erp.yourdomain.com`
- `CRM_BASE_URL=https://crm.yourdomain.com/api/trpc`
- `CLERK_SECRET_KEY=<production_key>`

## Development Workflow

1. Start Go ERP backend: `cd tigerbeetle-trial-app-1 && make run-api`
2. Start CRM backend: `cd dykstra-funeral-website && pnpm dev`
3. Start BFF: `cd services/bff && pnpm dev`
4. Start frontend: `cd apps/web && pnpm dev`

## Next Steps

- [ ] Add Clerk JWT validation middleware
- [ ] Implement case-to-GL router
- [ ] Implement payroll router
- [ ] Add request/response logging
- [ ] Add distributed tracing (OpenTelemetry)
- [ ] Add caching layer (LRU cache)
- [ ] Replace CRM client stub with actual tRPC client

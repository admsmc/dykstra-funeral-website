# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Next.js 15 (App Router) website for Dykstra Funeral Home, built with TypeScript and Tailwind CSS v4. The site features a professional, dignified design with a focus on accessibility and clear call-to-action patterns for families in need.

## Common Development Commands

### Development Server
```bash
npm run dev
```
Starts the Next.js development server at http://localhost:3000 with hot-reload enabled.

### Build
```bash
npm run build
```
Creates an optimized production build. Validates TypeScript types and ensures all pages render correctly.

### Production Server
```bash
npm start
```
Runs the production build locally. Must run `npm run build` first.

### Linting
```bash
pnpm lint
```
Runs ESLint to check for code quality issues using Next.js recommended rules.

### Validation (Recommended Before Commit)
```bash
pnpm validate
```
Runs comprehensive pre-commit checks:
- TypeScript compilation across all packages
- ESLint with Effect-specific rules
- Circular dependency detection
- Effect Layer validation (catches await import issues)
- Interface/tag naming conflict detection
- Dependency injection validation
- Prisma type safety validation
- **Backend contract validation** (NEW: verifies adapters match ports)

### Technical Debt Verification (CI)
```bash
.github/scripts/verify-technical-debt.sh
```
- ✅ Prevents false "missing method" claims in code and docs
- ✅ Detects when methods exist but are incorrectly documented as missing
- ✅ Runs automatically on pull requests via GitHub Actions
- ✅ Blocks PRs with false technical debt claims
- ⚠️ Warns about simplified implementations without verification

**Resources**:
- 📖 [CI Verification Scripts README](.github/scripts/README.md) - Complete usage guide
- 📖 [Pre-Implementation Checklist](docs/PRE_IMPLEMENTATION_CHECKLIST.md) - 5-step verification process
- 📖 [Verification Quick Reference](docs/VERIFICATION_QUICK_REFERENCE.md) - Quick command cheat sheet

**Why This Matters**: Use Case 6.4 initially documented 3 weeks of "missing" Go backend work when only 4 hours of TypeScript wiring was needed. This system prevents similar mistakes.

### Specific Validation Commands
```bash
pnpm check:circular       # Check for circular dependencies
pnpm check:layers         # Validate Effect Layer definitions
pnpm type-check           # TypeScript compilation only
pnpm validate:di          # Dependency injection validation
pnpm validate:contracts   # Backend contract validation (Phase 1)
pnpm validate:contracts:openapi  # OpenAPI integration (Phase 2)
pnpm validate:breaking-changes   # Breaking change detection (Phase 4)
```

### Backend Contract Validation System (4 Phases)

The project includes a comprehensive 4-phase validation system for Go backend integration:

#### Phase 1: Static Validation
```bash
pnpm validate:contracts
```
- ✅ Verifies all 21 Go backend ports have corresponding adapters
- ✅ Ensures every port method has an adapter implementation (142 methods)
- ✅ Extracts and displays HTTP endpoints for documentation
- ✅ Catches missing implementations before runtime
- ✅ Integrated into `pnpm validate` and pre-commit hooks

#### Phase 2: OpenAPI Integration (Optional)
```bash
pnpm validate:contracts:openapi
pnpm validate:contracts:openapi --openapi-path=../go-erp/docs/openapi.yaml
```
- ✅ Validates TypeScript endpoints match Go OpenAPI specification
- ✅ Compares HTTP methods and paths
- ✅ Auto-discovers OpenAPI spec in common locations
- ⚠️  Informational only (doesn't fail builds)

#### Phase 3: Contract Testing
```bash
pnpm test  # Includes contract validation tests
pnpm --filter @dykstra/infrastructure test contract-validation
```
- ✅ Runtime tests verify adapter implementations
- ✅ Validates all 21 adapters implement their port interfaces
- ✅ Ensures consistent error handling patterns
- ✅ Located at `packages/infrastructure/src/adapters/go-backend/__tests__/contract-validation.test.ts`

#### Phase 4: Breaking Change Detection
```bash
pnpm validate:breaking-changes                    # Check for changes
pnpm validate:breaking-changes --update-baseline  # Update baseline
```
- ✅ Tracks API changes over time with baseline snapshots
- ✅ Detects removed methods, changed endpoints, modified signatures
- ✅ Fails on breaking changes, warns on non-breaking changes
- ✅ Baseline stored in `.baseline/backend-contracts.json` (committed to Git)
- ✅ Integrated into `pnpm validate` and pre-commit hooks

**Complete Documentation**: See [docs/BACKEND_CONTRACT_VALIDATION_COMPLETE.md](./docs/BACKEND_CONTRACT_VALIDATION_COMPLETE.md) for the full 4-phase validation system guide.

## Prisma 7 Configuration

This project uses **Prisma ORM 7.0.1** with the following setup:

### Key Files
- **Configuration**: `prisma.config.ts` at project root (new in Prisma 7)
- **Schema**: `packages/infrastructure/prisma/schema.prisma`
- **Migrations**: `packages/infrastructure/prisma/migrations/`
- **Database adapter**: `@prisma/adapter-pg` for PostgreSQL

### Prisma 7 Breaking Changes
- ✅ Connection URL moved from schema to `prisma.config.ts`
- ✅ Database adapter required in PrismaClient instantiation
- ✅ Environment variables loaded via `dotenv/config` (not auto-loaded)
- ✅ Uses PostgreSQL connection pool (`pg`) for better performance

### Running Prisma Commands
All Prisma commands automatically load configuration from `prisma.config.ts`:
```bash
# From project root
npx prisma generate          # Generate Prisma Client
npx prisma db push           # Push schema changes to database
npx prisma migrate dev       # Create and apply migration
npx prisma studio            # Open Prisma Studio

# From infrastructure package
pnpm --filter @dykstra/infrastructure db:generate
pnpm --filter @dykstra/infrastructure db:push
pnpm --filter @dykstra/infrastructure db:migrate
pnpm --filter @dykstra/infrastructure db:studio
```

### PrismaClient Setup
PrismaClient is configured with the PostgreSQL adapter in `packages/infrastructure/src/database/prisma-client.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })
```

**Note**: The connection pool is managed as a singleton to prevent connection leaks in development.

## Architecture & Code Structure

**⚠️ CRITICAL: This project follows Clean Architecture patterns. ALL code MUST adhere to the architectural guidelines.**

**📖 READ FIRST**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete Clean Architecture guidelines including:
- Layer boundaries and dependency rules
- Object-based repository pattern (NOT classes)
- SCD2 temporal pattern for historical data
- Error handling standards
- Code examples and anti-patterns

**Key Rules**:
- ✅ Domain layer: Pure business logic, zero dependencies
- ✅ Application layer: Use cases and ports (interfaces)
- ✅ Infrastructure layer: Object-based adapters (NOT classes)
- ✅ API layer: Thin routers, delegate to use cases
- ❌ NO Prisma in application or domain layers
- ❌ NO class-based repositories
- ❌ NO business logic in API routers

### Go Backend Integration Architecture

**Port-Adapter File Structure**:
- ✅ **1:1 Mapping**: Each Go port has exactly one matching adapter file
- ✅ **Individual Files**: All 21 Go ERP module ports are in separate files (no consolidation)
- ✅ **Naming Convention**: `go-{module}-port.ts` → `go-{module}-adapter.ts`
- ✅ **Location**:
  - Ports: `packages/application/src/ports/go-*.ts`
  - Adapters: `packages/infrastructure/src/adapters/go-backend/go-*-adapter.ts`

**21 Go Modules**:
- High-priority (6): Contract, Financial, Inventory, Payroll, Procurement, Timesheet
- Medium-priority (6): ApprovalWorkflow, Budget, FixedAssets, ProfessionalServices, Reconciliations, SegmentReporting
- Low-priority (9): Consolidations, EmployeeMasterData, EmployeeOnboarding, EmployeeTermination, Performance, PositionManagement, PTO, Rehire, Training

**Adapter Pattern** (Object-based, NOT class-based):
```typescript
// ✅ CORRECT - Object-based adapter
export const GoContractAdapter: GoContractPortService = {
  createContract: (command) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/contracts', { body: command });
        if (res.error) throw new Error(res.error.message);
        return mapToGoContract(res.data);
      },
      catch: (error) => new NetworkError('Failed to create contract', error)
    }),
  // ... other methods
};

// ❌ WRONG - Class-based adapter
class GoContractAdapter implements GoContractPortService { ... }
```

**Refactoring History** (November 2025):
- Split consolidated `go-remaining-ports.ts` (14 ports) → 15 individual port files
- Split `GoHCMCommonPort` (12 methods, 4 concerns) → 4 focused ports (Performance, Training, Rehire, EmployeeMasterData)
- Split 2 consolidated adapter files → 21 individual adapter files
- Benefits: SRP compliance, ISP compliance, clearer ownership, reduced merge conflicts

### Effect-Specific Best Practices

**Service Tag / Interface Naming (CRITICAL)**:
- **Problem**: Using the same name for both interface and Context tag causes circular type references
- **Solution**: Suffix interfaces with `Service` (e.g., `StoragePortService` interface, `StoragePort` tag)
- **Example**:
  ```typescript
  // ✅ CORRECT
  export interface StoragePortService { ... }
  export const StoragePort = Context.GenericTag<StoragePortService>('@dykstra/StoragePort');
  
  // ❌ WRONG - Causes "StoragePort is not defined" runtime error
  export interface StoragePort { ... }
  export const StoragePort = Context.GenericTag<StoragePort>('@dykstra/StoragePort');
  ```

**Layer Definition Rules**:
- ❌ NEVER use `await import()` in Layer definitions (causes dependency injection failures)
- ✅ Always import service tags at top of file: `import { ServiceTag } from '@dykstra/application'`
- ✅ Use `Layer.succeed(ServiceTag, implementation)` pattern
- ❌ NO top-level side effects in exported Layers

**Validation Tools**:
Run `pnpm validate` before committing to catch:
- Circular dependencies
- Interface/tag naming conflicts  
- `await import()` in Layer definitions
- Type-aware ESLint issues

### App Router Pattern
This project uses Next.js 15 App Router (not Pages Router). All routes are defined as directories under `src/app/` with a `page.tsx` file:

- Routes: `src/app/[route]/page.tsx`
- Shared layout: `src/app/layout.tsx` (includes metadata, fonts)
- Global styles: `src/app/globals.css`

### Component Organization
Components are in `src/components/`:
- `Header.tsx` - Navigation with mobile menu (client component)
- `Footer.tsx` - Footer with contact info and links
- `CallToAction.tsx` - Reusable CTA with three variants: `primary`, `secondary`, `emergency`

### Path Aliases
TypeScript is configured with `@/*` pointing to `./src/*`:
```typescript
import Header from "@/components/Header";
```

### Font System
Two Google Fonts are pre-configured in `layout.tsx`:
- **Playfair Display** (`--font-playfair`): Serif font for headings
- **Inter** (`--font-inter`): Sans-serif for body text

Access via CSS variables or Tailwind's `font-serif` / `font-sans`.

## Design System

### Color Palette
Defined in `globals.css` as CSS variables and Tailwind theme tokens:

- **Navy** (`--navy` / `#1e3a5f`): Primary brand color, headings, primary CTAs
- **Sage** (`--sage` / `#8b9d83`): Secondary accent, secondary CTAs
- **Cream** (`--cream` / `#f5f3ed`): Alternate section backgrounds
- **Gold** (`--gold` / `#b8956a`): Premium accents (use sparingly)
- **Charcoal** (`--charcoal` / `#2c3539`): Footer, dark contrasts

Use in Tailwind: `bg-[--navy]`, `text-[--sage]`, etc.

### Typography Hierarchy
- Headings: Playfair Display (serif) via `font-serif`
- Body text: Inter (sans-serif) via `font-sans`
- Font weights: Normal for body, bold for headings

### Component Patterns

#### CallToAction Variants
The `CallToAction` component supports three variants:
```tsx
<CallToAction variant="primary" />    // Default: phone + message CTAs
<CallToAction variant="secondary" />  // Two-column: pre-planning + contact
<CallToAction variant="emergency" />  // Prominent 24/7 emergency CTA
```

#### Client Components
Only `Header.tsx` uses `"use client"` directive for mobile menu state. All other components are server components by default.

## Content Management Guidelines

### Contact Information Locations
Phone number and contact details appear in multiple files. When updating contact info, modify all of:
- `src/components/Header.tsx` - Navigation
- `src/components/Footer.tsx` - Footer contact section
- `src/components/CallToAction.tsx` - All three variants
- `src/app/contact/page.tsx` - Contact form page

### Placeholder Phone Number
The site currently uses `(555) 123-4567` as a placeholder. Replace with actual contact information before deployment.

### Placeholder Address
Update the address in `Footer.tsx`: `123 Main Street, Anytown, MI 12345`

## Tailwind CSS v4 Notes

This project uses **Tailwind CSS v4** (not v3). Key differences:
- Configuration via `@theme inline` directive in `globals.css` (no `tailwind.config.js`)
- CSS variables defined in `:root` are exposed via `@theme inline`
- Import with `@import "tailwindcss"` in CSS files

## TypeScript Configuration

### Compiler Settings
- Target: ES2017
- Module: ESNext with bundler resolution
- Strict mode enabled
- JSX: react-jsx (automatic runtime)

### Path Mapping
```json
"@/*": ["./src/*"]
```

## Page Structure

All pages follow a consistent structure:
1. Hero section with page title
2. Main content sections
3. CallToAction component (variant chosen per page)
4. Footer (via root layout)

## SEO Considerations

### Metadata
All metadata is defined in `src/app/layout.tsx`:
- Title includes location and services
- Description is comprehensive (155 characters)
- Keywords cover core services

For page-specific metadata, export a `metadata` object from individual `page.tsx` files.

### Accessibility
- Semantic HTML structure (header, nav, main, section, footer)
- Proper heading hierarchy (h1 → h2 → h3)
- Alt text placeholders for images (add actual descriptions)
- Keyboard navigation support
- ARIA labels on interactive elements (mobile menu button)

## Build & Deployment

### Vercel (Recommended)
This project is optimized for Vercel deployment:
1. Push to GitHub
2. Import repository in Vercel
3. Auto-detects Next.js config
4. Deploys automatically

### Environment Variables
Currently none required. If adding features like contact form backend or CMS integration, add `.env.local` and document required variables.

## React Compiler

This project uses the experimental React Compiler (`reactCompiler: true` in `next.config.ts`). This automatically optimizes React components for better performance. No manual memoization needed in most cases.

## Common Tasks

### Adding a New Page
1. Create directory: `src/app/new-page/`
2. Create file: `src/app/new-page/page.tsx`
3. Export default component
4. Add navigation link to `Header.tsx`
5. Add link to `Footer.tsx` if appropriate

### Modifying Colors
Edit `src/app/globals.css`:
```css
:root {
  --navy: #new-color;
}
```
Colors automatically propagate via Tailwind theme.

### Adding New Fonts
Modify `src/app/layout.tsx`:
```typescript
import { Font_Name } from "next/font/google";
const fontName = Font_Name({
  variable: "--font-name",
  subsets: ["latin"],
});
```

## Code Style Guidelines

### Component Structure
- Functional components only (no class components)
- Server components by default (add `"use client"` only when needed)
- Props interfaces defined with TypeScript
- Default exports for page components

### CSS/Styling
- Tailwind utility classes preferred over custom CSS
- Use CSS variables for colors: `bg-[--navy]`
- Responsive design: mobile-first with `md:` and `lg:` breakpoints
- Hover states on interactive elements

### Naming Conventions
- Components: PascalCase (`Header.tsx`)
- Files: kebab-case for routes, PascalCase for components
- CSS variables: kebab-case (`--navy`)
- Functions: camelCase

## Future Enhancement Areas

The README documents planned features:
- CMS integration for obituary management
- Contact form backend with email notifications
- Online memorial pages with galleries
- Payment processing for pre-planning
- Google Maps integration
- Grief resources section

When implementing these, maintain the existing design system and component patterns.

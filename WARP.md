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

### Specific Validation Commands
```bash
pnpm check:circular  # Check for circular dependencies
pnpm check:layers    # Validate Effect Layer definitions
pnpm type-check      # TypeScript compilation only
```

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

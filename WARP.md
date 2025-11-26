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
npm run lint
```
Runs ESLint to check for code quality issues using Next.js recommended rules.

## Architecture & Code Structure

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

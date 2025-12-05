# Dykstra Funeral Home Website

A modern, professional website for Dykstra Funeral Home built with Next.js, TypeScript, and Tailwind CSS. This website provides comprehensive information about funeral services, pre-planning options, obituaries, and includes multiple call-to-action touchpoints for families in need.

## Features

- **Modern Design**: Professional, dignified design with custom color scheme appropriate for funeral services
- **Responsive Layout**: Fully responsive design that works on all devices
- **SEO Optimized**: Proper metadata and semantic HTML for search engine visibility
- **Call-to-Action Infrastructure**: Multiple CTAs throughout the site for phone calls, contact forms, and service inquiries
- **Accessibility**: Keyboard navigation and screen reader friendly
- **Performance**: Built with Next.js for optimal performance and loading times

## Pages

- **Home** - Hero section with immediate contact CTAs, services overview, and value propositions
- **Services** - Detailed information about traditional funerals, cremation, and memorial services
- **Obituaries** - Current obituaries listing with search functionality
- **Pre-Planning** - Information about pre-planning services with benefits and payment options
- **About Us** - Company history, values, facilities, and community involvement
- **Contact** - Contact form, location information, hours, and multiple contact methods

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **Fonts**: Playfair Display (serif) and Inter (sans-serif) from Google Fonts
- **Business Logic**: Effect-TS for type-safe error handling and dependency injection
- **Architecture**: Clean Architecture with feature modules and ViewModel pattern
- **Deployment**: Optimized for Vercel

## Design System

### Color Palette

- **Navy** (`#1e3a5f`): Primary color for headings and important CTAs
- **Sage** (`#8b9d83`): Secondary color for accents and secondary CTAs
- **Cream** (`#f5f3ed`): Background color for section variation
- **Gold** (`#b8956a`): Accent color for premium elements
- **Charcoal** (`#2c3539`): Dark neutral for footer and contrast

### Typography

- **Headings**: Playfair Display (serif) - elegant, traditional
- **Body**: Inter (sans-serif) - clean, readable

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dykstra-funeral-website
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
dykstra-funeral-website/
├── packages/
│   ├── application/          # Business logic layer (use cases, ports)
│   ├── domain/               # Core domain models and logic
│   ├── infrastructure/       # Adapters (database, APIs, external services)
│   └── ui/                   # React frontend
│       ├── src/
│       │   ├── app/         # Next.js App Router pages
│       │   ├── features/    # Feature modules (Phase 2 complete)
│       │   │   ├── case-detail/
│       │   │   ├── contract-builder/
│       │   │   ├── template-editor/
│       │   │   └── ... (9 features total)
│       │   └── components/  # Shared components
│       └── README.md
├── docs/
│   ├── architecture/
│   │   └── decisions/       # Architecture Decision Records (ADRs)
│   ├── ARCHITECTURE.md
│   └── ... (implementation plans, guides)
├── prisma.config.ts         # Prisma 7 configuration
└── package.json
```

## Architecture Modernization (Phase 2 Complete)

### Phase 2: Presentation Layer Architecture ✅

**Status**: Complete (December 2025)  
**Result**: 88.1% average code reduction across 9 features

| Metric | Value |
|--------|-------|
| Features Refactored | 9/9 (100%) |
| Code Reduction | 5,041 → 842 lines (88.1%) |
| Components Created | 48 reusable components |
| ViewModels Created | 19 pure functions |
| Custom Hooks | 23 data fetching hooks |
| TypeScript Errors | 0 new errors |

**Key Achievements**:
- ✅ ViewModel pattern for presentation logic separation
- ✅ Feature module structure for scalable organization
- ✅ Zero React-specific logic in ViewModels (100% testable)
- ✅ Consistent formatting and business rule enforcement

**Documentation**:
- [ADR 001: ViewModel Pattern](./docs/architecture/decisions/001-viewmodel-pattern.md)
- [ADR 002: Feature Module Structure](./docs/architecture/decisions/002-feature-module-structure.md)
- [ADR 003: Effect-TS for Business Logic](./docs/architecture/decisions/003-effect-ts-adoption.md)
- [Phase 2 Complete Report](./PHASE_2_COMPLETE_ALL_9_FEATURES.md)

### Feature Module Pattern

All features follow a consistent structure:

```
src/features/{feature}/
├── components/         # Feature-specific UI components
├── hooks/             # Custom hooks for data fetching
├── view-models/       # Data transformation and formatting (pure functions)
├── types/             # TypeScript type definitions
├── constants/         # Static data (optional)
├── README.md          # Feature documentation
└── index.ts           # Public API barrel export
```

**Benefits**:
- Clear ownership and boundaries
- Encapsulated implementation details
- Easy to test in isolation
- Scalable to 50+ features

**Example Features**:
- `case-detail` - Case management details (856 → 125 lines, 85.4% reduction)
- `contract-builder` - Service arrangement builder (1,101 → 90 lines, 91.8% reduction)
- `template-editor` - WYSIWYG document editor (545 → 73 lines, 86.6% reduction)

See [feature READMEs](./src/features/) for implementation details.

## Customization

### Contact Information

Update contact details in:
- `src/components/Header.tsx`
- `src/components/Footer.tsx`
- `src/components/CallToAction.tsx`
- `src/app/contact/page.tsx`

### Colors

Modify the color scheme in `src/app/globals.css` under the `:root` section.

### Content

Edit page content directly in the respective page files under `src/app/`.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Vercel will auto-detect Next.js and deploy

### Other Platforms

Build the production version:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Future Enhancements

- Add CMS integration for obituary management
- Implement contact form backend with email notifications
- Add online memorial pages with photo galleries
- Integrate payment processing for pre-planning services
- Add Google Maps integration for location
- Implement grief resources section
- Add blog/resources section

## Best Practices Implemented

- Semantic HTML structure
- Proper heading hierarchy
- Alt text for images (placeholder structure in place)
- Mobile-first responsive design
- Fast page loads with Next.js optimization
- TypeScript for type safety
- Component-based architecture
- Consistent spacing and typography
- Clear call-to-action placement
- Professional, empathetic tone

## Support

For questions or support regarding this website, please contact the development team.

## License

Proprietary - All rights reserved by Dykstra Funeral Home

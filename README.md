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
├── src/
│   ├── app/
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── contact/
│   │   │   └── page.tsx
│   │   ├── obituaries/
│   │   │   └── page.tsx
│   │   ├── pre-planning/
│   │   │   └── page.tsx
│   │   ├── services/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── components/
│       ├── CallToAction.tsx
│       ├── Footer.tsx
│       └── Header.tsx
├── public/
├── package.json
├── tsconfig.json
└── README.md
```

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

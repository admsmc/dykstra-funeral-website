/**
 * Enhanced Design Tokens - 2025 Standards
 * 
 * This file contains modernized design tokens following 2025 best practices:
 * - 9-shade color scales (50-950) for all brand colors
 * - Fluid typography with clamp() for responsive sizing
 * - Branded shadows with color tints
 * - Semantic spacing system
 * - Touch-optimized sizing for mobile-first design
 * - Theme support (light/dark/lowLight)
 */

// ============================================================================
// COLOR SYSTEM - 9-shade scales (2025 standard)
// ============================================================================

export const colors = {
  // Navy - Primary (expanded from single shade to 9 shades)
  navy: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#2563eb',  // NEW primary (more vibrant than old #1e3a5f)
    600: '#1d4ed8',
    700: '#1e40af',
    800: '#1e3a8a',  // Old primary moved here
    900: '#1e293b',
    950: '#0f172a',
  },
  
  // Sage - Secondary (expanded to 9 shades)
  sage: {
    50: '#f5f7f4',
    100: '#e8ede6',
    200: '#d3dcd0',
    300: '#b2c2ac',
    400: '#8fa886',
    500: '#8b9d83',  // Original sage #8b9d83
    600: '#6d7c65',
    700: '#57624f',
    800: '#454f3f',
    900: '#383f32',
    950: '#1d211a',
  },
  
  // Gold - Accent (premium feel)
  gold: {
    50: '#fdfbf7',
    100: '#f9f4e8',
    200: '#f2e6cf',
    300: '#e8d2a8',
    400: '#dbb976',
    500: '#b8956a',  // Original gold
    600: '#a07b52',
    700: '#846044',
    800: '#6e4f3a',
    900: '#5d4332',
    950: '#342119',
  },
  
  // Semantic colors (9-shade scales)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#10b981',  // Base
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // Base
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',  // Base
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
  
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Base
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  
  // Neutral (comprehensive scale)
  neutral: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
    950: '#0c0a09',
  },
  
  // Legacy support (for backwards compatibility)
  cream: '#f5f3ed',
  charcoal: '#2c3539',
  
  // NEW: Premium accents for high-value CTAs
  accent: {
    primary: '#3b82f6',    // Vibrant blue
    secondary: '#8b5cf6',  // Purple
    tertiary: '#ec4899',   // Pink
  },
} as const;

// ============================================================================
// THEME DEFINITIONS - Light/Dark/Low-Light modes
// ============================================================================

export const themes = {
  light: {
    background: '#ffffff',
    foreground: '#0c0a09',
    card: '#ffffff',
    'card-foreground': '#0c0a09',
    primary: colors.navy[500],
    'primary-foreground': '#ffffff',
    secondary: colors.sage[500],
    'secondary-foreground': '#ffffff',
    accent: colors.gold[500],
    'accent-foreground': '#ffffff',
    muted: colors.neutral[100],
    'muted-foreground': colors.neutral[500],
    border: colors.neutral[200],
    input: colors.neutral[200],
    ring: colors.navy[500],
  },
  dark: {
    background: '#0a0a0a',
    foreground: '#fafaf9',
    card: '#1c1917',
    'card-foreground': '#fafaf9',
    primary: colors.navy[400],
    'primary-foreground': '#0a0a0a',
    secondary: colors.sage[400],
    'secondary-foreground': '#0a0a0a',
    accent: colors.gold[400],
    'accent-foreground': '#0a0a0a',
    muted: colors.neutral[800],
    'muted-foreground': colors.neutral[400],
    border: colors.neutral[800],
    input: colors.neutral[800],
    ring: colors.navy[400],
  },
  lowLight: {  // NEW for 2025 - lower contrast for digital wellbeing
    background: '#1a1a1a',
    foreground: '#e5e5e5',
    card: '#262626',
    'card-foreground': '#e5e5e5',
    primary: '#60a5fa',  // Softer blue
    'primary-foreground': '#1a1a1a',
    secondary: '#a8a29e',  // Softer sage
    'secondary-foreground': '#1a1a1a',
    accent: '#dbb976',  // Softer gold
    'accent-foreground': '#1a1a1a',
    muted: colors.neutral[700],
    'muted-foreground': colors.neutral[400],
    border: colors.neutral[700],
    input: colors.neutral[700],
    ring: 'rgba(96, 165, 250, 0.3)',  // Soft glow
  },
} as const;

// ============================================================================
// TYPOGRAPHY - Fluid sizing with responsive scales
// ============================================================================

export const typography = {
  fonts: {
    serif: 'var(--font-playfair), serif',
    sans: 'var(--font-inter), sans-serif',
    mono: 'JetBrains Mono, Consolas, monospace',  // NEW - for code/data
  },
  sizes: {
    // Fluid sizing with clamp() for responsive typography
    xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
    sm: 'clamp(0.875rem, 0.825rem + 0.25vw, 1rem)',
    base: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
    lg: 'clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)',
    xl: 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)',
    '2xl': 'clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem)',
    '3xl': 'clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem)',
    '4xl': 'clamp(2.25rem, 1.95rem + 1.5vw, 3rem)',
    '5xl': 'clamp(3rem, 2.5rem + 2.5vw, 4rem)',
  },
  weights: {
    body: '400',
    'body-emphasis': '500',
    heading: '600',
    'heading-display': '700',
    numeric: '500',  // For data tables, financial info
  },
  lineHeights: {
    tight: '1.1',      // Large headings
    snug: '1.375',     // Small headings
    normal: '1.5',     // Body text
    relaxed: '1.625',  // Long-form content
    loose: '1.75',     // Marketing copy
  },
} as const;

// ============================================================================
// SPACING - 4px grid system + semantic spacing
// ============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

// Semantic spacing (NEW - context-aware spacing)
export const semanticSpacing = {
  component: {
    padding: {
      sm: '0.75rem',   // Compact mode
      md: '1rem',      // Default
      lg: '1.5rem',    // Comfortable
    },
    gap: {
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
    },
  },
  layout: {
    section: '4rem',      // Between major sections
    container: '2rem',    // Container padding
    gutter: '1.5rem',     // Grid gutter
  },
  // Mobile-first touch targets (NEW for 2025)
  touch: {
    mobile: {
      minHeight: '44px',  // iOS HIG minimum
      minWidth: '44px',
      comfortable: '48px', // Android Material
      large: '56px',      // Premium touch target
    },
    desktop: {
      minHeight: '32px',
      minWidth: '32px',
      comfortable: '40px',
      large: '48px',
    },
  },
} as const;

// ============================================================================
// BORDER RADIUS - Modern 8px default (vs old 4px)
// ============================================================================

export const radii = {
  none: '0',
  sm: '0.25rem',      // 4px (was 2px)
  DEFAULT: '0.5rem',  // 8px (was 4px) - MODERNIZED
  md: '0.75rem',      // 12px (was 6px)
  lg: '1rem',         // 16px (was 8px)
  xl: '1.5rem',       // 24px (was 12px)
  '2xl': '2rem',      // 32px (was 16px)
  full: '9999px',
} as const;

// ============================================================================
// ELEVATION - Branded shadows with navy tint + colored shadows
// ============================================================================

export const elevation = {
  shadows: {
    // Subtle brand tint in shadows (navy-tinted, not generic black)
    sm: '0 1px 2px 0 rgba(30, 58, 95, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(30, 58, 95, 0.1), 0 1px 2px -1px rgba(30, 58, 95, 0.05)',
    md: '0 4px 6px -1px rgba(30, 58, 95, 0.1), 0 2px 4px -2px rgba(30, 58, 95, 0.05)',
    lg: '0 10px 15px -3px rgba(30, 58, 95, 0.1), 0 4px 6px -4px rgba(30, 58, 95, 0.05)',
    xl: '0 20px 25px -5px rgba(30, 58, 95, 0.15), 0 8px 10px -6px rgba(30, 58, 95, 0.1)',
    '2xl': '0 25px 50px -12px rgba(30, 58, 95, 0.25)',
    
    // Colored shadows for emphasis (NEW for 2025)
    primary: '0 10px 25px -5px rgba(37, 99, 235, 0.25)',
    success: '0 10px 25px -5px rgba(16, 185, 129, 0.25)',
    warning: '0 10px 25px -5px rgba(245, 158, 11, 0.25)',
    error: '0 10px 25px -5px rgba(239, 68, 68, 0.25)',
    premium: '0 10px 25px -5px rgba(184, 149, 106, 0.35)',  // Gold glow
  },
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  },
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

export const tokens = {
  colors,
  themes,
  typography,
  spacing,
  semanticSpacing,
  radii,
  elevation,
} as const;

export default tokens;

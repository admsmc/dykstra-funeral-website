# Phase 0: 2025 Design System Enhancement Plan
## 🎯 EXECUTE BEFORE OR PARALLEL TO EXISTING PHASE 1

**Duration**: 2 weeks (can run parallel to existing Phase 1)  
**Priority**: CRITICAL - Addresses 2-3 year design gap  
**Goal**: Modernize visual design language to 2025 standards before building components

---

## Why Phase 0 is Critical

Your existing plan builds a **2022-2023 design system**. This phase upgrades it to **2025 standards** BEFORE you create 20+ components, saving massive refactoring later.

### Current Plan Issues:
- ❌ Color system: Single shades (not 2025 standard 9-shade scales)
- ❌ Border radius: 4px default (2025 standard is 8px)
- ❌ Shadows: Generic Tailwind (need branded shadows)
- ❌ Micro-interactions: None planned
- ❌ Animations: Not in scope
- ❌ Dark mode: Not included
- ❌ AI patterns: Missing entirely
- ❌ Emotional design: Not addressed
- ❌ Mobile-first: Mentioned but not implemented systematically

### What This Phase Adds:
- ✅ Modern 9-shade color scales (navy, sage, gold, semantic colors)
- ✅ Enhanced micro-interactions for ALL components
- ✅ Dark + Low-Light mode theming
- ✅ Branded shadows with color tints
- ✅ Fluid typography
- ✅ AI integration patterns
- ✅ Emotional design touchpoints
- ✅ Mobile-optimized touch targets

---

## Part 1: Enhanced Design Tokens (Days 1-2)

### Step 0.1: Modernized Color System

**Replace your existing single-shade colors with 9-shade scales**:

```typescript
// packages/ui/src/tokens.ts (REPLACE existing colors)
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
    300: '#b2c2ac',  // Your current sage adjusted
    400: '#8fa886',
    500: '#8b9d83',  // Your current sage #8b9d83
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
    500: '#b8956a',  // Your current gold
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
  
  // Legacy support (map to new shades)
  cream: '#f5f3ed',  // Keep for compatibility
  charcoal: '#2c3539',  // Keep for compatibility
  
  // NEW: Premium accents for high-value CTAs
  accent: {
    primary: '#3b82f6',    // Vibrant blue
    secondary: '#8b5cf6',  // Purple
    tertiary: '#ec4899',   // Pink
  },
};

// NEW: Theme support (light/dark/low-light)
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
};
```

**Acceptance Criteria**:
- ✅ All brand colors have 9 shades (50-950)
- ✅ Semantic colors have full scales
- ✅ Three theme modes defined (light/dark/lowLight)
- ✅ Legacy colors preserved for compatibility

---

### Step 0.2: Enhanced Spacing, Typography, Shadows

```typescript
// packages/ui/src/tokens.ts (ADD to existing file)

// Fluid typography (responsive to viewport)
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
};

// Enhanced border radius (modern 8px default vs your 4px)
export const radii = {
  none: '0',
  sm: '0.25rem',      // 4px (was 2px)
  DEFAULT: '0.5rem',  // 8px (was 4px) ⚠️ BREAKING CHANGE but necessary
  md: '0.75rem',      // 12px (was 6px)
  lg: '1rem',         // 16px (was 8px)
  xl: '1.5rem',       // 24px (was 12px)
  '2xl': '2rem',      // 32px (was 16px)
  full: '9999px',
};

// Branded shadows (with navy tint, not generic black)
export const elevation = {
  shadows: {
    // Subtle brand tint in shadows
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
};

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
};
```

**Acceptance Criteria**:
- ✅ Fluid typography scales with viewport
- ✅ Border radius modernized (8px default)
- ✅ Branded shadows with navy tint
- ✅ Colored shadows for emphasis
- ✅ Semantic spacing defined
- ✅ Touch-optimized spacing included

---

## Part 2: Framer Motion Integration (Days 3-4)

### Step 0.3: Animation System

**Install Framer Motion** (already in your dependencies):
```bash
# Verify installed
pnpm list framer-motion
```

**Create animation presets**:

```typescript
// packages/ui/src/animations/presets.ts
import { Variants } from 'framer-motion';

// Button animations (enhanced from your basic whileTap)
export const buttonVariants: Variants = {
  idle: { 
    scale: 1, 
    boxShadow: "0 2px 4px rgba(30, 58, 95, 0.1)" 
  },
  hover: { 
    scale: 1.02, 
    boxShadow: "0 4px 12px rgba(30, 58, 95, 0.15)",
    transition: { duration: 0.2, ease: "easeOut" }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  },
  loading: {
    opacity: [1, 0.7, 1],
    transition: { 
      repeat: Infinity, 
      duration: 1.5,
      ease: "easeInOut"
    }
  },
  success: {
    scale: [1, 1.05, 1],
    boxShadow: [
      "0 2px 4px rgba(30, 58, 95, 0.1)",
      "0 10px 25px rgba(16, 185, 129, 0.3)",
      "0 2px 4px rgba(30, 58, 95, 0.1)"
    ],
    transition: { duration: 0.6 }
  },
  error: {
    x: [-2, 2, -2, 2, 0],
    transition: { duration: 0.4 }
  },
};

// Input field animations
export const inputVariants: Variants = {
  blur: { 
    borderColor: "var(--border)",
    boxShadow: "none" 
  },
  focus: { 
    borderColor: "var(--primary)",
    boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.1)",
    transition: { duration: 0.2 }
  },
  error: {
    borderColor: "var(--error)",
    x: [-2, 2, -2, 2, 0],
    transition: { duration: 0.4 }
  },
  success: {
    borderColor: "var(--success)",
    transition: { duration: 0.2 }
  },
};

// Modal/Dialog animations
export const modalVariants: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { 
      type: "spring", 
      damping: 25, 
      stiffness: 300 
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 }
  }
};

// Toast notification animations
export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.3,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

// Card hover animation (for interactive cards)
export const cardVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: "0 4px 6px -1px rgba(30, 58, 95, 0.1)",
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: "0 20px 25px -5px rgba(30, 58, 95, 0.15)",
    transition: { duration: 0.3 }
  },
};

// List item stagger animation
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  },
};

// Skeleton pulse animation
export const skeletonVariants: Variants = {
  pulse: {
    opacity: [0.5, 1, 0.5],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "easeInOut",
    },
  },
};

// Success celebration animation
export const celebrationVariants: Variants = {
  initial: { scale: 1, rotate: 0 },
  celebrate: {
    scale: [1, 1.2, 1],
    rotate: [0, 10, -10, 0],
    transition: { duration: 0.6 }
  },
};
```

**Create animation utilities**:

```typescript
// packages/ui/src/animations/utils.ts
import { Transition } from 'framer-motion';

// Common transition presets
export const transitions = {
  spring: {
    type: "spring",
    damping: 25,
    stiffness: 300,
  } as Transition,
  
  springBouncy: {
    type: "spring",
    damping: 15,
    stiffness: 400,
  } as Transition,
  
  ease: {
    duration: 0.3,
    ease: "easeOut",
  } as Transition,
  
  easeInOut: {
    duration: 0.3,
    ease: "easeInOut",
  } as Transition,
  
  fast: {
    duration: 0.15,
    ease: "easeOut",
  } as Transition,
  
  slow: {
    duration: 0.5,
    ease: "easeOut",
  } as Transition,
};

// Easing curves
export const easings = {
  easeOut: [0.16, 1, 0.3, 1],
  easeIn: [0.7, 0, 0.84, 0],
  easeInOut: [0.87, 0, 0.13, 1],
  anticipate: [0.68, -0.55, 0.265, 1.55],
};
```

**Export all animations**:

```typescript
// packages/ui/src/animations/index.ts
export * from './presets';
export * from './utils';
```

**Acceptance Criteria**:
- ✅ Animation presets for all interactive elements
- ✅ Consistent timing and easing
- ✅ Success/error states animated
- ✅ Modal/toast animations included
- ✅ List stagger animations
- ✅ Celebration animations for positive feedback

---

## Part 3: AI Integration Foundations (Days 5-7)

### Step 0.4: AI Component Patterns

**Create AI-specific components**:

```typescript
// packages/ui/src/components/ai/ai-input.tsx
'use client';

import * as React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '../input';
import { Button } from '../button';
import { cn } from '../../utils/cn';

interface AIInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => Promise<void>;
  placeholder?: string;
  isLoading?: boolean;
  suggestions?: string[];
  onSelectSuggestion?: (suggestion: string) => void;
}

export function AIInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask AI for help...",
  isLoading = false,
  suggestions = [],
  onSelectSuggestion,
}: AIInputProps) {
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      await onSubmit(value);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent-primary" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pl-10"
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            disabled={isLoading}
          />
        </div>
        <Button 
          type="submit" 
          disabled={!value.trim() || isLoading}
          variant="primary"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Ask'
          )}
        </Button>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden"
        >
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              onClick={() => onSelectSuggestion?.(suggestion)}
            >
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{suggestion}</span>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
```

```typescript
// packages/ui/src/components/ai/ai-assistant-bubble.tsx
'use client';

import * as React from 'react';
import { Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../button';
import { cn } from '../../utils/cn';

interface AIAssistantBubbleProps {
  message: string;
  onDismiss?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  }>;
  className?: string;
}

export function AIAssistantBubble({
  message,
  onDismiss,
  actions = [],
  className,
}: AIAssistantBubbleProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className={cn(
          "relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950",
          "border border-blue-200 dark:border-blue-800",
          "rounded-lg p-4 shadow-lg shadow-blue-500/10",
          className
        )}
      >
        {/* AI icon */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>

          <div className="flex-1">
            <p className="text-sm text-neutral-800 dark:text-neutral-200">
              {message}
            </p>

            {/* Actions */}
            {actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {actions.map((action, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={action.variant || 'ghost'}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Pulsing glow effect */}
        <motion.div
          className="absolute inset-0 rounded-lg bg-blue-400/20 blur-xl"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut",
          }}
          style={{ zIndex: -1 }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
```

```typescript
// packages/ui/src/components/ai/predictive-search.tsx
'use client';

import * as React from 'react';
import { Search, TrendingUp, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '../input';
import { Badge } from '../badge';
import { cn } from '../../utils/cn';

interface SearchResult {
  id: string;
  title: string;
  category: string;
  isRecent?: boolean;
  isTrending?: boolean;
}

interface PredictiveSearchProps {
  value: string;
  onChange: (value: string) => void;
  results: SearchResult[];
  onSelectResult: (result: SearchResult) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function PredictiveSearch({
  value,
  onChange,
  results,
  onSelectResult,
  placeholder = "Search...",
  isLoading = false,
}: PredictiveSearchProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      onSelectResult(results[selectedIndex]);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>

      {/* Results dropdown */}
      {isFocused && (value || results.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden max-h-80 overflow-y-auto"
        >
          {isLoading ? (
            <div className="px-4 py-8 text-center text-neutral-500">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-neutral-500">
              No results found
            </div>
          ) : (
            results.map((result, i) => (
              <motion.button
                key={result.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "w-full px-4 py-3 text-left flex items-center justify-between gap-2",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors",
                  selectedIndex === i && "bg-neutral-100 dark:bg-neutral-700"
                )}
                onClick={() => onSelectResult(result)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {result.title}
                    </span>
                    {result.isTrending && (
                      <TrendingUp className="h-3 w-3 text-orange-500" />
                    )}
                    {result.isRecent && (
                      <Clock className="h-3 w-3 text-blue-500" />
                    )}
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {result.category}
                  </span>
                </div>
              </motion.button>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
}
```

**Create AI hook patterns**:

```typescript
// packages/ui/src/hooks/use-ai-suggestions.ts
import { useState, useEffect } from 'react';
import { useDebounce } from './use-debounce';

interface UseSuggestions {
  query: string;
  fetchSuggestions: (query: string) => Promise<string[]>;
  debounceMs?: number;
}

export function useAISuggestions({
  query,
  fetchSuggestions,
  debounceMs = 300,
}: UseSuggestions) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    fetchSuggestions(debouncedQuery)
      .then(setSuggestions)
      .catch(() => setSuggestions([]))
      .finally(() => setIsLoading(false));
  }, [debouncedQuery, fetchSuggestions]);

  return { suggestions, isLoading };
}
```

**Export AI components**:

```typescript
// packages/ui/src/components/ai/index.ts
export * from './ai-input';
export * from './ai-assistant-bubble';
export * from './predictive-search';
```

**Acceptance Criteria**:
- ✅ AI input component with sparkle icon
- ✅ AI assistant bubble with gradient background
- ✅ Predictive search with keyboard navigation
- ✅ AI suggestions hook with debouncing
- ✅ Animated AI presence (pulsing glow)

---

## Part 4: Emotional Design Components (Days 8-9)

### Step 0.5: Success Celebrations & Friendly Errors

```typescript
// packages/ui/src/components/feedback/success-celebration.tsx
'use client';

import * as React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti-explosion';

interface SuccessCelebrationProps {
  message: string;
  show: boolean;
  onComplete?: () => void;
  withConfetti?: boolean;
}

export function SuccessCelebration({
  message,
  show,
  onComplete,
  withConfetti = false,
}: SuccessCelebrationProps) {
  React.useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 50 }}
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      {withConfetti && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Confetti 
            force={0.6}
            duration={2500}
            particleCount={50}
            width={1600}
          />
        </div>
      )}

      <motion.div
        initial={{ rotate: -10 }}
        animate={{ rotate: 0 }}
        transition={{ type: "spring", damping: 10, stiffness: 100 }}
        className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-8 max-w-md pointer-events-auto"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
            transition={{ 
              scale: { type: "spring", damping: 10, stiffness: 200 },
              rotate: { duration: 0.5, delay: 0.2 }
            }}
          >
            <CheckCircle2 className="h-16 w-16 text-success-500" />
          </motion.div>

          <div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Success!
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              {message}
            </p>
          </div>

          <motion.div
            animate={{
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="h-8 w-8 text-gold-500" />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
```

```typescript
// packages/ui/src/components/feedback/friendly-error.tsx
'use client';

import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../button';
import { Alert, AlertDescription, AlertTitle } from '../alert';

interface FriendlyErrorProps {
  error: Error | null;
  title?: string;
  onRetry?: () => void;
  suggestions?: string[];
}

const friendlyMessages: Record<string, { title: string; message: string; suggestions: string[] }> = {
  404: {
    title: "Oops! This page wandered off",
    message: "We can't find the page you're looking for. It might have been moved or deleted.",
    suggestions: [
      "Check the URL for typos",
      "Go back to the previous page",
      "Visit our homepage",
    ],
  },
  500: {
    title: "Something went wrong on our end",
    message: "We're on it! Our team has been notified and is working to fix the issue.",
    suggestions: [
      "Try refreshing the page",
      "Wait a few minutes and try again",
      "Contact support if the problem persists",
    ],
  },
  403: {
    title: "Access denied",
    message: "You don't have permission to view this content. If you think this is a mistake, please contact your administrator.",
    suggestions: [
      "Check if you're logged in",
      "Verify your account permissions",
      "Contact your administrator",
    ],
  },
  default: {
    title: "Hmm, something's not right",
    message: "We encountered an unexpected issue. Don't worry, it's not your fault!",
    suggestions: [
      "Try refreshing the page",
      "Check your internet connection",
      "Clear your browser cache",
    ],
  },
};

export function FriendlyError({
  error,
  title,
  onRetry,
  suggestions: customSuggestions,
}: FriendlyErrorProps) {
  if (!error) return null;

  // Determine error type
  const errorCode = error.message.match(/\d{3}/)? [0] || 'default';
  const errorInfo = friendlyMessages[errorCode] || friendlyMessages.default;
  
  const suggestions = customSuggestions || errorInfo.suggestions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto p-6"
    >
      <Alert variant="error">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="text-lg font-semibold">
          {title || errorInfo.title}
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-4">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            {errorInfo.message}
          </p>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                Here's what you can try:
              </p>
              <ul className="space-y-1">
                {suggestions.map((suggestion, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2"
                  >
                    <span className="text-primary">•</span>
                    {suggestion}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Retry button */}
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}

          {/* Error details (collapsed) */}
          <details className="mt-4">
            <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-700">
              Technical details
            </summary>
            <pre className="mt-2 text-xs bg-neutral-100 dark:bg-neutral-900 p-2 rounded overflow-x-auto">
              {error.message}
            </pre>
          </details>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
```

**Acceptance Criteria**:
- ✅ Success celebration with confetti
- ✅ Friendly error messages (not technical jargon)
- ✅ Contextual suggestions for errors
- ✅ Retry functionality
- ✅ Animated positive feedback

---

## Part 5: Theme System Implementation (Days 10-12)

### Step 0.6: Theme Provider & Dark Mode

```typescript
// packages/ui/src/components/theme-provider.tsx
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange={false}
      themes={['light', 'dark', 'lowLight']}  // Three modes!
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
```

```typescript
// packages/ui/src/components/theme-toggle.tsx
'use client';

import * as React from 'react';
import { Moon, Sun, Sunset } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />;  // Prevent hydration mismatch
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <motion.div
            initial={false}
            animate={{ rotate: theme === 'dark' || theme === 'lowLight' ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {theme === 'dark' || theme === 'lowLight' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </motion.div>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="h-4 w-4 mr-2" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="h-4 w-4 mr-2" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('lowLight')}>
          <Sunset className="h-4 w-4 mr-2" />
          Low Light
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Update Tailwind config to support themes**:

```typescript
// packages/ui/tailwind.config.ts (ADD TO YOUR EXISTING CONFIG)
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'], // Enable class-based dark mode
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Use CSS variables for theming
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        // ... add all theme colors
      },
    },
  },
  plugins: [],
};

export default config;
```

**Create CSS variables for themes**:

```css
/* packages/ui/src/styles.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 20 14.3% 4.1%;
    --card: 0 0% 100%;
    --card-foreground: 20 14.3% 4.1%;
    --primary: 221.2 83.2% 53.3%;  /* Navy 500 */
    --primary-foreground: 0 0% 100%;
    /* ... add all theme variables */
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 60 9.1% 97.8%;
    --card: 20 14.3% 4.1%;
    --card-foreground: 60 9.1% 97.8%;
    --primary: 217.2 91.2% 59.8%;  /* Navy 400 - adjusted for dark */
    --primary-foreground: 0 0% 3.9%;
    /* ... add all dark theme variables */
  }

  .lowLight {
    --background: 0 0% 10%;
    --foreground: 0 0% 90%;
    --card: 0 0% 15%;
    --card-foreground: 0 0% 90%;
    --primary: 221.2 83.2% 70%;  /* Softer blue */
    --primary-foreground: 0 0% 10%;
    /* ... add all low-light theme variables */
  }
}
```

**Acceptance Criteria**:
- ✅ Theme provider with 3 modes (light/dark/lowLight)
- ✅ Theme toggle component
- ✅ CSS variables for all theme colors
- ✅ Smooth transitions between themes
- ✅ No hydration mismatch

---

## Part 6: Update Existing Components (Days 13-14)

### Step 0.7: Apply Enhancements to Button

**Replace your existing Button component with enhanced version**:

```typescript
// packages/ui/src/components/button.tsx (REPLACE)
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { buttonVariants as animations } from '../animations/presets';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-navy-500 text-white hover:bg-navy-600 active:bg-navy-700 shadow-sm',
        secondary: 'bg-sage-500 text-white hover:bg-sage-600 active:bg-sage-700 shadow-sm',
        outline: 'border-2 border-navy-500 text-navy-500 hover:bg-navy-50 dark:border-navy-400 dark:text-navy-400 dark:hover:bg-navy-950',
        ghost: 'hover:bg-neutral-100 active:bg-neutral-200 dark:hover:bg-neutral-800 dark:active:bg-neutral-700',
        link: 'text-navy-500 underline-offset-4 hover:underline dark:text-navy-400',
        soft: 'bg-navy-100 text-navy-700 hover:bg-navy-200 dark:bg-navy-900 dark:text-navy-300 dark:hover:bg-navy-800',  // NEW
        gradient: 'bg-gradient-to-r from-navy-600 to-sage-600 text-white hover:from-navy-700 hover:to-sage-700',  // NEW
        destructive: 'bg-error-500 text-white hover:bg-error-600 shadow-sm',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-11 px-8 text-lg',
        icon: 'h-10 w-10',
      },
      // NEW: Emphasis dimension
      emphasis: {
        low: 'shadow-none',
        medium: 'shadow-sm',
        high: 'shadow-md hover:shadow-lg',
        premium: 'shadow-lg hover:shadow-xl ring-2 ring-offset-2 ring-gold-400',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      emphasis: 'medium',
    },
  }
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    emphasis,
    asChild = false, 
    isLoading = false,
    loadingText,
    disabled,
    children,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : motion.button;
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, emphasis, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        variants={animations}
        initial="idle"
        whileHover={!disabled && !isLoading ? "hover" : undefined}
        whileTap={!disabled && !isLoading ? "tap" : undefined}
        animate={isLoading ? "loading" : "idle"}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {loadingText || 'Loading...'}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

**Acceptance Criteria**:
- ✅ Enhanced button with micro-interactions
- ✅ Loading state with spinner
- ✅ New variants (soft, gradient)
- ✅ Emphasis dimension (low/medium/high/premium)
- ✅ Animations (hover, tap, loading)
- ✅ Theme-aware colors

---

## Integration Instructions

### How to Integrate with Your Existing Plan

**Option 1: Run Phase 0 First** (Recommended)
1. Complete Phase 0 (Days 1-14) before starting your existing Phase 1
2. Your existing Phase 1-6 components will automatically inherit all 2025 enhancements
3. Total timeline: 14 weeks (2 weeks Phase 0 + 12 weeks existing plan)

**Option 2: Parallel Execution**
1. Start your Phase 1 as planned
2. Run Phase 0 in parallel (different team member or time slots)
3. Merge Phase 0 enhancements when complete (Day 14)
4. Refactor 20 components to use new patterns (adds 2-3 days)
5. Total timeline: ~13 weeks (some overlap)

**Option 3: Incremental Integration**
1. Start Phase 1 as planned
2. Apply Phase 0 enhancements as you create each component
3. Slower but no refactoring needed
4. Total timeline: 14-15 weeks (slightly slower but cleaner)

### Modified Export Structure

```typescript
// packages/ui/src/index.ts (ENHANCED)
// Design tokens
export * from './tokens';
export * from './animations';  // NEW

// Components
export * from './components/button';  // Enhanced
export * from './components/input';
// ... all 20 existing components

// NEW: AI Components
export * from './components/ai';

// NEW: Feedback Components
export * from './components/feedback/success-celebration';
export * from './components/feedback/friendly-error';

// Theme
export * from './components/theme-provider';  // NEW
export * from './components/theme-toggle';    // NEW

// Utilities
export * from './utils/cn';
```

---

## Success Metrics

### Before Phase 0:
- Color system: Single shades (2022 standard)
- Border radius: 4px (conservative)
- Micro-interactions: 1 (button tap only)
- Animations: Basic (whileTap)
- Dark mode: None
- AI patterns: None
- Emotional design: None

### After Phase 0:
- Color system: 9-shade scales (2025 standard)
- Border radius: 8px modern default
- Micro-interactions: 20+ (all components animated)
- Animations: Comprehensive (Framer Motion presets)
- Dark mode: 3 themes (light/dark/lowLight)
- AI patterns: 3 components + hooks
- Emotional design: Success celebrations, friendly errors

### Cost/Benefit:
- **Time Investment**: 2 weeks (14 days)
- **Long-term Savings**: Prevents refactoring 20+ components later (saves 3-4 weeks)
- **Design Gap Closed**: Moves from 2022 → 2025 standards (3-year leap)
- **User Experience**: Dramatically improved (animations, theming, AI)
- **Developer Experience**: Better patterns from day 1

---

## Deliverables Checklist

Phase 0 is complete when:
- ✅ Enhanced design tokens (colors, typography, spacing, shadows)
- ✅ Framer Motion animation presets
- ✅ AI component patterns (3 components + hooks)
- ✅ Emotional design components (celebrations, friendly errors)
- ✅ Theme system (light/dark/lowLight)
- ✅ Enhanced Button component (reference implementation)
- ✅ All tokens exported and documented
- ✅ Storybook stories for new patterns
- ✅ Zero TypeScript errors
- ✅ Theme toggle working in Storybook

---

## Next Steps

After completing Phase 0:
1. **Proceed to your existing Phase 1** - but now all 20 components will use 2025 patterns
2. **Apply patterns consistently** - use enhanced Button as template
3. **Test theming** - verify all components work in light/dark/lowLight modes
4. **Document patterns** - create examples in Storybook
5. **Continue to Phase 2-6** - existing plan unchanged

**Critical**: Don't skip Phase 0. Building on 2022 patterns and refactoring later is 3-4x more expensive than getting it right from the start.

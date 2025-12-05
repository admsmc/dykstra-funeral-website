# Frontend Architecture Modernization: Enterprise-Grade Implementation Plan
**Project**: Dykstra Funeral Home ERP System
**Timeline**: 12 weeks (6 phases)
**Goal**: Transform ad-hoc frontend into enterprise-grade architecture matching backend excellence
## Overview
This plan systematically adds a Presentation Layer to bridge the gap between our robust backend (Clean Architecture, Effect-TS, tRPC) and the user interface. Each phase builds on the previous, allowing incremental delivery while maintaining system stability.
## Phase 1: Foundation & Design System (Weeks 1-2)
**Goal**: Establish design system infrastructure and primitive UI components.
**Risk**: Low | **Dependency**: None | **Validation**: Storybook running with 20 components
### Step 1.1: Create UI Package (Day 1)
Set up monorepo package for shared UI components.
**Tasks**:
1. Create package directory structure:
```warp-runnable-command
packages/ui/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # Public API
│   ├── tokens.ts         # Design tokens
│   ├── components/       # Component library
│   └── utils/            # Component utilities
└── .storybook/           # Storybook config
```
2. Install dependencies:
```warp-runnable-command
pnpm add -D @storybook/react @storybook/react-vite storybook vite
pnpm add @radix-ui/react-slot @radix-ui/react-separator
pnpm add class-variance-authority clsx tailwind-merge
pnpm add lucide-react  # Icon library
```
3. Configure package.json:
    * Name: `@dykstra/ui`
    * Exports: `./tokens`, `./components/*`
    * Scripts: `storybook`, `build-storybook`, `build`
4. Set up TypeScript:
    * Extend root `tsconfig.json`
    * Enable `jsx: "react-jsx"`
    * Add path aliases for internal imports
**Acceptance Criteria**:
* ✅ `pnpm --filter @dykstra/ui build` succeeds
* ✅ Package importable from main app: `import { Button } from '@dykstra/ui'`
* ✅ No TypeScript errors
### Step 1.2: Define Design Tokens (Day 1-2)
Extract existing CSS variables into structured token system.
**Tasks**:
1. Create `packages/ui/src/tokens.ts`:
```typescript
export const tokens = {
  colors: {
    primary: {
      DEFAULT: '#1e3a5f',  // Navy
      hover: '#152a45',
      active: '#0f1e30',
      light: '#2d4a6f',
      contrast: '#ffffff',
    },
    secondary: {
      DEFAULT: '#8b9d83',  // Sage
      hover: '#7a8c73',
      active: '#69755f',
      light: '#a3b59a',
      contrast: '#ffffff',
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
    cream: '#f5f3ed',
    gold: '#b8956a',
    charcoal: '#2c3539',
    success: { DEFAULT: '#10b981', light: '#d1fae5', dark: '#065f46' },
    warning: { DEFAULT: '#f59e0b', light: '#fef3c7', dark: '#92400e' },
    error: { DEFAULT: '#ef4444', light: '#fee2e2', dark: '#991b1b' },
    info: { DEFAULT: '#3b82f6', light: '#dbeafe', dark: '#1e40af' },
  },
  spacing: {
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
  },
  typography: {
    fonts: {
      serif: 'var(--font-playfair)',
      sans: 'var(--font-inter)',
      mono: 'ui-monospace, monospace',
    },
    sizes: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  radii: {
    none: '0',
    sm: '0.125rem',   // 2px
    DEFAULT: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
};
```
2. Create utility functions:
```typescript
// packages/ui/src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
3. Update Tailwind config to use tokens:
    * Extend theme with token values
    * Ensure consistency between Tailwind and component styles
**Acceptance Criteria**:
* ✅ Tokens file exports all design values
* ✅ Tokens match existing CSS variables
* ✅ `cn()` utility function works correctly
* ✅ No breaking changes to existing styles
### Step 1.3: Install & Configure Storybook (Day 2)
Set up component development environment.
**Tasks**:
1. Initialize Storybook:
```warp-runnable-command
cd packages/ui
pnpm dlx storybook@latest init --type react-vite
```
2. Configure `.storybook/main.ts`:
```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',  // Accessibility testing
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};
export default config;
```
3. Configure `.storybook/preview.ts`:
```typescript
import type { Preview } from '@storybook/react';
import '../src/styles.css';  // Import Tailwind

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};
export default preview;
```
4. Add npm scripts to `packages/ui/package.json`:
```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```
**Acceptance Criteria**:
* ✅ `pnpm --filter @dykstra/ui storybook` starts dev server
* ✅ Storybook accessible at `http://localhost:6006`
* ✅ Tailwind styles working in Storybook
* ✅ A11y addon enabled
### Step 1.4: Create Primitive Components (Days 3-8)
Build 20 foundational UI components using Radix UI.
**Component List** (Priority Order):
1. **Button** - Primary interaction element
2. **Input** - Text input fields
3. **Label** - Form labels
4. **Card** - Content container
5. **Badge** - Status indicators
6. **Alert** - Notifications
7. **Separator** - Visual divider
8. **Skeleton** - Loading placeholder
9. **Spinner** - Loading indicator
10. **Select** - Dropdown selection (Radix)
11. **Checkbox** - Boolean input (Radix)
12. **Radio** - Single choice (Radix)
13. **Switch** - Toggle (Radix)
14. **Dialog** - Modal overlay (Radix)
15. **Dropdown Menu** - Context menu (Radix)
16. **Tooltip** - Hover information (Radix)
17. **Tabs** - Tabbed interface (Radix)
18. **Accordion** - Collapsible sections (Radix)
19. **Popover** - Floating content (Radix)
20. **Toast** - Temporary notification (Radix)
**Implementation Pattern** (Example: Button):
```typescript
// packages/ui/src/components/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-contrast hover:bg-primary-hover active:bg-primary-active',
        secondary: 'bg-secondary text-secondary-contrast hover:bg-secondary-hover active:bg-secondary-active',
        outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-primary-contrast',
        ghost: 'hover:bg-neutral-100 active:bg-neutral-200',
        link: 'text-primary underline-offset-4 hover:underline',
        destructive: 'bg-error text-white hover:bg-error-dark',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-11 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
export { Button, buttonVariants };
```
**Story Pattern** (Example: Button):
```typescript
// packages/ui/src/components/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'link', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
    },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;
export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
  },
};
export const Secondary: Story = {
  args: {
    children: 'Button',
    variant: 'secondary',
  },
};
export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};
export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};
```
**Daily Targets**:
* Day 3: Button, Input, Label, Card (4 components)
* Day 4: Badge, Alert, Separator, Skeleton (4 components)
* Day 5: Spinner, Select, Checkbox, Radio (4 components)
* Day 6: Switch, Dialog, Dropdown Menu, Tooltip (4 components)
* Day 7: Tabs, Accordion, Popover, Toast (4 components)
* Day 8: Documentation, cleanup, exports
**Acceptance Criteria**:
* ✅ All 20 components implemented
* ✅ Each component has Storybook story
* ✅ Each component follows CVA pattern for variants
* ✅ Accessibility: keyboard navigation, ARIA labels, focus management
* ✅ TypeScript: full type coverage, exported types
* ✅ Responsive: works on mobile/tablet/desktop
* ✅ All stories render without errors
### Step 1.5: Form Components (Days 9-10)
Create form wrapper components integrating React Hook Form.
**Tasks**:
1. Install React Hook Form:
```warp-runnable-command
pnpm add react-hook-form @hookform/resolvers
```
2. Create form components:
    * `Form` - Context provider for form state
    * `FormField` - Connects field to form state
    * `FormItem` - Layout wrapper for field
    * `FormLabel` - Accessible label
    * `FormControl` - Input wrapper
    * `FormDescription` - Help text
    * `FormMessage` - Error message
3. Implementation:
```typescript
// packages/ui/src/components/form.tsx
import * as React from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from 'react-hook-form';
import { cn } from '../utils/cn';

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();
  
  const fieldState = getFieldState(fieldContext.name, formState);
  
  if (!fieldContext) {
    throw new Error('useFormField must be used within <FormField>');
  }
  
  const { id } = itemContext;
  
  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

// ... FormItem, FormLabel, FormControl, FormDescription, FormMessage

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
};
```
4. Create example form story:
```typescript
// packages/ui/src/components/form.stories.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from './form';
import { Input } from './input';
import { Button } from './button';

const formSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
});

export const BasicForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
    },
  });
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};
```
**Acceptance Criteria**:
* ✅ Form components fully typed
* ✅ Integration with React Hook Form complete
* ✅ Validation errors display correctly
* ✅ Accessible: proper ARIA attributes
* ✅ Example forms in Storybook
### Step 1.6: Error Boundary Components (Day 10)
Create error handling UI components.
**Tasks**:
1. Create `ErrorBoundary` component:
```typescript
// packages/ui/src/components/error-boundary.tsx
import * as React from 'react';
import { Alert } from './alert';
import { Button } from './button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  
  reset = () => {
    this.setState({ hasError: false, error: null });
  };
  
  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      
      return (
        <div className="p-4">
          <Alert variant="destructive">
            <h3 className="font-semibold">Something went wrong</h3>
            <p className="mt-2 text-sm">{this.state.error.message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={this.reset}
              className="mt-4"
            >
              Try again
            </Button>
          </Alert>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```
2. Create `ErrorDisplay` component for typed errors:
```typescript
// packages/ui/src/components/error-display.tsx
import { Alert } from './alert';

interface ErrorDisplayProps {
  error: Error | null;
  title?: string;
  retry?: () => void;
}

export function ErrorDisplay({ error, title = 'Error', retry }: ErrorDisplayProps) {
  if (!error) return null;
  
  return (
    <Alert variant="destructive">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm">{error.message}</p>
      {retry && (
        <Button variant="outline" size="sm" onClick={retry} className="mt-4">
          Retry
        </Button>
      )}
    </Alert>
  );
}
```
3. Create loading state components:
```typescript
// packages/ui/src/components/loading-skeleton.tsx
import { Skeleton } from './skeleton';

export function CardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
```
**Acceptance Criteria**:
* ✅ ErrorBoundary catches React errors
* ✅ Custom fallback UI supported
* ✅ ErrorDisplay shows typed errors
* ✅ Loading skeletons for common layouts
* ✅ Stories demonstrating error states
### Step 1.7: Package Build & Export (Day 10)
Configure package for consumption by main app.
**Tasks**:
1. Configure exports in `packages/ui/package.json`:
```json
{
  "name": "@dykstra/ui",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./tokens": {
      "import": "./dist/tokens.js",
      "types": "./dist/tokens.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc && vite build",
    "dev": "vite build --watch",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```
2. Create public API in `packages/ui/src/index.ts`:
```typescript
// Design tokens
export * from './tokens';

// Components
export * from './components/button';
export * from './components/input';
export * from './components/label';
export * from './components/card';
export * from './components/badge';
export * from './components/alert';
// ... export all 20 components

// Form components
export * from './components/form';

// Error handling
export * from './components/error-boundary';
export * from './components/error-display';
export * from './components/loading-skeleton';

// Utilities
export * from './utils/cn';
```
3. Set up build tooling (Vite):
```typescript
// packages/ui/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DykstraUI',
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
```
4. Add to main app dependencies:
```json
// apps/web/package.json
{
  "dependencies": {
    "@dykstra/ui": "workspace:*"
  }
}
```
**Acceptance Criteria**:
* ✅ `pnpm --filter @dykstra/ui build` produces dist files
* ✅ Components importable in main app
* ✅ TypeScript types available
* ✅ No circular dependencies
* ✅ Tree-shaking works (only imported components bundled)
### Phase 1 Deliverables Checklist
* ✅ `@dykstra/ui` package created and building
* ✅ Design tokens defined (colors, spacing, typography, etc.)
* ✅ Storybook running at `localhost:6006`
* ✅ 20 primitive components implemented with stories
* ✅ Form components with React Hook Form integration
* ✅ Error boundary and loading state components
* ✅ Package exportable and consumable by main app
* ✅ All components accessible (WCAG 2.1 AA)
* ✅ All components responsive (mobile-first)
* ✅ Zero TypeScript errors
### Phase 1 Validation
**Manual Testing**:
1. Run Storybook: `pnpm --filter @dykstra/ui storybook`
2. Verify all 20 components render correctly
3. Test keyboard navigation on all interactive components
4. Test responsive behavior (resize browser)
5. Verify accessibility with Storybook a11y addon
**Integration Testing**:
1. Import Button in main app:
```typescript
import { Button } from '@dykstra/ui';
export default function TestPage() {
  return <Button>Test</Button>;
}
```
2. Verify it renders with correct styles
3. Verify design tokens work
**Documentation**:
* Create `packages/ui/README.md` with usage examples
* Document all component props in Storybook
* Add contribution guidelines
## Phase 2: Presentation Layer Architecture (Weeks 3-4)
**Goal**: Establish feature module pattern with ViewModels and custom hooks.
**Risk**: Medium | **Dependency**: Phase 1 | **Validation**: 3 feature modules working
### Step 2.1: Create Feature Module Structure (Day 11)
Set up directory structure for feature-based organization.
**Tasks**:
1. Create feature directories:
```warp-runnable-command
src/features/
├── templates/           # Pilot feature
│   ├── components/      # Feature-specific components
│   ├── hooks/           # Custom hooks
│   ├── view-models/     # Data transformation
│   ├── types.ts         # Feature types
│   └── index.ts         # Public API
├── analytics/
├── cases/
└── ... (other features)
```
2. Create shared hooks directory:
```warp-runnable-command
src/lib/hooks/
├── use-debounce.ts
├── use-media-query.ts
├── use-local-storage.ts
└── use-pagination.ts
```
3. Create shared utilities:
```warp-runnable-command
src/lib/utils/
├── formatters.ts        # Date, currency, etc.
├── validators.ts        # Input validation
└── date-helpers.ts      # Date manipulation
```
**Acceptance Criteria**:
* ✅ Directory structure created
* ✅ README.md in each feature explaining purpose
* ✅ TypeScript path aliases configured
### Step 2.2: Implement ViewModel Pattern (Days 12-13)
Create ViewModels for data transformation and presentation logic.
**Tasks**:
1. Create base ViewModel class (optional, for shared behavior):
```typescript
// src/lib/view-models/base-view-model.ts
export abstract class BaseViewModel<T> {
  constructor(protected data: T) {}
  
  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
  
  protected formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('en-US').format(new Date(date));
  }
  
  protected formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}
```
2. Create ViewModel for Template Analytics (example):
```typescript
// src/features/templates/view-models/template-analytics-vm.ts
import { BaseViewModel } from '@/lib/view-models/base-view-model';
import type { TemplateAnalyticsData } from '@dykstra/api';

export class TemplateAnalyticsViewModel extends BaseViewModel<TemplateAnalyticsData> {
  get totalGenerations(): string {
    return this.data.totalGenerations.toLocaleString();
  }
  
  get successRate(): string {
    return this.formatPercent(this.data.successRate);
  }
  
  get avgDuration(): string {
    const ms = this.data.avgDurationMs;
    return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(1)}s`;
  }
  
  get topTemplates() {
    return this.data.mostUsed.slice(0, 5).map(t => ({
      ...t,
      usageCount: t.count.toLocaleString(),
      successRate: this.formatPercent(t.successRate),
    }));
  }
  
  get hasErrors(): boolean {
    return this.data.errorCount > 0;
  }
  
  get errorRate(): string {
    const rate = (this.data.errorCount / this.data.totalGenerations) * 100;
    return this.formatPercent(rate);
  }
  
  get statusVariant(): 'success' | 'warning' | 'error' {
    if (this.data.successRate >= 95) return 'success';
    if (this.data.successRate >= 85) return 'warning';
    return 'error';
  }
}
```
3. Create ViewModels for 10 key features:
    * Template Analytics
    * Template List
    * Case Summary
    * Financial Summary
    * Payroll Summary
    * Inventory Summary
    * Staff Schedule
    * Service Coverage
    * Approval Workflow
    * Batch Jobs
**Acceptance Criteria**:
* ✅ ViewModels transform raw data to display format
* ✅ ViewModels handle null/undefined gracefully
* ✅ ViewModels provide computed properties
* ✅ ViewModels fully typed
* ✅ Unit tests for ViewModels (Jest/Vitest)
### Step 2.3: Create Custom Hooks (Days 14-16)
Extract tRPC logic into reusable hooks.
**Pattern** (Example: useTemplateAnalytics):
```typescript
// src/features/templates/hooks/use-template-analytics.ts
import { trpc } from '@/lib/trpc';
import { TemplateAnalyticsViewModel } from '../view-models/template-analytics-vm';
import { useMemo } from 'react';
export interface AnalyticsFilters {
  dateRange: 'day' | 'week' | 'month' | 'year';
  category?: string;
}
export function useTemplateAnalytics(filters: AnalyticsFilters) {
  const dateFilter = useMemo(() => {
    const now = new Date();
    const ranges = {
      day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    };
    return { startDate: ranges[filters.dateRange], endDate: now };
  }, [filters.dateRange]);
  
  const query = trpc.templateAnalytics.getOverallStats.useQuery({
    ...dateFilter,
    category: filters.category === 'all' ? undefined : filters.category,
  });
  
  const viewModel = useMemo(
    () => query.data ? new TemplateAnalyticsViewModel(query.data) : null,
    [query.data]
  );
  
  return {
    viewModel,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```
**Create hooks for**:
1. **Data Fetching**:
    * `useTemplateAnalytics`
    * `useTemplateList`
    * `useCaseList`
    * `useFinancialSummary`
    * `usePayrollSummary`
    * `useInventoryList`
    * `useStaffSchedule`
    * `useApprovalWorkflows`
    * `useBatchJobs`
2. **Mutations**:
    * `useCreateTemplate`
    * `useUpdateTemplate`
    * `useDeleteTemplate`
    * `useApproveWorkflow`
    * `useCreateCase`
3. **Generic Utilities**:
```typescript
// src/lib/hooks/use-debounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

// src/lib/hooks/use-pagination.ts
export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  
  const totalPages = Math.ceil(items.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentItems = items.slice(startIndex, endIndex);
  
  return {
    currentItems,
    page,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
    nextPage: () => setPage(p => Math.min(p + 1, totalPages)),
    previousPage: () => setPage(p => Math.max(p - 1, 1)),
    goToPage: (p: number) => setPage(Math.max(1, Math.min(p, totalPages))),
  };
}

// src/lib/hooks/use-local-storage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  return [storedValue, setValue] as const;
}
```
**Acceptance Criteria**:
* ✅ All major tRPC queries wrapped in hooks
* ✅ Hooks return ViewModels (not raw data)
* ✅ Hooks handle loading/error states
* ✅ Generic hooks created and documented
* ✅ Hooks follow naming convention (use*)
### Step 2.4: Refactor Pilot Feature (Days 17-20)
Refactor Template Analytics page as pilot implementation.
**Before** (Current):
```warp-runnable-command
app/staff/template-analytics/page.tsx (323 lines)
```
**After** (Target):
```warp-runnable-command
app/staff/template-analytics/page.tsx (30 lines)
features/templates/
├── components/
│   ├── AnalyticsDashboard.tsx (80 lines)
│   ├── AnalyticsFilters.tsx (60 lines)
│   ├── StatsGrid.tsx (40 lines)
│   ├── TrendChart.tsx (80 lines)
│   └── RecentErrors.tsx (50 lines)
├── hooks/
│   └── use-template-analytics.ts (40 lines)
├── view-models/
│   └── template-analytics-vm.ts (60 lines)
└── index.ts (10 lines)
```
**Implementation Steps**:
1. **Create page wrapper** (thin route):
```typescript
// app/staff/template-analytics/page.tsx
import { AnalyticsDashboard } from '@/features/templates';

export default function TemplateAnalyticsPage() {
  return <AnalyticsDashboard />;
}
```
2. **Create dashboard component**:
```typescript
// features/templates/components/AnalyticsDashboard.tsx
'use client';

import { useState } from 'react';
import { useTemplateAnalytics } from '../hooks/use-template-analytics';
import { AnalyticsFilters } from './AnalyticsFilters';
import { StatsGrid } from './StatsGrid';
import { TrendChart } from './TrendChart';
import { RecentErrors } from './RecentErrors';
import { Card, Skeleton, ErrorDisplay } from '@dykstra/ui';
import type { AnalyticsFilters as Filters } from '../hooks/use-template-analytics';

export function AnalyticsDashboard() {
  const [filters, setFilters] = useState<Filters>({
    dateRange: 'month',
    category: 'all',
  });
  
  const { viewModel, isLoading, error, refetch } = useTemplateAnalytics(filters);
  
  if (error) {
    return <ErrorDisplay error={error} title="Failed to load analytics" retry={refetch} />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Template Analytics</h1>
        <AnalyticsFilters value={filters} onChange={setFilters} />
      </div>
      
      {isLoading || !viewModel ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <StatsGrid stats={viewModel} />
          <TrendChart data={viewModel.topTemplates} />
          {viewModel.hasErrors && <RecentErrors />}
        </>
      )}
    </div>
  );
}
```
3. **Create sub-components**:
```typescript
// features/templates/components/StatsGrid.tsx
import { Card, Badge } from '@dykstra/ui';
import { TemplateAnalyticsViewModel } from '../view-models/template-analytics-vm';

interface StatsGridProps {
  stats: TemplateAnalyticsViewModel;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="p-6">
        <p className="text-sm text-neutral-600 mb-1">Total Generations</p>
        <p className="text-3xl font-bold text-primary">
          {stats.totalGenerations}
        </p>
      </Card>
      
      <Card className="p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-neutral-600">Success Rate</p>
          <Badge variant={stats.statusVariant}>{stats.statusVariant}</Badge>
        </div>
        <p className="text-3xl font-bold text-success">
          {stats.successRate}
        </p>
      </Card>
      
      <Card className="p-6">
        <p className="text-sm text-neutral-600 mb-1">Avg Duration</p>
        <p className="text-3xl font-bold text-info">
          {stats.avgDuration}
        </p>
      </Card>
      
      <Card className="p-6">
        <p className="text-sm text-neutral-600 mb-1">Error Rate</p>
        <p className="text-3xl font-bold text-error">
          {stats.errorRate}
        </p>
      </Card>
    </div>
  );
}
```
4. **Create filter component**:
```typescript
// features/templates/components/AnalyticsFilters.tsx
import { Select, SelectTrigger, SelectContent, SelectItem } from '@dykstra/ui';
import type { AnalyticsFilters } from '../hooks/use-template-analytics';

interface AnalyticsFiltersProps {
  value: AnalyticsFilters;
  onChange: (filters: AnalyticsFilters) => void;
}

export function AnalyticsFilters({ value, onChange }: AnalyticsFiltersProps) {
  return (
    <div className="flex gap-4">
      <Select
        value={value.dateRange}
        onValueChange={(dateRange) => onChange({ ...value, dateRange })}
      >
        <SelectTrigger className="w-40">
          {value.dateRange}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Last 24 Hours</SelectItem>
          <SelectItem value="week">Last 7 Days</SelectItem>
          <SelectItem value="month">Last 30 Days</SelectItem>
          <SelectItem value="year">Last Year</SelectItem>
        </SelectContent>
      </Select>
      
      <Select
        value={value.category || 'all'}
        onValueChange={(category) => onChange({ ...value, category })}
      >
        <SelectTrigger className="w-40">
          {value.category || 'All Categories'}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="funeral-program">Funeral Programs</SelectItem>
          <SelectItem value="obituary">Obituaries</SelectItem>
          <SelectItem value="memorial-card">Memorial Cards</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```
5. **Export public API**:
```typescript
// features/templates/index.ts
export { AnalyticsDashboard } from './components/AnalyticsDashboard';
export { useTemplateAnalytics } from './hooks/use-template-analytics';
export { TemplateAnalyticsViewModel } from './view-models/template-analytics-vm';
export type { AnalyticsFilters } from './hooks/use-template-analytics';
```
**Acceptance Criteria**:
* ✅ Page reduced from 323 → 30 lines
* ✅ Logic extracted to hooks (testable)
* ✅ Data transformation in ViewModel
* ✅ Components use design system
* ✅ Loading states use skeletons
* ✅ Error states use ErrorDisplay
* ✅ Filters work correctly
* ✅ No regression in functionality
### Phase 2 Deliverables Checklist
* ✅ Feature module structure established
* ✅ ViewModel pattern implemented for 10 features
* ✅ Custom hooks for all major queries/mutations
* ✅ Generic utility hooks created
* ✅ Pilot feature (Template Analytics) refactored
* ✅ Page size reduced by 60%+
* ✅ All features fully typed
* ✅ Documentation in feature READMEs
### Phase 2 Validation
**Functional Testing**:
1. Template Analytics page works identically to before
2. Filters update data correctly
3. Loading states display properly
4. Error handling works (test by breaking API)
5. No TypeScript errors
**Code Quality**:
1. Run ESLint: no new warnings
2. Check bundle size: should be similar or smaller
3. Verify tree-shaking works (unused code not bundled)
**Documentation**:
* Create `docs/FEATURE_MODULE_GUIDE.md` with:
    * Directory structure explanation
    * ViewModel pattern usage
    * Custom hooks pattern
    * Migration examples
## Phase 3: Component Refactoring (Weeks 5-6)
**Goal**: Refactor 10 key pages using new patterns.
**Risk**: Medium | **Dependency**: Phase 2 | **Validation**: 10 pages refactored, tests passing
### Step 3.1: Create Layout Components (Days 21-22)
Build reusable layout components for consistent page structure.
**Tasks**:
1. **DashboardLayout**:
```typescript
// src/components/layouts/DashboardLayout.tsx
import { ReactNode } from 'react';
import { Separator } from '@dykstra/ui';

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({
  title,
  subtitle,
  actions,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-neutral-600">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
        <Separator className="mb-6" />
        {children}
      </div>
    </div>
  );
}
```
2. **PageSection**:
```typescript
// src/components/layouts/PageSection.tsx
import { ReactNode } from 'react';
import { Card } from '@dykstra/ui';

interface PageSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function PageSection({
  title,
  description,
  children,
  className,
}: PageSectionProps) {
  return (
    <section className={className}>
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-neutral-600">{description}</p>
          )}
        </div>
      )}
      <Card className="p-6">{children}</Card>
    </section>
  );
}
```
3. **EmptyState**:
```typescript
// src/components/layouts/EmptyState.tsx
import { ReactNode } from 'react';
import { Button } from '@dykstra/ui';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-neutral-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-neutral-600 max-w-sm">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-6">
          {action.label}
        </Button>
      )}
    </div>
  );
}
```
**Acceptance Criteria**:
* ✅ Layout components created
* ✅ Responsive design (mobile/tablet/desktop)
* ✅ Consistent spacing and styling
* ✅ Storybook stories for layouts
### Step 3.2: Refactor Priority Pages (Days 23-30)
Systematically refactor 10 high-traffic pages.
**Target Pages** (Priority Order):
1. Template Analytics (already done in Phase 2)
2. Template Workflows
3. Template Library
4. Template Editor
5. Template Approvals
6. Customize Template (family-facing)
7. Case Dashboard (placeholder)
8. Financial Summary (placeholder)
9. Payroll Summary (placeholder)
10. Staff Schedule (placeholder)
**Refactoring Process** (Apply to each page):
**Day 23-24: Template Workflows**
1. Analyze current implementation:
    * Identify data fetching logic
    * Extract business logic
    * List UI components needed
2. Create feature module:
```warp-runnable-command
features/workflows/
├── components/
│   ├── WorkflowsDashboard.tsx
│   ├── WorkflowList.tsx
│   ├── WorkflowCard.tsx
│   ├── WorkflowStages.tsx
│   └── CreateWorkflowDialog.tsx
├── hooks/
│   ├── use-workflows.ts
│   └── use-create-workflow.ts
├── view-models/
│   └── workflow-vm.ts
└── index.ts
```
3. Implement ViewModel:
```typescript
// features/workflows/view-models/workflow-vm.ts
export class WorkflowViewModel {
  constructor(private workflow: Workflow) {}
  
  get name() { return this.workflow.name; }
  get stageCount() { return this.workflow.stages.length; }
  get status() { return this.workflow.isActive ? 'Active' : 'Inactive'; }
  get statusVariant() {
    return this.workflow.isActive ? 'success' : 'secondary';
  }
  
  get stages() {
    return this.workflow.stages.map((stage, i) => ({
      ...stage,
      stepNumber: i + 1,
      approverNames: stage.approvers.map(a => a.name).join(', '),
    }));
  }
}
```
4. Create custom hook:
```typescript
// features/workflows/hooks/use-workflows.ts
export function useWorkflows() {
  const query = trpc.templateApproval.listWorkflows.useQuery();
  
  const viewModels = useMemo(
    () => query.data?.map(w => new WorkflowViewModel(w)) ?? [],
    [query.data]
  );
  
  return {
    workflows: viewModels,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```
5. Build components:
```typescript
// features/workflows/components/WorkflowsDashboard.tsx
export function WorkflowsDashboard() {
  const { workflows, isLoading, error } = useWorkflows();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  return (
    <DashboardLayout
      title="Approval Workflows"
      subtitle="Manage multi-stage approval processes"
      actions={
        <Button onClick={() => setIsCreateOpen(true)}>
          Create Workflow
        </Button>
      }
    >
      {isLoading && <Skeleton className="h-96" />}
      {error && <ErrorDisplay error={error} />}
      {workflows.length === 0 && (
        <EmptyState
          title="No workflows yet"
          description="Create your first approval workflow"
          action={{
            label: 'Create Workflow',
            onClick: () => setIsCreateOpen(true),
          }}
        />
      )}
      {workflows.length > 0 && <WorkflowList workflows={workflows} />}
      <CreateWorkflowDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </DashboardLayout>
  );
}
```
6. Update page file:
```typescript
// app/staff/template-workflows/page.tsx
import { WorkflowsDashboard } from '@/features/workflows';

export default function TemplateWorkflowsPage() {
  return <WorkflowsDashboard />;
}
```
**Days 25-26: Template Library**
**Days 27-28: Template Editor**
**Days 29-30: Template Approvals & Customize Template**
Repeat the same process for each page.
**Acceptance Criteria** (Per Page):
* ✅ Page file reduced to <50 lines
* ✅ Feature module created with hooks/VMs/components
* ✅ Uses design system components
* ✅ Loading states with skeletons
* ✅ Error handling with ErrorDisplay
* ✅ Empty states where applicable
* ✅ Responsive design
* ✅ No functionality regression
* ✅ TypeScript strict mode passes
### Step 3.3: Add Loading Skeletons (Day 30)
Create skeleton components for all major layouts.
**Tasks**:
1. Create skeleton components:
```typescript
// src/components/skeletons/DashboardSkeleton.tsx
import { Skeleton } from '@dykstra/ui';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      
      <Skeleton className="h-96" />
    </div>
  );
}

// src/components/skeletons/TableSkeleton.tsx
export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" /> {/* Header */}
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

// src/components/skeletons/CardSkeleton.tsx
export function CardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}
```
2. Use Suspense boundaries:
```typescript
// app/staff/template-analytics/page.tsx
import { Suspense } from 'react';
import { AnalyticsDashboard } from '@/features/templates';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';

export default function TemplateAnalyticsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AnalyticsDashboard />
    </Suspense>
  );
}
```
**Acceptance Criteria**:
* ✅ Skeleton for each major layout type
* ✅ Skeletons match final layout structure
* ✅ Suspense boundaries on all pages
* ✅ Smooth loading experience
### Phase 3 Deliverables Checklist
* ✅ Layout components created (DashboardLayout, PageSection, EmptyState)
* ✅ 10 pages refactored using feature module pattern
* ✅ Average page size reduced from 323 → <50 lines
* ✅ All pages use design system components
* ✅ Loading skeletons implemented
* ✅ Error boundaries on all pages
* ✅ Empty states where applicable
* ✅ Responsive design verified
* ✅ No functionality regressions
### Phase 3 Validation
**Manual Testing** (Each Page):
1. Navigate to page
2. Verify loading skeleton displays first
3. Verify data loads correctly
4. Test all interactions (filters, buttons, etc.)
5. Test error state (break API temporarily)
6. Test empty state (use empty data)
7. Test responsive (mobile, tablet, desktop)
8. Test keyboard navigation
**Automated Testing**:
1. Run all existing tests: `pnpm test`
2. Verify no regressions
3. Add snapshot tests for new components
**Performance**:
1. Run Lighthouse audit
2. Compare before/after metrics
3. Ensure no performance degradation
## Phase 4: Forms & Validation (Weeks 7-8)
**Goal**: Systematic form handling with domain validation.
**Risk**: Medium | **Dependency**: Phase 1 | **Validation**: 15 forms refactored, validation working
### Step 4.1: Domain Validation Bridge (Days 31-32)
Connect domain validation rules to Zod schemas.
**Tasks**:
1. Audit existing domain validation:
    * Review use cases for validation rules
    * Extract validation constants
    * Document business rules
2. Create validation library:
```typescript
// src/lib/validation/schemas.ts
import * as z from 'zod';

// Reusable validation rules (extracted from domain layer)
export const ValidationRules = {
  template: {
    name: {
      minLength: 3,
      maxLength: 100,
    },
    description: {
      maxLength: 500,
    },
  },
  case: {
    decedentName: {
      minLength: 2,
      maxLength: 100,
    },
    serviceDate: {
      minDate: () => new Date(), // Cannot be in the past
    },
  },
  financial: {
    amount: {
      min: 0,
      max: 999999.99,
    },
  },
};

// Schema builders
export const createTemplateSchema = () => z.object({
  name: z.string()
    .min(ValidationRules.template.name.minLength, 
         `Name must be at least ${ValidationRules.template.name.minLength} characters`)
    .max(ValidationRules.template.name.maxLength,
         `Name must be at most ${ValidationRules.template.name.maxLength} characters`),
  description: z.string()
    .max(ValidationRules.template.description.maxLength,
         `Description must be at most ${ValidationRules.template.description.maxLength} characters`)
    .optional(),
  category: z.enum(['funeral-program', 'obituary', 'memorial-card']),
  isActive: z.boolean().default(true),
});

export const createCaseSchema = () => z.object({
  decedentName: z.string()
    .min(ValidationRules.case.decedentName.minLength)
    .max(ValidationRules.case.decedentName.maxLength),
  serviceDate: z.date()
    .min(ValidationRules.case.serviceDate.minDate(),
         'Service date cannot be in the past'),
  serviceType: z.enum(['funeral', 'memorial', 'graveside']),
});
```
3. Create custom validators:
```typescript
// src/lib/validation/custom-validators.ts
import * as z from 'zod';

// Phone number validator
export const phoneSchema = z.string()
  .regex(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
         'Invalid phone number format');

// Email validator (enhanced)
export const emailSchema = z.string()
  .email('Invalid email address')
  .min(5, 'Email too short')
  .max(100, 'Email too long');

// Currency validator
export const currencySchema = z.number()
  .nonnegative('Amount cannot be negative')
  .max(999999.99, 'Amount too large')
  .refine(val => (val * 100) % 1 === 0, 'Amount can only have 2 decimal places');

// Date range validator
export const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.endDate >= data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});
```
**Acceptance Criteria**:
* ✅ Validation rules extracted from domain layer
* ✅ Zod schemas created for all major entities
* ✅ Custom validators for common patterns
* ✅ Validation errors are user-friendly
* ✅ Schemas are reusable across forms
### Step 4.2: Form Component Library (Days 33-35)
Create specialized form components for common patterns.
**Tasks**:
1. Create form field components:
```typescript
// src/components/forms/TextField.tsx
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Input } from '@dykstra/ui';
import { Control, FieldPath, FieldValues } from 'react-hook-form';

interface TextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  description?: string;
  type?: 'text' | 'email' | 'password' | 'tel';
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  type = 'text',
}: TextFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} placeholder={placeholder} {...field} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```
2. Create specialized fields:
    * `DateField` (with date picker)
    * `SelectField` (with options)
    * `TextAreaField` (multiline)
    * `CheckboxField` (boolean)
    * `RadioGroupField` (single choice)
    * `CurrencyField` (formatted input)
    * `PhoneField` (masked input)
3. Create composite components:
```typescript
// src/components/forms/AddressFields.tsx
export function AddressFields<T extends FieldValues>({
  control,
  prefix = '',
}: { control: Control<T>; prefix?: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TextField
        control={control}
        name={`${prefix}street` as FieldPath<T>}
        label="Street Address"
      />
      <TextField
        control={control}
        name={`${prefix}city` as FieldPath<T>}
        label="City"
      />
      <SelectField
        control={control}
        name={`${prefix}state` as FieldPath<T>}
        label="State"
        options={US_STATES}
      />
      <TextField
        control={control}
        name={`${prefix}zip` as FieldPath<T>}
        label="ZIP Code"
      />
    </div>
  );
}
```
**Acceptance Criteria**:
* ✅ Form field components created
* ✅ Specialized fields for common patterns
* ✅ Composite components for repeated patterns
* ✅ All fields fully typed
* ✅ Storybook stories for all form components
### Step 4.3: Refactor Forms (Days 36-40)
Refactor 15+ existing forms to use new form system.
**Target Forms**:
1. Create Template
2. Edit Template
3. Create Approval Workflow
4. Create Case
5. Edit Case
6. Service Arrangement
7. Financial Transaction
8. Payroll Entry
9. Time Entry
10. PTO Request
11. Purchase Order
12. Vendor Form
13. Inventory Adjustment
14. User Registration
15. Contact Form
**Refactoring Pattern**:
**Before** (ad-hoc form):
```typescript
const [name, setName] = useState('');
const [description, setDescription] = useState('');
const [errors, setErrors] = useState({});
const handleSubmit = () => {
  const newErrors = {};
  if (name.length < 3) newErrors.name = 'Too short';
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }
  // submit...
};
return (
  <form onSubmit={handleSubmit}>
    <input value={name} onChange={e => setName(e.target.value)} />
    {errors.name && <span>{errors.name}</span>}
    {/* ... */}
  </form>
);
```
**After** (React Hook Form + Zod):
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTemplateSchema } from '@/lib/validation/schemas';
import { TextField, SelectField } from '@/components/forms';
import { Form, Button } from '@dykstra/ui';
const schema = createTemplateSchema();
type FormData = z.infer<typeof schema>;
export function CreateTemplateForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      category: 'funeral-program',
      isActive: true,
    },
  });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <TextField
          control={form.control}
          name="name"
          label="Template Name"
          placeholder="Classic Funeral Program"
        />
        
        <TextField
          control={form.control}
          name="description"
          label="Description"
          placeholder="Traditional funeral program layout"
        />
        
        <SelectField
          control={form.control}
          name="category"
          label="Category"
          options={[
            { label: 'Funeral Program', value: 'funeral-program' },
            { label: 'Obituary', value: 'obituary' },
            { label: 'Memorial Card', value: 'memorial-card' },
          ]}
        />
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creating...' : 'Create Template'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```
**Implementation per form** (2-3 forms per day):
1. Create Zod schema
2. Replace manual state with `useForm`
3. Replace manual inputs with form field components
4. Connect to mutation hook
5. Test validation
6. Test submission
**Acceptance Criteria** (Per Form):
* ✅ Uses React Hook Form
* ✅ Validation with Zod schema
* ✅ Uses form field components
* ✅ Inline error messages
* ✅ Loading state during submission
* ✅ Success/error feedback
* ✅ Keyboard navigation works
* ✅ Accessible (ARIA labels, error announcements)
### Phase 4 Deliverables Checklist
* ✅ Domain validation rules extracted
* ✅ Zod schemas created for all entities
* ✅ Custom validators for common patterns
* ✅ Form field component library
* ✅ 15+ forms refactored
* ✅ All forms use React Hook Form
* ✅ Validation connected to domain rules
* ✅ Consistent error handling
* ✅ Accessible forms (WCAG 2.1 AA)
### Phase 4 Validation
**Form Testing Checklist** (Per Form):
1. Submit with empty fields → validation errors display
2. Submit with invalid data → validation errors display
3. Submit with valid data → success
4. Test field-level validation (blur events)
5. Test async validation (if applicable)
6. Test keyboard navigation
7. Test screen reader compatibility
**Automated Testing**:
1. Write unit tests for Zod schemas
2. Write integration tests for form submissions
3. Use React Testing Library for form interactions
## Phase 5: State Management (Weeks 9-10)
**Goal**: Add global state for complex workflows.
**Risk**: Low | **Dependency**: None | **Validation**: 5 stores working, persistent state
### Step 5.1: Install & Configure Zustand (Day 41)
Set up Zustand for global state management.
**Tasks**:
1. Install Zustand:
```warp-runnable-command
pnpm add zustand
```
2. Create store utilities:
```typescript
// src/lib/store/create-store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export function createStore<T>(name: string, initializer: (set, get) => T) {
  return create<T>()(
    devtools(
      initializer,
      { name }
    )
  );
}

export function createPersistedStore<T>(
  name: string,
  initializer: (set, get) => T
) {
  return create<T>()((
    persist(
      devtools(initializer, { name }),
      { name }
    )
  ));
}
```
3. Create base patterns:
```typescript
// src/lib/store/types.ts
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export interface StoreActions<T> {
  setData: (data: T) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  reset: () => void;
}
```
**Acceptance Criteria**:
* ✅ Zustand installed
* ✅ Store utilities created
* ✅ DevTools integration working
* ✅ Persist middleware configured
### Step 5.2: Create Feature Stores (Days 42-47)
Implement stores for complex features.
**Target Features** (5 stores):
1. Template Editor Store
2. Case Workflow Store
3. Financial Transaction Store
4. Scheduling Store
5. User Preferences Store
**Implementation Pattern** (Template Editor Store):
```typescript
// src/stores/template-editor-store.ts
import { createPersistedStore } from '@/lib/store/create-store';
import type { Template } from '@dykstra/domain';
interface TemplateEditorState {
  // State
  currentTemplate: Template | null;
  isDirty: boolean;
  history: Template[];
  historyIndex: number;
  
  // Actions
  setTemplate: (template: Template) => void;
  updateTemplate: (updates: Partial<Template>) => void;
  save: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}
export const useTemplateEditorStore = createPersistedStore<TemplateEditorState>(
  'template-editor',
  (set, get) => ({
    // Initial state
    currentTemplate: null,
    isDirty: false,
    history: [],
    historyIndex: -1,
    
    // Actions
    setTemplate: (template) => {
      set({
        currentTemplate: template,
        isDirty: false,
        history: [template],
        historyIndex: 0,
      });
    },
    
    updateTemplate: (updates) => {
      const { currentTemplate, history, historyIndex } = get();
      if (!currentTemplate) return;
      
      const updatedTemplate = { ...currentTemplate, ...updates };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(updatedTemplate);
      
      set({
        currentTemplate: updatedTemplate,
        isDirty: true,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    },
    
    save: async () => {
      const { currentTemplate } = get();
      if (!currentTemplate) return;
      
      // Call tRPC mutation
      // await trpc.templates.update.mutate(currentTemplate);
      
      set({ isDirty: false });
    },
    
    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex <= 0) return;
      
      const newIndex = historyIndex - 1;
      set({
        currentTemplate: history[newIndex],
        historyIndex: newIndex,
        isDirty: true,
      });
    },
    
    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex >= history.length - 1) return;
      
      const newIndex = historyIndex + 1;
      set({
        currentTemplate: history[newIndex],
        historyIndex: newIndex,
        isDirty: true,
      });
    },
    
    reset: () => {
      set({
        currentTemplate: null,
        isDirty: false,
        history: [],
        historyIndex: -1,
      });
    },
  })
);
// Selectors (for performance)
export const useTemplateEditorSelectors = () => ({
  canUndo: useTemplateEditorStore(state => state.historyIndex > 0),
  canRedo: useTemplateEditorStore(
    state => state.historyIndex < state.history.length - 1
  ),
  hasUnsavedChanges: useTemplateEditorStore(state => state.isDirty),
});
```
**Usage Example**:
```typescript
// features/templates/components/TemplateEditor.tsx
import { useTemplateEditorStore, useTemplateEditorSelectors } from '@/stores/template-editor-store';
import { Button } from '@dykstra/ui';
export function TemplateEditor() {
  const { currentTemplate, updateTemplate, save, undo, redo } = useTemplateEditorStore();
  const { canUndo, canRedo, hasUnsavedChanges } = useTemplateEditorSelectors();
  
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button onClick={undo} disabled={!canUndo}>Undo</Button>
        <Button onClick={redo} disabled={!canRedo}>Redo</Button>
        <Button onClick={save} disabled={!hasUnsavedChanges}>Save</Button>
      </div>
      
      {/* Editor UI */}
      <input
        value={currentTemplate?.name || ''}
        onChange={e => updateTemplate({ name: e.target.value })}
      />
    </div>
  );
}
```
**Create 4 more stores** (Days 43-47):
* **Case Workflow Store**: Multi-step case creation/editing
* **Financial Transaction Store**: Complex transaction builder
* **Scheduling Store**: Drag-and-drop schedule state
* **User Preferences Store**: Theme, layout, notifications
**Acceptance Criteria** (Per Store):
* ✅ Store created with clear state shape
* ✅ Actions for all mutations
* ✅ Selectors for derived state
* ✅ Persistence where applicable
* ✅ DevTools integration
* ✅ Type-safe
### Step 5.3: Optimistic Updates (Days 48-50)
Implement optimistic UI updates for better UX.
**Tasks**:
1. Create optimistic update wrapper:
```typescript
// src/lib/mutations/with-optimistic-update.ts
import { trpc } from '@/lib/trpc';

export function withOptimisticUpdate<TInput, TOutput>(
  mutation: any,
  options: {
    onMutate: (variables: TInput) => Promise<{ previousData: any }>;
    onError: (err: any, variables: TInput, context: { previousData: any }) => void;
    onSettled: () => void;
  }
) {
  return mutation.useMutation(options);
}
```
2. Implement optimistic updates for key mutations:
```typescript
// features/templates/hooks/use-update-template.ts
import { trpc } from '@/lib/trpc';

export function useUpdateTemplate() {
  const utils = trpc.useContext();
  
  return trpc.templates.update.useMutation({
    // Optimistic update
    onMutate: async (newTemplate) => {
      // Cancel outgoing refetches
      await utils.templates.list.cancel();
      
      // Snapshot previous value
      const previousTemplates = utils.templates.list.getData();
      
      // Optimistically update cache
      utils.templates.list.setData(undefined, (old) => {
        if (!old) return old;
        return old.map(t => 
          t.id === newTemplate.id ? newTemplate : t
        );
      });
      
      return { previousTemplates };
    },
    
    // Rollback on error
    onError: (err, newTemplate, context) => {
      utils.templates.list.setData(
        undefined,
        context?.previousTemplates
      );
    },
    
    // Refetch after success or error
    onSettled: () => {
      utils.templates.list.invalidate();
    },
  });
}
```
3. Add loading states with optimistic UI:
```typescript
// features/templates/components/TemplateCard.tsx
export function TemplateCard({ template }: { template: Template }) {
  const updateTemplate = useUpdateTemplate();
  const [isOptimistic, setIsOptimistic] = useState(false);
  
  const handleToggleActive = () => {
    setIsOptimistic(true);
    updateTemplate.mutate(
      { ...template, isActive: !template.isActive },
      {
        onSettled: () => setIsOptimistic(false),
      }
    );
  };
  
  return (
    <Card className={isOptimistic ? 'opacity-50' : ''}>
      <h3>{template.name}</h3>
      <Switch
        checked={template.isActive}
        onCheckedChange={handleToggleActive}
      />
    </Card>
  );
}
```
**Acceptance Criteria**:
* ✅ Optimistic updates for all mutations
* ✅ Rollback on error
* ✅ Loading indicators
* ✅ No UI flicker
* ✅ Consistent with tRPC patterns
### Phase 5 Deliverables Checklist
* ✅ Zustand installed and configured
* ✅ 5 feature stores implemented
* ✅ Persistent state working
* ✅ Optimistic updates for key mutations
* ✅ DevTools integration
* ✅ Type-safe state management
* ✅ Documentation for store patterns
### Phase 5 Validation
**Store Testing**:
1. Test each store action
2. Verify persistence (reload page)
3. Test undo/redo (where applicable)
4. Verify DevTools shows state changes
**Optimistic Update Testing**:
1. Update item → UI updates immediately
2. Simulate error → rollback works
3. Verify refetch after success
## Phase 6: Testing (Weeks 11-12)
**Goal**: Comprehensive UI testing coverage.
**Risk**: Low | **Dependency**: All previous phases | **Validation**: 80%+ coverage
### Step 6.1: Set Up Testing Infrastructure (Day 51)
Configure Vitest and React Testing Library.
**Tasks**:
1. Install testing dependencies:
```warp-runnable-command
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
pnpm add -D @testing-library/user-event @testing-library/react-hooks
pnpm add -D msw  # Mock Service Worker
```
2. Configure Vitest:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.stories.tsx',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```
3. Create test setup:
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```
4. Create test utilities:
```typescript
// src/test/utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <TRPCProvider>
      {children}
    </TRPCProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```
**Acceptance Criteria**:
* ✅ Vitest configured
* ✅ Testing Library setup
* ✅ Test utilities created
* ✅ Coverage reporting working
### Step 6.2: Write Component Tests (Days 52-55)
Test all UI components.
**Test Pattern** (Example: Button):
```typescript
// packages/ui/src/components/button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';
describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button variant="primary">Button</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
    
    rerender(<Button variant="secondary">Button</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-secondary');
  });
  
  it('applies size classes correctly', () => {
    const { rerender } = render(<Button size="sm">Button</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('h-9');
    
    rerender(<Button size="lg">Button</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('h-11');
  });
});
```
**Component Testing Targets** (50+ tests):
* All 20 primitive components from `@dykstra/ui`
* All form field components
* Layout components
* Domain components (TemplateCard, CaseCard, etc.)
**Daily Targets**:
* Day 52: Test primitive components (Button, Input, Card, etc.)
* Day 53: Test form components
* Day 54: Test layout components
* Day 55: Test domain components
**Acceptance Criteria** (Per Component):
* ✅ Renders correctly
* ✅ Props work as expected
* ✅ User interactions trigger callbacks
* ✅ Accessibility attributes present
* ✅ Edge cases handled
### Step 6.3: Write Hook Tests (Days 56-57)
Test custom hooks.
**Test Pattern** (Example: useTemplateAnalytics):
```typescript
// features/templates/hooks/use-template-analytics.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTemplateAnalytics } from './use-template-analytics';
import { trpc } from '@/lib/trpc';
vi.mock('@/lib/trpc');
describe('useTemplateAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('returns viewModel when data is loaded', async () => {
    const mockData = {
      totalGenerations: 1000,
      successRate: 95.5,
      avgDurationMs: 234,
      errorCount: 5,
      mostUsed: [],
    };
    
    vi.mocked(trpc.templateAnalytics.getOverallStats.useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    });
    
    const { result } = renderHook(() => 
      useTemplateAnalytics({ dateRange: 'month' })
    );
    
    await waitFor(() => {
      expect(result.current.viewModel).not.toBeNull();
    });
    
    expect(result.current.viewModel?.totalGenerations).toBe('1,000');
    expect(result.current.viewModel?.successRate).toBe('95.5%');
  });
  
  it('returns null viewModel when loading', () => {
    vi.mocked(trpc.templateAnalytics.getOverallStats.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    
    const { result } = renderHook(() => 
      useTemplateAnalytics({ dateRange: 'month' })
    );
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.viewModel).toBeNull();
  });
  
  it('handles error state', () => {
    const error = new Error('Failed to fetch');
    vi.mocked(trpc.templateAnalytics.getOverallStats.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
    });
    
    const { result } = renderHook(() => 
      useTemplateAnalytics({ dateRange: 'month' })
    );
    
    expect(result.current.error).toBe(error);
  });
});
```
**Hook Testing Targets** (30+ tests):
* Data fetching hooks (useTemplateAnalytics, useCaseList, etc.)
* Mutation hooks (useCreateTemplate, useUpdateCase, etc.)
* Generic utility hooks (useDebounce, usePagination, etc.)
**Acceptance Criteria** (Per Hook):
* ✅ Returns correct data structure
* ✅ Loading state handled
* ✅ Error state handled
* ✅ Refetch works
* ✅ Mutations trigger correctly
### Step 6.4: Write Integration Tests (Days 58-60)
Test complete user flows.
**Test Pattern** (Example: Template Creation Flow):
```typescript
// features/templates/__tests__/template-creation.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { TemplateLibraryPage } from '../components/TemplateLibraryPage';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
describe('Template Creation Flow', () => {
  it('allows user to create a new template', async () => {
    const user = userEvent.setup();
    render(<TemplateLibraryPage />);
    
    // Click "Create Template" button
    const createButton = screen.getByRole('button', { name: /create template/i });
    await user.click(createButton);
    
    // Fill out form
    const nameInput = screen.getByLabelText(/template name/i);
    await user.type(nameInput, 'Test Template');
    
    const descInput = screen.getByLabelText(/description/i);
    await user.type(descInput, 'Test description');
    
    const categorySelect = screen.getByLabelText(/category/i);
    await user.selectOptions(categorySelect, 'funeral-program');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/template created successfully/i)).toBeInTheDocument();
    });
    
    // Verify template appears in list
    expect(screen.getByText('Test Template')).toBeInTheDocument();
  });
  
  it('shows validation errors for invalid input', async () => {
    const user = userEvent.setup();
    render(<TemplateLibraryPage />);
    
    await user.click(screen.getByRole('button', { name: /create template/i }));
    
    // Submit without filling form
    await user.click(screen.getByRole('button', { name: /create/i }));
    
    // Verify validation errors
    await waitFor(() => {
      expect(screen.getByText(/name must be at least 3 characters/i)).toBeInTheDocument();
    });
  });
  
  it('handles API errors gracefully', async () => {
    // Mock API error
    server.use(
      http.post('/api/trpc/templates.create', () => {
        return HttpResponse.json(
          { error: { message: 'Server error' } },
          { status: 500 }
        );
      })
    );
    
    const user = userEvent.setup();
    render(<TemplateLibraryPage />);
    
    await user.click(screen.getByRole('button', { name: /create template/i }));
    await user.type(screen.getByLabelText(/template name/i), 'Test Template');
    await user.click(screen.getByRole('button', { name: /create/i }));
    
    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/failed to create template/i)).toBeInTheDocument();
    });
  });
});
```
**Integration Test Targets** (20+ tests):
1. Template creation flow
2. Template editing flow
3. Workflow approval flow
4. Case creation flow
5. Financial transaction flow
6. Form validation flows
7. Search and filter flows
8. Pagination flows
**Acceptance Criteria** (Per Flow):
* ✅ Complete user journey tested
* ✅ Happy path works
* ✅ Validation tested
* ✅ Error handling tested
* ✅ Loading states tested
### Phase 6 Deliverables Checklist
* ✅ Testing infrastructure set up
* ✅ 200+ component tests written
* ✅ 50+ hook tests written
* ✅ 20+ integration tests written
* ✅ 80%+ code coverage achieved
* ✅ CI integration configured
* ✅ Coverage reports generated
* ✅ All tests passing
### Phase 6 Validation
**Run Test Suite**:
```warp-runnable-command
pnpm test                     # Run all tests
pnpm test:coverage            # Generate coverage report
pnpm test:ui                  # Open Vitest UI
```
**Coverage Targets**:
* Components: 90%+
* Hooks: 85%+
* ViewModels: 95%+
* Overall: 80%+
**CI Integration**:
* Add test job to GitHub Actions
* Fail build on test failures
* Generate coverage reports
* Comment coverage on PRs
## Final Deliverables & Success Metrics
### Code Quality Metrics
**Before Modernization**:
* Average page size: 323 lines
* Component reuse: 0%
* Test coverage: 0%
* TypeScript strict: Backend only
* Design system: None
* Loading states: Inconsistent
* Error handling: Ad-hoc
**After Modernization**:
* Average page size: <50 lines (84% reduction)
* Component reuse: 70%+
* Test coverage: 80%+
* TypeScript strict: 100%
* Design system: Complete with Storybook
* Loading states: Consistent skeletons
* Error handling: Typed errors with boundaries
### Developer Experience Improvements
* ✅ Component development in isolation (Storybook)
* ✅ Type-safe forms with auto-validation
* ✅ Reusable hooks for all data fetching
* ✅ Consistent error handling patterns
* ✅ Optimistic updates for better UX
* ✅ Global state management (Zustand)
* ✅ Comprehensive testing coverage
### User Experience Improvements
* ✅ Consistent design language
* ✅ Smooth loading states (skeletons)
* ✅ Clear error messages
* ✅ Responsive design (mobile-first)
* ✅ Accessible (WCAG 2.1 AA)
* ✅ Fast interactions (optimistic updates)
### Technical Debt Reduction
* ✅ 60% less code to maintain
* ✅ 3x faster feature development
* ✅ 90% fewer UI bugs (estimated)
* ✅ Clear patterns for new features
* ✅ Self-documenting code (Storybook)
## Post-Implementation: Maintenance & Iteration
### Ongoing Tasks
1. **Storybook**: Keep component stories up to date
2. **Tests**: Write tests for all new features
3. **Design Tokens**: Review and update quarterly
4. **Component Library**: Add new components as needed
5. **Documentation**: Update guides and examples
### Future Enhancements
1. **Phase 7: Animations** - Add Framer Motion for polish
2. **Phase 8: Data Tables** - Integrate Tanstack Table
3. **Phase 9: Real-time Updates** - Add WebSocket support
4. **Phase 10: Mobile App** - React Native using shared UI
5. **Phase 11: Performance** - Code splitting, lazy loading
## Risk Mitigation
### Technical Risks
1. **Risk**: Breaking existing functionality
    * **Mitigation**: Incremental refactoring, comprehensive testing
2. **Risk**: Performance degradation
    * **Mitigation**: Bundle size monitoring, Lighthouse audits
3. **Risk**: Learning curve for new patterns
    * **Mitigation**: Comprehensive documentation, training sessions
### Schedule Risks
1. **Risk**: Underestimated complexity
    * **Mitigation**: Buffer time built into each phase (20%)
2. **Risk**: Scope creep
    * **Mitigation**: Strict phase boundaries, defer enhancements
## Conclusion
This 12-week plan transforms your frontend from ad-hoc React pages to an enterprise-grade, maintainable, testable architecture that matches your excellent backend. The incremental approach allows continuous delivery while minimizing risk.
**Key Success Factors**:
1. Follow phases sequentially (don't skip ahead)
2. Complete validation at end of each phase
3. Maintain discipline with patterns
4. Write tests as you go (don't defer)
5. Document learnings for team
**Expected Outcome**:
* Frontend architecture matches backend quality
* 60% reduction in maintenance burden
* 3x faster feature development
* 80%+ test coverage
* Delightful user experience

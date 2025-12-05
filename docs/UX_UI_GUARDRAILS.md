# UX/UI Architectural Guardrails
**World-Class Standards for Linear/Notion-Level Experience**

**Version**: 1.0  
**Date**: December 3, 2024  
**Purpose**: Enforce world-class UX/UI standards during implementation

---

## 🎯 Purpose

This document defines **non-negotiable rules** that must be enforced during UX transformation. These guardrails ensure we achieve Linear/Notion-level quality.

**Integration**: These rules are checked by `pnpm validate` and documented in `ARCHITECTURE.md`.

---

## 🏛️ Architectural Rules

### Rule 1: Component Isolation
**Status**: ✅ ENFORCED (Existing)

```
packages/ui/           ← UI components (isolated, no business logic)
packages/application/  ← Use cases (business logic, no UI)
packages/domain/       ← Domain models (pure, no dependencies)
```

**Validation**:
```bash
# UI components must not import from application or domain
! grep -r "from.*@dykstra/application" packages/ui/src && echo "✅ UI isolated"
! grep -r "from.*@dykstra/domain" packages/ui/src && echo "✅ UI isolated"

# Application must not import UI
! grep -r "from.*@dykstra/ui" packages/application/src && echo "✅ Application isolated"
```

**Rationale**: Keep UI components reusable and testable in Storybook.

---

### Rule 2: No Business Logic in Pages
**Status**: ⚠️ TO BE ENFORCED

**BAD** ❌:
```tsx
// src/app/staff/cases/page.tsx
export default function CasesPage() {
  const [cases, setCases] = useState([]);
  
  useEffect(() => {
    // ❌ Business logic in page
    fetch('/api/cases')
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter(c => c.status === 'active');
        const sorted = filtered.sort((a, b) => a.date - b.date);
        setCases(sorted);
      });
  }, []);
  
  return <div>{cases.map(...)}</div>;
}
```

**GOOD** ✅:
```tsx
// src/app/staff/cases/page.tsx
export default function CasesPage() {
  // ✅ Delegate to ViewModel/Hook
  const { cases, loading, error } = useCaseList({ status: 'active' });
  
  if (loading) return <Skeleton />;
  if (error) return <FriendlyError error={error} />;
  
  return <CaseTable cases={cases} />;
}
```

**Validation**:
```bash
# Pages should not have complex logic (>50 lines)
find src/app/staff -name "page.tsx" -exec sh -c '
  lines=$(wc -l < "$1")
  if [ $lines -gt 100 ]; then
    echo "⚠️  $1 has $lines lines (refactor to feature module)"
  fi
' sh {} \;

# Pages should not have raw fetch/axios
grep -r "fetch\|axios" src/app/staff --include="page.tsx" && echo "❌ Raw API calls in pages"
```

**Rationale**: Pages should be thin wrappers that compose UI components and hooks.

---

### Rule 3: Every Component Has Loading/Error States
**Status**: ⚠️ TO BE ENFORCED

**BAD** ❌:
```tsx
function UserProfile({ userId }: { userId: string }) {
  const user = useUser(userId);
  
  // ❌ No loading state
  // ❌ No error state
  return <div>{user.name}</div>;
}
```

**GOOD** ✅:
```tsx
function UserProfile({ userId }: { userId: string }) {
  const { user, loading, error } = useUser(userId);
  
  // ✅ Handle all states
  if (loading) return <Skeleton className="h-20 w-full" />;
  if (error) return <FriendlyError error={error} />;
  if (!user) return <EmptyState title="User not found" />;
  
  return <div>{user.name}</div>;
}
```

**Validation**:
```bash
# All components using hooks should have loading/error handling
grep -r "use[A-Z]" src --include="*.tsx" | while read file; do
  if ! grep -q "loading\|isLoading" "$file"; then
    echo "⚠️  $file missing loading state"
  fi
  if ! grep -q "error" "$file"; then
    echo "⚠️  $file missing error handling"
  fi
done
```

**Rationale**: Never show broken UI. Always handle loading/error/empty states gracefully.

---

### Rule 4: No Inline Styles (Except Motion)
**Status**: ⚠️ TO BE ENFORCED

**BAD** ❌:
```tsx
<div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
  {/* ❌ Inline styles */}
</div>
```

**GOOD** ✅:
```tsx
// Option 1: Tailwind classes
<div className="p-5 bg-gray-100">
  {/* ✅ Utility classes */}
</div>

// Option 2: CSS module
<div className={styles.container}>
  {/* ✅ Scoped styles */}
</div>

// Exception: Framer Motion animations
<motion.div style={{ x: motionValue }}>
  {/* ✅ Dynamic animation values allowed */}
</motion.div>
```

**Validation**:
```bash
# Detect inline styles (except motion.div)
grep -r 'style={{' src/app/staff --include="*.tsx" | grep -v "motion\." && echo "❌ Inline styles found"
```

**Rationale**: Maintain consistent styling through design system. Inline styles can't be overridden.

---

### Rule 5: Animations Must Be 60fps
**Status**: ⚠️ TO BE ENFORCED

**BAD** ❌:
```tsx
// ❌ Animating width (causes reflow)
<motion.div animate={{ width: '100%' }} />

// ❌ Animating height (causes reflow)
<motion.div animate={{ height: 'auto' }} />

// ❌ Animating margin (causes reflow)
<motion.div animate={{ marginTop: 20 }} />
```

**GOOD** ✅:
```tsx
// ✅ Transform properties (GPU accelerated)
<motion.div animate={{ x: 100, y: 100 }} />
<motion.div animate={{ scale: 1.2 }} />
<motion.div animate={{ rotate: 45 }} />

// ✅ Opacity (GPU accelerated)
<motion.div animate={{ opacity: 0.5 }} />
```

**Allowed properties**:
- `transform` (x, y, scale, rotate)
- `opacity`
- `filter` (blur, brightness)

**Validation**:
```bash
# Detect non-performant animations
grep -r "animate={{.*width\|animate={{.*height\|animate={{.*margin" src --include="*.tsx" && echo "❌ Non-performant animations"
```

**Rationale**: Only animate GPU-accelerated properties for 60fps smoothness.

---

### Rule 6: Accessibility First
**Status**: ⚠️ TO BE ENFORCED

**Required** for all interactive elements:
1. ✅ Keyboard navigation (Tab, Enter, Escape)
2. ✅ Focus indicators (visible outline)
3. ✅ ARIA labels (screen reader support)
4. ✅ Semantic HTML (button, nav, main, etc.)

**BAD** ❌:
```tsx
// ❌ div pretending to be button
<div onClick={handleClick}>Click me</div>

// ❌ No ARIA label on icon button
<button><X /></button>

// ❌ Missing alt text
<img src="..." />
```

**GOOD** ✅:
```tsx
// ✅ Semantic HTML
<button onClick={handleClick}>Click me</button>

// ✅ ARIA label on icon button
<button aria-label="Close dialog"><X /></button>

// ✅ Alt text provided
<img src="..." alt="User profile photo" />
```

**Validation**:
```bash
# Check for div onClick (should be button)
grep -r '<div.*onClick' src/app/staff --include="*.tsx" && echo "⚠️  Use <button> instead of <div onClick>"

# Check for missing alt text
grep -r '<img' src/app/staff --include="*.tsx" | grep -v 'alt=' && echo "❌ Missing alt text"

# Run axe accessibility tests
pnpm test:e2e:accessibility
```

**Rationale**: 15% of users have disabilities. Accessibility is not optional.

---

### Rule 7: Mobile-First Responsive Design
**Status**: ⚠️ TO BE ENFORCED

**BAD** ❌:
```tsx
// ❌ Desktop-only width
<div className="w-[1200px]">...</div>

// ❌ No responsive classes
<div className="flex">
  <div className="w-1/3">Sidebar</div>
  <div className="w-2/3">Content</div>
</div>
```

**GOOD** ✅:
```tsx
// ✅ Responsive width
<div className="w-full max-w-7xl mx-auto">...</div>

// ✅ Responsive breakpoints
<div className="flex flex-col md:flex-row">
  <div className="w-full md:w-1/3">Sidebar</div>
  <div className="w-full md:w-2/3">Content</div>
</div>

// ✅ Mobile: Stack, Desktop: Grid
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">...</div>
```

**Validation**:
```bash
# Check for fixed widths
grep -r 'w-\[.*px\]' src/app/staff --include="*.tsx" && echo "⚠️  Fixed widths (use max-w-* instead)"

# Test on mobile viewport
pnpm test:e2e:staff --project="Mobile Chrome"
```

**Rationale**: 60% of traffic is mobile. Design for small screens first.

---

### Rule 8: No Magic Numbers
**Status**: ⚠️ TO BE ENFORCED

**BAD** ❌:
```tsx
// ❌ What does 247 mean?
<div style={{ height: 247 }}>...</div>

// ❌ Why 0.7?
<motion.div animate={{ opacity: 0.7 }} />

// ❌ Random delay
setTimeout(callback, 750);
```

**GOOD** ✅:
```tsx
// ✅ Use design tokens
<div className="h-64">...</div>  // h-64 = 16rem = 256px

// ✅ Named constants
const DISABLED_OPACITY = 0.6;
<motion.div animate={{ opacity: DISABLED_OPACITY }} />

// ✅ Standard durations
const TOAST_DURATION = 3000; // 3 seconds (standard)
setTimeout(callback, TOAST_DURATION);
```

**Design tokens** to use:
- Spacing: 4, 8, 12, 16, 24, 32, 48, 64 (multiples of 4)
- Duration: 150ms (quick), 300ms (normal), 500ms (slow)
- Opacity: 0 (hidden), 0.6 (disabled), 1 (full)

**Validation**:
```bash
# Detect magic numbers in style attributes
grep -r "style={{.*[0-9]" src/app/staff --include="*.tsx" && echo "⚠️  Magic numbers in styles"
```

**Rationale**: Magic numbers are hard to maintain. Use named constants and design tokens.

---

### Rule 9: Consistent Naming Conventions
**Status**: ✅ ENFORCED (Existing)

**Files**:
- Pages: `page.tsx` (Next.js convention)
- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-case-list.ts`)
- Utils: `kebab-case.ts` (e.g., `format-date.ts`)

**Variables**:
- Components: `PascalCase` (e.g., `const MetricCard = ...`)
- Functions: `camelCase` (e.g., `const handleSubmit = ...`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `const API_ENDPOINT = ...`)
- Hooks: `camelCase` starting with `use` (e.g., `const useAuth = ...`)

**Validation**:
```bash
# Check component file names (should be PascalCase)
find src/components -name "*.tsx" | grep -v "^[A-Z]" && echo "❌ Component not PascalCase"

# Check hook file names (should be use-kebab-case)
find src/hooks -name "*.ts" | grep -v "^use-" && echo "❌ Hook not using 'use-' prefix"
```

**Rationale**: Consistent naming makes codebase predictable and easy to navigate.

---

### Rule 10: Progressive Enhancement
**Status**: ⚠️ TO BE ENFORCED

**Principle**: Core functionality must work without JavaScript.

**BAD** ❌:
```tsx
// ❌ Form only works with JavaScript
<form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
  <button type="button" onClick={handleSubmit}>Submit</button>
</form>
```

**GOOD** ✅:
```tsx
// ✅ Form works without JavaScript (progressive enhancement)
<form action="/api/submit" method="POST" onSubmit={handleSubmit}>
  <button type="submit">Submit</button>
</form>
```

**Validation**:
```bash
# Forms should have action attribute
grep -r '<form' src/app/staff --include="*.tsx" | grep -v 'action=' && echo "⚠️  Form missing action attribute"
```

**Rationale**: App should degrade gracefully if JavaScript fails to load.

---

## 🎨 Visual Design Rules

### Rule 11: Consistent Spacing
**Status**: ⚠️ TO BE ENFORCED

**Use 8px grid system**:
- 4px (p-1): Very tight spacing
- 8px (p-2): Tight spacing
- 12px (p-3): Default spacing
- 16px (p-4): Comfortable spacing
- 24px (p-6): Generous spacing
- 32px (p-8): Section spacing
- 48px (p-12): Large section spacing

**BAD** ❌:
```tsx
<div className="p-[13px] mb-[27px]">
  {/* ❌ Random spacing values */}
</div>
```

**GOOD** ✅:
```tsx
<div className="p-4 mb-6">
  {/* ✅ Follows 8px grid */}
</div>
```

**Validation**:
```bash
# Detect custom spacing (not in design system)
grep -r 'p-\[.*px\]' src/app/staff --include="*.tsx" && echo "❌ Custom spacing (use design tokens)"
```

---

### Rule 12: Typography Hierarchy
**Status**: ⚠️ TO BE ENFORCED

**Scale**:
- `text-xs` (12px): Captions, labels
- `text-sm` (14px): Body text, secondary info
- `text-base` (16px): Default body text
- `text-lg` (18px): Emphasized text
- `text-xl` (20px): Section headings
- `text-2xl` (24px): Page titles
- `text-3xl` (30px): Hero titles

**BAD** ❌:
```tsx
<h1 className="text-base">Page Title</h1>
<p className="text-3xl">Body text</p>
```

**GOOD** ✅:
```tsx
<h1 className="text-3xl font-bold">Page Title</h1>
<p className="text-base">Body text</p>
```

**Validation**:
```bash
# h1 should be text-2xl or text-3xl
grep -r '<h1' src/app/staff --include="*.tsx" | grep -v "text-2xl\|text-3xl" && echo "⚠️  h1 using wrong size"
```

---

### Rule 13: Color Consistency
**Status**: ✅ ENFORCED (Existing)

**Use CSS variables** from design system:
- `--navy`: Primary brand color
- `--sage`: Secondary color
- `--cream`: Background variant
- `--gold`: Accent (use sparingly)
- `--charcoal`: Dark text

**BAD** ❌:
```tsx
<div style={{ backgroundColor: '#1e3a5f' }}>
  {/* ❌ Hardcoded color */}
</div>
```

**GOOD** ✅:
```tsx
<div className="bg-[--navy]">
  {/* ✅ Design system color */}
</div>
```

**Validation**:
```bash
# Detect hardcoded colors
grep -r '#[0-9a-f]\{6\}' src/app/staff --include="*.tsx" && echo "⚠️  Hardcoded colors (use design system)"
```

---

## ⚡ Performance Rules

### Rule 14: Bundle Size Limits
**Status**: ⚠️ TO BE ENFORCED

**Limits**:
- Initial bundle: < 200KB gzipped
- Per-route bundle: < 50KB gzipped
- Total JavaScript: < 500KB gzipped

**Validation**:
```bash
# Check bundle size after build
pnpm build
pnpm run analyze

# Fail if bundle > 200KB
find .next/static/chunks -name "*.js" -size +200k && echo "❌ Bundle too large"
```

**Solutions**:
- ✅ Code splitting (dynamic imports)
- ✅ Lazy load below-fold content
- ✅ Tree-shaking (ES modules)
- ✅ Remove unused dependencies

---

### Rule 15: Image Optimization
**Status**: ⚠️ TO BE ENFORCED

**BAD** ❌:
```tsx
<img src="/photo.jpg" />
{/* ❌ Unoptimized image */}
```

**GOOD** ✅:
```tsx
import Image from 'next/image';

<Image 
  src="/photo.jpg" 
  width={800} 
  height={600}
  alt="Description"
  loading="lazy"
  placeholder="blur"
/>
{/* ✅ Optimized with Next.js Image */}
```

**Validation**:
```bash
# Detect raw img tags (should use next/image)
grep -r '<img' src/app/staff --include="*.tsx" && echo "⚠️  Use next/image instead of <img>"
```

---

### Rule 16: Lighthouse Score
**Status**: ⚠️ TO BE ENFORCED

**Target scores**:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 100
- SEO: 100

**Validation**:
```bash
# Run Lighthouse CI
pnpm build
pnpm start &
npx @lhci/cli@0.12.x autorun --collect.url=http://localhost:3000/staff/dashboard

# Assert minimum scores
```

**Fail if**:
- Performance < 90
- Accessibility < 95
- Any best practice issues

---

## 🧪 Testing Rules

### Rule 17: Every Component Has Tests
**Status**: ⚠️ TO BE ENFORCED

**Required coverage**:
- Unit tests: 80% statement coverage
- Integration tests: Critical paths
- E2E tests: Happy paths

**Validation**:
```bash
# Check test coverage
pnpm test:frontend --coverage

# Fail if coverage < 80%
pnpm test:frontend --coverage --coverageThreshold='{"global":{"statements":80}}'
```

---

### Rule 18: E2E Tests for Critical Flows
**Status**: ✅ ENFORCED (Existing)

**Required E2E tests**:
- ✅ Navigation (all modules accessible)
- ✅ Case creation flow
- ✅ Payment recording flow
- ✅ Contract signing flow
- ✅ Search functionality
- ⚠️ Command palette (add after Phase 4)

**Validation**:
```bash
# E2E tests must pass
pnpm test:e2e:staff --project=chromium

# Check test count (should be 30+ after transformation)
pnpm test:e2e:staff --list | wc -l
```

---

## 📝 Documentation Rules

### Rule 19: Every Component Has Storybook Story
**Status**: ✅ ENFORCED (Existing)

**Required** for all UI components:
```tsx
// ComponentName.stories.tsx
export default {
  title: 'Components/ComponentName',
  component: ComponentName,
};

export const Default = {
  args: {
    // Default props
  },
};

export const Loading = {
  args: {
    loading: true,
  },
};

export const Error = {
  args: {
    error: new Error('Test error'),
  },
};
```

**Validation**:
```bash
# Every component should have a story
find packages/ui/src/components -name "*.tsx" -not -name "*.stories.tsx" | while read file; do
  story="${file%.tsx}.stories.tsx"
  [ ! -f "$story" ] && echo "⚠️  Missing story: $story"
done
```

---

### Rule 20: WARP.md Must Be Updated
**Status**: ✅ ENFORCED (Existing)

**Update WARP.md when**:
- Adding new pages
- Changing architecture
- Adding new scripts
- Modifying navigation

**Validation**:
```bash
# WARP.md should mention new modules
grep -q "Scheduling" docs/WARP.md || echo "⚠️  Update WARP.md with new modules"
```

---

## 🚨 Validation Script Integration

### scripts/validate-ux-standards.sh

```bash
#!/bin/bash
# Run all UX/UI guardrail checks

echo "========================================="
echo "  UX/UI Standards Validation"
echo "========================================="

errors=0

# Rule 1: Component Isolation
echo "1️⃣  Checking component isolation..."
if grep -r "from.*@dykstra/application" packages/ui/src 2>/dev/null; then
  echo "❌ UI components importing from application"
  ((errors++))
fi

# Rule 3: Loading/Error States
echo "2️⃣  Checking loading/error states..."
# (Add validation logic)

# Rule 5: Performance Animations
echo "3️⃣  Checking animation performance..."
if grep -r "animate={{.*width\|animate={{.*height" src --include="*.tsx" 2>/dev/null; then
  echo "⚠️  Non-performant animations detected"
fi

# Rule 6: Accessibility
echo "4️⃣  Checking accessibility..."
if grep -r '<div.*onClick' src/app/staff --include="*.tsx" 2>/dev/null | grep -v button; then
  echo "⚠️  Use <button> instead of <div onClick>"
fi

# Rule 14: Bundle Size
echo "5️⃣  Checking bundle size..."
# (Requires build)

# Rule 16: Lighthouse Score
echo "6️⃣  Checking Lighthouse scores..."
# (Requires running server)

echo ""
if [ $errors -eq 0 ]; then
  echo "✅ All UX/UI standards checks passed"
  exit 0
else
  echo "❌ $errors UX/UI standards violations"
  exit 1
fi
```

### Integration with pnpm validate

```json
{
  "scripts": {
    "validate": "./scripts/pre-commit.sh && ./scripts/validate-ux-standards.sh",
    "validate:ux": "./scripts/validate-ux-standards.sh"
  }
}
```

---

## 📚 Reference: Linear/Notion Benchmarks

### What makes Linear world-class:
1. ✅ ⌘K command palette (Phase 4)
2. ✅ Keyboard shortcuts everywhere (Existing)
3. ✅ Instant feedback (<100ms)
4. ✅ Smooth animations (60fps)
5. ✅ Dark mode (Optional for Phase 6)
6. ✅ Predictive search (Phase 3)
7. ✅ Inline editing (Phase 4)
8. ✅ Optimistic updates (Existing in payments)

### What makes Notion world-class:
1. ✅ Flexible layouts (Existing)
2. ✅ Rich text editing (Existing)
3. ✅ Drag-drop (Phase 3 - Kanban)
4. ✅ Templates (Existing - template-library)
5. ✅ Sharing/collaboration (Phase 5)
6. ✅ AI assistance (Phase 3 - AIAssistantBubble)
7. ✅ Comments/notes (Exists - not exposed)
8. ✅ Multiple views (Phase 3 - Kanban/Table/Timeline)

---

**END OF GUARDRAILS**

These rules must be checked during implementation and enforced via `pnpm validate`.

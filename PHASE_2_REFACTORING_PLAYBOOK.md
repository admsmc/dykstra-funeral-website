# Phase 2 Refactoring Playbook

## Overview
This playbook provides a systematic 7-step process for refactoring monolithic page components into the Feature Module pattern established in Phase 2. Follow this guide to refactor any page component from 300+ lines down to ~50 lines while maintaining 100% functionality.

**Success Criteria**: 60%+ size reduction, zero regressions, full TypeScript safety

---

## 📋 Prerequisites
Before starting any refactoring:
1. ✅ Read the original page file completely
2. ✅ Identify all tRPC queries and mutations
3. ✅ Count helper functions and sub-components
4. ✅ Note any complex state management
5. ✅ Understand the feature's business logic

---

## 🎯 The 7-Step Refactoring Process

### Step 1: Create Types & Interfaces (5-10 minutes)
**Goal**: Extract all TypeScript types into a dedicated file

**Actions**:
1. Create `src/features/{feature}/types/index.ts`
2. Extract all `type` and `interface` definitions from the original page
3. Add any missing types for ViewModels (computed properties)

**Example** (from Template Analytics):
```typescript
// src/features/templates/types/index.ts
export type DateRange = 'day' | 'week' | 'month' | 'all';
export type Category = 'service_program' | 'prayer_card' | 'thank_you_card' | 'memorial_bookmark' | 'all';

export interface OverallStats {
  totalGenerations: number;
  successRate: number;
  avgDurationMs: number;
  avgPdfSizeBytes: number;
}
```

**Checklist**:
- [ ] All types extracted from page
- [ ] API response types defined
- [ ] Component prop types defined
- [ ] No business logic in types file

---

### Step 2: Create ViewModels (15-20 minutes)
**Goal**: Build ViewModel classes that transform raw API data into presentation-ready format

**Actions**:
1. Create `src/features/{feature}/view-models/{feature}-view-model.ts`
2. For each API response type, create a corresponding ViewModel class extending `BaseViewModel`
3. Add computed properties (getters) for all formatted values
4. Use `protected` methods from `BaseViewModel` for formatting

**Example**:
```typescript
import { BaseViewModel } from '@/lib/view-models/base-view-model';

export class OverallStatsViewModel extends BaseViewModel {
  constructor(private stats: OverallStats | undefined) {
    super();
  }

  get totalGenerations(): string {
    return this.formatCount(this.stats?.totalGenerations);
  }

  get successRate(): string {
    const rate = this.stats?.successRate;
    return rate !== undefined ? `${rate.toFixed(1)}%` : '0%';
  }

  get avgDuration(): string {
    return this.formatDuration(this.stats?.avgDurationMs);
  }

  get hasData(): boolean {
    return this.stats !== undefined;
  }
}
```

**Available `BaseViewModel` Methods**:
- `formatCurrency(value)` - "$1,234.56"
- `formatDate(date)` - "Dec 2, 2024"
- `formatDateTime(date)` - "Dec 2, 2024, 3:45 PM"
- `formatPercent(value, decimals)` - "85.7%"
- `formatBytes(bytes)` - "1.5 KB"
- `formatDuration(ms)` - "1.3s" or "1m 5s"
- `formatCount(value)` - "12,345"
- `toTitleCase(str)` - "Service Program"

**ViewModel Pattern Rules**:
✅ **DO**:
- Create one ViewModel per API entity
- Use getters for computed properties
- Keep ViewModels pure (no side effects)
- Return presentation-ready strings from getters
- Add `hasData` / `isEmpty` utility getters

❌ **DON'T**:
- Call APIs from ViewModels
- Mutate data in ViewModels
- Add component-specific logic
- Return raw API data from getters

**Checklist**:
- [ ] One ViewModel per API response type
- [ ] All formatting logic extracted from components
- [ ] Getters return presentation-ready values
- [ ] No mutations or side effects

---

### Step 3: Create Custom Hook (15-20 minutes)
**Goal**: Encapsulate all data fetching (tRPC queries) and return ViewModel instances

**Actions**:
1. Create `src/features/{feature}/hooks/use-{feature}.ts`
2. Move all tRPC `useQuery` and `useMutation` calls into the hook
3. Transform query results into ViewModels using `useMemo`
4. Aggregate loading/error states
5. Return ViewModels (not raw API data)

**Example**:
```typescript
import { useMemo } from 'react';
import { trpc } from '@/lib/trpc-client';
import {
  OverallStatsViewModel,
  TemplateUsageViewModel,
} from '../view-models/template-analytics-view-model';

export function useTemplateAnalytics(dateRange: DateRange, category: Category) {
  // tRPC queries
  const overallStatsQuery = trpc.templateAnalytics.getOverallStats.useQuery({
    dateRange,
    category,
  });

  const mostUsedQuery = trpc.templateAnalytics.getMostUsedTemplates.useQuery({
    dateRange,
    category,
  });

  // Transform to ViewModels
  const overallStats = useMemo(
    () => new OverallStatsViewModel(overallStatsQuery.data),
    [overallStatsQuery.data]
  );

  const mostUsedTemplates = useMemo(
    () => mostUsedQuery.data?.map((t, idx) => new TemplateUsageViewModel(idx + 1, t)) ?? [],
    [mostUsedQuery.data]
  );

  // Aggregate loading states
  const isLoading = overallStatsQuery.isLoading || mostUsedQuery.isLoading;

  return {
    overallStats,
    mostUsedTemplates,
    isLoading,
  };
}
```

**Hook Pattern Rules**:
✅ **DO**:
- Encapsulate ALL tRPC queries/mutations
- Return ViewModel instances
- Use `useMemo` for ViewModel construction
- Aggregate loading/error states
- Accept filter/search params as arguments

❌ **DON'T**:
- Return raw API data
- Add presentation logic
- Call hooks conditionally
- Forget to memoize ViewModels

**Checklist**:
- [ ] All tRPC queries moved to hook
- [ ] Query results transformed to ViewModels
- [ ] Loading states aggregated
- [ ] ViewModels memoized
- [ ] Page component knows nothing about tRPC

---

### Step 4: Extract Components (20-30 minutes)
**Goal**: Split monolithic page into 5-8 focused, reusable components

**Actions**:
1. Create `src/features/{feature}/components/` directory
2. Extract inline helper components into separate files
3. Extract major sections (filters, lists, grids, modals)
4. Create a composition component that combines everything
5. Keep components pure - accept ViewModel props, emit events

**Component Types to Extract**:
1. **Filters Component**: Search, date range, category selectors
2. **List/Grid Components**: Display collections of items
3. **Detail Components**: Show single item details
4. **Action Components**: Buttons, forms, modals
5. **Composition Component**: Combines all components

**Example**:
```typescript
// src/features/templates/components/stats-grid.tsx
import type { OverallStatsViewModel } from '../view-models/template-analytics-view-model';

interface StatsGridProps {
  stats: OverallStatsViewModel;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className=\"grid grid-cols-1 md:grid-cols-4 gap-6 mb-6\">
      <StatCard title=\"Total Generations\" value={stats.totalGenerations} color=\"blue\" />
      <StatCard title=\"Success Rate\" value={stats.successRate} color=\"green\" />
      <StatCard title=\"Avg Duration\" value={stats.avgDuration} color=\"yellow\" />
      <StatCard title=\"Avg PDF Size\" value={stats.avgPdfSize} color=\"purple\" />
    </div>
  );
}
```

**Component Pattern Rules**:
✅ **DO**:
- Accept ViewModel props
- Emit events via callbacks
- Keep components pure (no side effects)
- Use TypeScript interfaces for props
- Extract sub-components into same file if small

❌ **DON'T**:
- Call hooks inside extracted components (pass data down)
- Access tRPC directly
- Add business logic
- Hardcode values that should come from ViewModels

**Typical Component Structure** (aim for 30-60 lines each):
- `{Feature}Filters` (20-50 lines) - Search, filter controls
- `{Feature}List` (30-60 lines) - Collection display
- `{Feature}Grid` (30-60 lines) - Grid layout
- `{Feature}Card` (20-40 lines) - Single item display
- `{Feature}Modal` (40-80 lines) - Detail view
- `{Feature}Dashboard` (30-50 lines) - Composition wrapper

**Checklist**:
- [ ] 5-8 focused components extracted
- [ ] Each component <80 lines
- [ ] All components accept ViewModels
- [ ] No tRPC calls in components
- [ ] Composition component created

---

### Step 5: Create Feature Public API (5 minutes)
**Goal**: Expose a clean, well-documented barrel export

**Actions**:
1. Create `src/features/{feature}/index.ts`
2. Export all components, hooks, types, and ViewModels
3. Use named exports (not default)

**Example**:
```typescript
// src/features/templates/index.ts

// Components
export { AnalyticsDashboard } from './components/analytics-dashboard';
export { AnalyticsFilters } from './components/analytics-filters';
export { StatsGrid } from './components/stats-grid';

// Hooks
export { useTemplateAnalytics } from './hooks/use-template-analytics';

// Types
export type {
  DateRange,
  Category,
  OverallStats,
  TemplateUsage,
} from './types';

// ViewModels
export {
  OverallStatsViewModel,
  TemplateUsageViewModel,
} from './view-models/template-analytics-view-model';
```

**Checklist**:
- [ ] All components exported
- [ ] All hooks exported
- [ ] All types exported (with `type` keyword)
- [ ] ViewModels exported
- [ ] No internal implementation details leaked

---

### Step 6: Refactor Page Component (10-15 minutes)
**Goal**: Reduce page to ~50 lines - a thin coordinator using the feature module

**Actions**:
1. Replace all imports with single import from `@/features/{feature}`
2. Replace tRPC calls with custom hook
3. Replace inline components with exported components
4. Remove all helper functions (moved to ViewModels)
5. Keep only: state management, hook call, component composition

**Before** (324 lines):
```typescript
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc-client';

export default function TemplateAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  
  // 6 separate tRPC queries
  const { data: overallStats } = trpc.templateAnalytics.getOverallStats.useQuery({...});
  const { data: mostUsed } = trpc.templateAnalytics.getMostUsedTemplates.useQuery({...});
  // ... 4 more queries
  
  // 250+ lines of JSX with inline components
  // 50+ lines of helper functions
}
```

**After** (56 lines):
```typescript
'use client';

import { useState } from 'react';
import {
  AnalyticsDashboard,
  AnalyticsFilters,
  useTemplateAnalytics,
  type DateRange,
  type Category,
} from '@/features/templates';

export default function TemplateAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [category, setCategory] = useState<Category>('all');

  const {
    overallStats,
    mostUsedTemplates,
    usageByCategory,
    generationTrend,
    recentErrors,
    performanceMetrics,
    isLoading,
  } = useTemplateAnalytics(dateRange, category);

  return (
    <div className=\"min-h-screen bg-gray-50 p-6\">
      <div className=\"max-w-7xl mx-auto\">
        <div className=\"mb-8\">
          <h1 className=\"text-3xl font-bold text-gray-900\">Template Analytics Dashboard</h1>
          <p className=\"text-gray-600 mt-2\">Monitor template usage, performance, and errors</p>
        </div>

        <AnalyticsFilters
          dateRange={dateRange}
          category={category}
          onDateRangeChange={setDateRange}
          onCategoryChange={setCategory}
        />

        {isLoading ? (
          <p className=\"text-center text-gray-500 py-8\">Loading analytics...</p>
        ) : (
          <AnalyticsDashboard
            overallStats={overallStats}
            mostUsedTemplates={mostUsedTemplates}
            usageByCategory={usageByCategory}
            generationTrend={generationTrend}
            recentErrors={recentErrors}
            performanceMetrics={performanceMetrics}
          />
        )}
      </div>
    </div>
  );
}
```

**Page Component Rules**:
✅ **DO**:
- Import from `@/features/{feature}`
- Use custom hook for data
- Compose with extracted components
- Handle loading/error states
- Keep under 60 lines

❌ **DON'T**:
- Import tRPC directly
- Add business logic
- Format data inline
- Create helper functions
- Exceed 80 lines

**Checklist**:
- [ ] Single import from feature module
- [ ] tRPC replaced with custom hook
- [ ] All inline components removed
- [ ] Page is <60 lines
- [ ] 100% functionality preserved

---

### Step 7: Validate & Document (10 minutes)
**Goal**: Ensure zero regressions and document the refactoring

**Actions**:
1. Run TypeScript compilation: `npx tsc --noEmit`
2. Test the page manually (all features working)
3. Calculate metrics (line reduction, component count)
4. Update progress documentation

**Validation Checklist**:
```bash
# TypeScript compilation
npx tsc --noEmit 2>&1 | grep "src/features/{feature}"

# Line counts
wc -l src/app/staff/{page}/page.tsx  # After
# Compare to original (note in docs)

# Feature module size
find src/features/{feature} -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1
```

**Document Results**:
```markdown
## Feature: {Feature Name}
- **Original**: {X} lines
- **Refactored**: {Y} lines
- **Reduction**: {X-Y} lines ({%} reduction)
- **ViewModels**: {N} classes
- **Components**: {N} files
- **Custom Hooks**: {N} hooks
- **TypeScript Errors**: 0
- **Functionality**: ✅ 100% preserved
```

**Checklist**:
- [ ] Zero TypeScript errors
- [ ] All functionality works
- [ ] 60%+ size reduction achieved
- [ ] Metrics documented
- [ ] TODO marked complete

---

## 🎓 Common Patterns & Solutions

### Pattern: List with Filters
**Problem**: Page with list, search, pagination, filtering
**Solution**:
- `useFeatureList` hook - encapsulates tRPC, returns ViewModels
- `FeatureFilters` component - controlled inputs
- `FeatureList` component - renders ViewModels
- `FeatureCard` component - single item display

### Pattern: Detail View with Mutations
**Problem**: Page loads entity, allows edits, submits changes
**Solution**:
- `useFeatureDetail` hook - query + mutations
- `FeatureViewModel` - entity + computed properties
- `FeatureForm` component - edit form
- `FeatureActions` component - save/cancel buttons

### Pattern: Multi-Step Wizard
**Problem**: Complex wizard with 3+ steps
**Solution**:
- `useFeatureWizard` hook - step state + validation
- `Step1Component`, `Step2Component`, etc. - individual steps
- `FeatureWizard` composition component - step routing
- `WizardStateViewModel` - wizard state + progress

### Pattern: Modal/Dialog with Details
**Problem**: List view with modal for details
**Solution**:
- `useFeature` hook - list query + selected item
- `FeatureList` component - grid/list view
- `FeatureModal` component - detail modal
- Page manages `selectedId` state

---

## 📊 Success Metrics

### Per Feature
- **Target**: 60%+ line reduction
- **Page Size**: <60 lines (ideal), <80 lines (acceptable)
- **Components**: 5-8 extracted
- **ViewModels**: 3-6 classes
- **Hooks**: 1-2 custom hooks
- **TypeScript**: Zero new errors

### Phase 2 Complete
- **Total Lines Reduced**: 4,744 → ~480 (90% reduction)
- **Features Refactored**: 8/8
- **Components Created**: 40-64
- **ViewModels Created**: 24-48
- **Time per Feature**: 45-90 min

---

## 🚀 Getting Started

### Quick Start (Next Feature)
1. Read this playbook completely
2. Pick next feature from priority list
3. Follow Steps 1-7 sequentially
4. Don't skip steps or combine them
5. Validate thoroughly before moving on
6. Update progress doc

### Priority Order (by size, largest first)
1. ✅ Template Analytics (324 lines) - **COMPLETE**
2. ⏳ Contract Builder (1,101 lines)
3. ⏳ Case Detail (856 lines)
4. ⏳ Template Library (611 lines)
5. ⏳ Template Editor (545 lines)
6. ⏳ Template Approvals (447 lines)
7. ⏳ Case List (397 lines)
8. ⏳ Payment Detail (393 lines)
9. ⏳ Template Workflows (367 lines)

### Estimated Time Budget
- **Simple features** (300-400 lines, 3-4 queries): 45-60 min
- **Medium features** (400-600 lines, 5-7 queries): 60-75 min
- **Complex features** (600+ lines, 8+ queries, wizards): 75-90 min

**Total estimated effort**: 8-12 hours for all 8 remaining features

---

## ✅ Quality Checklist

Before marking a feature complete, verify:
- [ ] All 7 steps completed sequentially
- [ ] Feature module follows established patterns
- [ ] Page component <60 lines
- [ ] Zero TypeScript errors in new code
- [ ] 100% functionality preserved (manual test)
- [ ] 60%+ line reduction achieved
- [ ] Metrics documented
- [ ] Progress doc updated

---

**Last Updated**: December 2, 2024  
**Pilot Success**: Template Analytics (324 → 56 lines, 82.7% reduction)

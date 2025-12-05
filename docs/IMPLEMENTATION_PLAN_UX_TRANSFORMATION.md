# UX Transformation Implementation Plan
**AI-Executable Guide for World-Class Linear/Notion-Level UX**

**Version**: 1.0  
**Date**: December 3, 2024  
**Estimated Duration**: 6 weeks (240 hours)  
**Success Criteria**: 95% feature parity with Linear/Notion

---

## 📋 Table of Contents

1. [Pre-Implementation Validation](#pre-implementation-validation)
2. [Phase 1: Layout Activation (Week 1)](#phase-1-layout-activation)
3. [Phase 2: Module Exposure (Weeks 2-3)](#phase-2-module-exposure)
4. [Phase 3: Component Integration (Week 4)](#phase-3-component-integration)
5. [Phase 4: Command Palette (Week 5)](#phase-4-command-palette)
6. [Phase 5: Polish & Delight (Week 6)](#phase-5-polish--delight)
7. [Validation Checkpoints](#validation-checkpoints)
8. [Rollback Procedures](#rollback-procedures)

---

## 🔒 Pre-Implementation Validation

### Step 0.1: Verify Prerequisites
**Duration**: 1 hour  
**AI Agent Instructions**: Run these checks before starting

```bash
# 1. Verify monorepo structure
test -d packages/ui && echo "✅ UI package exists" || echo "❌ Missing UI package"
test -d packages/application && echo "✅ Application package exists" || echo "❌ Missing application"

# 2. Count components
component_count=$(find packages/ui/src/components -name "*.tsx" -not -name "*.stories.tsx" | wc -l)
echo "Components found: $component_count (expected: 50+)"

# 3. Count use cases
usecase_count=$(find packages/application/src/use-cases -name "*.ts" -not -name "*.test.ts" | wc -l)
echo "Use cases found: $usecase_count (expected: 100+)"

# 4. Verify enhanced layout exists
test -f src/app/staff/layout-enhanced.tsx && echo "✅ Enhanced layout exists" || echo "❌ Missing enhanced layout"

# 5. Check tests pass
pnpm test:frontend && echo "✅ Tests passing" || echo "⚠️ Some tests failing"

# 6. Verify TypeScript compiles
pnpm type-check && echo "✅ TypeScript compiles" || echo "❌ TypeScript errors"

# 7. Check validation script
pnpm validate && echo "✅ Validation passes" || echo "⚠️ Validation warnings"
```

**Success Criteria**:
- ✅ All packages exist
- ✅ 50+ components found
- ✅ 100+ use cases found
- ✅ Enhanced layout exists
- ✅ Tests pass (or document failures)
- ✅ TypeScript compiles
- ✅ Validation passes

**Checkpoint**: If any checks fail, document and fix before proceeding.

---

## 📦 Phase 1: Layout Activation (Week 1)

**Goal**: Activate enhanced layout with workspace grouping  
**Duration**: 40 hours  
**Risk Level**: Low (easily reversible)

### Task 1.1: Backup Current Layout
**Duration**: 15 minutes

```bash
# Create backup directory
mkdir -p src/app/staff/_backups

# Backup current layout
cp src/app/staff/layout.tsx src/app/staff/_backups/layout-basic-$(date +%Y%m%d-%H%M%S).tsx

# Document what was backed up
echo "Backed up layout.tsx on $(date)" >> src/app/staff/_backups/README.md
```

**AI Agent Validation**:
```bash
# Verify backup exists
test -f src/app/staff/_backups/layout-basic-*.tsx && echo "✅ Backup created" || exit 1
```

### Task 1.2: Activate Enhanced Layout
**Duration**: 30 minutes

```bash
# Rename current to old
mv src/app/staff/layout.tsx src/app/staff/layout-basic-old.tsx

# Activate enhanced
mv src/app/staff/layout-enhanced.tsx src/app/staff/layout.tsx

# Verify file exists
test -f src/app/staff/layout.tsx && echo "✅ Enhanced layout activated"
```

**AI Agent Validation**:
```bash
# Verify enhanced layout is active
grep -q "WorkspaceNavigation\|NavSection" src/app/staff/layout.tsx && echo "✅ Enhanced layout active" || echo "❌ Old layout still active"
```

### Task 1.3: Fix Import Paths
**Duration**: 2 hours

**AI Agent Instructions**:
1. Open `src/app/staff/layout.tsx`
2. Scan for all imports
3. Verify each imported component exists
4. Fix any broken imports

```bash
# Check for common import issues
pnpm type-check 2>&1 | grep "layout.tsx" && echo "⚠️ Import errors detected" || echo "✅ No import errors"
```

**Common fixes needed**:
```tsx
// BEFORE (might be broken)
import { WorkspaceSection } from '@/components/workspace';

// AFTER (verify actual path)
import { WorkspaceSection } from '@/components/layouts/workspace-section';
```

### Task 1.4: Create Missing Placeholder Pages
**Duration**: 4 hours

**AI Agent Instructions**: For each route in enhanced layout that doesn't have a page, create placeholder:

```bash
# Find all href paths in layout
grep -o 'href="/staff/[^"]*"' src/app/staff/layout.tsx | sort -u > /tmp/required-routes.txt

# Check which routes exist
while read route; do
  route_path=$(echo $route | sed 's/href="//;s/"//')
  page_path="src/app${route_path}/page.tsx"
  
  if [ ! -f "$page_path" ]; then
    echo "Missing: $page_path"
    
    # Create directory
    mkdir -p "$(dirname $page_path)"
    
    # Create placeholder page
    cat > "$page_path" << 'EOF'
'use client';

import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function PlaceholderPage() {
  return (
    <DashboardLayout title="Coming Soon" subtitle="This module is under development">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Module In Development
          </h2>
          <p className="text-gray-600">
            This feature will be available soon.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
EOF
    
    echo "✅ Created placeholder: $page_path"
  fi
done < /tmp/required-routes.txt
```

### Task 1.5: Test Enhanced Layout
**Duration**: 3 hours

**AI Agent Instructions**: Run comprehensive testing

```bash
# 1. Start dev server (in background)
pnpm dev &
DEV_PID=$!

# Wait for server to start
sleep 10

# 2. Test layout loads
curl -s http://localhost:3000/staff/dashboard | grep -q "WorkspaceNavigation" && echo "✅ Layout renders" || echo "❌ Layout broken"

# 3. Run E2E tests for navigation
pnpm test:e2e:staff --grep "navigation" && echo "✅ Navigation tests pass" || echo "⚠️ Navigation tests fail"

# 4. Check for console errors (manual verification needed)
echo "⚠️ MANUAL CHECK REQUIRED: Open http://localhost:3000/staff/dashboard and check console for errors"

# Cleanup
kill $DEV_PID
```

### Task 1.6: Update Documentation
**Duration**: 1 hour

**AI Agent Instructions**: Update WARP.md with new layout info

```bash
# Add section to WARP.md about enhanced layout
cat >> docs/WARP.md << 'EOF'

## Enhanced Staff Layout (Active)

The staff portal uses an enhanced workspace-based layout with:
- **Workspace Grouping**: Operations, Finance, HR, Procurement, Logistics
- **Collapsible Sections**: Each workspace can collapse to save space
- **Role-Based Navigation**: Badges and role restrictions for ERP modules
- **Modern Sidebar**: Icon + label navigation with hover states

**File**: `src/app/staff/layout.tsx` (was `layout-enhanced.tsx`)
**Backup**: `src/app/staff/_backups/layout-basic-*.tsx`

### Navigation Structure
- **Operations**: Cases, Contracts, Families, Tasks
- **Finance**: Payments, GL, AP, Analytics
- **HR & Payroll**: Payroll, Time Tracking
- **Procurement**: Purchase Orders, Inventory, Suppliers
- **Logistics**: Shipments

### Rollback Procedure
```bash
# Restore old layout
cp src/app/staff/_backups/layout-basic-*.tsx src/app/staff/layout.tsx
```
EOF

echo "✅ Documentation updated"
```

### Phase 1 Checkpoint

**AI Agent Validation Checklist**:
```bash
# Run all checks
echo "=== Phase 1 Validation ==="

# 1. Layout is active
test -f src/app/staff/layout.tsx && echo "✅ Layout exists"

# 2. Backup exists
test -f src/app/staff/_backups/layout-basic-*.tsx && echo "✅ Backup exists"

# 3. TypeScript compiles
pnpm type-check && echo "✅ TypeScript compiles"

# 4. Tests pass
pnpm test:frontend && echo "✅ Tests pass"

# 5. Dev server starts
timeout 30 pnpm dev && echo "✅ Dev server starts"

# 6. No console errors (manual check)
echo "⚠️ MANUAL: Check http://localhost:3000/staff/dashboard for console errors"

echo "=== Phase 1 Complete ==="
```

**Success Criteria**:
- ✅ Enhanced layout is active
- ✅ All routes have placeholder pages
- ✅ No TypeScript errors
- ✅ Tests pass (or failures documented)
- ✅ Navigation works in browser
- ✅ Documentation updated

**If validation fails**: Rollback using backup and document issues.

---

## 🎯 Phase 2: Module Exposure (Weeks 2-3)

**Goal**: Create functional pages for 19 hidden modules  
**Duration**: 80 hours  
**Risk Level**: Medium (new pages, need testing)

### Priority 1 Modules (Week 2 - 40 hours)

These modules provide immediate business value.

#### Task 2.1: Scheduling Module
**Duration**: 10 hours  
**Use Cases**: 15 (staff scheduling, on-call, shifts, etc.)

**AI Agent Instructions**:

```bash
# 1. Create directory structure
mkdir -p src/app/staff/scheduling/{shifts,on-call,rooms}

# 2. Create main scheduling page
cat > src/app/staff/scheduling/page.tsx << 'EOF'
'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';

export default function SchedulingPage() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  
  return (
    <DashboardLayout 
      title="Scheduling" 
      subtitle="Manage staff schedules, on-call rotation, and room bookings"
    >
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          icon={<Users />} 
          label="Staff On Duty Today" 
          value="12" 
          trend="+2 vs. yesterday"
        />
        <StatCard 
          icon={<Clock />} 
          label="On-Call Director" 
          value="Sarah M." 
          trend="Until 8am tomorrow"
        />
        <StatCard 
          icon={<Calendar />} 
          label="Services This Week" 
          value="8" 
          trend="2 today, 6 upcoming"
        />
        <StatCard 
          icon={<MapPin />} 
          label="Rooms Booked" 
          value="3/5" 
          trend="Chapel A, Viewing 1, 2"
        />
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setView('calendar')}
          className={view === 'calendar' ? 'btn-primary' : 'btn-secondary'}
        >
          Calendar View
        </button>
        <button 
          onClick={() => setView('list')}
          className={view === 'list' ? 'btn-primary' : 'btn-secondary'}
        >
          List View
        </button>
      </div>

      {/* Module cards for each use case */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ModuleCard 
          title="Staff Shifts"
          description="Assign staff to shifts and manage coverage"
          icon={<Users />}
          onClick={() => {/* TODO: Implement */}}
        />
        <ModuleCard 
          title="On-Call Rotation"
          description="24/7 director on-call scheduling"
          icon={<Clock />}
          onClick={() => {/* TODO: Implement */}}
        />
        <ModuleCard 
          title="Room Bookings"
          description="Schedule chapels, viewing rooms, prep rooms"
          icon={<MapPin />}
          onClick={() => {/* TODO: Implement */}}
        />
        {/* Add cards for remaining 12 use cases */}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, trend }: any) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-xs text-gray-400 mt-1">{trend}</div>
    </div>
  );
}

function ModuleCard({ title, description, icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:border-[--navy] hover:shadow-md transition text-left"
    >
      <div className="text-[--navy] mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}
EOF

echo "✅ Created scheduling page"
```

**AI Agent Validation**:
```bash
# 1. Page exists
test -f src/app/staff/scheduling/page.tsx && echo "✅ Scheduling page exists"

# 2. No TypeScript errors
pnpm type-check 2>&1 | grep -q "scheduling/page.tsx" && echo "❌ TypeScript errors" || echo "✅ No errors"

# 3. Page renders
curl -s http://localhost:3000/staff/scheduling | grep -q "Scheduling" && echo "✅ Page renders"
```

**Repeat similar structure for**:

#### Task 2.2: Inventory Module (8 hours)
```bash
mkdir -p src/app/staff/inventory
# Create page with:
# - Stock levels grid
# - Low stock alerts
# - Transfer requests
# - Adjustment forms
```

#### Task 2.3: Prep Room Module (10 hours)
```bash
mkdir -p src/app/staff/prep-room
# Create page with:
# - Embalming schedule
# - Restoration tracking
# - Chemical inventory
# - Case assignment
```

#### Task 2.4: Pre-Planning Module (8 hours)
```bash
mkdir -p src/app/staff/pre-planning
# Create page with:
# - Consultation calendar
# - Contract templates
# - Follow-up pipeline
# - Payment plans
```

### Task 2.5: Module Page Template Generator
**Duration**: 4 hours

**AI Agent Instructions**: Create reusable template generator

```typescript
// scripts/generate-module-page.ts
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface ModuleConfig {
  name: string;
  path: string;
  description: string;
  useCases: { title: string; description: string }[];
  stats: { label: string; value: string }[];
}

function generateModulePage(config: ModuleConfig): string {
  return `'use client';

import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function ${config.name}Page() {
  return (
    <DashboardLayout 
      title="${config.name}" 
      subtitle="${config.description}"
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        ${config.stats.map(stat => `
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold">${stat.value}</div>
          <div className="text-sm text-gray-600">${stat.label}</div>
        </div>
        `).join('')}
      </div>

      {/* Use Case Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${config.useCases.map(uc => `
        <div className="bg-white rounded-lg border p-6 hover:shadow-md transition">
          <h3 className="text-lg font-semibold mb-2">${uc.title}</h3>
          <p className="text-sm text-gray-600">${uc.description}</p>
        </div>
        `).join('')}
      </div>
    </DashboardLayout>
  );
}
`;
}

// Usage
const modulesConfig: ModuleConfig[] = [
  {
    name: 'Documents',
    path: 'documents',
    description: 'Generate, manage, and track documents',
    useCases: [
      { title: 'Generate Death Certificate', description: 'Auto-fill and generate certificates' },
      { title: 'Contract Templates', description: 'Manage and customize templates' },
      // ... more use cases
    ],
    stats: [
      { label: 'Pending Signatures', value: '5' },
      { label: 'Generated Today', value: '12' },
    ],
  },
  // ... more modules
];

// Generate all pages
modulesConfig.forEach(config => {
  const dirPath = join(process.cwd(), 'src/app/staff', config.path);
  mkdirSync(dirPath, { recursive: true });
  
  const pagePath = join(dirPath, 'page.tsx');
  const content = generateModulePage(config);
  writeFileSync(pagePath, content);
  
  console.log(`✅ Generated ${config.name} module page`);
});
```

**Run generator**:
```bash
npx tsx scripts/generate-module-page.ts
```

### Priority 2 Modules (Week 3 - 40 hours)

Repeat similar process for:
- Documents (7 use cases)
- Memorial (7 use cases)
- Calendar Sync (6 use cases)
- Email Sync (5 use cases)
- PTO Management (10 use cases)
- HR (5 use cases)
- Notes (8 use cases)
- Interactions (5 use cases)

### Phase 2 Checkpoint

**AI Agent Validation**:
```bash
echo "=== Phase 2 Validation ==="

# 1. Count created pages
page_count=$(find src/app/staff -name "page.tsx" -not -path "*/_backups/*" | wc -l)
echo "Pages created: $page_count (expected: 30+)"

# 2. All pages compile
pnpm type-check && echo "✅ TypeScript compiles"

# 3. All pages render
for page in src/app/staff/*/page.tsx; do
  route=$(echo $page | sed 's|src/app||;s|/page.tsx||')
  curl -s "http://localhost:3000$route" | grep -q "DashboardLayout" && echo "✅ $route renders" || echo "❌ $route broken"
done

# 4. Navigation links work
echo "⚠️ MANUAL: Click through all nav items in sidebar"

echo "=== Phase 2 Complete ==="
```

**Success Criteria**:
- ✅ 19 new module pages created
- ✅ All pages compile without errors
- ✅ All pages render in browser
- ✅ Navigation links work
- ✅ No 404 errors

---

## 🎨 Phase 3: Component Integration (Week 4)

**Goal**: Replace basic UI with modern components  
**Duration**: 40 hours  
**Risk Level**: Medium (styling conflicts possible)

### Task 3.1: Dashboard Enhancement
**Duration**: 8 hours

**AI Agent Instructions**: Replace static dashboard with animated components

```tsx
// BEFORE: src/app/staff/dashboard/page.tsx
<div className="grid grid-cols-4 gap-4">
  <div>Total Cases: {stats.totalCases}</div>
</div>

// AFTER: Use SuccessCelebration and animations
import { SuccessCelebration } from '@dykstra/ui';
import { motion } from 'framer-motion';

<div className="grid grid-cols-4 gap-4">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
  >
    <MetricCard
      title="Total Cases"
      value={stats.totalCases}
      trend="+12%"
      onClick={() => setShowCelebration(true)}
    />
  </motion.div>
</div>

<SuccessCelebration
  show={showCelebration}
  message="Great work!"
  submessage="You've processed 50 cases this month"
  onComplete={() => setShowCelebration(false)}
/>
```

**AI Agent Validation**:
```bash
# Check SuccessCelebration is imported
grep -q "SuccessCelebration" src/app/staff/dashboard/page.tsx && echo "✅ SuccessCelebration integrated"

# Check Framer Motion is used
grep -q "motion\." src/app/staff/dashboard/page.tsx && echo "✅ Animations added"
```

### Task 3.2: Replace Search Inputs
**Duration**: 6 hours

**AI Agent Instructions**: Find all search inputs and replace with PredictiveSearch

```bash
# Find all search inputs
grep -r "input.*search" src/app/staff --include="*.tsx" | cut -d: -f1 | sort -u

# For each file, replace:
# BEFORE
<input type="text" placeholder="Search..." />

# AFTER
import { PredictiveSearch } from '@dykstra/ui';

<PredictiveSearch
  value={searchQuery}
  onChange={setSearchQuery}
  results={searchResults}
  onSelectResult={handleSelect}
  placeholder="Search cases, families, payments..."
/>
```

### Task 3.3: Add Timeline to Case Details
**Duration**: 8 hours

**AI Agent Instructions**:

```tsx
// src/app/staff/cases/[id]/page.tsx
import { Timeline } from '@dykstra/ui';

// Add activity timeline
<Timeline
  events={[
    {
      id: '1',
      title: 'Case Created',
      description: 'Initial inquiry received',
      timestamp: new Date('2024-01-15'),
      icon: <Plus />,
      type: 'success',
    },
    {
      id: '2',
      title: 'Contract Signed',
      description: 'Family signed service agreement',
      timestamp: new Date('2024-01-16'),
      icon: <FileText />,
      type: 'success',
    },
    // ... more events
  ]}
/>
```

### Task 3.4: Add FriendlyError Boundaries
**Duration**: 6 hours

**AI Agent Instructions**: Wrap all pages in error boundaries

```tsx
// src/app/staff/[module]/page.tsx
import { ErrorBoundary } from '@dykstra/ui';
import { FriendlyError } from '@dykstra/ui';

export default function ModulePage() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <FriendlyError
          error={error}
          onReset={reset}
          message="Oops! Something went wrong"
          submessage="Don't worry, we've logged the error and our team is on it."
        />
      )}
    >
      {/* Page content */}
    </ErrorBoundary>
  );
}
```

### Task 3.5: Add AI Assistant Bubble
**Duration**: 8 hours

**AI Agent Instructions**: Add global AI assistant

```tsx
// src/app/staff/layout.tsx
import { AIAssistantBubble } from '@dykstra/ui';

export default function StaffLayout({ children }) {
  return (
    <>
      {/* Existing layout */}
      {children}
      
      {/* AI Assistant - always visible */}
      <AIAssistantBubble
        position="bottom-right"
        onMessage={handleAIMessage}
        suggestions={[
          'Create a new case',
          'Find a family',
          'Record a payment',
          'Schedule a service',
        ]}
      />
    </>
  );
}
```

### Task 3.6: Add Success Animations to Forms
**Duration**: 4 hours

**AI Agent Instructions**: Add celebrations to form submissions

```tsx
// Example: Payment recording
const handleSubmitPayment = async (data) => {
  await recordPayment(data);
  
  // Show celebration
  setShowCelebration(true);
  setTimeout(() => {
    router.push('/staff/payments');
  }, 3000);
};

return (
  <>
    <PaymentForm onSubmit={handleSubmitPayment} />
    
    <SuccessCelebration
      show={showCelebration}
      message="Payment Recorded!"
      submessage="$4,500 received from Smith Family"
    />
  </>
);
```

### Phase 3 Checkpoint

**AI Agent Validation**:
```bash
echo "=== Phase 3 Validation ==="

# 1. Count SuccessCelebration usage
celebration_count=$(grep -r "SuccessCelebration" src/app/staff --include="*.tsx" | wc -l)
echo "SuccessCelebration usage: $celebration_count (expected: 5+)"

# 2. Count PredictiveSearch usage
search_count=$(grep -r "PredictiveSearch" src/app/staff --include="*.tsx" | wc -l)
echo "PredictiveSearch usage: $search_count (expected: 3+)"

# 3. Count Timeline usage
timeline_count=$(grep -r "<Timeline" src/app/staff --include="*.tsx" | wc -l)
echo "Timeline usage: $timeline_count (expected: 2+)"

# 4. Count FriendlyError usage
error_count=$(grep -r "FriendlyError" src/app/staff --include="*.tsx" | wc -l)
echo "FriendlyError usage: $error_count (expected: 10+)"

# 5. AIAssistantBubble in layout
grep -q "AIAssistantBubble" src/app/staff/layout.tsx && echo "✅ AI Assistant active"

# 6. Visual inspection
echo "⚠️ MANUAL: Test animations, success celebrations, AI assistant"

echo "=== Phase 3 Complete ==="
```

---

## ⌨️ Phase 4: Command Palette (Week 5)

**Goal**: Add ⌘K command palette for power users  
**Duration**: 40 hours  
**Risk Level**: Low (isolated feature)

### Task 4.1: Install cmdk
**Duration**: 30 minutes

```bash
pnpm add cmdk
pnpm add -D @types/cmdk
```

### Task 4.2: Create Command Palette Component
**Duration**: 8 hours

**AI Agent Instructions**:

```tsx
// src/components/command-palette.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { 
  Search, Plus, DollarSign, FileText, 
  Users, Calendar, Package, Clock 
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  // Close on Escape
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onOpenChange]);

  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={onOpenChange}
      label="Command Menu"
      className="command-palette"
    >
      <Command.Input 
        value={search}
        onValueChange={setSearch}
        placeholder="Type a command or search..."
      />
      
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>

        <Command.Group heading="Quick Actions">
          <Command.Item onSelect={() => router.push('/staff/cases/new')}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Case</span>
            <kbd className="ml-auto">⌘N</kbd>
          </Command.Item>
          <Command.Item onSelect={() => router.push('/staff/payments/new')}>
            <DollarSign className="mr-2 h-4 w-4" />
            <span>Record Payment</span>
            <kbd className="ml-auto">⌘P</kbd>
          </Command.Item>
          <Command.Item onSelect={() => router.push('/staff/contracts/new')}>
            <FileText className="mr-2 h-4 w-4" />
            <span>New Contract</span>
            <kbd className="ml-auto">⌘C</kbd>
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Navigation">
          <Command.Item onSelect={() => router.push('/staff/dashboard')}>
            <span>Dashboard</span>
          </Command.Item>
          <Command.Item onSelect={() => router.push('/staff/cases')}>
            <span>Cases</span>
          </Command.Item>
          <Command.Item onSelect={() => router.push('/staff/scheduling')}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Scheduling</span>
          </Command.Item>
          <Command.Item onSelect={() => router.push('/staff/inventory')}>
            <Package className="mr-2 h-4 w-4" />
            <span>Inventory</span>
          </Command.Item>
          {/* Add all 30 modules here */}
        </Command.Group>

        <Command.Group heading="Recent">
          {/* Dynamic recent items */}
          <Command.Item onSelect={() => router.push('/staff/cases/case-123')}>
            <span>Johnson Family - Traditional Burial</span>
            <span className="ml-auto text-xs text-gray-500">2 min ago</span>
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
```

### Task 4.3: Add Keyboard Shortcuts
**Duration**: 4 hours

```tsx
// src/components/command-palette-provider.tsx
'use client';

import { useState, useEffect } from 'react';
import { CommandPalette } from './command-palette';

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
```

### Task 4.4: Integrate into Layout
**Duration**: 2 hours

```tsx
// src/app/staff/layout.tsx
import { CommandPaletteProvider } from '@/components/command-palette-provider';

export default function StaffLayout({ children }) {
  return (
    <CommandPaletteProvider>
      {/* Existing layout */}
      {children}
    </CommandPaletteProvider>
  );
}
```

### Task 4.5: Style Command Palette
**Duration**: 4 hours

```css
/* src/app/globals.css */

.command-palette {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  
  width: 90%;
  max-width: 640px;
  max-height: 400px;
  
  background: white;
  border-radius: 12px;
  box-shadow: 0 16px 70px rgba(0, 0, 0, 0.3);
  
  overflow: hidden;
  z-index: 100;
}

.command-palette [cmdk-input] {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  outline: none;
}

.command-palette [cmdk-list] {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
}

.command-palette [cmdk-group-heading] {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.command-palette [cmdk-item] {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.command-palette [cmdk-item]:hover {
  background: #f3f4f6;
}

.command-palette [cmdk-item][data-selected="true"] {
  background: var(--navy);
  color: white;
}

.command-palette kbd {
  padding: 2px 6px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
}
```

### Task 4.6: Add All 119 Use Cases as Commands
**Duration**: 16 hours

**AI Agent Instructions**: Systematically add all use cases

```typescript
// src/lib/commands.ts
export const commands = [
  // Case Management (7 commands)
  { id: 'case-new', label: 'New Case', shortcut: '⌘N', route: '/staff/cases/new', group: 'Quick Actions' },
  { id: 'case-convert-lead', label: 'Convert Lead to Case', route: '/staff/cases/convert', group: 'Cases' },
  
  // Scheduling (15 commands)
  { id: 'schedule-staff', label: 'Schedule Staff Shift', route: '/staff/scheduling/shifts/new', group: 'Scheduling' },
  { id: 'schedule-oncall', label: 'On-Call Rotation', route: '/staff/scheduling/on-call', group: 'Scheduling' },
  
  // Financial (20 commands)
  { id: 'payment-record', label: 'Record Payment', shortcut: '⌘P', route: '/staff/payments/new', group: 'Quick Actions' },
  { id: 'invoice-create', label: 'Create Invoice', route: '/staff/finops/invoices/new', group: 'Finance' },
  
  // ... Add all 119 use cases
];

// Group commands by category
export const commandsByGroup = commands.reduce((acc, cmd) => {
  if (!acc[cmd.group]) acc[cmd.group] = [];
  acc[cmd.group].push(cmd);
  return acc;
}, {} as Record<string, typeof commands>);
```

### Task 4.7: Add Search to Commands
**Duration**: 6 hours

```tsx
// Enhance command palette with fuzzy search
import Fuse from 'fuse.js';
import { commands } from '@/lib/commands';

const fuse = new Fuse(commands, {
  keys: ['label', 'group'],
  threshold: 0.3,
});

// In CommandPalette component
const filteredCommands = search 
  ? fuse.search(search).map(result => result.item)
  : commands;
```

### Phase 4 Checkpoint

**AI Agent Validation**:
```bash
echo "=== Phase 4 Validation ==="

# 1. cmdk installed
pnpm list cmdk && echo "✅ cmdk installed"

# 2. CommandPalette component exists
test -f src/components/command-palette.tsx && echo "✅ Component exists"

# 3. Provider integrated
grep -q "CommandPaletteProvider" src/app/staff/layout.tsx && echo "✅ Provider integrated"

# 4. Keyboard shortcut works
echo "⚠️ MANUAL: Press ⌘K and verify palette opens"

# 5. All 119 commands added
cmd_count=$(grep -o "id: " src/lib/commands.ts | wc -l)
echo "Commands defined: $cmd_count (expected: 119)"

# 6. Search works
echo "⚠️ MANUAL: Type in command palette and verify fuzzy search"

echo "=== Phase 4 Complete ==="
```

---

## ✨ Phase 5: Polish & Delight (Week 6)

**Goal**: Add micro-interactions and final polish  
**Duration**: 40 hours  
**Risk Level**: Low (pure enhancement)

### Task 5.1: Add Hover Animations
**Duration**: 8 hours

**AI Agent Instructions**: Add hover states to all interactive elements

```tsx
// Add to all cards, buttons, links
<motion.div
  whileHover={{ scale: 1.02, y: -2 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 300 }}
>
  {/* Content */}
</motion.div>
```

### Task 5.2: Add Loading States
**Duration**: 6 hours

```tsx
// Use Skeleton component everywhere
import { Skeleton } from '@dykstra/ui';

{isLoading ? (
  <Skeleton className="h-32 w-full" />
) : (
  <MetricCard {...} />
)}
```

### Task 5.3: Add Empty States
**Duration**: 8 hours

```tsx
// Create delightful empty states
<EmptyState
  icon={<FolderOpen className="w-16 h-16 text-gray-300" />}
  title="No cases yet"
  description="Get started by creating your first case"
  action={
    <button onClick={() => router.push('/staff/cases/new')}>
      <Plus /> New Case
    </button>
  }
/>
```

### Task 5.4: Add Toast Notifications
**Duration**: 4 hours

```tsx
// Replace basic alerts with toast
import { toast } from 'sonner';

toast.success('Payment recorded successfully', {
  description: '$4,500 from Smith Family',
  action: {
    label: 'View',
    onClick: () => router.push('/staff/payments'),
  },
});
```

### Task 5.5: Add Tooltips Everywhere
**Duration**: 6 hours

```tsx
// Add helpful tooltips
import { Tooltip } from '@dykstra/ui';

<Tooltip content="Assign staff to shift" side="top">
  <button>
    <Users className="w-4 h-4" />
  </button>
</Tooltip>
```

### Task 5.6: Add Keyboard Shortcuts Hints
**Duration**: 4 hours

```tsx
// Show keyboard shortcuts in UI
<button>
  New Case
  <kbd className="ml-auto">⌘N</kbd>
</button>
```

### Task 5.7: Performance Optimization
**Duration**: 4 hours

```bash
# 1. Run Lighthouse
pnpm build
pnpm start
# Navigate to /staff/dashboard
# Run Lighthouse audit

# 2. Check bundle size
pnpm run analyze

# 3. Optimize images
# 4. Add lazy loading
```

### Phase 5 Checkpoint

**AI Agent Validation**:
```bash
echo "=== Phase 5 Validation ==="

# 1. Lighthouse score
echo "⚠️ MANUAL: Run Lighthouse, target score 90+"

# 2. No layout shift
echo "⚠️ MANUAL: Verify no CLS (Cumulative Layout Shift)"

# 3. Fast interactions
echo "⚠️ MANUAL: All interactions feel instant (<100ms)"

# 4. Animations smooth
echo "⚠️ MANUAL: All animations at 60fps"

# 5. Tooltips everywhere
tooltip_count=$(grep -r "Tooltip" src/app/staff --include="*.tsx" | wc -l)
echo "Tooltips: $tooltip_count (expected: 20+)"

echo "=== Phase 5 Complete ==="
```

---

## ✅ Final Validation Checkpoints

### Comprehensive System Check

**Run before declaring completion**:

```bash
#!/bin/bash
# scripts/validate-ux-transformation.sh

echo "========================================="
echo "  UX Transformation Validation"
echo "========================================="
echo ""

# 1. TypeScript Compilation
echo "1️⃣  Checking TypeScript..."
pnpm type-check && echo "✅ TypeScript compiles" || { echo "❌ TypeScript errors"; exit 1; }

# 2. Tests Pass
echo "2️⃣  Running tests..."
pnpm test && echo "✅ Tests pass" || echo "⚠️  Some tests fail (document failures)"

# 3. E2E Tests
echo "3️⃣  Running E2E tests..."
pnpm test:e2e:staff --project=chromium && echo "✅ E2E tests pass"

# 4. Build Succeeds
echo "4️⃣  Building production..."
pnpm build && echo "✅ Production build succeeds"

# 5. No Console Errors
echo "5️⃣  Checking for console errors..."
echo "⚠️  MANUAL: Start dev server and check browser console"

# 6. All Routes Accessible
echo "6️⃣  Checking routes..."
route_count=$(find src/app/staff -name "page.tsx" | wc -l)
echo "   Found $route_count pages (expected: 30+)"

# 7. Components Integrated
echo "7️⃣  Checking component integration..."
grep -r "PredictiveSearch" src/app/staff --include="*.tsx" | wc -l | xargs echo "   PredictiveSearch usage:"
grep -r "SuccessCelebration" src/app/staff --include="*.tsx" | wc -l | xargs echo "   SuccessCelebration usage:"
grep -r "Timeline" src/app/staff --include="*.tsx" | wc -l | xargs echo "   Timeline usage:"
grep -r "FriendlyError" src/app/staff --include="*.tsx" | wc -l | xargs echo "   FriendlyError usage:"

# 8. Command Palette
echo "8️⃣  Checking command palette..."
grep -q "CommandPalette" src/app/staff/layout.tsx && echo "✅ Command palette integrated"

# 9. Layout Enhanced
echo "9️⃣  Checking layout..."
grep -q "WorkspaceNavigation\|NavSection" src/app/staff/layout.tsx && echo "✅ Enhanced layout active"

# 10. Performance
echo "🔟  Performance check..."
echo "⚠️  MANUAL: Run Lighthouse audit (target: 90+ score)"

echo ""
echo "========================================="
echo "  Validation Complete"
echo "========================================="
```

### World-Class UX Checklist

**AI Agent must verify ALL items before declaring success**:

- [ ] **Navigation**
  - [ ] ✅ Enhanced layout with workspace grouping active
  - [ ] ✅ All 30+ modules visible in sidebar
  - [ ] ✅ Collapsible sections work
  - [ ] ✅ Role-based badges visible
  - [ ] ✅ No broken links (no 404s)

- [ ] **Search & Discovery**
  - [ ] ✅ Command palette (⌘K) works
  - [ ] ✅ PredictiveSearch integrated (3+ locations)
  - [ ] ✅ Fuzzy search works
  - [ ] ✅ Recent items show
  - [ ] ✅ Keyboard navigation works

- [ ] **Interactions**
  - [ ] ✅ Hover animations on cards (60fps)
  - [ ] ✅ Success celebrations on form submissions
  - [ ] ✅ Loading states everywhere (skeletons)
  - [ ] ✅ Error states friendly (FriendlyError)
  - [ ] ✅ Toast notifications (not alerts)

- [ ] **Visual Polish**
  - [ ] ✅ Consistent spacing (8px grid)
  - [ ] ✅ Proper typography hierarchy
  - [ ] ✅ Semantic colors (status, success, error)
  - [ ] ✅ Dark mode support (if applicable)
  - [ ] ✅ Responsive (mobile, tablet, desktop)

- [ ] **Performance**
  - [ ] ✅ Lighthouse score 90+
  - [ ] ✅ No CLS (Cumulative Layout Shift)
  - [ ] ✅ Fast interactions (<100ms)
  - [ ] ✅ Smooth animations (60fps)
  - [ ] ✅ Code split (lazy loading)

- [ ] **Accessibility**
  - [ ] ✅ Keyboard navigation works
  - [ ] ✅ Screen reader compatible
  - [ ] ✅ WCAG 2.1 AA compliant
  - [ ] ✅ Focus indicators visible
  - [ ] ✅ Alt text on images

- [ ] **Features**
  - [ ] ✅ 19 new module pages created
  - [ ] ✅ All 119 use cases exposed
  - [ ] ✅ Timeline views active
  - [ ] ✅ AI assistant bubble visible
  - [ ] ✅ Empty states delightful

---

## 🔄 Rollback Procedures

### If Phase 1 Fails (Layout Issues)

```bash
# Restore old layout
cp src/app/staff/_backups/layout-basic-*.tsx src/app/staff/layout.tsx

# Restart dev server
pnpm dev

# Verify old layout works
curl http://localhost:3000/staff/dashboard
```

### If Phase 2 Fails (Module Pages Broken)

```bash
# Delete problematic module
rm -rf src/app/staff/[module]

# Restore placeholder
cat > src/app/staff/[module]/page.tsx << 'EOF'
export default function Page() {
  return <div>Under Development</div>;
}
EOF
```

### If Phase 3 Fails (Component Integration)

```bash
# Git revert specific files
git checkout src/app/staff/dashboard/page.tsx

# Or revert entire commit
git revert [commit-hash]
```

### Complete Rollback (Nuclear Option)

```bash
# Restore entire staff directory from backup
git log --oneline src/app/staff
git checkout [commit-before-changes] src/app/staff

# Restore layout
cp src/app/staff/_backups/layout-basic-*.tsx src/app/staff/layout.tsx
```

---

## 📝 Progress Tracking

**AI Agent should update this after each phase**:

```markdown
## Progress Log

### Phase 1: Layout Activation
- [x] Task 1.1: Backup current layout ✅ 2024-12-03
- [x] Task 1.2: Activate enhanced layout ✅ 2024-12-03
- [x] Task 1.3: Fix import paths ✅ 2024-12-03
- [x] Task 1.4: Create placeholder pages ✅ 2024-12-03
- [x] Task 1.5: Test enhanced layout ✅ 2024-12-03
- [x] Task 1.6: Update documentation ✅ 2024-12-03
- **Status**: ✅ COMPLETE

### Phase 2: Module Exposure
- [ ] Task 2.1: Scheduling module ⏳ In Progress
- [ ] Task 2.2: Inventory module
- [ ] Task 2.3: Prep room module
- [ ] Task 2.4: Pre-planning module
- [ ] Task 2.5: Template generator
- **Status**: 🟡 IN PROGRESS (40% complete)

### Phase 3: Component Integration
- [ ] Not started
- **Status**: ⏸️  WAITING

### Phase 4: Command Palette
- [ ] Not started
- **Status**: ⏸️  WAITING

### Phase 5: Polish & Delight
- [ ] Not started
- **Status**: ⏸️  WAITING
```

---

## 🎯 Success Criteria Summary

**Project is complete when**:

1. ✅ All 30+ modules accessible via enhanced layout
2. ✅ 19 new module pages created and functional
3. ✅ Modern components integrated (PredictiveSearch, SuccessCelebration, Timeline, etc.)
4. ✅ Command palette (⌘K) works with all 119 use cases
5. ✅ Animations smooth (60fps)
6. ✅ No console errors
7. ✅ Lighthouse score 90+
8. ✅ All tests pass
9. ✅ Production build succeeds
10. ✅ User feedback positive ("Feels like Linear/Notion!")

---

## 📞 Support & Questions

**For AI Agent**:
- If stuck on any task, document the issue in progress log
- If validation fails, run rollback procedure
- If unsure about implementation, refer to existing components in `packages/ui/src/components`
- Always run validation after each phase

**For Human Developer**:
- Review progress log regularly
- Test manually after each phase
- Provide feedback on UX
- Approve go-live after Phase 5

---

**END OF IMPLEMENTATION PLAN**

This plan is designed to be followed systematically by an AI agent. Each task has clear instructions, validation steps, and rollback procedures.

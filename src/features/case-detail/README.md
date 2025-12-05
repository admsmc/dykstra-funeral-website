# Case Detail Feature

**Purpose**: Comprehensive case management with 9-tab interface for viewing and managing all aspects of a funeral case.

## Structure

```
case-detail/
├── components/         # 13 UI components (header, tabs, forms)
├── hooks/             # 4 custom hooks for data fetching and mutations
├── view-models/       # CaseDetailViewModel for formatting
├── types/             # TabType, CaseDetailData, TabConfig
└── index.ts           # Public API
```

## Components

### Header Components (3)
- **CaseDetailHeader** - Page header with back link, case info, action buttons
- **QuickStatsCards** - 4-card grid (service date, type, created, updated)
- **TabNavigation** - 9-tab navigation with icons and active states

### Tab Components (10)
- **OverviewTab** - Decedent info, staff assignments, financial summary, tasks
- **FamiliesTab** - Family invitation management with filtering
- **InvitationForm** - Send family invitations (nested component)
- **ArrangementsTab** - Service arrangements (placeholder)
- **ContractTab** - Contract details (placeholder)
- **PaymentsTab** - Payment history (placeholder)
- **MemorialTab** - Memorial page management (placeholder)
- **DocumentsTab** - Case documents (placeholder)
- **TimelineTab** - Activity history (placeholder)
- **InternalNotesTab** - Staff-only notes with CRUD operations

## Hooks

- **useCaseDetail** - Main case data fetching with ViewModel
- **useTabState** - Tab navigation state management
- **useInternalNotes** - Internal notes CRUD with mutations
- **useFamilyInvitations** - Family invitation management with filtering

## ViewModels

- **CaseDetailViewModel** - Formats case data for display
  - Computed properties: `decedentName`, `caseNumberShort`, `caseType`, `status`
  - Badge configs: `statusBadgeConfig` (yellow/green/blue based on status)
  - Date formatting: `formattedServiceDate`, `formattedCreatedDate`, `formattedUpdatedDate`

## Usage

```typescript
import { useCaseDetail, useTabState, CaseDetailHeader, TabNavigation } from '@/features/case-detail';

export default function CaseDetailPage() {
  const { viewModel, isLoading, error } = useCaseDetail(caseId);
  const { activeTab, setActiveTab } = useTabState();
  
  return (
    <>
      <CaseDetailHeader viewModel={viewModel} />
      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );
}
```

## Page Reduction
- **Before**: 856 lines (9 tab components in one file)
- **After**: 125 lines (orchestrating page)
- **Reduction**: 85.4%

## Key Features
- 9-tab interface for comprehensive case management
- Family invitation system with email magic links
- Staff-only internal notes with edit history
- Real-time status tracking

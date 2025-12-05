# Templates Feature

**Purpose**: Template analytics dashboard displaying usage statistics, performance metrics, and trends for memorial document templates.

## Structure

```
templates/
├── components/          # Feature-specific UI components
├── hooks/              # Custom hooks for data fetching
├── view-models/        # Data transformation and formatting
├── types/              # TypeScript type definitions
└── index.ts            # Public API (barrel export)
```

## Components

- **AnalyticsDashboard** - Main dashboard orchestrating all analytics views
- **AnalyticsFilters** - Date range and category filtering
- **StatsGrid** - Key metrics cards (total generations, success rate, avg duration, error rate)
- **TrendChart** - Top templates usage visualization
- **RecentErrors** - Error log display

## Hooks

- **useTemplateAnalytics** - Fetches analytics data with date/category filters, returns ViewModel

## ViewModels

- **TemplateAnalyticsViewModel** - Formats analytics data for display
  - Computed properties: `totalGenerations`, `successRate`, `avgDuration`, `errorRate`
  - Badge configs: `statusVariant` (success/warning/error based on success rate)
  - Top templates: formatted usage count and success rate

## Usage

```typescript
import { AnalyticsDashboard } from '@/features/templates';

export default function TemplateAnalyticsPage() {
  return <AnalyticsDashboard />;
}
```

## Page Reduction
- **Before**: 324 lines (monolithic page component)
- **After**: 56 lines (orchestrating page)
- **Reduction**: 82.7%

## Dependencies
- `@dykstra/ui` - Design system components
- `@/lib/trpc-client` - API client
- `lucide-react` - Icons

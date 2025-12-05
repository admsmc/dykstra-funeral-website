# ADR 002: Feature Module Structure

**Status**: Accepted  
**Date**: December 2025  
**Deciders**: Development Team  
**Context**: Phase 2 - Presentation Layer Architecture

## Context and Problem Statement

React codebase lacked clear organization:
- Components scattered across `src/components/` (flat structure)
- No clear ownership of feature-specific code
- Difficult to locate related files (components, hooks, types)
- Poor code discoverability for new developers
- Tight coupling between unrelated features

## Decision Drivers

- **Scalability**: Support 50+ features without file sprawl
- **Cohesion**: Group related code together
- **Encapsulation**: Hide implementation details via public API
- **Discoverability**: Make codebase navigable by feature
- **Maintainability**: Enable feature-level refactoring

## Considered Options

1. **Feature Modules** (Selected)
2. Continue flat component directory
3. Domain-driven folders (by entity type)
4. Atomic design structure

## Decision Outcome

**Chosen**: Feature Module structure with barrel exports

Each feature is a self-contained module with:
- Private implementation details (components, hooks, ViewModels)
- Public API via `index.ts` barrel export
- Consistent internal structure

### Implementation Pattern

```
src/features/{feature}/
├── components/         # Feature-specific UI components
├── hooks/             # Custom hooks for data fetching
├── view-models/       # Data transformation and formatting
├── types/             # TypeScript type definitions
├── constants/         # Static data (optional)
├── README.md          # Feature documentation
└── index.ts           # Public API barrel export
```

**Example**: `src/features/case-detail/index.ts`
```typescript
// Public API - only export what consumers need
export { CaseDetailPage } from './CaseDetailPage';
export type { CaseData, CaseActivity } from './types';

// Keep components/, hooks/, view-models/ private
```

### Results

- **9 feature modules** created in Phase 2
- **118 files** organized with clear ownership
- **48 reusable components** with feature-scoped imports
- **23 custom hooks** encapsulated within features
- **19 ViewModels** co-located with consuming components

### Positive Consequences

- **Clear boundaries**: Features don't leak implementation details
- **Better imports**: `import { CaseDetailPage } from '@/features/case-detail'` (clean API surface)
- **Easier refactoring**: Change internal structure without breaking consumers
- **Improved onboarding**: Developers understand feature scope immediately
- **Test isolation**: Test entire feature in isolation

### Negative Consequences

- **More directories**: Nested structure requires navigation
- **Barrel export discipline**: Must maintain `index.ts` carefully
- **Circular dependency risk**: Requires linting rules to prevent

## Implementation Guidelines

### When to Create a Feature Module

✅ **Create a feature module when**:
- Page/feature requires 3+ components
- Logic spans multiple files (hooks, ViewModels, types)
- Feature may be reused or extended later

❌ **Don't create a feature module when**:
- Single-component page with no additional logic
- Simple static content page
- Truly reusable components (use `@/components/shared/` instead)

### Naming Conventions

- **Directory**: kebab-case (`case-detail`, `contract-builder`)
- **Components**: PascalCase (`CaseDetailPage.tsx`, `ActivityTimeline.tsx`)
- **Hooks**: camelCase with `use` prefix (`useCaseData.ts`)
- **ViewModels**: camelCase with `ViewModel` suffix (`caseDetailViewModel.ts`)

### Public API Guidelines

Only export:
- Main page component(s)
- Public types consumed by other features
- Reusable components intended for cross-feature use

Keep private:
- Internal components (only used within feature)
- Hooks (unless explicitly designed for reuse)
- ViewModels (always private)
- Constants (unless part of shared configuration)

## Validation

Phase 2 created 9 feature modules with consistent structure:

| Feature | Components | Hooks | ViewModels | Types |
|---------|-----------|-------|------------|-------|
| case-detail | 10 | 2 | 1 | 4 |
| contract-builder | 5 | 2 | 1 | 1 |
| template-editor | 4 | 2 | 0 | 2 |
| template-library | 4 | 1 | 1 | 1 |
| payment-detail | 6 | 1 | 1 | 3 |

All 9 modules follow identical structure, proving pattern consistency.

## Related Decisions

- [ADR 001: ViewModel Pattern](./001-viewmodel-pattern.md)
- [ADR 003: Effect-TS for Business Logic](./003-effect-ts-adoption.md)

## References

- [PHASE_2_COMPLETE_ALL_9_FEATURES.md](../../PHASE_2_COMPLETE_ALL_9_FEATURES.md)
- [Feature README Examples](../../src/features/*/README.md)

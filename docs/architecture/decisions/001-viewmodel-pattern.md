# ADR 001: ViewModel Pattern for Presentation Logic

**Status**: Accepted  
**Date**: December 2025  
**Deciders**: Development Team  
**Context**: Phase 2 - Presentation Layer Architecture

## Context and Problem Statement

React components were tightly coupled to business logic, containing:
- Complex data transformations inline
- Formatting logic mixed with rendering
- Derived calculations in component bodies
- No reusability of presentation logic

Pages exceeded 1,000 lines with 80%+ being display logic. Testing presentation logic required mounting full component trees.

## Decision Drivers

- **Separation of Concerns**: Decouple presentation logic from UI rendering
- **Testability**: Test presentation logic in isolation without React
- **Reusability**: Share formatting/computation logic across features
- **Maintainability**: Reduce component complexity and cognitive load
- **Performance**: Enable memoization of expensive calculations

## Considered Options

1. **ViewModel Pattern** (Selected)
2. Keep logic in components with custom hooks
3. Use Redux selectors
4. Implement BLoC pattern

## Decision Outcome

**Chosen**: ViewModel Pattern with pure functions

ViewModels are pure functions that:
- Accept raw data and return formatted/computed data
- Contain zero React-specific logic (no hooks, no JSX)
- Are 100% unit testable without React
- Enable consistent formatting across the application

### Implementation Pattern

```typescript
// view-models/paymentDetailViewModel.ts
export function paymentDetailViewModel(payment: PaymentData) {
  return {
    // Formatted values
    displayAmount: formatCurrency(payment.amount),
    displayDate: formatDate(payment.date),
    statusBadgeColor: getStatusColor(payment.status),
    
    // Computed properties
    remainingBalance: payment.total - payment.amount,
    isFullyPaid: payment.amount >= payment.total,
    
    // UI state
    showRefundButton: payment.status === 'completed' && payment.amount > 0,
  };
}
```

### Results

- **Average 88.1% code reduction** (5,041 → 842 lines across 9 features)
- **Highest reduction: 91.8%** (Contract Builder: 1,101 → 90 lines)
- **48 reusable components** extracted
- **19 ViewModels** created with 100% unit test coverage
- **Zero new TypeScript errors**

### Positive Consequences

- Components focus solely on rendering (`return <div>`)
- Presentation logic is reusable and testable
- Consistent formatting across the application
- Easier onboarding (clear separation of concerns)
- Performance optimizations via memoization

### Negative Consequences

- Additional file per feature (managed via feature modules)
- Requires discipline to avoid logic creep back into components
- Slight learning curve for developers unfamiliar with pattern

## Validation

Phase 2 metrics validate this decision:

| Feature | Before | After | Reduction |
|---------|--------|-------|-----------|
| Contract Builder | 1,101 | 90 | 91.8% |
| Template Editor | 545 | 73 | 86.6% |
| Case Detail | 856 | 125 | 85.4% |

**Average across 9 features**: 88.1% reduction

## Related Decisions

- [ADR 002: Feature Module Structure](./002-feature-module-structure.md)
- [ADR 003: Effect-TS for Business Logic](./003-effect-ts-adoption.md)

## References

- [PHASE_2_COMPLETE_ALL_9_FEATURES.md](../../PHASE_2_COMPLETE_ALL_9_FEATURES.md)
- [Frontend Architecture Modernization Plan](../../packages/ui/Frontend%20Architecture%20Modernization_%20Enterprise-Grade%20Implementation%20Plan.md)

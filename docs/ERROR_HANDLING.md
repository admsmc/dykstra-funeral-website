# Error Handling System

## Overview

The error handling system uses React Error Boundaries to gracefully catch and handle JavaScript errors, preventing the entire app from crashing. It provides user-friendly fallback UIs and centralized error logging.

## Components

### Error Boundary Library (`src/components/error/`)

- **`ErrorBoundary.tsx`** (99 lines) - Class-based boundary component
- **`error-logger.ts`** (55 lines) - Centralized error logging
- **`TableErrorFallback.tsx`** (32 lines) - Table-specific fallback UI
- **`PageErrorFallback.tsx`** (56 lines) - Full-page fallback UI

### Next.js error.tsx Files

- `src/app/error.tsx` - Root error page
- `src/app/staff/error.tsx` - Staff section errors
- `src/app/staff/cases/error.tsx` - Cases page errors
- `src/app/staff/payments/error.tsx` - Payments page errors
- `src/app/staff/contracts/error.tsx` - Contracts page errors

## Usage

### Wrapping Components

```typescript
import { ErrorBoundary, TableErrorFallback } from '@/components/error';

export function CaseTable({ cases }) {
  return (
    <ErrorBoundary fallback={(error, reset) => (
      <TableErrorFallback error={error} reset={reset} />
    )}>
      <DataTable data={cases} ... />
    </ErrorBoundary>
  );
}
```

### Custom Fallback

```typescript
<ErrorBoundary fallback={(error, reset) => (
  <div>
    <h2>Custom Error UI</h2>
    <p>{error.message}</p>
    <button onClick={reset}>Try Again</button>
  </div>
)}>
  <MyComponent />
</ErrorBoundary>
```

### Automatic Page-Level Errors

Next.js automatically uses error.tsx files:

```typescript
// src/app/staff/cases/error.tsx
"use client";

import { useEffect } from 'react';
import { PageErrorFallback } from '@/components/error';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Cases page error:', error);
  }, [error]);

  return <PageErrorFallback error={error} reset={reset} />;
}
```

## Error Logging

Errors are logged via `error-logger.ts`:

- **Development**: Console.error with full stack trace
- **Production**: Ready for Sentry/LogRocket integration

```typescript
export interface ErrorLog {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  environment: string;
}
```

## Best Practices

✅ **Wrap critical components**: Tables, forms, modals  
✅ **Use appropriate fallbacks**: Table vs. Page fallbacks  
✅ **Log errors**: Always log for debugging  
✅ **Provide recovery**: "Try Again" buttons  
✅ **User-friendly messages**: Avoid technical jargon

❌ **Don't overuse**: Not every component needs a boundary  
❌ **Don't hide errors**: Log them even if handled gracefully  
❌ **Don't block recovery**: Always provide a way to retry

## Future Integration

### Sentry Setup

```typescript
// In error-logger.ts
import * as Sentry from '@sentry/nextjs';

export function logError(error: Error, errorInfo?: React.ErrorInfo): void {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      contexts: { react: errorInfo }
    });
  }
}
```

## Files Wrapped in ErrorBoundary

✅ CaseTable (staff/cases)  
✅ Payments DataTable (staff/payments)  
✅ Contracts DataTable (staff/contracts)  

**Note**: More components can be wrapped as needed.

# Toast Notification System

## Overview

The toast notification system provides non-intrusive feedback to users for actions, success states, errors, and informational messages. Built with React Context and custom components, it offers a clean API for triggering notifications throughout the application.

## Architecture

### Components

- **`Toast.tsx`** - Individual toast notification with auto-dismiss
- **`ToastProvider.tsx`** - React Context provider for global state management  
- **`useToast.ts`** - Hook for triggering toast notifications

### Location
```
src/components/toast/
├── Toast.tsx          (78 lines)
├── ToastProvider.tsx  (92 lines)
└── index.ts           (2 lines)
```

## Features

✅ **4 Variants**: success, error, warning, info  
✅ **Auto-dismiss**: 5 seconds default (configurable)  
✅ **Manual dismiss**: X button on each toast  
✅ **Stacking**: Max 3 toasts visible at once  
✅ **Animations**: Slide-in from top-right  
✅ **Hover pause**: Auto-dismiss pauses on hover  
✅ **Accessibility**: ARIA live regions for screen readers

## Usage

### Basic Setup

The `ToastProvider` is already integrated into the root layout at `src/app/providers.tsx`:

```typescript
import { ToastProvider } from '@/components/toast';

export function Providers({ children }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
```

###Using Toasts in Components

```typescript
import { useToast } from '@/components/toast';

export default function MyComponent() {
  const toast = useToast();

  const handleSubmit = async () => {
    try {
      await saveData();
      toast.success('Data saved successfully');
    } catch (error) {
      toast.error('Failed to save data');
    }
  };

  return <button onClick={handleSubmit}>Save</button>;
}
```

## API Reference

### `useToast()`

Returns an object with 4 methods:

```typescript
interface ToastContextValue {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}
```

### Toast Variants

#### Success
```typescript
toast.success('Payment recorded successfully');
toast.success('Case updated', 3000); // Custom duration
```
- Green background (#f0fdf4)
- Checkmark icon
- Use for: Successful mutations, completed actions

#### Error
```typescript
toast.error('Failed to update case status');
toast.error(`Error: ${error.message}`);
```
- Red background (#fef2f2)
- Alert circle icon
- Use for: Failed mutations, validation errors, API errors

#### Warning
```typescript
toast.warning('This action cannot be undone');
toast.warning('Please complete all required fields');
```
- Yellow background (#fffbeb)
- Alert triangle icon
- Use for: Warnings, confirmations needed, important notices

#### Info
```typescript
toast.info('New features available');
toast.info('System maintenance scheduled');
```
- Blue background (#eff6ff)
- Info icon
- Use for: Informational messages, tips, announcements

## Integration Examples

### With tRPC Mutations

```typescript
import { useToast } from '@/components/toast';
import { trpc } from '@/lib/trpc-client';

export default function PaymentModal() {
  const toast = useToast();

  const recordPaymentMutation = trpc.payment.recordManual.useMutation({
    onSuccess: () => {
      toast.success('Payment recorded successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });

  return (
    // Modal UI
  );
}
```

### With Form Validation

```typescript
import { useToast } from '@/components/toast';

export default function SignupForm() {
  const toast = useToast();

  const handleSubmit = (data) => {
    if (!data.email) {
      toast.warning('Email is required');
      return;
    }

    if (!validateEmail(data.email)) {
      toast.error('Invalid email format');
      return;
    }

    // Submit form
    toast.success('Account created successfully');
  };

  return (
    // Form UI
  );
}
```

### With Optimistic Updates

```typescript
import { useToast } from '@/components/toast';
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';

export default function CaseList() {
  const toast = useToast();

  const { mutate } = useOptimisticMutation({
    mutationFn: (data) => updateCase.mutateAsync(data),
    onOptimisticUpdate: (data) => {
      // Update UI immediately
    },
    rollback: () => {
      // Revert UI changes
    },
    onSuccess: () => {
      toast.success('Case updated');
    },
    onError: () => {
      toast.error('Failed to update case');
    },
  });

  return (
    // Component UI
  );
}
```

## Best Practices

### ✅ Do's

- **Use appropriate variants** - Match the toast type to the message intent
- **Keep messages concise** - Aim for 40-60 characters max
- **Include context** - "Payment recorded" is better than "Success"
- **Use for feedback** - Every user action should have feedback
- **Handle errors gracefully** - Include error messages when possible

### ❌ Don'ts

- **Don't stack too many** - System limits to 3, but try to avoid that
- **Don't use for critical errors** - Use modals for errors requiring acknowledgment
- **Don't repeat messages** - Avoid triggering multiple identical toasts
- **Don't use for long content** - Toasts auto-dismiss; use modals for lengthy content
- **Don't block user actions** - Toasts are non-blocking by design

## Accessibility

### Screen Reader Support

Toasts are announced to screen readers via ARIA live regions:

```tsx
<div
  className="..."
  aria-live="polite"
  aria-atomic="true"
>
  {toasts.map((toast) => (
    <Toast key={toast.id} {...toast} />
  ))}
</div>
```

- `aria-live="polite"` - Announced when screen reader is idle
- `aria-atomic="true"` - Reads entire message
- `role="alert"` - on individual toasts for importance

### Keyboard Navigation

- Toast dismiss buttons are keyboard accessible
- Focus management preserved (toasts don't steal focus)
- Escape key doesn't dismiss toasts (by design - they auto-dismiss)

## Configuration

### Custom Duration

```typescript
toast.success('Message', 3000);  // 3 seconds
toast.error('Message', 10000);   // 10 seconds
toast.warning('Message', 0);     // Never auto-dismiss
```

### Positioning

Currently fixed to top-right. To change position, modify `ToastProvider.tsx`:

```typescript
<div className="fixed top-4 right-4 z-50">
  {/* Change top-4 right-4 to desired position */}
</div>
```

## Migration from Sonner

If you're migrating from `sonner`, the API is compatible:

```typescript
// Before (sonner)
import { toast } from 'sonner';
toast.success('Message');

// After (our system)
import { useToast } from '@/components/toast';
const toast = useToast();
toast.success('Message');
```

**Note**: Our system requires using the hook in a component, while sonner allows imperative calls anywhere.

## Troubleshooting

### "useToast must be used within ToastProvider"

**Cause**: Component using `useToast()` is not wrapped in `ToastProvider`

**Solution**: Ensure `ToastProvider` wraps your app in `providers.tsx`

### Toasts not appearing

**Checklist**:
1. ✅ Is `ToastProvider` in the component tree?
2. ✅ Are you calling the toast methods correctly?
3. ✅ Check browser console for errors
4. ✅ Verify z-index isn't being overridden (toasts use z-50)

### Multiple toasts firing

**Cause**: Event handler called multiple times or effect runs repeatedly

**Solution**: 
- Check for duplicate event listeners
- Add dependencies to useEffect
- Debounce rapid mutations

## Related Files

- `src/components/toast/` - Toast component library
- `src/app/providers.tsx` - ToastProvider integration
- `src/app/globals.css` - Toast animations (slide-in-right)
- `src/hooks/useOptimisticMutation.ts` - Pairs well with toasts

## Future Enhancements

Potential improvements for future iterations:

- [ ] Toast position configuration (top-left, bottom-right, etc.)
- [ ] Custom toast components (with actions, progress bars)
- [ ] Toast queue management (priority system)
- [ ] Persist toasts across page navigations
- [ ] Sound notifications (optional, accessibility-friendly)
- [ ] Toast history/log viewer

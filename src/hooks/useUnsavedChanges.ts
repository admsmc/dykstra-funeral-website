import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean;
  message?: string;
  enabled?: boolean;
}

/**
 * Hook to warn users about unsaved changes before navigation
 * 
 * Features:
 * - Browser beforeunload warning (refresh/close tab)
 * - Custom confirmation dialog
 * - Next.js router navigation prevention
 * 
 * @example
 * useUnsavedChanges({
 *   hasUnsavedChanges: isDirty,
 *   message: 'You have unsaved changes. Are you sure you want to leave?',
 * });
 */
export function useUnsavedChanges({
  hasUnsavedChanges,
  message = 'You have unsaved changes. Are you sure you want to leave?',
  enabled = true,
}: UseUnsavedChangesOptions) {
  const router = useRouter();

  // Handle browser beforeunload (refresh, close tab)
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom messages and show their own
      // But setting returnValue is required for the dialog to appear
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message, enabled]);

  // Handle Next.js router navigation
  // Note: Next.js 13+ App Router doesn't have built-in navigation blocking
  // This is a workaround using browser confirm dialog
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return;

    // Intercept link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !link.href.startsWith('javascript:')) {
        const isSameOrigin = link.origin === window.location.origin;
        const isCurrentPage = link.href === window.location.href;
        
        if (isSameOrigin && !isCurrentPage) {
          if (!window.confirm(message)) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [hasUnsavedChanges, message, enabled]);

  // Provide a manual check function for programmatic navigation
  const confirmNavigation = useCallback(() => {
    if (!enabled || !hasUnsavedChanges) return true;
    return window.confirm(message);
  }, [hasUnsavedChanges, message, enabled]);

  return { confirmNavigation };
}

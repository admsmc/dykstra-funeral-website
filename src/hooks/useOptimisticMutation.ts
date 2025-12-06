import { useState, useRef, useCallback } from 'react';

/**
 * Options for useOptimisticMutation hook
 */
export interface UseOptimisticMutationOptions<TData, TVariables, TError = Error> {
  /**
   * The mutation function (async function or Promise)
   */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /**
   * Called immediately when mutation is triggered (before server response)
   * Use this to update UI optimistically
   */
  onOptimisticUpdate: (variables: TVariables) => void;

  /**
   * Called when mutation succeeds with server response
   * Receives both the server data and original variables.
   */
  onSuccess?: (data: TData, variables: TVariables) => void;

  /**
   * Called when mutation fails
   * UI will be automatically rolled back before this is called
   */
  onError?: (error: TError) => void;

  /**
   * Called to rollback optimistic update on error
   */
  rollback: () => void;
}

/**
 * Return type for useOptimisticMutation hook
 */
export interface UseOptimisticMutationResult<TVariables> {
  /**
   * Trigger the mutation with optimistic update
   */
  mutate: (variables: TVariables) => Promise<void>;

  /**
   * Whether the mutation is currently in flight (after optimistic update, before server response)
   */
  isOptimistic: boolean;

  /**
   * Whether the mutation is loading (includes optimistic state)
   */
  isLoading: boolean;
}

/**
 * Hook for mutations with optimistic UI updates (like Slack/Linear)
 * 
 * Provides instant UI feedback before server confirmation, with automatic rollback on error.
 * Works with any async function (tRPC mutations, fetch, Effect-TS, etc.)
 * 
 * @example
 * ```tsx
 * const recordPaymentMutation = trpc.payment.recordManual.useMutation();
 * 
 * const { mutate, isOptimistic } = useOptimisticMutation({
 *   mutationFn: (data) => recordPaymentMutation.mutateAsync(data),
 *   onOptimisticUpdate: (data) => {
 *     // Add payment to local state immediately
 *     setPayments(prev => [newPayment, ...prev]);
 *   },
 *   rollback: () => {
 *     // Remove payment on error
 *     setPayments(originalPayments);
 *   },
 *   onSuccess: () => {
 *     toast.success('Payment recorded');
 *   },
 *   onError: () => {
 *     toast.error('Failed to record payment');
 *   }
 * });
 * ```
 */
export function useOptimisticMutation<TData, TVariables, TError = Error>(
  options: UseOptimisticMutationOptions<TData, TVariables, TError>
): UseOptimisticMutationResult<TVariables> {
  const { mutationFn, onOptimisticUpdate, onSuccess, onError, rollback } = options;
  
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Track if component is mounted to avoid state updates after unmount
  const isMountedRef = useRef(true);
  
  const mutate = useCallback(
    async (variables: TVariables) => {
      // Apply optimistic update immediately
      onOptimisticUpdate(variables);
      setIsOptimistic(true);
      setIsLoading(true);

      try {
        // Execute mutation
        const data = await mutationFn(variables);

        // Only update state if still mounted
        if (isMountedRef.current) {
          setIsOptimistic(false);
          setIsLoading(false);
          onSuccess?.(data, variables);
        }
      } catch (error) {
        // Rollback optimistic update on error
        rollback();

        // Only update state if still mounted
        if (isMountedRef.current) {
          setIsOptimistic(false);
          setIsLoading(false);
          onError?.(error as TError);
        }
      }
    },
    [mutationFn, onOptimisticUpdate, onSuccess, onError, rollback]
  );

  return {
    mutate,
    isOptimistic,
    isLoading,
  };
}

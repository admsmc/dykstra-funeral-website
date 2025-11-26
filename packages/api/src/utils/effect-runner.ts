import { Effect } from 'effect';
import { TRPCError } from '@trpc/server';
import { InfrastructureLayer } from '@dykstra/infrastructure';

/**
 * Centralized Effect runner with dependency injection and error mapping
 * 
 * Provides the InfrastructureLayer to Effects before running them,
 * then maps domain errors to tRPC errors for consistent API responses.
 * 
 * @param effect - The Effect to run (can have any Requirements)
 * @returns Promise resolving to the Effect's success value
 * @throws TRPCError - Maps domain errors to appropriate tRPC error codes
 */
export const runEffect = async <A, E extends { _tag: string; message: string }, R = any>(
  effect: Effect.Effect<A, E, R>
): Promise<A> => {
  // Provide all infrastructure dependencies
  const provided = Effect.provide(effect, InfrastructureLayer) as Effect.Effect<A, E, never>;
  
  // Run with Either to capture errors
  const result = await Effect.runPromise(Effect.either(provided));
  
  if (result._tag === 'Left') {
    const error = result.left;
    
    // Map domain errors to tRPC errors based on _tag
    if (typeof error === 'object' && error !== null && '_tag' in error) {
      
      const typedError = error as E;
      
      switch (typedError._tag) {
        case 'NotFoundError':
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: typedError.message,
            cause: error,
          });
          
        case 'UnauthorizedError':
        case 'AuthorizationError':
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: typedError.message,
            cause: error,
          });
          
        case 'ValidationError':
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: typedError.message,
            cause: error,
          });
          
        case 'PersistenceError':
        case 'StorageError':
        case 'EmailError':
        case 'SignatureError':
        case 'PublishError':
        case 'PaymentError':
        case 'StripeError':
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'A service error occurred',
            cause: error,
          });
          
        case 'ConflictError':
          throw new TRPCError({
            code: 'CONFLICT',
            message: typedError.message,
            cause: error,
          });
          
        default:
          // Unknown tagged error
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            cause: error,
          });
      }
    }
    
    // Handle non-tagged errors (shouldn't happen with proper Effect usage)
    const errorMessage = (error as any)?.message || 'An unexpected error occurred';
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: errorMessage,
      cause: error,
    });
  }
  
  return result.right;
};

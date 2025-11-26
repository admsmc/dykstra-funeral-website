import { Data } from 'effect';

/**
 * Base domain error
 */
export class DomainError extends Data.TaggedError('DomainError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Validation error - when domain invariants are violated
 */
export class ValidationError extends Data.TaggedError('ValidationError')<{
  readonly message: string;
  readonly field?: string;
}> {}

/**
 * Not found error - when an entity doesn't exist
 */
export class NotFoundError extends Data.TaggedError('NotFoundError')<{
  readonly message: string;
  readonly entityType: string;
  readonly entityId: string;
}> {}

/**
 * Unauthorized error - when user doesn't have permission
 */
export class UnauthorizedError extends Data.TaggedError('UnauthorizedError')<{
  readonly message: string;
  readonly resource?: string;
}> {}

/**
 * Authorization error - when user doesn't have permission for a specific action
 */
export class AuthorizationError extends Data.TaggedError('AuthorizationError')<{
  readonly message: string;
  readonly userId: string;
  readonly resource: string;
  readonly resourceId: string;
}> {}

/**
 * Business rule violation error
 */
export class BusinessRuleViolationError extends Data.TaggedError('BusinessRuleViolationError')<{
  readonly message: string;
  readonly rule: string;
}> {}

/**
 * Invalid state transition error
 */
export class InvalidStateTransitionError extends Data.TaggedError('InvalidStateTransitionError')<{
  readonly message: string;
  readonly fromState: string;
  readonly toState: string;
}> {}

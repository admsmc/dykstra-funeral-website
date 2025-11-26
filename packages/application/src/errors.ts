/**
 * Application layer errors
 * Re-exports domain errors for convenience
 */
export { ValidationError, NotFoundError } from '@dykstra/domain';
export { PersistenceError } from './ports/case-repository';

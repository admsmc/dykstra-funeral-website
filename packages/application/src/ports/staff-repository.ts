import { Effect, Context } from 'effect';
import type { PersistenceError } from './case-repository';

export type { PersistenceError } from './case-repository';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Staff Repository port
 * Defines interface for staff member persistence
 */
export interface StaffRepository {
  /**
   * Find all staff members
   */
  readonly findAll: () => Effect.Effect<readonly StaffMember[], PersistenceError>;
}

/**
 * Staff Repository service tag for dependency injection
 */
export const StaffRepository = Context.GenericTag<StaffRepository>('@dykstra/StaffRepository');

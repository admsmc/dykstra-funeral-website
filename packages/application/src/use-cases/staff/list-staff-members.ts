import { Effect } from 'effect';
import { StaffRepository, type StaffMember, type PersistenceError } from '../../ports/staff-repository';

/**
 * List Staff Members
 *
 * Policy Type: Type A
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface ListStaffMembersResult {
  staff: readonly StaffMember[];
}

/**
 * List staff members for assignment dropdowns
 * Returns users with staff-level roles
 */
export const listStaffMembers = (): Effect.Effect<
  ListStaffMembersResult,
  PersistenceError,
  StaffRepository
> =>
  Effect.gen(function* () {
    const staffRepo = yield* StaffRepository;
    const staff = yield* staffRepo.findAll();

    return { staff };
  });

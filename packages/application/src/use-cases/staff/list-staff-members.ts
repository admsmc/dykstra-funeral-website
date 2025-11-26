import { Effect } from 'effect';
import { StaffRepository, type StaffMember, PersistenceError } from '../../ports/staff-repository';

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

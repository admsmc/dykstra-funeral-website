import { Effect, Context } from 'effect';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ListStaffMembersResult {
  staff: StaffMember[];
}

/**
 * Staff Repository Port
 * Simple port for querying staff members
 */
export interface StaffRepository {
  findAll(): Effect.Effect<StaffMember[], never, never>;
}

export const StaffRepository = Context.GenericTag<StaffRepository>('@dykstra/StaffRepository');

/**
 * List staff members for assignment dropdowns
 * Returns users with staff-level roles
 */
export const listStaffMembers = (): Effect.Effect<
  ListStaffMembersResult,
  never,
  StaffRepository
> =>
  Effect.gen(function* () {
    const staffRepo = yield* StaffRepository;
    const staff = yield* staffRepo.findAll();

    return { staff };
  });

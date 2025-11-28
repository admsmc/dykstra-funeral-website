import { Effect } from 'effect';
import type { AvailabilitySlot } from '../../ports/calendar-sync-port';
import type { CalendarProvider } from '@dykstra/domain';

/**
 * Get staff availability (free/busy times) - STUB
 * 
 * TODO: Implement logic to:
 * 1. Query calendar events for staff member(s) in date range
 * 2. Detect conflicts/double-booking
 * 3. Return free/busy slots
 */
export const getStaffAvailability = (params: {
  userId: string;
  provider: CalendarProvider;
  startDate: Date;
  endDate: Date;
}) =>
  Effect.gen(function* () {
    // STUB: Return mock free time
    const slots: AvailabilitySlot[] = [{
      startTime: params.startDate,
      endTime: params.endDate,
      status: 'free',
    }];
    return slots;
  });

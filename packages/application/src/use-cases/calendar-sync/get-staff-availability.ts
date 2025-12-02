import { Effect } from 'effect';
import type { AvailabilitySlot } from '../../ports/calendar-sync-port';
import { CalendarSyncPort, type CalendarSyncServicePort } from '../../ports/calendar-sync-port';
import { EmailCalendarSyncPolicyRepository, type EmailCalendarSyncPolicyRepositoryService } from '../../ports/email-calendar-sync-policy-repository';
import type { CalendarProvider } from '@dykstra/domain';
import { type PersistenceError } from '../../ports/case-repository';

/**
 * Get Staff Availability
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: EmailCalendarSyncPolicy
 * Persisted In: In-memory (Prisma in production)
 * Go Backend: NO
 * Per-Funeral-Home: YES (lookahead days, block-out buffer, working hours)
 * Test Coverage: 8 tests (lookahead, block-out, working hours, 3 policies)
 * Last Updated: Phase 2.9-2.13
 *
 * Policy-Driven Configuration:
 * - availabilityLookAheadDays: max range length
 * - blockOutTimePerEventMinutes: buffer around busy events
 * - workingHoursStartTime / workingHoursEndTime: daily bounds
 */

export interface GetStaffAvailabilityCommand {
  userId: string;
  provider: CalendarProvider;
  startDate: Date;
  endDate: Date;
  funeralHomeId: string;
}

export const getStaffAvailability = (
  params: GetStaffAvailabilityCommand
): Effect.Effect<
  readonly AvailabilitySlot[],
  PersistenceError | Error, // NotFoundError from policy repo
  CalendarSyncServicePort | EmailCalendarSyncPolicyRepositoryService
> =>
  Effect.gen(function* () {
    const calendarSync = yield* CalendarSyncPort;
    const policyRepo = yield* EmailCalendarSyncPolicyRepository;

    // Load per-home policy
    const policy = yield* policyRepo.findCurrentByFuneralHomeId(params.funeralHomeId);

    // Enforce lookahead window
    const maxEnd = new Date(params.startDate.getTime() + policy.availabilityLookAheadDays * 24 * 60 * 60 * 1000);
    const effectiveEnd = params.endDate < maxEnd ? params.endDate : maxEnd;

    // Query provider availability (usually returns busy/tentative blocks)
    const providerSlots = yield* calendarSync.getAvailability({
      userId: params.userId,
      provider: params.provider,
      startDate: params.startDate,
      endDate: effectiveEnd,
    });

    // Derive working-hours window per day
    const dayWindows = computeWorkingDayWindows(
      params.startDate,
      effectiveEnd,
      policy.workingHoursStartTime,
      policy.workingHoursEndTime
    );

    // Expand busy slots by block-out buffer
    const bufferMs = policy.blockOutTimePerEventMinutes * 60 * 1000;
    const busy = providerSlots
      .filter((s) => s.status !== 'free')
      .map((s) => ({
        startTime: new Date(s.startTime.getTime() - bufferMs),
        endTime: new Date(s.endTime.getTime() + bufferMs),
      }))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    const mergedBusy = mergeIntervals(busy);

    // For each working-day window, subtract merged busy to get free
    const free: AvailabilitySlot[] = [];
    for (const window of dayWindows) {
      const freeInDay = subtractIntervals(window, mergedBusy).map((iv) => ({
        startTime: iv.startTime,
        endTime: iv.endTime,
        status: 'free' as const,
      }));
      free.push(...freeInDay);
    }

    // Return free slots within policy bounds
    return free
      .filter((s) => s.endTime > s.startTime)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .map((s) => ({
        startTime: s.startTime,
        endTime: s.endTime,
        status: 'free' as const,
      }));
  });

// Helpers
function timeOnDate(date: Date, hhmm: string): Date {
  const parts = hhmm.split(':');
  const hh = parts[0] ? parseInt(parts[0], 10) : 0;
  const mm = parts[1] ? parseInt(parts[1], 10) : 0;
  const d = new Date(date);
  d.setUTCHours(hh, mm, 0, 0);
  return d;
}

function computeWorkingDayWindows(start: Date, end: Date, startHHMM: string, endHHMM: string): Array<{ startTime: Date; endTime: Date }> {
  const windows: Array<{ startTime: Date; endTime: Date }> = [];
  const dayMs = 24 * 60 * 60 * 1000;
  const startDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

  for (let t = startDay.getTime(); t <= endDay.getTime(); t += dayMs) {
    const day = new Date(t);
    let ws = timeOnDate(day, startHHMM);
    let we = timeOnDate(day, endHHMM);

    // Clamp to requested range
    if (ws < start) ws = new Date(start);
    if (we > end) we = new Date(end);
    if (we > ws) windows.push({ startTime: ws, endTime: we });
  }
  return windows;
}

function mergeIntervals(intervals: Array<{ startTime: Date; endTime: Date }>): Array<{ startTime: Date; endTime: Date }> {
  if (intervals.length === 0) return [];
  const merged: Array<{ startTime: Date; endTime: Date }> = [];
  let prev = { ...intervals[0]! };
  for (let i = 1; i < intervals.length; i++) {
    const cur = intervals[i]!;
    if (cur.startTime <= prev.endTime) {
      if (cur.endTime > prev.endTime) prev.endTime = cur.endTime;
    } else {
      merged.push(prev);
      prev = { ...cur };
    }
  }
  merged.push(prev);
  return merged;
}

function subtractIntervals(
  window: { startTime: Date; endTime: Date },
  busy: Array<{ startTime: Date; endTime: Date }>
): Array<{ startTime: Date; endTime: Date }> {
  const result: Array<{ startTime: Date; endTime: Date }> = [];
  let curStart = window.startTime;
  for (const b of busy) {
    if (b.endTime <= curStart) continue;
    if (b.startTime >= window.endTime) break;
    // Free segment before busy starts
    if (b.startTime > curStart) result.push({ startTime: curStart, endTime: new Date(Math.min(b.startTime.getTime(), window.endTime.getTime())) });
    curStart = new Date(Math.max(curStart.getTime(), b.endTime.getTime()));
    if (curStart >= window.endTime) return result;
  }
  if (curStart < window.endTime) result.push({ startTime: curStart, endTime: window.endTime });
  return result;
}

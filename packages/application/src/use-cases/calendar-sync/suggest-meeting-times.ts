import { Effect } from 'effect';
import type { CalendarProvider } from '@dykstra/domain';
import { CalendarSyncPort, type CalendarSyncServicePort } from '../../ports/calendar-sync-port';
import { EmailCalendarSyncPolicyRepository, type EmailCalendarSyncPolicyRepositoryService } from '../../ports/email-calendar-sync-policy-repository';
import { type PersistenceError } from '../../ports/case-repository';

/**
 * Suggest Meeting Times
 *
 * Policy Type: Type A
 * Refactoring Status: ✅ POLICY-AWARE
 * Policy Entity: EmailCalendarSyncPolicy
 * Persisted In: In-memory (Prisma in production)
 * Go Backend: NO
 * Per-Funeral-Home: YES (meeting duration, suggestion count, buffer, working hours)
 * Test Coverage: 11 tests (common slots, ranking, buffers, preferences, 3 policies)
 * Last Updated: Phase 2.9-2.13
 *
 * Policy-Driven Configuration:
 * - meetingDurationMinutes: default meeting length
 * - timeSlotSuggestionCount: number of suggestions to return
 * - minimumBufferMinutes: spacing between suggested slots
 * - workingHoursStartTime / workingHoursEndTime: preferred meeting window
 *
 * Algorithm:
 * 1. Get availability for each attendee (via CalendarSyncPort)
 * 2. Find common free slots (intersection of all attendee availability)
 * 3. Segment slots by minimumBuffer and meetingDuration
 * 4. Rank by mid-day preference (avoid start/end of day)
 * 5. Return top N suggestions per policy.timeSlotSuggestionCount
 */

export interface SuggestMeetingTimesCommand {
  attendeeUserIds: readonly string[];
  provider: CalendarProvider;
  durationMinutes?: number; // Override policy default
  startDate: Date;
  endDate: Date;
  funeralHomeId: string;
}

export interface MeetingSuggestion {
  startTime: Date;
  endTime: Date;
  confidence: number; // 0-100, higher = better fit
}

export const suggestMeetingTimes = (
  params: SuggestMeetingTimesCommand
): Effect.Effect<
  readonly MeetingSuggestion[],
  PersistenceError | Error, // NotFoundError from policy repo
  CalendarSyncServicePort | EmailCalendarSyncPolicyRepositoryService
> =>
  Effect.gen(function* () {
    const calendarSync = yield* CalendarSyncPort;
    const policyRepo = yield* EmailCalendarSyncPolicyRepository;

    // Load per-home policy
    const policy = yield* policyRepo.findCurrentByFuneralHomeId(params.funeralHomeId);

    const meetingDuration = params.durationMinutes || policy.meetingDurationMinutes;
    const buffer = policy.minimumBufferMinutes;
    const maxSuggestions = policy.timeSlotSuggestionCount;

    // Get availability for each attendee
    const availabilityArrays = yield* Effect.all(
      params.attendeeUserIds.map((userId) =>
        calendarSync.getAvailability({
          userId,
          provider: params.provider,
          startDate: params.startDate,
          endDate: params.endDate,
        })
      )
    );

    // Find common free slots (intersection of all attendee availability)
    const commonSlots = findCommonAvailability(
      availabilityArrays.map((arr) => arr.filter((s) => s.status === 'free')),
      meetingDuration,
      buffer
    );

    // Score and rank suggestions
    const scored = commonSlots.map((slot) => ({
      suggestion: slot,
      confidence: calculateConfidence(slot, policy, params.startDate, params.endDate),
    }));

    // Sort by confidence (descending) then by time (ascending)
    scored.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return a.suggestion.startTime.getTime() - b.suggestion.startTime.getTime();
    });

    // Return top N suggestions
    return scored.slice(0, maxSuggestions).map((s) => s.suggestion);
  });

// Helper: Find common free slots across all attendees
function findCommonAvailability(
  attendeeSlots: Array<Array<{ startTime: Date; endTime: Date; status: string | undefined }>>,
  durationMs: number,
  bufferMs: number
): MeetingSuggestion[] {
  if (attendeeSlots.length === 0) return [];
  if (attendeeSlots.some((slots) => slots.length === 0)) return []; // Someone has no availability

  const durationMs_raw = durationMs * 60 * 1000;
  const bufferMs_raw = bufferMs * 60 * 1000;

  // Find intersection of all free time
  let common = attendeeSlots[0]!.map((s) => ({ startTime: s.startTime, endTime: s.endTime, status: s.status }));

  for (let i = 1; i < attendeeSlots.length; i++) {
    common = intersectIntervals(common, attendeeSlots[i]!);
    if (common.length === 0) return [];
  }

  // Split intervals into meeting-sized slots with buffer
  const suggestions: MeetingSuggestion[] = [];
  for (const interval of common) {
    let currentTime = interval.startTime.getTime();
    while (currentTime + durationMs_raw <= interval.endTime.getTime()) {
      suggestions.push({
        startTime: new Date(currentTime),
        endTime: new Date(currentTime + durationMs_raw),
        confidence: 100, // Will be scored later
      });
      currentTime += durationMs_raw + bufferMs_raw; // Skip buffer between suggestions
    }
  }

  return suggestions;
}

// Helper: Find intersection of two interval arrays
function intersectIntervals(
  intervals1: Array<{ startTime: Date; endTime: Date; status: string | undefined }>,
  intervals2: Array<{ startTime: Date; endTime: Date; status: string | undefined }>
): Array<{ startTime: Date; endTime: Date; status: string | undefined }> {
  const result: Array<{ startTime: Date; endTime: Date; status: string | undefined }> = [];

  for (const i1 of intervals1) {
    for (const i2 of intervals2) {
      const overlapStart = Math.max(i1.startTime.getTime(), i2.startTime.getTime());
      const overlapEnd = Math.min(i1.endTime.getTime(), i2.endTime.getTime());

      if (overlapStart < overlapEnd) {
        result.push({
          startTime: new Date(overlapStart),
          endTime: new Date(overlapEnd),
          status: 'free', // Intersection of free times is free
        });
      }
    }
  }

  return mergeOverlappingIntervals(result);
}

// Helper: Merge overlapping intervals
function mergeOverlappingIntervals(
  intervals: Array<{ startTime: Date; endTime: Date; status: string | undefined }>
): Array<{ startTime: Date; endTime: Date; status: string | undefined }> {
  if (intervals.length === 0) return [];

  const sorted = [...intervals].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const merged: Array<{ startTime: Date; endTime: Date; status: string | undefined }> = [];
  let current = { ...sorted[0]! };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i]!;
    if (next.startTime.getTime() <= current.endTime.getTime()) {
      current.endTime = new Date(Math.max(current.endTime.getTime(), next.endTime.getTime()));
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);

  return merged;
}

// Helper: Calculate confidence score (0-100)
// Higher scores for mid-day times, penalty for very early/late
function calculateConfidence(
  slot: MeetingSuggestion,
  policy: { workingHoursStartTime: string; workingHoursEndTime: string },
  rangeStart: Date,
  rangeEnd: Date
): number {
  const [startHH = 0, startMM = 0] = policy.workingHoursStartTime.split(':').map((n: string) => parseInt(n, 10));
  const [endHH = 0, endMM = 0] = policy.workingHoursEndTime.split(':').map((n: string) => parseInt(n, 10));

  const startMinutes = (startHH || 0) * 60 + (startMM || 0);
  const endMinutes = (endHH || 0) * 60 + (endMM || 0);
  const midPoint = (startMinutes + endMinutes) / 2;

  const slotMinutes = slot.startTime.getUTCHours() * 60 + slot.startTime.getUTCMinutes();

  // Base: 100 for mid-day, decreasing towards edges
  const distFromMid = Math.abs(slotMinutes - midPoint);
  const maxDist = Math.max(midPoint - startMinutes, endMinutes - midPoint);
  const timeScore = Math.max(0, 100 - (distFromMid / maxDist) * 50);

  // Bonus for earlier in range (prefer earlier options)
  const rangeMs = rangeEnd.getTime() - rangeStart.getTime();
  const slotProgress = (slot.startTime.getTime() - rangeStart.getTime()) / rangeMs;
  const earliernessBonus = (1 - slotProgress) * 20;

  return Math.round(timeScore + earliernessBonus);
}

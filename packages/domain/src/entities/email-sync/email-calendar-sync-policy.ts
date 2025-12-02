import { Data } from 'effect';

/**
 * Email/Calendar Synchronization Policy
 *
 * SCD Type 2: Tracks historical policy changes with version control
 *
 * Defines email and calendar sync behavior per funeral home.
 * Covers sync frequency, retry logic, email matching, calendar integration, and availability.
 *
 * Example variations:
 * - Standard: Balanced approach (15 min sync, 3 retries, exact + fuzzy matching)
 * - Strict: Conservative sync (30 min sync, 5 retries, exact only)
 * - Permissive: Aggressive sync (5 min sync, 1 retry, fuzzy matching)
 */
export class EmailCalendarSyncPolicy extends Data.Class<{
  readonly id: string;
  readonly businessKey: string;  // Policy identifier, typically funeralHomeId
  readonly version: number;       // SCD2: Version number
  readonly validFrom: Date;       // SCD2: When this version became active
  readonly validTo: Date | null;  // SCD2: When this version ended (null = current)
  readonly isCurrent: boolean;    // SCD2: Is this the current version?
  readonly funeralHomeId: string; // Which funeral home uses this policy

  // Email Sync Configuration
  readonly emailSyncFrequencyMinutes: number;    // How often to sync emails (5-1440)
  readonly maxRetries: number;                   // Max retry attempts for failed syncs (1-10)
  readonly retryDelaySeconds: number;            // Delay between retries (1-60)

  // Email Matching Configuration
  readonly emailMatchingStrategy: 'exact' | 'fuzzy' | 'domain' | 'exact_with_fallback';  // Matching approach
  readonly fuzzyMatchThreshold: number;         // Fuzzy match score threshold (0-100)
  readonly emailFallbackStrategies: readonly ('exact' | 'fuzzy' | 'domain')[]; // Fallback order

  // Calendar Sync Configuration
  readonly calendarFieldMappings: {
    readonly subject: boolean;
    readonly startTime: boolean;
    readonly endTime: boolean;
    readonly attendees: boolean;
    readonly description: boolean;
    readonly location: boolean;
  };
  readonly timezoneHandling: 'utc' | 'local' | 'explicit';  // How to handle timezones
  readonly calendarSyncRetryPolicy: 'immediate' | 'exponential' | 'fixed';

  // Availability Configuration
  readonly availabilityLookAheadDays: number;   // How far ahead to check availability (1-365)
  readonly blockOutTimePerEventMinutes: number; // Reserved time around each event (0-120)

  // Meeting Suggestion Configuration
  readonly meetingDurationMinutes: number;      // Default meeting duration (15-480)
  readonly timeSlotSuggestionCount: number;     // Number of suggestions to return (3-20)
  readonly minimumBufferMinutes: number;        // Buffer between suggested slots (5-120)
  readonly workingHoursStartTime: string;       // HH:MM format (e.g., "09:00")
  readonly workingHoursEndTime: string;         // HH:MM format (e.g., "17:00")

  // Notification Configuration
  readonly notificationDelayMinutes: number;    // Delay before sync notifications (0-1440)
  readonly enableSyncNotifications: boolean;    // Send notifications on sync events

  // Audit Trail
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
  readonly updatedBy: string | null;
  readonly reason: string | null;        // Reason for policy change
}> {}

/**
 * Standard Email/Calendar Sync Policy
 *
 * Balanced approach for typical funeral homes.
 * Moderate sync frequency with exact + fuzzy matching fallback.
 */
export const STANDARD_EMAIL_CALENDAR_SYNC_POLICY: Omit<
  EmailCalendarSyncPolicy,
  'id' | 'businessKey' | 'funeralHomeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
> = {
  version: 1,
  validFrom: new Date(),
  validTo: null,
  isCurrent: true,

  // Email Sync: Moderate frequency
  emailSyncFrequencyMinutes: 15,
  maxRetries: 3,
  retryDelaySeconds: 5,

  // Email Matching: Exact with fuzzy fallback
  emailMatchingStrategy: 'exact_with_fallback',
  fuzzyMatchThreshold: 85,
  emailFallbackStrategies: ['exact', 'fuzzy', 'domain'],

  // Calendar Sync: Full field mapping
  calendarFieldMappings: {
    subject: true,
    startTime: true,
    endTime: true,
    attendees: true,
    description: true,
    location: true,
  },
  timezoneHandling: 'local',
  calendarSyncRetryPolicy: 'exponential',

  // Availability: Moderate lookahead and block-out
  availabilityLookAheadDays: 30,
  blockOutTimePerEventMinutes: 15,

  // Meeting Suggestions: Balanced parameters
  meetingDurationMinutes: 60,
  timeSlotSuggestionCount: 5,
  minimumBufferMinutes: 15,
  workingHoursStartTime: '09:00',
  workingHoursEndTime: '17:00',

  // Notifications: Enabled with modest delay
  notificationDelayMinutes: 5,
  enableSyncNotifications: true,

  reason: null,
};

/**
 * Strict Email/Calendar Sync Policy
 *
 * Conservative approach prioritizing accuracy over frequency.
 * Less frequent sync, exact matching only, manual review-friendly.
 */
export const STRICT_EMAIL_CALENDAR_SYNC_POLICY: Omit<
  EmailCalendarSyncPolicy,
  'id' | 'businessKey' | 'funeralHomeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
> = {
  version: 1,
  validFrom: new Date(),
  validTo: null,
  isCurrent: true,

  // Email Sync: Conservative frequency
  emailSyncFrequencyMinutes: 30,
  maxRetries: 5,
  retryDelaySeconds: 10,

  // Email Matching: Exact only
  emailMatchingStrategy: 'exact',
  fuzzyMatchThreshold: 100, // No fuzzy matching
  emailFallbackStrategies: ['exact'],

  // Calendar Sync: Selective field mapping
  calendarFieldMappings: {
    subject: true,
    startTime: true,
    endTime: true,
    attendees: true,
    description: false,
    location: false,
  },
  timezoneHandling: 'utc', // Consistent UTC
  calendarSyncRetryPolicy: 'fixed',

  // Availability: Extended lookahead, longer block-out
  availabilityLookAheadDays: 14,
  blockOutTimePerEventMinutes: 30,

  // Meeting Suggestions: Conservative parameters
  meetingDurationMinutes: 60,
  timeSlotSuggestionCount: 3,
  minimumBufferMinutes: 30,
  workingHoursStartTime: '08:00',
  workingHoursEndTime: '18:00',

  // Notifications: Delayed notifications
  notificationDelayMinutes: 30,
  enableSyncNotifications: true,

  reason: null,
};

/**
 * Permissive Email/Calendar Sync Policy
 *
 * Aggressive approach maximizing sync frequency and matching.
 * High-frequency sync, fuzzy matching, automatic updates.
 */
export const PERMISSIVE_EMAIL_CALENDAR_SYNC_POLICY: Omit<
  EmailCalendarSyncPolicy,
  'id' | 'businessKey' | 'funeralHomeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
> = {
  version: 1,
  validFrom: new Date(),
  validTo: null,
  isCurrent: true,

  // Email Sync: Aggressive frequency
  emailSyncFrequencyMinutes: 5,
  maxRetries: 1,
  retryDelaySeconds: 1,

  // Email Matching: Aggressive fuzzy matching
  emailMatchingStrategy: 'fuzzy',
  fuzzyMatchThreshold: 70, // Lower threshold
  emailFallbackStrategies: ['fuzzy', 'domain', 'exact'],

  // Calendar Sync: Full field mapping
  calendarFieldMappings: {
    subject: true,
    startTime: true,
    endTime: true,
    attendees: true,
    description: true,
    location: true,
  },
  timezoneHandling: 'local',
  calendarSyncRetryPolicy: 'immediate',

  // Availability: Extended lookahead, minimal block-out
  availabilityLookAheadDays: 90,
  blockOutTimePerEventMinutes: 5,

  // Meeting Suggestions: Aggressive parameters
  meetingDurationMinutes: 45,
  timeSlotSuggestionCount: 10,
  minimumBufferMinutes: 5,
  workingHoursStartTime: '07:00',
  workingHoursEndTime: '19:00',

  // Notifications: Disabled for aggressive sync
  notificationDelayMinutes: 0,
  enableSyncNotifications: false,

  reason: null,
};

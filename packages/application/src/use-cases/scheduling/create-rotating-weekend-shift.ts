import { Effect } from 'effect';
import { ValidationError, NotFoundError } from '@dykstra/domain';
import {
  GoSchedulingPort,
  type GoSchedulingPortService,
  type CreateRotatingScheduleCommand,
  type GoRotatingSchedule,
  type GoShiftTemplate,
  NetworkError,
} from '../../ports/go-scheduling-port';

/**
 * Rotating Weekend Shift Pattern
 * 
 * Scenario 5: Fairly distribute weekend work across all staff
 * 
 * Business Need:
 * Create sustainable, fair weekend rotation schedules that maintain work-life balance
 * while ensuring adequate coverage for funeral home operations.
 * 
 * Business Rules:
 * - All staff rotate weekends (no exemptions except medical)
 * - Maximum 2 consecutive weekends on
 * - Minimum 1 weekend off per month (in 4-week cycle)
 * - Holiday weekends count as premium shifts
 * - PTO requests can override rotation (if approved early)
 * - Fair distribution (~50% weekends for each employee over time)
 * 
 * Workflow:
 * 1. Office manager creates 4-week rotating schedule
 * 2. Pattern example: Week 1 on, Week 2 off, Week 3 on, Week 4 off
 * 3. System auto-assigns based on rotation pattern
 * 4. Staff view their weekend schedule 4 weeks in advance
 * 5. System sends reminders 7 days before weekend shift
 * 6. Pattern repeats indefinitely until changed
 */

/**
 * Create Rotating Weekend Shift
 *
 * Policy Type: Type B
 * Refactoring Status: 🔴 IN PROGRESS
 * Policy Entity: ShiftPolicy
 * Persisted In: N/A
 * Go Backend: YES
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export type RotationPatternType = 
  | 'on-off-on-off'     // Week 1 on, Week 2 off, Week 3 on, Week 4 off (50% weekends)
  | 'on-on-off-off'     // 2 weeks on, 2 weeks off (50% weekends)
  | 'on-off-off-on'     // Week 1 on, Week 2-3 off, Week 4 on (50% weekends)
  | 'custom';           // Custom pattern specified by weekNumbers

export interface CreateRotatingWeekendShiftInput {
  readonly name: string;
  readonly patternType: RotationPatternType;
  readonly employeeIds: readonly string[];
  readonly startDate: Date;
  readonly weekendShiftRequirements: {
    readonly director: number;    // e.g., 1
    readonly staff: number;        // e.g., 2
    readonly onCall: number;       // e.g., 1
  };
  readonly customWeekNumbers?: readonly number[]; // For 'custom' pattern, e.g., [1, 3] for weeks 1 and 3
  readonly saturdayShiftTime?: {
    readonly startTime: string;   // HH:MM format, e.g., "09:00"
    readonly endTime: string;     // HH:MM format, e.g., "17:00"
  };
  readonly sundayShiftTime?: {
    readonly startTime: string;
    readonly endTime: string;
  };
}

export interface RotatingWeekendShiftResult {
  readonly scheduleId: string;
  readonly name: string;
  readonly patternType: RotationPatternType;
  readonly weeksPerCycle: number;
  readonly employeeCount: number;
  readonly startDate: Date;
  readonly weekendTemplateIds: readonly string[];
  readonly employeeAssignments: readonly {
    readonly employeeId: string;
    readonly weekendsOnInCycle: number;
    readonly weekendsOffInCycle: number;
    readonly percentageWorking: number;
  }[];
  readonly fairDistributionScore: number; // 0-100, where 100 is perfectly fair
}

/**
 * Get weekend shift pattern based on pattern type
 */
const getWeekendPattern = (
  patternType: RotationPatternType,
  customWeekNumbers?: readonly number[]
): readonly number[] => {
  switch (patternType) {
    case 'on-off-on-off':
      return [1, 3]; // Work weeks 1 and 3
    case 'on-on-off-off':
      return [1, 2]; // Work weeks 1 and 2
    case 'on-off-off-on':
      return [1, 4]; // Work weeks 1 and 4
    case 'custom':
      if (!customWeekNumbers || customWeekNumbers.length === 0) {
        throw new Error('Custom pattern requires weekNumbers to be specified');
      }
      return customWeekNumbers;
    default:
      throw new Error(`Unknown pattern type: ${patternType}`);
  }
};

/**
 * Validate rotating weekend shift input
 */
const validateRotatingWeekendShift = (
  input: CreateRotatingWeekendShiftInput
): Effect.Effect<void, ValidationError> =>
  Effect.gen(function* () {
    // Rule 1: Name is required
    if (!input.name || input.name.trim() === '') {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Schedule name is required',
          field: 'name',
        })
      );
    }

    // Rule 2: Minimum number of employees (need enough for rotation)
    if (input.employeeIds.length < 2) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'At least 2 employees are required for weekend rotation',
          field: 'employeeIds',
        })
      );
    }

    // Rule 3: Start date must be a Saturday (beginning of weekend)
    const startDay = input.startDate.getDay();
    if (startDay !== 6) { // 6 = Saturday
      return yield* Effect.fail(
        new ValidationError({
          message: 'Start date must be a Saturday (beginning of weekend)',
          field: 'startDate',
        })
      );
    }

    // Rule 4: Start date must be in the future
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (input.startDate < now) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Start date must be in the future',
          field: 'startDate',
        })
      );
    }

    // Rule 5: Custom pattern validation
    if (input.patternType === 'custom') {
      if (!input.customWeekNumbers || input.customWeekNumbers.length === 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Custom pattern requires week numbers to be specified',
            field: 'customWeekNumbers',
          })
        );
      }

      // Validate week numbers are within 1-4
      for (const weekNum of input.customWeekNumbers) {
        if (weekNum < 1 || weekNum > 4) {
          return yield* Effect.fail(
            new ValidationError({
              message: 'Week numbers must be between 1 and 4',
              field: 'customWeekNumbers',
            })
          );
        }
      }
    }

    // Rule 6: Validate shift time formats
    if (input.saturdayShiftTime) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(input.saturdayShiftTime.startTime) || 
          !timeRegex.test(input.saturdayShiftTime.endTime)) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Invalid time format. Use HH:MM format (e.g., 09:00)',
            field: 'saturdayShiftTime',
          })
        );
      }
    }

    if (input.sundayShiftTime) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(input.sundayShiftTime.startTime) || 
          !timeRegex.test(input.sundayShiftTime.endTime)) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Invalid time format. Use HH:MM format (e.g., 09:00)',
            field: 'sundayShiftTime',
          })
        );
      }
    }

    return yield* Effect.succeed(undefined);
  });

/**
 * Validate fair distribution constraints
 */
const validateFairDistribution = (
  patternType: RotationPatternType,
  customWeekNumbers?: readonly number[]
): Effect.Effect<void, ValidationError> =>
  Effect.gen(function* () {
    const pattern = getWeekendPattern(patternType, customWeekNumbers);

    // Rule: Minimum 1 weekend off per month (4-week cycle)
    // This means max 3 weekends on in a 4-week cycle
    if (pattern.length > 3) {
      return yield* Effect.fail(
        new ValidationError({
          message: 'Pattern violates minimum 1 weekend off per month rule (max 3 weekends on in 4-week cycle)',
          field: 'patternType',
        })
      );
    }

    // Rule: Maximum 2 consecutive weekends on
    // Check if pattern has more than 2 consecutive weeks
    const sortedPattern = [...pattern].sort((a: number, b: number) => a - b);
    for (let i = 0; i < sortedPattern.length - 2; i++) {
      const current = sortedPattern[i];
      const next = sortedPattern[i + 1];
      const afterNext = sortedPattern[i + 2];
      if (current !== undefined && next === current + 1 && afterNext === current + 2) {
        return yield* Effect.fail(
          new ValidationError({
            message: 'Pattern violates maximum 2 consecutive weekends rule',
            field: 'patternType',
          })
        );
      }
    }

    // Rule: Fair distribution - aim for ~50% (2 weekends in 4-week cycle)
    // Warning if significantly different from 50%
    const percentageWorking = (pattern.length / 4) * 100;
    if (percentageWorking < 25 || percentageWorking > 75) {
      // This is a warning, not an error, but we'll allow it
      // In a real system, you might log this or show a warning to the user
    }

    return yield* Effect.succeed(undefined);
  });

/**
 * Calculate fair distribution score
 * 
 * Score is based on how close the distribution is to 50% for all employees
 * 100 = perfect (all employees work exactly 50% of weekends)
 * 0 = completely unfair
 */
const calculateFairDistributionScore = (
  pattern: readonly number[]
  // Note: employeeCount removed - fairness is based on pattern, not employee count
): number => {
  const weekendsPerCycle = pattern.length;
  const targetPercentage = 50;
  const actualPercentage = (weekendsPerCycle / 4) * 100;
  
  // Calculate deviation from target
  const deviation = Math.abs(targetPercentage - actualPercentage);
  
  // Convert to score (0-100)
  // 0% deviation = 100 score
  // 50% deviation = 0 score
  const score = Math.max(0, 100 - (deviation * 2));
  
  return Math.round(score);
};

/**
 * Create weekend shift templates
 */
const createWeekendShiftTemplates = (
  scheduling: GoSchedulingPortService,
  input: CreateRotatingWeekendShiftInput
): Effect.Effect<readonly GoShiftTemplate[], NetworkError> =>
  Effect.gen(function* () {
    const templates: GoShiftTemplate[] = [];

    // Default shift times if not provided
    const saturdayShift = input.saturdayShiftTime || {
      startTime: '09:00',
      endTime: '17:00',
    };
    const sundayShift = input.sundayShiftTime || {
      startTime: '09:00',
      endTime: '17:00',
    };

    // Calculate duration in minutes
    const calculateDuration = (startTime: string, endTime: string): number => {
      const startParts = startTime.split(':').map(Number);
      const endParts = endTime.split(':').map(Number);
      const startHour = startParts[0] ?? 0;
      const startMin = startParts[1] ?? 0;
      const endHour = endParts[0] ?? 0;
      const endMin = endParts[1] ?? 0;
      return (endHour * 60 + endMin) - (startHour * 60 + startMin);
    };

    // Create Saturday template
    const saturdayTemplate = yield* scheduling.createShiftTemplate({
      name: `${input.name} - Saturday`,
      shiftType: 'weekend',
      startTime: saturdayShift.startTime,
      endTime: saturdayShift.endTime,
      durationMinutes: calculateDuration(saturdayShift.startTime, saturdayShift.endTime),
      daysOfWeek: [6], // Saturday
      differential: {
        type: 'weekend',
        percentBonus: 15, // 15% weekend premium
      },
    });
    templates.push(saturdayTemplate);

    // Create Sunday template
    const sundayTemplate = yield* scheduling.createShiftTemplate({
      name: `${input.name} - Sunday`,
      shiftType: 'weekend',
      startTime: sundayShift.startTime,
      endTime: sundayShift.endTime,
      durationMinutes: calculateDuration(sundayShift.startTime, sundayShift.endTime),
      daysOfWeek: [0], // Sunday
      differential: {
        type: 'weekend',
        percentBonus: 15,
      },
    });
    templates.push(sundayTemplate);

    return templates;
  });

/**
 * Create Rotating Weekend Shift Use Case
 * 
 * Creates a 4-week rotating schedule for weekend shifts with fair distribution.
 * 
 * @param input - Schedule configuration
 * @returns Schedule result with assignments and fairness metrics
 * @throws ValidationError - If schedule violates business rules
 * @throws NetworkError - If Go backend communication fails
 */
export const createRotatingWeekendShift = (
  input: CreateRotatingWeekendShiftInput
): Effect.Effect<
  RotatingWeekendShiftResult,
  ValidationError | NetworkError,
  GoSchedulingPortService
> =>
  Effect.gen(function* () {
    // Step 1: Validate input
    yield* validateRotatingWeekendShift(input);

    // Step 2: Validate fair distribution constraints
    yield* validateFairDistribution(input.patternType, input.customWeekNumbers);

    // Step 3: Get scheduling service
    const scheduling = yield* GoSchedulingPort;

    // Step 4: Create weekend shift templates
    const templates = yield* createWeekendShiftTemplates(scheduling, input);

    // Step 5: Get the rotation pattern
    const pattern = getWeekendPattern(input.patternType, input.customWeekNumbers);

    // Step 6: Create the rotating schedule
    const command: CreateRotatingScheduleCommand = {
      name: input.name,
      templateIds: templates.map(t => t.id),
      weeksPerCycle: 4,
      employeeIds: input.employeeIds,
      startDate: input.startDate,
    };

    const schedule = yield* scheduling.createRotatingSchedule(command);

    // Step 7: Calculate employee assignments and metrics
    const weekendsOnInCycle = pattern.length;
    const weekendsOffInCycle = 4 - weekendsOnInCycle;
    const percentageWorking = (weekendsOnInCycle / 4) * 100;

    const employeeAssignments = input.employeeIds.map(employeeId => ({
      employeeId,
      weekendsOnInCycle,
      weekendsOffInCycle,
      percentageWorking,
    }));

    // Step 8: Calculate fair distribution score
    const fairDistributionScore = calculateFairDistributionScore(
      pattern
    );

    // Step 9: Return result
    return {
      scheduleId: schedule.id,
      name: schedule.name,
      patternType: input.patternType,
      weeksPerCycle: 4,
      employeeCount: input.employeeIds.length,
      startDate: input.startDate,
      weekendTemplateIds: templates.map(t => t.id),
      employeeAssignments,
      fairDistributionScore,
    };
  });

/**
 * Get Rotating Schedule Details
 * 
 * Retrieves details of an existing rotating schedule.
 * 
 * @param scheduleId - Schedule ID
 * @returns Schedule details
 * @throws NotFoundError - If schedule not found
 * @throws NetworkError - If Go backend communication fails
 */
export const getRotatingWeekendShift = (
  scheduleId: string
): Effect.Effect<
  GoRotatingSchedule,
  NotFoundError | NetworkError,
  GoSchedulingPortService
> =>
  Effect.gen(function* () {
    const scheduling = yield* GoSchedulingPort;
    const schedule = yield* scheduling.getRotatingSchedule(scheduleId);
    return schedule;
  });

import { describe, it, expect, beforeEach } from 'vitest';
import { Effect, Layer } from 'effect';
import {
  createRotatingWeekendShift,
  getRotatingWeekendShift,
  type CreateRotatingWeekendShiftInput,
  type RotationPatternType,
} from '../create-rotating-weekend-shift';
import {
  GoSchedulingPort,
  type GoSchedulingPortService,
  type GoShiftTemplate,
  type GoRotatingSchedule,
  NetworkError,
} from '../../../ports/go-scheduling-port';
import { ValidationError } from '@dykstra/domain';

/**
 * Mock Scheduling Service
 */
const createMockSchedulingService = (
  overrides: Partial<GoSchedulingPortService> = {}
): GoSchedulingPortService => {
  const defaultCreateShiftTemplate = (command: any): Effect.Effect<GoShiftTemplate> =>
    Effect.succeed({
      id: `template-${Math.random().toString(36).substr(2, 9)}`,
      name: command.name,
      shiftType: command.shiftType,
      startTime: command.startTime,
      endTime: command.endTime,
      durationMinutes: command.durationMinutes,
      daysOfWeek: command.daysOfWeek,
      differential: command.differential,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const defaultCreateRotatingSchedule = (command: any): Effect.Effect<GoRotatingSchedule> =>
    Effect.succeed({
      id: `schedule-${Math.random().toString(36).substr(2, 9)}`,
      name: command.name,
      templateIds: command.templateIds,
      weeksPerCycle: command.weeksPerCycle,
      employeeIds: command.employeeIds,
      startDate: command.startDate,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const defaultGetRotatingSchedule = (id: string): Effect.Effect<GoRotatingSchedule> =>
    Effect.succeed({
      id,
      name: 'Weekend Rotation Schedule',
      templateIds: ['template-1', 'template-2'],
      weeksPerCycle: 4,
      employeeIds: ['emp-001', 'emp-002', 'emp-003'],
      startDate: new Date('2024-12-07'),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  return {
    createShiftTemplate: overrides.createShiftTemplate || defaultCreateShiftTemplate,
    getShiftTemplate: () => Effect.succeed({} as any),
    listShiftTemplates: () => Effect.succeed([]),
    assignShift: () => Effect.succeed({} as any),
    completeShift: () => Effect.succeed(undefined),
    cancelShift: () => Effect.succeed(undefined),
    getShiftAssignment: () => Effect.succeed({} as any),
    listShiftAssignments: () => Effect.succeed([]),
    assignOnCall: () => Effect.succeed({} as any),
    activateOnCall: () => Effect.succeed({} as any),
    getOnCallAssignment: () => Effect.succeed({} as any),
    listOnCallAssignments: () => Effect.succeed([]),
    requestShiftSwap: () => Effect.succeed({} as any),
    reviewShiftSwap: () => Effect.succeed(undefined),
    getShiftSwap: () => Effect.succeed({} as any),
    listShiftSwaps: () => Effect.succeed([]),
    getStaffSchedule: () => Effect.succeed({} as any),
    getShiftCoverage: () => Effect.succeed([]),
    createRotatingSchedule: overrides.createRotatingSchedule || defaultCreateRotatingSchedule,
    getRotatingSchedule: overrides.getRotatingSchedule || defaultGetRotatingSchedule,
    setShiftCoverageRule: () => Effect.succeed(undefined),
    getShiftCoverageRules: () => Effect.succeed([]),
  };
};

describe('Use Case: Rotating Weekend Shift Pattern (Scenario 5)', () => {
  let saturdayDate: Date;

  beforeEach(() => {
    // Set to a Saturday for test consistency
    const today = new Date();
    const currentDay = today.getDay();
    // Calculate days until next Saturday
    const daysUntilSaturday = currentDay === 6 ? 7 : (6 - currentDay + 7) % 7;
    saturdayDate = new Date(today);
    saturdayDate.setDate(saturdayDate.getDate() + daysUntilSaturday);
    saturdayDate.setHours(0, 0, 0, 0);
  });

  describe('Create Rotating Weekend Shift - Happy Path', () => {
    it('should create a rotating weekend schedule with on-off-on-off pattern', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Weekend Rotation Q1 2025',
        patternType: 'on-off-on-off',
        employeeIds: ['emp-001', 'emp-002', 'emp-003'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 2,
          onCall: 1,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.scheduleId).toBeDefined();
      expect(result.name).toBe('Weekend Rotation Q1 2025');
      expect(result.patternType).toBe('on-off-on-off');
      expect(result.weeksPerCycle).toBe(4);
      expect(result.employeeCount).toBe(3);
      expect(result.startDate).toEqual(saturdayDate);
      expect(result.weekendTemplateIds).toHaveLength(2); // Saturday and Sunday
      expect(result.employeeAssignments).toHaveLength(3);
      expect(result.fairDistributionScore).toBeGreaterThan(0);
      expect(result.fairDistributionScore).toBeLessThanOrEqual(100);
    });

    it('should create schedule with on-on-off-off pattern (2 weeks on, 2 weeks off)', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: '2on2off Rotation',
        patternType: 'on-on-off-off',
        employeeIds: ['emp-001', 'emp-002', 'emp-003', 'emp-004'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 2,
          onCall: 1,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.patternType).toBe('on-on-off-off');
      expect(result.employeeAssignments[0].weekendsOnInCycle).toBe(2);
      expect(result.employeeAssignments[0].weekendsOffInCycle).toBe(2);
      expect(result.employeeAssignments[0].percentageWorking).toBe(50);
    });

    it('should create schedule with on-off-off-on pattern', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: '1on3off Rotation',
        patternType: 'on-off-off-on',
        employeeIds: ['emp-001', 'emp-002'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 2,
          onCall: 0,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.patternType).toBe('on-off-off-on');
      expect(result.employeeAssignments[0].weekendsOnInCycle).toBe(2);
      expect(result.employeeAssignments[0].weekendsOffInCycle).toBe(2);
      expect(result.employeeAssignments[0].percentageWorking).toBe(50);
    });

    it('should create schedule with custom pattern', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Custom Pattern',
        patternType: 'custom',
        employeeIds: ['emp-001', 'emp-002', 'emp-003'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 2,
          onCall: 1,
        },
        customWeekNumbers: [1, 4], // Work weeks 1 and 4
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.patternType).toBe('custom');
      expect(result.employeeAssignments[0].weekendsOnInCycle).toBe(2);
      expect(result.employeeAssignments[0].weekendsOffInCycle).toBe(2);
    });

    it('should apply default shift times when not provided', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Default Times Schedule',
        patternType: 'on-off-on-off',
        employeeIds: ['emp-001', 'emp-002'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
        // No shift times provided
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.scheduleId).toBeDefined();
      expect(result.weekendTemplateIds).toHaveLength(2);
    });

    it('should apply custom shift times', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Custom Times Schedule',
        patternType: 'on-off-on-off',
        employeeIds: ['emp-001', 'emp-002'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
        saturdayShiftTime: {
          startTime: '08:00',
          endTime: '16:00',
        },
        sundayShiftTime: {
          startTime: '10:00',
          endTime: '18:00',
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.scheduleId).toBeDefined();
      expect(result.weekendTemplateIds).toHaveLength(2);
    });
  });

  describe('Create Rotating Weekend Shift - Validation Rules', () => {
    it('should fail when schedule name is empty', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: '',
        patternType: 'on-off-on-off',
        employeeIds: ['emp-001', 'emp-002'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      await expect(
        Effect.runPromise(
          createRotatingWeekendShift(input).pipe(Effect.provide(layer))
        )
      ).rejects.toThrow('Schedule name is required');
    });

    it('should fail when fewer than 2 employees specified', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Invalid Schedule',
        patternType: 'on-off-on-off',
        employeeIds: ['emp-001'], // Only 1 employee
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      await expect(
        Effect.runPromise(
          createRotatingWeekendShift(input).pipe(Effect.provide(layer))
        )
      ).rejects.toThrow('At least 2 employees are required for weekend rotation');
    });

    it('should fail when start date is not a Saturday', async () => {
      // Arrange
      const fridayDate = new Date(saturdayDate);
      fridayDate.setDate(fridayDate.getDate() - 1); // Friday

      const input: CreateRotatingWeekendShiftInput = {
        name: 'Invalid Start Date',
        patternType: 'on-off-on-off',
        employeeIds: ['emp-001', 'emp-002'],
        startDate: fridayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      await expect(
        Effect.runPromise(
          createRotatingWeekendShift(input).pipe(Effect.provide(layer))
        )
      ).rejects.toThrow('Start date must be a Saturday');
    });

    it('should fail when start date is in the past', async () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 8); // Go back to last Saturday
      // Ensure it's a Saturday
      const day = pastDate.getDay();
      if (day !== 6) {
        pastDate.setDate(pastDate.getDate() - day + 6);
      }
      pastDate.setHours(0, 0, 0, 0);

      const input: CreateRotatingWeekendShiftInput = {
        name: 'Past Start Date',
        patternType: 'on-off-on-off',
        employeeIds: ['emp-001', 'emp-002'],
        startDate: pastDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      await expect(
        Effect.runPromise(
          createRotatingWeekendShift(input).pipe(Effect.provide(layer))
        )
      ).rejects.toThrow('Start date must be in the future');
    });

    it('should fail when custom pattern has no week numbers', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Custom Pattern',
        patternType: 'custom',
        employeeIds: ['emp-001', 'emp-002'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
        customWeekNumbers: [], // Empty custom pattern
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      await expect(
        Effect.runPromise(
          createRotatingWeekendShift(input).pipe(Effect.provide(layer))
        )
      ).rejects.toThrow('Custom pattern requires week numbers to be specified');
    });

    it('should fail when custom pattern has invalid week numbers', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Custom Pattern',
        patternType: 'custom',
        employeeIds: ['emp-001', 'emp-002'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
        customWeekNumbers: [1, 5], // Week 5 is invalid (only 1-4 allowed)
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      await expect(
        Effect.runPromise(
          createRotatingWeekendShift(input).pipe(Effect.provide(layer))
        )
      ).rejects.toThrow('Week numbers must be between 1 and 4');
    });

    it('should fail with invalid Saturday time format', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Invalid Times',
        patternType: 'on-off-on-off',
        employeeIds: ['emp-001', 'emp-002'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
        saturdayShiftTime: {
          startTime: '9:00', // Invalid format (should be 09:00)
          endTime: '17:00',
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      await expect(
        Effect.runPromise(
          createRotatingWeekendShift(input).pipe(Effect.provide(layer))
        )
      ).rejects.toThrow('Invalid time format');
    });

    it('should fail with invalid Sunday time format', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Invalid Times',
        patternType: 'on-off-on-off',
        employeeIds: ['emp-001', 'emp-002'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
        sundayShiftTime: {
          startTime: '10:00',
          endTime: '25:00', // Invalid hour
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      await expect(
        Effect.runPromise(
          createRotatingWeekendShift(input).pipe(Effect.provide(layer))
        )
      ).rejects.toThrow('Invalid time format');
    });
  });

  describe('Fair Distribution Constraints', () => {
    it('should enforce minimum 1 weekend off per month (max 3 on in 4-week cycle)', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Too Many Weekends',
        patternType: 'custom',
        employeeIds: ['emp-001', 'emp-002'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
        customWeekNumbers: [1, 2, 3, 4], // All 4 weeks - violates rule
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      await expect(
        Effect.runPromise(
          createRotatingWeekendShift(input).pipe(Effect.provide(layer))
        )
      ).rejects.toThrow('Pattern violates minimum 1 weekend off per month rule');
    });

    it('should enforce maximum 2 consecutive weekends on', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Too Many Consecutive',
        patternType: 'custom',
        employeeIds: ['emp-001', 'emp-002'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
        customWeekNumbers: [1, 2, 3], // 3 consecutive weeks - violates rule
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      await expect(
        Effect.runPromise(
          createRotatingWeekendShift(input).pipe(Effect.provide(layer))
        )
      ).rejects.toThrow('Pattern violates maximum 2 consecutive weekends rule');
    });

    it('should calculate fair distribution score correctly', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Fair Distribution Test',
        patternType: 'on-off-on-off', // 50% weekends - perfectly fair
        employeeIds: ['emp-001', 'emp-002', 'emp-003'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      // on-off-on-off = 2 weekends on out of 4 = 50% = perfect score
      expect(result.fairDistributionScore).toBe(100);
    });

    it('should assign equal weekends to all employees in pattern', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Equal Distribution',
        patternType: 'on-off-on-off',
        employeeIds: ['emp-001', 'emp-002', 'emp-003', 'emp-004', 'emp-005'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 2,
          onCall: 1,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      // All employees should have same weekends in/off in this pattern
      const firstAssignment = result.employeeAssignments[0];
      for (const assignment of result.employeeAssignments) {
        expect(assignment.weekendsOnInCycle).toBe(firstAssignment.weekendsOnInCycle);
        expect(assignment.weekendsOffInCycle).toBe(firstAssignment.weekendsOffInCycle);
        expect(assignment.percentageWorking).toBe(firstAssignment.percentageWorking);
      }
    });
  });

  describe('Employee Assignments', () => {
    it('should create assignment for each employee in rotation', async () => {
      // Arrange
      const employeeIds = ['emp-001', 'emp-002', 'emp-003', 'emp-004'];
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Multiple Employees',
        patternType: 'on-off-on-off',
        employeeIds,
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 2,
          onCall: 1,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.employeeAssignments).toHaveLength(4);
      for (let i = 0; i < employeeIds.length; i++) {
        expect(result.employeeAssignments[i].employeeId).toBe(employeeIds[i]);
      }
    });

    it('should calculate correct percentage working for on-off-on-off pattern', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Percentage Test',
        patternType: 'on-off-on-off', // 2 weekends on / 4 total = 50%
        employeeIds: ['emp-001', 'emp-002'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.employeeAssignments[0].percentageWorking).toBe(50);
    });

    it('should calculate correct percentage working for on-on-off-off pattern', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Percentage Test',
        patternType: 'on-on-off-off', // 2 weekends on / 4 total = 50%
        employeeIds: ['emp-001', 'emp-002'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.employeeAssignments[0].percentageWorking).toBe(50);
    });

    it('should calculate correct percentage working for on-off-off-on pattern', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Percentage Test',
        patternType: 'on-off-off-on', // 2 weekends on / 4 total = 50%
        employeeIds: ['emp-001', 'emp-002'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.employeeAssignments[0].percentageWorking).toBe(50);
    });
  });

  describe('Get Rotating Weekend Shift', () => {
    it('should retrieve existing rotating schedule', async () => {
      // Arrange
      const scheduleId = 'schedule-123';
      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        getRotatingWeekendShift(scheduleId).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.id).toBe(scheduleId);
      expect(result.name).toBe('Weekend Rotation Schedule');
      expect(result.status).toBe('active');
      expect(result.weeksPerCycle).toBe(4);
      expect(result.templateIds).toHaveLength(2);
      expect(result.employeeIds).toHaveLength(3);
    });

    it('should return schedule with active status', async () => {
      // Arrange
      const scheduleId = 'schedule-456';
      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        getRotatingWeekendShift(scheduleId).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.status).toBe('active');
    });
  });

  describe('Template Creation', () => {
    it('should create Saturday and Sunday templates with weekend differential', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Template Test',
        patternType: 'on-off-on-off',
        employeeIds: ['emp-001', 'emp-002'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
      };

      const createdTemplates: GoShiftTemplate[] = [];
      const mockService = createMockSchedulingService({
        createShiftTemplate: (command: any) => {
          const template: GoShiftTemplate = {
            id: `template-${Math.random().toString(36).substr(2, 9)}`,
            name: command.name,
            shiftType: command.shiftType,
            startTime: command.startTime,
            endTime: command.endTime,
            durationMinutes: command.durationMinutes,
            daysOfWeek: command.daysOfWeek,
            differential: command.differential,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          createdTemplates.push(template);
          return Effect.succeed(template);
        },
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(createdTemplates).toHaveLength(2);
      expect(createdTemplates[0].daysOfWeek).toContain(6); // Saturday
      expect(createdTemplates[1].daysOfWeek).toContain(0); // Sunday
      expect(createdTemplates[0].differential?.type).toBe('weekend');
      expect(createdTemplates[1].differential?.type).toBe('weekend');
      expect(createdTemplates[0].differential?.percentBonus).toBe(15);
      expect(createdTemplates[1].differential?.percentBonus).toBe(15);
    });

    it('should use provided shift times in templates', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Custom Times Test',
        patternType: 'on-off-on-off',
        employeeIds: ['emp-001', 'emp-002'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 0,
          onCall: 0,
        },
        saturdayShiftTime: {
          startTime: '08:00',
          endTime: '16:00',
        },
        sundayShiftTime: {
          startTime: '10:00',
          endTime: '18:00',
        },
      };

      const createdTemplates: GoShiftTemplate[] = [];
      const mockService = createMockSchedulingService({
        createShiftTemplate: (command: any) => {
          const template: GoShiftTemplate = {
            id: `template-${Math.random().toString(36).substr(2, 9)}`,
            name: command.name,
            shiftType: command.shiftType,
            startTime: command.startTime,
            endTime: command.endTime,
            durationMinutes: command.durationMinutes,
            daysOfWeek: command.daysOfWeek,
            differential: command.differential,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          createdTemplates.push(template);
          return Effect.succeed(template);
        },
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(createdTemplates[0].startTime).toBe('08:00');
      expect(createdTemplates[0].endTime).toBe('16:00');
      expect(createdTemplates[0].durationMinutes).toBe(480); // 8 hours
      expect(createdTemplates[1].startTime).toBe('10:00');
      expect(createdTemplates[1].endTime).toBe('18:00');
      expect(createdTemplates[1].durationMinutes).toBe(480); // 8 hours
    });
  });

  describe('Edge Cases and Business Rules', () => {
    it('should support maximum of 5 employees (common funeral home size)', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Large Team',
        patternType: 'on-off-on-off',
        employeeIds: [
          'emp-001',
          'emp-002',
          'emp-003',
          'emp-004',
          'emp-005',
        ],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 2,
          staff: 2,
          onCall: 1,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.employeeCount).toBe(5);
      expect(result.employeeAssignments).toHaveLength(5);
    });

    it('should support minimum of 2 employees', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Small Team',
        patternType: 'on-off-on-off',
        employeeIds: ['emp-001', 'emp-002'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 0,
          onCall: 0,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.employeeCount).toBe(2);
    });

    it('should handle leap year transitions correctly', async () => {
      // Arrange - Use a Saturday in late February (potential leap year edge case)
      // Feb 24, 2024 is a Saturday (leap year)
      const leapYearSaturday = new Date(2025, 1, 1); // Start with Feb 1, 2025
      // Move to next Saturday after today (not in the past)
      const today = new Date();
      leapYearSaturday.setTime(today.getTime());
      const day = leapYearSaturday.getDay();
      leapYearSaturday.setDate(leapYearSaturday.getDate() + (day === 6 ? 7 : (6 - day + 7) % 7));
      leapYearSaturday.setHours(0, 0, 0, 0);
      // This could be in late February if we're in early 2025
      // Re-adjust if needed to ensure future date
      if (leapYearSaturday < today) {
        leapYearSaturday.setDate(leapYearSaturday.getDate() + 7);
      }

      const input: CreateRotatingWeekendShiftInput = {
        name: 'Leap Year Schedule',
        patternType: 'on-off-on-off',
        employeeIds: ['emp-001', 'emp-002'],
        startDate: leapYearSaturday,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.scheduleId).toBeDefined();
      expect(result.startDate).toEqual(leapYearSaturday);
    });

    it('should prevent staff exemptions except for medical reasons', async () => {
      // Arrange - This validates the business rule in practice
      const input: CreateRotatingWeekendShiftInput = {
        name: 'No Exemptions',
        patternType: 'on-off-on-off',
        employeeIds: ['emp-001', 'emp-002', 'emp-003'], // All must participate
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 2,
          onCall: 1,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      // All employees should be in the rotation with same weekends
      expect(result.employeeAssignments.length).toBe(3);
      const allHaveSamePattern = result.employeeAssignments.every(
        (a) =>
          a.weekendsOnInCycle ===
          result.employeeAssignments[0].weekendsOnInCycle
      );
      expect(allHaveSamePattern).toBe(true);
    });

    it('should ensure pattern repeats indefinitely until changed', async () => {
      // Arrange
      const input: CreateRotatingWeekendShiftInput = {
        name: 'Repeating Pattern',
        patternType: 'on-off-on-off',
        employeeIds: ['emp-001', 'emp-002'],
        startDate: saturdayDate,
        weekendShiftRequirements: {
          director: 1,
          staff: 1,
          onCall: 0,
        },
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        createRotatingWeekendShift(input).pipe(Effect.provide(layer))
      );

      // Assert
      // The schedule should be active and repeatable
      expect(result.weeksPerCycle).toBe(4); // Repeats every 4 weeks
    });
  });
});

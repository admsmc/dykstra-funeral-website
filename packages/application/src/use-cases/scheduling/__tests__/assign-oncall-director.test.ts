import { describe, it, expect } from 'vitest';
import { Effect, Layer, Context } from 'effect';
import { ValidationError, type OnCallPolicy, createOnCallPolicyId } from '@dykstra/domain';
import { 
  assignOnCallDirector,
  getUpcomingOnCallAssignments,
  hasAdequateRestPeriod,
  countConsecutiveWeekends,
  type AssignOnCallDirectorCommand,
} from '../assign-oncall-director';
import type { 
  GoSchedulingPortService,
  GoOnCallAssignment,
  AssignOnCallCommand,
} from '../../../ports/go-scheduling-port';
import { GoSchedulingPort, NetworkError } from '../../../ports/go-scheduling-port';

/**
 * Default policy for testing (standard configuration)
 */
const DEFAULT_TEST_POLICY: OnCallPolicy = {
  id: createOnCallPolicyId('policy-test-001'),
  businessKey: 'default-test',
  version: 1,
  validFrom: new Date('2024-01-01'),
  validTo: null,
  isCurrent: true,
  funeralHomeId: 'home-001',
  minAdvanceNoticeHours: 48,
  maxAdvanceNoticeHours: 168,
  minShiftDurationHours: 12,
  maxShiftDurationHours: 72,
  maxConsecutiveWeekendsOn: 2,
  minRestHoursAfterShift: 8,
  enableFairRotation: true,
  maxOnCallPerDirectorPerQuarter: 13,
  onCallBasePayAmount: 150,
  callbackHourlyRate: 1.5,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin',
};

/**
 * Mock Scheduling Service for Testing
 */
const createMockSchedulingService = (
  overrides: Partial<GoSchedulingPortService> = {},
  policy: OnCallPolicy = DEFAULT_TEST_POLICY
): GoSchedulingPortService => {
  const mockAssignments: GoOnCallAssignment[] = [];
  
  const defaultAssignOnCall = (command: AssignOnCallCommand) =>
    Effect.succeed({
      id: 'oncall-123',
      employeeId: command.employeeId,
      employeeName: 'John Smith',
      startTime: command.startTime,
      endTime: command.endTime,
      status: 'scheduled' as const,
      activations: [],
      createdAt: new Date(),
    });

  const defaultGetOnCallPolicy = (funeralHomeId: string) =>
    Effect.succeed(policy);
  
  return {
    assignOnCall: overrides.assignOnCall || defaultAssignOnCall,
    
    getOnCallPolicy: overrides.getOnCallPolicy || defaultGetOnCallPolicy,
    
    listOnCallAssignments: (filters) =>
      Effect.succeed(mockAssignments.filter(a => {
        if (filters?.employeeId && a.employeeId !== filters.employeeId) return false;
        if (filters?.startDate && a.startTime < filters.startDate) return false;
        if (filters?.endDate && a.endTime > filters.endDate) return false;
        if (filters?.status && a.status !== filters.status) return false;
        return true;
      })),
    
    ...overrides,
  } as unknown as GoSchedulingPortService;
};

describe('Use Case: Assign On-Call Director', () => {
  describe('Happy Path', () => {
    it('should successfully assign on-call director for weekend', async () => {
      // Arrange
      const now = new Date();
      const startTime = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days ahead
      const endTime = new Date(startTime.getTime() + 63 * 60 * 60 * 1000); // 63 hours later

      const command: AssignOnCallDirectorCommand = {
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime,
        endTime,
        shiftType: 'weekend',
        funeralHomeId: 'home-001',
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = assignOnCallDirector(command).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result).toMatchObject({
        assignmentId: 'oncall-123',
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime,
        endTime,
        durationHours: 63, // 63 hours for weekend
        status: 'scheduled',
      });
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should assign holiday on-call shift (72 hours)', async () => {
      // Arrange
      const now = new Date();
      const startTime = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days ahead
      const endTime = new Date(startTime.getTime() + 72 * 60 * 60 * 1000); // 72 hours later

      const command: AssignOnCallDirectorCommand = {
        employeeId: 'dir-002',
        employeeName: 'Jane Doe',
        startTime,
        endTime,
        shiftType: 'holiday',
        funeralHomeId: 'home-001',
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = assignOnCallDirector(command).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.durationHours).toBe(72);
      expect(result.status).toBe('scheduled');
    });

    it('should assign weeknight on-call (12 hours)', async () => {
      // Arrange
      const now = new Date();
      const startTime = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days ahead
      const endTime = new Date(startTime.getTime() + 15 * 60 * 60 * 1000); // 15 hours later

      const command: AssignOnCallDirectorCommand = {
        employeeId: 'dir-003',
        employeeName: 'Bob Johnson',
        startTime,
        endTime,
        shiftType: 'weeknight',
        funeralHomeId: 'home-001',
      };

      const mockService = createMockSchedulingService({
        assignOnCall: (cmd) =>
          Effect.succeed({
            id: 'oncall-123',
            employeeId: cmd.employeeId,
            employeeName: 'Bob Johnson',
            startTime: cmd.startTime,
            endTime: cmd.endTime,
            status: 'scheduled' as const,
            activations: [],
            createdAt: new Date(),
          }),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = assignOnCallDirector(command).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.durationHours).toBe(15);
      expect(result.employeeName).toBe('Bob Johnson');
    });
  });

  describe('Validation Errors', () => {
    it('should reject assignment with less than 48-hour notice', async () => {
      // Arrange
      const now = new Date();
      const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Only 24 hours ahead
      const endTime = new Date(startTime.getTime() + 48 * 60 * 60 * 1000);

      const command: AssignOnCallDirectorCommand = {
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime,
        endTime,
        shiftType: 'weekend',
        funeralHomeId: 'home-001',
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignOnCallDirector(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow(
        'On-call assignments must be scheduled at least 48 hours in advance'
      );
    });

    it('should reject assignment where end time is before start time', async () => {
      // Arrange
      const now = new Date();
      const startTime = new Date(now.getTime() + 72 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() - 1000); // 1 second before start

      const command: AssignOnCallDirectorCommand = {
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime,
        endTime,
        shiftType: 'weekend',
        funeralHomeId: 'home-001',
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignOnCallDirector(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow(
        'On-call end time must be after start time'
      );
    });

    it('should reject assignment exceeding 72 hours', async () => {
      // Arrange
      const now = new Date();
      const startTime = new Date(now.getTime() + 72 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 73 * 60 * 60 * 1000); // 73 hours

      const command: AssignOnCallDirectorCommand = {
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime,
        endTime,
        shiftType: 'holiday',
        funeralHomeId: 'home-001',
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignOnCallDirector(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow(
        'On-call shifts cannot exceed 72 hours'
      );
    });

    it('should reject assignment less than 12 hours', async () => {
      // Arrange
      const now = new Date();
      const startTime = new Date(now.getTime() + 72 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 10 * 60 * 60 * 1000); // Only 10 hours

      const command: AssignOnCallDirectorCommand = {
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime,
        endTime,
        shiftType: 'weeknight',
        funeralHomeId: 'home-001',
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignOnCallDirector(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow(
        'On-call shifts must be at least 12 hours'
      );
    });

    it('should reject assignment with empty employee ID', async () => {
      // Arrange
      const now = new Date();
      const startTime = new Date(now.getTime() + 72 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 48 * 60 * 60 * 1000);

      const command: AssignOnCallDirectorCommand = {
        employeeId: '',
        employeeName: 'John Smith',
        startTime,
        endTime,
        shiftType: 'weekend',
        funeralHomeId: 'home-001',
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignOnCallDirector(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow(
        'Employee ID is required'
      );
    });

    it('should reject assignment with empty employee name', async () => {
      // Arrange
      const now = new Date();
      const startTime = new Date(now.getTime() + 72 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 48 * 60 * 60 * 1000);

      const command: AssignOnCallDirectorCommand = {
        employeeId: 'dir-001',
        employeeName: '',
        startTime,
        endTime,
        shiftType: 'weekend',
        funeralHomeId: 'home-001',
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignOnCallDirector(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow(
        'Employee name is required'
      );
    });
  });

  describe('Network Errors', () => {
    it('should handle network error from Go backend', async () => {
      // Arrange
      const now = new Date();
      const startTime = new Date(now.getTime() + 72 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 48 * 60 * 60 * 1000);

      const command: AssignOnCallDirectorCommand = {
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime,
        endTime,
        shiftType: 'weekend',
        funeralHomeId: 'home-001',
      };

      const mockService = createMockSchedulingService({
        assignOnCall: () => Effect.fail(new Error('Network timeout') as NetworkError),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignOnCallDirector(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Network timeout');
    });
  });

  describe('Get Upcoming On-Call Assignments', () => {
    it('should return upcoming on-call assignments for director', async () => {
      // Arrange
      const now = new Date('2024-12-01T10:00:00Z');
      const assignment1: GoOnCallAssignment = {
        id: 'oncall-1',
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime: new Date('2024-12-06T22:00:00Z'),
        endTime: new Date('2024-12-09T13:00:00Z'),
        status: 'scheduled',
        activations: [],
        createdAt: new Date(),
      };
      const assignment2: GoOnCallAssignment = {
        id: 'oncall-2',
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime: new Date('2024-12-13T22:00:00Z'),
        endTime: new Date('2024-12-16T13:00:00Z'),
        status: 'scheduled',
        activations: [],
        createdAt: new Date(),
      };

      const mockService = createMockSchedulingService({
        listOnCallAssignments: () => Effect.succeed([assignment1, assignment2]),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = getUpcomingOnCallAssignments('dir-001', 30).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].assignmentId).toBe('oncall-1');
      expect(result[1].assignmentId).toBe('oncall-2');
    });

    it('should return empty array when no upcoming assignments', async () => {
      // Arrange
      const mockService = createMockSchedulingService({
        listOnCallAssignments: () => Effect.succeed([]),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = getUpcomingOnCallAssignments('dir-001', 30).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('Adequate Rest Period Check', () => {
    it('should return true when no recent assignments', async () => {
      // Arrange
      const proposedStartTime = new Date('2024-12-06T22:00:00Z');
      
      const mockService = createMockSchedulingService({
        listOnCallAssignments: () => Effect.succeed([]),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = hasAdequateRestPeriod('dir-001', proposedStartTime, DEFAULT_TEST_POLICY).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.hasAdequateRest).toBe(true);
      expect(result.lastShiftEndTime).toBeUndefined();
      expect(result.hoursRest).toBeUndefined();
    });

    it('should return true when 8+ hours rest since last shift', async () => {
      // Arrange
      const proposedStartTime = new Date('2024-12-06T22:00:00Z');
      const lastShiftEnd = new Date('2024-12-06T13:00:00Z'); // 9 hours before

      const lastAssignment: GoOnCallAssignment = {
        id: 'oncall-prev',
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime: new Date('2024-12-05T22:00:00Z'),
        endTime: lastShiftEnd,
        status: 'completed',
        activations: [],
        createdAt: new Date(),
      };

      const mockService = createMockSchedulingService({
        listOnCallAssignments: () => Effect.succeed([lastAssignment]),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = hasAdequateRestPeriod('dir-001', proposedStartTime, DEFAULT_TEST_POLICY).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.hasAdequateRest).toBe(true);
      expect(result.hoursRest).toBeGreaterThanOrEqual(8);
      expect(result.lastShiftEndTime).toEqual(lastShiftEnd);
    });

    it('should return false when less than 8 hours rest', async () => {
      // Arrange
      const proposedStartTime = new Date('2024-12-06T22:00:00Z');
      const lastShiftEnd = new Date('2024-12-06T18:00:00Z'); // Only 4 hours before

      const lastAssignment: GoOnCallAssignment = {
        id: 'oncall-prev',
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime: new Date('2024-12-05T22:00:00Z'),
        endTime: lastShiftEnd,
        status: 'completed',
        activations: [],
        createdAt: new Date(),
      };

      const mockService = createMockSchedulingService({
        listOnCallAssignments: () => Effect.succeed([lastAssignment]),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = hasAdequateRestPeriod('dir-001', proposedStartTime, DEFAULT_TEST_POLICY).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.hasAdequateRest).toBe(false);
      expect(result.hoursRest).toBeLessThan(8);
    });
  });

  describe('Consecutive Weekends Check', () => {
    it('should return 0 for weekday assignment', async () => {
      // Arrange
      const proposedStartTime = new Date('2024-12-03T22:00:00Z'); // Tuesday
      
      const mockService = createMockSchedulingService({
        listOnCallAssignments: () => Effect.succeed([]),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = countConsecutiveWeekends('dir-001', proposedStartTime, DEFAULT_TEST_POLICY).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.consecutiveWeekends).toBe(0);
      expect(result.violatesRule).toBe(false);
    });

    it('should return 1 for first weekend assignment', async () => {
      // Arrange
      const proposedStartTime = new Date('2024-12-06T22:00:00Z'); // Friday
      
      const mockService = createMockSchedulingService({
        listOnCallAssignments: () => Effect.succeed([]),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = countConsecutiveWeekends('dir-001', proposedStartTime, DEFAULT_TEST_POLICY).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.consecutiveWeekends).toBe(1);
      expect(result.violatesRule).toBe(false);
    });

    it('should count 2 consecutive weekends', async () => {
      // Arrange
      const proposedStartTime = new Date('2024-12-13T22:00:00Z'); // Friday, Week 2
      
      const week1Assignment: GoOnCallAssignment = {
        id: 'oncall-week1',
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime: new Date('2024-12-06T22:00:00Z'), // Previous Friday
        endTime: new Date('2024-12-09T13:00:00Z'),
        status: 'completed',
        activations: [],
        createdAt: new Date(),
      };

      const mockService = createMockSchedulingService({
        listOnCallAssignments: () => Effect.succeed([week1Assignment]),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = countConsecutiveWeekends('dir-001', proposedStartTime, DEFAULT_TEST_POLICY).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.consecutiveWeekends).toBe(2);
      expect(result.violatesRule).toBe(false); // 2 is allowed
    });

    it('should detect rule violation with 3 consecutive weekends', async () => {
      // Arrange
      const proposedStartTime = new Date('2024-12-20T22:00:00Z'); // Friday, Week 3
      
      const week1Assignment: GoOnCallAssignment = {
        id: 'oncall-week1',
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime: new Date('2024-12-06T22:00:00Z'),
        endTime: new Date('2024-12-09T13:00:00Z'),
        status: 'completed',
        activations: [],
        createdAt: new Date(),
      };

      const week2Assignment: GoOnCallAssignment = {
        id: 'oncall-week2',
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime: new Date('2024-12-13T22:00:00Z'),
        endTime: new Date('2024-12-16T13:00:00Z'),
        status: 'completed',
        activations: [],
        createdAt: new Date(),
      };

      const mockService = createMockSchedulingService({
        listOnCallAssignments: () => Effect.succeed([week1Assignment, week2Assignment]),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = countConsecutiveWeekends('dir-001', proposedStartTime, DEFAULT_TEST_POLICY).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.consecutiveWeekends).toBe(3);
      expect(result.violatesRule).toBe(true); // Violates max 2 consecutive
    });

    it('should reset count when gap in weekends', async () => {
      // Arrange
      const proposedStartTime = new Date('2024-12-20T22:00:00Z'); // Friday, Week 3
      
      // Week 1 assignment, but Week 2 is skipped
      const week1Assignment: GoOnCallAssignment = {
        id: 'oncall-week1',
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime: new Date('2024-12-06T22:00:00Z'),
        endTime: new Date('2024-12-09T13:00:00Z'),
        status: 'completed',
        activations: [],
        createdAt: new Date(),
      };

      const mockService = createMockSchedulingService({
        listOnCallAssignments: () => Effect.succeed([week1Assignment]),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = countConsecutiveWeekends('dir-001', proposedStartTime, DEFAULT_TEST_POLICY).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.consecutiveWeekends).toBe(1); // Resets because of gap
      expect(result.violatesRule).toBe(false);
    });
  });

  describe('Policy Variations', () => {
    it('should enforce restrictive policy (72-hour notice requirement)', async () => {
      // Arrange
      const restrictivePolicy: OnCallPolicy = {
        ...DEFAULT_TEST_POLICY,
        minAdvanceNoticeHours: 72, // 3 days instead of 2
      };
      
      const now = new Date();
      const startTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // Only 48 hours ahead
      const endTime = new Date(startTime.getTime() + 48 * 60 * 60 * 1000);

      const command: AssignOnCallDirectorCommand = {
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime,
        endTime,
        shiftType: 'weekend',
        funeralHomeId: 'home-001',
      };

      const mockService = createMockSchedulingService({}, restrictivePolicy);
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignOnCallDirector(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow(
        'On-call assignments must be scheduled at least 72 hours in advance'
      );
    });

    it('should allow flexible policy (24-hour notice requirement)', async () => {
      // Arrange
      const flexiblePolicy: OnCallPolicy = {
        ...DEFAULT_TEST_POLICY,
        minAdvanceNoticeHours: 24, // 1 day instead of 2
      };
      
      const now = new Date();
      const startTime = new Date(now.getTime() + 36 * 60 * 60 * 1000); // 36 hours ahead
      const endTime = new Date(startTime.getTime() + 48 * 60 * 60 * 1000);

      const command: AssignOnCallDirectorCommand = {
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime,
        endTime,
        shiftType: 'weekend',
        funeralHomeId: 'home-001',
      };

      const mockService = createMockSchedulingService({}, flexiblePolicy);
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = assignOnCallDirector(command).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.assignmentId).toBe('oncall-123');
      expect(result.status).toBe('scheduled');
    });

    it('should enforce restrictive consecutive weekend limit (1 weekend max)', async () => {
      // Arrange
      const restrictivePolicy: OnCallPolicy = {
        ...DEFAULT_TEST_POLICY,
        maxConsecutiveWeekendsOn: 1, // Only 1 weekend instead of 2
      };
      
      const proposedStartTime = new Date('2024-12-13T22:00:00Z'); // Friday, Week 2
      
      const week1Assignment: GoOnCallAssignment = {
        id: 'oncall-week1',
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime: new Date('2024-12-06T22:00:00Z'),
        endTime: new Date('2024-12-09T13:00:00Z'),
        status: 'completed',
        activations: [],
        createdAt: new Date(),
      };

      const mockService = createMockSchedulingService(
        { listOnCallAssignments: () => Effect.succeed([week1Assignment]) },
        restrictivePolicy
      );
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = countConsecutiveWeekends('dir-001', proposedStartTime, restrictivePolicy).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.consecutiveWeekends).toBe(2);
      expect(result.violatesRule).toBe(true); // Violates max 1 consecutive
    });

    it('should allow flexible consecutive weekend policy (3 weekends max)', async () => {
      // Arrange
      const flexiblePolicy: OnCallPolicy = {
        ...DEFAULT_TEST_POLICY,
        maxConsecutiveWeekendsOn: 3, // Allow up to 3 weekends
      };
      
      const proposedStartTime = new Date('2024-12-20T22:00:00Z'); // Friday, Week 3
      
      const week1Assignment: GoOnCallAssignment = {
        id: 'oncall-week1',
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime: new Date('2024-12-06T22:00:00Z'),
        endTime: new Date('2024-12-09T13:00:00Z'),
        status: 'completed',
        activations: [],
        createdAt: new Date(),
      };

      const week2Assignment: GoOnCallAssignment = {
        id: 'oncall-week2',
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime: new Date('2024-12-13T22:00:00Z'),
        endTime: new Date('2024-12-16T13:00:00Z'),
        status: 'completed',
        activations: [],
        createdAt: new Date(),
      };

      const mockService = createMockSchedulingService(
        { listOnCallAssignments: () => Effect.succeed([week1Assignment, week2Assignment]) },
        flexiblePolicy
      );
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = countConsecutiveWeekends('dir-001', proposedStartTime, flexiblePolicy).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.consecutiveWeekends).toBe(3);
      expect(result.violatesRule).toBe(false); // 3 is allowed
    });

    it('should enforce stricter rest period requirements (12 hours minimum)', async () => {
      // Arrange
      const strictRestPolicy: OnCallPolicy = {
        ...DEFAULT_TEST_POLICY,
        minRestHoursAfterShift: 12, // 12 hours instead of 8
      };
      
      const proposedStartTime = new Date('2024-12-06T22:00:00Z');
      const lastShiftEnd = new Date('2024-12-06T13:00:00Z'); // Only 9 hours before

      const lastAssignment: GoOnCallAssignment = {
        id: 'oncall-prev',
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime: new Date('2024-12-05T22:00:00Z'),
        endTime: lastShiftEnd,
        status: 'completed',
        activations: [],
        createdAt: new Date(),
      };

      const mockService = createMockSchedulingService(
        { listOnCallAssignments: () => Effect.succeed([lastAssignment]) },
        strictRestPolicy
      );
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = hasAdequateRestPeriod('dir-001', proposedStartTime, strictRestPolicy).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.hasAdequateRest).toBe(false); // 9 hours is less than 12 required
      expect(result.hoursRest).toBe(9);
    });

    it('should allow shift with lenient rest period requirements (6 hours minimum)', async () => {
      // Arrange
      const lenientRestPolicy: OnCallPolicy = {
        ...DEFAULT_TEST_POLICY,
        minRestHoursAfterShift: 6, // 6 hours instead of 8
      };
      
      const proposedStartTime = new Date('2024-12-06T22:00:00Z');
      const lastShiftEnd = new Date('2024-12-06T13:00:00Z'); // 9 hours before

      const lastAssignment: GoOnCallAssignment = {
        id: 'oncall-prev',
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime: new Date('2024-12-05T22:00:00Z'),
        endTime: lastShiftEnd,
        status: 'completed',
        activations: [],
        createdAt: new Date(),
      };

      const mockService = createMockSchedulingService(
        { listOnCallAssignments: () => Effect.succeed([lastAssignment]) },
        lenientRestPolicy
      );
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const program = hasAdequateRestPeriod('dir-001', proposedStartTime, lenientRestPolicy).pipe(Effect.provide(layer));
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.hasAdequateRest).toBe(true); // 9 hours exceeds 6 hour minimum
      expect(result.hoursRest).toBe(9);
    });

    it('should enforce maximum shift duration limit (48 hours)', async () => {
      // Arrange
      const shortMaxPolicy: OnCallPolicy = {
        ...DEFAULT_TEST_POLICY,
        maxShiftDurationHours: 48, // 48 hours instead of 72
      };
      
      const now = new Date();
      const startTime = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 60 * 1000); // 60 hours

      const command: AssignOnCallDirectorCommand = {
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime,
        endTime,
        shiftType: 'weekend',
        funeralHomeId: 'home-001',
      };

      const mockService = createMockSchedulingService({}, shortMaxPolicy);
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignOnCallDirector(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow(
        'On-call shifts cannot exceed 48 hours'
      );
    });

    it('should reject assignments less than configured minimum shift duration', async () => {
      // Arrange
      const longMinPolicy: OnCallPolicy = {
        ...DEFAULT_TEST_POLICY,
        minShiftDurationHours: 16, // 16 hours instead of 12
      };
      
      const now = new Date();
      const startTime = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 14 * 60 * 60 * 1000); // Only 14 hours

      const command: AssignOnCallDirectorCommand = {
        employeeId: 'dir-001',
        employeeName: 'John Smith',
        startTime,
        endTime,
        shiftType: 'weeknight',
        funeralHomeId: 'home-001',
      };

      const mockService = createMockSchedulingService({}, longMinPolicy);
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignOnCallDirector(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow(
        'On-call shifts must be at least 16 hours'
      );
    });
  });
});

import { describe, it, expect } from 'vitest';
import { Effect, Layer } from 'effect';
import {
  assignEmbalmerShift,
  getEmbalmerWorkload,
  checkMultipleEmbalmerCapacity,
  type AssignEmbalmerShiftCommand,
} from '../assign-embalmer-shift';
import { ValidationError } from '@dykstra/domain';
import {
  GoSchedulingPort,
  type GoSchedulingPortService,
  type AssignShiftCommand,
  type GoShiftAssignment,
  NetworkError,
} from '../../../ports/go-scheduling-port';

/**
 * Mock Scheduling Service
 */
const createMockSchedulingService = (
  overrides: Partial<GoSchedulingPortService> = {}
): GoSchedulingPortService => {
  const defaultAssignShift = (command: AssignShiftCommand) =>
    Effect.succeed({
      id: `shift-${Math.random().toString(36).substr(2, 9)}`,
      shiftId: 'shift-123',
      templateId: command.templateId,
      employeeId: command.employeeId,
      employeeName: 'Test Embalmer',
      date: command.date,
      startTime: new Date(),
      endTime: new Date(),
      shiftType: 'regular' as const,
      status: 'scheduled' as const,
      notes: command.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const defaultListShiftAssignments = () => Effect.succeed([]);

  return {
    assignShift: overrides.assignShift || defaultAssignShift,
    listShiftAssignments: overrides.listShiftAssignments || defaultListShiftAssignments,
    // Stub out other methods (not used in these tests)
    createShiftTemplate: () => Effect.succeed({} as any),
    getShiftTemplate: () => Effect.succeed({} as any),
    listShiftTemplates: () => Effect.succeed([]),
    getShiftAssignment: () => Effect.succeed({} as any),
    completeShift: () => Effect.succeed(undefined),
    cancelShift: () => Effect.succeed(undefined),
    requestShiftSwap: () => Effect.succeed({} as any),
    reviewShiftSwap: () => Effect.succeed(undefined),
    getShiftSwap: () => Effect.succeed({} as any),
    listShiftSwaps: () => Effect.succeed([]),
    assignOnCall: () => Effect.succeed({} as any),
    activateOnCall: () => Effect.succeed({} as any),
    getOnCallAssignment: () => Effect.succeed({} as any),
    listOnCallAssignments: () => Effect.succeed([]),
    getStaffSchedule: () => Effect.succeed({} as any),
    getShiftCoverage: () => Effect.succeed([]),
    createRotatingSchedule: () => Effect.succeed({} as any),
    getRotatingSchedule: () => Effect.succeed({} as any),
    setShiftCoverageRule: () => Effect.succeed(undefined),
    getShiftCoverageRules: () => Effect.succeed([]),
  };
};

describe('Use Case: Assign Embalmer Shift', () => {
  describe('Happy Path - Preparation Assignment', () => {
    it('should assign first preparation to embalmer (3-hour prep)', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0); // 8am start
      const endTime = new Date(tomorrow);
      endTime.setHours(16, 0, 0, 0); // 4pm end (8-hour shift)

      const command: AssignEmbalmerShiftCommand = {
        employeeId: 'emb-001',
        employeeName: 'Sarah Embalmer',
        caseId: 'case-001',
        decedentName: 'John Smith',
        shiftDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        estimatedPrepHours: 3,
        notes: 'Standard preparation',
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        assignEmbalmerShift(command).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.caseId).toBe('case-001');
      expect(result.decedentName).toBe('John Smith');
      expect(result.estimatedPrepHours).toBe(3);
      expect(result.preparationsCount).toBe(1);
      expect(result.remainingCapacity).toBe(2); // Can do 2 more
      expect(result.status).toBe('scheduled');
    });

    it('should assign second preparation to same embalmer (2-hour prep)', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(16, 0, 0, 0);

      // Existing preparation from earlier
      const existingPrep: GoShiftAssignment = {
        id: 'shift-001',
        shiftId: 'shift-001',
        templateId: 'preparation-shift-template',
        employeeId: 'emb-001',
        employeeName: 'Sarah Embalmer',
        date: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        shiftType: 'regular',
        status: 'scheduled',
        notes: 'Preparation - Case case-001 - Decedent: John Smith - EstHours: 3',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockService = createMockSchedulingService({
        listShiftAssignments: () => Effect.succeed([existingPrep]),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      const command: AssignEmbalmerShiftCommand = {
        employeeId: 'emb-001',
        employeeName: 'Sarah Embalmer',
        caseId: 'case-002',
        decedentName: 'Jane Doe',
        shiftDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        estimatedPrepHours: 2,
      };

      // Act
      const result = await Effect.runPromise(
        assignEmbalmerShift(command).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.preparationsCount).toBe(2);
      expect(result.remainingCapacity).toBe(1); // Can do 1 more
    });

    it('should assign third (final) preparation to embalmer', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(16, 0, 0, 0);

      // Two existing preparations
      const existingPreps: GoShiftAssignment[] = [
        {
          id: 'shift-001',
          shiftId: 'shift-001',
          templateId: 'preparation-shift-template',
          employeeId: 'emb-001',
          employeeName: 'Sarah Embalmer',
          date: tomorrow,
          startTime: tomorrow,
          endTime: endTime,
          shiftType: 'regular',
          status: 'scheduled',
          notes: 'Preparation - Case case-001 - Decedent: John Smith - EstHours: 2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'shift-002',
          shiftId: 'shift-002',
          templateId: 'preparation-shift-template',
          employeeId: 'emb-001',
          employeeName: 'Sarah Embalmer',
          date: tomorrow,
          startTime: tomorrow,
          endTime: endTime,
          shiftType: 'regular',
          status: 'scheduled',
          notes: 'Preparation - Case case-002 - Decedent: Jane Doe - EstHours: 2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockService = createMockSchedulingService({
        listShiftAssignments: () => Effect.succeed(existingPreps),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      const command: AssignEmbalmerShiftCommand = {
        employeeId: 'emb-001',
        employeeName: 'Sarah Embalmer',
        caseId: 'case-003',
        decedentName: 'Bob Johnson',
        shiftDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        estimatedPrepHours: 2,
      };

      // Act
      const result = await Effect.runPromise(
        assignEmbalmerShift(command).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.preparationsCount).toBe(3);
      expect(result.remainingCapacity).toBe(0); // At capacity!
    });
  });

  describe('Validation Errors', () => {
    it('should reject assignment with empty employee ID', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(16, 0, 0, 0);

      const command: AssignEmbalmerShiftCommand = {
        employeeId: '',
        employeeName: 'Sarah Embalmer',
        caseId: 'case-001',
        decedentName: 'John Smith',
        shiftDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        estimatedPrepHours: 3,
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignEmbalmerShift(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Employee ID is required');
    });

    it('should reject assignment with empty case ID', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(16, 0, 0, 0);

      const command: AssignEmbalmerShiftCommand = {
        employeeId: 'emb-001',
        employeeName: 'Sarah Embalmer',
        caseId: '',
        decedentName: 'John Smith',
        shiftDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        estimatedPrepHours: 3,
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignEmbalmerShift(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow(
        'Case ID is required for preparation tracking'
      );
    });

    it('should reject assignment with empty decedent name', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(16, 0, 0, 0);

      const command: AssignEmbalmerShiftCommand = {
        employeeId: 'emb-001',
        employeeName: 'Sarah Embalmer',
        caseId: 'case-001',
        decedentName: '',
        shiftDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        estimatedPrepHours: 3,
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignEmbalmerShift(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Decedent name is required');
    });

    it('should reject shift scheduled in the past', async () => {
      // Arrange
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(8, 0, 0, 0);
      const endTime = new Date(yesterday);
      endTime.setHours(16, 0, 0, 0);

      const command: AssignEmbalmerShiftCommand = {
        employeeId: 'emb-001',
        employeeName: 'Sarah Embalmer',
        caseId: 'case-001',
        decedentName: 'John Smith',
        shiftDate: yesterday,
        startTime: yesterday,
        endTime: endTime,
        estimatedPrepHours: 3,
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignEmbalmerShift(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow(
        'Shift must be scheduled in the future'
      );
    });

    it('should reject shift exceeding 12-hour maximum', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(21, 0, 0, 0); // 13 hours later

      const command: AssignEmbalmerShiftCommand = {
        employeeId: 'emb-001',
        employeeName: 'Sarah Embalmer',
        caseId: 'case-001',
        decedentName: 'John Smith',
        shiftDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        estimatedPrepHours: 3,
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignEmbalmerShift(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow(
        'Shift duration exceeds maximum of 12 hours'
      );
    });

    it('should reject shift shorter than 4-hour minimum', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(11, 0, 0, 0); // Only 3 hours

      const command: AssignEmbalmerShiftCommand = {
        employeeId: 'emb-001',
        employeeName: 'Sarah Embalmer',
        caseId: 'case-001',
        decedentName: 'John Smith',
        shiftDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        estimatedPrepHours: 2,
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignEmbalmerShift(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Shift duration too short');
    });

    it('should reject preparation time less than 1 hour', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(16, 0, 0, 0);

      const command: AssignEmbalmerShiftCommand = {
        employeeId: 'emb-001',
        employeeName: 'Sarah Embalmer',
        caseId: 'case-001',
        decedentName: 'John Smith',
        shiftDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        estimatedPrepHours: 0.5, // Too short
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignEmbalmerShift(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Preparation time too short');
    });

    it('should reject preparation time exceeding 6 hours', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(16, 0, 0, 0);

      const command: AssignEmbalmerShiftCommand = {
        employeeId: 'emb-001',
        employeeName: 'Sarah Embalmer',
        caseId: 'case-001',
        decedentName: 'John Smith',
        shiftDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        estimatedPrepHours: 7, // Too long
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignEmbalmerShift(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Preparation time exceeds maximum');
    });

    it('should reject shift starting before 6am (too early)', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(5, 0, 0, 0); // 5am - too early
      const endTime = new Date(tomorrow);
      endTime.setHours(13, 0, 0, 0);

      const command: AssignEmbalmerShiftCommand = {
        employeeId: 'emb-001',
        employeeName: 'Sarah Embalmer',
        caseId: 'case-001',
        decedentName: 'John Smith',
        shiftDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        estimatedPrepHours: 3,
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignEmbalmerShift(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('during regular hours');
    });

    it('should reject shift ending after 8pm (too late)', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(22, 0, 0, 0); // 10pm - too late

      const command: AssignEmbalmerShiftCommand = {
        employeeId: 'emb-001',
        employeeName: 'Sarah Embalmer',
        caseId: 'case-001',
        decedentName: 'John Smith',
        shiftDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        estimatedPrepHours: 3,
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignEmbalmerShift(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('during regular hours');
    });
  });

  describe('Workload Capacity Limits', () => {
    it('should reject fourth preparation (exceeds max 3 per shift)', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(16, 0, 0, 0);

      // Three existing preparations (at maximum)
      const existingPreps: GoShiftAssignment[] = [
        {
          id: 'shift-001',
          shiftId: 'shift-001',
          templateId: 'preparation-shift-template',
          employeeId: 'emb-001',
          employeeName: 'Sarah Embalmer',
          date: tomorrow,
          startTime: tomorrow,
          endTime: endTime,
          shiftType: 'regular',
          status: 'scheduled',
          notes: 'Preparation - Case case-001 - Decedent: John Smith - EstHours: 2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'shift-002',
          shiftId: 'shift-002',
          templateId: 'preparation-shift-template',
          employeeId: 'emb-001',
          employeeName: 'Sarah Embalmer',
          date: tomorrow,
          startTime: tomorrow,
          endTime: endTime,
          shiftType: 'regular',
          status: 'scheduled',
          notes: 'Preparation - Case case-002 - Decedent: Jane Doe - EstHours: 2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'shift-003',
          shiftId: 'shift-003',
          templateId: 'preparation-shift-template',
          employeeId: 'emb-001',
          employeeName: 'Sarah Embalmer',
          date: tomorrow,
          startTime: tomorrow,
          endTime: endTime,
          shiftType: 'regular',
          status: 'scheduled',
          notes: 'Preparation - Case case-003 - Decedent: Bob Johnson - EstHours: 2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockService = createMockSchedulingService({
        listShiftAssignments: () => Effect.succeed(existingPreps),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      const command: AssignEmbalmerShiftCommand = {
        employeeId: 'emb-001',
        employeeName: 'Sarah Embalmer',
        caseId: 'case-004',
        decedentName: 'Alice Williams',
        shiftDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        estimatedPrepHours: 2,
      };

      // Act & Assert
      const program = assignEmbalmerShift(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow(
        'already has maximum 3 preparations'
      );
    });

    it('should reject preparation that exceeds shift time capacity', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(16, 0, 0, 0); // 8-hour shift

      // One existing 4-hour prep
      const existingPrep: GoShiftAssignment = {
        id: 'shift-001',
        shiftId: 'shift-001',
        templateId: 'preparation-shift-template',
        employeeId: 'emb-001',
        employeeName: 'Sarah Embalmer',
        date: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        shiftType: 'regular',
        status: 'scheduled',
        notes: 'Preparation - Case case-001 - Decedent: John Smith - EstHours: 4',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockService = createMockSchedulingService({
        listShiftAssignments: () => Effect.succeed([existingPrep]),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      const command: AssignEmbalmerShiftCommand = {
        employeeId: 'emb-001',
        employeeName: 'Sarah Embalmer',
        caseId: 'case-002',
        decedentName: 'Jane Doe',
        shiftDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        estimatedPrepHours: 4, // 4 + 4 + breaks = too much
      };

      // Act & Assert
      const program = assignEmbalmerShift(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Insufficient time in shift');
    });
  });

  describe('Get Embalmer Workload', () => {
    it('should return workload with zero preparations for unassigned embalmer', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockService = createMockSchedulingService({
        listShiftAssignments: () => Effect.succeed([]),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        getEmbalmerWorkload('emb-001', tomorrow).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.preparationsCount).toBe(0);
      expect(result.totalEstimatedHours).toBe(0);
      expect(result.assignments).toHaveLength(0);
    });

    it('should calculate total hours from multiple preparations', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(16, 0, 0, 0);

      const preparations: GoShiftAssignment[] = [
        {
          id: 'shift-001',
          shiftId: 'shift-001',
          templateId: 'preparation-shift-template',
          employeeId: 'emb-001',
          employeeName: 'Sarah Embalmer',
          date: tomorrow,
          startTime: tomorrow,
          endTime: endTime,
          shiftType: 'regular',
          status: 'scheduled',
          notes: 'Preparation - Case case-001 - Decedent: John Smith - EstHours: 2.5',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'shift-002',
          shiftId: 'shift-002',
          templateId: 'preparation-shift-template',
          employeeId: 'emb-001',
          employeeName: 'Sarah Embalmer',
          date: tomorrow,
          startTime: tomorrow,
          endTime: endTime,
          shiftType: 'regular',
          status: 'scheduled',
          notes: 'Preparation - Case case-002 - Decedent: Jane Doe - EstHours: 3.5',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockService = createMockSchedulingService({
        listShiftAssignments: () => Effect.succeed(preparations),
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        getEmbalmerWorkload('emb-001', tomorrow).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.preparationsCount).toBe(2);
      expect(result.totalEstimatedHours).toBe(6); // 2.5 + 3.5
    });
  });

  describe('Check Multiple Embalmer Capacity', () => {
    it('should identify embalmer with available capacity', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(16, 0, 0, 0);

      // Emb-001 has 2 preps, emb-002 has 0 preps
      const mockService = createMockSchedulingService({
        listShiftAssignments: (filters) => {
          if (filters?.employeeId === 'emb-001') {
            return Effect.succeed([
              {
                id: 'shift-001',
                shiftId: 'shift-001',
                templateId: 'preparation-shift-template',
                employeeId: 'emb-001',
                employeeName: 'Sarah Embalmer',
                date: tomorrow,
                startTime: tomorrow,
                endTime: endTime,
                shiftType: 'regular',
                status: 'scheduled',
                notes: 'Preparation - Case case-001 - Decedent: John Smith - EstHours: 2',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: 'shift-002',
                shiftId: 'shift-002',
                templateId: 'preparation-shift-template',
                employeeId: 'emb-001',
                employeeName: 'Sarah Embalmer',
                date: tomorrow,
                startTime: tomorrow,
                endTime: endTime,
                shiftType: 'regular',
                status: 'scheduled',
                notes: 'Preparation - Case case-002 - Decedent: Jane Doe - EstHours: 2',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]);
          }
          return Effect.succeed([]);
        },
      });
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        checkMultipleEmbalmerCapacity(['emb-001', 'emb-002'], tomorrow, 3, 8).pipe(
          Effect.provide(layer)
        )
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].employeeId).toBe('emb-001');
      expect(result[0].hasCapacity).toBe(true); // Can still fit 1 more
      expect(result[1].employeeId).toBe('emb-002');
      expect(result[1].hasCapacity).toBe(true); // Has no preps yet
    });
  });

  describe('Network Errors', () => {
    it('should handle network error from Go backend', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(16, 0, 0, 0);

      const mockService = createMockSchedulingService({
        listShiftAssignments: () => Effect.fail(new Error('Backend unavailable') as NetworkError),
      });

      const command: AssignEmbalmerShiftCommand = {
        employeeId: 'emb-001',
        employeeName: 'Sarah Embalmer',
        caseId: 'case-001',
        decedentName: 'John Smith',
        shiftDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        estimatedPrepHours: 3,
      };

      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignEmbalmerShift(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Backend unavailable');
    });
  });
});

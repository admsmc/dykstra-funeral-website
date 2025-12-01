import { describe, it, expect } from 'vitest';
import { Effect, Layer } from 'effect';
import {
  assignServiceCoverage,
  checkServiceCoverageAdequacy,
  type AssignServiceCoverageCommand,
  type ServiceType,
  type StaffRole,
} from '../assign-service-coverage';
import { ValidationError } from '@dykstra/domain';
import {
  GoSchedulingPort,
  type GoSchedulingPortService,
  type AssignShiftCommand,
  type GoShiftAssignment,
  type GoStaffSchedule,
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
      employeeName: 'Test Employee',
      date: command.date,
      startTime: new Date(),
      endTime: new Date(),
      shiftType: 'regular' as const,
      status: 'scheduled' as const,
      notes: command.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const defaultGetStaffSchedule = (employeeId: string, startDate: Date, endDate: Date) =>
    Effect.succeed({
      employeeId,
      employeeName: 'Test Employee',
      startDate,
      endDate,
      shifts: [],
      onCallDuties: [],
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      onCallHours: 0,
    });

  const defaultListShiftAssignments = () =>
    Effect.succeed([]);

  return {
    assignShift: overrides.assignShift || defaultAssignShift,
    getStaffSchedule: overrides.getStaffSchedule || defaultGetStaffSchedule,
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
    getShiftCoverage: () => Effect.succeed([]),
    createRotatingSchedule: () => Effect.succeed({} as any),
    getRotatingSchedule: () => Effect.succeed({} as any),
    setShiftCoverageRule: () => Effect.succeed(undefined),
    getShiftCoverageRules: () => Effect.succeed([]),
  };
};

describe('Use Case: Assign Service Coverage', () => {
  describe('Happy Path - All Service Types', () => {
    it('should assign staff for traditional funeral (1 director + 2 staff + 1 driver)', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(12, 0, 0, 0);

      const command: AssignServiceCoverageCommand = {
        caseId: 'case-001',
        serviceType: 'traditional_funeral',
        serviceDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        location: 'Main Chapel',
        staffAssignments: [
          { employeeId: 'dir-001', employeeName: 'John Director', role: 'director' },
          { employeeId: 'staff-001', employeeName: 'Jane Staff', role: 'staff' },
          { employeeId: 'staff-002', employeeName: 'Bob Staff', role: 'staff' },
          { employeeId: 'driver-001', employeeName: 'Mike Driver', role: 'driver' },
        ],
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        assignServiceCoverage(command).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.caseId).toBe('case-001');
      expect(result.serviceType).toBe('traditional_funeral');
      expect(result.isAdequatelyStaffed).toBe(true);
      expect(result.missingRoles).toEqual([]);
      expect(result.assignments).toHaveLength(4);
      expect(result.assignments.map(a => a.role)).toEqual(['director', 'staff', 'staff', 'driver']);
    });

    it('should assign staff for memorial service (1 director + 1 staff)', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(15, 30, 0, 0);

      const command: AssignServiceCoverageCommand = {
        caseId: 'case-002',
        serviceType: 'memorial_service',
        serviceDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        location: 'Memorial Room',
        staffAssignments: [
          { employeeId: 'dir-002', employeeName: 'Sarah Director', role: 'director' },
          { employeeId: 'staff-003', employeeName: 'Tom Staff', role: 'staff' },
        ],
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        assignServiceCoverage(command).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.serviceType).toBe('memorial_service');
      expect(result.isAdequatelyStaffed).toBe(true);
      expect(result.assignments).toHaveLength(2);
    });

    it('should assign staff for graveside service (1 director + 1 staff + 1 driver)', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(11, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(12, 0, 0, 0);

      const command: AssignServiceCoverageCommand = {
        caseId: 'case-003',
        serviceType: 'graveside',
        serviceDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        location: 'Oak Hill Cemetery',
        staffAssignments: [
          { employeeId: 'dir-003', employeeName: 'Mark Director', role: 'director' },
          { employeeId: 'staff-004', employeeName: 'Lisa Staff', role: 'staff' },
          { employeeId: 'driver-002', employeeName: 'Dave Driver', role: 'driver' },
        ],
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        assignServiceCoverage(command).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.serviceType).toBe('graveside');
      expect(result.isAdequatelyStaffed).toBe(true);
      expect(result.assignments).toHaveLength(3);
    });

    it('should assign staff for visitation (1 staff)', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(20, 0, 0, 0);

      const command: AssignServiceCoverageCommand = {
        caseId: 'case-004',
        serviceType: 'visitation',
        serviceDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        location: 'Visitation Room A',
        staffAssignments: [
          { employeeId: 'staff-005', employeeName: 'Emily Staff', role: 'staff' },
        ],
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        assignServiceCoverage(command).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.serviceType).toBe('visitation');
      expect(result.isAdequatelyStaffed).toBe(true);
      expect(result.assignments).toHaveLength(1);
    });
  });

  describe('Validation Errors', () => {
    it('should reject assignment with empty case ID', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endTime = new Date(tomorrow);
      endTime.setHours(tomorrow.getHours() + 2);

      const command: AssignServiceCoverageCommand = {
        caseId: '',
        serviceType: 'memorial_service',
        serviceDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        location: 'Chapel',
        staffAssignments: [
          { employeeId: 'dir-001', employeeName: 'John Director', role: 'director' },
        ],
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignServiceCoverage(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Case ID is required');
    });

    it('should reject assignment where end time is before start time', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startTime = new Date(tomorrow);
      startTime.setHours(14, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(12, 0, 0, 0); // Before start time

      const command: AssignServiceCoverageCommand = {
        caseId: 'case-001',
        serviceType: 'memorial_service',
        serviceDate: tomorrow,
        startTime: startTime,
        endTime: endTime,
        location: 'Chapel',
        staffAssignments: [
          { employeeId: 'dir-001', employeeName: 'John Director', role: 'director' },
          { employeeId: 'staff-001', employeeName: 'Jane Staff', role: 'staff' },
        ],
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignServiceCoverage(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Service end time must be after start time');
    });

    it('should reject assignment exceeding 8 hours duration', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(18, 0, 0, 0); // 9 hours later

      const command: AssignServiceCoverageCommand = {
        caseId: 'case-001',
        serviceType: 'traditional_funeral',
        serviceDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        location: 'Chapel',
        staffAssignments: [
          { employeeId: 'dir-001', employeeName: 'John Director', role: 'director' },
          { employeeId: 'staff-001', employeeName: 'Jane Staff', role: 'staff' },
          { employeeId: 'staff-002', employeeName: 'Bob Staff', role: 'staff' },
          { employeeId: 'driver-001', employeeName: 'Mike Driver', role: 'driver' },
        ],
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignServiceCoverage(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Service duration exceeds maximum of 8 hours');
    });

    it('should reject assignment scheduled in the past', async () => {
      // Arrange
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const endTime = new Date(yesterday);
      endTime.setHours(yesterday.getHours() + 2);

      const command: AssignServiceCoverageCommand = {
        caseId: 'case-001',
        serviceType: 'memorial_service',
        serviceDate: yesterday,
        startTime: yesterday,
        endTime: endTime,
        location: 'Chapel',
        staffAssignments: [
          { employeeId: 'dir-001', employeeName: 'John Director', role: 'director' },
          { employeeId: 'staff-001', employeeName: 'Jane Staff', role: 'staff' },
        ],
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignServiceCoverage(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Service must be scheduled in the future');
    });

    it('should reject assignment with no staff', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endTime = new Date(tomorrow);
      endTime.setHours(tomorrow.getHours() + 2);

      const command: AssignServiceCoverageCommand = {
        caseId: 'case-001',
        serviceType: 'memorial_service',
        serviceDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        location: 'Chapel',
        staffAssignments: [],
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignServiceCoverage(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('At least one staff member must be assigned');
    });

    it('should reject assignment with empty employee ID', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endTime = new Date(tomorrow);
      endTime.setHours(tomorrow.getHours() + 2);

      const command: AssignServiceCoverageCommand = {
        caseId: 'case-001',
        serviceType: 'memorial_service',
        serviceDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        location: 'Chapel',
        staffAssignments: [
          { employeeId: '', employeeName: 'John Director', role: 'director' },
        ],
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignServiceCoverage(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Employee ID is required for all staff assignments');
    });

    it('should reject assignment with empty employee name', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endTime = new Date(tomorrow);
      endTime.setHours(tomorrow.getHours() + 2);

      const command: AssignServiceCoverageCommand = {
        caseId: 'case-001',
        serviceType: 'memorial_service',
        serviceDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        location: 'Chapel',
        staffAssignments: [
          { employeeId: 'dir-001', employeeName: '', role: 'director' },
        ],
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignServiceCoverage(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Employee name is required for all staff assignments');
    });

    it('should reject traditional funeral missing director', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endTime = new Date(tomorrow);
      endTime.setHours(tomorrow.getHours() + 2);

      const command: AssignServiceCoverageCommand = {
        caseId: 'case-001',
        serviceType: 'traditional_funeral',
        serviceDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        location: 'Chapel',
        staffAssignments: [
          { employeeId: 'staff-001', employeeName: 'Jane Staff', role: 'staff' },
          { employeeId: 'staff-002', employeeName: 'Bob Staff', role: 'staff' },
          { employeeId: 'driver-001', employeeName: 'Mike Driver', role: 'driver' },
        ],
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignServiceCoverage(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Insufficient director staff: need 1, have 0');
    });

    it('should reject traditional funeral with insufficient staff (need 2, have 1)', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endTime = new Date(tomorrow);
      endTime.setHours(tomorrow.getHours() + 2);

      const command: AssignServiceCoverageCommand = {
        caseId: 'case-001',
        serviceType: 'traditional_funeral',
        serviceDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        location: 'Chapel',
        staffAssignments: [
          { employeeId: 'dir-001', employeeName: 'John Director', role: 'director' },
          { employeeId: 'staff-001', employeeName: 'Jane Staff', role: 'staff' },
          { employeeId: 'driver-001', employeeName: 'Mike Driver', role: 'driver' },
        ],
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignServiceCoverage(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Insufficient staff staff: need 2, have 1');
    });
  });

  describe('Conflict Detection', () => {
    it('should detect overlapping shift conflict', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(12, 0, 0, 0);

      // Staff member already has a shift at the same time
      const conflictingShift: GoShiftAssignment = {
        id: 'shift-123',
        shiftId: 'shift-123',
        templateId: 'template-001',
        employeeId: 'dir-001',
        employeeName: 'John Director',
        date: tomorrow,
        startTime: new Date(tomorrow.getTime()),
        endTime: new Date(endTime.getTime()),
        shiftType: 'regular',
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockService = createMockSchedulingService({
        getStaffSchedule: (employeeId: string, startDate: Date, endDate: Date) =>
          Effect.succeed({
            employeeId,
            employeeName: 'John Director',
            startDate,
            endDate,
            shifts: [conflictingShift],
            onCallDuties: [],
            totalHours: 2,
            regularHours: 2,
            overtimeHours: 0,
            onCallHours: 0,
          }),
      });

      const command: AssignServiceCoverageCommand = {
        caseId: 'case-001',
        serviceType: 'memorial_service',
        serviceDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        location: 'Chapel',
        staffAssignments: [
          { employeeId: 'dir-001', employeeName: 'John Director', role: 'director' },
          { employeeId: 'staff-001', employeeName: 'Jane Staff', role: 'staff' },
        ],
      };

      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignServiceCoverage(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('has a scheduling conflict');
    });

    it('should detect inadequate rest period (less than 8 hours)', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(12, 0, 0, 0);

      // Staff member worked until 6am, only 4 hours rest before 10am service
      const lastShift: GoShiftAssignment = {
        id: 'shift-last',
        shiftId: 'shift-last',
        templateId: 'template-001',
        employeeId: 'dir-001',
        employeeName: 'John Director',
        date: tomorrow,
        startTime: new Date(tomorrow.getTime() - 10 * 60 * 60 * 1000), // 10 hours ago
        endTime: new Date(tomorrow.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago (not enough rest)
        shiftType: 'night',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockService = createMockSchedulingService({
        getStaffSchedule: (employeeId: string, startDate: Date, endDate: Date) =>
          Effect.succeed({
            employeeId,
            employeeName: 'John Director',
            startDate,
            endDate,
            shifts: [lastShift],
            onCallDuties: [],
            totalHours: 10,
            regularHours: 10,
            overtimeHours: 0,
            onCallHours: 0,
          }),
      });

      const command: AssignServiceCoverageCommand = {
        caseId: 'case-001',
        serviceType: 'memorial_service',
        serviceDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        location: 'Chapel',
        staffAssignments: [
          { employeeId: 'dir-001', employeeName: 'John Director', role: 'director' },
          { employeeId: 'staff-001', employeeName: 'Jane Staff', role: 'staff' },
        ],
      };

      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignServiceCoverage(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('needs more rest');
    });
  });

  describe('Network Errors', () => {
    it('should handle network error from Go backend', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endTime = new Date(tomorrow);
      endTime.setHours(tomorrow.getHours() + 2);

      const mockService = createMockSchedulingService({
        assignShift: () =>
          Effect.fail(new Error('Backend unavailable') as NetworkError),
      });

      const command: AssignServiceCoverageCommand = {
        caseId: 'case-001',
        serviceType: 'memorial_service',
        serviceDate: tomorrow,
        startTime: tomorrow,
        endTime: endTime,
        location: 'Chapel',
        staffAssignments: [
          { employeeId: 'dir-001', employeeName: 'John Director', role: 'director' },
          { employeeId: 'staff-001', employeeName: 'Jane Staff', role: 'staff' },
        ],
      };

      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = assignServiceCoverage(command).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Backend unavailable');
    });
  });

  describe('Check Service Coverage Adequacy', () => {
    it('should return adequate when all roles are filled', async () => {
      // Arrange
      const serviceDate = new Date();
      serviceDate.setDate(serviceDate.getDate() + 1);

      const assignments: GoShiftAssignment[] = [
        {
          id: 'shift-1',
          shiftId: 'shift-1',
          templateId: 'template-001',
          employeeId: 'dir-001',
          employeeName: 'John Director',
          date: serviceDate,
          startTime: serviceDate,
          endTime: new Date(serviceDate.getTime() + 2 * 60 * 60 * 1000),
          shiftType: 'regular',
          status: 'scheduled',
          notes: 'traditional_funeral - Case case-001 - Role: director',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'shift-2',
          shiftId: 'shift-2',
          templateId: 'template-001',
          employeeId: 'staff-001',
          employeeName: 'Jane Staff',
          date: serviceDate,
          startTime: serviceDate,
          endTime: new Date(serviceDate.getTime() + 2 * 60 * 60 * 1000),
          shiftType: 'regular',
          status: 'scheduled',
          notes: 'traditional_funeral - Case case-001 - Role: staff',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'shift-3',
          shiftId: 'shift-3',
          templateId: 'template-001',
          employeeId: 'staff-002',
          employeeName: 'Bob Staff',
          date: serviceDate,
          startTime: serviceDate,
          endTime: new Date(serviceDate.getTime() + 2 * 60 * 60 * 1000),
          shiftType: 'regular',
          status: 'scheduled',
          notes: 'traditional_funeral - Case case-001 - Role: staff',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'shift-4',
          shiftId: 'shift-4',
          templateId: 'template-001',
          employeeId: 'driver-001',
          employeeName: 'Mike Driver',
          date: serviceDate,
          startTime: serviceDate,
          endTime: new Date(serviceDate.getTime() + 2 * 60 * 60 * 1000),
          shiftType: 'regular',
          status: 'scheduled',
          notes: 'traditional_funeral - Case case-001 - Role: driver',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockService = createMockSchedulingService({
        listShiftAssignments: () => Effect.succeed(assignments),
      });

      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        checkServiceCoverageAdequacy('case-001', 'traditional_funeral', serviceDate).pipe(
          Effect.provide(layer)
        )
      );

      // Assert
      expect(result.isAdequate).toBe(true);
      expect(result.missingRoles).toEqual([]);
      expect(result.assignedStaff).toHaveLength(4);
    });

    it('should return inadequate when missing director', async () => {
      // Arrange
      const serviceDate = new Date();
      serviceDate.setDate(serviceDate.getDate() + 1);

      const assignments: GoShiftAssignment[] = [
        {
          id: 'shift-2',
          shiftId: 'shift-2',
          templateId: 'template-001',
          employeeId: 'staff-001',
          employeeName: 'Jane Staff',
          date: serviceDate,
          startTime: serviceDate,
          endTime: new Date(serviceDate.getTime() + 2 * 60 * 60 * 1000),
          shiftType: 'regular',
          status: 'scheduled',
          notes: 'traditional_funeral - Case case-002 - Role: staff',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockService = createMockSchedulingService({
        listShiftAssignments: () => Effect.succeed(assignments),
      });

      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        checkServiceCoverageAdequacy('case-002', 'traditional_funeral', serviceDate).pipe(
          Effect.provide(layer)
        )
      );

      // Assert
      expect(result.isAdequate).toBe(false);
      expect(result.missingRoles).toContain('director');
    });
  });
});

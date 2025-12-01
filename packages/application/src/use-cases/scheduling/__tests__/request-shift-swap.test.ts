import { describe, it, expect } from 'vitest';
import { Effect, Layer } from 'effect';
import {
  requestShiftSwap,
  reviewShiftSwap,
  type RequestShiftSwapInput,
  type ReviewShiftSwapInput,
} from '../request-shift-swap';
import {
  GoSchedulingPort,
  type GoSchedulingPortService,
  type GoShiftAssignment,
  type GoShiftSwap,
  type GoStaffSchedule,
  NetworkError,
} from '../../../ports/go-scheduling-port';

/**
 * Mock Scheduling Service
 */
const createMockSchedulingService = (
  overrides: Partial<GoSchedulingPortService> = {}
): GoSchedulingPortService => {
  const defaultGetShiftAssignment = (id: string) =>
    Effect.succeed({
      id,
      shiftId: 'shift-123',
      templateId: 'template-123',
      employeeId: 'emp-001',
      employeeName: 'John Director',
      date: new Date('2024-12-10'),
      startTime: new Date('2024-12-10T08:00:00Z'),
      endTime: new Date('2024-12-10T16:00:00Z'),
      shiftType: 'regular' as const,
      status: 'scheduled' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const defaultListShiftSwaps = () => Effect.succeed([]);

  const defaultGetStaffSchedule = () =>
    Effect.succeed({
      employeeId: 'emp-002',
      employeeName: 'Jane Staff',
      startDate: new Date('2024-12-08'),
      endDate: new Date('2024-12-15'),
      shifts: [],
      onCallDuties: [],
      totalHours: 32,
      regularHours: 32,
      overtimeHours: 0,
      onCallHours: 0,
    });

  const defaultListShiftAssignments = () => Effect.succeed([]);

  const defaultRequestShiftSwap = (command: any) =>
    Effect.succeed({
      id: `swap-${Math.random().toString(36).substr(2, 9)}`,
      fromEmployeeId: command.fromEmployeeId,
      fromEmployeeName: 'John Director',
      toEmployeeId: command.toEmployeeId,
      toEmployeeName: 'Jane Staff',
      shiftId: command.shiftId,
      shiftDate: new Date('2024-12-10'),
      reason: command.reason,
      status: 'pending' as const,
      requestedAt: new Date(),
    });

  const defaultGetShiftSwap = (id: string) =>
    Effect.succeed({
      id,
      fromEmployeeId: 'emp-001',
      fromEmployeeName: 'John Director',
      toEmployeeId: 'emp-002',
      toEmployeeName: 'Jane Staff',
      shiftId: 'shift-123',
      shiftDate: new Date('2024-12-10'),
      status: 'pending' as const,
      requestedAt: new Date(),
    });

  const defaultReviewShiftSwap = () => Effect.succeed(undefined);

  return {
    getShiftAssignment: overrides.getShiftAssignment || defaultGetShiftAssignment,
    listShiftSwaps: overrides.listShiftSwaps || defaultListShiftSwaps,
    getStaffSchedule: overrides.getStaffSchedule || defaultGetStaffSchedule,
    listShiftAssignments: overrides.listShiftAssignments || defaultListShiftAssignments,
    requestShiftSwap: overrides.requestShiftSwap || defaultRequestShiftSwap,
    getShiftSwap: overrides.getShiftSwap || defaultGetShiftSwap,
    reviewShiftSwap: overrides.reviewShiftSwap || defaultReviewShiftSwap,
    // Stub out other methods
    createShiftTemplate: () => Effect.succeed({} as any),
    getShiftTemplate: () => Effect.succeed({} as any),
    listShiftTemplates: () => Effect.succeed([]),
    assignShift: () => Effect.succeed({} as any),
    completeShift: () => Effect.succeed(undefined),
    cancelShift: () => Effect.succeed(undefined),
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

describe('Use Case: Shift Swap with Manager Approval', () => {
  describe('Request Shift Swap - Happy Path', () => {
    it('should successfully request a shift swap with valid input', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5); // 5 days in future (> 48 hours)

      const input: RequestShiftSwapInput = {
        shiftId: 'shift-123',
        fromEmployeeId: 'emp-001',
        fromEmployeeName: 'John Director',
        fromEmployeeLicenseLevel: 'director',
        toEmployeeId: 'emp-002',
        toEmployeeName: 'Jane Staff',
        toEmployeeLicenseLevel: 'director',
        reason: 'Family emergency',
        currentTime: new Date(),
      };

      const mockService = createMockSchedulingService({
        getShiftAssignment: () =>
          Effect.succeed({
            id: 'shift-123',
            shiftId: 'shift-123',
            templateId: 'template-123',
            employeeId: 'emp-001',
            employeeName: 'John Director',
            date: futureDate,
            startTime: futureDate,
            endTime: new Date(futureDate.getTime() + 8 * 60 * 60 * 1000),
            shiftType: 'regular',
            status: 'scheduled',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
      });

      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        requestShiftSwap(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.swapId).toBeDefined();
      expect(result.status).toBe('pending');
      expect(result.fromEmployeeId).toBe('emp-001');
      expect(result.toEmployeeId).toBe('emp-002');
      expect(result.requiresApproval).toBe(true);
    });

    it('should allow swap from staff to director (higher license level)', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const input: RequestShiftSwapInput = {
        shiftId: 'shift-123',
        fromEmployeeId: 'emp-001',
        fromEmployeeName: 'Bob Staff',
        fromEmployeeLicenseLevel: 'staff',
        toEmployeeId: 'emp-002',
        toEmployeeName: 'Alice Director',
        toEmployeeLicenseLevel: 'director',
        currentTime: new Date(),
      };

      const mockService = createMockSchedulingService({
        getShiftAssignment: () =>
          Effect.succeed({
            id: 'shift-123',
            shiftId: 'shift-123',
            templateId: 'template-123',
            employeeId: 'emp-001',
            employeeName: 'Bob Staff',
            date: futureDate,
            startTime: futureDate,
            endTime: new Date(futureDate.getTime() + 8 * 60 * 60 * 1000),
            shiftType: 'regular',
            status: 'scheduled',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
      });

      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        requestShiftSwap(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.status).toBe('pending');
    });
  });

  describe('Request Shift Swap - Validation Errors', () => {
    it('should reject swap request with less than 48 hours notice', async () => {
      // Arrange
      const nearFuture = new Date();
      nearFuture.setHours(nearFuture.getHours() + 24); // Only 24 hours

      const input: RequestShiftSwapInput = {
        shiftId: 'shift-123',
        fromEmployeeId: 'emp-001',
        fromEmployeeName: 'John Director',
        fromEmployeeLicenseLevel: 'director',
        toEmployeeId: 'emp-002',
        toEmployeeName: 'Jane Staff',
        toEmployeeLicenseLevel: 'director',
        currentTime: new Date(),
      };

      const mockService = createMockSchedulingService({
        getShiftAssignment: () =>
          Effect.succeed({
            id: 'shift-123',
            shiftId: 'shift-123',
            templateId: 'template-123',
            employeeId: 'emp-001',
            employeeName: 'John Director',
            date: nearFuture,
            startTime: nearFuture,
            endTime: new Date(nearFuture.getTime() + 8 * 60 * 60 * 1000),
            shiftType: 'regular',
            status: 'scheduled',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
      });

      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = requestShiftSwap(input).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('48 hours in advance');
    });

    it('should reject swap when replacement has lower license level', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const input: RequestShiftSwapInput = {
        shiftId: 'shift-123',
        fromEmployeeId: 'emp-001',
        fromEmployeeName: 'Alice Director',
        fromEmployeeLicenseLevel: 'director',
        toEmployeeId: 'emp-002',
        toEmployeeName: 'Bob Staff',
        toEmployeeLicenseLevel: 'staff',
        currentTime: new Date(),
      };

      const mockService = createMockSchedulingService({
        getShiftAssignment: () =>
          Effect.succeed({
            id: 'shift-123',
            shiftId: 'shift-123',
            templateId: 'template-123',
            employeeId: 'emp-001',
            employeeName: 'Alice Director',
            date: futureDate,
            startTime: futureDate,
            endTime: new Date(futureDate.getTime() + 8 * 60 * 60 * 1000),
            shiftType: 'regular',
            status: 'scheduled',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
      });

      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = requestShiftSwap(input).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('license level');
    });

    it('should reject swap with self', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const input: RequestShiftSwapInput = {
        shiftId: 'shift-123',
        fromEmployeeId: 'emp-001',
        fromEmployeeName: 'John Director',
        fromEmployeeLicenseLevel: 'director',
        toEmployeeId: 'emp-001', // Same as fromEmployeeId
        toEmployeeName: 'John Director',
        toEmployeeLicenseLevel: 'director',
        currentTime: new Date(),
      };

      const mockService = createMockSchedulingService({
        getShiftAssignment: () =>
          Effect.succeed({
            id: 'shift-123',
            shiftId: 'shift-123',
            templateId: 'template-123',
            employeeId: 'emp-001',
            employeeName: 'John Director',
            date: futureDate,
            startTime: futureDate,
            endTime: new Date(futureDate.getTime() + 8 * 60 * 60 * 1000),
            shiftType: 'regular',
            status: 'scheduled',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
      });

      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = requestShiftSwap(input).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Cannot swap shift with yourself');
    });

    it('should reject swap when shift does not belong to requesting employee', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const input: RequestShiftSwapInput = {
        shiftId: 'shift-123',
        fromEmployeeId: 'emp-999', // Different from shift owner
        fromEmployeeName: 'Wrong Person',
        fromEmployeeLicenseLevel: 'director',
        toEmployeeId: 'emp-002',
        toEmployeeName: 'Jane Staff',
        toEmployeeLicenseLevel: 'director',
        currentTime: new Date(),
      };

      const mockService = createMockSchedulingService({
        getShiftAssignment: () =>
          Effect.succeed({
            id: 'shift-123',
            shiftId: 'shift-123',
            templateId: 'template-123',
            employeeId: 'emp-001', // Owned by emp-001, not emp-999
            employeeName: 'John Director',
            date: futureDate,
            startTime: futureDate,
            endTime: new Date(futureDate.getTime() + 8 * 60 * 60 * 1000),
            shiftType: 'regular',
            status: 'scheduled',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
      });

      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = requestShiftSwap(input).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow(
        'does not belong to requesting employee'
      );
    });

    it('should reject swap when employee has 2 pending swaps already', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const input: RequestShiftSwapInput = {
        shiftId: 'shift-123',
        fromEmployeeId: 'emp-001',
        fromEmployeeName: 'John Director',
        fromEmployeeLicenseLevel: 'director',
        toEmployeeId: 'emp-002',
        toEmployeeName: 'Jane Staff',
        toEmployeeLicenseLevel: 'director',
        currentTime: new Date(),
      };

      const mockService = createMockSchedulingService({
        getShiftAssignment: () =>
          Effect.succeed({
            id: 'shift-123',
            shiftId: 'shift-123',
            templateId: 'template-123',
            employeeId: 'emp-001',
            employeeName: 'John Director',
            date: futureDate,
            startTime: futureDate,
            endTime: new Date(futureDate.getTime() + 8 * 60 * 60 * 1000),
            shiftType: 'regular',
            status: 'scheduled',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        listShiftSwaps: () =>
          Effect.succeed([
            {
              id: 'swap-001',
              fromEmployeeId: 'emp-001',
              fromEmployeeName: 'John Director',
              toEmployeeId: 'emp-003',
              toEmployeeName: 'Other Staff',
              shiftId: 'shift-100',
              shiftDate: new Date(),
              status: 'pending',
              requestedAt: new Date(),
            },
            {
              id: 'swap-002',
              fromEmployeeId: 'emp-001',
              fromEmployeeName: 'John Director',
              toEmployeeId: 'emp-004',
              toEmployeeName: 'Another Staff',
              shiftId: 'shift-200',
              shiftDate: new Date(),
              status: 'pending',
              requestedAt: new Date(),
            },
          ]),
      });

      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = requestShiftSwap(input).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Maximum of 2 pending');
    });

    it('should reject swap that would create overtime violation', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const input: RequestShiftSwapInput = {
        shiftId: 'shift-123',
        fromEmployeeId: 'emp-001',
        fromEmployeeName: 'John Director',
        fromEmployeeLicenseLevel: 'director',
        toEmployeeId: 'emp-002',
        toEmployeeName: 'Jane Staff',
        toEmployeeLicenseLevel: 'director',
        currentTime: new Date(),
      };

      const mockService = createMockSchedulingService({
        getShiftAssignment: () =>
          Effect.succeed({
            id: 'shift-123',
            shiftId: 'shift-123',
            templateId: 'template-123',
            employeeId: 'emp-001',
            employeeName: 'John Director',
            date: futureDate,
            startTime: futureDate,
            endTime: new Date(futureDate.getTime() + 8 * 60 * 60 * 1000),
            shiftType: 'regular',
            status: 'scheduled',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        getStaffSchedule: () =>
          Effect.succeed({
            employeeId: 'emp-002',
            employeeName: 'Jane Staff',
            startDate: new Date(),
            endDate: new Date(),
            shifts: [],
            onCallDuties: [],
            totalHours: 55, // Already at 55 hours, adding 8 more = 63 > 60 limit
            regularHours: 55,
            overtimeHours: 0,
            onCallHours: 0,
          }),
      });

      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = requestShiftSwap(input).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('overtime violation');
    });

    it('should reject swap that violates 8-hour rest period', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      futureDate.setHours(8, 0, 0, 0);

      const input: RequestShiftSwapInput = {
        shiftId: 'shift-123',
        fromEmployeeId: 'emp-001',
        fromEmployeeName: 'John Director',
        fromEmployeeLicenseLevel: 'director',
        toEmployeeId: 'emp-002',
        toEmployeeName: 'Jane Staff',
        toEmployeeLicenseLevel: 'director',
        currentTime: new Date(),
      };

      // Employee has a shift ending at 6am, new shift starts at 8am (only 2 hours rest)
      const previousShift: GoShiftAssignment = {
        id: 'shift-999',
        shiftId: 'shift-999',
        templateId: 'template-123',
        employeeId: 'emp-002',
        employeeName: 'Jane Staff',
        date: new Date(futureDate.getTime() - 24 * 60 * 60 * 1000),
        startTime: new Date(futureDate.getTime() - 2 * 60 * 60 * 1000), // 6am (2 hours before)
        endTime: new Date(futureDate.getTime() - 2 * 60 * 60 * 1000),
        shiftType: 'night',
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockService = createMockSchedulingService({
        getShiftAssignment: () =>
          Effect.succeed({
            id: 'shift-123',
            shiftId: 'shift-123',
            templateId: 'template-123',
            employeeId: 'emp-001',
            employeeName: 'John Director',
            date: futureDate,
            startTime: futureDate,
            endTime: new Date(futureDate.getTime() + 8 * 60 * 60 * 1000),
            shiftType: 'regular',
            status: 'scheduled',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        listShiftAssignments: () => Effect.succeed([previousShift]),
      });

      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = requestShiftSwap(input).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('rest period');
    });
  });

  describe('Review Shift Swap - Happy Path', () => {
    it('should successfully approve a shift swap', async () => {
      // Arrange
      const input: ReviewShiftSwapInput = {
        swapId: 'swap-123',
        approved: true,
        reviewedBy: 'manager-001',
        reviewerRole: 'manager',
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        reviewShiftSwap(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.swapId).toBe('swap-123');
      expect(result.approved).toBe(true);
      expect(result.reviewedBy).toBe('manager-001');
      expect(result.message).toContain('approved');
    });

    it('should successfully reject a shift swap with reason', async () => {
      // Arrange
      const input: ReviewShiftSwapInput = {
        swapId: 'swap-123',
        approved: false,
        reviewedBy: 'manager-001',
        reviewerRole: 'manager',
        rejectionReason: 'Insufficient coverage for that date',
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act
      const result = await Effect.runPromise(
        reviewShiftSwap(input).pipe(Effect.provide(layer))
      );

      // Assert
      expect(result.approved).toBe(false);
      expect(result.message).toContain('rejected');
      expect(result.message).toContain('Insufficient coverage');
    });
  });

  describe('Review Shift Swap - Validation Errors', () => {
    it('should reject review from non-manager role', async () => {
      // Arrange
      const input: ReviewShiftSwapInput = {
        swapId: 'swap-123',
        approved: true,
        reviewedBy: 'emp-001',
        reviewerRole: 'staff', // Not a manager
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = reviewShiftSwap(input).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('manager, director, or admin');
    });

    it('should reject review of non-pending swap', async () => {
      // Arrange
      const input: ReviewShiftSwapInput = {
        swapId: 'swap-123',
        approved: true,
        reviewedBy: 'manager-001',
        reviewerRole: 'manager',
      };

      const mockService = createMockSchedulingService({
        getShiftSwap: () =>
          Effect.succeed({
            id: 'swap-123',
            fromEmployeeId: 'emp-001',
            fromEmployeeName: 'John Director',
            toEmployeeId: 'emp-002',
            toEmployeeName: 'Jane Staff',
            shiftId: 'shift-123',
            shiftDate: new Date(),
            status: 'approved', // Already approved
            requestedAt: new Date(),
          }),
      });

      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = reviewShiftSwap(input).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('not pending');
    });

    it('should require rejection reason when rejecting', async () => {
      // Arrange
      const input: ReviewShiftSwapInput = {
        swapId: 'swap-123',
        approved: false,
        reviewedBy: 'manager-001',
        reviewerRole: 'manager',
        // No rejectionReason provided
      };

      const mockService = createMockSchedulingService();
      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = reviewShiftSwap(input).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Rejection reason is required');
    });
  });

  describe('Network Errors', () => {
    it('should handle network error from Go backend', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const input: RequestShiftSwapInput = {
        shiftId: 'shift-123',
        fromEmployeeId: 'emp-001',
        fromEmployeeName: 'John Director',
        fromEmployeeLicenseLevel: 'director',
        toEmployeeId: 'emp-002',
        toEmployeeName: 'Jane Staff',
        toEmployeeLicenseLevel: 'director',
        currentTime: new Date(),
      };

      const mockService = createMockSchedulingService({
        getShiftAssignment: () => Effect.fail(new Error('Backend unavailable') as NetworkError),
      });

      const layer = Layer.succeed(GoSchedulingPort, mockService);

      // Act & Assert
      const program = requestShiftSwap(input).pipe(Effect.provide(layer));
      await expect(Effect.runPromise(program)).rejects.toThrow('Backend unavailable');
    });
  });
});

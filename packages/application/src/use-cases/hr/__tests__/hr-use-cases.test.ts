import { describe, it, expect, vi } from 'vitest';
import { Effect } from 'effect';
import { GoEmployeeOnboardingPort, type GoEmployeeOnboardingPortService, type GoEmployee, type GoOnboardingTask, NetworkError } from '../../../ports/go-employee-onboarding-port';
import { GoEmployeeTerminationPort, type GoEmployeeTerminationPortService, type GoExitChecklistItem } from '../../../ports/go-employee-termination-port';
import { startEmployeeOnboarding } from '../employee-onboarding';
import { processEmployeeOffboarding } from '../employee-offboarding';

/**
 * Integration tests for Phase 5: HR & Employee Management use cases
 * 
 * Tests cover:
 * 1. Employee Onboarding Workflow (4.1) - 2 tests
 * 2. Employee Offboarding Workflow (4.2) - 3 tests
 */

describe('Phase 5: HR & Employee Management Use Cases', () => {
  describe('Use Case 4.1: Employee Onboarding Workflow', () => {
    it('should create employee and generate onboarding checklist', async () => {
      const mockEmployee: GoEmployee = {
        id: 'emp-001',
        employeeNumber: 'EMP-2025-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@dykstra.com',
        hireDate: new Date('2025-01-15'),
        status: 'active',
        positionId: 'pos-001',
        positionTitle: 'Funeral Director',
        department: 'Service',
      };

      const mockOnboardingTasks: GoOnboardingTask[] = [
        { id: 'task-001', name: 'Complete I-9 Form', completed: false },
        { id: 'task-002', name: 'Complete W-4 Form', completed: true, completedAt: new Date('2025-01-16') },
        { id: 'task-003', name: 'Benefits Enrollment', completed: false },
        { id: 'task-004', name: 'Safety Training', completed: false },
        { id: 'task-005', name: 'System Access Setup', completed: true, completedAt: new Date('2025-01-16') },
      ];

      const mockOnboardingPort: GoEmployeeOnboardingPortService = {
        hireEmployee: vi.fn(() => Effect.succeed(mockEmployee)),
        getOnboardingTasks: vi.fn(() => Effect.succeed(mockOnboardingTasks)),
        completeOnboardingTask: vi.fn(() => Effect.void),
      };

      const result = await Effect.runPromise(
        startEmployeeOnboarding({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@dykstra.com',
          hireDate: new Date('2025-01-15'),
          positionId: 'pos-001',
          positionTitle: 'Funeral Director',
          department: 'Service',
        }).pipe(Effect.provideService(GoEmployeeOnboardingPort, mockOnboardingPort))
      );

      // Assertions
      expect(result.employeeId).toBe('emp-001');
      expect(result.employeeNumber).toBe('EMP-2025-001');
      expect(result.fullName).toBe('John Doe');
      expect(result.tasksTotal).toBe(5);
      expect(result.tasksCompleted).toBe(2);
      expect(result.tasksRemaining).toBe(3);
      expect(result.status).toBe('in_progress');
      expect(result.tasks).toHaveLength(5);

      // Verify port calls
      expect(mockOnboardingPort.hireEmployee).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@dykstra.com',
        hireDate: new Date('2025-01-15'),
        terminationDate: undefined,
        positionId: 'pos-001',
        positionTitle: 'Funeral Director',
        department: 'Service',
      });
      expect(mockOnboardingPort.getOnboardingTasks).toHaveBeenCalledWith('emp-001');
    });

    it('should mark onboarding as completed when all tasks are done', async () => {
      const mockEmployee: GoEmployee = {
        id: 'emp-002',
        employeeNumber: 'EMP-2025-002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@dykstra.com',
        hireDate: new Date('2025-01-10'),
        status: 'active',
        positionId: 'pos-002',
        positionTitle: 'Office Manager',
        department: 'Administration',
      };

      const mockCompletedTasks: GoOnboardingTask[] = [
        { id: 'task-001', name: 'Complete I-9 Form', completed: true, completedAt: new Date('2025-01-11') },
        { id: 'task-002', name: 'Complete W-4 Form', completed: true, completedAt: new Date('2025-01-11') },
        { id: 'task-003', name: 'Benefits Enrollment', completed: true, completedAt: new Date('2025-01-12') },
      ];

      const mockOnboardingPort: GoEmployeeOnboardingPortService = {
        hireEmployee: vi.fn(() => Effect.succeed(mockEmployee)),
        getOnboardingTasks: vi.fn(() => Effect.succeed(mockCompletedTasks)),
        completeOnboardingTask: vi.fn(() => Effect.void),
      };

      const result = await Effect.runPromise(
        startEmployeeOnboarding({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@dykstra.com',
          hireDate: new Date('2025-01-10'),
          positionId: 'pos-002',
          positionTitle: 'Office Manager',
          department: 'Administration',
        }).pipe(Effect.provideService(GoEmployeeOnboardingPort, mockOnboardingPort))
      );

      expect(result.tasksCompleted).toBe(3);
      expect(result.tasksRemaining).toBe(0);
      expect(result.status).toBe('completed');
    });
  });

  describe('Use Case 4.2: Employee Offboarding Workflow', () => {
    it('should process termination and generate exit checklist', async () => {
      const mockExitChecklist: GoExitChecklistItem[] = [
        { id: 'exit-001', name: 'Return company equipment', completed: false },
        { id: 'exit-002', name: 'Exit interview completed', completed: true },
        { id: 'exit-003', name: 'COBRA notice sent', completed: false },
        { id: 'exit-004', name: 'Final paycheck processed', completed: false },
      ];

      const mockTerminationPort: GoEmployeeTerminationPortService = {
        terminateEmployee: vi.fn(() => Effect.void),
        getExitChecklist: vi.fn(() => Effect.succeed(mockExitChecklist)),
        processFinalPaycheck: vi.fn(() => Effect.void),
      };

      const result = await Effect.runPromise(
        processEmployeeOffboarding({
          employeeId: 'emp-003',
          terminationDate: new Date('2025-01-31'),
          reason: 'Voluntary resignation',
          processFinalPay: false,
        }).pipe(Effect.provideService(GoEmployeeTerminationPort, mockTerminationPort))
      );

      // Assertions
      expect(result.employeeId).toBe('emp-003');
      expect(result.terminationDate).toEqual(new Date('2025-01-31'));
      expect(result.reason).toBe('Voluntary resignation');
      expect(result.tasksTotal).toBe(4);
      expect(result.tasksCompleted).toBe(1);
      expect(result.tasksRemaining).toBe(3);
      expect(result.finalPayProcessed).toBe(false);
      expect(result.status).toBe('in_progress');

      // Verify port calls
      expect(mockTerminationPort.terminateEmployee).toHaveBeenCalledWith(
        'emp-003',
        new Date('2025-01-31'),
        'Voluntary resignation'
      );
      expect(mockTerminationPort.getExitChecklist).toHaveBeenCalledWith('emp-003');
      expect(mockTerminationPort.processFinalPaycheck).not.toHaveBeenCalled();
    });

    it('should process final paycheck when all tasks are complete and flag is set', async () => {
      const mockCompletedExitChecklist: GoExitChecklistItem[] = [
        { id: 'exit-001', name: 'Return company equipment', completed: true },
        { id: 'exit-002', name: 'Exit interview completed', completed: true },
        { id: 'exit-003', name: 'COBRA notice sent', completed: true },
        { id: 'exit-004', name: 'Access revoked', completed: true },
      ];

      const mockTerminationPort: GoEmployeeTerminationPortService = {
        terminateEmployee: vi.fn(() => Effect.void),
        getExitChecklist: vi.fn(() => Effect.succeed(mockCompletedExitChecklist)),
        processFinalPaycheck: vi.fn(() => Effect.void),
      };

      const result = await Effect.runPromise(
        processEmployeeOffboarding({
          employeeId: 'emp-004',
          terminationDate: new Date('2025-01-31'),
          reason: 'Retirement',
          processFinalPay: true,
        }).pipe(Effect.provideService(GoEmployeeTerminationPort, mockTerminationPort))
      );

      expect(result.tasksCompleted).toBe(4);
      expect(result.tasksRemaining).toBe(0);
      expect(result.finalPayProcessed).toBe(true);
      expect(result.status).toBe('completed');
      expect(mockTerminationPort.processFinalPaycheck).toHaveBeenCalledWith('emp-004');
    });

    it('should not process final paycheck when tasks are incomplete even if flag is set', async () => {
      const mockIncompleteExitChecklist: GoExitChecklistItem[] = [
        { id: 'exit-001', name: 'Return company equipment', completed: false },
        { id: 'exit-002', name: 'Exit interview completed', completed: true },
      ];

      const mockTerminationPort: GoEmployeeTerminationPortService = {
        terminateEmployee: vi.fn(() => Effect.void),
        getExitChecklist: vi.fn(() => Effect.succeed(mockIncompleteExitChecklist)),
        processFinalPaycheck: vi.fn(() => Effect.void),
      };

      const result = await Effect.runPromise(
        processEmployeeOffboarding({
          employeeId: 'emp-005',
          terminationDate: new Date('2025-01-31'),
          reason: 'Layoff',
          processFinalPay: true, // Request to process, but tasks incomplete
        }).pipe(Effect.provideService(GoEmployeeTerminationPort, mockTerminationPort))
      );

      expect(result.tasksCompleted).toBe(1);
      expect(result.tasksRemaining).toBe(1);
      expect(result.finalPayProcessed).toBe(false);
      expect(result.status).toBe('in_progress');
      expect(mockTerminationPort.processFinalPaycheck).not.toHaveBeenCalled();
    });
  });
});

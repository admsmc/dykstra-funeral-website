/**
 * Integration Tests: AP Payment Run
 * 
 * Tests batch payment execution for approved vendor bills
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Effect } from 'effect';
import { executeAPPaymentRun } from '../ap-payment-run';
import { GoFinancialPort, type GoFinancialPortService } from '@dykstra/application';

describe('AP Payment Run Integration Tests', () => {
  const mockFinancialPort: GoFinancialPortService = {
    getVendorBill: vi.fn(),
    createAPPaymentRun: vi.fn(),
    approveAPPaymentRun: vi.fn(),
    executeAPPaymentRun: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should create, approve, and execute payment run', async () => {
      const mockBills = [
        { id: 'bill-1', billNumber: 'BILL-001', status: 'approved' as const, amountDue: 1000 },
        { id: 'bill-2', billNumber: 'BILL-002', status: 'approved' as const, amountDue: 2000 },
      ];

      vi.mocked(mockFinancialPort.getVendorBill)
        .mockReturnValueOnce(Effect.succeed(mockBills[0]))
        .mockReturnValueOnce(Effect.succeed(mockBills[1]));

      vi.mocked(mockFinancialPort.createAPPaymentRun).mockReturnValue(
        Effect.succeed({ id: 'run-001', runNumber: 'PR-001', status: 'draft' } as any)
      );

      vi.mocked(mockFinancialPort.approveAPPaymentRun).mockReturnValue(
        Effect.succeed({ id: 'run-001', runNumber: 'PR-001', status: 'approved' } as any)
      );

      vi.mocked(mockFinancialPort.executeAPPaymentRun).mockReturnValue(
        Effect.succeed({ glJournalId: 'je-001' } as any)
      );

      const program = executeAPPaymentRun({
        billIds: ['bill-1', 'bill-2'],
        runDate: new Date(),
        paymentMethod: 'ach',
        createdBy: 'user-1',
        tenant: 'tenant-1',
        autoApprove: true,
        autoExecute: true,
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provideService(GoFinancialPort, mockFinancialPort))
      );

      expect(result.executed).toBe(true);
      expect(result.totalAmount).toBe(3000);
      expect(result.glJournalId).toBe('je-001');
    });
  });

  describe('Validation', () => {
    it('should reject unapproved bills', async () => {
      vi.mocked(mockFinancialPort.getVendorBill).mockReturnValue(
        Effect.succeed({ id: 'bill-3', status: 'draft' as const, amountDue: 1000 } as any)
      );

      const program = executeAPPaymentRun({
        billIds: ['bill-3'],
        runDate: new Date(),
        paymentMethod: 'check',
        createdBy: 'user-1',
        tenant: 'tenant-1',
      });

      await expect(
        Effect.runPromise(program.pipe(Effect.provideService(GoFinancialPort, mockFinancialPort)))
      ).rejects.toThrow();
    });
  });
});

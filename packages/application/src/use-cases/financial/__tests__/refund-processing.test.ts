import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Effect } from 'effect';
import {
  processRefund,
  getRefundableAmount,
  type ProcessRefundCommand,
} from '../refund-processing';
import { GoFinancialPort, type GoFinancialPortService } from '../../../ports/go-financial-port';

describe('Refund Processing', () => {
  let mockFinancialPort: GoFinancialPortService;

  beforeEach(() => {
    mockFinancialPort = {
      getGLAccountByNumber: vi.fn(),
      createJournalEntry: vi.fn(),
      postJournalEntry: vi.fn(),
    } as unknown as GoFinancialPortService;
  });

  describe('processRefund', () => {
    it('should successfully process a full refund', async () => {
      // Arrange
      const command: ProcessRefundCommand = {
        paymentId: 'pmt-001',
        refundAmount: 5000,
        reason: 'overpayment',
        notes: 'Customer paid twice',
        processedBy: 'user-001',
        refundDate: new Date('2025-11-28'),
      };

      const mockARAccount = { id: 'acct-ar', accountNumber: '1200', name: 'Accounts Receivable' };
      const mockCashAccount = { id: 'acct-cash', accountNumber: '1000', name: 'Cash' };
      const mockJournalEntry = { id: 'je-001', entryNumber: 'JE-2025-001' };

      vi.mocked(mockFinancialPort.getGLAccountByNumber)
        .mockReturnValueOnce(Effect.succeed(mockARAccount as any))
        .mockReturnValueOnce(Effect.succeed(mockCashAccount as any));
      vi.mocked(mockFinancialPort.createJournalEntry).mockReturnValue(
        Effect.succeed(mockJournalEntry as any)
      );
      vi.mocked(mockFinancialPort.postJournalEntry).mockReturnValue(
        Effect.succeed(undefined as any)
      );

      // Act
      const program = processRefund(command);
      const result = await Effect.runPromise(
        Effect.provideService(program, GoFinancialPort, mockFinancialPort)
      );

      // Assert
      expect(result.refundPaymentId).toBeDefined();
      expect(result.originalPaymentId).toBe('pmt-001');
      expect(result.refundAmount).toBe(5000);
      expect(result.refundStatus).toBe('processed');
      expect(result.isFullRefund).toBe(true);
      expect(result.remainingRefundableAmount).toBe(0);
      expect(result.journalEntryId).toBe('je-001');

      // Verify GL entry creation
      expect(mockFinancialPort.createJournalEntry).toHaveBeenCalledWith({
        entryDate: new Date('2025-11-28'),
        description: 'Refund pmt-001 - overpayment',
        lines: [
          {
            accountId: 'acct-ar',
            debit: 5000,
            credit: 0,
            description: 'Refund - reverse AR credit',
          },
          {
            accountId: 'acct-cash',
            debit: 0,
            credit: 5000,
            description: 'Refund - reverse cash debit',
          },
        ],
      });

      expect(mockFinancialPort.postJournalEntry).toHaveBeenCalledWith('je-001');
    });


    it('should fail if refund amount is zero or negative', async () => {
      // Arrange
      const command: ProcessRefundCommand = {
        paymentId: 'pmt-002',
        refundAmount: 0, // Invalid amount
        reason: 'overpayment',
        processedBy: 'user-002',
      };

      // Act & Assert
      const program = processRefund(command);
      
      await expect(
        Effect.runPromise(
          Effect.provideService(program, GoFinancialPort, mockFinancialPort)
        )
      ).rejects.toThrow();
    });

    it('should use current date when refundDate not provided', async () => {
      // Arrange
      const command: ProcessRefundCommand = {
        paymentId: 'pmt-003',
        refundAmount: 5000,
        reason: 'cancellation',
        processedBy: 'user-003',
        // No refundDate provided
      };

      const mockARAccount = { id: 'acct-ar', accountNumber: '1200', name: 'Accounts Receivable' };
      const mockCashAccount = { id: 'acct-cash', accountNumber: '1000', name: 'Cash' };
      const mockJournalEntry = { id: 'je-003', entryNumber: 'JE-2025-003' };

      vi.mocked(mockFinancialPort.getGLAccountByNumber)
        .mockReturnValueOnce(Effect.succeed(mockARAccount as any))
        .mockReturnValueOnce(Effect.succeed(mockCashAccount as any));
      vi.mocked(mockFinancialPort.createJournalEntry).mockReturnValue(
        Effect.succeed(mockJournalEntry as any)
      );
      vi.mocked(mockFinancialPort.postJournalEntry).mockReturnValue(
        Effect.succeed(undefined as any)
      );

      // Act
      const program = processRefund(command);
      const result = await Effect.runPromise(
        Effect.provideService(program, GoFinancialPort, mockFinancialPort)
      );

      // Assert
      expect(result.processedAt).toBeInstanceOf(Date);
      expect(mockFinancialPort.createJournalEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          entryDate: expect.any(Date),
        })
      );
    });
  });

  describe('getRefundableAmount', () => {
    it('should return payment amount', async () => {
      // Arrange & Act
      const program = getRefundableAmount('pmt-004', 7500);
      const result = await Effect.runPromise(program);

      // Assert
      expect(result).toBe(7500);
    });
  });
});

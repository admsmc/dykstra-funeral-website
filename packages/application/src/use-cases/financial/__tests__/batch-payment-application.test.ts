import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Effect } from 'effect';
import {
  applyBatchPayment,
  GoFinancialPort,
  type ApplyBatchPaymentCommand,
} from '../batch-payment-application';
import type { GoFinancialPortService } from '@dykstra/application';

describe('Batch Payment Application', () => {
  let mockFinancialPort: GoFinancialPortService;

  beforeEach(() => {
    mockFinancialPort = {
      getPayment: vi.fn(),
      getInvoice: vi.fn(),
      recordPayment: vi.fn(),
      updatePaymentStatus: vi.fn(),
      listInvoices: vi.fn(),
    } as unknown as GoFinancialPortService;
  });

  describe('applyBatchPayment', () => {
    it('should successfully apply payment with manual allocations', async () => {
      // Arrange
      const command: ApplyBatchPaymentCommand = {
        paymentId: 'pmt-001',
        allocations: [
          { invoiceId: 'inv-001', amount: 3000 },
          { invoiceId: 'inv-002', amount: 2000 },
        ],
      };

      const mockPayment = {
        id: 'pmt-001',
        amount: 5000,
        customerId: 'cust-001',
        status: 'pending',
        paymentMethod: 'check',
      };

      const mockInvoice1 = {
        id: 'inv-001',
        amountDue: 4000,
        customerId: 'cust-001',
      };

      const mockInvoice2 = {
        id: 'inv-002',
        amountDue: 3000,
        customerId: 'cust-001',
      };

      vi.mocked(mockFinancialPort.getInvoice)
        .mockReturnValueOnce(Effect.succeed(mockInvoice1 as any))
        .mockReturnValueOnce(Effect.succeed(mockInvoice2 as any)) as any;
      vi.mocked(mockFinancialPort.recordPayment)
        .mockReturnValueOnce(Effect.succeed({} as any))
        .mockReturnValueOnce(Effect.succeed({} as any)) as any;

      // Act
      const program = applyBatchPayment(command);
      const result = await Effect.runPromise(
        Effect.provideService(program, GoFinancialPort, mockFinancialPort)
      );

      // Assert
      expect(result.paymentId).toBe('pmt-001');
      expect(result.totalAmount).toBe(5000);
      expect(result.allocations).toHaveLength(2);
      expect(result.allocations[0]).toEqual({
        invoiceId: 'inv-001',
        amountApplied: 3000,
        remainingBalance: 1000, // 4000 - 3000
      });
      expect(result.allocations[1]).toEqual({
        invoiceId: 'inv-002',
        amountApplied: 2000,
        remainingBalance: 1000, // 3000 - 2000
      });

      expect(mockFinancialPort.recordPayment).toHaveBeenCalledTimes(2);
    });


    it('should fail if payment has already been applied', async () => {
      // Arrange
      const command: ApplyBatchPaymentCommand = {
        paymentId: 'pmt-003',
        allocations: [{ invoiceId: 'inv-006', amount: 1000 }],
      };

      const mockPayment = {
        id: 'pmt-003',
        amount: 1000,
        customerId: 'cust-003',
        status: 'applied', // Already applied
        paymentMethod: 'credit_card',
      };

      vi.mocked(mockFinancialPort.getPayment).mockResolvedValue(mockPayment as any);

      // Act & Assert
      const program = applyBatchPayment(command);
      
      await expect(
        Effect.runPromise(
          Effect.provideService(program, GoFinancialPort, mockFinancialPort)
        )
      ).rejects.toThrow();
    });

    it('should fail if allocation total does not match payment amount', async () => {
      // Arrange
      const command: ApplyBatchPaymentCommand = {
        paymentId: 'pmt-004',
        allocations: [
          { invoiceId: 'inv-007', amount: 2000 },
          { invoiceId: 'inv-008', amount: 1500 },
        ], // Total: 3500, but payment is 5000
      };

      const mockPayment = {
        id: 'pmt-004',
        amount: 5000,
        customerId: 'cust-004',
        status: 'pending',
        paymentMethod: 'check',
      };

      vi.mocked(mockFinancialPort.getPayment).mockResolvedValue(mockPayment as any);

      // Act & Assert
      const program = applyBatchPayment(command);
      
      await expect(
        Effect.runPromise(
          Effect.provideService(program, GoFinancialPort, mockFinancialPort)
        )
      ).rejects.toThrow();
    });

    it('should fail if allocation exceeds invoice balance', async () => {
      // Arrange
      const command: ApplyBatchPaymentCommand = {
        paymentId: 'pmt-005',
        allocations: [{ invoiceId: 'inv-009', amount: 5000 }],
      };

      const mockPayment = {
        id: 'pmt-005',
        amount: 5000,
        customerId: 'cust-005',
        status: 'pending',
        paymentMethod: 'check',
      };

      const mockInvoice = {
        id: 'inv-009',
        amountDue: 3000, // Less than allocation
        customerId: 'cust-005',
      };

      vi.mocked(mockFinancialPort.getPayment).mockResolvedValue(mockPayment as any);
      vi.mocked(mockFinancialPort.getInvoice).mockResolvedValue(mockInvoice as any);

      // Act & Assert
      const program = applyBatchPayment(command);
      
      await expect(
        Effect.runPromise(
          Effect.provideService(program, GoFinancialPort, mockFinancialPort)
        )
      ).rejects.toThrow();
    });

    it('should fail if allocation amount is zero or negative', async () => {
      // Arrange
      const command: ApplyBatchPaymentCommand = {
        paymentId: 'pmt-006',
        allocations: [{ invoiceId: 'inv-010', amount: 0 }],
      };

      const mockPayment = {
        id: 'pmt-006',
        amount: 0,
        customerId: 'cust-006',
        status: 'pending',
        paymentMethod: 'check',
      };

      const mockInvoice = {
        id: 'inv-010',
        amountDue: 1000,
        customerId: 'cust-006',
      };

      vi.mocked(mockFinancialPort.getPayment).mockResolvedValue(mockPayment as any);
      vi.mocked(mockFinancialPort.getInvoice).mockResolvedValue(mockInvoice as any);

      // Act & Assert
      const program = applyBatchPayment(command);
      
      await expect(
        Effect.runPromise(
          Effect.provideService(program, GoFinancialPort, mockFinancialPort)
        )
      ).rejects.toThrow();
    });
  });

});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Effect } from 'effect';
import {
  submitInsuranceClaim,
  recordClaimPayment,
  type InsuranceClaimCommand,
  type RecordClaimPaymentCommand,
} from '../insurance-claim-processing';
import { GoFinancialPort, type GoFinancialPortService } from '../../../ports/go-financial-port';

describe('Insurance Claim Processing', () => {
  let mockFinancialPort: GoFinancialPortService;

  beforeEach(() => {
    mockFinancialPort = {
      getInvoice: vi.fn(),
    } as unknown as GoFinancialPortService;
  });

  describe('submitInsuranceClaim', () => {
    it('should successfully submit insurance claim when amount is valid', async () => {
      // Arrange
      const command: InsuranceClaimCommand = {
        caseId: 'case-001',
        invoiceId: 'inv-001',
        insuranceCompany: 'Blue Cross Blue Shield',
        claimAmount: 5000,
        claimDate: new Date('2025-11-25'),
        policyNumber: 'BCBS-123456',
        claimNumber: 'CLM-2025-001',
      };

      const mockInvoice = {
        id: 'inv-001',
        amountDue: 10000,
        invoiceNumber: 'INV-2025-001',
        caseId: 'case-001',
      };

      vi.mocked(mockFinancialPort.getInvoice).mockReturnValue(
        Effect.succeed(mockInvoice as any)
      );

      // Act
      const program = submitInsuranceClaim(command);
      const result = await Effect.runPromise(
        Effect.provideService(program, GoFinancialPort, mockFinancialPort)
      );

      // Assert
      expect(result.caseId).toBe('case-001');
      expect(result.invoiceId).toBe('inv-001');
      expect(result.insuranceCompany).toBe('Blue Cross Blue Shield');
      expect(result.claimAmount).toBe(5000);
      expect(result.status).toBe('submitted');
      expect(result.policyNumber).toBe('BCBS-123456');
      expect(result.claimNumber).toBe('CLM-2025-001');
      expect(result.claimId).toBeDefined();
      expect(mockFinancialPort.getInvoice).toHaveBeenCalledWith('inv-001');
    });

    it('should fail when claim amount exceeds invoice balance', async () => {
      // Arrange
      const command: InsuranceClaimCommand = {
        caseId: 'case-002',
        invoiceId: 'inv-002',
        insuranceCompany: 'Medicare',
        claimAmount: 15000, // Exceeds invoice balance
        claimDate: new Date('2025-11-25'),
        policyNumber: 'MED-987654',
      };

      const mockInvoice = {
        id: 'inv-002',
        amountDue: 10000, // Less than claim amount
        invoiceNumber: 'INV-2025-002',
        caseId: 'case-002',
      };

      vi.mocked(mockFinancialPort.getInvoice).mockReturnValue(
        Effect.succeed(mockInvoice as any)
      );

      // Act & Assert
      const program = submitInsuranceClaim(command);
      
      await expect(
        Effect.runPromise(
          Effect.provideService(program, GoFinancialPort, mockFinancialPort)
        )
      ).rejects.toThrow();
    });

    it('should handle invoice not found error', async () => {
      // Arrange
      const command: InsuranceClaimCommand = {
        caseId: 'case-003',
        invoiceId: 'inv-nonexistent',
        insuranceCompany: 'Aetna',
        claimAmount: 5000,
        claimDate: new Date('2025-11-25'),
        policyNumber: 'AETNA-111222',
      };

      vi.mocked(mockFinancialPort.getInvoice).mockReturnValue(
        Effect.fail({ _tag: 'NotFoundError', message: 'Invoice not found' } as any)
      );

      // Act & Assert
      const program = submitInsuranceClaim(command);
      
      await expect(
        Effect.runPromise(
          Effect.provideService(program, GoFinancialPort, mockFinancialPort)
        )
      ).rejects.toThrow();
    });

    it('should handle partial claim amount', async () => {
      // Arrange
      const command: InsuranceClaimCommand = {
        caseId: 'case-004',
        invoiceId: 'inv-004',
        insuranceCompany: 'United Healthcare',
        claimAmount: 2500, // Partial claim (half of invoice)
        claimDate: new Date('2025-11-25'),
        policyNumber: 'UHC-555666',
      };

      const mockInvoice = {
        id: 'inv-004',
        amountDue: 5000,
        invoiceNumber: 'INV-2025-004',
        caseId: 'case-004',
      };

      vi.mocked(mockFinancialPort.getInvoice).mockReturnValue(
        Effect.succeed(mockInvoice as any)
      );

      // Act
      const program = submitInsuranceClaim(command);
      const result = await Effect.runPromise(
        Effect.provideService(program, GoFinancialPort, mockFinancialPort)
      );

      // Assert
      expect(result.claimAmount).toBe(2500);
      expect(result.status).toBe('submitted');
    });

    it('should handle claim with no claim number', async () => {
      // Arrange
      const command: InsuranceClaimCommand = {
        caseId: 'case-005',
        invoiceId: 'inv-005',
        insuranceCompany: 'Humana',
        claimAmount: 3000,
        claimDate: new Date('2025-11-25'),
        policyNumber: 'HUM-777888',
        // No claimNumber provided
      };

      const mockInvoice = {
        id: 'inv-005',
        amountDue: 8000,
        invoiceNumber: 'INV-2025-005',
        caseId: 'case-005',
      };

      vi.mocked(mockFinancialPort.getInvoice).mockReturnValue(
        Effect.succeed(mockInvoice as any)
      );

      // Act
      const program = submitInsuranceClaim(command);
      const result = await Effect.runPromise(
        Effect.provideService(program, GoFinancialPort, mockFinancialPort)
      );

      // Assert
      expect(result.claimNumber).toBeUndefined();
      expect(result.status).toBe('submitted');
    });
  });

  describe('recordClaimPayment', () => {
    it('should successfully record claim payment', async () => {
      // Arrange
      const command: RecordClaimPaymentCommand = {
        claimId: 'claim-001',
        paymentAmount: 5000,
        paymentDate: new Date('2025-11-26'),
        checkNumber: 'CHK-123456',
      };

      // Act
      const program = recordClaimPayment(command);
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.claimId).toBe('claim-001');
      expect(result.paymentAmount).toBe(5000);
      expect(result.appliedToInvoice).toBe(true);
      expect(result.remainingBalance).toBe(0);
      expect(result.paymentId).toBeDefined();
    });

    it('should handle payment without check number', async () => {
      // Arrange
      const command: RecordClaimPaymentCommand = {
        claimId: 'claim-002',
        paymentAmount: 3000,
        paymentDate: new Date('2025-11-26'),
        // No checkNumber provided
      };

      // Act
      const program = recordClaimPayment(command);
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.claimId).toBe('claim-002');
      expect(result.paymentAmount).toBe(3000);
      expect(result.paymentId).toBeDefined();
    });

    it('should generate unique payment ID', async () => {
      // Arrange
      const command1: RecordClaimPaymentCommand = {
        claimId: 'claim-003',
        paymentAmount: 1000,
        paymentDate: new Date('2025-11-26'),
      };

      const command2: RecordClaimPaymentCommand = {
        claimId: 'claim-004',
        paymentAmount: 2000,
        paymentDate: new Date('2025-11-26'),
      };

      // Act
      const program1 = recordClaimPayment(command1);
      const program2 = recordClaimPayment(command2);
      
      const result1 = await Effect.runPromise(program1);
      const result2 = await Effect.runPromise(program2);

      // Assert
      expect(result1.paymentId).not.toBe(result2.paymentId);
    });
  });
});
